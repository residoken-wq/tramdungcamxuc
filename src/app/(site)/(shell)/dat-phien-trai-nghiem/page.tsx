import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getEffectivePrice } from '@/lib/products'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ExperienceBookingForm } from '@/components/site/ExperienceBookingForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Đặt phiên trải nghiệm | Trạm Dừng Cảm Xúc',
  description:
    'Đăng ký phiên trải nghiệm Growth Mirror 1:1 cùng Coach Hana Lương để thấu hiểu và chuyển hóa cảm xúc.',
}

interface PageProps {
  searchParams: Promise<{
    'san-pham'?: string
  }>
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

  // Bắt buộc sản phẩm phải tồn tại, thuộc loại coaching_trial và đang ở trạng thái published
  if (!product || product.type !== 'coaching_trial' || product._status !== 'published') {
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
    <main className="min-h-screen bg-warm-ivory py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12">
        <SectionHeader
          seriesLabel="Đồng hành 1:1 · Trạm Dừng Cảm Xúc"
          titleLine1="ĐẶT PHIÊN TRẢI NGHIỆM"
          titleLine2="KHỞI ĐẦU HÀNH TRÌNH HIỂU MÌNH"
          emotionLine="Một khoảng dừng an toàn để lắng nghe, gọi tên và thấu suốt cảm xúc cùng Coach."
          as="h1"
          align="center"
        />

        <ExperienceBookingForm product={productInfo} />
      </div>
    </main>
  )
}
