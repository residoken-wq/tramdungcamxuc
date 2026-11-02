import React from 'react'
import Link from 'next/link'
import type { ComponentConfig } from '@puckeditor/core'
import type { LegalLink, SellerInfo } from '@/components/site/Footer'
import { vi } from '@/lib/i18n/vi'

export interface LegalFooterProps {
  version?: number
  showSellerInfo?: boolean
  showLegalLinks?: boolean
  legalLinks?: LegalLink[]
  sellerInfo?: SellerInfo
}

/**
 * REVIEW-REQUIRED: EB-10c – the legal links and the seller information are mandatory on every
 * page (AGENTS §8.1, e-commerce disclosure), so this block always shows both. `showLegalLinks` /
 * `showSellerInfo` from older data are ignored. Only the editor shows a placeholder when there is
 * nothing to list; the public page never shows invented links.
 */
export const LegalFooterView: React.FC<LegalFooterProps & { isEditing?: boolean }> = ({
  legalLinks = [],
  sellerInfo,
  isEditing = false,
}) => {
  const showLegalLinks = true
  const showSellerInfo = true
  const sortedLegalLinks = [...legalLinks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const hasSellerDetails = Boolean(
    sellerInfo &&
    (sellerInfo.name?.trim() ||
      sellerInfo.taxCode?.trim() ||
      sellerInfo.address?.trim() ||
      sellerInfo.phone?.trim() ||
      sellerInfo.email?.trim()),
  )

  return (
    <div className="w-full space-y-6 pt-4 border-t border-deep-navy/10 text-sm font-sans">
      {showLegalLinks && sortedLegalLinks.length === 0 && isEditing && (
        <p className="italic text-deep-navy/70">{vi.eb10.legalFooterEditorEmpty}</p>
      )}
      {showLegalLinks && sortedLegalLinks.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-ui font-bold text-xs uppercase tracking-wider text-deep-navy/70">
            {vi.footer.legalHeading}
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {sortedLegalLinks.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.slug.startsWith('/') ? item.slug : `/${item.slug}`}
                  className="text-deep-navy/80 hover:text-bright-magenta transition-colors focus-visible:outline-2 focus-visible:outline-deep-navy rounded-sm"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSellerInfo && (hasSellerDetails || isEditing) && (
        <div className="space-y-2 pt-2 text-xs text-deep-navy/70 border-t border-deep-navy/5">
          {sellerInfo?.name?.trim() && (
            <p className="font-ui font-semibold text-deep-navy">{sellerInfo.name.trim()}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {sellerInfo?.taxCode?.trim() && (
              <p>
                <span className="font-medium text-deep-navy/60">{vi.footer.seller.taxCode}:</span>{' '}
                {sellerInfo.taxCode.trim()}
              </p>
            )}
            {sellerInfo?.address?.trim() && (
              <p>
                <span className="font-medium text-deep-navy/60">{vi.footer.seller.address}:</span>{' '}
                {sellerInfo.address.trim()}
              </p>
            )}
            {sellerInfo?.phone?.trim() && (
              <p>
                <span className="font-medium text-deep-navy/60">{vi.footer.seller.phone}:</span>{' '}
                <a
                  href={`tel:${sellerInfo.phone.trim()}`}
                  className="hover:text-bright-magenta underline transition-colors"
                >
                  {sellerInfo.phone.trim()}
                </a>
              </p>
            )}
            {sellerInfo?.email?.trim() && (
              <p>
                <span className="font-medium text-deep-navy/60">{vi.footer.seller.email}:</span>{' '}
                <a
                  href={`mailto:${sellerInfo.email.trim()}`}
                  className="hover:text-bright-magenta underline transition-colors"
                >
                  {sellerInfo.email.trim()}
                </a>
              </p>
            )}
            {!hasSellerDetails && isEditing && (
              <p className="italic text-deep-navy/70">{vi.eb10.sellerInfoEditorEmpty}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const LegalFooterBlock: ComponentConfig<LegalFooterProps> = {
  label: vi.eb10.legalFooterLabel,
  permissions: {
    delete: false,
    duplicate: false,
  },
  // EB-10c: nothing to switch off – the legal links and seller info always show.
  fields: {},
  defaultProps: {
    version: 1,
    legalLinks: [],
  },
  render: ({ puck, ...props }) => {
    return <LegalFooterView {...props} isEditing={puck?.isEditing} />
  },
}
