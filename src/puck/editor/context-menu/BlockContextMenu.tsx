'use client'

import React, { useEffect, useRef, useState, useLayoutEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { usePuck, type ComponentData } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { useContextMenu } from './context-menu-context'
import { copyBlock, readClipboard, prepareForPaste } from './clipboard'
import { hasStyleKeys } from '@/puck/style/style-schema'
import { switchLeftPanelTab } from '@/puck/editor/LeftPanel'
import { SaveTemplateModal } from '@/puck/editor/SaveTemplateModal'

export type MenuItemId =
  | 'rename'
  | 'duplicate'
  | 'copy'
  | 'paste'
  | 'pasteStyle'
  | 'resetStyle'
  | 'saveTemplate'
  | 'delete'

export type MenuItemDef = {
  id: MenuItemId
  label: string
  icon: React.ReactNode
  danger?: boolean
  disabled: boolean
  tooltip?: string
  action: () => void
}

export function BlockContextMenu() {
  const { menuState, closeMenu, setRenamingId, showToast } = useContextMenu()
  const { config, dispatch, getPermissions, getItemById, getSelectorForId, getParentById } =
    usePuck()

  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 })
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const [templateModalItem, setTemplateModalItem] = useState<ComponentData | null>(null)

  const componentId = menuState.componentId
  let item: ComponentData | null | undefined = null
  let selector: { zone: string; index: number } | null | undefined = null
  let parent: ComponentData | null | undefined = null

  try {
    item = componentId && getItemById ? (getItemById(componentId) as ComponentData) : null
    selector = componentId && getSelectorForId ? getSelectorForId(componentId) : null
    parent = componentId && getParentById ? (getParentById(componentId) as ComponentData) : null
  } catch {
    // Component might not be indexed yet
  }

  // Calculate permissions
  const permissions = item && getPermissions ? getPermissions({ item }) : undefined
  const canDuplicate = permissions ? permissions.duplicate !== false : true
  const canDelete = permissions ? permissions.delete !== false : true

  // Clipboard checking
  const clipboard = readClipboard()
  const clipboardItem = clipboard?.item
  const clipboardHasStyle = Boolean(
    clipboardItem?.props?._style && hasStyleKeys(clipboardItem.props._style),
  )
  const itemHasStyle = Boolean(item?.props?._style && hasStyleKeys(item.props._style))

  // Validate paste
  let pasteDisabled = false
  let pasteTooltip: string | undefined
  if (!clipboardItem) {
    pasteDisabled = true
    pasteTooltip = vi.eb07.cannotPasteEmpty
  } else if (selector) {
    const pasteValidation = prepareForPaste(clipboardItem, config, selector.zone, parent?.type)
    if (!pasteValidation.success) {
      pasteDisabled = true
      if (pasteValidation.reason === 'not-allowed-here') {
        pasteTooltip = vi.eb07.cannotPasteDisallowed
      } else if (pasteValidation.reason === 'unknown-type') {
        pasteTooltip = vi.eb07.cannotPasteUnknown
      } else if (
        pasteValidation.reason === 'too-large' ||
        pasteValidation.reason === 'too-many-blocks'
      ) {
        pasteTooltip = vi.eb07.cannotPasteTooLarge
      } else {
        pasteTooltip = vi.eb07.cannotPasteDisallowed
      }
    }
  }

  // Define actions
  const handleRename = useCallback(() => {
    closeMenu()
    if (componentId) {
      switchLeftPanelTab('outline')
      setRenamingId(componentId)
    }
  }, [closeMenu, componentId, setRenamingId])

  const handleDuplicate = useCallback(() => {
    closeMenu()
    if (!selector || !canDuplicate) return
    dispatch({
      type: 'duplicate',
      sourceIndex: selector.index,
      sourceZone: selector.zone,
    })
    showToast(vi.eb07.toast.duplicated)
  }, [closeMenu, selector, canDuplicate, dispatch, showToast])

  const handleCopy = useCallback(() => {
    closeMenu()
    if (!item) return
    copyBlock(item)
    showToast(vi.eb07.toast.copied)
  }, [closeMenu, item, showToast])

  const handlePaste = useCallback(() => {
    closeMenu()
    if (!selector || !clipboardItem) return
    const pasteValidation = prepareForPaste(clipboardItem, config, selector.zone, parent?.type)
    if (!pasteValidation.success) return

    const insertIndex = selector.index + 1
    const newItem = pasteValidation.item

    // Puck's own actions place the block in any zone (root, slot, slot inside an array item) and
    // keep its indexes in sync; both land in one history step (Puck debounces recording).
    dispatch({
      type: 'insert',
      componentType: newItem.type,
      destinationIndex: insertIndex,
      destinationZone: selector.zone,
      id: String(newItem.props.id),
    })
    dispatch({
      type: 'replace',
      destinationIndex: insertIndex,
      destinationZone: selector.zone,
      data: newItem,
    })
    dispatch({
      type: 'setUi',
      ui: {
        itemSelector: { index: insertIndex, zone: selector.zone },
      },
    })
    showToast(vi.eb07.toast.pasted)
  }, [closeMenu, selector, clipboardItem, config, parent, dispatch, showToast])

  const handlePasteStyle = useCallback(() => {
    closeMenu()
    if (!item || !selector || !clipboardHasStyle || !clipboardItem?.props?._style) return
    const styleToPaste = JSON.parse(JSON.stringify(clipboardItem.props._style))
    const updatedItem = {
      ...item,
      props: {
        ...item.props,
        _style: styleToPaste,
      },
    }
    dispatch({
      type: 'replace',
      destinationIndex: selector.index,
      destinationZone: selector.zone,
      data: updatedItem,
    })
    showToast(vi.eb07.toast.stylePasted)
  }, [closeMenu, item, selector, clipboardHasStyle, clipboardItem, dispatch, showToast])

  const handleResetStyle = useCallback(() => {
    closeMenu()
    if (!item || !selector || !itemHasStyle) return
    const { _style: _unused, ...restProps } = item.props as Record<string, unknown> & {
      id: string
    }
    const updatedItem = {
      ...item,
      props: restProps as typeof item.props,
    }
    dispatch({
      type: 'replace',
      destinationIndex: selector.index,
      destinationZone: selector.zone,
      data: updatedItem,
    })
    showToast(vi.eb07.toast.styleReset)
  }, [closeMenu, item, selector, itemHasStyle, dispatch, showToast])

  const handleSaveAsTemplate = useCallback(() => {
    if (item) {
      setTemplateModalItem(item)
    }
    closeMenu()
  }, [closeMenu, item])

  const handleDelete = useCallback(() => {
    closeMenu()
    if (!selector || !canDelete) return
    dispatch({
      type: 'remove',
      index: selector.index,
      zone: selector.zone,
    })
    showToast(vi.eb07.toast.deleted)
  }, [closeMenu, selector, canDelete, dispatch, showToast])

  // Build menu item list
  const menuItems = useMemo<MenuItemDef[]>(
    () => [
      {
        id: 'rename',
        label: vi.eb07.rename,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        ),
        disabled: false,
        action: handleRename,
      },
      {
        id: 'duplicate',
        label: vi.eb07.duplicate,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect
              x="8"
              y="8"
              width="12"
              height="12"
              rx="2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        disabled: !canDuplicate,
        tooltip: !canDuplicate ? vi.eb07.cannotDuplicateLocked : undefined,
        action: handleDuplicate,
      },
      {
        id: 'copy',
        label: vi.eb07.copy,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect
              x="9"
              y="9"
              width="13"
              height="13"
              rx="2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        disabled: false,
        action: handleCopy,
      },
      {
        id: 'paste',
        label: vi.eb07.paste,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        ),
        disabled: pasteDisabled,
        tooltip: pasteTooltip,
        action: handlePaste,
      },
      {
        id: 'pasteStyle',
        label: vi.eb07.pasteStyle,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 21a4 4 0 01-4-4 4 4 0 014-4h14v4a4 4 0 01-4 4H7zM7 13a4 4 0 01-4-4 4 4 0 014-4h14v4a4 4 0 01-4 4H7z"
            />
          </svg>
        ),
        disabled: !clipboardItem || !clipboardHasStyle,
        tooltip: !clipboardItem
          ? vi.eb07.cannotPasteEmpty
          : !clipboardHasStyle
            ? vi.eb07.cannotPasteStyleEmpty
            : undefined,
        action: handlePasteStyle,
      },
      {
        id: 'resetStyle',
        label: vi.eb07.resetStyle,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ),
        disabled: !itemHasStyle,
        tooltip: !itemHasStyle ? 'Khối chưa có kiểu dáng tuỳ chỉnh' : undefined,
        action: handleResetStyle,
      },
      {
        id: 'saveTemplate',
        label: vi.eb08.saveAsTemplate,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
        ),
        disabled: !item,
        action: handleSaveAsTemplate,
      },
      {
        id: 'delete',
        label: vi.eb07.delete,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        ),
        danger: true,
        disabled: !canDelete,
        tooltip: !canDelete ? vi.eb07.cannotDeleteLocked : undefined,
        action: handleDelete,
      },
    ],
    [
      canDuplicate,
      canDelete,
      pasteDisabled,
      pasteTooltip,
      clipboardItem,
      clipboardHasStyle,
      itemHasStyle,
      handleRename,
      handleDuplicate,
      handleCopy,
      handlePaste,
      handlePasteStyle,
      handleResetStyle,
      handleSaveAsTemplate,
      handleDelete,
      item,
    ],
  )

  // Keep menuItems in ref for stable keydown listener
  const menuItemsRef = useRef(menuItems)

  useEffect(() => {
    menuItemsRef.current = menuItems
  }, [menuItems])

  // Initial focus when menu opens
  useEffect(() => {
    if (menuState.isOpen) {
      const firstEnabledIndex = menuItemsRef.current.findIndex((it) => !it.disabled)
      setFocusedIndex(firstEnabledIndex !== -1 ? firstEnabledIndex : 0)
    }
  }, [menuState.isOpen])

  // Viewport boundary adjustment
  useLayoutEffect(() => {
    if (!menuState.isOpen || !menuRef.current) return

    const menuEl = menuRef.current
    const rect = menuEl.getBoundingClientRect()
    const menuWidth = rect.width || 210
    const menuHeight = rect.height || 260

    const winW = window.innerWidth
    const winH = window.innerHeight

    let left = menuState.x
    let top = menuState.y

    // Flip left if overflowing right edge
    if (left + menuWidth > winW - 12) {
      left = Math.max(12, left - menuWidth)
    }

    // Flip up if overflowing bottom edge
    if (top + menuHeight > winH - 12) {
      top = Math.max(12, top - menuHeight)
    }

    setPosition({ left, top })
  }, [menuState.isOpen, menuState.x, menuState.y])

  // Keyboard navigation & dismissal listeners
  useEffect(() => {
    if (!menuState.isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = menuItemsRef.current
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          let next = (prev + 1) % items.length
          while (items[next]?.disabled && next !== prev) {
            next = (next + 1) % items.length
          }
          return next
        })
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          let next = (prev - 1 + items.length) % items.length
          while (items[next]?.disabled && next !== prev) {
            next = (next - 1 + items.length) % items.length
          }
          return next
        })
        return
      }

      if (e.key === 'Home') {
        e.preventDefault()
        const first = items.findIndex((it) => !it.disabled)
        if (first !== -1) setFocusedIndex(first)
        return
      }

      if (e.key === 'End') {
        e.preventDefault()
        for (let i = items.length - 1; i >= 0; i--) {
          if (!items[i].disabled) {
            setFocusedIndex(i)
            break
          }
        }
        return
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setFocusedIndex((currentIdx) => {
          const current = items[currentIdx]
          if (current && !current.disabled) {
            current.action()
          }
          return currentIdx
        })
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }

    const handleScroll = () => {
      closeMenu()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleClickOutside, true)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleClickOutside, true)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [menuState.isOpen, closeMenu])

  if ((!menuState.isOpen && !templateModalItem) || typeof document === 'undefined') return null

  return (
    <>
      {menuState.isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Tác vụ khối"
            tabIndex={-1}
            style={{
              position: 'fixed',
              left: `${position.left}px`,
              top: `${position.top}px`,
              zIndex: 99999,
            }}
            className="min-w-[200px] w-max bg-white/95 backdrop-blur-md border border-deep-navy/15 rounded-xl shadow-2xl py-1.5 px-1 select-none animate-in fade-in zoom-in-95 duration-100"
          >
            {menuItems.map((itemDef, idx) => {
              const isFocused = focusedIndex === idx
              const isDelete = itemDef.id === 'delete'

              return (
                <React.Fragment key={itemDef.id}>
                  {/* Divider before delete */}
                  {isDelete && (
                    <div className="border-t border-deep-navy/10 my-1" role="separator" />
                  )}

                  <div className="relative group">
                    <button
                      type="button"
                      role="menuitem"
                      aria-disabled={itemDef.disabled}
                      tabIndex={isFocused ? 0 : -1}
                      disabled={itemDef.disabled}
                      onClick={() => {
                        if (!itemDef.disabled) itemDef.action()
                      }}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-ui text-left transition cursor-pointer ${
                        itemDef.disabled
                          ? 'opacity-40 cursor-not-allowed text-deep-navy/40'
                          : itemDef.danger
                            ? isFocused
                              ? 'bg-soft-pink text-bright-magenta font-semibold'
                              : 'text-accent-pink hover:bg-soft-pink/50'
                            : isFocused
                              ? 'bg-soft-pink/60 text-deep-navy font-semibold'
                              : 'text-deep-navy hover:bg-soft-pink/40'
                      }`}
                    >
                      <span className="w-4 h-4 shrink-0 flex items-center justify-center opacity-80">
                        {itemDef.icon}
                      </span>
                      <span className="flex-1 truncate">{itemDef.label}</span>
                    </button>

                    {/* Tooltip for disabled reason */}
                    {itemDef.disabled && itemDef.tooltip && (
                      <div
                        role="tooltip"
                        className="hidden group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-deep-navy text-white text-[11px] rounded-md shadow-lg pointer-events-none whitespace-nowrap z-50 font-ui"
                      >
                        {itemDef.tooltip}
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-deep-navy" />
                      </div>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </div>,
          document.body,
        )}

      {templateModalItem && (
        <SaveTemplateModal
          isOpen={Boolean(templateModalItem)}
          onClose={() => setTemplateModalItem(null)}
          kind="section"
          puckData={templateModalItem}
          defaultName={
            typeof templateModalItem?.props?._label === 'string' &&
            templateModalItem.props._label.trim()
              ? templateModalItem.props._label.trim()
              : templateModalItem?.type || 'Section'
          }
          onSaved={() => {
            showToast(vi.eb08.savedSuccess)
            setTemplateModalItem(null)
          }}
        />
      )}
    </>
  )
}
