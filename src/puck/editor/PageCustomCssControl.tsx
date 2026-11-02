'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import { MAX_PAGE_CUSTOM_CSS_LENGTH } from '@/puck/style/custom-css'

export function PageCustomCssControl({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (value: string) => void
}) {
  const currentLength = (value ?? '').length

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div
        role="note"
        className="rounded-md bg-butter-cream/60 px-2 py-1.5 text-[11px] font-semibold text-deep-navy"
      >
        ⚠️ {vi.eb09.customCssWarning}
      </div>
      <p className="text-[11px] text-deep-navy/80">{vi.eb09.pageCustomCssHelp}</p>
      <textarea
        value={value ?? ''}
        rows={8}
        maxLength={MAX_PAGE_CUSTOM_CSS_LENGTH}
        placeholder={'/* CSS cho cả trang */\n.my-card {\n  border-radius: 12px;\n}'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-deep-navy/20 bg-warm-ivory/50 p-2 font-mono text-xs text-deep-navy focus:border-deep-navy focus:outline-none"
      />
      <div className="text-right text-[11px] text-deep-navy/70">
        {vi.eb09.customCssCharCount(currentLength, MAX_PAGE_CUSTOM_CSS_LENGTH)}
      </div>
    </div>
  )
}
