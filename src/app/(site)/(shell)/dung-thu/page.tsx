import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getSafeRedirectUrl } from '@/lib/auth/redirect'
import { getAccess } from '@/lib/entitlements'
import { getToolUrl } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'
import { TrialStartForm } from '@/components/site/trial/TrialStartForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `${vi.trial.title} | Trạm Dừng Cảm Xúc`,
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

export default async function TrialPage({ searchParams }: PageProps) {
  const params = await searchParams
  const productSlug = (params['san-pham'] || '').trim()

  // 1. Kiểm tra đăng nhập
  const customer = await getCurrentCustomer()
  if (!customer) {
    const returnUrl = productSlug
      ? `/dung-thu?san-pham=${encodeURIComponent(productSlug)}`
      : '/dung-thu'
    const safeTarget = getSafeRedirectUrl(returnUrl)
    redirect(`/tai-khoan/dang-nhap?next=${encodeURIComponent(safeTarget)}`)
  }

  // 2. Kiểm tra slug sản phẩm
  if (!productSlug) {
    notFound()
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
    typeof product.trialDays === 'number' &&
    product.trialDays > 0

  if (!isEligible) {
    notFound()
  }

  // 4. Kiểm tra quyền truy cập hiện tại
  const now = new Date()
  const access = await getAccess(customer.id, product.id, { payload, now })
  const toolUrl = getToolUrl(product)

  const trialDays = product.trialDays as number

  // Chỉ lấy lợi ích từ CMS; CMS trống thì ẩn khối lợi ích (không tự viết lời hứa)
  const benefits = Array.isArray(product.includes)
    ? product.includes.map((i) => i.text).filter(Boolean)
    : []

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-bright-magenta">
          {vi.trial.pageBadge}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-deep-navy">{product.name}</h1>
        <p className="font-sans text-sm sm:text-base text-deep-navy/80 font-medium">
          {vi.trial.daysLabel(trialDays)}
        </p>
        {product.shortDescription && (
          <p className="font-quote italic text-sm text-deep-navy/70 pt-1">
            {product.shortDescription}
          </p>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-deep-navy/10 shadow-sm space-y-6">
        {/* Lợi ích – chỉ hiện khi CMS có danh sách */}
        {benefits.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-ui font-semibold text-sm text-deep-navy uppercase tracking-wider">
              {vi.trial.benefitsHeading}
            </h2>
            <ul className="space-y-3 pt-1">
              {benefits.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-soft-pink text-accent-pink shrink-0 mt-0.5">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="font-sans text-sm text-deep-navy/85 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Trạng thái quyền truy cập */}
        {access.hasAccess && access.status === 'active' && (
          <div className="p-5 rounded-2xl bg-mint-haze/60 border border-mint-haze space-y-4">
            <p className="font-sans text-sm text-deep-navy font-medium">
              {vi.trial.alreadyActiveNotice}
            </p>
            <div>
              <Link
                href={toolUrl}
                className="inline-flex items-center justify-center w-full px-5 py-3 rounded-full bg-bright-magenta text-white font-ui font-semibold text-sm hover:bg-bright-magenta/90 transition-colors shadow-sm"
              >
                {vi.trial.openToolButton}
              </Link>
            </div>
          </div>
        )}

        {access.hasAccess && access.status === 'trial' && (
          <div className="p-5 rounded-2xl bg-lavender-mist/50 border border-lavender-mist space-y-4">
            <p className="font-sans text-sm text-deep-navy font-medium">
              {vi.trial.alreadyActiveTrialNotice(access.daysLeft ?? trialDays)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={toolUrl}
                className="inline-flex items-center justify-center flex-1 px-5 py-3 rounded-full bg-bright-magenta text-white font-ui font-semibold text-sm hover:bg-bright-magenta/90 transition-colors shadow-sm"
              >
                {vi.trial.openToolButton}
              </Link>
              <Link
                href={`/thanh-toan?san-pham=${encodeURIComponent(product.slug)}`}
                className="inline-flex items-center justify-center flex-1 px-5 py-3 rounded-full bg-soft-pink text-deep-navy font-ui font-semibold text-sm hover:bg-soft-pink/80 transition-colors"
              >
                {vi.trial.buyToContinueButton}
              </Link>
            </div>
          </div>
        )}

        {access.status === 'expired' && (
          <div className="p-5 rounded-2xl bg-butter-cream/60 border border-butter-cream space-y-4">
            <p className="font-sans text-sm text-deep-navy font-medium">
              {access.expiredType === 'purchased'
                ? vi.trial.expiredPurchasedNotice
                : vi.trial.expiredNotice}
            </p>
            <div>
              <Link
                href={`/thanh-toan?san-pham=${encodeURIComponent(product.slug)}`}
                className="inline-flex items-center justify-center w-full px-5 py-3 rounded-full bg-bright-magenta text-white font-ui font-semibold text-sm hover:bg-bright-magenta/90 transition-colors shadow-sm"
              >
                {vi.trial.buyToContinueButton}
              </Link>
            </div>
          </div>
        )}

        {/* Chưa dùng thử bao giờ: Form nút bắt đầu */}
        {access.status === 'none' && (
          <div className="pt-2">
            <TrialStartForm
              productSlug={product.slug}
              productName={product.name}
              trialDays={trialDays}
              toolUrl={toolUrl}
            />
          </div>
        )}
      </div>
    </div>
  )
}
