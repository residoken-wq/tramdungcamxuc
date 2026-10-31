'use client'

import React from 'react'
import { useRowLabel } from '@payloadcms/ui'
import { isValidHex } from '@/lib/design/design-system'
import { vi } from '@/lib/i18n/vi'

/** EB-01: shows "token – label" with a small swatch on each collapsed colour row. */
export const ColorRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ token?: string; label?: string; hex?: string }>()
  const hex = data?.hex
  const title =
    [data?.token, data?.label].filter(Boolean).join(' – ') ||
    vi.eb01.colors.rowFallback((rowNumber ?? 0) + 1)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden="true"
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          border: '1px solid var(--theme-elevation-150)',
          background: isValidHex(hex) ? hex : 'transparent',
        }}
      />
      {title}
    </span>
  )
}
