import React from 'react'
import { ProductCard } from '@/components/site/ProductCard'
import { toPublicProduct, resolveProductCta, type PublicProduct } from '@/lib/products'
import type { Product } from '@/payload-types'
import { vi } from '@/lib/i18n/vi'

export interface RelatedOfferProps {
  product?: Product | PublicProduct | Record<string, unknown> | null
  className?: string
}

/**
 * Hiển thị sản phẩm gợi ý kèm theo thẻ EQ Buddy.
 * Tự động ẩn hoàn toàn nếu không có sản phẩm hoặc sản phẩm có trạng thái saleStatus === 'hidden'.
 */
export function RelatedOffer({ product, className = '' }: RelatedOfferProps) {
  if (!product) {
    return null
  }

  // Chuyển đổi an toàn sang PublicProduct
  const publicProduct = toPublicProduct(product)
  if (publicProduct.saleStatus === 'hidden') {
    return null
  }

  const ctaInfo = resolveProductCta(publicProduct)

  return (
    <section
      aria-labelledby="related-offer-heading"
      className={`w-full max-w-xl mx-auto ${className}`}
    >
      <div className="text-center mb-6">
        <h3
          id="related-offer-heading"
          className="font-display text-2xl md:text-3xl text-deep-navy tracking-tight"
        >
          {vi.eqBuddy.offer.relatedHeading}
        </h3>
      </div>
      <ProductCard
        name={publicProduct.name}
        shortDescription={publicProduct.shortDescription || undefined}
        coverImage={
          publicProduct.coverImage?.url
            ? {
                src: publicProduct.coverImage.url,
                alt: publicProduct.coverImage.alt || publicProduct.name,
              }
            : null
        }
        price={publicProduct.price}
        salePrice={publicProduct.salePrice}
        saleStatus={publicProduct.saleStatus}
        trialDays={publicProduct.trialDays}
        journeyStep={publicProduct.journeyStep || undefined}
        ctaInfo={ctaInfo}
      />
    </section>
  )
}

export default RelatedOffer
