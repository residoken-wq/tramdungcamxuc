'use client'

import React, { useMemo } from 'react'
import { createUsePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { switchLeftPanelTab } from './LeftPanel'
import { findItemById } from './insert/insert-target'

const usePuckSelector = createUsePuck()

export interface EmptyContainerPlaceholderProps {
  containerId: string
}

/**
 * EB-13b item 2: One-click "+ Thêm phần tử" placeholder in empty Containers within the editor.
 * Clicking selects this Container and opens the LeftPanel blocks library.
 */
export function EmptyContainerPlaceholder({ containerId }: EmptyContainerPlaceholderProps) {
  const dispatch = usePuckSelector((s) => s.dispatch)
  const appState = usePuckSelector((s) => s.appState)
  const getSelectorForId = usePuckSelector((s) => s.getSelectorForId)

  // EB-13bc: find the Container at any depth (it can sit inside another Container or a tab).
  const isEmpty = useMemo(() => {
    if (!containerId) return false
    const zoneItems = appState.data.zones?.[`${containerId}:items`]
    if (Array.isArray(zoneItems) && zoneItems.length > 0) return false
    const item = findItemById(appState.data, containerId)
    const items = (item?.props as { items?: unknown } | undefined)?.items
    return !(Array.isArray(items) && items.length > 0)
  }, [containerId, appState.data])

  if (!isEmpty) return null

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!containerId) return

    let selector = getSelectorForId ? getSelectorForId(containerId) : null
    if (!selector) {
      const rootIdx = (appState.data.content || []).findIndex((it) => it.props?.id === containerId)
      if (rootIdx !== -1) {
        selector = { index: rootIdx, zone: 'root:default-zone' }
      }
    }

    if (selector) {
      dispatch({
        type: 'setUi',
        ui: {
          itemSelector: selector,
          leftSideBarVisible: true,
        },
      })
    } else {
      dispatch({
        type: 'setUi',
        ui: {
          leftSideBarVisible: true,
        },
      })
    }

    switchLeftPanelTab('blocks')
  }

  return (
    <div className="w-full py-5 px-4 my-2 border-2 border-dashed border-bright-magenta/40 rounded-xl bg-soft-pink/20 hover:bg-soft-pink/30 flex flex-col items-center justify-center text-center transition">
      <button
        type="button"
        data-testid="container-empty-add-btn"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bright-magenta text-white text-xs font-ui font-bold hover:bg-deep-navy shadow-sm transition cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
        <span>{vi.eb13b.emptyContainer.addBlock}</span>
      </button>
      <span className="text-[11px] font-ui text-deep-navy/60 mt-1.5">
        {vi.eb13b.emptyContainer.emptyNotice}
      </span>
    </div>
  )
}
