'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { BrandImage, type BrandImageShape, type CaptionPosition } from '@/components/ui/BrandImage'
import { Button } from '@/components/ui/Button'
import { buttonColorStyle } from '@/lib/brand/button-colors'
import { safeHref } from '@/lib/safe-href'
import type { FontSizeOption, TextColorOption } from '@/lib/brand/format-classes'
import {
  BODY_TEXT_SIZES,
  SECTION_TITLE_SIZES,
  bodyColorClass,
  sizeClass,
} from '@/lib/brand/text-presets'
import { textTarget } from '@/puck/style/text-target'
import { TwoToneTitle } from '@/components/ui/TwoToneTitle'
import { stripWrappingQuotes } from '@/lib/text/quotes'
import { StoryHighlights, type StoryHighlightItem } from './StoryHighlights'

export type ImageTextHighlightItem = StoryHighlightItem

export interface ImageTextItem {
  [key: string]: any
  title: string
  text?: string
}

export interface ImageTextProps {
  version?: number
  layout?: 'image-left' | 'image-right'
  imageBleed?: boolean
  imageBleedFullHeight?: boolean
  seriesLabel?: string
  titleLine1: string
  titleLine2?: string
  content: string
  quote?: string
  quotePosition?: 'bottom' | 'below-title'
  /** CD-01: callout | clean. PK-34: box = soft-pink box, always right under the title. */
  quoteStyle?: 'callout' | 'clean' | 'box'
  /** PK-34: numbered cards (max 4) after the text. */
  highlights?: StoryHighlightItem[]
  showPlaceholderImage?: boolean
  items?: ImageTextItem[]
  mediaId?: string
  imageUrl?: string
  imageAlt?: string
  imageLabel?: string
  imageShape?: BrandImageShape
  imageBadge?: string
  imageCaptionTitle?: string
  imageCaptionSubtitle?: string
  imageCaptionAvatars?: Array<{ mediaId?: string | number; url?: string }>
  captionPosition?: CaptionPosition
  buttonText?: string
  buttonLink?: string
  /** PK-15: brand colour of the CTA fill / label ('' = automatic). */
  buttonBgColor?: string
  buttonTextColor?: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  /** PK-10 format presets (deep-navy = automatic). */
  titleSize?: FontSizeOption
  textSize?: FontSizeOption
  textColor?: TextColorOption
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

export function ImageText({
  id,
  layout = 'image-left',
  imageBleed = false,
  imageBleedFullHeight = false,
  seriesLabel,
  titleLine1,
  titleLine2,
  content,
  quote,
  quotePosition = 'bottom',
  quoteStyle = 'callout',
  showPlaceholderImage = false,
  items,
  highlights = [],
  mediaId,
  imageUrl,
  imageAlt,
  imageLabel,
  imageShape,
  imageBadge,
  imageCaptionTitle,
  imageCaptionSubtitle,
  imageCaptionAvatars,
  captionPosition,
  buttonText,
  buttonLink,
  buttonBgColor,
  buttonTextColor,
  bgColor = 'warm-ivory',
  padding = 'md',
  titleSize,
  textSize,
  textColor,
  puck,
}: ImageTextProps & { id?: string }) {
  const isEditing = Boolean(puck?.isEditing)
  const isDeepNavy = bgColor === 'deep-navy'
  // QA PK-34: Hana often types the quote marks herself; avoid “"…"” (same as HanaStory).
  const cleanQuote = stripWrappingQuotes(quote)
  const isBoxQuote = quoteStyle === 'box'
  const textColorClass = isDeepNavy ? 'text-white' : 'text-deep-navy'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const descColorClass = bodyColorClass(
    textColor,
    bgColor,
    isDeepNavy ? 'text-white/90' : 'text-deep-navy/80',
  )

  // Client-side preview in visual editor when imageUrl is not pre-rendered from server
  const [clientImage, setClientImage] = useState<{ url: string; alt: string } | null>(null)

  useEffect(() => {
    if (!imageUrl && mediaId) {
      let isMounted = true
      fetch(`/api/media/${encodeURIComponent(mediaId)}`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((doc) => {
          if (
            isMounted &&
            doc?.url &&
            doc?.alt &&
            typeof doc.alt === 'string' &&
            doc.alt.trim().length > 0
          ) {
            setClientImage({ url: doc.url, alt: doc.alt.trim() })
          }
        })
        .catch(() => {})
      return () => {
        isMounted = false
      }
    }
  }, [imageUrl, mediaId])

  const activeUrl = imageUrl || clientImage?.url
  const activeAlt = (imageAlt || clientImage?.alt || '').trim()
  const hasValidImage = Boolean(activeUrl && activeAlt)
  const shouldRenderImage = hasValidImage || (isEditing && showPlaceholderImage)

  const paragraphs = (content || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const isImageLeft = layout === 'image-left'
  const isBleedFullHeight = Boolean(imageBleed && imageBleedFullHeight)
  const sectionPadding = isBleedFullHeight
    ? 'p-0'
    : imageBleed
      ? PADDINGS[padding].replace(/px-\S+/g, 'px-0')
      : PADDINGS[padding]

  return (
    <section
      className={`w-full ${imageBleed ? 'overflow-hidden ' : ''}${BG_COLORS[bgColor] || BG_COLORS['warm-ivory']} ${sectionPadding} transition-colors`}
    >
      <div className={imageBleed ? 'w-full max-w-none' : 'mx-auto max-w-5xl'}>
        <div
          className={`grid grid-cols-1 ${shouldRenderImage ? 'md:grid-cols-2' : ''} ${
            imageBleed ? 'gap-0' : 'gap-8 lg:gap-12'
          } ${isBleedFullHeight ? 'items-stretch' : 'items-center'}`}
        >
          {/* Image Column */}
          {shouldRenderImage && (
            <div
              className={`${
                imageBleed
                  ? `order-1 ${isImageLeft ? 'md:order-1' : 'md:order-2'} w-full h-full flex`
                  : `${isImageLeft ? 'md:order-1' : 'md:order-2'} w-full`
              }`}
            >
              {hasValidImage ? (
                <BrandImage
                  src={activeUrl!}
                  alt={activeAlt}
                  fill={isBleedFullHeight}
                  width={isBleedFullHeight ? undefined : 800}
                  height={isBleedFullHeight ? undefined : 600}
                  className={
                    imageBleed
                      ? '!rounded-none border-0 shadow-none bg-transparent w-full h-full min-h-[280px] sm:min-h-[360px] md:min-h-[500px]'
                      : 'border border-deep-navy/10 shadow-soft bg-white'
                  }
                  imageClassName={
                    imageBleed
                      ? 'w-full h-full object-cover min-h-[280px] sm:min-h-[360px] md:min-h-[500px]'
                      : 'w-full h-auto object-cover max-h-[460px]'
                  }
                  loading="lazy"
                  unoptimized={activeUrl?.startsWith('data:') || activeUrl?.startsWith('blob:')}
                  shape={imageBleed ? undefined : imageShape}
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
                >
                  {imageLabel && !imageCaptionTitle && (
                    <span
                      {...textTarget(id, 'imageLabel')}
                      className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 rounded-full bg-deep-navy/90 px-3 py-1 font-ui text-xs font-semibold text-white shadow-soft"
                    >
                      {imageLabel}
                    </span>
                  )}
                </BrandImage>
              ) : isEditing ? (
                <div
                  className={`w-full flex items-center justify-center border border-deep-navy/10 bg-soft-pink/30 text-deep-navy/60 font-ui text-sm font-semibold ${
                    imageBleed
                      ? '!rounded-none min-h-[280px] sm:min-h-[360px] md:min-h-[500px] h-full'
                      : 'rounded-card min-h-[320px] sm:min-h-[420px] shadow-soft'
                  }`}
                >
                  [MẪU] Ảnh {titleLine1}
                </div>
              ) : null}
            </div>
          )}

          {/* Text Column */}
          <div
            className={`${
              imageBleed
                ? `order-2 ${
                    isImageLeft
                      ? 'md:order-2 md:pl-10 lg:pl-16 md:pr-6 lg:pr-12'
                      : 'md:order-1 md:pr-10 lg:pr-16 md:pl-6 lg:pl-12'
                  } px-6 py-8 sm:px-8 sm:py-12 max-w-2xl mx-auto flex flex-col justify-center w-full`
                : `${
                    shouldRenderImage
                      ? isImageLeft
                        ? 'md:order-2'
                        : 'md:order-1'
                      : 'max-w-3xl mx-auto'
                  } flex flex-col justify-center`
            }`}
          >
            {seriesLabel && (
              <span
                {...textTarget(id, 'seriesLabel')}
                className={`mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
              >
                {seriesLabel}
              </span>
            )}

            <h2
              className={`font-display ${sizeClass(SECTION_TITLE_SIZES, titleSize)} uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)] mb-4`}
            >
              <TwoToneTitle
                id={id}
                line1={titleLine1}
                line2={titleLine2}
                line1ClassName={textColorClass}
                line2ClassName={titleLine2ColorClass}
              />
            </h2>

            {cleanQuote && isBoxQuote && (
              <div
                className={`mb-6 p-5 sm:p-6 rounded-card border shadow-sm ${
                  isDeepNavy
                    ? 'bg-white/10 border-white/20 text-soft-pink'
                    : 'bg-soft-pink border-accent-pink/20 text-bright-magenta'
                }`}
              >
                <blockquote
                  {...textTarget(id, 'quote')}
                  className="font-quote italic text-lg sm:text-xl leading-relaxed whitespace-pre-line"
                >
                  &ldquo;{cleanQuote}&rdquo;
                </blockquote>
              </div>
            )}

            {cleanQuote && !isBoxQuote && quotePosition === 'below-title' && (
              <p
                {...textTarget(id, 'quote')}
                className={
                  quoteStyle === 'clean'
                    ? 'mt-1 mb-6 font-quote text-xl sm:text-2xl italic leading-relaxed text-bright-magenta'
                    : `mb-6 border-l-2 border-accent-pink pl-4 font-quote text-lg sm:text-xl italic leading-relaxed ${
                        isDeepNavy ? 'text-soft-pink' : 'text-deep-navy'
                      }`
                }
              >
                {/* CD-01 'clean' prints exactly what was typed */}
                {quoteStyle === 'clean' ? quote : `\u201C${cleanQuote}\u201D`}
              </p>
            )}

            {items && items.length > 0 && (
              <div className="space-y-4 mb-6">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <h3 className="font-ui text-base sm:text-lg font-bold text-deep-navy">
                      {item.title}
                    </h3>
                    {item.text && (
                      <p
                        className={`font-ui ${sizeClass(BODY_TEXT_SIZES, textSize)} leading-relaxed ${descColorClass}`}
                      >
                        {item.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {paragraphs.length > 0 && (
              <div {...textTarget(id, 'content')} className="space-y-3 mb-6">
                {paragraphs.map((p, idx) => (
                  <p
                    key={idx}
                    className={`font-ui ${sizeClass(BODY_TEXT_SIZES, textSize)} leading-relaxed ${descColorClass}`}
                  >
                    {p}
                  </p>
                ))}
              </div>
            )}

            {cleanQuote && !isBoxQuote && quotePosition === 'bottom' && (
              <blockquote
                {...textTarget(id, 'quote')}
                className={`mb-6 border-l-2 border-accent-pink pl-4 font-quote text-lg sm:text-xl italic leading-relaxed ${
                  isDeepNavy ? 'text-soft-pink' : 'text-deep-navy'
                }`}
              >
                &ldquo;{cleanQuote}&rdquo;
              </blockquote>
            )}

            {highlights && highlights.length > 0 && (
              <StoryHighlights items={highlights} isDark={isDeepNavy} />
            )}

            {Boolean(buttonText && safeHref(buttonLink)) && (
              <div className="pt-2">
                {/* PK-15: the old navy default was a navy button on a navy section (invisible). */}
                <Button
                  href={safeHref(buttonLink)!}
                  variant="primary"
                  size="md"
                  style={buttonColorStyle(buttonBgColor, buttonTextColor, bgColor)}
                >
                  <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
