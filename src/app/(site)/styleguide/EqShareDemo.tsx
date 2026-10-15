'use client'

import React from 'react'
import { CardShareButtons } from '@/components/eq/CardShareButtons'
import { PhysicalDeckButton } from '@/components/eq/PhysicalDeckButton'
import { RelatedOffer } from '@/components/eq/RelatedOffer'

export function EqShareDemo() {
  const sampleDeckProduct = {
    name: '[MẪU] Bộ Thẻ EQ Buddy Vật Lý (26 Thẻ)',
    slug: 'bo-the-eq-buddy',
    type: 'physical_external' as const,
    externalUrl: 'https://shopee.vn/tramdungcamxuc-eq-buddy-deck',
  }

  const sampleOfferProduct = {
    id: 999,
    name: '[MẪU] Gói Đồng Hành Growth Mirror (CLEAR)',
    slug: 'growth-mirror-clear',
    shortDescription:
      'Phiên khai vấn 1:1 cùng Hana Lương và trọn bộ công cụ số Habit Tracker + EQ Buddy vĩnh viễn.',
    saleStatus: 'on_sale' as const,
    price: 2500000,
    salePrice: 1750000,
    journeyStep: 'feel',
  }

  return (
    <div className="space-y-10">
      {/* 1. Demo CardShareButtons */}
      <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between border-b border-deep-navy/10 pb-3">
          <div>
            <span className="inline-block rounded-full bg-soft-pink px-2.5 py-0.5 text-xs font-bold uppercase text-bright-magenta">
              [MẪU] T3-05
            </span>
            <h3 className="mt-1 font-ui text-sm font-bold text-deep-navy">
              1. CardShareButtons (Tải ảnh 4:5, 9:16 và chia sẻ Web Share / Clipboard)
            </h3>
          </div>
          <span className="text-xs text-deep-navy/60">Mã thẻ: B-01</span>
        </div>
        <div className="py-6 flex justify-center bg-warm-ivory/50 rounded-lg border border-deep-navy/5">
          <CardShareButtons cardCode="B-01" qrSlug="b-01-binh-an" />
        </div>
      </div>

      {/* 2. Demo PhysicalDeckButton */}
      <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between border-b border-deep-navy/10 pb-3">
          <div>
            <span className="inline-block rounded-full bg-soft-pink px-2.5 py-0.5 text-xs font-bold uppercase text-bright-magenta">
              [MẪU] T3-05
            </span>
            <h3 className="mt-1 font-ui text-sm font-bold text-deep-navy">
              2. PhysicalDeckButton (Nút Shopee bộ thẻ vật lý có UTM &amp; Analytics)
            </h3>
          </div>
          <span className="text-xs text-deep-navy/60">Type: physical_external</span>
        </div>
        <div className="py-6 flex justify-center bg-warm-ivory/50 rounded-lg border border-deep-navy/5">
          <PhysicalDeckButton
            product={sampleDeckProduct}
            campaign="styleguide_demo"
            showHint={true}
          />
        </div>
      </div>

      {/* 3. Demo RelatedOffer */}
      <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between border-b border-deep-navy/10 pb-3">
          <div>
            <span className="inline-block rounded-full bg-soft-pink px-2.5 py-0.5 text-xs font-bold uppercase text-bright-magenta">
              [MẪU] T3-05
            </span>
            <h3 className="mt-1 font-ui text-sm font-bold text-deep-navy">
              3. RelatedOffer (Gợi ý ưu đãi liên quan theo thẻ, tự ẩn khi hidden)
            </h3>
          </div>
          <span className="text-xs text-deep-navy/60">ProductCard + resolveProductCta</span>
        </div>
        <div className="py-6 px-4 bg-warm-ivory/50 rounded-lg border border-deep-navy/5">
          <RelatedOffer product={sampleOfferProduct} />
        </div>
      </div>
    </div>
  )
}

export default EqShareDemo
