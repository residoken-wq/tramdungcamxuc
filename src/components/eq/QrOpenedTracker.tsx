'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics/track'

export interface QrOpenedTrackerProps {
  cardCode: string
  qrSlug: string
}

/**
 * Ghi nhận sự kiện qr_opened một lần khi trang thẻ mở từ mã QR.
 * Tuân thủ danh sách trắng thuộc tính phân tích (cardCode, qrSlug).
 */
export function QrOpenedTracker({ cardCode, qrSlug }: QrOpenedTrackerProps) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true
    track('qr_opened', { cardCode, qrSlug })
  }, [cardCode, qrSlug])

  return null
}

export default QrOpenedTracker
