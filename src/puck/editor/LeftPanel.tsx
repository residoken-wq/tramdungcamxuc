'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Drawer, Puck, usePuck, type ComponentData } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { normalizeVi, filterBlockCategories } from './block-search'
import { getBlockIcon } from './block-icons'
import { TemplatesTab } from './TemplatesTab'
import { getChildSlotForParent } from '../child-slots'
import { useContextMenu } from './context-menu/context-menu-context'
import { prepareForPaste } from './context-menu/clipboard'
import {
  getInsertTarget,
  createTwoColumnContainerPattern,
  scrollToCanvasBlock,
} from './insert/insert-target'

import { SWITCH_TAB_EVENT, switchLeftPanelTab, type LeftPanelTab } from './left-panel-tab'

export { SWITCH_TAB_EVENT, switchLeftPanelTab, type LeftPanelTab }

const LOCAL_STORAGE_KEY = 'eb03:left-panel'

type LeftPanelState = {
  activeTab: LeftPanelTab
  collapsedCategories: string[]
}

export function loadLeftPanelStorage(): LeftPanelState {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        return {
          activeTab:
            parsed.activeTab === 'outline' || parsed.activeTab === 'templates'
              ? parsed.activeTab
              : 'blocks',
          collapsedCategories: Array.isArray(parsed.collapsedCategories)
            ? parsed.collapsedCategories
            : [],
        }
      }
    }
  } catch {
    // Private window or disabled localStorage: fail silently
  }
  return { activeTab: 'blocks', collapsedCategories: [] }
}

export function saveLeftPanelStorage(state: LeftPanelState) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
    }
  } catch {
    // Fail silently
  }
}

