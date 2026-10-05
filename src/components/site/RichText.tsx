import React from 'react'

export interface RichTextProps {
  content: string
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
    | 'bright-magenta'
    | 'accent-pink'
  padding?: 'sm' | 'md' | 'lg'
}

const BG_COLOR_CLASSES = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
  'bright-magenta': 'bg-bright-magenta text-white',
  'accent-pink': 'bg-accent-pink text-white',
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
}: RichTextProps) {
  const paragraphs = (content || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const isDarkBg = bgColor === 'deep-navy' || bgColor === 'bright-magenta' || bgColor === 'accent-pink'
  const textColorClass = isDarkBg ? 'text-white/90' : 'text-deep-navy'

  return (
    <section className={`w-full ${BG_COLOR_CLASSES[bgColor]} ${PADDING_CLASSES[padding]} transition-colors`}>
      <div className="mx-auto max-w-3xl space-y-4">
        {paragraphs.map((p, idx) => (
          <p key={idx} className={`font-ui text-base leading-relaxed ${textColorClass}`}>
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}
