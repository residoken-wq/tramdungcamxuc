import React from 'react'

export interface Phase1StripItem {
  tone: 'butter-cream' | 'soft-pink' | 'mint-haze'
  title: string
  text: string
}

export interface PhaseArchitectureProps {
  version?: number
  seriesLabel?: string
  title: string
  showAccentBar?: boolean
  phase1Label: string
  phase1Title?: string
  phase1Items?: Phase1StripItem[]
  phase2Label: string
  phase2Title: string
  phase2Subtitle?: string
  phase2Text: string
  phase2Chip?: string
  noteBoxLabel?: string
  noteBoxText?: string
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

const STRIP_TONES = {
  'butter-cream': 'bg-butter-cream text-deep-navy',
  'soft-pink': 'bg-soft-pink text-deep-navy',
  'mint-haze': 'bg-mint-haze text-deep-navy',
} as const

export function PhaseArchitecture({
  seriesLabel,
  title,
  showAccentBar = true,
  phase1Label,
  phase1Title,
  phase1Items = [],
  phase2Label,
  phase2Title,
  phase2Subtitle,
  phase2Text,
  phase2Chip,
  noteBoxLabel,
  noteBoxText,
  bottomQuote,
  bgColor = 'warm-ivory',
  padding = 'md',
}: PhaseArchitectureProps) {
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

        {/* 2 Main Phase Cards with Arrow Connector */}
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 mb-6">
          {/* Left Card: Phase 1 */}
          <div
            data-eb-card=""
            className="w-full lg:flex-1 bg-white rounded-2xl p-6 sm:p-8 border border-deep-navy/10 shadow-soft text-left flex flex-col gap-4"
          >
            <div>
              <span className="font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta block mb-1">
                {phase1Label}
              </span>
              {phase1Title && (
                <h3 className="font-ui font-bold text-lg sm:text-xl text-deep-navy">
                  {phase1Title}
                </h3>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {phase1Items.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-3.5 sm:p-4 flex flex-col gap-0.5 ${
                    STRIP_TONES[item.tone] || STRIP_TONES['butter-cream']
                  }`}
                >
                  <span className="font-ui font-bold text-sm sm:text-base text-deep-navy leading-snug">
                    {item.title}
                  </span>
                  <span className="font-ui text-xs sm:text-sm text-deep-navy/80 leading-relaxed">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow in middle */}
          <div
            aria-hidden="true"
            className="shrink-0 flex items-center justify-center text-bright-magenta select-none"
          >
            <span className="hidden lg:inline-block text-3xl font-bold">→</span>
            <span className="lg:hidden text-2xl font-bold my-1">↓</span>
          </div>

          {/* Right Card: Phase 2 */}
          <div
            data-eb-card=""
            data-eb-card-solid=""
            className="w-full lg:flex-1 bg-deep-navy text-white rounded-2xl p-6 sm:p-8 border border-white/20 shadow-soft text-left flex flex-col justify-between gap-5"
          >
            <div>
              <span className="font-ui text-xs font-bold uppercase tracking-wider text-accent-pink block mb-2">
                {phase2Label}
              </span>
              <h3 className="font-ui font-bold text-2xl sm:text-3xl text-white mb-2 leading-snug">
                {phase2Title}
              </h3>
              {phase2Subtitle && (
                <p className="font-quote text-base sm:text-lg italic text-white/80 leading-relaxed mb-4">
                  {phase2Subtitle}
                </p>
              )}
              <p className="font-ui text-xs sm:text-sm leading-relaxed text-white/85">
                {phase2Text}
              </p>
            </div>

            {phase2Chip && (
              <div className="pt-2">
                <span className="inline-block rounded-full border-2 border-dashed border-accent-pink px-4 py-2 font-ui text-xs sm:text-sm font-semibold text-white/95">
                  {phase2Chip}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Note Box */}
        {(noteBoxLabel || noteBoxText) && (
          <div
            data-eb-card=""
            className="bg-soft-pink/50 rounded-2xl p-5 sm:p-6 border border-soft-pink shadow-xs text-left flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
          >
            {noteBoxLabel && (
              <span className="font-ui text-xs sm:text-sm font-bold uppercase tracking-wider text-bright-magenta shrink-0">
                {noteBoxLabel}
              </span>
            )}
            {noteBoxText && (
              <p className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/85 flex-1">
                {noteBoxText}
              </p>
            )}
          </div>
        )}

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
