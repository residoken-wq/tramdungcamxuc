'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import { LOCK_KEYS } from '@/lib/design/design-system'
import { vi } from '@/lib/i18n/vi'

/** EB-01: warns the owner as soon as any brand lock switch is set to "open". */
export const LockWarning: React.FC = () => {
  const anyOpen = useFormFields(([fields]) =>
    LOCK_KEYS.some((key) => fields[`lock.${key}`]?.value === 'open'),
  )
  if (!anyOpen) return null
  return (
    <p
      role="status"
      style={{
        margin: '0 0 12px',
        padding: '8px 12px',
        borderRadius: 6,
        background: 'var(--theme-warning-100)',
        color: 'var(--theme-warning-800)',
      }}
    >
      {vi.eb01.lock.openWarning}
    </p>
  )
}
