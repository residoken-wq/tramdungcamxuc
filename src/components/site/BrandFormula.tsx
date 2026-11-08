import React from 'react'

export interface FormulaStepItem {
  number: string
  title: string
  description: string
}

export interface BrandFormulaProps {
  version?: number
  seriesLabel?: string
  title: string
  showAccentBar?: boolean
  steps?: FormulaStepItem[]
  bottomQuoteLeft?: string
  planCardEyebrow?: string
  planCardSubtitle?: string
  planCardQuote?: string
  planItem1Title?: string
  planItem1Text?: string
  planItem2Title?: string
  planItem2Text?: string
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

export function BrandFormula({
  seriesLabel,
  title,
  showAccentBar = true,
  steps = [],
  bottomQuoteLeft,
  planCardEyebrow,
  planCardSubtitle,
  planCardQuote,
  planItem1Title,
  planItem1Text,
  planItem2Title,
  planItem2Text,
  bgColor = 'warm-ivory',
  padding = 'md',
}: BrandFormulaProps) {
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

        {/* 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 3 Numbered Cards + Quote */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-5 text-left">
            <div className="flex flex-col gap-4">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  data-eb-card=""
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-deep-navy/10 shadow-soft flex items-center gap-5"
                >
                  <span className="font-display text-5xl sm:text-6xl text-bright-magenta shrink-0 leading-none min-w-[48px] text-center">
                    {st.number}
                  </span>
                  <div className="flex flex-col gap-1 flex-1">
                    <h3 className="font-ui font-bold text-base sm:text-lg text-deep-navy leading-snug">
                      {st.title}
                    </h3>
                    <p className="font-ui text-xs sm:text-sm text-deep-navy/80 leading-relaxed">
                      {st.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {bottomQuoteLeft && (
              <p className="font-quote text-base sm:text-lg italic text-bright-magenta leading-relaxed mt-2">
                {bottomQuoteLeft}
              </p>
            )}
          </div>

          {/* Right Column: Habit Plan Minh Họa */}
          <div className="lg:col-span-6 flex flex-col">
            <div
              data-eb-card=""
              className="bg-white rounded-2xl p-6 sm:p-8 border border-deep-navy/10 shadow-soft flex flex-col justify-between h-full text-left"
            >
              <div className="flex flex-col gap-3">
                {planCardEyebrow && (
                  <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-bright-magenta">
                    {planCardEyebrow}
                  </span>
                )}
                {planCardSubtitle && (
                  <p className="font-ui text-xs sm:text-sm text-deep-navy/85">
                    {planCardSubtitle}
                  </p>
                )}
                {planCardQuote && (
                  <p className="font-quote text-lg sm:text-xl italic text-deep-navy leading-relaxed my-2">
                    {planCardQuote}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-deep-navy/10 mt-4">
                {planItem1Title && (
                  <div>
                    <h4 className="font-ui font-bold text-xs sm:text-sm uppercase tracking-wider text-bright-magenta mb-1">
                      {planItem1Title}
                    </h4>
                    {planItem1Text && (
                      <p className="font-ui text-xs sm:text-sm text-deep-navy/85">
                        {planItem1Text}
                      </p>
                    )}
                  </div>
                )}

                {planItem2Title && (
                  <div className="pt-3 border-t border-deep-navy/10">
                    <h4 className="font-ui font-bold text-xs sm:text-sm uppercase tracking-wider text-bright-magenta mb-1">
                      {planItem2Title}
                    </h4>
                    {planItem2Text && (
                      <p className="font-ui text-xs sm:text-sm text-deep-navy/85">
                        {planItem2Text}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
