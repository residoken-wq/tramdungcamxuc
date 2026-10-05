import React from 'react'

export type SectionHeadingLevel = 'h1' | 'h2' | 'h3'

export interface SectionHeaderProps {
  seriesLabel?: string
  titleLine1: string
  titleLine2?: string
  emotionLine?: string
  as?: SectionHeadingLevel
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeader({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  as: HeadingTag = 'h2',
  align = 'left',
  className = '',
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  const headingSizeClasses = {
    h1: 'text-4xl sm:text-5xl lg:text-6xl',
    h2: 'text-3xl sm:text-4xl lg:text-5xl',
    h3: 'text-2xl sm:text-3xl lg:text-4xl',
  }[HeadingTag]

  return (
    <header className={`flex flex-col ${alignClass} ${className}`}>
      {/* Series Label (Montserrat SemiBold/Bold, WCAG AA compliant on light background) */}
      {seriesLabel && (
        <span className="mb-4 font-ui text-xs font-bold uppercase tracking-widest text-bright-magenta">
          {seriesLabel}
        </span>
      )}

      {/* Signature Two-Tone Heading (Anton: line 1 deep-navy, line 2 bright-magenta) */}
      <HeadingTag className={`font-display uppercase tracking-tight leading-tight ${headingSizeClasses}`}>
        <span className="block text-deep-navy">{titleLine1}</span>
        {titleLine2 && <span className="block text-bright-magenta">{titleLine2}</span>}
      </HeadingTag>

      {/* Emotion Line (Playfair Display Italic) */}
      {emotionLine && (
        <p className="mt-3.5 font-quote text-lg sm:text-xl italic text-deep-navy/85 max-w-2xl">
          {emotionLine}
        </p>
      )}
    </header>
  )
}
