'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import { useStylePanel } from '@/puck/editor/style-context'
import { isOpen } from '@/lib/design/design-system'

export function HtmlFieldControl({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (value: string) => void
}) {
  const { ds, isOwner } = useStylePanel()
  const customCssOpen = isOpen(ds, 'customCss')
  const canEdit = customCssOpen && isOwner
  const currentLength = (value ?? '').length

  if (!canEdit) {
    return (
      <div className="rounded bg-soft-pink/40 p-2 text-xs text-deep-navy">
        {!customCssOpen ? vi.eb09.htmlLockedNotice : vi.eb09.onlyOwnerAllowed}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div
        role="note"
        className="rounded-md bg-butter-cream/60 px-2 py-1.5 text-[11px] font-semibold text-deep-navy"
      >
        ⚠️ {vi.eb09.htmlContentWarning}
      </div>
      <textarea
        value={value ?? ''}
        rows={8}
        maxLength={20000}
        placeholder={vi.eb09.htmlContentPlaceholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-deep-navy/20 bg-warm-ivory/50 p-2 font-mono text-xs text-deep-navy focus:border-deep-navy focus:outline-none"
      />
      <div className="text-right text-[11px] text-deep-navy/70">
        {vi.eb09.customCssCharCount(currentLength, 20000)}
      </div>
    </div>
  )
}