export function LeftPanel() {
  const { config, getPermissions, dispatch, appState, selectedItem, getItemById } = usePuck()
  const { showToast } = useContextMenu()

  const [activeTab, setActiveTab] = useState<LeftPanelTab>(() => loadLeftPanelStorage().activeTab)
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>(
    () => loadLeftPanelStorage().collapsedCategories,
  )
  const [searchQuery, setSearchQuery] = useState<string>('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pointerPosRef = useRef<{ x: number; y: number; time: number } | null>(null)

  // PK-14: detect if currently selected item is a single-child parent block
  const selectedItemType = selectedItem?.type
  const childSlot = useMemo(() => {
    if (!config || !selectedItemType) return undefined
    return getChildSlotForParent(config, selectedItemType)
  }, [config, selectedItemType])
  const targetChildType = childSlot?.childType

  // Auto-scroll the target child block into view when a parent block is selected
  useEffect(() => {
    if (!targetChildType) return
    const timer = setTimeout(() => {
      if (typeof document !== 'undefined') {
        const el = document.querySelector(`[data-block-drawer-item="${targetChildType}"]`)
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [targetChildType])

  // Listen for tab switch events from EditorToolbar
  useEffect(() => {
    const handleSwitch = (e: Event) => {
      const customEvent = e as CustomEvent<LeftPanelTab>
      if (
        customEvent.detail === 'blocks' ||
        customEvent.detail === 'outline' ||
        customEvent.detail === 'templates'
      ) {
        setActiveTab(customEvent.detail)
        // Ensure sidebar is visible
        if (appState?.ui && !appState.ui.leftSideBarVisible) {
          dispatch({
            type: 'setUi',
            ui: { leftSideBarVisible: true },
          })
        }
      }
    }

    window.addEventListener(SWITCH_TAB_EVENT, handleSwitch)
    return () => window.removeEventListener(SWITCH_TAB_EVENT, handleSwitch)
  }, [appState?.ui, dispatch])

  // Sync state changes to localStorage
  useEffect(() => {
    saveLeftPanelStorage({ activeTab, collapsedCategories })
  }, [activeTab, collapsedCategories])

  // Toggle category collapse
  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }, [])

  // Lookup localized block label
  const getBlockLabel = useCallback(
    (componentKey: string) => {
      const compConfig = config?.components?.[componentKey] as { label?: string } | undefined
      return compConfig?.label || componentKey
    },
    [config],
  )

  // Filter categories based on search query (excluding components from hidden categories like freeSection)
  const allComponentKeys = useMemo(() => {
    if (!config?.components) return []
    const hiddenComponents = new Set<string>()
    if (config?.categories) {
      for (const cat of Object.values(config.categories)) {
        if (cat.visible === false && Array.isArray(cat.components)) {
          cat.components.forEach((c) => hiddenComponents.add(c as string))
        }
      }
    }
    return Object.keys(config.components).filter((k) => !hiddenComponents.has(k))
  }, [config])

  const filteredCategories = useMemo(() => {
    const categories = config?.categories || {}
    return filterBlockCategories(categories, getBlockLabel, searchQuery, allComponentKeys)
  }, [config, getBlockLabel, searchQuery, allComponentKeys])

  const isSearching = normalizeVi(searchQuery).length > 0

  const matchesTwoColumnPattern = useMemo(() => {
    if (!isSearching) return true
    const norm = normalizeVi(searchQuery)
    return (
      normalizeVi(vi.eb13b.twoColumnsPattern.title).includes(norm) ||
      'khung 2 cot hai cot anh chu layout bo cuc'.includes(norm)
    )
  }, [isSearching, searchQuery])

  // EB-13b item 1: Click to insert handler
  const handleInsertBlock = useCallback(
    (blockInput: string | ComponentData) => {
      const isPattern = typeof blockInput !== 'string'
      const blockType = isPattern ? blockInput.type : blockInput

      const target = getInsertTarget({
        blockType,
        data: appState.data,
        config,
        itemSelector: appState.ui.itemSelector,
        selectedItem,
        getItemById,
      })

      if (!target.allowed) {
        showToast(vi.eb13b.toast.cannotInsertDisallowed)
        return
      }

      if (isPattern) {
        const validation = prepareForPaste(
          blockInput,
          config,
          target.destinationZone,
          target.parentType,
        )
        if (!validation.success) {
          showToast(vi.eb13b.toast.cannotInsertDisallowed)
          return
        }
        const newItem = validation.item
        dispatch({
          type: 'insert',
          componentType: newItem.type,
          destinationIndex: target.destinationIndex,
          destinationZone: target.destinationZone,
          id: String(newItem.props.id),
        })
        dispatch({
          type: 'replace',
          destinationIndex: target.destinationIndex,
          destinationZone: target.destinationZone,
          data: newItem,
        })
        dispatch({
          type: 'setUi',
          ui: {
            itemSelector: { index: target.destinationIndex, zone: target.destinationZone },
          },
        })
        scrollToCanvasBlock(String(newItem.props.id))
        showToast(vi.eb13b.toast.inserted)
      } else {
        const newId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${blockType}-${Date.now()}`

        dispatch({
          type: 'insert',
          componentType: blockType,
          destinationIndex: target.destinationIndex,
          destinationZone: target.destinationZone,
          id: newId,
        })
        dispatch({
          type: 'setUi',
          ui: {
            itemSelector: { index: target.destinationIndex, zone: target.destinationZone },
          },
        })
        scrollToCanvasBlock(newId)
        showToast(vi.eb13b.toast.inserted)
      }
    },
    [
      appState.data,
      appState.ui.itemSelector,
      selectedItem,
      config,
      getItemById,
      dispatch,
      showToast,
    ],
  )

  return (
    <aside
      aria-label={vi.eb03.panelLabel}
      className="flex flex-col h-full w-full bg-warm-ivory border-r border-deep-navy/10 select-none text-deep-navy overflow-hidden"
    >
      {/* 1. Header with 2 Tabs: Khối & Cấu trúc */}
      <div
        role="tablist"
        aria-label={vi.eb03.tablistLabel}
        className="flex items-center border-b border-deep-navy/10 bg-white/70 backdrop-blur-sm shrink-0 px-2 pt-2"
      >
        <button
          type="button"
          role="tab"
          id="tab-blocks"
          data-tab="blocks"
          aria-selected={activeTab === 'blocks'}
          aria-controls="panel-blocks"
          tabIndex={0}
          onClick={() => setActiveTab('blocks')}
          className={`flex-1 py-2 text-xs font-ui font-bold text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'blocks'
              ? 'border-bright-magenta text-deep-navy bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-t-lg'
              : 'border-transparent text-deep-navy/60 hover:text-deep-navy hover:bg-soft-pink/30 rounded-t-lg'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
          </svg>
          <span>{vi.eb03.tabBlocks}</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-outline"
          data-tab="outline"
          aria-selected={activeTab === 'outline'}
          aria-controls="panel-outline"
          tabIndex={0}
          onClick={() => setActiveTab('outline')}
          className={`flex-1 py-2 text-xs font-ui font-bold text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'outline'
              ? 'border-bright-magenta text-deep-navy bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-t-lg'
              : 'border-transparent text-deep-navy/60 hover:text-deep-navy hover:bg-soft-pink/30 rounded-t-lg'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span>{vi.eb03.tabOutline}</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-templates"
          data-tab="templates"
          aria-selected={activeTab === 'templates'}
          aria-controls="panel-templates"
          tabIndex={0}
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 text-xs font-ui font-bold text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'templates'
              ? 'border-bright-magenta text-deep-navy bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-t-lg'
              : 'border-transparent text-deep-navy/60 hover:text-deep-navy hover:bg-soft-pink/30 rounded-t-lg'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <span>{vi.eb08.tabTemplates}</span>
        </button>
      </div>

      {/* 2. Tab Contents */}
      {activeTab === 'blocks' ? (
        <div
          role="tabpanel"
          id="panel-blocks"
          aria-labelledby="tab-blocks"
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          {/* Search Box */}
          <div className="p-3 bg-white/50 border-b border-deep-navy/5 shrink-0">
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-deep-navy/60 pointer-events-none">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <line
                    x1="21"
                    y1="21"
                    x2="16.65"
                    y2="16.65"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={vi.eb03.searchPlaceholder}
                className="w-full pl-8 pr-8 py-1.5 text-xs font-ui bg-white rounded-lg border border-deep-navy/15 text-deep-navy placeholder:text-deep-navy/60 focus:outline-none focus:border-bright-magenta focus:ring-1 focus:ring-bright-magenta transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    searchInputRef.current?.focus()
                  }}
                  aria-label={vi.eb03.clearSearch}
                  className="absolute right-2 text-deep-navy/60 hover:text-deep-navy p-0.5 rounded cursor-pointer transition"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Categories & Blocks List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-10 h-10 mx-auto mb-2 text-deep-navy/60 flex items-center justify-center">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" strokeWidth="1.5" />
                    <line
                      x1="21"
                      y1="21"
                      x2="16.65"
                      y2="16.65"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className="font-ui font-bold text-xs text-deep-navy">{vi.eb03.noBlocksFound}</p>
                <p className="text-[11px] text-deep-navy/60 mt-1 max-w-[200px] mx-auto">
                  {vi.eb03.clearSearchPrompt}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 inline-flex items-center px-3 py-1 text-xs font-ui font-semibold text-bright-magenta hover:text-deep-navy hover:underline cursor-pointer"
                >
                  {vi.eb03.clearSearch}
                </button>
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isAutoExpanded = Boolean(
                  targetChildType && category.components.includes(targetChildType),
                )
                const isCollapsed =
                  !isSearching && !isAutoExpanded && collapsedCategories.includes(category.id)
                const categoryContentId = `cat-content-${category.id}`

                return (
                  <div key={category.id} className="space-y-2">
                    {/* Category Title Header */}
                    <button
                      type="button"
                      aria-expanded={!isCollapsed}
                      aria-controls={categoryContentId}
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between py-1 px-1 text-left text-xs font-ui font-bold text-deep-navy hover:text-bright-magenta transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{category.title}</span>
                        <span className="text-[10px] text-deep-navy/60 font-normal">
                          ({category.components.length})
                        </span>
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-deep-navy/60 group-hover:text-bright-magenta transition-transform ${
                          isCollapsed ? '-rotate-90' : 'rotate-0'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* 2-Column Grid of Blocks */}
                    {!isCollapsed && (
                      <div id={categoryContentId} className="pt-1">
                        <Drawer>
                          <div className="grid grid-cols-2 gap-2">
                            {/* EB-13b item 4: Mẫu sẵn "Khung 2 cột (ảnh + chữ)" ở đầu nhóm Bố cục */}
                            {category.id === 'layout' && matchesTwoColumnPattern && (
                              <Drawer.Item
                                key="pattern-two-columns"
                                name="Container"
                                label={vi.eb13b.twoColumnsPattern.title}
                                isDragDisabled={false}
                              >
                                {() => (
                                  <div
                                    data-block-drawer-item="pattern-two-columns"
                                    data-testid="pattern-two-columns"
                                    onPointerDown={(e) => {
                                      pointerPosRef.current = {
                                        x: e.clientX,
                                        y: e.clientY,
                                        time: Date.now(),
                                      }
                                    }}
                                    onClick={(e) => {
                                      if (pointerPosRef.current) {
                                        const dx = Math.abs(e.clientX - pointerPosRef.current.x)
                                        const dy = Math.abs(e.clientY - pointerPosRef.current.y)
                                        const dt = Date.now() - pointerPosRef.current.time
                                        if (dx > 5 || dy > 5 || dt > 1000) return
                                      }
                                      handleInsertBlock(createTwoColumnContainerPattern())
                                    }}
                                    className="group flex flex-col items-center justify-center p-2 rounded-xl text-center select-none cursor-grab active:cursor-grabbing border transition h-[88px] min-h-[88px] bg-white text-deep-navy border-deep-navy/10 hover:border-bright-magenta hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta"
                                    title={vi.eb13b.twoColumnsPattern.description}
                                  >
                                    <div className="w-6 h-6 mb-1 text-deep-navy group-hover:text-bright-magenta transition-colors flex items-center justify-center">
                                      <svg
                                        className="w-5 h-5 shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                        aria-hidden="true"
                                      >
                                        <rect
                                          x="3"
                                          y="4"
                                          width="8"
                                          height="16"
                                          rx="2"
                                          strokeDasharray="2 2"
                                        />
                                        <rect x="13" y="4" width="8" height="16" rx="2" />
                                        <path d="M5 8h4M5 12h4" strokeLinecap="round" />
                                        <rect x="15" y="8" width="4" height="4" rx="1" />
                                      </svg>
                                    </div>
                                    <span className="text-[11px] font-ui font-semibold line-clamp-2 leading-tight text-deep-navy/90 group-hover:text-deep-navy">
                                      {vi.eb13b.twoColumnsPattern.title}
                                    </span>
                                  </div>
                                )}
                              </Drawer.Item>
                            )}

                            {category.components.map((compKey) => {
                              const label = getBlockLabel(compKey)
                              const canInsert = getPermissions
                                ? getPermissions({ type: compKey }).insert !== false
                                : true
                              const isHighlighted = compKey === targetChildType

                              return (
                                <Drawer.Item
                                  key={compKey}
                                  name={compKey}
                                  label={label}
                                  isDragDisabled={!canInsert}
                                >
                                  {({ name }) => (
                                    // Drawer.Item already renders the focusable, draggable button
                                    // (role, tabindex, aria): this is only its content.
                                    <div
                                      data-block-drawer-item={compKey}
                                      data-highlighted={isHighlighted ? 'true' : undefined}
                                      onPointerDown={(e) => {
                                        pointerPosRef.current = {
                                          x: e.clientX,
                                          y: e.clientY,
                                          time: Date.now(),
                                        }
                                      }}
                                      onClick={(e) => {
                                        if (pointerPosRef.current) {
                                          const dx = Math.abs(e.clientX - pointerPosRef.current.x)
                                          const dy = Math.abs(e.clientY - pointerPosRef.current.y)
                                          const dt = Date.now() - pointerPosRef.current.time
                                          if (dx > 5 || dy > 5 || dt > 1000) return
                                        }
                                        if (canInsert) {
                                          handleInsertBlock(compKey)
                                        }
                                      }}
                                      className={`group flex flex-col items-center justify-center p-2 rounded-xl text-center select-none cursor-grab active:cursor-grabbing border transition h-[88px] min-h-[88px] ${
                                        canInsert
                                          ? isHighlighted
                                            ? 'bg-soft-pink/40 text-deep-navy border-bright-magenta ring-2 ring-bright-magenta shadow-md'
                                            : 'bg-white text-deep-navy border-deep-navy/10 hover:border-bright-magenta hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta'
                                          : 'bg-warm-ivory/60 text-deep-navy/60 border-deep-navy/5 cursor-not-allowed opacity-60'
                                      }`}
                                      title={canInsert ? label : vi.eb03.lockedBlock}
                                    >
                                      <div className="w-6 h-6 mb-1 text-deep-navy group-hover:text-bright-magenta transition-colors flex items-center justify-center">
                                        {getBlockIcon(name)}
                                      </div>
                                      <span className="text-[11px] font-ui font-semibold line-clamp-2 leading-tight text-deep-navy/90 group-hover:text-deep-navy">
                                        {label}
                                      </span>
                                    </div>
                                  )}
                                </Drawer.Item>
                              )
                            })}
                          </div>
                        </Drawer>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : activeTab === 'outline' ? (
        /* Outline Panel */
        <div
          role="tabpanel"
          id="panel-outline"
          aria-labelledby="tab-outline"
          className="flex-1 min-h-0 overflow-y-auto p-3"
        >
          <Puck.Outline />
        </div>
      ) : (
        /* Templates Panel */
        <TemplatesTab />
      )}
    </aside>
  )
}
