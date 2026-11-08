import React from 'react'

export interface NumberedStepCard {
  number: string
  title: string
  text?: string
  subLines?: Array<{
    label: string
    text: string
  }>
}

export interface NumberedStepsStripProps {
  version?: number
  seriesLabel?: string
  title: string
  showAccentBar?: boolean
  steps?: NumberedStepCard[]
  outputStripLabel?: string
  outputStripText?: string
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

export function NumberedStepsStrip({
  seriesLabel,
  title,
  showAccentBar = true,
  steps = [],
  outputStripLabel,
  outputStripText,
  bottomQuote,
  bgColor = 'warm-ivory',
  padding = 'md',
}: NumberedStepsStripProps) {
  const isDeepNavy = bgColor === 'deep-navy'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl flex flex-col gap-6 text-left">
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

        {/* 5 Cards across */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
          {steps.map((st, idx) => (
            <div
              key={idx}
              data-eb-card=""
              className="bg-white rounded-2xl p-5 sm:p-6 border border-deep-navy/10 shadow-soft flex flex-col justify-start gap-2.5 text-left h-full"
            >
              <span className="font-display text-4xl sm:text-5xl text-bright-magenta leading-none">
                {st.number}
              </span>
              <h3 className="font-ui font-bold text-sm sm:text-base text-deep-navy leading-snug">
                {st.title}
              </h3>

              {st.text && (
                <p className="font-ui text-xs text-deep-navy/80 leading-relaxed mt-1">
                  {st.text}
                </p>
              )}

              {st.subLines && st.subLines.length > 0 && (
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-deep-navy/10">
                  {st.subLines.map((line, lIdx) => (
                    <div key={lIdx} className="flex flex-col gap-0.5">
                      <span className="font-ui text-xs font-bold text-bright-magenta">
                        {line.label}
                      </span>
                      <span className="font-ui text-xs text-deep-navy/80 leading-relaxed">
                        {line.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Output Strip */}
        {(outputStripLabel || outputStripText) && (
          <div
            data-eb-card=""
            className="bg-white rounded-2xl p-5 sm:p-6 border border-deep-navy/10 shadow-soft flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left"
          >
            {outputStripLabel && (
              <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-bright-magenta shrink-0">
                {outputStripLabel}
              </span>
            )}
            {outputStripText && (
              <p className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/85 flex-1">
                {outputStripText}
              </p>
            )}
          </div>
        )}

        {/* Optional Quote */}
        {bottomQuote && (
          <p className="font-quote text-base sm:text-lg italic text-bright-magenta leading-relaxed mt-2 text-left">
            {bottomQuote}
          </p>
        )}
      </div>
    </section>
  )
}
