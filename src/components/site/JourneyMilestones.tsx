import React from 'react'

export interface BigStatMilestone {
  number: string
  title: string
  description: string
}

export interface SmallMilestoneCard {
  title: string
  subtitle: string
  tone?: 'lavender-mist' | 'white'
}

export interface JourneyMilestonesProps {
  version?: number
  seriesLabel?: string
  title: string
  showAccentBar?: boolean
  topStats?: BigStatMilestone[]
  group1Title?: string
  group1Cards?: SmallMilestoneCard[]
  group2Title?: string
  group2Cards?: SmallMilestoneCard[]
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

export function JourneyMilestones({
  seriesLabel,
  title,
  showAccentBar = true,
  topStats = [],
  group1Title,
  group1Cards = [],
  group2Title,
  group2Cards = [],
  bgColor = 'warm-ivory',
  padding = 'md',
}: JourneyMilestonesProps) {
  const isDeepNavy = bgColor === 'deep-navy'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl flex flex-col gap-8 text-left">
        {/* Header */}
        <div>
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

        {/* Top 3 Big Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {topStats.map((stat, idx) => (
            <div
              key={idx}
              data-eb-card=""
              className="bg-white rounded-2xl p-6 sm:p-7 border border-deep-navy/10 shadow-soft flex items-center gap-6"
            >
              <span className="font-display text-6xl sm:text-7xl text-bright-magenta shrink-0 leading-none">
                {stat.number}
              </span>
              <div className="flex flex-col gap-1 flex-1">
                <h3 className="font-ui font-bold text-base sm:text-lg text-deep-navy leading-snug">
                  {stat.title}
                </h3>
                <p className="font-ui text-xs sm:text-sm text-deep-navy/75 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section: 2 Groups */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Group 1: TRƯỚC NGÀY 1 */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {group1Title && (
              <div className="pb-2 border-b-2 border-deep-navy/20">
                <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-navy">
                  {group1Title}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group1Cards.map((card, idx) => (
                <div
                  key={idx}
                  data-eb-card=""
                  className="bg-lavender-mist rounded-xl p-4 sm:p-5 border border-deep-navy/10 shadow-xs flex flex-col justify-center gap-1"
                >
                  <h4 className="font-ui font-bold text-sm sm:text-base text-deep-navy">
                    {card.title}
                  </h4>
                  <p className="font-ui text-xs text-deep-navy/75">{card.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: 28 NGÀY THỰC HÀNH CÓ ĐỒNG HÀNH */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {group2Title && (
              <div className="pb-2 border-b-2 border-bright-magenta">
                <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-bright-magenta">
                  {group2Title}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {group2Cards.map((card, idx) => (
                <div
                  key={idx}
                  data-eb-card=""
                  className="bg-white rounded-xl p-4 sm:p-5 border border-deep-navy/10 shadow-xs flex flex-col justify-center gap-1"
                >
                  <h4 className="font-ui font-bold text-sm sm:text-base text-deep-navy">
                    {card.title}
                  </h4>
                  <p className="font-ui text-xs text-deep-navy/75">{card.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
