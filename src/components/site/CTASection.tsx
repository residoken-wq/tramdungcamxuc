'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { useClientTestimonials } from '@/puck/client-preview'
import { getBookingPath, BOOKING_PATH, type PublicProduct } from '@/lib/products'
import { ExperienceBookingButton, formatBookingButtonLabel } from '@/components/site/ExperienceBookingButton'
import { vi } from '@/lib/i18n/vi'
import type { PublicTestimonial } from '@/lib/testimonials'
import type { FontSizeOption } from '@/lib/brand/format-classes'
import { LEAD_TEXT_SIZES, sizeClass } from '@/lib/brand/text-presets'
import { textTarget } from '@/puck/style/text-target'
import { TwoToneTitle } from '@/components/ui/TwoToneTitle'
import {
  RegistrationModal,
  type RegistrationFormType,
} from '@/components/site/RegistrationModal'

export interface CTASectionProps {
  version?: number
  variant?: 'card' | 'solid'
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  description?: string
  buttonText?: string
  buttonAction?: 'link' | 'booking' | 'form'
  formType?: RegistrationFormType
  formTitle?: string
  formSuccessMessage?: string
  buttonLinkType?: 'url' | 'page' | 'booking'
  buttonLink?: string
  buttonPageId?: string | number
  buttonVariant?: 'primary' | 'magenta' | 'pink'
  buttonShape?: 'normal' | 'pill'
  secondaryButtonText?: string
  secondaryButtonAction?: 'link' | 'booking' | 'form'
  secondaryFormType?: RegistrationFormType
  secondaryFormTitle?: string
  secondaryFormSuccessMessage?: string
  secondaryButtonLink?: string
  secondaryButtonVariant?: 'primary' | 'magenta' | 'pink'
  proofText?: string
  testimonials?: Array<{ testimonialId?: string | number }>
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  /** PK-10 format presets. The CTA card is always white. */
  titleSize?: FontSizeOption
  textSize?: FontSizeOption
  _resolved?: {
    testimonials?: PublicTestimonial[]
    buttonUrl?: string | null
    bookingProductId?: number | null
    bookingProduct?: PublicProduct | null
    pageSlug?: string | null
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

// `md` (the default) keeps the pre-PK-10 title size.
const TITLE_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-2xl sm:text-3xl lg:text-4xl',
  md: 'text-3xl sm:text-4xl lg:text-5xl',
  lg: 'text-4xl sm:text-5xl lg:text-6xl',
}

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function CTASection({
  id,
  variant = 'card',
  seriesLabel,
  titleLine1 = '[MẪU] BẮT ĐẦU HÀNH TRÌNH',
  titleLine2 = '[MẪU] CHUYỂN MÌNH CÙNG HANA',
  emotionLine,
  description,
  buttonText = '[MẪU] Đặt phiên trải nghiệm 149.000đ',
  buttonAction = 'link',
  formType = 'community-me-time',
  formTitle,
  formSuccessMessage,
  buttonLinkType = 'url',
  buttonLink,
  buttonPageId: _buttonPageId,
  buttonVariant = 'primary',
  buttonShape = 'normal',
  secondaryButtonText,
  secondaryButtonAction = 'link',
  secondaryFormType = 'community-yoga-buddy',
  secondaryFormTitle,
  secondaryFormSuccessMessage,
  secondaryButtonLink,
  secondaryButtonVariant = 'primary',
  proofText,
  testimonials,
  bgColor = 'soft-pink',
  padding = 'lg',
  titleSize,
  textSize,
  _resolved,
  puck,
}: CTASectionProps & { id?: string }) {
  const isEditing = puck?.isEditing ?? false
  const bookingProductId = _resolved?.bookingProductId ?? null

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeFormType, setActiveFormType] = useState<RegistrationFormType>('community-me-time')
  const [activeModalTitle, setActiveModalTitle] = useState<string | undefined>(undefined)
  const [activeSuccessMessage, setActiveSuccessMessage] = useState<string | undefined>(undefined)

  let resolvedButtonHref: string | null = null
  if (buttonLinkType === 'page') {
    resolvedButtonHref = _resolved?.buttonUrl || null
  } else {
    resolvedButtonHref = _resolved?.buttonUrl || buttonLink || null
  }

  const isBookingMode =
    buttonAction === 'booking' ||
    buttonLinkType === 'booking' ||
    resolvedButtonHref?.trim() === BOOKING_PATH ||
    resolvedButtonHref?.trim() === '/dat-phien-trai-nghiem'

  let finalButtonHref: string | null = null
  let isBookingUnavailable = false

  if (isBookingMode) {
    if (bookingProductId != null) {
      finalButtonHref = safeHref(getBookingPath(bookingProductId))
    } else {
      isBookingUnavailable = true
      finalButtonHref = null
    }
  } else {
    finalButtonHref = resolvedButtonHref ? safeHref(resolvedButtonHref) : null
  }

