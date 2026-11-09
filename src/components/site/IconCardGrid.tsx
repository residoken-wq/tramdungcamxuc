import React from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { IconCard, type IconCardProps } from './IconCard'
import { EmptySlotHint } from '@/components/ui/EmptySlotHint'
import { CarouselTrack } from '@/components/ui/CarouselTrack'
import { vi } from '@/lib/i18n/vi'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'

export interface IconCardItem {
  icon?: BrandIconKey | string
  title: string
  text: string
  highlight?: 'none' | 'outline' | 'navy'
}

type CardsSlotRender = React.ComponentType<{ className?: string; style?: React.CSSProperties }>

export interface IconCardGridProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  marker?: 'icon' | 'number'
  /** PK-21: 'carousel' = cards in one row that scrolls sideways, with arrows. PK-26: 5 columns */
  columns?: 1 | 2 | 3 | 4 | 5 | 'carousel'
  connector?: 'none' | 'arrow'
  titleCase?: 'upper' | 'none'
  showAccentBar?: boolean
  headerAlign?: 'left' | 'center'
  bottomQuote?: string
  cardStyle?: 'white' | 'soft' | 'outline'
  cardAlign?: 'inherit' | 'left' | 'center'
  equalHeight?: boolean
  arrowPosition?: 'top' | 'sides'
  /** Puck slot render (v2), React nodes, or raw Card blocks `{ props }` (direct use / tests). */
  cards?:
    CardsSlotRender | React.ReactNode | Array<{ id?: string; type?: string; props?: IconCardProps }>
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
  titleCase = 'upper',
  showAccentBar = false,
  headerAlign = 'center',
  bottomQuote,
  marker = 'icon',
  columns = 3,
  connector = 'none',
  cardStyle = 'white',
  cardAlign = 'inherit',
  equalHeight = false,
  arrowPosition = 'top',
  cards,
  items = [],
  bgColor = 'warm-ivory',
  padding = 'md',
  puck,
}: IconCardGridProps & { id?: string }) {
  const isEditing = Boolean(puck?.isEditing)
  const isDeepNavy = bgColor === 'deep-navy'
  const isCarousel = columns === 'carousel'
  const validItems = Array.isArray(items)
    ? items.filter((item) => item && (item.title || item.text))
    : []

  const hasHeader = Boolean(titleLine1 || titleLine2 || seriesLabel)

  // Columns: mobile always 1, tablet (md:) max 2, desktop (lg:) up to columns
  const getGridColsClass = (colCount: IconCardGridProps['columns']) => {
    switch (colCount) {
      case 1:
        return 'grid-cols-1 max-w-2xl'
      case 2:
        return 'grid-cols-1 md:grid-cols-2 max-w-4xl'
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl'
      case 5:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5 max-w-7xl'
      case 3:
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl'
    }
  }

  const gridColsClass = getGridColsClass(columns)
  const connectorClasses =
    connector === 'arrow'
      ? "lg:[&>*:not(:last-child)]:relative lg:[&>*:not(:last-child)]:after:content-['→'] lg:[&>*:not(:last-child)]:after:absolute lg:[&>*:not(:last-child)]:after:-right-5 sm:lg:[&>*:not(:last-child)]:after:-right-6 lg:[&>*:not(:last-child)]:after:top-1/2 lg:[&>*:not(:last-child)]:after:-translate-y-1/2 lg:[&>*:not(:last-child)]:after:text-bright-magenta lg:[&>*:not(:last-child)]:after:text-2xl lg:[&>*:not(:last-child)]:after:font-bold lg:[&>*:not(:last-child)]:after:z-10 lg:[&>*:not(:last-child)]:after:pointer-events-none"
      : ''

  const equalHeightClasses = equalHeight
    ? '[&>[data-eb-card]]:self-stretch [&>*:not([data-eb-card])]:flex [&>*:not([data-eb-card])]:flex-col [&>*>[data-eb-card]]:flex-1'
    : ''

  // QA PK-21c: the carousel row is laid out here (server); CarouselTrack only scrolls it.
  const gridClasses = isCarousel
    ? `flex w-max gap-6 sm:gap-8 [counter-reset:card-counter] [&>*]:w-[80vw] [&>*]:max-w-[320px] [&>*]:shrink-0 [&>*]:snap-start md:[&>*]:w-[340px] ${equalHeightClasses}`.trim()
    : `mx-auto grid ${gridColsClass} gap-6 sm:gap-8 [counter-reset:card-counter] ${connectorClasses} ${equalHeightClasses}`.trim()

  const hasCards = Boolean(cards)
  const hasItems = !hasCards && validItems.length > 0

  const cardList = (
    <>
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
              highlight={item.highlight}
              index={index}
              marker={marker}
              cardStyle={cardStyle}
              isDeepNavy={isDeepNavy}
            />
          ))}
        </div>
      )}
    </>
  )

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
              align={headerAlign}
              titleCase={titleCase}
              showAccentBar={showAccentBar}
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
          data-connector={connector === 'arrow' ? 'arrow' : undefined}
        >
          {isCarousel ? (
            <CarouselTrack
              ariaLabel={titleLine1 || vi.pk21?.iconCardGrid?.region || 'Danh sách thẻ'}
              isDeepNavy={isDeepNavy}
              prevLabel={vi.pk21?.iconCardGrid?.prevCards || 'Thẻ trước'}
              nextLabel={vi.pk21?.iconCardGrid?.nextCards || 'Thẻ tiếp theo'}
              arrowPosition={arrowPosition}
            >
              {cardList}
            </CarouselTrack>
          ) : (
            cardList
          )}
        </div>

        {bottomQuote && (
          <p className="mt-8 font-quote text-base sm:text-lg italic text-bright-magenta text-center leading-relaxed max-w-3xl mx-auto">
            {bottomQuote}
          </p>
        )}
      </div>
    </section>
  )
}
