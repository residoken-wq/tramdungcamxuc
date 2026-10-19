import React from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BrandIcon } from '@/components/brand/BrandIcon'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'

export interface IconCardItem {
  icon?: BrandIconKey | string
  title: string
  text: string
}

export interface IconCardGridProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  marker?: 'icon' | 'number'
  columns?: 1 | 2 | 3 | 4
  cardStyle?: 'white' | 'soft' | 'outline'
  items?: IconCardItem[]
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

export function IconCardGrid({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  marker = 'icon',
  columns = 3,
  cardStyle = 'white',
  items = [],
  bgColor = 'warm-ivory',
  padding = 'md',
}: IconCardGridProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const validItems = Array.isArray(items)
    ? items.filter((item) => item && (item.title || item.text))
    : []

  const hasHeader = Boolean(titleLine1 || titleLine2 || seriesLabel)

  // Columns: mobile always 1, tablet (md:) max 2, desktop (lg:) up to columns
  const getGridColsClass = (colCount: number) => {
    switch (colCount) {
      case 1:
        return 'grid-cols-1 max-w-2xl'
      case 2:
        return 'grid-cols-1 md:grid-cols-2 max-w-4xl'
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl'
      case 3:
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl'
    }
  }

  const getCardClasses = () => {
    if (isDeepNavy) {
      switch (cardStyle) {
        case 'soft':
          return 'bg-soft-pink/15 border-soft-pink/30 text-white'
        case 'outline':
          return 'bg-transparent border-2 border-white/30 text-white'
        case 'white':
        default:
          return 'bg-white/10 border border-white/20 text-white'
      }
    }

    switch (cardStyle) {
      case 'soft':
        return 'bg-soft-pink border-accent-pink/20 text-deep-navy shadow-soft'
      case 'outline':
        return 'bg-transparent border-2 border-deep-navy/20 text-deep-navy'
      case 'white':
      default:
        return 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
    }
  }

  const cardClasses = getCardClasses()

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {hasHeader && (
          <div className="mb-8 sm:mb-12">
            <SectionHeader
              seriesLabel={seriesLabel}
              titleLine1={titleLine1 || ''}
              titleLine2={titleLine2}
              emotionLine={emotionLine}
              align="center"
            />
          </div>
        )}

        {validItems.length > 0 && (
          <div className={`mx-auto grid ${getGridColsClass(columns)} gap-6 sm:gap-8`}>
            {validItems.map((item, index) => {
              const formattedIndex = String(index + 1).padStart(2, '0')

              return (
                <div
                  key={index}
                  className={`flex flex-col p-6 sm:p-8 rounded-card border ${cardClasses} transition-transform hover:-translate-y-0.5`}
                >
                  <div className="mb-4 flex items-center">
                    {marker === 'number' ? (
                      <span className="font-display text-3xl sm:text-4xl text-bright-magenta">
                        {formattedIndex}
                      </span>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-pink text-bright-magenta">
                        <BrandIcon name={item.icon || 'star'} size={24} />
                      </div>
                    )}
                  </div>

                  <h3
                    className={`font-ui text-lg sm:text-xl font-bold leading-snug ${
                      isDeepNavy ? 'text-white' : 'text-deep-navy'
                    }`}
                  >
                    {item.title}
                  </h3>

                  <p
                    className={`mt-2 font-ui text-sm sm:text-base leading-relaxed ${
                      isDeepNavy ? 'text-white/80' : 'text-deep-navy/75'
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
