import React, { useRef, useState, useEffect, useCallback } from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { IconCard, type IconCardProps } from './IconCard'
import { EmptySlotHint } from '@/components/ui/EmptySlotHint'
import { CarouselNavButtons } from '@/components/ui/CarouselNavButtons'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'
import { vi } from '@/lib/i18n/vi'

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
  columns?: 1 | 2 | 3 | 4 | 'carousel'
  cardStyle?: 'white' | 'soft' | 'outline'
  cardAlign?: 'inherit' | 'left' | 'center'
  /** Puck slot render (v2), React nodes, or raw Card blocks `{ props }` (direct use / tests). */
  cards?: CardsSlotRender | React.ReactNode | Array<{ type?: string; props?: IconCardProps }>
  items?: IconCardItem[]
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
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
  const isCarousel = columns === 'carousel'
  const validItems = Array.isArray(items)
    ? items.filter((item) => item && (item.title || item.text))
    : []

  const hasHeader = Boolean(titleLine1 || titleLine2 || seriesLabel)

  // Carousel navigation state
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 10)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }, [])

  useEffect(() => {
    if (!isCarousel) return
    const el = scrollContainerRef.current
    if (!el) return
    updateScrollButtons()
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    window.addEventListener('resize', updateScrollButtons)
    return () => {
      el.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [isCarousel, updateScrollButtons])

  const scrollByOffset = (offset: number) => {
    const el = scrollContainerRef.current
    if (!el) return
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({
      left: offset,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isCarousel) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollByOffset(-360)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollByOffset(360)
    }
  }

  // Columns: mobile always 1, tablet (md:) max 2, desktop (lg:) up to columns
  const getGridColsClass = (colCount: 1 | 2 | 3 | 4 | 'carousel') => {
    switch (colCount) {
      case 1:
        return 'grid-cols-1 max-w-2xl'
      case 2:
        return 'grid-cols-1 md:grid-cols-2 max-w-4xl'
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl'
      case 'carousel':
        return 'flex gap-6 sm:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:w-[85vw] [&>*]:max-w-[320px] md:[&>*]:w-[340px] [&>*]:shrink-0 [&>*]:snap-start'
      case 3:
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl'
    }
  }

  const gridColsClass = getGridColsClass(columns)
  const gridClasses = isCarousel
    ? `w-full ${gridColsClass} [counter-reset:card-counter]`
    : `mx-auto grid ${gridColsClass} gap-6 sm:gap-8 [counter-reset:card-counter]`

  const hasCards = Boolean(cards)
  const hasItems = !hasCards && validItems.length > 0

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {hasHeader && (
          <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end">
            <div className="w-full text-center sm:text-left">
              <SectionHeader
                id={id}
                seriesLabel={seriesLabel}
                titleLine1={titleLine1 || ''}
                titleLine2={titleLine2}
                emotionLine={emotionLine}
                align="left"
                line1Color={isDeepNavy ? 'white' : 'deep-navy'}
                line2Color={isDeepNavy ? 'soft-pink' : 'bright-magenta'}
                eyebrowColor={isDeepNavy ? 'soft-pink' : 'bright-magenta'}
                emotionColor={isDeepNavy ? 'white' : 'deep-navy'}
              />
            </div>
            {isCarousel && (
              <div className="hidden sm:flex sm:shrink-0">
                <CarouselNavButtons
                  onPrev={() => scrollByOffset(-360)}
                  onNext={() => scrollByOffset(360)}
                  canPrev={canPrev}
                  canNext={canNext}
                  isDeepNavy={isDeepNavy}
                  prevAriaLabel={vi.pk21?.iconCardGrid?.prevCards || 'Thẻ trước'}
                  nextAriaLabel={vi.pk21?.iconCardGrid?.nextCards || 'Thẻ tiếp theo'}
                />
              </div>
            )}
          </div>
        )}

        {!hasHeader && isCarousel && (
          <div className="mb-4 hidden justify-end sm:flex">
            <CarouselNavButtons
              onPrev={() => scrollByOffset(-360)}
              onNext={() => scrollByOffset(360)}
              canPrev={canPrev}
              canNext={canNext}
              isDeepNavy={isDeepNavy}
              prevAriaLabel={vi.pk21?.iconCardGrid?.prevCards || 'Thẻ trước'}
              nextAriaLabel={vi.pk21?.iconCardGrid?.nextCards || 'Thẻ tiếp theo'}
            />
          </div>
        )}

        <div
          ref={isCarousel ? scrollContainerRef : undefined}
          tabIndex={isCarousel ? 0 : undefined}
          onKeyDown={isCarousel ? handleKeyDown : undefined}
          className={`group/grid w-full ${isCarousel ? 'outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded-2xl' : ''}`}
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
                  highlight={item.highlight}
                  index={index}
                  marker={marker}
                  cardStyle={cardStyle}
                  isDeepNavy={isDeepNavy}
                />
              ))}
            </div>
          )}
        </div>

        {isCarousel && (
          <div className="mt-6 flex justify-center sm:hidden">
            <CarouselNavButtons
              onPrev={() => scrollByOffset(-360)}
              onNext={() => scrollByOffset(360)}
              canPrev={canPrev}
              canNext={canNext}
              isDeepNavy={isDeepNavy}
              prevAriaLabel={vi.pk21?.iconCardGrid?.prevCards || 'Thẻ trước'}
              nextAriaLabel={vi.pk21?.iconCardGrid?.nextCards || 'Thẻ tiếp theo'}
            />
          </div>
        )}
      </div>
    </section>
  )
}
