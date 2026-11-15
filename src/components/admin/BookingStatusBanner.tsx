'use client'

import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { isBookableExperience } from '@/lib/products'

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

  const effectiveStatus = formData._status ?? (data as { _status?: string } | undefined)?._status ?? 'published'

  const isBookable = isBookableExperience({
    type: formData.type,
    _status: effectiveStatus,
    saleStatus: formData.saleStatus,
    price: formData.price,
    salePrice: formData.salePrice,
    saleEndsAt: formData.saleEndsAt,
  })

  const bookingPath = id ? `/dat-phien-trai-nghiem?san-pham=${id}` : null

  if (isBookable && bookingPath) {
    return (
      <div
        data-testid="booking-status-open"
        style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #10b981',
          backgroundColor: '#ecfdf5',
          color: '#065f46',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        <span style={{ fontWeight: 600 }}>Trang đặt lịch đang mở: </span>
        <a
          href={bookingPath}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#047857',
            textDecoration: 'underline',
            fontWeight: 500,
          }}
        >
          {bookingPath}
        </a>
      </div>
    )
  }

  return (
    <div
      data-testid="booking-status-closed"
      style={{
        marginBottom: '16px',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #f59e0b',
        backgroundColor: '#fffbeb',
        color: '#92400e',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
    >
      <span style={{ fontWeight: 600 }}>Trang đặt lịch đang ĐÓNG</span> – khách bấm nút đặt lịch sẽ không thấy nút. Cần: Trạng thái bán = Đang bán, Giá &gt; 0, Xuất bản.
    </div>
  )
}
