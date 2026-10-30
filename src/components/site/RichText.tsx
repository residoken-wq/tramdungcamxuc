import React from 'react'
import type { AlignOption, FontSizeOption, TextColorOption } from '@/lib/brand/format-classes'
import { BODY_TEXT_SIZES, bodyColorClass, sizeClass } from '@/lib/brand/text-presets'

export interface RichTextProps {
  version?: number
  content: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  /** PK-10 format presets (deep-navy = automatic). */
  textSize?: FontSizeOption
  textColor?: TextColorOption
  align?: AlignOption
}

const BG_COLOR_CLASSES = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDING_CLASSES = {
  sm: 'py-6 px-4 sm:px-6',
  md: 'py-12 px-6 sm:px-8',
  lg: 'py-18 px-6 sm:px-12',
} as const

export function RichText({
  content,
  bgColor = 'warm-ivory',
  padding = 'md',
  textSize,
  textColor,
  align = 'left',
}: RichTextProps) {
  const paragraphs = (content || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const isDeepNavy = bgColor === 'deep-navy'
  const textColorClass = bodyColorClass(
    textColor,
    bgColor,
    isDeepNavy ? 'text-white/90' : 'text-deep-navy',
  )

  return (
    <section
      className={`w-full ${BG_COLOR_CLASSES[bgColor]} ${PADDING_CLASSES[padding]} transition-colors`}
    >
      <div className={`mx-auto max-w-3xl space-y-4${align === 'center' ? ' text-center' : ''}`}>
        {paragraphs.map((p, idx) => (
          <p
            key={idx}
            className={`font-ui ${sizeClass(BODY_TEXT_SIZES, textSize)} leading-relaxed ${textColorClass}`}
          >
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}
