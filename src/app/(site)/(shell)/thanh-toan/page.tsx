import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getSafeRedirectUrl } from '@/lib/auth/redirect'
import { getAccess } from '@/lib/entitlements'
import { getEffectivePrice } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'
import {
  DigitalToolCheckoutForm,
  type DigitalToolCheckoutProduct,
} from '@/components/site/checkout/DigitalToolCheckoutForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `${vi.checkout.title} | Trạm Dừng Cảm Xúc`,
  robots: {
    index: false,
    follow: false,
  },
}

interface PageProps {
  searchParams: Promise<{
    'san-pham'?: string
  }>
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams
  const productSlug = (params['san-pham'] || '').trim()

  // 1. Kiểm tra đăng nhập
  const customer = await getCurrentCustomer()
  if (!customer) {
    const returnUrl = productSlug
      ? `/thanh-toan?san-pham=${encodeURIComponent(productSlug)}`
      : '/thanh-toan'
    const safeTarget = getSafeRedirectUrl(returnUrl)
    redirect(`/tai-khoan/dang-nhap?next=${encodeURIComponent(safeTarget)}`)
  }

  // 2. Kiểm tra slug sản phẩm
  if (!productSlug) {
    return (
      <div className="py-12 sm:py-20 px-4 max-w-xl mx-auto text-center space-y-4">
        <h1 className="font-heading text-3xl text-deep-navy">Không tìm thấy sản phẩm</h1>
        <p className="font-sans text-sm text-deep-navy/70">
          Vui lòng chọn một công cụ số từ thư viện hoặc trang chủ để tiếp tục thanh toán.
        </p>
        <div className="pt-4">
          <Link
            href="/thu-vien"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-bright-magenta text-white font-ui font-semibold text-sm hover:bg-bright-magenta/90 transition-colors"
          >
            Khám phá thư viện
          </Link>
        </div>
      </div>
    )
  }

  // 3. Đọc sản phẩm từ cơ sở dữ liệu
  const payload = await getPayload({ config: await config })
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: productSlug } },
    overrideAccess: true,
    limit: 1,
  })

  const product = products.docs[0] as Product | undefined

  const isEligible =
    product &&
    product._status === 'published' &&
    product.type === 'digital_tool' &&
    product.saleStatus === 'on_sale' &&
    (!product.externalUrl || product.externalUrl.trim().length === 0)

  if (!isEligible) {
    return (
      <div className="py-12 sm:py-20 px-4 max-w-xl mx-auto text-center space-y-4">
        <h1 className="font-heading text-3xl text-deep-navy">Sản phẩm không khả dụng</h1>
        <p className="font-sans text-sm text-deep-navy/70">{vi.checkout.productNotFound}</p>
        <div className="pt-4">
          <Link
            href="/thu-vien"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-bright-magenta text-white font-ui font-semibold text-sm hover:bg-bright-magenta/90 transition-colors"
          >
            Quay lại thư viện
          </Link>
        </div>
      </div>
    )
  }

  // 4. Kiểm tra quyền active hiện tại
  const now = new Date()
  const access = await getAccess(customer.id, product.id, { payload, now })
  const alreadyActive = access.hasAccess && access.status === 'active'
  const directToolUrl =
    product.web === 'habit' ? '/habit' : product.web === 'eq' ? '/eq-buddy' : `/${product.slug}`

  // 5. Chuẩn bị DTO hiển thị
  const effective = getEffectivePrice(product, now)
  const coverImageUrl =
    product.coverImage && typeof product.coverImage === 'object' && 'url' in product.coverImage
      ? (product.coverImage.url as string | null)
      : null
  const coverImageAlt =
    product.coverImage && typeof product.coverImage === 'object' && 'alt' in product.coverImage
      ? (product.coverImage.alt as string | null)
      : product.name

  const checkoutProduct: DigitalToolCheckoutProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    web: (product.web as 'site' | 'habit' | 'eq') || 'site',
    shortDescription: product.shortDescription,
    coverImage: {
      url: coverImageUrl,
      alt: coverImageAlt,
    },
    price: effective.price,
    salePrice: effective.salePrice,
    accessDurationDays: product.accessDurationDays ?? null,
  }

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-8 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-bright-magenta">
          Trạm Dừng Cảm Xúc · Bán lẻ công cụ số
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl text-deep-navy">Xác nhận đơn hàng</h1>
        <p className="font-quote italic text-sm text-deep-navy/70">
          Bước cuối cùng để sở hữu công cụ đồng hành cùng cảm xúc của bạn
        </p>
      </div>

      <DigitalToolCheckoutForm
        product={checkoutProduct}
        alreadyActive={alreadyActive}
        toolUrl={directToolUrl}
      />
    </div>
  )
}
