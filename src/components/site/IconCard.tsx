import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { safeHref } from '@/lib/safe-href'
import { BrandImage, type BrandImageShape, type CaptionPosition } from '@/components/ui/BrandImage'
import { BrandIcon } from '@/components/brand/BrandIcon'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'
import {
  textColorClass,
  fontSizeClass,
  type TextColorOption,
  type FontSizeOption,
  type AlignOption,
} from '@/lib/brand/format-classes'
import { textTarget } from '@/puck/style/text-target'

export type CardHighlight = 'none' | 'outline' | 'navy' | 'coming-soon'

export type CardBgColor =
  | 'none'
  | 'warm-ivory'
  | 'soft-pink'
  | 'lavender-mist'
  | 'mint-haze'
  | 'butter-cream'
  | 'deep-navy'
  | 'bright-magenta'
  | 'accent-pink'

export interface CardItem {
  title: string
  text?: string
}

export interface CardNote {
  title?: string
  text: string
  tone?: 'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
}

export interface IconCardProps {
  version?: number
  icon?: BrandIconKey | string
  mediaId?: string | number
  imageUrl?: string
  imageAlt?: string
  title?: string
  titleFont?: 'ui' | 'display'
  text?: string
  titleColor?: TextColorOption
  textColor?: TextColorOption
  titleSize?: FontSizeOption | 'xl'
  textSize?: FontSizeOption
  align?: AlignOption
  highlight?: CardHighlight
  cardBg?: CardBgColor
  eyebrow?: string
  eyebrowBar?: boolean
  eyebrowColor?: 'accent' | 'muted'
  subtitle?: string
  subtitleColor?: TextColorOption
  subtitleCase?: 'none' | 'upper'
  chip?: string
  showDivider?: boolean
  linkText?: string
  linkHref?: string
  linkVariant?: 'magenta' | 'pink'
  items?: CardItem[]
  itemsColumns?: 1 | 2
  itemsTitleCase?: 'none' | 'upper'
  itemsTitleColor?: 'deep-navy' | 'accent-pink' | 'bright-magenta'
  note?: CardNote
  imageShape?: BrandImageShape
  imageBadge?: string
  imageCaptionTitle?: string
  imageCaptionSubtitle?: string
  imageCaptionAvatars?: Array<{ mediaId?: string | number; url?: string }>
  captionPosition?: CaptionPosition
  // Standalone / direct render props (optional):
  index?: number
  marker?: 'icon' | 'number'
  cardStyle?: 'white' | 'soft' | 'outline'
  isDeepNavy?: boolean
}

function getExplicitCardClasses(
  cardStyle: 'white' | 'soft' | 'outline' = 'white',
  isDeepNavy = false,
): string {
  if (isDeepNavy) {
    switch (cardStyle) {
      case 'soft':
        return 'bg-soft-pink/15 border-soft-pink/30 text-white'
      case 'outline':
        return 'bg-transparent border-2 border-white/30 text-white'
      case 'white':
      default:
        return 'bg-white/10 border border-white/20 text-white'
    }
  }

  switch (cardStyle) {
    case 'soft':
      return 'bg-soft-pink border-accent-pink/20 text-deep-navy shadow-soft'
    case 'outline':
      return 'bg-transparent border-2 border-deep-navy/20 text-deep-navy'
    case 'white':
    default:
      return 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
  }
}

const CARD_BG_MAP: Record<string, string> = {
  'warm-ivory': '!bg-warm-ivory !border-deep-navy/10 !text-deep-navy shadow-soft',
  'soft-pink': '!bg-soft-pink !border-deep-navy/10 !text-deep-navy shadow-soft',
  'lavender-mist': '!bg-lavender-mist !border-deep-navy/10 !text-deep-navy shadow-soft',
  'mint-haze': '!bg-mint-haze !border-deep-navy/10 !text-deep-navy shadow-soft',
  'butter-cream': '!bg-butter-cream !border-deep-navy/10 !text-deep-navy shadow-soft',
  'deep-navy': '!bg-deep-navy !border-white/20 !text-white shadow-soft',
  'bright-magenta': '!bg-bright-magenta !border-white/20 !text-white shadow-soft',
  // a11y-contrast-ok: full card solid background with white text
  'accent-pink': '!bg-accent-pink !border-white/20 !text-white shadow-soft',
}

