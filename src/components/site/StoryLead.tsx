import React from 'react'

export interface StoryLeadProps {
  version?: number
  seriesLabel?: string
  titleLine1: string
  titleLine2?: string
  emotionLine?: string
  content: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-10 px-6 sm:px-10',
  md: 'py-16 px-6 sm:px-12',
  lg: 'py-20 px-8 sm:px-16',
} as const

export function StoryLead({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  content,
  bgColor = 'lavender-mist',
  padding = 'lg',
}: StoryLeadProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  // QA PK-28b: small bright-magenta text is 4.4:1 on lavender-mist (AA needs 4.5).
  const isLavender = bgColor === 'lavender-mist'

  return (
    <section
      className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors relative overflow-hidden`}
    >
      <div className="mx-auto max-w-4xl text-left flex flex-col items-start">
        {seriesLabel && (
          <span
            className={`mb-4 font-ui text-xs sm:text-sm font-bold uppercase tracking-widest ${
              isDeepNavy ? 'text-soft-pink' : isLavender ? 'text-deep-navy' : 'text-bright-magenta'
            }`}
          >
            {seriesLabel}
          </span>
        )}

        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight !leading-[1.25] text-deep-navy">
          <span className="block text-deep-navy">{titleLine1}</span>
          {titleLine2 && <span className="block text-deep-navy">{titleLine2}</span>}
        </h2>

        {emotionLine && (
          <p className="mt-4 font-quote text-2xl lg:text-3xl italic text-bright-magenta leading-relaxed">
            {emotionLine}
          </p>
        )}

        <span
          className="inline-block w-14 h-1 rounded bg-accent-pink mt-4 mb-6"
          aria-hidden="true"
        />

        <p className="font-ui text-base sm:text-lg lg:text-xl leading-relaxed text-deep-navy/90 max-w-3xl">
          {content}
        </p>
      </div>
    </section>
  )
}
