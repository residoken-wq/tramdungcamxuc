import React from 'react'
import { Button, type ButtonVariant, type ButtonSize } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { getBookingPath, BOOKING_PATH } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'

export interface CalloutProps {
  version?: number
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

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-12 px-6 sm:px-8',
  lg: 'py-16 px-6 sm:px-12',
} as const

export function Callout({
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
  _resolved,
  puck,
}: CalloutProps) {
  const isEditing = puck?.isEditing ?? false
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

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-4xl">
        <div className="rounded-card sm:rounded-[24px] bg-deep-navy px-8 py-10 sm:px-12 sm:py-14 text-center text-white shadow-soft">
          {title && (
            <h2 className="font-ui text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-snug">
              {title}
            </h2>
          )}

          {description && (
            <p className="mx-auto mt-4 max-w-2xl font-ui text-base sm:text-lg leading-relaxed text-white/90">
              {description}
            </p>
          )}

          {showButton && buttonText && (
            finalSafeLink ? (
              <div className="mt-8 flex justify-center">
                <Button href={finalSafeLink} variant={buttonVariant} size={buttonSize}>
                  {buttonText}
                </Button>
              </div>
            ) : isEditing && isBookingUnavailable ? (
              <div className="mt-8 flex flex-col items-center">
                <Button href="#" variant={buttonVariant} size={buttonSize} className="opacity-60 pointer-events-none">
                  {buttonText}
                </Button>
                <p className="text-xs text-soft-pink mt-2 font-ui">{vi.sm04.noBookingProduct}</p>
              </div>
            ) : null
          )}
        </div>
      </div>
    </section>
  )
}
