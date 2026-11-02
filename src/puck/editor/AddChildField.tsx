'use client'

import React, { useCallback, useId } from 'react'
import { createUsePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'

const usePuckSelector = createUsePuck()

export interface AddChildFieldProps {
  parentType: string
  slotName: string
  childType: string
  onChange?: (value?: unknown) => void
  value?: unknown
  name?: string
}

/**
 * PK-14: One-click "+ Thêm {childLabel}" button shown at the bottom of
 * parent blocks that take a single child card type.
 *
 * Never calls onChange, preserving page data schema and avoiding Puck migrations.
 */
export function AddChildField({
  parentType: _parentType,
  slotName,
  childType,
}: AddChildFieldProps) {
  const buttonId = useId()

  const config = usePuckSelector((s) => s.config)
  const dispatch = usePuckSelector((s) => s.dispatch)
  const getPermissions = usePuckSelector((s) => s.getPermissions)
  const selectedItem = usePuckSelector((s) => s.selectedItem)
  const parentId = selectedItem?.props?.id ? String(selectedItem.props.id) : undefined
  const zone = parentId ? `${parentId}:${slotName}` : undefined
  // PK-14c: Puck 0.23 keeps slot children in the parent's props (not data.zones).
  const slotItems = (selectedItem?.props as Record<string, unknown> | undefined)?.[slotName]
  const childCount = Array.isArray(slotItems) ? slotItems.length : 0

  const childComponent = config?.components?.[childType]
  const childLabel = childComponent?.label || childType

  // Check permissions and block locks
  const parentPermissions =
    selectedItem && getPermissions ? getPermissions({ item: selectedItem }) : undefined
  const childPermissions = getPermissions ? getPermissions({ type: childType }) : undefined

  const isLocked = parentPermissions?.edit === false || childPermissions?.insert === false
  const lockedReason = isLocked ? vi.pk14.lockedReason : undefined

  const handleAddChild = useCallback(() => {
    if (isLocked || !parentId || !zone) return

    const newId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${childType}-${Date.now()}`

    const destinationIndex = childCount

    // 1. Insert new child block with defaultProps into zone
    dispatch({
      type: 'insert',
      componentType: childType,
      destinationIndex,
      destinationZone: zone,
      id: newId,
    })

    // 2. Select the newly inserted child item immediately so the right panel opens its fields
    dispatch({
      type: 'setUi',
      ui: {
        itemSelector: { index: destinationIndex, zone },
      },
    })
  }, [isLocked, parentId, zone, childType, childCount, dispatch])

  return (
    <div className="flex flex-col gap-1.5 pt-3 border-t border-deep-navy/10 mt-2">
      <button
        id={buttonId}
        type="button"
        disabled={isLocked || !parentId}
        onClick={handleAddChild}
        title={lockedReason}
        className={`w-full py-2 px-3 rounded-xl font-ui font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
          isLocked || !parentId
            ? 'bg-deep-navy/10 text-deep-navy/40 cursor-not-allowed shadow-none'
            : 'bg-bright-magenta text-white hover:opacity-90 active:scale-[0.98] cursor-pointer'
        }`}
      >
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>{vi.pk14.addChildButton(childLabel)}</span>
      </button>

      <div className="flex items-center justify-between px-1 text-[11px] font-ui text-deep-navy/60">
        <span>{vi.pk14.childCount(childCount)}</span>
        {isLocked && <span className="text-bright-magenta italic">{lockedReason}</span>}
      </div>
    </div>
  )
}
