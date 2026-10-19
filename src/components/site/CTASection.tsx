'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { useClientTestimonials } from '@/puck/client-preview'
import { getBookingPath, BOOKING_PATH } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'
import type { PublicTestimonial } from '@/lib/testimonials'

export interface CTASectionProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  description?: string
  buttonText?: string
  buttonLinkType?: 'url' | 'page'
  buttonLink?: string
  buttonPageId?: string | number
  proofText?: string
  testimonials?: Array<{ testimonialId?: string | number }>
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    testimonials?: PublicTestimonial[]
    buttonUrl?: string | null
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
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function CTASection({
  seriesLabel,
  titleLine1 = '[MẪU] BẮT ĐẦU HÀNH TRÌNH',
  titleLine2 = '[MẪU] CHUYỂN MÌNH CÙNG HANA',
  emotionLine,
  description,
  buttonText = '[MẪU] Đặt phiên trải nghiệm 149.000đ',
  buttonLinkType = 'url',
  buttonLink,
  buttonPageId: _buttonPageId,
  proofText,
  testimonials,
  bgColor = 'soft-pink',
  padding = 'lg',
  _resolved,
  puck,
}: CTASectionProps) {
  const isEditing = puck?.isEditing ?? false
  const bookingProductId = _resolved?.bookingProductId ?? null

  let resolvedButtonHref: string | null = null
  if (buttonLinkType === 'page') {
    resolvedButtonHref = _resolved?.buttonUrl || null
  } else {
    resolvedButtonHref = _resolved?.buttonUrl || buttonLink || null
  }

  const isBookingLink =
    resolvedButtonHref?.trim() === BOOKING_PATH ||
    resolvedButtonHref?.trim() === '/dat-phien-trai-nghiem'

  let finalButtonHref: string | null = null
  let isBookingUnavailable = false

  if (isBookingLink) {
    if (bookingProductId != null) {
      finalButtonHref = safeHref(getBookingPath(bookingProductId))
    } else {
      isBookingUnavailable = true
      finalButtonHref = null
    }
  } else {
    finalButtonHref = resolvedButtonHref ? safeHref(resolvedButtonHref) : null
  }

  const resolvedIds = (testimonials?.map((m) => m?.testimonialId).filter(Boolean) ??
    []) as Array<string | number>

  const { testimonials: loadedTestimonials } = useClientTestimonials({
    testimonialIds: resolvedIds,
    initialTestimonials: _resolved?.testimonials,
  })

  // Filter only consented testimonials with valid photos (max 3)
  const validTestimonials = (loadedTestimonials || [])
    .filter((t) => t && t.consent === true && t.photo && t.photo.url)
    .slice(0, 3)

  const hasPhotos = validTestimonials.length > 0
  const hasProofText = Boolean(proofText && proofText.trim().length > 0)
  const showProofStrip = hasPhotos || hasProofText

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-4xl">
        <div className="rounded-card bg-white border border-deep-navy/10 p-8 sm:p-12 lg:p-16 shadow-soft text-center flex flex-col items-center">
          {seriesLabel && (
            <span className="mb-3 font-ui text-xs font-bold uppercase tracking-widest text-bright-magenta">
              {seriesLabel}
            </span>
          )}

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-[1.15]">
            <span className="text-deep-navy">{titleLine1}</span>{' '}
            <span className="text-bright-magenta">{titleLine2}</span>
          </h2>

          {emotionLine && (
            <p className="mt-4 font-quote text-lg sm:text-xl italic text-deep-navy/85 max-w-2xl">
              {emotionLine}
            </p>
          )}

          {description && (
            <p className="mt-4 font-ui text-base sm:text-lg text-deep-navy/80 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}

          {buttonText && (
            finalButtonHref ? (
              <div className="mt-8">
                <Button href={finalButtonHref} variant="primary" size="lg">
                  {buttonText}
                </Button>
              </div>
            ) : isEditing && isBookingUnavailable ? (
              <div className="mt-8">
                <Button href="#" variant="primary" size="lg" className="opacity-60 pointer-events-none">
                  {buttonText}
                </Button>
                <p className="text-xs text-bright-magenta mt-2 font-ui">{vi.sm04.noBookingProduct}</p>
              </div>
            ) : null
          )}

          {/* Proof Strip (up to 3 photos + 1 line of text) */}
          {showProofStrip && (
            <div className="mt-8 pt-6 border-t border-deep-navy/10 flex flex-wrap items-center justify-center gap-3">
              {hasPhotos && (
                <div className="flex -space-x-2.5 overflow-hidden py-1">
                  {validTestimonials.map((t) => (
                    <div
                      key={String(t.id)}
                      className="relative w-9 h-9 rounded-full ring-2 ring-white overflow-hidden bg-soft-pink flex-shrink-0"
                    >
                      <Image
                        src={t.photo!.url}
                        alt={t.photo!.alt || t.name}
                        width={36}
                        height={36}
                        className="object-cover w-full h-full text-[0px]"
                      />
                    </div>
                  ))}
                </div>
              )}
              {hasProofText && (
                <span className="font-ui text-xs sm:text-sm font-medium text-deep-navy/75">
                  {proofText}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
