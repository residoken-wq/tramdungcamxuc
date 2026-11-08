import React from 'react'

export interface StatItemData {
  stat: string
  text: string
}

export interface ProfileCardData {
  eyebrow?: string
  quote: string
  items: string[]
}

export interface ContextProfileProps {
  version?: number
  seriesLabel?: string
  title: string
  showAccentBar?: boolean
  statCards?: StatItemData[]
  italicQuoteLeft?: string
  profileCard?: ProfileCardData
  sourceNote?: string
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
  sm: 'py-10 px-6 sm:px-8',
  md: 'py-14 px-6 sm:px-12',
  lg: 'py-18 px-8 sm:px-14',
} as const

// Render text with markdown-style **bold** markers
function renderBoldText(raw: string) {
  const parts = raw.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-deep-navy">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export function ContextProfile({
  seriesLabel,
  title,
  showAccentBar = true,
  statCards = [],
  italicQuoteLeft,
  profileCard,
  sourceNote,
  bgColor = 'warm-ivory',
  padding = 'md',
}: ContextProfileProps) {
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
        </div>

        {/* 2 Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Stat cards & quote */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              {statCards.map((sc, idx) => (
                <div
                  key={idx}
                  data-eb-card=""
                  className="bg-white rounded-2xl p-6 sm:p-7 border border-deep-navy/10 shadow-soft flex items-center gap-6"
                >
                  <span className="font-display text-5xl sm:text-6xl text-bright-magenta tracking-tight shrink-0 min-w-[120px] text-center">
                    {sc.stat}
                  </span>
                  <p className="font-ui text-sm sm:text-base leading-relaxed text-deep-navy/85 flex-1">
                    {renderBoldText(sc.text)}
                  </p>
                </div>
              ))}
            </div>

            {italicQuoteLeft && (
              <p className="font-quote text-base sm:text-lg italic text-bright-magenta leading-relaxed text-left mt-2">
                {italicQuoteLeft}
              </p>
            )}
          </div>

          {/* Right Column: Profile Card */}
          <div className="lg:col-span-6 flex flex-col">
            {profileCard && (
              <div
                data-eb-card=""
                className="bg-lavender-mist rounded-2xl p-7 sm:p-8 border border-deep-navy/10 shadow-soft flex flex-col justify-between h-full text-left"
              >
                <div>
                  {profileCard.eyebrow && (
                    <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-navy block mb-3">
                      {profileCard.eyebrow}
                    </span>
                  )}
                  {profileCard.quote && (
                    <p className="font-quote text-lg sm:text-xl italic text-deep-navy leading-relaxed mb-6">
                      {profileCard.quote}
                    </p>
                  )}
                  {profileCard.items && profileCard.items.length > 0 && (
                    <ul className="flex flex-col gap-2.5">
                      {profileCard.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full bg-deep-navy/60 mt-2 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="font-ui text-sm sm:text-base leading-relaxed text-deep-navy/85">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Source Note Footer */}
        {sourceNote && (
          <p className="mt-8 text-left font-ui text-xs text-deep-navy/60 leading-relaxed">
            {sourceNote}
          </p>
        )}
      </div>
    </section>
  )
}
