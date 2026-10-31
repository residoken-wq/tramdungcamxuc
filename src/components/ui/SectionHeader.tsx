import React from 'react'
import {
  textColorClass,
  emotionColorClass,
  fontSizeClass,
  type TextColorOption,
  type FontSizeOption,
} from '@/lib/brand/format-classes'

export type SectionHeadingLevel = 'h1' | 'h2' | 'h3'

export interface SectionHeaderProps {
  version?: number
  seriesLabel?: string
  titleLine1: string
  titleLine2?: string
  emotionLine?: string
  as?: SectionHeadingLevel
  align?: 'left' | 'center'
  className?: string
  line1Color?: TextColorOption
  line2Color?: TextColorOption
  eyebrowColor?: TextColorOption
  emotionColor?: TextColorOption
  titleSize?: FontSizeOption
  emotionSize?: FontSizeOption
}

export function SectionHeader({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  as: HeadingTag = 'h2',
  align = 'left',
  className = '',
  line1Color = 'deep-navy',
  line2Color = 'bright-magenta',
  eyebrowColor = 'bright-magenta',
  emotionColor = 'deep-navy',
  titleSize = 'md',
  emotionSize = 'md',
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  const headingSizeClasses = fontSizeClass('title', titleSize, HeadingTag)
  const line1ColorClass = textColorClass(line1Color)
  const line2ColorClass = textColorClass(line2Color)
  const eyebrowColorClass = textColorClass(eyebrowColor)
  const emotionColorStyle = emotionColorClass(emotionColor)
  const emotionSizeStyle = fontSizeClass('quote', emotionSize)

  return (
    <header className={`flex flex-col ${alignClass} ${className}`}>
      {/* Series Label (Montserrat SemiBold/Bold, WCAG AA compliant on light background) */}
      {seriesLabel && (
        <span
          className={`mb-4 font-ui text-xs font-bold uppercase tracking-widest ${eyebrowColorClass}`}
        >
          {seriesLabel}
        </span>
      )}

      {/* Signature Two-Tone Heading (Anton: line 1 deep-navy, line 2 bright-magenta by default) */}
      <HeadingTag
        className={`font-display uppercase tracking-tight leading-[1.3] ${headingSizeClasses}`}
      >
        <span className={`block ${line1ColorClass}`}>{titleLine1}</span>
        {titleLine2 && <span className={`block ${line2ColorClass}`}>{titleLine2}</span>}
      </HeadingTag>

      {/* Emotion Line (Playfair Display Italic) */}
      {emotionLine && (
        <p
          className={`mt-3.5 font-quote ${emotionSizeStyle} italic ${emotionColorStyle} max-w-2xl`}
        >
          {emotionLine}
        </p>
      )}
    </header>
  )
}
