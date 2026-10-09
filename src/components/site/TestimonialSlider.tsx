'use client'

import React, { useState, useRef, useCallback } from 'react'
import { TestimonialCard } from './TestimonialCard'
import type { PublicTestimonial } from '@/lib/testimonials'
import { useClientTestimonials } from '@/puck/client-preview'

export interface TestimonialSliderProps {
  version?: number
  manualTestimonials?: Array<{ testimonialId?: string | number }>
  testimonialIds?: Array<string | number>
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    testimonials?: PublicTestimonial[]
  }
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

export function TestimonialSlider({
  manualTestimonials,
  testimonialIds,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: TestimonialSliderProps) {
  const isEditing = puck?.isEditing ?? false

  const resolvedIds = (manualTestimonials?.map((m) => m?.testimonialId).filter(Boolean) ??
    testimonialIds ??
    []) as Array<string | number>

  const { testimonials, loading } = useClientTestimonials({
    testimonialIds: resolvedIds,
    mode: 'manual',
    initialTestimonials: _resolved?.testimonials,
  })

  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartXRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)

  const count = testimonials.length

  const goToPrev = useCallback(() => {
    if (count <= 1) return
    setCurrentIndex((prev) => (prev === 0 ? count - 1 : prev - 1))
  }, [count])

  const goToNext = useCallback(() => {
    if (count <= 1) return
    setCurrentIndex((prev) => (prev === count - 1 ? 0 : prev + 1))
  }, [count])

  // Keyboard navigation support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      }
    },
    [goToPrev, goToNext],
  )

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    touchEndXRef.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return
    const diff = touchStartXRef.current - touchEndXRef.current
    const swipeThreshold = 40 // px
    if (diff > swipeThreshold) {
      goToNext()
    } else if (diff < -swipeThreshold) {
      goToPrev()
    }
    touchStartXRef.current = null
    touchEndXRef.current = null
  }

  const safeIndex = count > 0 ? (currentIndex < count ? currentIndex : 0) : 0
  const current = testimonials[safeIndex] || testimonials[0]

  if (!isEditing && (!testimonials || testimonials.length === 0)) {
    return null
  }

  return (
    <section
      className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}
      aria-label="Lời chia sẻ từ học viên và thân chủ"
    >
      <div className="mx-auto max-w-4xl px-2 sm:px-4">
        {loading && testimonials.length === 0 ? (
          <div className="py-12 text-center text-sm font-ui text-deep-navy/60">
            Đang tải lời chia sẻ...
          </div>
        ) : testimonials.length === 0 ? (
          isEditing ? (
            <div className="py-12 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
              Chưa có lời chia sẻ nào được chọn. Vui lòng chọn 2–8 lời chia sẻ trong thanh cấu hình
              bên phải.
            </div>
          ) : null
        ) : (
          <div
            className="relative flex flex-col items-center focus:outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-roledescription="carousel"
            aria-label="Thanh trượt lời chia sẻ"
          >
            {/* Screen reader announcement for active slide */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {current ? `Lời chia sẻ ${safeIndex + 1} trên ${count}: của ${current.name}` : ''}
            </div>

            {/* Testimonial Card Display */}
            <div className="w-full transition-opacity duration-300">
              {current && (
                <TestimonialCard
                  key={String(current.id)}
                  name={current.name}
                  quote={current.quote}
                  role={current.role}
                  photo={
                    current.photo ? { src: current.photo.url, alt: current.photo.alt } : undefined
                  }
                  consent={true}
                  className="shadow-sm"
                />
              )}
            </div>

            {/* Controls (Navigation buttons & dots) */}
            {count > 1 && (
              <div className="mt-8 flex items-center justify-between w-full max-w-xs px-4">
                {/* Previous button */}
                <button
                  type="button"
                  onClick={goToPrev}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center border border-deep-navy/20 bg-white text-deep-navy hover:bg-soft-pink/50 hover:border-accent-pink/40 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink"
                  aria-label="Lời chia sẻ trước"
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

                {/* Dots indicator */}
                <div
                  className="flex items-center gap-2"
                  role="tablist"
                  aria-label="Chọn lời chia sẻ"
                >
                  {testimonials.map((t, idx) => (
                    <button
                      key={String(t.id)}
                      type="button"
                      role="tab"
                      aria-selected={idx === safeIndex}
                      aria-label={`Đi tới lời chia sẻ ${idx + 1}`}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-pink ${
                        idx === safeIndex
                          ? 'w-7 bg-bright-magenta'
                          : 'w-2.5 bg-deep-navy/20 hover:bg-deep-navy/40'
                      }`}
                    />
                  ))}
                </div>

                {/* Next button */}
                <button
                  type="button"
                  onClick={goToNext}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center border border-deep-navy/20 bg-white text-deep-navy hover:bg-soft-pink/50 hover:border-accent-pink/40 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink"
                  aria-label="Lời chia sẻ tiếp theo"
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
            )}
          </div>
        )}
      </div>
    </section>
  )
}
