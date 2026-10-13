'use client'

import React, { useEffect, useState } from 'react'
import { useAuth, useDocumentInfo } from '@payloadcms/ui'
import { getOrderPaymentEventsAction, type OrderPaymentEventItem } from '@/lib/payments/actions'
import { vi } from '@/lib/i18n/vi'
import { formatVnd } from '@/lib/format'

export const OrderPaymentEvents: React.FC = () => {
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const [events, setEvents] = useState<OrderPaymentEventItem[]>([])
  const [loading, setLoading] = useState(true)

  const orderId = id ? Number(id) : null

  useEffect(() => {
    let active = true
    if (orderId && user && (user as { role?: string }).role === 'owner') {
      getOrderPaymentEventsAction(orderId)
        .then((res) => {
          if (active) {
            setEvents(res)
          }
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }
    return () => {
      active = false
    }
  }, [orderId, user])

  // Chỉ hiển thị cho tài khoản có vai trò 'owner'
  if (!user || (user as { role?: string }).role !== 'owner' || !orderId) {
    return null
  }

  const formatTime = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Bangkok',
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(new Date(isoString))
    } catch {
      return isoString
    }
  }

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E9DDF9',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#280A60',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>🔔 {vi.payment.ui.adminActions.paymentEventsTitle}</span>
        {loading && <span style={{ fontSize: '11px', color: '#888' }}>Đang tải...</span>}
      </div>

      {events.length === 0 && !loading && (
        <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
          {vi.payment.ui.adminActions.noPaymentEvents}
        </div>
      )}

      {events.map((ev) => {
        const isMismatch = ev.isMismatch
        const isCancelled = ev.isCancelled
        const isWarning = isMismatch || isCancelled

        return (
          <div
            key={ev.id}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              lineHeight: '1.4',
              backgroundColor: isWarning ? '#FFF5F5' : '#FAF7F4',
              border: `1px solid ${isMismatch ? '#EF3B83' : isCancelled ? '#F6A828' : '#E9DDF9'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {/* Header: Cổng + Thời gian */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#666',
                fontSize: '10px',
              }}
            >
              <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                {ev.provider} {ev.transactionId ? `#${ev.transactionId}` : ''}
              </span>
              <span>{formatTime(ev.receivedAt)}</span>
            </div>

            {/* Cảnh báo nổi bật nếu Lệch số tiền hoặc Đơn đã hủy */}
            {isMismatch && (
              <div
                style={{
                  backgroundColor: '#FDE6F6',
                  color: '#BC039E',
                  fontWeight: 700,
                  padding: '4px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>⚠️ {vi.payment.ui.adminActions.amountMismatchWarning}</span>
                {ev.amount !== null && ev.amount !== undefined && (
                  <span>({formatVnd(ev.amount)})</span>
                )}
              </div>
            )}

            {isCancelled && (
              <div
                style={{
                  backgroundColor: '#FEF3C7',
                  color: '#B45309',
                  fontWeight: 700,
                  padding: '4px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>⚠️ {vi.payment.ui.adminActions.orderCancelledWarning}</span>
              </div>
            )}

            {/* Trạng thái xử lý bình thường */}
            {!isWarning && (
              <div style={{ color: '#280A60', fontWeight: 600 }}>
                Kết quả: <span style={{ color: '#0F5132' }}>{ev.result || 'Đã ghi nhận'}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