function getNoteToneClass(
  tone: CardNote['tone'] | undefined,
  cardBg: CardBgColor | undefined,
  isDark: boolean,
): string {
  if (isDark) {
    return 'bg-white/10 border-white/20 text-white'
  }
  const effectiveTone = tone || cardBg
  switch (effectiveTone) {
    case 'butter-cream':
      return 'bg-butter-cream/60 border-deep-navy/15 text-deep-navy'
    case 'soft-pink':
      return 'bg-soft-pink/70 border-deep-navy/15 text-deep-navy'
    case 'mint-haze':
      return 'bg-mint-haze/70 border-deep-navy/15 text-deep-navy'
    case 'lavender-mist':
      return 'bg-lavender-mist/70 border-deep-navy/15 text-deep-navy'
    case 'warm-ivory':
      return 'bg-warm-ivory border-deep-navy/15 text-deep-navy'
    default:
      return 'bg-deep-navy/5 border-deep-navy/10 text-deep-navy'
  }
}

function renderCardText(
  text: React.ReactNode,
  id: string | undefined,
  textSizeClass: string,
  textColorStyleClass: string,
) {
  if (!text) return null
  // QA PK-26: in the builder, inline-editable fields arrive as React elements, not strings.
  const lines = typeof text === 'string' ? text.replace(/\\n/g, '\n').split(/\r?\n/) : []
  const hasBullets = lines.some((l) => l.trimStart().startsWith('- '))

  if (!hasBullets) {
    return (
      <p
        {...textTarget(id, 'text')}
        className={`mt-2 font-ui ${textSizeClass} leading-relaxed whitespace-pre-line ${textColorStyleClass}`}
      >
        {text}
      </p>
    )
  }

  type Chunk = { type: 'p'; content: string } | { type: 'ul'; items: string[] }
  const chunks: Chunk[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('- ')) {
      const item = trimmed.slice(2).trim()
      const last = chunks[chunks.length - 1]
      if (last && last.type === 'ul') {
        last.items.push(item)
      } else {
        chunks.push({ type: 'ul', items: [item] })
      }
    } else {
      chunks.push({ type: 'p', content: trimmed })
    }
  }

  return (
    <div
      {...textTarget(id, 'text')}
      className={`mt-2 font-ui ${textSizeClass} leading-relaxed ${textColorStyleClass}`}
    >
      {chunks.map((chunk, idx) => {
        if (chunk.type === 'p') {
          return (
            <p key={idx} className={`whitespace-pre-line ${idx > 0 ? 'mt-2' : ''}`}>
              {chunk.content}
            </p>
          )
        }
        return (
          <ul key={idx} className={`space-y-1.5 ${idx > 0 ? 'mt-2' : ''}`}>
            {chunk.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-bright-magenta mt-1 shrink-0 text-xs select-none">•</span>
                <span className="flex-1 whitespace-pre-line">{it}</span>
              </li>
            ))}
          </ul>
        )
      })}
    </div>
  )
}

