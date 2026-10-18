import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'

export interface HeroStat {
  value: string
  label: string
}

export interface HeroImageProps {
  version?: number
  seriesLabel?: string
  titleLine1: string
  titleLine2: string
  emotionLine?: string
  mediaId?: string
  imageUrl?: string
  imageAlt?: string
  buttonText?: string
  buttonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  badges?: Array<{ text?: string } | string>
  stats?: HeroStat[]
  priority?: boolean
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
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function HeroImage({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  imageUrl,
  imageAlt,
  buttonText,
  buttonLink,
  secondaryButtonText,
  secondaryButtonLink,
  badges,
  stats,
  priority,
  bgColor = 'warm-ivory',
  padding = 'md',
}: HeroImageProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const buttonSafeHref = safeHref(buttonLink)
  const secondaryButtonSafeHref = safeHref(secondaryButtonLink)
  const hasValidImage = Boolean(imageUrl && imageAlt && imageAlt.trim().length > 0)

  const normalizedBadges = (badges || [])
    .map((b) => (typeof b === 'string' ? b : b?.text || ''))
    .filter(Boolean)

  const normalizedStats = (stats || []).filter((s) => s && s.value)

  const hasPrimaryButton = Boolean(buttonSafeHref && buttonText)
  const hasSecondaryButton = Boolean(secondaryButtonSafeHref && secondaryButtonText)

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl flex flex-col items-center text-center">
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

        {/* Badges / Chips strip (0-3 chips) */}
        {normalizedBadges.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {normalizedBadges.map((badge, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center px-3.5 py-1 rounded-full font-ui text-xs font-semibold ${
                  isDeepNavy
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-soft-pink text-deep-navy border border-soft-pink'
                }`}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {(hasPrimaryButton || hasSecondaryButton) && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            {hasPrimaryButton && (
              <Button href={buttonSafeHref!} variant="primary" size="md">
                {buttonText}
              </Button>
            )}
            {hasSecondaryButton && (
              <Button
                href={secondaryButtonSafeHref!}
                variant="ghost"
                size="md"
                className={isDeepNavy ? 'text-white border-white/40 hover:bg-white/10' : ''}
              >
                {secondaryButtonText}
              </Button>
            )}
          </div>
        )}

        {/* Small stats strip below buttons (0-3 items) */}
        {normalizedStats.length > 0 && (
          <div
            className={`mt-8 pt-6 border-t flex flex-wrap items-center justify-center gap-8 sm:gap-12 ${
              isDeepNavy ? 'border-white/20' : 'border-deep-navy/10'
            }`}
          >
            {normalizedStats.map((st, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span
                  className={`font-display text-2xl sm:text-3xl ${isDeepNavy ? 'text-white' : 'text-deep-navy'}`}
                >
                  {st.value}
                </span>
                <span
                  className={`font-ui text-xs sm:text-sm font-medium mt-1 ${isDeepNavy ? 'text-white/80' : 'text-deep-navy/70'}`}
                >
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Main Image Banner (Only if alt is present, no fallback without alt) */}
        {hasValidImage && (
          <div
            className={`mt-10 sm:mt-12 w-full overflow-hidden rounded-card border shadow-soft aspect-[16/9] max-h-[520px] relative ${
              isDeepNavy ? 'border-white/20' : 'border-deep-navy/10'
            }`}
          >
            <Image
              src={imageUrl!}
              alt={imageAlt!.trim()}
              width={1200}
              height={675}
              priority={priority}
              sizes="(max-width: 768px) 100vw, 1200px"
              className="w-full h-auto object-cover max-h-[520px]"
            />
          </div>
        )}
      </div>
    </section>
  )
}
