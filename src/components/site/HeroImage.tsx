import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import {
  allowedTextColors,
  type FontSizeOption,
  type TextColorOption,
} from '@/lib/brand/format-classes'
import { HeroStatItem } from './HeroStatItem'
import { HeroBackdrop } from './HeroBackdrop'
import { TwoToneTitle } from '@/components/ui/TwoToneTitle'
import { textTarget } from '@/puck/style/text-target'
import {
  heroBackdropColors,
  type HeroLayout,
  type HeroOverlayTone,
  type HeroOverlayStrength,
  type HeroImageBlur,
  type HeroImagePosition,
  type HeroContentAlign,
  type HeroMinHeight,
} from '@/lib/brand/hero-backdrop'

export interface HeroStat {
  value: string
  label: string
}

export interface HeroBadge {
  text: string
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
  badges?: HeroBadge[]
  stats?: HeroStat[]
  /** PK-09 format presets for the stats strip (deep-navy = automatic). */
  statValueColor?: TextColorOption
  statLabelColor?: TextColorOption
  statValueSize?: FontSizeOption
  statLabelSize?: FontSizeOption
  titleSize?: FontSizeOption
  priority?: boolean
  layout?: HeroLayout
  overlayTone?: HeroOverlayTone
  overlayStrength?: HeroOverlayStrength
  imageBlur?: HeroImageBlur
  imagePosition?: HeroImagePosition
  contentAlign?: HeroContentAlign
  minHeight?: HeroMinHeight
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

// `md` (the default) keeps the pre-PK-09 heading size.
const TITLE_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-3xl sm:text-4xl lg:text-5xl',
  md: 'text-4xl sm:text-5xl lg:text-6xl',
  lg: 'text-5xl sm:text-6xl lg:text-7xl',
}

