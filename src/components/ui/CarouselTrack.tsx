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
}: {
  children: React.ReactNode
  ariaLabel: string
  isDeepNavy?: boolean
  prevLabel: string
  nextLabel: string
  step?: number
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
    <div data-carousel-track="">
      {nav('mb-4 hidden justify-end sm:flex')}
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
      {nav('mt-4 flex justify-center sm:hidden')}
    </div>
  )
}
