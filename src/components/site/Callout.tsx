import React from 'react'
import { Button, type ButtonVariant, type ButtonSize } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { getBookingPath, BOOKING_PATH } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'
import type { AlignOption, FontSizeOption } from '@/lib/brand/format-classes'
import { LEAD_TEXT_SIZES, sizeClass } from '@/lib/brand/text-presets'
import { textTarget } from '@/puck/style/text-target'

export type CalloutStripTone =
  | 'soft-pink'
  | 'lavender-mist'
  | 'white'
  | 'dashed'
  | 'deep-navy'

export interface CalloutProps {
  version?: number
  variant?: 'box' | 'strip'
  stripTone?: CalloutStripTone
  title: string
  description: string
  showButton?: boolean
  buttonText?: string
  buttonLinkType?: 'url' | 'page'
  buttonPageId?: string | number
  buttonLink?: string
  buttonVariant?: ButtonVariant
  buttonSize?: ButtonSize
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  /** PK-10 format presets. The callout card is always deep navy, so text stays white. */
  titleSize?: FontSizeOption
  textSize?: FontSizeOption
  align?: AlignOption
  _resolved?: {
    pageSlug?: string | null
    bookingProductId?: number | null
  }
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
  'deep-navy': 'bg-deep-navy',
} as const

// `md` (the default) keeps the pre-PK-10 title size.
const TITLE_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-xl sm:text-2xl lg:text-3xl',
  md: 'text-2xl sm:text-3xl lg:text-4xl',
  lg: 'text-3xl sm:text-4xl lg:text-5xl',
}

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-12 px-6 sm:px-8',
  lg: 'py-16 px-6 sm:px-12',
} as const

export function renderHighlightedText(text: React.ReactNode) {
  if (!text) return null
  if (typeof text !== 'string') return text
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const content = part.slice(2, -2)
      return (
        <strong key={index} className="font-bold text-bright-magenta">
          {content}
        </strong>
      )
    }
    return <React.Fragment key={index}>{part}</React.Fragment>
  })
}

