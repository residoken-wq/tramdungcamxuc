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

// Minimal brand typography for CMS legal texts (Brand Book: Montserrat body, deep-navy headings,
// magenta accents, thin lines, Playfair italic for the closing line). Tailwind resets the
// browser defaults, so headings / lists / tables are styled here.
const LEGAL_PROSE = [
  'font-ui text-[15px] sm:text-base text-deep-navy/85 leading-[1.75]',
  '[&_p]:mb-4 [&_td_p]:mb-0 [&_th_p]:mb-0',
  '[&_h2]:font-ui [&_h2]:font-bold [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:text-deep-navy [&_h2]:leading-snug',
  '[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pt-8 [&_h2]:border-t [&_h2]:border-deep-navy/10',
  '[&_h3]:font-ui [&_h3]:font-semibold [&_h3]:text-base [&_h3]:text-deep-navy [&_h3]:mt-8 [&_h3]:mb-2',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:mb-4 [&_ol]:mb-4',
  '[&_li]:mb-1.5 [&_li]:pl-1 [&_li]:marker:text-bright-magenta',
  '[&_strong]:font-semibold [&_strong]:text-deep-navy',
  '[&_a]:text-bright-magenta [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-deep-navy',
  '[&_em]:font-quote [&_em]:italic [&_em]:text-deep-navy',
  '[&_hr]:my-12 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-deep-navy/10',
  '[&_.lexical-table-container]:my-6 [&_.lexical-table-container]:overflow-x-auto',
  '[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
  '[&_td]:border [&_td]:border-lavender-mist [&_td]:p-3 [&_td]:align-top [&_td]:text-left',
  '[&_th]:border [&_th]:border-lavender-mist [&_th]:p-3 [&_th]:align-top [&_th]:text-left',
  '[&_th]:bg-soft-pink/50 [&_th]:font-semibold [&_th]:text-deep-navy',
  '[&_tr:first-child_td]:bg-soft-pink/50 [&_tr:first-child_td]:font-semibold [&_tr:first-child_td]:text-deep-navy',
].join(' ')

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className={LEGAL_PROSE}>
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
