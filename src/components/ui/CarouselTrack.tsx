'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { CarouselNavButtons } from './CarouselNavButtons'

/**
 * QA PK-21c: horizontal scroller with prev / next buttons and arrow keys.
 * A client component that only takes `children` (React elements), so server components – and
 * Puck slot renders, which are functions – stay on the server and just pass their output in.
 * The outer element scrolls; snap points come from `snap-start` on the cards inside.
 */
export function CarouselTrack({
  children,
  ariaLabel,
  isDeepNavy = false,
  prevLabel,
  nextLabel,
  step = 360,
  arrowPosition = 'top',
}: {
  children: React.ReactNode
  ariaLabel: string
  isDeepNavy?: boolean
  prevLabel: string
  nextLabel: string
  step?: number
  arrowPosition?: 'top' | 'sides'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanPrev(el.scrollLeft > 10)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' })
  }

  const isSides = arrowPosition === 'sides'
  const sideBtnClass =
    'hidden sm:inline-flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-accent-pink disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none shadow-sm ' +
    (isDeepNavy
      ? 'border border-white/20 bg-deep-navy/80 text-white/70 hover:text-white hover:bg-white/10'
      : 'border border-deep-navy/20 bg-white text-deep-navy/60 hover:text-deep-navy hover:bg-soft-pink/30 hover:border-deep-navy/40')

  const nav = (className: string) => (
    <CarouselNavButtons
      className={className}
      onPrev={() => scrollBy(-1)}
      onNext={() => scrollBy(1)}
      canPrev={canPrev}
      canNext={canNext}
      isDeepNavy={isDeepNavy}
      prevAriaLabel={prevLabel}
      nextAriaLabel={nextLabel}
    />
  )

  return (
    <div data-carousel-track="" className="relative">
      {!isSides && nav('mb-4 hidden justify-end sm:flex')}
      {isSides && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canPrev}
          aria-label={prevLabel}
          className={`absolute -left-4 md:-left-6 lg:-left-10 xl:-left-14 top-1/2 -translate-y-1/2 z-20 ${sideBtnClass}`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <div
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            scrollBy(e.key === 'ArrowLeft' ? -1 : 1)
          }
        }}
        className="w-full snap-x snap-mandatory overflow-x-auto pb-4 outline-none [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-accent-pink [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {isSides && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canNext}
          aria-label={nextLabel}
          className={`absolute -right-4 md:-right-6 lg:-right-10 xl:-right-14 top-1/2 -translate-y-1/2 z-20 ${sideBtnClass}`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
      {!isSides && nav('mt-4 flex justify-center sm:hidden')}
    </div>
  )
}
