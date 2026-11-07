'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CarouselNavButtons } from '@/components/ui/CarouselNavButtons'
import { vi } from '@/lib/i18n/vi'

export interface PhotoGalleryItem {
  mediaId?: string | number
  imageUrl?: string
  alt?: string
  caption?: string
}

export interface PhotoGalleryProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  layout?: 'mosaic' | 'grid'
  items?: PhotoGalleryItem[]
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
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export function PhotoGallery({
  id,
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  layout = 'mosaic',
  items = [],
  bgColor = 'warm-ivory',
  padding = 'md',
  puck,
}: PhotoGalleryProps & { id?: string }) {
  const isEditing = Boolean(puck?.isEditing)
  const isDeepNavy = bgColor === 'deep-navy'

  // Filter valid items having an image URL or mediaId
  const validItems = Array.isArray(items)
    ? items.filter((item) => Boolean(item && (item.imageUrl || item.mediaId)))
    : []

  const groupSize = layout === 'mosaic' ? 4 : 6
  const groups = chunkItems(validItems, groupSize)
  const hasCarousel = validItems.length > groupSize

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)

  const scrollToGroup = useCallback(
    (index: number) => {
      const el = scrollContainerRef.current
      if (!el) return
      const targetIndex = Math.min(Math.max(0, index), groups.length - 1)
      const groupEl = el.children[targetIndex] as HTMLElement | undefined
      if (groupEl) {
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        groupEl.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          inline: 'start',
          block: 'nearest',
        })
        setActiveGroupIndex(targetIndex)
      }
    },
    [groups.length],
  )

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el || groups.length <= 1) return
    const scrollLeft = el.scrollLeft
    const firstChild = el.firstElementChild as HTMLElement | null
    if (!firstChild) return
    const childWidth = firstChild.offsetWidth + 24
    if (childWidth > 0) {
      const newIndex = Math.round(scrollLeft / childWidth)
      setActiveGroupIndex(Math.min(Math.max(0, newIndex), groups.length - 1))
    }
  }, [groups.length])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasCarousel) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollToGroup(activeGroupIndex - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollToGroup(activeGroupIndex + 1)
    }
  }

  const hasHeader = Boolean(titleLine1 || titleLine2 || seriesLabel)

  if (validItems.length === 0) {
    if (isEditing) {
      return (
        <section
          className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} border-2 border-dashed border-deep-navy/20 p-8 text-center`}
        >
          <p className="font-ui text-sm font-semibold text-deep-navy/70">
            {vi.pk21?.photoGallery?.empty ||
              '[MẪU] Thư viện ảnh đang trống. Vui lòng thêm ảnh trong bảng cài đặt.'}
          </p>
        </section>
      )
    }
    return null
  }

  // Render a single photo card
  const renderCard = (
    item: PhotoGalleryItem,
    index: number,
    extraCardClass = '',
    aspectRatioClass = 'aspect-[4/3]',
  ) => {
    const imgUrl = item.imageUrl || (item.mediaId ? `/api/media/${item.mediaId}` : '')
    const altText = item.alt || item.caption || `Ảnh khoảnh khắc ${index + 1}`

    return (
      <div
        key={index}
        data-eb-card=""
        className={`group relative overflow-hidden rounded-2xl border border-deep-navy/10 bg-white shadow-soft transition-all duration-300 hover:shadow-card ${aspectRatioClass} ${extraCardClass}`.trim()}
      >
        {imgUrl && (
          <Image
            src={imgUrl}
            alt={altText}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            unoptimized={imgUrl.startsWith('data:') || imgUrl.startsWith('blob:')}
          />
        )}
        {item.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep-navy/85 via-deep-navy/40 to-transparent p-3 pt-6 text-white transition-opacity">
            <p className="font-ui text-xs sm:text-sm font-medium leading-snug drop-shadow-sm">
              {item.caption}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {/* Header & Navigation Row */}
        <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:mb-8 sm:flex-row sm:items-end">
          <div className="w-full text-center sm:text-left">
            {hasHeader && (
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
            )}
          </div>
          {hasCarousel && (
            <div className="hidden sm:flex sm:shrink-0">
              <CarouselNavButtons
                onPrev={() => scrollToGroup(activeGroupIndex - 1)}
                onNext={() => scrollToGroup(activeGroupIndex + 1)}
                canPrev={activeGroupIndex > 0}
                canNext={activeGroupIndex < groups.length - 1}
                isDeepNavy={isDeepNavy}
                prevAriaLabel={vi.pk21?.photoGallery?.prevGroup || 'Nhóm ảnh trước'}
                nextAriaLabel={vi.pk21?.photoGallery?.nextGroup || 'Nhóm ảnh tiếp theo'}
              />
            </div>
          )}
        </div>

        {/* Mobile: 1 column horizontal scrolling snap */}
        <div className="sm:hidden -mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {validItems.map((item, idx) => (
            <div key={idx} className="w-[82vw] max-w-[300px] shrink-0 snap-start">
              {renderCard(item, idx, 'w-full h-[260px]', '')}
            </div>
          ))}
        </div>

        {/* Desktop / Tablet: Grouped layout with scroll-snap */}
        <div
          ref={scrollContainerRef}
          tabIndex={hasCarousel ? 0 : undefined}
          onKeyDown={handleKeyDown}
          role="region"
          aria-label={titleLine1 || 'Thư viện ảnh'}
          className="hidden sm:flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 outline-none focus-visible:ring-2 focus-visible:ring-accent-pink focus-visible:ring-offset-2 rounded-2xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {groups.map((group, groupIdx) => (
            <div
              key={groupIdx}
              role="group"
              aria-roledescription="slide"
              aria-label={`Nhóm ảnh ${groupIdx + 1}/${groups.length}`}
              className="w-full shrink-0 snap-start"
            >
              {layout === 'mosaic' ? (
                <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[440px]">
                  {/* Photo 1: Large left: 2 cols, 2 rows */}
                  {group[0] && (
                    <div className="col-span-2 row-span-2 h-full">
                      {renderCard(group[0], groupIdx * 4 + 0, 'h-full w-full', '')}
                    </div>
                  )}
                  {/* Photo 2: Center top */}
                  {group[1] && (
                    <div className="col-span-1 row-span-1 h-full">
                      {renderCard(group[1], groupIdx * 4 + 1, 'h-full w-full', '')}
                    </div>
                  )}
                  {/* Photo 3: Center bottom */}
                  {group[2] && (
                    <div className="col-span-1 row-span-1 h-full">
                      {renderCard(group[2], groupIdx * 4 + 2, 'h-full w-full', '')}
                    </div>
                  )}
                  {/* Photo 4: Vertical right */}
                  {group[3] && (
                    <div className="col-span-1 row-span-2 h-full">
                      {renderCard(group[3], groupIdx * 4 + 3, 'h-full w-full', '')}
                    </div>
                  )}
                </div>
              ) : (
                /* Grid 3 columns layout */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {group.map((item, itemIdx) => (
                    <div key={itemIdx}>
                      {renderCard(item, groupIdx * 6 + itemIdx, 'w-full', 'aspect-[4/3]')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Nav Buttons at bottom */}
        {hasCarousel && (
          <div className="mt-4 flex justify-center sm:hidden">
            <CarouselNavButtons
              onPrev={() => scrollToGroup(activeGroupIndex - 1)}
              onNext={() => scrollToGroup(activeGroupIndex + 1)}
              canPrev={activeGroupIndex > 0}
              canNext={activeGroupIndex < groups.length - 1}
              isDeepNavy={isDeepNavy}
              prevAriaLabel={vi.pk21?.photoGallery?.prevGroup || 'Nhóm ảnh trước'}
              nextAriaLabel={vi.pk21?.photoGallery?.nextGroup || 'Nhóm ảnh tiếp theo'}
            />
          </div>
        )}
      </div>
    </section>
  )
}
