import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'

export interface HeroEntry {
  groupLabel?: string
  label: string
  description: string
  buttonText: string
  buttonLink: string
  buttonStyle?: 'solid' | 'outline'
}

export interface HeroTwoEntriesProps {
  version?: number
  seriesLabel?: string
  titleLine1: string
  titleLine2: string
  emotionLine?: string
  description?: string
  mediaId?: string | number
  imageUrl?: string
  imageAlt?: string
  priority?: boolean
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
  description,
  imageUrl,
  imageAlt,
  priority,
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

  const hasValidImage = Boolean(imageUrl && imageAlt && imageAlt.trim().length > 0)

  const renderCard = (
    entry: HeroEntry,
    badgeBg: string,
    defaultVariant: 'primary' | 'secondary',
  ) => {
    const entryHref = safeHref(entry?.buttonLink)
    const buttonVariant =
      entry?.buttonStyle === 'outline'
        ? 'secondary'
        : entry?.buttonStyle === 'solid'
          ? 'primary'
          : defaultVariant

    return (
      <div
        className={`flex flex-col justify-between p-6 sm:p-8 rounded-card border shadow-soft ${cardBgClass}`}
      >
        <div>
          {entry?.groupLabel && (
            <span
              className={`block font-ui text-xs font-bold uppercase tracking-widest mb-2 ${
                isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
              }`}
            >
              {entry.groupLabel}
            </span>
          )}
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-ui font-bold uppercase tracking-wider ${badgeBg} text-deep-navy mb-4`}
          >
            {entry?.label}
          </span>
          <p className={`font-ui text-base leading-relaxed mb-6 ${descColorClass}`}>
            {entry?.description}
          </p>
        </div>
        {entryHref && entry?.buttonText && (
          <div>
            <Button href={entryHref} variant={buttonVariant} size="md" className="w-full">
              {entry.buttonText}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        {hasValidImage ? (
          <div className="flex flex-col gap-10 sm:gap-14">
            {/* Desktop: Text left, Image right. Mobile: Image under text */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="order-1 lg:col-span-7 flex flex-col items-start text-left">
                {seriesLabel && (
                  <span
                    className={`mb-3 font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
                  >
                    {seriesLabel}
                  </span>
                )}

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-tight leading-[1.15]">
                  <span className={isDeepNavy ? 'text-white' : 'text-deep-navy'}>{titleLine1}</span>{' '}
                  <span className={titleLine2ColorClass}>{titleLine2}</span>
                </h1>

                {emotionLine && (
                  <p
                    className={`mt-4 font-quote text-lg sm:text-xl italic max-w-2xl ${
                      isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
                    }`}
                  >
                    {emotionLine}
                  </p>
                )}

                {description && (
                  <p
                    className={`mt-4 font-ui text-base sm:text-lg leading-relaxed max-w-2xl ${descColorClass}`}
                  >
                    {description}
                  </p>
                )}
              </div>

              <div className="order-2 lg:col-span-5 w-full">
                <div
                  className={`relative w-full aspect-[4/3] sm:aspect-[4/3] lg:aspect-[4/5] max-h-[480px] rounded-card overflow-hidden border shadow-soft ${
                    isDeepNavy ? 'border-white/20' : 'border-deep-navy/10'
                  }`}
                >
                  <Image
                    src={imageUrl!}
                    alt={imageAlt!}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority={priority ?? true}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* 2 Entries Cards: Mobile vertical, Desktop 2 cols */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {renderCard(entry1, 'bg-soft-pink', 'primary')}
              {renderCard(entry2, 'bg-lavender-mist', 'secondary')}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header Section (1 column centered) */}
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
                  className={`mt-4 font-quote text-lg sm:text-xl italic max-w-2xl ${
                    isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
                  }`}
                >
                  {emotionLine}
                </p>
              )}

              {description && (
                <p
                  className={`mt-4 font-ui text-base sm:text-lg leading-relaxed max-w-2xl ${descColorClass}`}
                >
                  {description}
                </p>
              )}
            </div>

            {/* 2 Entries Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {renderCard(entry1, 'bg-soft-pink', 'primary')}
              {renderCard(entry2, 'bg-lavender-mist', 'secondary')}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
