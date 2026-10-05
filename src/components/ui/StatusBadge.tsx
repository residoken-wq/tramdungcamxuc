import React from 'react'
import { vi } from '@/lib/i18n/vi'

export type SaleStatus = 'coming_soon' | 'on_sale' | 'free' | 'consult' | 'hidden'

export interface StatusBadgeProps {
  status: SaleStatus
  label?: string
  className?: string
}

export const STATUS_BADGE_STYLES: Record<SaleStatus, string> = {
  on_sale: 'bg-mint-haze text-deep-navy border border-deep-navy/15',
  free: 'bg-mint-haze text-deep-navy border border-deep-navy/15',
  coming_soon: 'bg-soft-pink text-bright-magenta border border-bright-magenta/25',
  consult: 'bg-butter-cream text-deep-navy border border-deep-navy/15',
  hidden: 'bg-warm-ivory text-deep-navy/60 border border-deep-navy/20',
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const displayLabel = label || vi.status[status]
  const badgeStyle = STATUS_BADGE_STYLES[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-ui text-xs font-bold uppercase tracking-wider ${badgeStyle} ${className}`}
    >
      {displayLabel}
    </span>
  )
}
