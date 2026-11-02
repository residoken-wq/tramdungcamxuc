'use client'

import React from 'react'
import { createUsePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'

const usePuckSelector = createUsePuck()

export interface EmptySlotHintProps {
  parentId?: string
  slotName: string
  childLabel: string
  isEditing?: boolean
  isDeepNavy?: boolean
  className?: string
}

function EmptySlotHintInternal({
  parentId,
  slotName,
  childLabel,
  isDeepNavy,
  className,
}: Omit<EmptySlotHintProps, 'isEditing'>) {
  // PK-14c: Puck 0.23 keeps slot children in the parent's props (not data.zones).
  const count = usePuckSelector((s) => {
    if (!parentId) return 0
    const items = (s.getItemById(parentId)?.props as Record<string, unknown> | undefined)?.[
      slotName
    ]
    return Array.isArray(items) ? items.length : 0
  })

  if (count > 0) return null

  const borderClass = isDeepNavy ? 'border-white/30' : 'border-deep-navy/20'
  const textClass = isDeepNavy ? 'text-white/85' : 'text-deep-navy/75'
  const bgClass = isDeepNavy ? 'bg-white/5' : 'bg-white/40'

  return (
    <div
      data-eb-empty-hint
      data-empty-slot-hint={`${parentId}:${slotName}`}
      className={`w-full flex items-center justify-center p-6 my-4 border-2 border-dashed rounded-2xl text-center pointer-events-none select-none transition-colors ${borderClass} ${textClass} ${bgClass} ${className || ''}`}
    >
      <p className="font-ui text-xs sm:text-sm leading-relaxed max-w-lg">
        {vi.pk14.emptySlotHint(childLabel)}
      </p>
    </div>
  )
}

/**
 * PK-14: Displays a centered guidance text in a dashed box inside an empty slot
 * on the Puck canvas when in editing mode.
 *
 * Renders nothing on public pages and when the slot contains one or more child cards.
 */
export function EmptySlotHint(props: EmptySlotHintProps) {
  if (!props.isEditing || !props.parentId) return null
  return <EmptySlotHintInternal {...props} />
}
