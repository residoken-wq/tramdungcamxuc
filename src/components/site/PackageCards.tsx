'use client'

import React from 'react'
import { BrandIcon } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { useClientProducts } from '@/puck/client-preview'
import { vi } from '@/lib/i18n/vi'
import { getBookingPath, BOOKING_PATH, type PublicProduct } from '@/lib/products'

export interface PackageCardsProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  description?: string
  packages?: Array<{ packageId?: string | number }>
  packageIds?: Array<string | number>
  style?: 'icon' | 'numbered'
  highlightPackageId?: string | number
  buttonText?: string
  buttonLinkType?: 'page' | 'url'
  buttonPageId?: string | number
  buttonLink?: string
  buttonUrl?: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    packages?: PublicProduct[]
    buttonUrl?: string | null
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
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function PackageCards({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  description,
  packages: rawPackages,
  packageIds,
  style = 'icon',
  highlightPackageId,
  buttonText,
  buttonLinkType = 'url',
  buttonLink,
  buttonUrl,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: PackageCardsProps) {
  const isEditing = puck?.isEditing ?? false
  const isDeepNavy = bgColor === 'deep-navy'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const descColorClass = isDeepNavy ? 'text-white/80' : 'text-deep-navy/80'

  const resolvedIds = React.useMemo(() => {
    return (rawPackages?.map((p) => p?.packageId).filter(Boolean) ?? packageIds ?? []) as Array<
      string | number
    >
  }, [rawPackages, packageIds])

  const { products: loadedPackages } = useClientProducts({
    productIds: resolvedIds.slice(0, 3),
    mode: 'manual',
    initialProducts: _resolved?.packages,
  })

  // Determine button URL
  let targetHref = ''
  if (_resolved?.buttonUrl) {
    targetHref = _resolved.buttonUrl
  } else if (_resolved?.pageSlug) {
    targetHref = _resolved.pageSlug === 'trang-chu' ? '/' : `/${_resolved.pageSlug}`
  } else if (buttonLinkType === 'url') {
    targetHref = buttonUrl || buttonLink || ''
  } else {
    targetHref = buttonLink || ''
  }

  const bookingProductId = _resolved?.bookingProductId ?? null
  const isBookingLink =
    targetHref.trim() === BOOKING_PATH || targetHref.trim() === '/dat-phien-trai-nghiem'

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
    finalButtonHref = safeHref(targetHref)
  }

  // Empty data handling
  if (!loadedPackages || loadedPackages.length === 0) {
    if (isEditing) {
      return (
        <div className="p-8 text-center text-deep-navy/60 bg-warm-ivory rounded-card border border-dashed border-deep-navy/20 m-4">
          {vi.builder.noDataSelectInCms}
        </div>
      )
    }
    return null
  }

  const highlightIdStr = highlightPackageId ? String(highlightPackageId) : ''

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        {/* Optional Header */}
        {(titleLine1 || seriesLabel) && (
          <div className="text-center mb-10 sm:mb-14 flex flex-col items-center">
            {seriesLabel && (
              <span
                className={`mb-3 font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
              >
                {seriesLabel}
              </span>
            )}

            {titleLine1 && (
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-[1.15]">
                <span className={isDeepNavy ? 'text-white' : 'text-deep-navy'}>{titleLine1}</span>{' '}
                {titleLine2 && <span className={titleLine2ColorClass}>{titleLine2}</span>}
              </h2>
            )}

            {emotionLine && (
              <p
                className={`mt-4 font-quote text-lg sm:text-xl italic max-w-2xl ${
                  isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
                }`}
              >
                {emotionLine}
              </p>
            )}

            {description && (
              <p
                className={`mt-4 font-ui text-base sm:text-lg leading-relaxed max-w-2xl ${descColorClass}`}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Cards Grid: 1 col on mobile, up to 3 cols on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {loadedPackages.map((pkg, idx) => {
            const isHighlighted = highlightIdStr !== '' && String(pkg.id) === highlightIdStr
            const cardBg = isHighlighted
              ? isDeepNavy
                ? 'bg-white/15 border-accent-pink shadow-md ring-2 ring-accent-pink'
                : 'bg-white border-accent-pink shadow-md ring-2 ring-accent-pink'
              : isDeepNavy
                ? 'bg-white/10 border-white/20 shadow-soft'
                : 'bg-white border-deep-navy/10 shadow-soft'

            return (
              <div
                key={pkg.id || idx}
                className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-card border transition-all ${cardBg}`}
              >
                <div>
                  {/* Style: Icon or Numbered */}
                  {style === 'numbered' ? (
                    <div className="font-display text-3xl sm:text-4xl text-bright-magenta mb-4">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-soft-pink flex items-center justify-center text-deep-navy mb-4">
                      {pkg.icon ? (
                        <BrandIcon name={pkg.icon} className="w-6 h-6 text-deep-navy" />
                      ) : (
                        <BrandIcon name="star" className="w-6 h-6 text-deep-navy" />
                      )}
                    </div>
                  )}

                  {/* Package Name */}
                  <h3
                    className={`font-display text-2xl uppercase tracking-tight mb-2 ${
                      isDeepNavy ? 'text-white' : 'text-deep-navy'
                    }`}
                  >
                    {pkg.name}
                  </h3>

                  {/* Tagline */}
                  {pkg.tagline && (
                    <p
                      className={`font-quote text-base italic mb-3 ${
                        isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
                      }`}
                    >
                      {pkg.tagline}
                    </p>
                  )}

                  {/* Short Description */}
                  {pkg.shortDescription && (
                    <p className={`font-ui text-sm sm:text-base leading-relaxed ${descColorClass}`}>
                      {pkg.shortDescription}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Optional Action Button below cards (NO purchase button on individual cards - Q4/M2) */}
        {buttonText &&
          (finalButtonHref ? (
            <div className="mt-10 sm:mt-12 text-center">
              <Button href={finalButtonHref} variant="primary" size="md">
                {buttonText}
              </Button>
            </div>
          ) : isEditing && isBookingUnavailable ? (
            <div className="mt-10 sm:mt-12 text-center">
              <Button
                href="#"
                variant="primary"
                size="md"
                className="opacity-60 pointer-events-none"
              >
                {buttonText}
              </Button>
              <p className="text-xs text-bright-magenta mt-2 font-ui">{vi.sm04.noBookingProduct}</p>
            </div>
          ) : null)}
      </div>
    </section>
  )
}
