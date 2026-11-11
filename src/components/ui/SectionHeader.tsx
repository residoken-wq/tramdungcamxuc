import React from 'react'
import {
  textColorClass,
  emotionColorClass,
  fontSizeClass,
  type TextColorOption,
  type FontSizeOption,
} from '@/lib/brand/format-classes'
import { textTarget } from '@/puck/style/text-target'
import { renderHighlightedTitle } from '@/components/ui/TwoToneTitle'

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
  titleCase?: 'upper' | 'none'
  accentBar?: boolean
  showAccentBar?: boolean
}

export function SectionHeader({
  id,
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
  titleCase = 'upper',
  accentBar = false,
  showAccentBar = false,
}: SectionHeaderProps & { id?: string }) {
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
          {...textTarget(id, 'seriesLabel')}
          className={`mb-[var(--tdcx-eyebrow-gap,1rem)] font-ui text-xs font-bold uppercase tracking-widest ${eyebrowColorClass}`}
        >
          {seriesLabel}
        </span>
      )}

      {/* Signature Two-Tone Heading (Anton: line 1 deep-navy, line 2 bright-magenta by default) */}
      <HeadingTag
        className={`font-display ${titleCase === 'none' ? '' : 'uppercase'} tracking-tight !leading-[var(--tdcx-title-lh,1.3)] ${headingSizeClasses}`}
      >
        <span {...textTarget(id, 'titleLine1')} className={`block ${line1ColorClass}`}>
          {renderHighlightedTitle(titleLine1, {
            isDark: line1Color === 'soft-pink',
          })}
        </span>
        {titleLine2 && (
          <span {...textTarget(id, 'titleLine2')} className={`block ${line2ColorClass}`}>
            {renderHighlightedTitle(titleLine2, {
              isDark: line2Color === 'soft-pink',
            })}
          </span>
        )}
      </HeadingTag>

      {(accentBar || showAccentBar) && (
        <span
          className="inline-block w-14 h-1 rounded bg-accent-pink mt-3 mb-1"
          aria-hidden="true"
        />
      )}

      {/* Emotion Line (Playfair Display Italic) */}
      {emotionLine && (
        <p
          {...textTarget(id, 'emotionLine')}
          className={`mt-[var(--tdcx-emotion-gap,0.875rem)] font-quote ${emotionSizeStyle} italic ${emotionColorStyle} max-w-2xl`}
        >
          {emotionLine}
        </p>
      )}
    </header>
  )
}
