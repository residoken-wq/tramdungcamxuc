'use client'

import React from 'react'
import type { Product } from '@/payload-types'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { resolveProductCta } from '@/lib/products'
import { useClientProduct } from '@/puck/client-preview'

export interface TrialCTAProps {
  version?: number
  productId?: string | number
  seriesLabel?: string
  titleLine1: string
  titleLine2: string
  emotionLine?: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    product?: Product | null
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

export function TrialCTA({
  productId,
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: TrialCTAProps) {
  const isEditing = puck?.isEditing ?? false

  const { product, loading } = useClientProduct(productId, _resolved?.product)

  // On public page, if no product or hidden, render nothing
  if (!isEditing && (!product || product.saleStatus === 'hidden')) {
    return null
  }

  // If product exists but does not have trial days, public page renders nothing!
  if (!isEditing && (!product?.trialDays || product.trialDays <= 0)) {
    return null
  }

  if (loading && !product) {
    return (
      <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
        <div className="mx-auto max-w-4xl py-6 text-center text-sm font-ui text-deep-navy/60">
          Đang tải thông tin dùng thử...
        </div>
      </section>
    )
  }

  // If in editor and product is missing or has no trialDays, show editor warning
  if (isEditing && (!product || !product.trialDays || product.trialDays <= 0)) {
    return (
      <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
        <div className="mx-auto max-w-4xl py-6 px-4 rounded-card border-2 border-dashed border-accent-pink/40 bg-soft-pink/30 text-center font-ui text-sm text-deep-navy">
          {!product ? (
            <p>
              Vui lòng chọn sản phẩm có hỗ trợ dùng thử (trialDays &gt; 0) ở bảng cấu hình bên phải.
            </p>
          ) : (
            <p className="text-bright-magenta font-semibold">
              ⚠️ Cảnh báo biên tập: Sản phẩm &quot;{product.name}&quot; không có chính sách dùng thử
              (trialDays &le; 0). Khối này sẽ tự động ẩn trên trang công khai.
            </p>
          )}
        </div>
      </section>
    )
  }

  if (!product) {
    return null
  }

  const now = new Date()
  const ctaInfo = resolveProductCta(product, now)

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-4xl flex flex-col items-center text-center">
        <SectionHeader
          seriesLabel={seriesLabel}
          titleLine1={titleLine1}
          titleLine2={titleLine2}
          emotionLine={emotionLine}
          align="center"
          as="h2"
        />

        {ctaInfo && (
          <div className="mt-8">
            <Button
              href={ctaInfo.href}
              variant="primary"
              size="lg"
              target={ctaInfo.external ? '_blank' : undefined}
              rel={ctaInfo.external ? 'noopener noreferrer' : undefined}
            >
              {ctaInfo.label}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