export function Callout({
  variant = 'box',
  stripTone = 'soft-pink',
  title,
  description,
  showButton = true,
  buttonText,
  buttonLinkType = 'url',
  buttonLink = '#',
  buttonVariant = 'primary',
  buttonSize = 'md',
  bgColor = 'warm-ivory',
  padding = 'md',
  titleSize,
  textSize,
  align = 'center',
  _resolved,
  puck,
  id,
}: CalloutProps & { id?: string }) {
  const isEditing = puck?.isEditing ?? false
  const isLeft = align === 'left'
  const bookingProductId = _resolved?.bookingProductId ?? null

  let targetHref: string = buttonLink || '#'
  if (buttonLinkType === 'page') {
    const resolvedSlug = _resolved?.pageSlug
    if (typeof resolvedSlug === 'string' && resolvedSlug.trim() !== '') {
      const slug = resolvedSlug.trim()
      targetHref = slug === '/' ? '/' : slug.startsWith('/') ? slug : `/${slug}`
    } else {
      targetHref = '#'
    }
  }

  const isBookingLink =
    targetHref.trim() === BOOKING_PATH || targetHref.trim() === '/dat-phien-trai-nghiem'

  let finalSafeLink: string | null = null
  let isBookingUnavailable = false

  if (isBookingLink) {
    if (bookingProductId != null) {
      finalSafeLink = safeHref(getBookingPath(bookingProductId))
    } else {
      isBookingUnavailable = true
      finalSafeLink = null
    }
  } else {
    finalSafeLink = safeHref(targetHref)
  }

  if (variant === 'strip') {
    const isToneNavy = stripTone === 'deep-navy'
    const isToneDashed = stripTone === 'dashed'
    const isToneWhite = stripTone === 'white'
    const isToneLavender = stripTone === 'lavender-mist'

    let cardClass = 'bg-soft-pink/80 border border-bright-magenta/20 text-deep-navy shadow-xs'
    let titleClass = 'text-deep-navy'
    let textClass = 'text-deep-navy/90'

    if (isToneLavender) {
      cardClass = 'bg-lavender-mist border border-deep-navy/15 text-deep-navy shadow-xs'
      titleClass = 'text-deep-navy'
      textClass = 'text-deep-navy/90'
    } else if (isToneWhite) {
      cardClass = 'bg-white border border-deep-navy/15 text-deep-navy shadow-soft'
      titleClass = 'text-deep-navy'
      textClass = 'text-deep-navy/90'
    } else if (isToneDashed) {
      cardClass = 'bg-transparent border-2 border-dashed border-accent-pink/70 text-deep-navy'
      titleClass = 'text-accent-pink'
      textClass = 'text-deep-navy/90'
    } else if (isToneNavy) {
      cardClass = 'bg-deep-navy border border-white/20 text-white shadow-soft'
      titleClass = 'text-accent-pink'
      textClass = 'text-white/90'
    }

    return (
      <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
        <div className="mx-auto max-w-4xl">
          <div
            data-eb-card=""
            data-eb-card-solid={isToneNavy ? '' : undefined}
            className={`rounded-xl sm:rounded-2xl px-6 py-4 text-center ${cardClass}`}
          >
            <p className="font-ui text-sm sm:text-base leading-relaxed inline">
              {title && (
                <span
                  {...textTarget(id, 'title')}
                  className={`font-bold uppercase tracking-wide mr-1.5 ${titleClass}`}
                >
                  {renderHighlightedText(title)}
                </span>
              )}
              {description && (
                <span
                  {...textTarget(id, 'description')}
                  className={textClass}
                >
                  {renderHighlightedText(description)}
                </span>
              )}
            </p>

            {showButton &&
              buttonText &&
              (finalSafeLink ? (
                <div className="mt-3 sm:mt-0 sm:inline-block sm:ml-4">
                  <Button href={finalSafeLink} variant={buttonVariant} size="sm">
                    <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                  </Button>
                </div>
              ) : isEditing && isBookingUnavailable ? (
                <div className="mt-3 sm:mt-0 sm:inline-block sm:ml-4">
                  <Button
                    href="#"
                    variant={buttonVariant}
                    size="sm"
                    className="opacity-60 pointer-events-none"
                  >
                    <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                  </Button>
                </div>
              ) : null)}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-4xl">
        <div
          data-eb-card=""
          data-eb-card-solid=""
          className={`rounded-card sm:rounded-[24px] bg-deep-navy px-8 py-10 sm:px-12 sm:py-14 ${isLeft ? 'text-left' : 'text-center'} text-white shadow-soft`}
        >
          {title && (
            <h2
              {...textTarget(id, 'title')}
              className={`font-ui ${sizeClass(TITLE_SIZES, titleSize)} font-bold tracking-tight text-white leading-snug`}
            >
              {renderHighlightedText(title)}
            </h2>
          )}

          {description && (
            <p
              {...textTarget(id, 'description')}
              className={`${isLeft ? '' : 'mx-auto '}mt-4 max-w-2xl font-ui ${sizeClass(LEAD_TEXT_SIZES, textSize)} leading-relaxed text-white/90`}
            >
              {renderHighlightedText(description)}
            </p>
          )}

          {showButton &&
            buttonText &&
            (finalSafeLink ? (
              <div className="mt-8 w-full self-stretch text-[inherit]">
                <div className={`inline-block ${isLeft ? 'text-left' : 'text-center'}`}>
                  <Button href={finalSafeLink} variant={buttonVariant} size={buttonSize}>
                    <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                  </Button>
                </div>
              </div>
            ) : isEditing && isBookingUnavailable ? (
              <div className="mt-8 w-full self-stretch text-[inherit]">
                <div className={`inline-flex flex-col ${isLeft ? 'items-start' : 'items-center'}`}>
                  <Button
                    href="#"
                    variant={buttonVariant}
                    size={buttonSize}
                    className="opacity-60 pointer-events-none"
                  >
                    <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                  </Button>
                  <p className="text-xs text-soft-pink mt-2 font-ui">{vi.sm04.noBookingProduct}</p>
                </div>
              </div>
            ) : null)}
        </div>
      </div>
    </section>
  )
}
