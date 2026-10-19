'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { vi } from '@/lib/i18n/vi'

const ResourceRequestForm = dynamic(
  () => import('@/components/site/ResourceRequestForm').then((mod) => mod.ResourceRequestForm),
  { ssr: true },
)

export interface LeadMagnetItem {
  id: string | number
  name: string
  slug: string
  shortDescription?: string | null
  topic?: string | null
  coverImage?: {
    url?: string | null
    alt?: string | null
  } | null
}

export interface LeadMagnetCarouselProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  mode?: 'auto' | 'manual'
  manualProducts?: Array<{ productId?: string | number }>
  bgColor?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  isDemo?: boolean
  _resolved?: {
    items?: LeadMagnetItem[]
  }
  puck?: {
    isEditing?: boolean
  }
}

const BG_COLOR_CLASSES: Record<string, string> = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
}

const PADDING_CLASSES: Record<string, string> = {
  none: 'py-0',
  sm: 'py-6 sm:py-8',
  md: 'py-12 sm:py-16',
  lg: 'py-16 sm:py-24',
  xl: 'py-20 sm:py-32',
}

export function LeadMagnetCarousel({
  seriesLabel,
  titleLine1 = vi.sm05.carousel.emptyEditor,
  titleLine2,
  emotionLine,
  bgColor = 'warm-ivory',
  padding = 'md',
  isDemo = false,
  _resolved,
  puck,
}: LeadMagnetCarouselProps) {
  const isEditing = puck?.isEditing ?? false
  const items = _resolved?.items || []

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Determine active slide index on scroll
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const scrollLeft = el.scrollLeft
    const slide = el.firstElementChild as HTMLElement | null
    if (!slide) return
    const slideWidth = slide.offsetWidth + 24 // 24px is gap-6
    if (slideWidth > 0) {
      const newIndex = Math.round(scrollLeft / slideWidth)
      setActiveIndex(Math.min(Math.max(0, newIndex), items.length - 1))
    }
  }, [items.length])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollToSlide = (index: number) => {
    const el = scrollContainerRef.current
    if (!el) return
    const targetIndex = Math.min(Math.max(0, index), items.length - 1)
    const slide = el.children[targetIndex] as HTMLElement | undefined
    if (slide) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      slide.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        inline: 'start',
        block: 'nearest',
      })
      setActiveIndex(targetIndex)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollToSlide(activeIndex - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollToSlide(activeIndex + 1)
    }
  }

  if (items.length === 0) {
    if (isEditing) {
      return (
        <section
          aria-label={vi.sm05.carousel.emptyEditor}
          className="my-8 rounded-2xl border-2 border-dashed border-deep-navy/30 bg-lavender-mist/30 p-8 text-center"
        >
          <p className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
            {vi.sm05.carousel.emptyEditor}
          </p>
        </section>
      )
    }
    return null
  }

  const bgClass = BG_COLOR_CLASSES[bgColor] || 'bg-warm-ivory'
  const paddingClass = PADDING_CLASSES[padding] || 'py-12 sm:py-16'

  return (
    <section
      aria-roledescription="carousel"
      aria-label={titleLine1}
      className={`w-full ${bgClass} ${paddingClass} overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 sm:mb-12 text-center max-w-3xl mx-auto">
          <SectionHeader
            seriesLabel={seriesLabel}
            titleLine1={titleLine1}
            titleLine2={titleLine2}
            emotionLine={emotionLine}
            align="center"
          />
        </div>

        {/* Carousel controls header (Desktop / Tablet prev/next buttons) */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            role="region"
            aria-label={titleLine1}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta focus-visible:ring-offset-2 rounded-2xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, idx) => {
              const topicKey = item.topic as keyof typeof vi.sm05.topics | undefined
              const topicLabel =
                topicKey && topicKey in vi.sm05.topics
                  ? vi.sm05.topics[topicKey]
                  : item.topic || vi.sm05.topics.taiLieu

              return (
                <article
                  key={item.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={vi.sm05.carousel.slideNumber(idx + 1, items.length)}
                  className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] flex-shrink-0 snap-start flex flex-col"
                >
                  <div className="rounded-2xl border border-deep-navy/10 bg-white shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                    {/* Cover image or placeholder */}
                    <div className="relative aspect-[16/10] w-full bg-lavender-mist/30 overflow-hidden">
                      {item.coverImage?.url ? (
                        <Image
                          src={item.coverImage.url}
                          alt={item.coverImage.alt || item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                          <span className="text-3xl mb-1" aria-hidden="true">
                            📖
                          </span>
                          <span className="font-ui text-xs font-semibold text-deep-navy/60">
                            {topicLabel}
                          </span>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-soft-pink/95 text-bright-magenta font-ui text-xs font-bold uppercase tracking-wider backdrop-blur-xs shadow-xs">
                        {topicLabel}
                      </span>
                    </div>

                    {/* Content and delivery form */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <h3 className="font-display uppercase text-xl sm:text-2xl text-deep-navy tracking-tight leading-snug line-clamp-2 mb-2">
                        {item.name}
                      </h3>
                      {item.shortDescription && (
                        <p className="font-body text-sm text-deep-navy/80 line-clamp-3 mb-4 leading-relaxed">
                          {item.shortDescription}
                        </p>
                      )}

                      {/* Embedded ResourceRequestForm reusing submitResourceRequest with 7-day signed link */}
                      <div className="mt-auto pt-4 border-t border-deep-navy/10">
                        {isDemo ? (
                          <div className="py-2.5 px-3 rounded-xl bg-warm-ivory border border-deep-navy/10 text-center font-ui text-xs font-semibold text-deep-navy/70">
                            [MẪU] Form nhận tài liệu qua email
                          </div>
                        ) : (
                          <ResourceRequestForm
                            slug={item.slug}
                            productName={item.name}
                            className="!p-0 !border-0 !shadow-none !bg-transparent !max-w-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Navigation Controls: Prev / Next / Dots */}
          {items.length > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              {/* Prev / Next buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollToSlide(activeIndex - 1)}
                  disabled={activeIndex === 0}
                  aria-label={vi.sm05.carousel.prev}
                  className="min-h-[44px] min-w-[44px] rounded-full border border-deep-navy/20 bg-white text-deep-navy flex items-center justify-center transition-all hover:bg-soft-pink/40 hover:border-bright-magenta disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-bright-magenta"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSlide(activeIndex + 1)}
                  disabled={activeIndex === items.length - 1}
                  aria-label={vi.sm05.carousel.next}
                  className="min-h-[44px] min-w-[44px] rounded-full border border-deep-navy/20 bg-white text-deep-navy flex items-center justify-center transition-all hover:bg-soft-pink/40 hover:border-bright-magenta disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-bright-magenta"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Slide Position Dots */}
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Vị trí slide">
                {items.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={activeIndex === idx}
                    aria-label={vi.sm05.carousel.slideNumber(idx + 1, items.length)}
                    onClick={() => scrollToSlide(idx)}
                    className={`min-h-[44px] min-w-[20px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-bright-magenta`}
                  >
                    <span
                      className={`block rounded-full transition-all duration-200 ${
                        activeIndex === idx
                          ? 'w-7 h-2.5 bg-bright-magenta shadow-xs'
                          : 'w-2.5 h-2.5 bg-deep-navy/20 hover:bg-deep-navy/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
