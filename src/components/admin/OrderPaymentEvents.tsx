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

  const getResultLabel = (result?: string | null) => {
    if (!result) return vi.payment.ui.adminActions.recorded
    const dict = vi.payment.ui.adminActions.eventResults as Record<string, string>
    return dict[result] || result
  }

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: 'var(--theme-elevation-0, #FAF7F4)',
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
          color: 'var(--theme-text, #280A60)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{vi.payment.ui.adminActions.paymentEventsTitle}</span>
        {loading && (
          <span style={{ fontSize: '11px', color: 'var(--theme-text-secondary, #280A60)' }}>
            {vi.payment.ui.adminActions.loadingEvents}
          </span>
        )}
      </div>

      {events.length === 0 && !loading && (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--theme-text-secondary, #280A60)',
            fontStyle: 'italic',
          }}
        >
          {vi.payment.ui.adminActions.noPaymentEvents}
        </div>
      )}

      {events.map((ev) => {
        const isMismatch = ev.isMismatch
        const isCancelled = ev.isCancelled
        const isTermsMissing = ev.isTermsMissing
        const isPaidTwice = ev.isPaidTwice
        const isStuck = ev.isStuck
        const isIncomplete = ev.isIncomplete
        const isWarning =
          isMismatch || isCancelled || isTermsMissing || isPaidTwice || isStuck || isIncomplete

        return (
          <div
            key={ev.id}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              lineHeight: '1.4',
              backgroundColor: isWarning ? '#FDE6F6' : '#FAF7F4',
              border: `1px solid ${isWarning ? '#EF3B83' : '#E9DDF9'}`,
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
                color: 'var(--theme-text-secondary, #280A60)',
                fontSize: '10px',
              }}
            >
              <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                {ev.provider} {ev.transactionId ? `#${ev.transactionId}` : ''}
              </span>
              <span>{formatTime(ev.receivedAt)}</span>
            </div>

            {/* Cảnh báo nổi bật: Lệch số tiền */}
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
                <span>{vi.payment.ui.adminActions.amountMismatchWarning}</span>
                {ev.amount !== null && ev.amount !== undefined && (
                  <span>({formatVnd(ev.amount)})</span>
                )}
              </div>
            )}

            {/* Cảnh báo nổi bật: Đơn đã hủy */}
            {isCancelled && (
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
                <span>{vi.payment.ui.adminActions.orderCancelledWarning}</span>
              </div>
            )}

            {/* Cảnh báo nổi bật: Chưa đồng ý điều khoản */}
            {isTermsMissing && (
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
                <span>{vi.payment.ui.adminActions.termsMissingWarning}</span>
              </div>
            )}

            {/* Cảnh báo nổi bật: Khách chuyển tiền 2 lần */}
            {isPaidTwice && (
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
                <span>{vi.payment.ui.adminActions.paidTwiceWarning}</span>
              </div>
            )}

            {/* Cảnh báo nổi bật: Event kẹt processing */}
            {isStuck && (
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
                <span>{vi.payment.ui.adminActions.stuckWarning}</span>
              </div>
            )}

            {/* Cảnh báo nổi bật: Xử lý lại sau gián đoạn */}
            {isIncomplete && (
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
                <span>{vi.payment.ui.adminActions.incompleteWarning}</span>
              </div>
            )}

            {/* Trạng thái xử lý bình thường */}
            {!isWarning && (
              <div style={{ color: 'var(--theme-text, #280A60)', fontWeight: 600 }}>
                {vi.payment.ui.adminActions.resultLabel}{' '}
                <span style={{ color: 'var(--theme-text, #280A60)' }}>
                  {getResultLabel(ev.result)}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