const STATS_ROW = 'flex flex-wrap items-center justify-center gap-8 sm:gap-12'

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function HeroImage({
  id,
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
  statValueColor,
  statLabelColor,
  statValueSize,
  statLabelSize,
  titleSize = 'md',
  priority,
  layout = 'split',
  overlayTone = 'dark',
  overlayStrength = 'lg',
  imageBlur = 'none',
  imagePosition = 'center',
  contentAlign = 'center',
  minHeight = 'lg',
  bgColor = 'warm-ivory',
  padding = 'md',
}: HeroImageProps & { id?: string }) {
  const isBackdrop = layout === 'backdrop'
  const isDeepNavy = bgColor === 'deep-navy'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const buttonSafeHref = safeHref(buttonLink)
  const secondaryButtonSafeHref = safeHref(secondaryButtonLink)
  const hasValidImage = Boolean(imageUrl && imageAlt && imageAlt.trim().length > 0)

  const effectiveBg = isBackdrop
    ? hasValidImage
      ? overlayTone === 'light'
        ? 'warm-ivory'
        : 'deep-navy'
      : bgColor
    : bgColor

  const normalizedBadges = (badges || [])
    .map((b) => (typeof b === 'string' ? b : b?.text || ''))
    .filter(Boolean)

  // A colour picked for another background falls back to automatic (WCAG AA on the current one).
  const safeStatColor = (color: TextColorOption | undefined, large: boolean) =>
    color && allowedTextColors(effectiveBg, large).some((opt) => opt.value === color)
      ? color
      : undefined

  const normalizedStats = (Array.isArray(stats) ? stats : []).filter((st) => st && st.value)

  const hasPrimaryButton = Boolean(buttonSafeHref && buttonText)
  const hasSecondaryButton = Boolean(secondaryButtonSafeHref && secondaryButtonText)

  if (isBackdrop) {
    const backdropColors = hasValidImage ? heroBackdropColors(overlayTone) : null
    const bSeriesLabelColor = backdropColors
      ? backdropColors.seriesLabel
      : isDeepNavy
        ? 'text-soft-pink'
        : 'text-bright-magenta'
    const bTitle1Color = backdropColors
      ? backdropColors.titleLine1
      : isDeepNavy
        ? 'text-white'
        : 'text-deep-navy'
    const bTitle2Color = backdropColors
      ? backdropColors.titleLine2
      : isDeepNavy
        ? 'text-soft-pink'
        : 'text-bright-magenta'
    const bEmotionColor = backdropColors
      ? backdropColors.emotionLine
      : isDeepNavy
        ? 'text-white/90'
        : 'text-deep-navy/85'
    const bChipClass = backdropColors
      ? backdropColors.chip
      : isDeepNavy
        ? 'bg-white/10 text-white border border-white/20'
        : 'bg-soft-pink text-deep-navy border border-soft-pink'
    const bSecondaryBtnClass = backdropColors
      ? backdropColors.secondaryButton
      : isDeepNavy
        ? 'text-white border-white/40 hover:bg-white/10'
        : ''

    const alignClass =
      contentAlign === 'left' ? 'text-left items-start' : 'text-center items-center'
    const alignJustifyClass = contentAlign === 'left' ? 'justify-start' : 'justify-center'

    return (
      <HeroBackdrop
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        overlayTone={overlayTone}
        overlayStrength={overlayStrength}
        imageBlur={imageBlur}
        imagePosition={imagePosition}
        contentAlign={contentAlign}
        minHeight={minHeight}
        bgColor={bgColor}
        padding={padding}
        priority={priority}
      >
        <div className={`flex flex-col ${alignClass} w-full`}>
          {seriesLabel && (
            <span
              {...textTarget(id, 'seriesLabel')}
              className={`mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${bSeriesLabelColor}`}
            >
              {seriesLabel}
            </span>
          )}

          <h1
            className={`font-display ${TITLE_SIZES[titleSize] ?? TITLE_SIZES.md} uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)]`}
          >
            <TwoToneTitle
              id={id}
              line1={titleLine1}
              line2={titleLine2}
              line1ClassName={bTitle1Color}
              line2ClassName={bTitle2Color}
            />
          </h1>

          {emotionLine && (
            <p
              {...textTarget(id, 'emotionLine')}
              className={`mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${bEmotionColor}`}
            >
              {emotionLine}
            </p>
          )}

          {normalizedBadges.length > 0 && (
            <div className={`mt-6 flex flex-wrap ${alignJustifyClass} gap-2 w-full`}>
              {normalizedBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-3.5 py-1 rounded-full font-ui text-xs font-semibold ${bChipClass}`}
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {(hasPrimaryButton || hasSecondaryButton) && (
            <div
              className={`mt-8 flex flex-col sm:flex-row items-center ${alignJustifyClass} gap-4 w-full sm:w-auto`}
            >
              {hasPrimaryButton && (
                <Button href={buttonSafeHref!} variant="primary" size="md">
                  <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                </Button>
              )}
              {hasSecondaryButton && (
                <Button
                  href={secondaryButtonSafeHref!}
                  variant="ghost"
                  size="md"
                  className={bSecondaryBtnClass}
                >
                  <span {...textTarget(id, 'secondaryButtonText')}>{secondaryButtonText}</span>
                </Button>
              )}
            </div>
          )}

          {normalizedStats.length > 0 && (
            <div
              className={`mt-8 pt-6 border-t w-full ${
                effectiveBg === 'deep-navy' ? 'border-white/20' : 'border-deep-navy/10'
              }`}
            >
              <div className={`flex flex-wrap items-center ${alignJustifyClass} gap-8 sm:gap-12`}>
                {normalizedStats.map((st, idx) => (
                  <HeroStatItem
                    key={idx}
                    value={st.value}
                    label={st.label}
                    valueColor={safeStatColor(statValueColor, true)}
                    labelColor={safeStatColor(statLabelColor, false)}
                    valueSize={statValueSize}
                    labelSize={statLabelSize}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </HeroBackdrop>
    )
  }

  return (
    <section
      className={`group/heroimg w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}
      data-bg={bgColor}
    >
      <div className="mx-auto max-w-5xl flex flex-col items-center text-center">
        {seriesLabel && (
          <span
            {...textTarget(id, 'seriesLabel')}
            className={`mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
          >
            {seriesLabel}
          </span>
        )}

        {/* Signature Two-Tone Heading (Anton) */}
        <h1
          className={`font-display ${TITLE_SIZES[titleSize] ?? TITLE_SIZES.md} uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)]`}
        >
          <TwoToneTitle
            id={id}
            line1={titleLine1}
            line2={titleLine2}
            line1ClassName={isDeepNavy ? 'text-white' : 'text-deep-navy'}
            line2ClassName={titleLine2ColorClass}
          />
        </h1>

        {/* Emotional Quote (Playfair Display Italic) */}
        {emotionLine && (
          <p
            {...textTarget(id, 'emotionLine')}
            className={`mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'}`}
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
                <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
              </Button>
            )}
            {hasSecondaryButton && (
              <Button
                href={secondaryButtonSafeHref!}
                variant="ghost"
                size="md"
                className={isDeepNavy ? 'text-white border-white/40 hover:bg-white/10' : ''}
              >
                <span {...textTarget(id, 'secondaryButtonText')}>{secondaryButtonText}</span>
              </Button>
            )}
          </div>
        )}

        {/* Small stats strip below buttons (0-3 items) */}
        {normalizedStats.length > 0 && (
          <div
            className={`mt-8 pt-6 border-t w-full ${
              isDeepNavy ? 'border-white/20' : 'border-deep-navy/10'
            }`}
          >
            <div className={STATS_ROW}>
              {normalizedStats.map((st, idx) => (
                <HeroStatItem
                  key={idx}
                  value={st.value}
                  label={st.label}
                  valueColor={safeStatColor(statValueColor, true)}
                  labelColor={safeStatColor(statLabelColor, false)}
                  valueSize={statValueSize}
                  labelSize={statLabelSize}
                />
              ))}
            </div>
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
