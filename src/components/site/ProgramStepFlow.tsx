import React from 'react'

export interface StepSubColumn {
  title: string
  items: string[]
}

export interface StepCardItem {
  eyebrow: string
  title: string
  chip?: string
  subtitle?: string
  description?: string
  bullets?: string[]
  subColumns?: {
    left: StepSubColumn
    right: StepSubColumn
  }
  takeawayTitle?: string
  takeawayText: string
}

export interface ProgramStepFlowProps {
  version?: number
  seriesLabel?: string
  title: string
  showAccentBar?: boolean
  emotionLine?: string
  steps?: StepCardItem[]
  takeawayTone?: 'butter-cream' | 'soft-pink' | 'mint-haze'
  bottomStripLeftLabel?: string
  bottomStripLeftText?: string
  bottomStripRightText?: string
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

const TAKEAWAY_TONES = {
  'butter-cream': 'bg-butter-cream text-deep-navy',
  'soft-pink': 'bg-soft-pink text-deep-navy',
  'mint-haze': 'bg-mint-haze text-deep-navy',
} as const

export function ProgramStepFlow({
  seriesLabel,
  title,
  showAccentBar = true,
  emotionLine,
  steps = [],
  takeawayTone = 'butter-cream',
  bottomStripLeftLabel,
  bottomStripLeftText,
  bottomStripRightText,
  bgColor = 'warm-ivory',
  padding = 'md',
}: ProgramStepFlowProps) {
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
          {emotionLine && (
            <p className="mt-3 font-quote text-lg sm:text-xl italic text-bright-magenta leading-relaxed">
              {emotionLine}
            </p>
          )}
        </div>

        {/* 3 Step Cards with Arrow Connectors */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-6">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div
                data-eb-card=""
                className="flex-1 bg-white rounded-2xl p-6 sm:p-7 border border-deep-navy/10 shadow-soft flex flex-col justify-between gap-5 text-left"
              >
                {/* Top Section */}
                <div className="flex flex-col gap-3">
                  <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-bright-magenta">
                    {step.eyebrow}
                  </span>

                  <div>
                    <h3 className="font-ui font-bold text-lg sm:text-xl text-deep-navy leading-snug">
                      {step.title}
                    </h3>
                    {step.subtitle && (
                      <p className="font-ui text-xs sm:text-sm font-semibold text-deep-navy/80 mt-1">
                        {step.subtitle}
                      </p>
                    )}
                  </div>

                  {step.chip && (
                    <div>
                      <span className="inline-block rounded-full bg-lavender-mist px-3 py-1 font-ui text-xs font-semibold text-deep-navy">
                        {step.chip}
                      </span>
                    </div>
                  )}

                  {step.description && (
                    <p className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/85">
                      {step.description}
                    </p>
                  )}

                  {/* Bullet points */}
                  {step.bullets && step.bullets.length > 0 && (
                    <ul className="flex flex-col gap-2 mt-1">
                      {step.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full bg-deep-navy/60 mt-1.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="font-ui text-xs sm:text-sm text-deep-navy/85 leading-relaxed">
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Sub-columns (Nam tính / Nữ tính for Page 15) */}
                  {step.subColumns && (
                    <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-deep-navy/10">
                      <div>
                        <span className="font-ui text-xs font-bold text-bright-magenta uppercase block mb-1.5">
                          {step.subColumns.left.title}
                        </span>
                        <ul className="flex flex-col gap-1">
                          {step.subColumns.left.items.map((it, lIdx) => (
                            <li key={lIdx} className="font-ui text-xs text-deep-navy/85">
                              {it}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-ui text-xs font-bold text-bright-magenta uppercase block mb-1.5">
                          {step.subColumns.right.title}
                        </span>
                        <ul className="flex flex-col gap-1">
                          {step.subColumns.right.items.map((it, rIdx) => (
                            <li key={rIdx} className="font-ui text-xs text-deep-navy/85">
                              {it}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Inner Take-away card */}
                {step.takeawayText && (
                  <div
                    className={`rounded-xl p-4 mt-4 flex flex-col gap-1 ${
                      TAKEAWAY_TONES[takeawayTone] || TAKEAWAY_TONES['butter-cream']
                    }`}
                  >
                    <span className="font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta">
                      {step.takeawayTitle || 'Mang về'}
                    </span>
                    <p className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/90">
                      {step.takeawayText}
                    </p>
                  </div>
                )}
              </div>

              {/* Arrow Connector between cards on desktop */}
              {idx < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="shrink-0 self-center text-bright-magenta select-none my-1"
                >
                  <span className="hidden lg:inline-block text-3xl font-bold">→</span>
                  <span className="lg:hidden text-2xl font-bold">↓</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Bottom Strips (Optional for Page 13 & 15) */}
        {(bottomStripLeftText || bottomStripRightText) && (
          <div className="flex flex-col lg:flex-row items-stretch gap-4">
            {bottomStripLeftText && (
              <div
                data-eb-card=""
                className="flex-1 bg-white rounded-xl p-4 sm:p-5 border border-deep-navy/10 shadow-xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-left"
              >
                {bottomStripLeftLabel && (
                  <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-bright-magenta shrink-0">
                    {bottomStripLeftLabel}
                  </span>
                )}
                <p className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/85 flex-1">
                  {bottomStripLeftText}
                </p>
              </div>
            )}

            {bottomStripRightText && (
              <div
                data-eb-card=""
                className="lg:w-1/3 rounded-xl p-4 sm:p-5 border-2 border-dashed border-bright-magenta/60 bg-white/40 shadow-xs flex items-center text-left"
              >
                <p className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/85">
                  {bottomStripRightText}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
