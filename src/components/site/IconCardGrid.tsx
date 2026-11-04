import React from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { IconCard, type IconCardProps } from './IconCard'
import { EmptySlotHint } from '@/components/ui/EmptySlotHint'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'

export interface IconCardItem {
  icon?: BrandIconKey | string
  title: string
  text: string
}

type CardsSlotRender = React.ComponentType<{ className?: string; style?: React.CSSProperties }>

export interface IconCardGridProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  marker?: 'icon' | 'number'
  columns?: 1 | 2 | 3 | 4
  cardStyle?: 'white' | 'soft' | 'outline'
  cardAlign?: 'inherit' | 'left' | 'center'
  /** Puck slot render (v2), React nodes, or raw Card blocks `{ props }` (direct use / tests). */
  cards?: CardsSlotRender | React.ReactNode | Array<{ type?: string; props?: IconCardProps }>
  items?: IconCardItem[]
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  puck?: {
    isEditing?: boolean
  }
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
  id,
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  marker = 'icon',
  columns = 3,
  cardStyle = 'white',
  cardAlign = 'inherit',
  cards,
  items = [],
  bgColor = 'warm-ivory',
  padding = 'md',
  puck,
}: IconCardGridProps & { id?: string }) {
  const isEditing = Boolean(puck?.isEditing)
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

  const gridColsClass = getGridColsClass(columns)
  const gridClasses = `mx-auto grid ${gridColsClass} gap-6 sm:gap-8 [counter-reset:card-counter]`

  const hasCards = Boolean(cards)
  const hasItems = !hasCards && validItems.length > 0

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {hasHeader && (
          <div className="mb-8 sm:mb-12">
            <SectionHeader
              id={id}
              seriesLabel={seriesLabel}
              titleLine1={titleLine1 || ''}
              titleLine2={titleLine2}
              emotionLine={emotionLine}
              align="center"
              line1Color={isDeepNavy ? 'white' : 'deep-navy'}
              line2Color={isDeepNavy ? 'soft-pink' : 'bright-magenta'}
              eyebrowColor={isDeepNavy ? 'soft-pink' : 'bright-magenta'}
              emotionColor={isDeepNavy ? 'white' : 'deep-navy'}
            />
          </div>
        )}

        <div
          className="group/grid w-full"
          data-card-style={cardStyle}
          data-marker={marker}
          data-grid-bg={bgColor}
          data-bg={bgColor}
          data-card-theme={`${isDeepNavy ? 'navy' : 'light'}-${cardStyle}`}
          data-card-align={cardAlign || 'inherit'}
        >
          {hasCards &&
            (typeof cards === 'function' ? (
              <>
                {React.createElement(cards as CardsSlotRender, {
                  className: gridClasses,
                  style: { counterReset: 'card-counter' },
                })}
                <EmptySlotHint
                  parentId={id}
                  slotName="cards"
                  childLabel="Thẻ"
                  isEditing={isEditing}
                  isDeepNavy={isDeepNavy}
                />
              </>
            ) : React.isValidElement(cards) ? (
              <div className={gridClasses} style={{ counterReset: 'card-counter' }}>
                {cards}
              </div>
            ) : Array.isArray(cards) ? (
              <div className={gridClasses} style={{ counterReset: 'card-counter' }}>
                {(cards as unknown[]).map((child, idx: number) => {
                  if (React.isValidElement(child)) {
                    return child
                  }
                  const block = child as { props?: IconCardProps & { id?: string } } | null
                  if (block && typeof block === 'object' && block.props) {
                    return (
                      <IconCard
                        key={block.props.id || idx}
                        index={idx}
                        marker={marker}
                        cardStyle={cardStyle}
                        isDeepNavy={isDeepNavy}
                        {...block.props}
                      />
                    )
                  }
                  return null
                })}
              </div>
            ) : null)}

          {hasItems && (
            <div className={gridClasses} style={{ counterReset: 'card-counter' }}>
              {validItems.map((item, index) => (
                <IconCard
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  text={item.text}
                  index={index}
                  marker={marker}
                  cardStyle={cardStyle}
                  isDeepNavy={isDeepNavy}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
