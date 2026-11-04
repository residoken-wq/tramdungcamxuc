'use client'

import React, { useCallback } from 'react'
import { createUsePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'

const usePuckSelector = createUsePuck()

export interface ItemTitlesFieldProps {
  type: 'tab' | 'accordion'
  value?: unknown
  onChange?: (value?: unknown) => void
}

/**
 * EB-16 1.3B: Fast inline title inputs for Tabs and Accordion widgets.
 * Allows Hana to rename tab/accordion items directly without expanding array rows.
 * Updates items[i].title directly via Puck's replace dispatch for full Undo/Redo support.
 */
export function ItemTitlesField({ type }: ItemTitlesFieldProps) {
  const selectedItem = usePuckSelector((s) => s.selectedItem)
  const selector = usePuckSelector((s) => s.appState.ui.itemSelector)
  const dispatch = usePuckSelector((s) => s.dispatch)

  const items = Array.isArray(selectedItem?.props?.items)
    ? (selectedItem.props.items as Array<{ title?: string; [key: string]: unknown }>)
    : []

  const updateItemTitle = useCallback(
    (index: number, newTitle: string) => {
      if (!selectedItem || !selector) return

      const currentItems = Array.isArray(selectedItem.props?.items)
        ? [...selectedItem.props.items]
        : []

      if (!currentItems[index]) return

      currentItems[index] = {
        ...currentItems[index],
        title: newTitle,
      }

      const updatedItem = {
        ...selectedItem,
        props: {
          ...selectedItem.props,
          items: currentItems,
        },
      }

      dispatch({
        type: 'replace',
        destinationIndex: selector.index,
        destinationZone: selector.zone || 'default',
        data: updatedItem,
      })
    },
    [dispatch, selectedItem, selector],
  )

  if (items.length === 0) return null

  const isTab = type === 'tab'

  return (
    <div className="flex flex-col gap-2.5 pb-2">
      {items.map((item, idx) => {
        const itemNumber = idx + 1
        const labelText = isTab
          ? vi.eb16.tabTitleItem(itemNumber)
          : vi.eb16.accordionTitleItem(itemNumber)
        const inputId = `quick-title-${selectedItem?.props?.id || 'item'}-${idx}`

        return (
          <div key={idx} className="flex flex-col gap-1">
            <label
              htmlFor={inputId}
              className="font-ui text-xs font-semibold text-deep-navy/80 select-none"
            >
              {labelText}
            </label>
            <input
              id={inputId}
              type="text"
              value={item.title ?? ''}
              onChange={(e) => updateItemTitle(idx, e.target.value)}
              placeholder={labelText}
              aria-label={labelText}
              className="w-full rounded-lg border border-deep-navy/20 bg-warm-ivory px-3 py-1.5 font-ui text-xs text-deep-navy transition focus:border-bright-magenta focus:outline-none focus:ring-1 focus:ring-bright-magenta"
            />
          </div>
        )
      })}
    </div>
  )
}

