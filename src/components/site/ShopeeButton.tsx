'use client'

import React from 'react'
import { Button, type ButtonVariant, type ButtonSize } from '@/components/ui/Button'
import { appendUtmParams } from '@/lib/utm'
import { safeHref } from '@/lib/safe-href'
import { track } from '@/lib/analytics/track'

export interface ShopeeButtonProps {
  version?: number
  mode?: 'product' | 'store'
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  align?: 'left' | 'center' | 'right'
  pageSlug?: string
  externalUrl?: string | null
  shopeeStoreUrl?: string | null
  puck?: { isEditing?: boolean }
}

export function ShopeeButton({
  mode = 'product',
  label = 'Mua trên Shopee',
  variant = 'primary',
  size = 'md',
  align = 'center',
  pageSlug,
  externalUrl,
  shopeeStoreUrl,
  puck,
}: ShopeeButtonProps) {
  const isEditing = puck?.isEditing ?? false
  const rawUrl = mode === 'store' ? shopeeStoreUrl : externalUrl

  if (!rawUrl || rawUrl.trim() === '') {
    if (isEditing) {
      return (
        <div className="py-4 px-4 text-center">
          <span className="inline-block px-3 py-1.5 rounded-lg bg-soft-pink border border-bright-magenta/30 text-xs font-medium text-bright-magenta">
            {mode === 'store'
              ? 'Chưa cấu hình gian hàng Shopee trong Cài đặt website'
              : 'Sản phẩm chưa có liên kết Shopee ngoài'}
          </span>
        </div>
      )
    }
    return null
  }

  const campaign = pageSlug && pageSlug.trim() !== '' ? pageSlug.trim() : 'website'
  const urlWithUtm = appendUtmParams(rawUrl, {
    source: 'tramdungcamxuc',
    medium: 'website',
    campaign,
  })

  const safeLink = safeHref(urlWithUtm)
  if (!safeLink) {
    return null
  }

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align]

  const handleClick = () => {
    track('external_clicked', {
      url: safeLink,
      type: 'shopee',
    })
  }

  return (
    <div className="py-4 px-4">
      <div className={`mx-auto max-w-5xl flex ${alignClasses}`}>
        <Button
          href={safeLink}
          variant={variant}
          size={size}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="inline-flex items-center gap-2"
        >
          {/* Shopee Bag Icon */}
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19.5 7.5h-3a4.5 4.5 0 0 0-9 0h-3l-2 13.5a1.5 1.5 0 0 0 1.5 1.5h18a1.5 1.5 0 0 0 1.5-1.5l-2-13.5zm-7.5-3a3 3 0 0 1 3 3h-6a3 3 0 0 1 3-3zm7.4 15H4.6l1.7-12h2.2v2a1 1 0 1 0 2 0v-2h3v2a1 1 0 1 0 2 0v-2h2.2l1.7 12z" />
          </svg>
          <span>{label}</span>
        </Button>
      </div>
    </div>
  )
}
