'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { BOOKING_PATH, getBookingPath } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'
import { useClientFaqs } from '@/puck/client-preview'

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQProps {
  sectionId?: string
  headingId?: string
  version?: number
  source?: 'manual' | 'group'
  group?: string
  limit?: number
  preserveWhitespace?: boolean
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  items?: FAQItem[]
  numbered?: boolean
  aside?: 'none' | 'booking'
  bookingAsideTitle?: string
  bookingAsideDescription?: string
  bookingButtonText?: string
  bookingButtonLink?: string
  showEmail?: boolean
  email?: string
  seeAllLink?: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    email?: string | null
    bookingProductId?: number | null
    groupItems?: FAQItem[] | null
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

export function FAQ({
  sectionId,
  headingId,
  version: _version,
  source = 'manual',
  group = 'general',
  limit = 5,
  preserveWhitespace = false,
  seriesLabel,
  titleLine1 = '[MẪU] CÂU HỎI THƯỜNG GẶP',
  titleLine2 = '[MẪU] GIẢI ĐÁP BĂN KHOĂN',
  items = [],
  numbered = false,
  aside = 'none',
  bookingAsideTitle,
  bookingAsideDescription,
  bookingButtonText,
  bookingButtonLink,
  showEmail = false,
  email: propEmail,
  seeAllLink,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: FAQProps) {
  const isEditing = puck?.isEditing ?? false
  const isDeepNavy = bgColor === 'deep-navy'
  const isGroupSource = source === 'group'

  const { items: clientItems } = useClientFaqs({
    group,
    limit,
    initialItems: _resolved?.groupItems !== undefined ? (_resolved.groupItems ?? []) : undefined,
  })

  // When source === 'group', use resolved items (from SSR) or client preview items (in Puck editor),
  // falling back to prop items if explicitly provided (e.g. styleguide / unit tests).
  // When source === 'manual', use items prop.
  const activeItems: FAQItem[] = isGroupSource
    ? _resolved?.groupItems !== undefined
      ? (_resolved.groupItems ?? [])
      : isEditing
        ? clientItems
        : items && items.length > 0
          ? items
          : clientItems
    : items || []

  const validItems = Array.isArray(activeItems)
    ? activeItems.filter((item) => item && (item.question || item.answer))
    : []

  const [openIndices, setOpenIndices] = useState<Record<number, boolean>>({})

  const toggleItem = (idx: number) => {
    setOpenIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  // When source === 'group' and there are no questions:
  // Public page hides the entire block; editor shows a helpful placeholder note.
  if (isGroupSource && validItems.length === 0) {
    if (isEditing) {
      return (
        <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
          <div className="mx-auto max-w-4xl p-6 rounded-card border border-dashed border-deep-navy/30 text-center font-ui text-sm text-deep-navy/70">
            {vi.sm06.faq.editorEmptyGroup}
          </div>
        </section>
      )
    }
    return null
  }

  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const cardBgClass = isDeepNavy
    ? 'bg-white/10 border-white/20 text-white'
    : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
  const questionColorClass = isDeepNavy ? 'text-white' : 'text-deep-navy'
  const answerColorClass = isDeepNavy ? 'text-white/85' : 'text-deep-navy/80'
  const iconColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const answerWhitespaceClass = preserveWhitespace || isGroupSource ? ' whitespace-pre-line' : ''

  const email = _resolved?.email ?? propEmail
  const effectiveSeeAllLink =
    seeAllLink && seeAllLink.trim() !== ''
      ? seeAllLink.trim()
      : isGroupSource
        ? `/cau-hoi-thuong-gap#${group || 'general'}`
        : null
  const seeAllSafeLink = effectiveSeeAllLink ? safeHref(effectiveSeeAllLink) : null
  const bookingProductId = _resolved?.bookingProductId ?? null

  const isBookingLink =
    !bookingButtonLink ||
    bookingButtonLink.trim() === '' ||
    bookingButtonLink.trim() === BOOKING_PATH ||
    bookingButtonLink.trim() === '/dat-phien-trai-nghiem'

  let finalBookingHref: string | null = null
  let isBookingUnavailable = false

  if (isBookingLink) {
    if (bookingProductId != null) {
      finalBookingHref = safeHref(getBookingPath(bookingProductId))
    } else {
      isBookingUnavailable = true
      finalBookingHref = null
    }
  } else {
    finalBookingHref = safeHref(bookingButtonLink)
  }

  const accordionContent = (
    <div className="space-y-4">
      {validItems.map((item, index) => {
        const isOpen = Boolean(openIndices[index])
        const questionId = `faq-q-${index}`
        const answerId = `faq-a-${index}`

        return (
          <div
            key={index}
            className={`p-5 sm:p-6 rounded-card border ${cardBgClass} transition-colors`}
          >
            <button
              type="button"
              id={questionId}
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between gap-4 text-left font-ui text-base sm:text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded-md transition-colors"
            >
              <span className="flex items-center gap-3">
                {numbered && (
                  <span className="font-display text-lg text-bright-magenta select-none shrink-0">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                )}
                <span className={questionColorClass}>{item.question}</span>
              </span>
              <span
                className={`shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                } ${iconColorClass}`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <div
              id={answerId}
              role="region"
              aria-labelledby={questionId}
              hidden={!isOpen}
              className={`mt-4 pt-3 border-t ${
                isDeepNavy ? 'border-white/10' : 'border-deep-navy/10'
              } font-ui text-sm sm:text-base leading-relaxed ${answerColorClass}${answerWhitespaceClass}`}
            >
              {item.answer}
            </div>
          </div>
        )
      })}

      {seeAllSafeLink && (
        <div className="mt-8 text-center pt-2">
          <Button href={seeAllSafeLink} variant="ghost" size="md">
            {vi.sm03.seeAll} &rarr;
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <section
      id={sectionId}
      className={`w-full ${sectionId ? 'scroll-mt-24 ' : ''}${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}
    >
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        {(titleLine1 || seriesLabel) && (
          <div className="text-center mb-10 sm:mb-12 flex flex-col items-center">
            {seriesLabel && (
              <span
                className={`mb-3 font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
              >
                {seriesLabel}
              </span>
            )}

            <h2
              id={headingId}
              className={`${headingId ? 'scroll-mt-24 ' : ''}font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-[1.15]`}
            >
              <span className={isDeepNavy ? 'text-white' : 'text-deep-navy'}>{titleLine1}</span>{' '}
              <span className={titleLine2ColorClass}>{titleLine2}</span>
            </h2>
          </div>
        )}

        {/* Layout: With Booking Aside or Centered */}
        {aside === 'booking' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Booking Aside Card (Col 4 on LG) */}
            <div className="lg:col-span-4 rounded-card bg-deep-navy text-white p-6 sm:p-8 shadow-soft flex flex-col justify-between border border-white/20">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-ui font-bold uppercase tracking-wider bg-white/10 text-soft-pink mb-4">
                  Trạm Dừng Cảm Xúc
                </span>
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-white mb-3">
                  {bookingAsideTitle || vi.sm03.bookingAsideTitle}
                </h3>
                {bookingAsideDescription && (
                  <p className="font-ui text-sm text-white/80 leading-relaxed mb-6">
                    {bookingAsideDescription}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                {finalBookingHref ? (
                  <Button
                    href={finalBookingHref}
                    variant="primary"
                    size="md"
                    className="w-full text-center"
                  >
                    {bookingButtonText || vi.sm03.bookingButtonText}
                  </Button>
                ) : isEditing && isBookingUnavailable ? (
                  <div>
                    <Button
                      href="#"
                      variant="primary"
                      size="md"
                      className="w-full text-center opacity-60 pointer-events-none"
                    >
                      {bookingButtonText || vi.sm03.bookingButtonText}
                    </Button>
                    <p className="text-xs text-soft-pink mt-2 text-center font-ui">
                      {vi.sm04.noBookingProduct}
                    </p>
                  </div>
                ) : null}
                {showEmail && email && (
                  <div className="text-center font-ui text-xs text-white/70 pt-1">
                    <span>Email: </span>
                    <a
                      href={`mailto:${email}`}
                      className="underline hover:text-white transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* FAQ Accordion Items (Col 8 on LG) */}
            <div className="lg:col-span-8">{accordionContent}</div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">{accordionContent}</div>
        )}
      </div>
    </section>
  )
}
