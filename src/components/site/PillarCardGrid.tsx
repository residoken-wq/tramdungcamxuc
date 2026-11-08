import React from 'react'

export interface PillarCardSubItem {
  title: string
  text: string
}

export interface PillarCardItem {
  tone: 'butter-cream' | 'soft-pink' | 'mint-haze' | 'lavender-mist'
  label: string
  hasAccentBar?: boolean
  items: PillarCardSubItem[]
}

export interface PillarCardGridProps {
  version?: number
  seriesLabel?: string
  title: string
  showAccentBar?: boolean
  emotionLine?: string
  cards?: PillarCardItem[]
  bottomQuote?: string
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
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
  sm: 'py-10 px-6 sm:px-8',
  md: 'py-14 px-6 sm:px-12',
  lg: 'py-18 px-8 sm:px-14',
} as const

const TONE_CLASSES = {
  'butter-cream': 'bg-butter-cream text-deep-navy border-deep-navy/10',
  'soft-pink': 'bg-soft-pink text-deep-navy border-deep-navy/10',
  'mint-haze': 'bg-mint-haze text-deep-navy border-deep-navy/10',
  'lavender-mist': 'bg-lavender-mist text-deep-navy border-deep-navy/10',
} as const

export function PillarCardGrid({
  seriesLabel,
  title,
  showAccentBar = true,
  emotionLine,
  cards = [],
  bottomQuote,
  bgColor = 'warm-ivory',
  padding = 'md',
}: PillarCardGridProps) {
  const isDeepNavy = bgColor === 'deep-navy'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-left">
          {seriesLabel && (
            <span
              className={`mb-3 block font-ui text-xs sm:text-sm font-bold uppercase tracking-widest ${
                isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
              }`}
            >
              {seriesLabel}
            </span>
          )}
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-deep-navy tracking-tight !leading-[1.25]">
            {title}
          </h2>
          {showAccentBar && (
            <span
              className="inline-block w-14 h-1 rounded bg-accent-pink mt-3 mb-1"
              aria-hidden="true"
            />
          )}
          {emotionLine && (
            <p className="mt-3 font-quote text-lg sm:text-xl italic text-bright-magenta leading-relaxed">
              {emotionLine}
            </p>
          )}
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {cards.map((card, cIdx) => (
            <div
              key={cIdx}
              data-eb-card=""
              className={`rounded-2xl p-6 sm:p-7 border shadow-soft flex flex-col gap-5 text-left h-full ${
                TONE_CLASSES[card.tone] || TONE_CLASSES['butter-cream']
              }`}
            >
              {/* Card Label */}
              <div className="flex items-center gap-2">
                {card.hasAccentBar && (
                  <span className="w-1 h-4 rounded-full bg-accent-pink" aria-hidden="true" />
                )}
                <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-bright-magenta">
                  {card.label}
                </span>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-4 flex-1">
                {card.items?.map((item, iIdx) => (
                  <div key={iIdx} className="flex flex-col gap-1">
                    <h3 className="font-ui font-bold text-sm sm:text-base text-deep-navy leading-snug">
                      {item.title}
                    </h3>
                    <p className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/80">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Quote */}
        {bottomQuote && (
          <p className="mt-8 text-left font-quote text-base sm:text-lg italic text-bright-magenta leading-relaxed">
            {bottomQuote}
          </p>
        )}
      </div>
    </section>
  )
}
