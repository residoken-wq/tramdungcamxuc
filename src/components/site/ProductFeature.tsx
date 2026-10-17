'use client'

import React from 'react'
import Image from 'next/image'
import { PriceTag } from '@/components/ui/PriceTag'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Butterfly } from '@/components/brand/Butterfly'
import { getEffectivePrice, resolveProductCta, type PublicProduct } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'
import { useClientProduct } from '@/puck/client-preview'

export interface ProductFeatureProps {
  version?: number
  productId?: string | number
  layout?: 'image-left' | 'image-right'
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    product?: PublicProduct | null
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

export function ProductFeature({
  productId,
  layout = 'image-left',
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: ProductFeatureProps) {
  const isEditing = puck?.isEditing ?? false

  const { product, loading } = useClientProduct(productId, _resolved?.product)

  if (!isEditing && (!product || product.saleStatus === 'hidden')) {
    return null
  }

  const isDeepNavy = bgColor === 'deep-navy'

  if (loading && !product) {
    return (
      <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
        <div className="mx-auto max-w-5xl py-8 text-center text-sm font-ui text-deep-navy/60">
          Đang tải dữ liệu sản phẩm...
        </div>
      </section>
    )
  }

  if (!product) {
    if (isEditing) {
      return (
        <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
          <div className="mx-auto max-w-5xl py-8 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
            Chưa chọn sản phẩm nổi bật. Vui lòng chọn sản phẩm trong thanh bên phải.
          </div>
        </section>
      )
    }
    return null
  }

  const now = new Date()
  const effective = getEffectivePrice(product, now)
  const ctaInfo = resolveProductCta(product, now)

  const coverUrl =
    product.coverImage && typeof product.coverImage === 'object'
      ? (product.coverImage as { url?: string }).url
      : undefined

  const coverImageAlt =
    product.coverImage && typeof product.coverImage === 'object'
      ? (product.coverImage as { alt?: string }).alt || product.name
      : product.name

  const journeyLabel =
    product.journeyStep && vi.product.journeySteps[product.journeyStep]
      ? vi.product.journeySteps[product.journeyStep]
      : product.journeyStep

  const isImageRight = layout === 'image-right'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image Column */}
          <div className={`w-full ${isImageRight ? 'md:order-2' : 'md:order-1'}`}>
            <div
              className={`relative aspect-[16/10] w-full overflow-hidden rounded-card border shadow-soft bg-lavender-mist flex items-center justify-center ${
                isDeepNavy ? 'border-white/20' : 'border-deep-navy/10'
              }`}
            >
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={coverImageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div
                  data-testid="product-feature-placeholder"
                  className="w-full h-full bg-lavender-mist flex items-center justify-center"
                  aria-hidden="true"
                >
                  {/* a11y-contrast-ok: SVG trang trí Butterfly có aria-hidden, không chứa chữ */}
                  <Butterfly className="w-20 h-20 text-deep-navy/35" aria-hidden={true} />
                </div>
              )}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
                <StatusBadge status={product.saleStatus} />
                {product.trialDays && product.trialDays > 0 ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-ui text-xs font-semibold bg-white/95 text-deep-navy border border-deep-navy/15 shadow-sm backdrop-blur-sm">
                    {product.trialDays} {vi.product.trialBadge}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Content Column */}
          <div
            className={`flex flex-col justify-center ${isImageRight ? 'md:order-1' : 'md:order-2'}`}
          >
            {journeyLabel && (
              <span className="text-xs font-bold uppercase tracking-wider text-bright-magenta mb-2 font-ui">
                {journeyLabel}
              </span>
            )}

            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight leading-tight mb-4 text-deep-navy">
              {product.name}
            </h2>

            {product.shortDescription && (
              <p
                className={`font-sans text-base leading-relaxed mb-6 ${
                  isDeepNavy ? 'text-white/85' : 'text-deep-navy/80'
                }`}
              >
                {product.shortDescription}
              </p>
            )}

            {/* Includes List */}
            {product.includes && product.includes.length > 0 && (
              <div className="mb-6 space-y-2">
                <span className="font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/60 block">
                  Bao gồm:
                </span>
                <ul className="space-y-1.5 font-ui text-sm">
                  {product.includes.map((item, index) => {
                    const text =
                      typeof item === 'string' ? item : (item as { text?: string | null })?.text
                    if (!text) return null
                    return (
                      <li key={index} className="flex items-start gap-2">
                        <span
                          className={`${isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'} font-bold mt-0.5`}
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                        <span className={isDeepNavy ? 'text-white/90' : 'text-deep-navy/90'}>
                          {text}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* PriceTag and CTA */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              <PriceTag originalPrice={effective.price} salePrice={effective.salePrice} size="lg" />
              {ctaInfo && (
                <Button
                  href={ctaInfo.href}
                  variant="primary"
                  size="md"
                  target={ctaInfo.external ? '_blank' : undefined}
                  rel={ctaInfo.external ? 'noopener noreferrer' : undefined}
                >
                  {ctaInfo.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
