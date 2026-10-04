import React from 'react'

export interface QuoteBlockProps {
  quote: string
  cite?: string
  roleOrContext?: string
  className?: string
}

export function QuoteBlock({
  quote,
  cite,
  roleOrContext,
  className = '',
}: QuoteBlockProps) {
  return (
    <figure
      className={`relative my-6 rounded-card border-l-4 border-accent-pink bg-warm-ivory/60 p-6 sm:p-8 backdrop-blur-xs ${className}`}
    >
      <blockquote className="font-quote text-xl sm:text-2xl italic leading-relaxed text-deep-navy">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {(cite || roleOrContext) && (
        <figcaption className="mt-4 flex flex-wrap items-baseline gap-2 border-t border-deep-navy/10 pt-3">
          {cite && (
            <cite className="font-ui text-sm font-bold not-italic text-deep-navy">
              {cite}
            </cite>
          )}
          {roleOrContext && (
            <span className="font-ui text-xs text-deep-navy/65">
              · {roleOrContext}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
