import React from 'react'

export interface PillarOverviewCard {
  tone: 'butter-cream' | 'soft-pink' | 'mint-haze'
  pillarNumber: string
  title: string
  subtitleItalic: string
  stepsText: string
}

export interface ProgramOverviewProps {
  version?: number
  seriesLabel?: string
  title: string
  showAccentBar?: boolean
  topStripLabel?: string
  topStripText?: string
  pillars?: PillarOverviewCard[]
  middleStripLabel?: string
  middleStripText?: string
  bottomStripLabel?: string
  bottomStripText?: string
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

const PILLAR_TONES = {
  'butter-cream': 'bg-butter-cream text-deep-navy border-deep-navy/10',
  'soft-pink': 'bg-soft-pink text-deep-navy border-deep-navy/10',
  'mint-haze': 'bg-mint-haze text-deep-navy border-deep-navy/10',
} as const

export function ProgramOverview({
  seriesLabel,
  title,
  showAccentBar = true,
  topStripLabel,
  topStripText,
  pillars = [],
  middleStripLabel,
  middleStripText,
  bottomStripLabel,
  bottomStripText,
  bgColor = 'warm-ivory',
  padding = 'md',
}: ProgramOverviewProps) {
  const isDeepNavy = bgColor === 'deep-navy'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-left">
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

        {/* Top Strip: Nền tảng chung. QA PK-28b: label deep-navy, bright-magenta is 4.4:1 on lavender-mist. */}
        {(topStripLabel || topStripText) && (
          <div
            data-eb-card=""
            className="bg-lavender-mist rounded-xl p-4 sm:p-5 border border-deep-navy/10 shadow-xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left"
          >
            {topStripLabel && (
              <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-navy shrink-0">
                {topStripLabel}
              </span>
            )}
            {topStripText && (
              <p className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/85 flex-1">
                {topStripText}
              </p>
            )}
          </div>
        )}

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              data-eb-card=""
              className={`rounded-2xl p-6 sm:p-7 border shadow-soft flex flex-col justify-between text-left h-full ${
                PILLAR_TONES[pillar.tone] || PILLAR_TONES['butter-cream']
              }`}
            >
              <div className="flex flex-col gap-3">
                <span className="font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/70">
                  {pillar.pillarNumber}
                </span>
                <h3 className="font-ui font-bold text-lg sm:text-xl text-deep-navy leading-snug">
                  {pillar.title}
                </h3>
              </div>

              <div className="pt-4 border-t border-deep-navy/15 flex flex-col gap-2 mt-6">
                <p className="font-quote text-base sm:text-lg italic text-bright-magenta leading-relaxed">
                  {pillar.subtitleItalic}
                </p>
                <p className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-deep-navy leading-relaxed">
                  {pillar.stepsText}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Strip: Nhịp điệu triển khai (Dashed) */}
        {(middleStripLabel || middleStripText) && (
          <div
            data-eb-card=""
            className="rounded-xl p-4 sm:p-5 border-2 border-dashed border-bright-magenta bg-white/60 shadow-xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left"
          >
            {middleStripLabel && (
              <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-bright-magenta shrink-0">
                {middleStripLabel}
              </span>
            )}
            {middleStripText && (
              <p className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/85 flex-1">
                {middleStripText}
              </p>
            )}
          </div>
        )}

        {/* Bottom Strip: Sẵn sàng cho giai đoạn 2 (Navy) */}
        {(bottomStripLabel || bottomStripText) && (
          <div
            data-eb-card=""
            data-eb-card-solid=""
            className="bg-deep-navy text-white rounded-xl p-4 sm:p-5 border border-white/20 shadow-xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left"
          >
            {bottomStripLabel && (
              <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-soft-pink shrink-0">
                {bottomStripLabel}
              </span>
            )}
            {bottomStripText && (
              <p className="font-ui text-xs sm:text-sm leading-relaxed text-white/90 flex-1">
                {bottomStripText}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
