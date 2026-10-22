import React from 'react'
import { PackageCardItem } from './PackageCardItem'
import { PackageCardsCTA } from './PackageCardsCTA'
import type { PublicProduct } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'

export interface PackageCardsProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  description?: string
  style?: 'icon' | 'numbered'
  cards?: React.ReactNode | React.ComponentType<{ className?: string }> | unknown[]
  // Legacy v1 props:
  packages?: Array<{ packageId?: string | number }>
  packageIds?: Array<string | number>
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
  style = 'icon',
  cards,
  packages: rawPackages,
  packageIds,
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
  const isEditing = Boolean(puck?.isEditing)
  const isDeepNavy = bgColor === 'deep-navy'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const descColorClass = isDeepNavy ? 'text-white/80' : 'text-deep-navy/80'

  const hasCards = Boolean(cards)
  const v1Packages = (_resolved?.packages || rawPackages || packageIds || []) as Array<
    PublicProduct | { packageId?: string | number } | string | number
  >
  const hasV1Packages = v1Packages.length > 0

  if (!isEditing && !hasCards && !hasV1Packages) {
    return null
  }

  // Determine button URL for CTA
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

  const highlightIdStr = highlightPackageId ? String(highlightPackageId) : ''
  const gridClasses =
    'grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch [counter-reset:card-counter]'

  return (
    <section
      className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors group/grid`}
      data-style={style}
      data-bg={bgColor}
    >
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

        {/* Cards Grid: 1 col on mobile, 3 cols on desktop (slot or v1 fallback) */}
        {hasCards ? (
          typeof cards === 'function' ? (
            React.createElement(
              cards as React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
              { className: gridClasses },
            )
          ) : React.isValidElement(cards) ? (
            <div className={gridClasses}>{cards}</div>
          ) : Array.isArray(cards) ? (
            <div className={gridClasses}>
              {cards.map((child: unknown, idx: number) => {
                if (React.isValidElement(child)) return child
                if (child && typeof child === 'object') {
                  const item = child as { props?: Record<string, unknown> }
                  if (item.props) {
                    return (
                      <PackageCardItem
                        key={typeof item.props.id === 'string' ? item.props.id : idx}
                        isDeepNavy={isDeepNavy}
                        puck={puck}
                        {...item.props}
                      />
                    )
                  }
                }
                return null
              })}
            </div>
          ) : (
            <div className={gridClasses}>{cards as React.ReactNode}</div>
          )
        ) : hasV1Packages ? (
          <div className={gridClasses}>
            {v1Packages.slice(0, 3).map((pkg, idx) => {
              const pkgObj = typeof pkg === 'object' && pkg !== null ? (pkg as PublicProduct) : null
              const pkgId = pkgObj?.id || (pkg as { packageId?: string | number })?.packageId || pkg
              const isHighlighted = highlightIdStr !== '' && String(pkgId) === highlightIdStr

              return (
                <PackageCardItem
                  key={String(pkgId) || idx}
                  packageId={pkgId}
                  highlight={isHighlighted}
                  isDeepNavy={isDeepNavy}
                  _resolved={{ package: pkgObj && pkgObj.name ? pkgObj : null }}
                  puck={puck}
                />
              )
            })}
          </div>
        ) : isEditing ? (
          <div className="p-8 text-center text-deep-navy/60 bg-warm-ivory rounded-card border border-dashed border-deep-navy/20 m-4">
            {vi.builder.noDataSelectInCms}
          </div>
        ) : null}

        {/* Optional Action Button below cards */}
        <PackageCardsCTA
          buttonText={buttonText}
          targetHref={targetHref}
          bookingProductId={_resolved?.bookingProductId}
          isEditing={isEditing}
        />
      </div>
    </section>
  )
}
