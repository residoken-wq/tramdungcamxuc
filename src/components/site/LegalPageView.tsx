import React from 'react'
import type { LegalPage } from '@/payload-types'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { vi } from '@/lib/i18n/vi'
import { formatVietnameseDate, isRichTextEmpty } from '@/lib/legal'
import type { SellerInfo } from './Footer'

export interface LegalPageViewProps {
  page: LegalPage
  sellerInfo?: SellerInfo | null
}

export function LegalPageView({ page, sellerInfo }: LegalPageViewProps) {
  const hasContent = !isRichTextEmpty(page.content)
  const isSellerPage = page.slug === 'thong-tin-phap-ly'

  const hasSellerDetails = Boolean(
    sellerInfo &&
    (sellerInfo.name?.trim() ||
      sellerInfo.taxCode?.trim() ||
      sellerInfo.address?.trim() ||
      sellerInfo.phone?.trim() ||
      sellerInfo.email?.trim()),
  )

  return (
    <article className="w-full bg-warm-ivory py-12 sm:py-16 lg:py-20 min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header trang pháp lý */}
        <header className="border-b border-deep-navy/10 pb-6 mb-8">
          <h1 className="font-display text-3xl sm:text-4xl text-deep-navy uppercase tracking-tight">
            {page.title}
          </h1>

          {page.lastUpdated && (
            <p className="mt-3 font-ui text-sm text-deep-navy/60">
              {vi.legal.lastUpdated}: {formatVietnameseDate(page.lastUpdated)}
            </p>
          )}
        </header>

        {/* Nội dung Rich Text hoặc trạng thái đang cập nhật */}
        {hasContent && page.content ? (
          <div className="font-ui text-base text-deep-navy leading-relaxed space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <RichText data={page.content as any} />
          </div>
        ) : (
          <div className="rounded-2xl border border-deep-navy/10 bg-soft-pink/30 p-6 sm:p-8 text-center my-8">
            <p className="font-ui text-base italic text-deep-navy/80">{vi.legal.updatingContent}</p>
          </div>
        )}

        {/* Thông tin người bán dành riêng cho trang /thong-tin-phap-ly */}
        {isSellerPage && hasSellerDetails && sellerInfo && (
          <section
            aria-label={vi.legal.sellerInfoHeading}
            className="mt-12 pt-8 border-t border-deep-navy/15 space-y-4"
          >
            <h2 className="font-ui font-bold text-xl text-deep-navy">
              {vi.legal.sellerInfoHeading}
            </h2>

            <div className="rounded-2xl border border-deep-navy/10 bg-lavender-mist/20 p-6 space-y-3 font-ui text-sm sm:text-base text-deep-navy/90">
              {sellerInfo.name?.trim() && (
                <p>
                  <span className="font-semibold text-deep-navy">
                    {vi.legal.sellerName || 'Đơn vị / Người bán'}:
                  </span>{' '}
                  {sellerInfo.name.trim()}
                </p>
              )}
              {sellerInfo.taxCode?.trim() && (
                <p>
                  <span className="font-semibold text-deep-navy">{vi.footer.seller.taxCode}:</span>{' '}
                  {sellerInfo.taxCode.trim()}
                </p>
              )}
              {sellerInfo.address?.trim() && (
                <p>
                  <span className="font-semibold text-deep-navy">{vi.footer.seller.address}:</span>{' '}
                  {sellerInfo.address.trim()}
                </p>
              )}
              {sellerInfo.phone?.trim() && (
                <p>
                  <span className="font-semibold text-deep-navy">{vi.footer.seller.phone}:</span>{' '}
                  <a
                    href={`tel:${sellerInfo.phone.trim()}`}
                    className="text-bright-magenta underline hover:text-deep-navy transition-colors"
                  >
                    {sellerInfo.phone.trim()}
                  </a>
                </p>
              )}
              {sellerInfo.email?.trim() && (
                <p>
                  <span className="font-semibold text-deep-navy">{vi.footer.seller.email}:</span>{' '}
                  <a
                    href={`mailto:${sellerInfo.email.trim()}`}
                    className="text-bright-magenta underline hover:text-deep-navy transition-colors"
                  >
                    {sellerInfo.email.trim()}
                  </a>
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
