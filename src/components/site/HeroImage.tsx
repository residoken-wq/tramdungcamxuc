import React from 'react'
import Image from 'next/image'
import { BrandImage, type BrandImageShape, type CaptionPosition } from '@/components/ui/BrandImage'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import {
  allowedTextColors,
  textColorClass,
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
  type HeroImageSide,
} from '@/lib/brand/hero-backdrop'

export interface HeroStat {
  value: string
  label: string
}

export interface HeroBadge {
  text: string
}

export interface HeroListItem {
  text: string
  muted?: boolean
}

export interface HeroImageProps {
  version?: number
  seriesLabel?: string
  titleLine1: string
  titleLine2: string
  emotionLine?: string
  listTitle?: string
  listItems?: HeroListItem[]
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
  titleCase?: 'upper' | 'none'
  showAccentBar?: boolean
  titleLine1Color?: TextColorOption
  titleLine2Color?: TextColorOption
  showArchGraphic?: boolean
  layout?: HeroLayout
  imageSide?: HeroImageSide
  overlayTone?: HeroOverlayTone
  overlayStrength?: HeroOverlayStrength
  imageBlur?: HeroImageBlur
  imagePosition?: HeroImagePosition
  contentAlign?: HeroContentAlign
  minHeight?: HeroMinHeight
  imageShape?: BrandImageShape
  imageBadge?: string
  imageCaptionTitle?: string
  imageCaptionSubtitle?: string
  imageCaptionAvatars?: Array<{ mediaId?: string | number; url?: string }>
  captionPosition?: CaptionPosition
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  puck?: {
    isEditing?: boolean
  }
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

function ArchGraphic({ isDeepNavy }: { isDeepNavy: boolean }) {
  return (
    <div
      data-testid="hero-arch-graphic"
      className="relative w-full max-w-[340px] aspect-[3/4] mx-auto flex items-center justify-center select-none py-6"
    >
      {/* Outer arch frame */}
      <div
        className={`relative w-[280px] h-[390px] rounded-t-full border-2 ${
          isDeepNavy ? 'border-white/40 shadow-[0_0_30px_rgba(239,59,131,0.2)]' : 'border-deep-navy/20'
        } overflow-hidden flex flex-col items-center`}
      >
        {/* Inner subtle pink stroke */}
        <div className="absolute inset-1.5 rounded-t-full border border-accent-pink/30 pointer-events-none" />

        {/* 3 intersecting pastel circles with blend mode */}
        <div className="relative w-full h-[260px] mt-10 flex items-center justify-center">
          <div className="relative w-44 h-44">
            {/* Circle 1: butter-cream */}
            <div
              className="absolute -top-1 -left-1 w-28 h-28 rounded-full bg-butter-cream/80 mix-blend-screen shadow-xs"
              style={{ filter: 'blur(0.5px)' }}
            />
            {/* Circle 2: soft-pink */}
            <div
              className="absolute -top-1 -right-1 w-28 h-28 rounded-full bg-soft-pink/80 mix-blend-screen shadow-xs"
              style={{ filter: 'blur(0.5px)' }}
            />
            {/* Circle 3: mint-haze */}
            <div
              className="absolute bottom-0 left-8 w-28 h-28 rounded-full bg-mint-haze/80 mix-blend-screen shadow-xs"
              style={{ filter: 'blur(0.5px)' }}
            />
          </div>
        </div>

        {/* Horizontal base line */}
        <div
          className={`absolute bottom-16 inset-x-0 h-[1.5px] ${
            isDeepNavy ? 'bg-white/40' : 'bg-deep-navy/20'
          }`}
        />

        {/* Dark pedestal curve */}
        <div
          className={`absolute bottom-0 inset-x-10 h-16 rounded-t-full ${
            isDeepNavy ? 'bg-white/10' : 'bg-deep-navy/10'
          }`}
        />
      </div>

      {/* Ground baseline */}
      <div
        className={`absolute bottom-5 w-[310px] h-[2px] rounded-full ${
          isDeepNavy ? 'bg-white/60' : 'bg-deep-navy/30'
        }`}
      />
    </div>
  )
}

function renderHeroList(
  listTitle: string | undefined,
  listItems: HeroListItem[] | undefined,
  isDeepNavy: boolean,
  alignClass: string,
) {
  if (!listTitle && (!listItems || listItems.length === 0)) return null
  return (
    <div className={`mt-6 mb-2 flex flex-col gap-2.5 w-full ${alignClass}`}>
      {listTitle && (
        <span
          className={`font-ui text-xs font-bold uppercase tracking-widest ${
            isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
          }`}
        >
          {listTitle}
        </span>
      )}
      {listItems && listItems.length > 0 && (
        <ul className="flex flex-col gap-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2.5">
              {item.muted ? (
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full border border-current shrink-0 ${
                    isDeepNavy ? 'text-white/40' : 'text-deep-navy/40'
                  }`}
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full bg-accent-pink shrink-0"
                  aria-hidden="true"
                />
              )}
              <span
                className={`font-ui text-sm sm:text-base leading-relaxed ${
                  item.muted
                    ? isDeepNavy
                      ? 'text-white/50 italic'
                      : 'text-deep-navy/50 italic'
                    : isDeepNavy
                      ? 'text-white/95 font-medium'
                      : 'text-deep-navy font-medium'
                }`}
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function HeroImage({
  id,
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  listTitle,
  listItems,
  imageUrl,
  imageAlt,
  imageShape,
  imageBadge,
  imageCaptionTitle,
  imageCaptionSubtitle,
  imageCaptionAvatars,
  captionPosition,
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
  titleCase = 'upper',
  showAccentBar = false,
  titleLine1Color,
  titleLine2Color,
  showArchGraphic = false,
  layout = 'split',
  imageSide = 'right',
  overlayTone = 'dark',
  overlayStrength = 'lg',
  imageBlur = 'none',
  imagePosition = 'center',
  contentAlign = 'center',
  minHeight = 'lg',
  bgColor = 'warm-ivory',
  padding = 'md',
  puck,
}: HeroImageProps & { id?: string }) {
  const isEditing = Boolean(puck?.isEditing)
  const isFirstHero = Boolean(priority) && !isEditing
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
              className={`eb-hero-label mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${bSeriesLabelColor}`}
            >
              {seriesLabel}
            </span>
          )}

          <h1
            className={`eb-hero-title font-display ${TITLE_SIZES[titleSize] ?? TITLE_SIZES.md} uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)]`}
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
              className={`eb-hero-emotion mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${bEmotionColor}`}
            >
              {emotionLine}
            </p>
          )}

          {renderHeroList(listTitle, listItems, isDeepNavy, alignClass)}

          {normalizedBadges.length > 0 && (
            <div className={`eb-hero-cta mt-6 flex flex-wrap ${alignJustifyClass} gap-2 w-full`}>
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
              className={`eb-hero-cta mt-8 flex flex-col sm:flex-row items-center ${alignJustifyClass} gap-4 w-full sm:w-auto`}
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

  const isUpper = titleCase !== 'none'
  const resolvedLine1Color = titleLine1Color
    ? textColorClass(titleLine1Color)
    : isDeepNavy
      ? 'text-white'
      : 'text-deep-navy'
  const resolvedLine2Color = titleLine2Color
    ? textColorClass(titleLine2Color)
    : isDeepNavy
      ? 'text-white'
      : titleLine2ColorClass

  const shouldRenderArch = !hasValidImage && (showArchGraphic || imageShape === 'arch-right')

  if (layout === 'side' && (hasValidImage || shouldRenderArch)) {
    const isImageLeft = imageSide === 'left'

    const textColumn = (
      <div
        className={`flex flex-col items-start text-left lg:col-span-7 order-1 ${
          isImageLeft ? 'lg:order-2' : 'lg:order-1'
        } w-full`}
      >
        {seriesLabel && (
          <span
            {...textTarget(id, 'seriesLabel')}
            className={`eb-hero-label mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
          >
            {seriesLabel}
          </span>
        )}

        {/* Signature Two-Tone Heading (Anton) */}
        <h1
          className={`eb-hero-title font-display ${TITLE_SIZES[titleSize] ?? TITLE_SIZES.md} ${
            isUpper ? 'uppercase' : ''
          } tracking-tight !leading-[var(--tdcx-title-lh,1.3)]`}
        >
          <TwoToneTitle
            id={id}
            line1={titleLine1}
            line2={titleLine2}
            line1ClassName={resolvedLine1Color}
            line2ClassName={resolvedLine2Color}
          />
        </h1>

        {showAccentBar && (
          <span
            className="inline-block w-14 h-1 rounded bg-accent-pink mt-4 mb-2"
            aria-hidden="true"
          />
        )}

        {/* Emotional Quote (Playfair Display Italic) */}
        {emotionLine && (
          <p
            {...textTarget(id, 'emotionLine')}
            className={`eb-hero-emotion mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${
              isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
            }`}
          >
            {emotionLine}
          </p>
        )}

        {renderHeroList(listTitle, listItems, isDeepNavy, 'text-left items-start')}

        {/* Badges / Chips strip (0-3 chips) */}
        {normalizedBadges.length > 0 && (
          <div className="eb-hero-cta mt-6 flex flex-wrap justify-start gap-2">
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
          <div className="eb-hero-cta mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4 w-full sm:w-auto">
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
            <div className="flex flex-wrap items-center justify-start gap-8 sm:gap-12">
              {normalizedStats.map((st, idx) => (
                <HeroStatItem
                  key={idx}
                  value={st.value}
                  label={st.label}
                  valueColor={safeStatColor(statValueColor, true)}
                  labelColor={safeStatColor(statLabelColor, false)}
                  valueSize={statValueSize}
                  labelSize={statLabelSize}
                  align="left"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )

    const imageColumn = (
      <div
        className={`eb-hero-image w-full flex flex-col lg:col-span-5 order-2 ${
          isImageLeft ? 'lg:order-1' : 'lg:order-2'
        }`}
      >
        {hasValidImage ? (
          <BrandImage
            src={imageUrl!}
            alt={imageAlt!.trim()}
            width={800}
            height={1000}
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 500px"
            imageClassName="w-full h-full object-cover"
            className={`w-full aspect-[4/5] max-h-[580px] border shadow-soft ${
              isDeepNavy ? 'border-white/20' : 'border-deep-navy/10'
            }`}
            shape={imageShape}
            badge={imageBadge}
            caption={
              imageCaptionTitle
                ? {
                    title: imageCaptionTitle,
                    subtitle: imageCaptionSubtitle,
                    avatars: imageCaptionAvatars,
                  }
                : undefined
            }
            captionPosition={captionPosition}
          />
        ) : (
          <ArchGraphic isDeepNavy={isDeepNavy} />
        )}
      </div>
    )

    return (
      <section
        className={`group/heroimg w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}
        data-bg={bgColor}
        data-eb-hero={isFirstHero ? 'first' : undefined}
      >
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {isImageLeft ? (
              <>
                {imageColumn}
                {textColumn}
              </>
            ) : (
              <>
                {textColumn}
                {imageColumn}
              </>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className={`group/heroimg w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}
      data-bg={bgColor}
      data-eb-hero={isFirstHero ? 'first' : undefined}
    >
      <div className="mx-auto max-w-5xl flex flex-col items-center text-center">
        {seriesLabel && (
          <span
            {...textTarget(id, 'seriesLabel')}
            className={`eb-hero-label mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
          >
            {seriesLabel}
          </span>
        )}

        {/* Signature Two-Tone Heading (Anton) */}
        <h1
          className={`eb-hero-title font-display ${TITLE_SIZES[titleSize] ?? TITLE_SIZES.md} ${
            isUpper ? 'uppercase' : ''
          } tracking-tight !leading-[var(--tdcx-title-lh,1.3)]`}
        >
          <TwoToneTitle
            id={id}
            line1={titleLine1}
            line2={titleLine2}
            line1ClassName={resolvedLine1Color}
            line2ClassName={resolvedLine2Color}
          />
        </h1>

        {showAccentBar && (
          <span
            className="inline-block w-14 h-1 rounded bg-accent-pink mt-4 mb-2"
            aria-hidden="true"
          />
        )}

        {/* Emotional Quote (Playfair Display Italic) */}
        {emotionLine && (
          <p
            {...textTarget(id, 'emotionLine')}
            className={`eb-hero-emotion mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'}`}
          >
            {emotionLine}
          </p>
        )}

        {renderHeroList(listTitle, listItems, isDeepNavy, 'text-center items-center')}

        {/* Badges / Chips strip (0-3 chips) */}
        {normalizedBadges.length > 0 && (
          <div className="eb-hero-cta mt-6 flex flex-wrap justify-center gap-2">
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
          <div className="eb-hero-cta mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
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
          <BrandImage
            src={imageUrl!}
            alt={imageAlt!.trim()}
            width={1200}
            height={675}
            priority={priority}
            sizes="(max-width: 768px) 100vw, 1200px"
            imageClassName="w-full h-auto object-cover max-h-[520px]"
            className={`eb-hero-image mt-10 sm:mt-12 w-full aspect-[16/9] max-h-[520px] border shadow-soft ${
              isDeepNavy ? 'border-white/20' : 'border-deep-navy/10'
            }`}
            shape={imageShape}
            badge={imageBadge}
            caption={
              imageCaptionTitle
                ? {
                    title: imageCaptionTitle,
                    subtitle: imageCaptionSubtitle,
                    avatars: imageCaptionAvatars,
                  }
                : undefined
            }
            captionPosition={captionPosition}
          />
        )}
      </div>
    </section>
  )
}
