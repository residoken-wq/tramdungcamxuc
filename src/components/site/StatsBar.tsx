import React from 'react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'

export interface StatItem {
  value?: string
  label: string
  description?: string
  icon?: BrandIconKey | string
}

export interface StatsBarProps {
  version?: number
  stats?: StatItem[]
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-12 px-6 sm:px-8',
  lg: 'py-16 px-6 sm:px-12',
} as const

export function StatsBar({ stats = [], bgColor = 'warm-ivory', padding = 'md' }: StatsBarProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const validStats = Array.isArray(stats)
    ? stats.filter((s) => s && (s.value || s.label || s.icon))
    : []

  if (validStats.length === 0) {
    return null
  }

  const getGridColsClass = (count: number) => {
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2'
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3'
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }

  const cardBgClass = isDeepNavy
    ? 'bg-white/10 border-white/20 text-white'
    : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'

  const valueColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const labelColorClass = isDeepNavy ? 'text-white/85' : 'text-deep-navy/80'
  const descriptionColorClass = isDeepNavy ? 'text-white/75' : 'text-deep-navy/70'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        <div className={`grid ${getGridColsClass(validStats.length)} gap-6 sm:gap-8`}>
          {validStats.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col items-center text-center p-6 sm:p-8 rounded-card border ${cardBgClass} transition-transform hover:-translate-y-0.5`}
            >
              {item.icon ? (
                <div className="flex h-14 sm:h-16 items-center justify-center">
                  <BrandIcon name={item.icon} size={44} className={valueColorClass} />
                </div>
              ) : (
                <div
                  className={`font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none ${valueColorClass}`}
                >
                  {item.value}
                </div>
              )}
              <p
                className={`mt-3 font-ui text-sm sm:text-base font-semibold leading-relaxed ${labelColorClass}`}
              >
                {item.label}
              </p>
              {item.description && (
                <p
                  className={`mt-1 font-ui text-xs sm:text-sm leading-relaxed ${descriptionColorClass}`}
                >
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