  const resolvedIds = (testimonials?.map((m) => m?.testimonialId).filter(Boolean) ?? []) as Array<
    string | number
  >

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

  if (variant === 'solid') {
    const isDeepNavy = bgColor === 'deep-navy'
    return (
      <section data-cta-solid="" className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
        <div className="mx-auto max-w-4xl text-center flex flex-col items-center">
          {seriesLabel && (
            <span
              {...textTarget(id, 'seriesLabel')}
              className={`mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${
                isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
              }`}
            >
              {seriesLabel}
            </span>
          )}

          {emotionLine && (
            <p
              {...textTarget(id, 'emotionLine')}
              className={`mb-4 font-quote text-lg sm:text-xl italic ${
                isDeepNavy ? 'text-soft-pink' : 'text-deep-navy/85'
              } max-w-2xl`}
            >
              {emotionLine}
            </p>
          )}

          <h2
            className={`font-display ${sizeClass(TITLE_SIZES, titleSize)} uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)] ${
              isDeepNavy ? 'text-white' : 'text-deep-navy'
            }`}
          >
            <TwoToneTitle
              id={id}
              line1={titleLine1}
              line2={titleLine2}
              line1ClassName={isDeepNavy ? 'text-white' : 'text-deep-navy'}
              line2ClassName={isDeepNavy ? 'text-white' : 'text-bright-magenta'}
            />
          </h2>

          {description && (
            <p
              {...textTarget(id, 'description')}
              className={`mt-4 font-ui ${sizeClass(LEAD_TEXT_SIZES, textSize)} ${
                isDeepNavy ? 'text-white/80' : 'text-deep-navy/80'
              } max-w-2xl leading-relaxed`}
            >
              {description}
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            {buttonText &&
              (isBookingMode ? (
                finalButtonHref ? (
                  <ExperienceBookingButton
                    product={_resolved?.bookingProduct}
                    productId={bookingProductId}
                    buttonText={buttonText}
                    shape={buttonShape}
                    showPrice={true}
                    className={`min-h-[48px] px-8 py-3.5 text-[19px] font-bold uppercase tracking-tight text-white shadow-md hover:shadow-lg transition-all ${
                      buttonVariant === 'magenta'
                        ? '!bg-bright-magenta'
                        : buttonVariant === 'pink'
                          ? '!bg-accent-pink'
                          : '!bg-accent-pink'
                    }`}
                    pageSlug={_resolved?.pageSlug ?? undefined}
                  />
                ) : null
              ) : buttonAction === 'form' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFormType(formType || 'community-me-time')
                    setActiveModalTitle(formTitle)
                    setActiveSuccessMessage(formSuccessMessage)
                    setIsModalOpen(true)
                  }}
                  className={`inline-flex items-center justify-center min-h-[48px] px-8 py-3.5 text-[19px] font-bold uppercase tracking-tight text-white transition-opacity active:opacity-90 hover:opacity-95 cursor-pointer ${
                    buttonShape === 'pill' ? 'rounded-full' : 'rounded-card'
                  } ${
                    buttonVariant === 'magenta'
                      ? 'bg-bright-magenta'
                      : buttonVariant === 'pink'
                        ? 'bg-accent-pink'
                        : 'bg-accent-pink'
                  }`}
                >
                  <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                </button>
              ) : (
                <Link
                  href={safeHref(finalButtonHref) || '#'}
                  className={`inline-flex items-center justify-center min-h-[48px] px-8 py-3.5 text-[19px] font-bold uppercase tracking-tight text-white transition-opacity active:opacity-90 hover:opacity-95 ${
                    buttonShape === 'pill' ? 'rounded-full' : 'rounded-card'
                  } ${
                    buttonVariant === 'magenta'
                      ? 'bg-bright-magenta'
                      : buttonVariant === 'pink'
                        ? 'bg-accent-pink'
                        : 'bg-accent-pink'
                  }`}
                >
                  <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                </Link>
              ))}

            {secondaryButtonText &&
              (secondaryButtonAction === 'form' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFormType(secondaryFormType || 'community-yoga-buddy')
                    setActiveModalTitle(secondaryFormTitle)
                    setActiveSuccessMessage(secondaryFormSuccessMessage)
                    setIsModalOpen(true)
                  }}
                  className={`inline-flex items-center justify-center min-h-[48px] px-8 py-3.5 text-[19px] font-bold uppercase tracking-tight text-white transition-opacity active:opacity-90 hover:opacity-95 cursor-pointer ${
                    buttonShape === 'pill' ? 'rounded-full' : 'rounded-card'
                  } ${
                    secondaryButtonVariant === 'magenta'
                      ? 'bg-bright-magenta'
                      : secondaryButtonVariant === 'pink'
                        ? 'bg-accent-pink'
                        : 'bg-accent-pink'
                  }`}
                >
                  {secondaryButtonText}
                </button>
              ) : (
                <Link
                  href={safeHref(secondaryButtonLink) || '#'}
                  className={`inline-flex items-center justify-center min-h-[48px] px-8 py-3.5 text-[19px] font-bold uppercase tracking-tight text-white transition-opacity active:opacity-90 hover:opacity-95 ${
                    buttonShape === 'pill' ? 'rounded-full' : 'rounded-card'
                  } ${
                    secondaryButtonVariant === 'magenta'
                      ? 'bg-bright-magenta'
                      : secondaryButtonVariant === 'pink'
                        ? 'bg-accent-pink'
                        : 'bg-accent-pink'
                  }`}
                >
                  {secondaryButtonText}
                </Link>
              ))}
          </div>
        </div>
        <RegistrationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          formType={activeFormType}
          title={activeModalTitle}
          successMessage={activeSuccessMessage}
          pageSlug={_resolved?.pageSlug ?? undefined}
        />
      </section>
    )
  }

  return (
    <section id={id} className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-4xl">
        <div className="rounded-card bg-white border border-deep-navy/10 p-8 sm:p-12 lg:p-16 shadow-soft text-center flex flex-col items-center">
          {seriesLabel && (
            <span
              {...textTarget(id, 'seriesLabel')}
              className="mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest text-bright-magenta"
            >
              {seriesLabel}
            </span>
          )}

          <h2
            className={`font-display ${sizeClass(TITLE_SIZES, titleSize)} uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)]`}
          >
            <TwoToneTitle
              id={id}
              line1={titleLine1}
              line2={titleLine2}
              line1ClassName="text-deep-navy"
              line2ClassName="text-bright-magenta"
            />
          </h2>

          {emotionLine && (
            <p
              {...textTarget(id, 'emotionLine')}
              className="mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic text-deep-navy/85 max-w-2xl"
            >
              {emotionLine}
            </p>
          )}

          {description && (
            <p
              {...textTarget(id, 'description')}
              className={`mt-4 font-ui ${sizeClass(LEAD_TEXT_SIZES, textSize)} text-deep-navy/80 max-w-2xl leading-relaxed`}
            >
              {description}
            </p>
          )}

          {buttonText &&
            (isBookingMode ? (
              finalButtonHref ? (
                <div className="mt-8">
                  <ExperienceBookingButton
                    product={_resolved?.bookingProduct}
                    productId={bookingProductId}
                    buttonText={buttonText}
                    variant={buttonVariant === 'magenta' ? 'primary' : 'primary'}
                    shape={buttonShape}
                    size="lg"
                    showPrice={true}
                    pageSlug={_resolved?.pageSlug ?? undefined}
                  >
                    <span {...textTarget(id, 'buttonText')}>
                      {formatBookingButtonLabel(
                        buttonText,
                        _resolved?.bookingProduct?.salePrice ??
                          _resolved?.bookingProduct?.price,
                        true,
                      )}
                    </span>
                  </ExperienceBookingButton>
                </div>
              ) : isEditing && isBookingUnavailable ? (
                <div className="mt-8">
                  <Button
                    href="#"
                    variant="primary"
                    size="lg"
                    className="opacity-60 pointer-events-none"
                  >
                    <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                  </Button>
                  <p className="text-xs text-bright-magenta mt-2 font-ui">
                    {vi.sm04.noBookingProduct}
                  </p>
                </div>
              ) : null
            ) : buttonAction === 'form' ? (
              <div className="mt-8">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setActiveFormType(formType || 'brochure-chuyen-minh')
                    setActiveModalTitle(formTitle)
                    setActiveSuccessMessage(formSuccessMessage)
                    setIsModalOpen(true)
                  }}
                >
                  <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                </Button>
              </div>
            ) : finalButtonHref ? (
              <div className="mt-8">
                <Button href={finalButtonHref} variant="primary" size="lg">
                  <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                </Button>
              </div>
            ) : isEditing && isBookingUnavailable ? (
              <div className="mt-8">
                <Button
                  href="#"
                  variant="primary"
                  size="lg"
                  className="opacity-60 pointer-events-none"
                >
                  <span {...textTarget(id, 'buttonText')}>{buttonText}</span>
                </Button>
                <p className="text-xs text-bright-magenta mt-2 font-ui">
                  {vi.sm04.noBookingProduct}
                </p>
              </div>
            ) : null)}

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
                <span
                  {...textTarget(id, 'proofText')}
                  className="font-ui text-xs sm:text-sm font-medium text-deep-navy/75"
                >
                  {proofText}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formType={activeFormType}
        title={activeModalTitle}
        successMessage={activeSuccessMessage}
        pageSlug={_resolved?.pageSlug ?? undefined}
      />
    </section>
  )
}
