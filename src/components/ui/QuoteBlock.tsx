import React from 'react'

export interface QuoteBlockProps {
  quote: string
  cite?: string
  roleOrContext?: string
  className?: string
  theme?: 'light' | 'dark'
}

export function QuoteBlock({
  quote,
  cite,
  roleOrContext,
  className = '',
  theme = 'light',
}: QuoteBlockProps) {
  const isDark = theme === 'dark'
  const bgClass = isDark
    ? 'border-l-4 border-accent-pink bg-white/10 p-6 sm:p-8 backdrop-blur-sm'
    : 'border-l-4 border-accent-pink bg-warm-ivory/60 p-6 sm:p-8 backdrop-blur-sm'
  const quoteTextClass = isDark ? 'text-white' : 'text-deep-navy'
  const citeClass = isDark ? 'text-soft-pink' : 'text-deep-navy'
  const roleClass = isDark ? 'text-white/70' : 'text-deep-navy/65'
  const borderClass = isDark ? 'border-white/15' : 'border-deep-navy/10'

  return (
    <figure className={`relative my-6 rounded-card ${bgClass} ${className}`}>
      <blockquote
        className={`font-quote text-xl sm:text-2xl italic leading-relaxed ${quoteTextClass}`}
      >
        &ldquo;{quote}&rdquo;
      </blockquote>

      {(cite || roleOrContext) && (
        <figcaption
          className={`mt-4 flex flex-wrap items-baseline gap-2 border-t ${borderClass} pt-3`}
        >
          {cite && (
            <cite className={`font-ui text-sm font-bold not-italic ${citeClass}`}>{cite}</cite>
          )}
          {roleOrContext && (
            <span className={`font-ui text-xs ${roleClass}`}>· {roleOrContext}</span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
