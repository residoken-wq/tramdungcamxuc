'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { appendUtmParams } from '@/lib/utm'
import { safeHref } from '@/lib/safe-href'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'
import type { Product } from '@/payload-types'
import type { PublicProduct } from '@/lib/products'

export interface PhysicalDeckButtonProps {
  product?:
    | Product
    | PublicProduct
    | {
        type?: string | null
        externalUrl?: string | null
        slug?: string | null
        name?: string | null
      }
    | null
  campaign?: string
  className?: string
  showHint?: boolean
}

/**
 * Nút dẫn tới gian hàng Shopee của Hana cho bộ thẻ vật lý EQ Buddy.
 * Tự động gắn UTM tham số chuẩn và ghi nhận sự kiện đo lường external_clicked.
 * Chỉ hiển thị khi sản phẩm có type === 'physical_external' và có externalUrl hợp lệ.
 */
export function PhysicalDeckButton({
  product,
  campaign,
  className = '',
  showHint = false,
}: PhysicalDeckButtonProps) {
  if (
    !product ||
    product.type !== 'physical_external' ||
    !product.externalUrl ||
    product.externalUrl.trim() === ''
  ) {
    return null
  }

  const campaignName = campaign && campaign.trim() !== '' ? campaign.trim() : 'website'
  const rawUrl = product.externalUrl.trim()
  const urlWithUtm = appendUtmParams(rawUrl, {
    source: 'tramdungcamxuc',
    medium: 'website',
    campaign: campaignName,
  })

  const safeLink = safeHref(urlWithUtm)
  if (!safeLink) {
    return null
  }

  const handleClick = () => {
    track('external_clicked', {
      url: safeLink,
      type: 'shopee',
      platform: 'shopee',
      productSlug: product.slug || 'bo-the-eq-buddy',
    })
  }

  return (
    <div className={`flex flex-col items-center gap-2 text-center ${className}`}>
      <Button
        href={safeLink}
        variant="primary"
        size="md"
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-flex items-center justify-center gap-2 motion-reduce:transition-none"
      >
        {/* Biểu tượng túi xách Shopee */}
        <svg
          className="w-4 h-4 fill-current shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19.5 7.5h-3a4.5 4.5 0 0 0-9 0h-3l-2 13.5a1.5 1.5 0 0 0 1.5 1.5h18a1.5 1.5 0 0 0 1.5-1.5l-2-13.5zm-7.5-3a3 3 0 0 1 3 3h-6a3 3 0 0 1 3-3zm7.4 15H4.6l1.7-12h2.2v2a1 1 0 1 0 2 0v-2h3v2a1 1 0 1 0 2 0v-2h2.2l1.7 12z" />
        </svg>
        <span>{vi.eqBuddy.offer.buyPhysicalDeck}</span>
      </Button>

      {showHint && (
        <p className="text-xs text-deep-navy/70 max-w-sm">
          {vi.eqBuddy.offer.shopeeHint}
        </p>
      )}
    </div>
  )
}

export default PhysicalDeckButton
