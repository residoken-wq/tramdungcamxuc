import React from 'react'

export interface ProgramWishCard {
  tone: 'butter-cream' | 'soft-pink' | 'mint-haze' | 'deep-navy'
  label: string
  title: string
  text: string
}

export interface ProgramWishesProps {
  version?: number
  seriesLabel?: string
  title: string
  showAccentBar?: boolean
  topQuote?: string
  cards?: ProgramWishCard[]
  calloutTitle?: string
  calloutText?: string
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

const CARD_TONES = {
  'butter-cream': 'bg-butter-cream text-deep-navy border-deep-navy/10',
  'soft-pink': 'bg-soft-pink text-deep-navy border-deep-navy/10',
  'mint-haze': 'bg-mint-haze text-deep-navy border-deep-navy/10',
  'deep-navy': 'bg-deep-navy text-white border-white/20',
} as const

export function ProgramWishes({
  seriesLabel,
  title,
  showAccentBar = true,
  topQuote,
  cards = [],
  calloutTitle,
  calloutText,
  bgColor = 'warm-ivory',
  padding = 'md',
}: ProgramWishesProps) {
  const isDeepNavy = bgColor === 'deep-navy'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 text-left">
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
          {topQuote && (
            <p className="mt-4 font-quote text-lg sm:text-xl lg:text-2xl italic text-bright-magenta leading-relaxed">
              {topQuote}
            </p>
          )}
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch mb-6">
          {cards.map((card, idx) => {
            const isNavyCard = card.tone === 'deep-navy'
            return (
              <div
                key={idx}
                data-eb-card=""
                data-eb-card-solid={isNavyCard ? '' : undefined}
                className={`rounded-2xl p-6 border shadow-soft flex flex-col justify-between text-left h-full ${
                  CARD_TONES[card.tone] || CARD_TONES['butter-cream']
                }`}
              >
                <div>
                  <span
                    className={`font-ui text-xs font-bold uppercase tracking-wider block mb-3 ${
                      isNavyCard ? 'text-accent-pink' : 'text-bright-magenta'
                    }`}
                  >
                    {card.label}
                  </span>
                  <h3
                    className={`font-ui font-bold text-base sm:text-lg mb-2 leading-snug ${
                      isNavyCard ? 'text-white' : 'text-deep-navy'
                    }`}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={`font-ui text-xs sm:text-sm leading-relaxed ${
                      isNavyCard ? 'text-white/85' : 'text-deep-navy/80'
                    }`}
                  >
                    {card.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Callout Strip */}
        {(calloutTitle || calloutText) && (
          <div
            data-eb-card=""
            className="bg-white rounded-2xl p-5 sm:p-6 border border-deep-navy/10 shadow-soft flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-left"
          >
            {calloutTitle && (
              <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-navy shrink-0">
                {calloutTitle}
              </span>
            )}
            {calloutText && (
              <p className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/85 flex-1">
                {calloutText}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
