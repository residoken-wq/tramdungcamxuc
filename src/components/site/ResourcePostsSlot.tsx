import React from 'react'
import { vi } from '@/lib/i18n/vi'

export interface ResourcePostsSlotProps {
  version?: number
  puck?: {
    isEditing?: boolean
  }
}

export function ResourcePostsSlot({ puck }: ResourcePostsSlotProps) {
  const isEditing = puck?.isEditing ?? false

  if (!isEditing) {
    return null
  }

  return (
    <div
      role="region"
      aria-label={vi.sm05.postsSlotEditorHint}
      className="my-8 rounded-2xl border-2 border-dashed border-deep-navy/30 bg-lavender-mist/30 p-8 text-center"
    >
      <p className="font-ui text-sm font-bold tracking-wider uppercase text-deep-navy">
        {vi.sm05.postsSlotEditorHint}
      </p>
    </div>
  )
}
