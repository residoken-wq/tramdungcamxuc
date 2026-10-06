import React from 'react'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'

export interface HeroEntry {
  label: string
  description: string
  buttonText: string
  buttonLink: string
}

export interface HeroTwoEntriesProps {
  version?: number
  seriesLabel?: string
  titleLine1: string
  titleLine2: string
  emotionLine?: string
  entry1: HeroEntry
  entry2: HeroEntry
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
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function HeroTwoEntries({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  entry1,
  entry2,
  bgColor = 'warm-ivory',
  padding = 'md',
}: HeroTwoEntriesProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const cardBgClass = isDeepNavy
    ? 'bg-white/10 text-white border-white/20'
    : 'bg-white text-deep-navy border-deep-navy/10'
  const descColorClass = isDeepNavy ? 'text-white/90' : 'text-deep-navy/80'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'

  const entry1SafeHref = safeHref(entry1?.buttonLink)
  const entry2SafeHref = safeHref(entry2?.buttonLink)

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-14 flex flex-col items-center">
          {seriesLabel && (
            <span
              className={`mb-3 font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
            >
              {seriesLabel}
            </span>
          )}

          {/* Signature Two-Tone Heading (Anton) */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-tight leading-[1.15]">
            <span className={isDeepNavy ? 'text-white' : 'text-deep-navy'}>{titleLine1}</span>{' '}
            <span className={titleLine2ColorClass}>{titleLine2}</span>
          </h1>

          {/* Emotional Quote (Playfair Display Italic) */}
          {emotionLine && (
            <p
              className={`mt-4 font-quote text-lg sm:text-xl italic max-w-2xl ${isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'}`}
            >
              {emotionLine}
            </p>
          )}
        </div>

        {/* 2 Entries Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Entry 1 */}
          <div
            className={`flex flex-col justify-between p-6 sm:p-8 rounded-card border shadow-soft ${cardBgClass}`}
          >
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-ui font-bold uppercase tracking-wider bg-soft-pink text-deep-navy mb-4">
                {entry1.label}
              </span>
              <p className={`font-ui text-base leading-relaxed mb-6 ${descColorClass}`}>
                {entry1.description}
              </p>
            </div>
            {entry1SafeHref && entry1?.buttonText && (
              <div>
                <Button href={entry1SafeHref} variant="primary" size="md" className="w-full">
                  {entry1.buttonText}
                </Button>
              </div>
            )}
          </div>

          {/* Entry 2 */}
          <div
            className={`flex flex-col justify-between p-6 sm:p-8 rounded-card border shadow-soft ${cardBgClass}`}
          >
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-ui font-bold uppercase tracking-wider bg-lavender-mist text-deep-navy mb-4">
                {entry2.label}
              </span>
              <p className={`font-ui text-base leading-relaxed mb-6 ${descColorClass}`}>
                {entry2.description}
              </p>
            </div>
            {entry2SafeHref && entry2?.buttonText && (
              <div>
                <Button href={entry2SafeHref} variant="secondary" size="md" className="w-full">
                  {entry2.buttonText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