export function IconCard({
  icon = 'star',
  imageUrl,
  imageAlt,
  title = '',
  titleFont = 'ui',
  text = '',
  titleColor = 'deep-navy',
  textColor = 'deep-navy',
  titleSize = 'md',
  textSize = 'md',
  align = 'left',
  index,
  marker,
  cardStyle,
  isDeepNavy = false,
  highlight,
  cardBg,
  eyebrow,
  eyebrowBar,
  eyebrowColor = 'accent',
  subtitle,
  subtitleColor,
  subtitleCase = 'none',
  chip,
  showDivider = false,
  linkText,
  linkHref,
  linkVariant = 'magenta',
  items,
  itemsColumns = 1,
  itemsTitleCase = 'none',
  itemsTitleColor = 'deep-navy',
  note,
  imageShape,
  imageBadge,
  imageCaptionTitle,
  imageCaptionSubtitle,
  imageCaptionAvatars,
  captionPosition,
  id,
}: IconCardProps & { id?: string }) {
  const hasValidImage = Boolean(imageUrl && imageAlt && imageAlt.trim().length > 0)
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'
  const isComingSoon = highlight === 'coming-soon'
  const isNavyHighlight = highlight === 'navy'
  const isOutlineHighlight = highlight === 'outline'
  const isCustomBg = cardBg && cardBg !== 'none'
  // Card painted dark by itself (highlight / cardBg), not just sitting on a navy grid.
  const isSolidCard =
    isNavyHighlight ||
    cardBg === 'deep-navy' ||
    cardBg === 'bright-magenta' ||
    cardBg === 'accent-pink'
  const isDarkCard =
    isNavyHighlight ||
    cardBg === 'deep-navy' ||
    cardBg === 'bright-magenta' ||
    cardBg === 'accent-pink' ||
    (isDeepNavy && (!cardStyle || cardStyle === 'white'))

  // QA PK-26: small magenta text fails WCAG AA on navy (2.8:1) and lavender (4.4:1) cards.
  const eyebrowTextClass = isComingSoon
    ? '!text-deep-navy/70'
    : eyebrowColor === 'muted'
      ? isDarkCard
        ? 'text-white/70'
        : 'text-deep-navy/70'
      : isDarkCard
        ? 'text-soft-pink'
        : cardBg === 'lavender-mist'
          ? 'text-deep-navy'
          : 'text-bright-magenta'

  const titleSizeClass = fontSizeClass('card-title', titleSize)
  const textSizeClass = fontSizeClass('card-text', textSize)

  // Title color: custom color if specified; if default deep-navy, adapt on deep-navy parent / dark card
  const titleColorClass = isComingSoon
    ? '!text-deep-navy/60'
    : isDarkCard
      ? '!text-white'
      : titleColor && titleColor !== 'deep-navy'
        ? textColorClass(titleColor)
        : isDeepNavy
          ? 'text-white'
          : 'text-deep-navy group-data-[bg=deep-navy]/grid:text-white'

  // Subtitle color: custom color if specified; if default deep-navy, adapt on dark card / deep-navy parent
  const subtitleColorClass = isDarkCard
    ? '!text-white/95'
    : subtitleColor && subtitleColor !== 'deep-navy'
      ? textColorClass(subtitleColor)
      : isDeepNavy
        ? 'text-white/95'
        : 'text-deep-navy/90'

  // Text color: custom color if specified; if default deep-navy, adapt on deep-navy parent / dark card
  const textColorStyleClass = isDarkCard
    ? '!text-white/85'
    : textColor && textColor !== 'deep-navy'
      ? textColor === 'white'
        ? 'text-white/80'
        : textColorClass(textColor)
      : isDeepNavy
        ? 'text-white/80'
        : 'text-deep-navy/75 group-data-[bg=deep-navy]/grid:text-white/80'

  const explicitThemeClass = isCustomBg
    ? CARD_BG_MAP[cardBg] || ''
    : cardStyle
      ? getExplicitCardClasses(cardStyle, isDeepNavy)
      : getExplicitCardClasses('white', isDeepNavy)

  const highlightClass = isComingSoon
    ? ' !bg-warm-ivory !border-deep-navy/15 !border-t-deep-navy/15 !border-t shadow-none'
    : isNavyHighlight
      ? ' !bg-deep-navy !text-white !border-deep-navy/40 shadow-soft overflow-hidden'
      : isOutlineHighlight
        ? ' !border-2 !border-accent-pink'
        : ''

  // QA PK-26: 'none' hides the icon box even inside an icon-marker grid (cards without an icon).
  const hideIcon = icon === 'none' && !hasValidImage
  const showIconRow =
    marker === 'number' ||
    (!hideIcon && ((icon && icon !== 'none') || hasValidImage || marker === 'icon'))

  return (
    <div
      data-eb-card=""
      data-eb-card-solid={isDarkCard ? '' : undefined}
      className={`flex flex-col p-6 sm:p-8 rounded-card border transition-transform hover:-translate-y-0.5 [counter-increment:card-counter] w-full ${alignClass} group-data-[card-align=center]/grid:items-center group-data-[card-align=center]/grid:text-center group-data-[card-align=left]/grid:items-start group-data-[card-align=left]/grid:text-left ${explicitThemeClass}${highlightClass} group-data-[card-theme=navy-soft]/grid:bg-soft-pink/15 group-data-[card-theme=navy-soft]/grid:border-soft-pink/30 group-data-[card-theme=navy-soft]/grid:text-white group-data-[card-theme=navy-soft]/grid:shadow-none group-data-[card-theme=navy-outline]/grid:bg-transparent group-data-[card-theme=navy-outline]/grid:border-2 group-data-[card-theme=navy-outline]/grid:border-white/30 group-data-[card-theme=navy-outline]/grid:text-white group-data-[card-theme=navy-outline]/grid:shadow-none group-data-[card-theme=navy-white]/grid:bg-white/10 group-data-[card-theme=navy-white]/grid:border group-data-[card-theme=navy-white]/grid:border-white/20 group-data-[card-theme=navy-white]/grid:text-white group-data-[card-theme=navy-white]/grid:shadow-none group-data-[card-theme=light-soft]/grid:bg-soft-pink group-data-[card-theme=light-soft]/grid:border-accent-pink/20 group-data-[card-theme=light-soft]/grid:text-deep-navy group-data-[card-theme=light-soft]/grid:shadow-soft group-data-[card-theme=light-outline]/grid:bg-transparent group-data-[card-theme=light-outline]/grid:border-2 group-data-[card-theme=light-outline]/grid:border-deep-navy/20 group-data-[card-theme=light-outline]/grid:text-deep-navy group-data-[card-theme=light-outline]/grid:shadow-none group-data-[card-theme=light-white]/grid:bg-white group-data-[card-theme=light-white]/grid:border-deep-navy/10 group-data-[card-theme=light-white]/grid:text-deep-navy group-data-[card-theme=light-white]/grid:shadow-soft`}
    >
      {showIconRow && (
        <div className="mb-4 w-full self-stretch text-[inherit]">
          {marker === 'number' && index !== undefined ? (
            <span
              className={`inline-block font-display text-3xl sm:text-4xl ${
                isSolidCard
                  ? '!text-accent-pink'
                  : isDeepNavy
                    ? 'text-soft-pink'
                    : 'text-bright-magenta group-data-[bg=deep-navy]/grid:text-soft-pink'
              }`}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
          ) : marker === 'icon' && index !== undefined ? (
            hasValidImage ? (
              <BrandImage
                src={imageUrl!}
                alt={imageAlt!}
                fill
                className="inline-block h-12 w-12 rounded-2xl align-middle"
                imageClassName="object-cover"
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
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isSolidCard
                    ? '!bg-white/10 !text-accent-pink'
                    : 'bg-soft-pink text-bright-magenta'
                }`}
              >
                <BrandIcon name={(icon as BrandIconKey) || 'star'} size={24} />
              </div>
            )
          ) : (
            <>
              <span
                className={`hidden group-data-[marker=number]/grid:inline-block font-display text-3xl sm:text-4xl ${
                  isSolidCard
                    ? '!text-accent-pink'
                    : 'text-bright-magenta group-data-[bg=deep-navy]/grid:text-soft-pink'
                } before:content-[counter(card-counter,_decimal-leading-zero)]`}
              />
              <div className="inline-flex group-data-[marker=number]/grid:!hidden items-center justify-center">
                {hasValidImage ? (
                  <BrandImage
                    src={imageUrl!}
                    alt={imageAlt!}
                    fill
                    className="inline-block h-12 w-12 rounded-2xl align-middle"
                    imageClassName="object-cover"
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
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isSolidCard
                        ? '!bg-white/10 !text-accent-pink'
                        : 'bg-soft-pink text-bright-magenta'
                    }`}
                  >
                    <BrandIcon name={(icon as BrandIconKey) || 'star'} size={24} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {eyebrow && (
        <div
          className={`font-ui text-xs font-bold uppercase tracking-wider ${eyebrowTextClass} mb-2 ${
            eyebrowBar ? 'border-l-[3px] border-bright-magenta pl-2' : ''
          }`}
        >
          {eyebrow}
        </div>
      )}

      {title && (
        <h3
          {...textTarget(id, 'title')}
          className={
            titleFont === 'display'
              ? `font-display ${titleSizeClass} uppercase tracking-tight leading-snug ${titleColorClass}`
              : `font-ui ${titleSizeClass} font-bold leading-snug ${titleColorClass}`
          }
        >
          {title}
        </h3>
      )}

      {showDivider && (
        <div className="w-full my-3 border-b border-deep-navy/10" aria-hidden="true" />
      )}

      {subtitle && (
        <div
          className={`mt-1 font-ui text-sm sm:text-base font-bold leading-snug ${subtitleColorClass}${
            subtitleCase === 'upper' ? ' uppercase' : ''
          }`}
        >
          {subtitle}
        </div>
      )}

      {chip && (
        <div className="mt-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isDarkCard
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-white/80 text-deep-navy border border-deep-navy/15 shadow-2xs'
            }`}
          >
            {chip}
          </span>
        </div>
      )}

      {text && renderCardText(text, id, textSizeClass, textColorStyleClass)}

      {items && items.length > 0 && (
        <div
          className={`mt-3 w-full ${
            itemsColumns === 2
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'
              : 'flex flex-col gap-2.5'
          }`}
        >
          {items.map((item, i) => {
            const itemTitleColorClass =
              itemsTitleColor === 'accent-pink' || itemsTitleColor === 'bright-magenta'
                ? '!text-bright-magenta'
                : isDarkCard
                  ? 'text-white'
                  : 'text-deep-navy'
            const itemTitleCaseClass = itemsTitleCase === 'upper' ? 'uppercase' : ''

            return (
              <div key={i} className="flex flex-col text-left items-start">
                <span
                  className={`font-ui text-sm sm:text-base font-bold ${itemTitleCaseClass} ${itemTitleColorClass}`}
                >
                  {item.title}
                </span>
                {item.text && (
                  <span
                    className={`font-ui text-xs sm:text-sm leading-relaxed mt-0.5 whitespace-pre-line ${
                      isDarkCard ? 'text-white/80' : 'text-deep-navy/75'
                    }`}
                  >
                    {item.text}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {note && note.text && (
        <div
          className={`mt-4 w-full rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm border text-left items-start ${getNoteToneClass(
            note.tone,
            cardBg,
            isDarkCard,
          )}`}
        >
          {note.title && (
            <div className="font-ui font-bold uppercase tracking-wider text-[11px] mb-1 text-bright-magenta">
              {note.title}
            </div>
          )}
          <div className="font-ui leading-relaxed opacity-95 whitespace-pre-line">{note.text}</div>
        </div>
      )}

      {!isComingSoon && linkText && linkHref && (
        <div className="mt-auto pt-6 w-full">
          <Link
            href={safeHref(linkHref) || '#'}
            className="inline-flex items-center gap-1 font-ui text-sm sm:text-base font-bold transition-colors text-bright-magenta hover:text-bright-magenta/80"
          >
            {linkText}
          </Link>
        </div>
      )}
    </div>
  )
}
