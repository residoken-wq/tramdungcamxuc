import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'

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
  priority?: boolean
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

export function HeroImage({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  imageUrl,
  imageAlt,
  buttonText,
  buttonLink,
  priority,
  bgColor = 'warm-ivory',
  padding = 'md',
}: HeroImageProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const buttonSafeHref = safeHref(buttonLink)
  const hasValidImage = Boolean(imageUrl && imageAlt && imageAlt.trim().length > 0)

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

        {/* Action Button */}
        {buttonSafeHref && buttonText && (
          <div className="mt-8">
            <Button href={buttonSafeHref} variant="primary" size="md">
              {buttonText}
            </Button>
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
