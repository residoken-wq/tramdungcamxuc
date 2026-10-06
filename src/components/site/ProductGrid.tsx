'use client'

import React from 'react'
import type { Product } from '@/payload-types'
import { ProductCard } from './ProductCard'
import { getEffectivePrice, resolveProductCta } from '@/lib/products'
import { useClientProducts } from '@/puck/client-preview'

export interface ProductGridProps {
  version?: number
  mode?: 'manual' | 'filter'
  manualProducts?: Array<{ productId?: string | number }>
  productIds?: Array<string | number>
  filterWeb?: 'all' | 'site' | 'habit' | 'eq'
  filterType?:
    | 'all'
    | 'ebook'
    | 'toolkit'
    | 'digital_tool'
    | 'physical_external'
    | 'workshop'
    | 'community'
    | 'coaching_trial'
    | 'package'
    | 'b2b'
  limit?: 3 | 6 | 9
  columns?: 2 | 3
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    products?: Product[]
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

export function ProductGrid({
  mode = 'manual',
  manualProducts,
  productIds,
  filterWeb = 'all',
  filterType = 'all',
  limit = 6,
  columns = 3,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: ProductGridProps) {
  const isEditing = puck?.isEditing ?? false

  // Gather IDs from manualProducts or productIds
  const resolvedIds = (manualProducts?.map((m) => m?.productId).filter(Boolean) ??
    productIds ??
    []) as Array<string | number>

  const { products, loading } = useClientProducts({
    productIds: resolvedIds,
    mode,
    filterWeb,
    filterType,
    limit,
    initialProducts: _resolved?.products,
  })

  // On public page, if no products are resolved, do not render empty section
  if (!isEditing && (!products || products.length === 0)) {
    return null
  }

  const isDeepNavy = bgColor === 'deep-navy'
  const colClass = columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
  const now = new Date()

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {loading && products.length === 0 ? (
          <div className="py-12 text-center text-sm font-ui text-deep-navy/60">
            Đang tải dữ liệu sản phẩm...
          </div>
        ) : products.length === 0 ? (
          isEditing ? (
            <div className="py-12 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
              Chưa có sản phẩm nào được chọn hoặc tìm thấy theo bộ lọc. Vui lòng cấu hình trong
              thanh bên phải.
            </div>
          ) : null
        ) : (
          <div className={`grid grid-cols-1 ${colClass} gap-6 sm:gap-8 items-stretch`}>
            {products.map((product) => {
              if (product.saleStatus === 'hidden') return null

              const effective = getEffectivePrice(product, now)
              const ctaInfo = resolveProductCta(product, now)

              const coverImage =
                product.coverImage && typeof product.coverImage === 'object'
                  ? {
                      src: (product.coverImage as { url?: string }).url || '/brand/placeholder.png',
                      alt: (product.coverImage as { alt?: string }).alt || product.name,
                    }
                  : {
                      src: '/brand/placeholder.png',
                      alt: product.name,
                    }

              return (
                <div key={product.id} className="h-full">
                  <ProductCard
                    name={product.name}
                    shortDescription={product.shortDescription || undefined}
                    coverImage={coverImage}
                    price={effective.price}
                    salePrice={effective.salePrice}
                    saleStatus={product.saleStatus}
                    trialDays={product.trialDays}
                    journeyStep={product.journeyStep || undefined}
                    ctaInfo={ctaInfo}
                    className={isDeepNavy ? 'shadow-md border-white/20' : ''}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
