import React from 'react'
import { StatItem } from './StatItem'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'

export interface StatItemData {
  value?: string
  label: string
  description?: string
  icon?: BrandIconKey | string
}

export interface StatsBarProps {
  version?: number
  columns?: 2 | 3 | 4 | '2' | '3' | '4'
  stats?: React.ReactNode | React.ComponentType | StatItemData[] | unknown[]
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
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

export function StatsBar({
  columns,
  stats,
  bgColor = 'warm-ivory',
  padding = 'md',
}: StatsBarProps) {
  const isDeepNavy = bgColor === 'deep-navy'

  if (!stats) {
    return null
  }

  if (Array.isArray(stats) && stats.length === 0) {
    return null
  }

  const numCols =
    columns !== undefined
      ? Number(columns) || 3
      : Array.isArray(stats) && stats.length > 0
        ? Math.min(Math.max(stats.length, 2), 4)
        : 3

  const getGridColsClass = (count: number) => {
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-3xl'
    if (count === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl'
    return 'grid-cols-1 sm:grid-cols-3 max-w-5xl'
  }

  const gridClasses = `mx-auto grid ${getGridColsClass(numCols)} gap-6 sm:gap-8`

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        <div className="group/stats w-full" data-bg={bgColor}>
          {typeof stats === 'function' ? (
            React.createElement(stats as React.ComponentType<any>, {
              className: gridClasses,
            })
          ) : React.isValidElement(stats) ? (
            <div className={gridClasses}>{stats}</div>
          ) : Array.isArray(stats) ? (
            <div className={gridClasses}>
              {stats.map((child: any, idx: number) => {
                if (React.isValidElement(child)) return child
                if (child && typeof child === 'object' && child.props) {
                  return (
                    <StatItem
                      key={child.props.id || idx}
                      isDeepNavy={isDeepNavy}
                      {...child.props}
                    />
                  )
                }
                if (
                  child &&
                  typeof child === 'object' &&
                  (child.value || child.label || child.icon)
                ) {
                  return <StatItem key={idx} isDeepNavy={isDeepNavy} {...child} />
                }
                return null
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
