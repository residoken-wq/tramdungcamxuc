'use client'

import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { isBookableExperience } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'

const t = vi.bx06

export const BookingStatusBanner: React.FC = () => {
  const { id, data } = useDocumentInfo()

  const formData = useFormFields(([fields]) => {
    const rawPrice = fields.price?.value
    const parsedPrice =
      typeof rawPrice === 'number'
        ? rawPrice
        : rawPrice != null && rawPrice !== ''
          ? Number(rawPrice)
          : null

    const rawSalePrice = fields.salePrice?.value
    const parsedSalePrice =
      typeof rawSalePrice === 'number'
        ? rawSalePrice
        : rawSalePrice != null && rawSalePrice !== ''
          ? Number(rawSalePrice)
          : null

    return {
      type: fields.type?.value as string | undefined,
      saleStatus: fields.saleStatus?.value as string | undefined,
      price: parsedPrice,
      salePrice: parsedSalePrice,
      saleEndsAt: fields.saleEndsAt?.value as string | undefined,
      _status: fields._status?.value as string | undefined,
    }
  })

  // Chỉ hiển thị cho phiên trải nghiệm (coaching_trial)
  if (formData.type !== 'coaching_trial') {
    return null
  }

  const effectiveStatus =
    formData._status ?? (data as { _status?: string } | undefined)?._status ?? 'published'

  const isBookable = isBookableExperience({
    type: formData.type,
    _status: effectiveStatus,
    saleStatus: formData.saleStatus,
    price: formData.price,
    salePrice: formData.salePrice,
    saleEndsAt: formData.saleEndsAt,
  })

  const bookingPath = id ? `/dat-phien-trai-nghiem?san-pham=${id}` : null

  // Brand colours only (Brand Book 2026): mint-haze = open, butter-cream = closed, text deep-navy.
  const boxStyle = (background: string): React.CSSProperties => ({
    marginBottom: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid rgb(40 10 96 / 0.2)',
    backgroundColor: background,
    color: '#280A60',
    fontSize: '14px',
    lineHeight: '1.5',
  })
  const note = (
    <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.8 }}>{t.bannerPublishNote}</div>
  )

  if (isBookable && bookingPath) {
    return (
      <div data-testid="booking-status-open" role="status" style={boxStyle('#D9F1EA')}>
        <span style={{ fontWeight: 600 }}>{t.bannerOpenLabel} </span>
        <a
          href={bookingPath}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#280A60', textDecoration: 'underline', fontWeight: 500 }}
        >
          {bookingPath}
        </a>
        {note}
      </div>
    )
  }

  return (
    <div data-testid="booking-status-closed" role="status" style={boxStyle('#F6E9B8')}>
      <span style={{ fontWeight: 600 }}>{t.bannerClosedLabel}</span> {t.bannerClosedHint}
      {note}
    </div>
  )
}
