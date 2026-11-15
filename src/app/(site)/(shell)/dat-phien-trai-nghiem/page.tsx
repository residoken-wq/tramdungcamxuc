import React from 'react'
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getEffectivePrice, getBookingPath, isBookableExperience } from '@/lib/products'
import { resolveDefaultBookingProduct } from '@/puck/resolve.server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ExperienceBookingForm } from '@/components/site/ExperienceBookingForm'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    'san-pham'?: string
    goi?: string
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { 'san-pham': sanPhamParam } = await searchParams
  const productId = sanPhamParam ? parseInt(sanPhamParam, 10) : NaN

  if (isNaN(productId) || productId <= 0) {
    return {
      title: 'Đặt phiên trải nghiệm | Trạm Dừng Cảm Xúc',
    }
  }

  try {
    const payload = await getPayload({ config: await config })
    const product = await payload.findByID({
      collection: 'products',
      id: productId,
    })

    if (!product || product.type !== 'coaching_trial') {
      return {
        title: 'Đặt phiên trải nghiệm | Trạm Dừng Cảm Xúc',
      }
    }

    if (!isBookableExperience(product)) {
      const defaultProduct = await resolveDefaultBookingProduct(payload)
      if (!defaultProduct || Number(defaultProduct.id) === productId) {
        return {
          title: `${vi.bx06.pausedMetadataTitle} | Trạm Dừng Cảm Xúc`,
          description: vi.bx06.pausedDescription,
          robots: {
            index: false,
            follow: false,
          },
        }
      }
    }

    return {
      title: 'Đặt phiên trải nghiệm | Trạm Dừng Cảm Xúc',
      description: product?.shortDescription ?? undefined,
    }
  } catch {
    return {
      title: 'Đặt phiên trải nghiệm | Trạm Dừng Cảm Xúc',
    }
  }
}

export default async function ExperienceBookingPage({ searchParams }: PageProps) {
  const { 'san-pham': sanPhamParam, goi: goiParam } = await searchParams

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

  // Bắt buộc sản phẩm phải tồn tại và thuộc loại coaching_trial (BX-06 mục 3)
  if (!product || product.type !== 'coaching_trial') {
    notFound()
  }

  // REVIEW-REQUIRED: Khi phiên trải nghiệm không đủ điều kiện đặt lịch (BX-06 mục 3):
  // - Nếu còn sản phẩm phiên trải nghiệm khác đặt được: chuyển hướng (307)
  // - Nếu không còn sản phẩm nào: render trang thân thiện 200 (noindex)
  if (!isBookableExperience(product)) {
    const alternative = await resolveDefaultBookingProduct(payload)
    if (alternative && Number(alternative.id) !== productId) {
      const targetPath = getBookingPath(alternative.id)
      const redirectUrl =
        typeof goiParam === 'string' && goiParam.trim().length > 0
          ? `${targetPath}&goi=${encodeURIComponent(goiParam.trim())}`
          : targetPath
      redirect(redirectUrl)
    }

    // Không còn sản phẩm nào khả dụng -> render trang thông báo tạm ngưng
    let zaloUrl: string | null = null
    try {
      const settings = await payload.findGlobal({ slug: 'siteSettings' })
      zaloUrl =
        typeof settings?.zaloChatUrl === 'string' && settings.zaloChatUrl.trim().length > 0
          ? settings.zaloChatUrl.trim()
          : null
    } catch {
      // fallback
    }

    return (
      <main className="min-h-[60vh] flex items-center justify-center py-16 px-4 bg-warm-ivory">
        <div className="max-w-xl w-full mx-auto text-center bg-white/80 rounded-2xl p-8 sm:p-12 border border-lavender-mist shadow-sm">
          <SectionHeader
            as="h1"
            seriesLabel={vi.bx06.pausedSeriesLabel}
            titleLine1={vi.bx06.pausedTitleLine1}
            titleLine2={vi.bx06.pausedTitleLine2}
            emotionLine={vi.bx06.pausedEmotionLine}
            align="center"
          />
          <p className="mt-6 font-sans text-base sm:text-lg text-deep-navy/80 leading-relaxed max-w-xl mx-auto">
            {vi.bx06.pausedDescription}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {zaloUrl && (
              <Button
                href={zaloUrl}
                variant="primary"
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                {vi.bx06.contactZaloButton}
              </Button>
            )}
            <Button
              href="/lien-he"
              variant={zaloUrl ? 'secondary' : 'primary'}
              size="lg"
            >
              {vi.bx06.contactPageButton}
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const pricing = getEffectivePrice(product, new Date())
  const currentPrice = pricing.salePrice ?? pricing.price

  if (currentPrice == null || currentPrice <= 0) {
    notFound()
  }

  // Fetch published services for "Lộ trình quan tâm"
  let servicesList: Array<{ id: number; name: string }> = []
  try {
    const servicesDocs = await payload.find({
      collection: 'services',
      where: {
        and: [{ _status: { equals: 'published' } }, { saleStatus: { not_equals: 'hidden' } }],
      },
      sort: 'createdAt',
      limit: 50,
    })
    servicesList = servicesDocs.docs.map((s) => ({
      id: s.id,
      name: s.name,
    }))
  } catch {
    // fallback
  }

  // Fetch interested package if ?goi=<slug> is present
  let interestedPackage: { slug: string; name: string } | null = null
  if (typeof goiParam === 'string' && goiParam.trim().length > 0) {
    try {
      const pkgDocs = await payload.find({
        collection: 'products',
        where: {
          and: [
            { slug: { equals: goiParam.trim() } },
            { type: { equals: 'package' } },
            { _status: { equals: 'published' } },
            { saleStatus: { not_equals: 'hidden' } },
          ],
        },
        limit: 1,
      })
      if (pkgDocs.totalDocs > 0 && pkgDocs.docs[0]?.name) {
        interestedPackage = {
          slug: pkgDocs.docs[0].slug,
          name: pkgDocs.docs[0].name,
        }
      }
    } catch {
      // Slug lạ / gói ẩn -> bỏ qua im lặng
    }
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

        <ExperienceBookingForm
          product={productInfo}
          services={servicesList}
          interestedPackage={interestedPackage}
        />
      </div>
    </div>
  )
}
