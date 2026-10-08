import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getEffectivePrice } from '@/lib/products'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ExperienceBookingForm } from '@/components/site/ExperienceBookingForm'
import { vi } from '@/lib/i18n/vi'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    'san-pham'?: string
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { 'san-pham': sanPhamParam } = await searchParams
  const productId = sanPhamParam ? parseInt(sanPhamParam, 10) : NaN

  let description: string | undefined
  if (!isNaN(productId) && productId > 0) {
    try {
      const payload = await getPayload({ config: await config })
      const product = await payload.findByID({
        collection: 'products',
        id: productId,
      })
      if (product?.shortDescription) {
        description = product.shortDescription
      }
    } catch {
      // fallback
    }
  }

  return {
    title: 'Đặt phiên trải nghiệm | Trạm Dừng Cảm Xúc',
    description,
  }
}

export default async function ExperienceBookingPage({ searchParams }: PageProps) {
  const { 'san-pham': sanPhamParam } = await searchParams

  if (!sanPhamParam) {
    notFound()
  }

  const productId = parseInt(sanPhamParam, 10)
  if (isNaN(productId) || productId <= 0) {
    notFound()
  }

  const payload = await getPayload({ config: await config })

  let product
  try {
    product = await payload.findByID({
      collection: 'products',
      id: productId,
    })
  } catch {
    notFound()
  }

  // REVIEW-REQUIRED: Bắt buộc sản phẩm phải tồn tại, thuộc loại coaching_trial, published và saleStatus === on_sale
  if (
    !product ||
    product.type !== 'coaching_trial' ||
    product._status !== 'published' ||
    product.saleStatus !== 'on_sale'
  ) {
    notFound()
  }

  const pricing = getEffectivePrice(product, new Date())
  const currentPrice = pricing.salePrice ?? pricing.price

  if (currentPrice == null || currentPrice <= 0) {
    notFound()
  }

  const productInfo = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    currentPrice,
    originalPrice: pricing.salePrice != null ? pricing.price : null,
    shortDescription: product.shortDescription,
  }

  return (
    <div className="min-h-screen bg-warm-ivory py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12">
        <SectionHeader
          seriesLabel={vi.payment.ui.booking.seriesLabel}
          titleLine1={vi.payment.ui.booking.titleLine1}
          titleLine2={vi.payment.ui.booking.titleLine2}
          emotionLine={vi.payment.ui.booking.emotionLine}
          as="h1"
          align="center"
        />

        <ExperienceBookingForm product={productInfo} />
      </div>
    </div>
  )
}
