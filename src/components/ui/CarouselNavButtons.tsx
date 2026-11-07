import React from 'react'

export interface CarouselNavButtonsProps {
  onPrev: () => void
  onNext: () => void
  canPrev?: boolean
  canNext?: boolean
  isDeepNavy?: boolean
  prevAriaLabel?: string
  nextAriaLabel?: string
  className?: string
}

export function CarouselNavButtons({
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  isDeepNavy = false,
  prevAriaLabel = 'Mục trước',
  nextAriaLabel = 'Mục tiếp theo',
  className = '',
}: CarouselNavButtonsProps) {
  const baseBtn =
    'inline-flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-accent-pink disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none'
  const colorClass = isDeepNavy
    ? 'border border-white/20 bg-deep-navy/80 text-white hover:bg-white/10 hover:border-accent-pink'
    : 'border border-deep-navy/20 bg-white text-deep-navy hover:bg-soft-pink/40 hover:border-bright-magenta'

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={prevAriaLabel}
        className={`${baseBtn} ${colorClass}`}
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
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label={nextAriaLabel}
        className={`${baseBtn} ${colorClass}`}
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
    </div>
  )
}
