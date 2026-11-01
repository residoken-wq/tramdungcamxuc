'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import { useStylePanel } from './style-context'
import { ColorControl, Group } from './style-controls'

interface IconColorFieldProps {
  value?: string
  onChange?: (val: string) => void
  label?: string
}

export function IconColorField({
  value = 'deep-navy',
  onChange,
  label = vi.eb06.icon.iconColor,
}: IconColorFieldProps) {
  const { tab } = useStylePanel()

  // Only render on Style tab
  if (tab !== 'style') return null

  return (
    <Group title={label}>
      <ColorControl label={label} value={value} onChange={(v) => onChange?.(v ?? 'deep-navy')} />
    </Group>
  )
}
