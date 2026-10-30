import React from 'react'
import type { AlignOption, FontSizeOption } from '@/lib/brand/format-classes'
import { QUOTE_TEXT_SIZES, sizeClass } from '@/lib/brand/text-presets'

export interface QuoteBlockProps {
  quote: string
  cite?: string
  roleOrContext?: string
  className?: string
  theme?: 'light' | 'dark'
  /** PK-10 format presets. */
  size?: FontSizeOption
  align?: AlignOption
}

export function QuoteBlock({
  quote,
  cite,
  roleOrContext,
  className = '',
  theme = 'light',
  size,
  align = 'left',
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
    <figure
      className={`relative my-6 rounded-card ${bgClass}${align === 'center' ? ' text-center' : ''} ${className}`}
    >
      <blockquote
        className={`font-quote ${sizeClass(QUOTE_TEXT_SIZES, size)} italic leading-relaxed ${quoteTextClass}`}
      >
        &ldquo;{quote}&rdquo;
      </blockquote>

      {(cite || roleOrContext) && (
        <figcaption
          className={`mt-4 flex flex-wrap items-baseline gap-2 border-t ${borderClass} pt-3${align === 'center' ? ' justify-center' : ''}`}
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
