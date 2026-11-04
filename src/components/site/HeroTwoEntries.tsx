import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { fontSizeClass, type FontSizeOption } from '@/lib/brand/format-classes'
import { HeroEntryCard, type HeroEntryCardProps } from './HeroEntryCard'
import { EmptySlotHint } from '@/components/ui/EmptySlotHint'
import { HeroBackdrop } from './HeroBackdrop'
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

export interface HeroEntry {
  groupLabel?: string
  label?: string
  description?: string
  buttonText?: string
  buttonLink?: string
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
  layout?: HeroLayout
  overlayTone?: HeroOverlayTone
  overlayStrength?: HeroOverlayStrength
  imageBlur?: HeroImageBlur
  imagePosition?: HeroImagePosition
  contentAlign?: HeroContentAlign
  minHeight?: HeroMinHeight
  entriesLayout?: 'columns' | 'rows'
  entriesPlacement?: 'below' | 'textColumn'
  /** v1/v2 data (before the PK-08 migration runs). */
  entry1?: HeroEntry
  entry2?: HeroEntry
  /** v3 (PK-08): draggable EntryCard children. Puck passes the slot as a component. */
  entries?:
    | React.ComponentType<{ className?: string }>
    | React.ReactNode
    | Array<{ type?: string; props?: HeroEntryCardProps & { id?: string } }>
  titleSize?: FontSizeOption
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

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function HeroTwoEntries({
  id,
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  description,
  imageUrl,
  imageAlt,
  priority,
  layout = 'split',
  overlayTone = 'dark',
  overlayStrength = 'lg',
  imageBlur = 'none',
  imagePosition = 'center',
  contentAlign = 'center',
  minHeight = 'lg',
  entriesLayout = 'columns',
  entriesPlacement = 'below',
  entry1,
  entry2,
  entries,
  titleSize = 'md',
  bgColor = 'warm-ivory',
  padding = 'md',
  puck,
}: HeroTwoEntriesProps & { id?: string }) {
  const isEditing = Boolean(puck?.isEditing)
  const titleClass = `font-display ${fontSizeClass('title', titleSize, 'h1')} uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)]`
  const isRows = entriesLayout === 'rows'
  const entriesLayoutClass = isRows
    ? 'flex flex-col gap-3 sm:gap-4 w-full'
    : 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full'
  const isDeepNavy = bgColor === 'deep-navy'
  const cardBgClass = isDeepNavy
    ? 'bg-white/10 text-white border-white/20'
    : 'bg-white text-deep-navy border-deep-navy/10'
  const descColorClass = isDeepNavy ? 'text-white/90' : 'text-deep-navy/80'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'

  const hasValidImage = Boolean(imageUrl && imageAlt && imageAlt.trim().length > 0)

  const renderCard = (
    entry: HeroEntry | undefined,
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
        className={`flex flex-col justify-between p-6 sm:p-8 rounded-card border shadow-soft ${cardBgClass} group-data-[entries-layout=rows]/entries:sm:flex-row group-data-[entries-layout=rows]/entries:sm:items-center group-data-[entries-layout=rows]/entries:sm:justify-between group-data-[entries-layout=rows]/entries:gap-4 group-data-[entries-layout=rows]/entries:px-5 group-data-[entries-layout=rows]/entries:py-4 group-data-[entries-layout=rows]/entries:h-auto`}
      >
        <div className="flex flex-col text-left items-start group-data-[entries-layout=rows]/entries:sm:items-start group-data-[entries-layout=rows]/entries:flex-1">
          {entry?.groupLabel && entry.groupLabel.trim().length > 0 ? (
            <span
              className={`block font-ui text-xs font-bold uppercase tracking-widest mb-4 group-data-[entries-layout=rows]/entries:sm:mb-1 ${
                isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
              }`}
            >
              {entry.groupLabel}
            </span>
          ) : entry?.label ? (
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-ui font-bold uppercase tracking-wider ${badgeBg} text-deep-navy mb-4 group-data-[entries-layout=rows]/entries:sm:mb-1`}
            >
              {entry.label}
            </span>
          ) : null}
          {entry?.description && (
            <p
              className={`font-ui text-base leading-relaxed mb-6 group-data-[entries-layout=rows]/entries:sm:mb-0 group-data-[entries-layout=rows]/entries:sm:font-semibold group-data-[entries-layout=rows]/entries:sm:text-deep-navy group-data-[entries-layout=rows]/entries:group-data-[bg=deep-navy]/hero:sm:text-white group-data-[entries-layout=rows]/entries:sm:text-sm md:group-data-[entries-layout=rows]/entries:sm:text-base ${descColorClass}`}
            >
              {entry.description}
            </p>
          )}
        </div>
        {entryHref && entry?.buttonText && (
          <div className="group-data-[entries-layout=rows]/entries:sm:shrink-0">
            <Button
              href={entryHref}
              variant={buttonVariant}
              size="md"
              className="w-full group-data-[entries-layout=rows]/entries:sm:w-auto"
            >
              {entry.buttonText}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // v3: the `entries` slot renders draggable EntryCard children; v1/v2 data keeps the two
  // fixed cards until the read-time migration converts it.
  const entryCards = (
    <div className="group/entries w-full" data-entries-layout={entriesLayout}>
      {typeof entries === 'function' ? (
        <>
          {React.createElement(entries as React.ComponentType<{ className?: string }>, {
            className: entriesLayoutClass,
          })}
          <EmptySlotHint
            parentId={id}
            slotName="entries"
            childLabel="Thẻ lối vào"
            isEditing={isEditing}
            isDeepNavy={isDeepNavy}
          />
        </>
      ) : entries && React.isValidElement(entries) ? (
        <div className={entriesLayoutClass}>{entries}</div>
      ) : Array.isArray(entries) ? (
        <div className={entriesLayoutClass}>
          {(entries as unknown[]).map((child, idx) => {
            const block = child as { props?: HeroEntryCardProps & { id?: string } } | null
            return block && typeof block === 'object' && block.props ? (
              <HeroEntryCard key={block.props.id || idx} {...block.props} />
            ) : null
          })}
        </div>
      ) : (
        <div className={entriesLayoutClass}>
          {renderCard(entry1, 'bg-soft-pink', 'primary')}
          {renderCard(entry2, 'bg-lavender-mist', 'secondary')}
        </div>
      )}
    </div>
  )

  if (layout === 'backdrop') {
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
    const bDescColor = backdropColors
      ? backdropColors.description
      : isDeepNavy
        ? 'text-white/90'
        : 'text-deep-navy/80'

    const alignClass =
      contentAlign === 'left' ? 'text-left items-start' : 'text-center items-center'

    return (
      <HeroBackdrop
        id={id}
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

          <h1 className={titleClass}>
            <span {...textTarget(id, 'titleLine1')} className={bTitle1Color}>{titleLine1}</span>{' '}
            <span {...textTarget(id, 'titleLine2')} className={bTitle2Color}>{titleLine2}</span>
          </h1>

          {emotionLine && (
            <p
              {...textTarget(id, 'emotionLine')}
              className={`mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${bEmotionColor}`}
            >
              {emotionLine}
            </p>
          )}

          {description && (
            <p
              {...textTarget(id, 'description')}
              className={`mt-4 font-ui text-base sm:text-lg leading-relaxed max-w-2xl ${bDescColor}`}
            >
              {description}
            </p>
          )}
        </div>

        <div className="w-full mt-10 sm:mt-14">{entryCards}</div>
      </HeroBackdrop>
    )
  }

  return (
    <section
      className={`group/hero w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}
      data-bg={bgColor}
    >
      <div className="mx-auto max-w-5xl">
        {hasValidImage ? (
          (() => {
            const isTextColumn = entriesPlacement === 'textColumn'
            return (
              <div className="flex flex-col gap-10 sm:gap-14">
                {/* Desktop: Text left, Image right. Mobile: Image under text */}
                <div
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 ${
                    isTextColumn ? 'lg:items-stretch items-center' : 'items-center'
                  }`}
                >
                  <div className="order-1 lg:col-span-7 flex flex-col items-start text-left">
                    {seriesLabel && (
                      <span
                        {...textTarget(id, 'seriesLabel')}
                        className={`mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
                      >
                        {seriesLabel}
                      </span>
                    )}

                    <h1 className={titleClass}>
                      <span {...textTarget(id, 'titleLine1')} className={isDeepNavy ? 'text-white' : 'text-deep-navy'}>
                        {titleLine1}
                      </span>{' '}
                      <span {...textTarget(id, 'titleLine2')} className={titleLine2ColorClass}>{titleLine2}</span>
                    </h1>

                    {emotionLine && (
                      <p
                        {...textTarget(id, 'emotionLine')}
                        className={`mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${
                          isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
                        }`}
                      >
                        {emotionLine}
                      </p>
                    )}

                    {description && (
                      <p
                        {...textTarget(id, 'description')}
                        className={`mt-4 font-ui text-base sm:text-lg leading-relaxed max-w-2xl ${descColorClass}`}
                      >
                        {description}
                      </p>
                    )}

                    {isTextColumn && <div className="w-full mt-6 sm:mt-8">{entryCards}</div>}
                  </div>

                  <div className="order-2 lg:col-span-5 w-full flex flex-col">
                    <div
                      className={`relative w-full ${
                        isTextColumn
                          ? 'aspect-[4/3] sm:aspect-[4/3] lg:aspect-auto lg:h-full min-h-[320px]'
                          : 'aspect-[4/3] sm:aspect-[4/3] lg:aspect-[4/5] max-h-[480px]'
                      } rounded-card overflow-hidden border shadow-soft ${
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

                {/* Entry cards: only below if not in text column */}
                {!isTextColumn && entryCards}
              </div>
            )
          })()
        ) : (
          <div className="flex flex-col">
            {/* Header Section (1 column centered) */}
            <div className="text-center mb-10 sm:mb-14 flex flex-col items-center">
              {seriesLabel && (
                <span
                  {...textTarget(id, 'seriesLabel')}
                  className={`mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
                >
                  {seriesLabel}
                </span>
              )}

              {/* Signature Two-Tone Heading (Anton) */}
              <h1 className={titleClass}>
                <span {...textTarget(id, 'titleLine1')} className={isDeepNavy ? 'text-white' : 'text-deep-navy'}>{titleLine1}</span>{' '}
                <span {...textTarget(id, 'titleLine2')} className={titleLine2ColorClass}>{titleLine2}</span>
              </h1>

              {/* Emotional Quote (Playfair Display Italic) */}
              {emotionLine && (
                <p
                  {...textTarget(id, 'emotionLine')}
                  className={`mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${
                    isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
                  }`}
                >
                  {emotionLine}
                </p>
              )}

              {description && (
                <p
                  {...textTarget(id, 'description')}
                  className={`mt-4 font-ui text-base sm:text-lg leading-relaxed max-w-2xl ${descColorClass}`}
                >
                  {description}
                </p>
              )}
            </div>

            {/* Entry cards */}
            {entryCards}
          </div>
        )}
      </div>
    </section>
  )
}
