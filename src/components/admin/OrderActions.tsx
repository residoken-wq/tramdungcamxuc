'use client'

import React, { useEffect, useState } from 'react'
import { useAuth, useDocumentInfo } from '@payloadcms/ui'
import {
  confirmManualPaymentAdminAction,
  cancelOrderAdminAction,
  resendPaymentConfirmationAction,
  getOrderPaymentLinkAction,
} from '@/lib/payments/actions'
import { vi } from '@/lib/i18n/vi'

export const OrderActions: React.FC = () => {
  const { user } = useAuth()
  const { id, data } = useDocumentInfo()

  const [loading, setLoading] = useState<'confirm' | 'cancel' | 'resend' | null>(null)
  const [confirmModal, setConfirmModal] = useState<'confirm' | 'cancel' | 'resend' | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [orderInfo, setOrderInfo] = useState<{
    url: string | null
    isPending: boolean
    createdByAdmin: boolean
  } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const orderId = id ? Number(id) : null

  useEffect(() => {
    let active = true
    if (orderId) {
      getOrderPaymentLinkAction(orderId).then((res) => {
        if (active) {
          setOrderInfo(res)
        }
      })
    }
    return () => {
      active = false
      setOrderInfo(null)
    }
  }, [orderId])

  // Chỉ hiển thị thao tác duyệt/hủy đơn cho tài khoản có vai trò 'owner'
  if (!user || (user as { role?: string }).role !== 'owner') {
    return null
  }

  if (!id) {
    return (
      <div style={{ padding: '8px 0', fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
        {vi.payment.ui.adminActions.saveFirstNotice}
      </div>
    )
  }

  const handleCopyLink = async () => {
    if (!orderInfo?.url) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(orderInfo.url)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      }
    } catch {
      // Bỏ qua lỗi clipboard
    }
  }

  const handleConfirmPayment = async () => {
    if (!orderId) return
    setLoading('confirm')
    setFeedback(null)
    try {
      const res = await confirmManualPaymentAdminAction(orderId)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
        setConfirmModal(null)
        setTimeout(() => {
          if (typeof window !== 'undefined') window.location.reload()
        }, 1200)
      } else {
        setFeedback({ type: 'error', message: res.message })
        setConfirmModal(null)
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : vi.payment.ui.adminActions.defaultConfirmError,
      })
      setConfirmModal(null)
    } finally {
      setLoading(null)
    }
  }

  const handleCancelOrder = async () => {
    if (!orderId) return
    setLoading('cancel')
    setFeedback(null)
    try {
      const res = await cancelOrderAdminAction(orderId, cancelReason.trim() || undefined)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
        setConfirmModal(null)
        setTimeout(() => {
          if (typeof window !== 'undefined') window.location.reload()
        }, 1200)
      } else {
        setFeedback({ type: 'error', message: res.message })
        setConfirmModal(null)
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : vi.payment.ui.adminActions.defaultCancelError,
      })
      setConfirmModal(null)
    } finally {
      setLoading(null)
    }
  }

  const handleResendConfirmation = async () => {
    if (!orderId) return
    setLoading('resend')
    setFeedback(null)
    try {
      const res = await resendPaymentConfirmationAction(orderId)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
        setConfirmModal(null)
        setTimeout(() => {
          if (typeof window !== 'undefined') window.location.reload()
        }, 1200)
      } else {
        setFeedback({ type: 'error', message: res.message })
        setConfirmModal(null)
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : vi.payment.ui.adminActions.defaultResendError,
      })
      setConfirmModal(null)
    } finally {
      setLoading(null)
    }
  }

  const docStatus = (data as { paymentStatus?: string } | undefined)?.paymentStatus
  const deliveryStatus = (data as { deliveryStatus?: string } | undefined)?.deliveryStatus
  const isPending = orderInfo ? orderInfo.isPending : docStatus === 'pending'
  const isFailed = docStatus === 'failed'
  const isCancelled = docStatus === 'cancelled'
  const isPaid = docStatus === 'paid' || (!isPending && !isFailed && !isCancelled)
  const canResendConfirmation = docStatus === 'paid' && deliveryStatus !== 'email_sent'

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: '#FAF7F4',
        border: '1px solid #E9DDF9',
        borderRadius: '12px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '14px' }}>🛡️</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#280A60' }}>
          {vi.payment.ui.adminActions.panelTitle}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '12px', color: '#555', lineHeight: '1.4' }}>
        {vi.payment.ui.adminActions.panelDesc}
      </p>

      {/* Cảnh báo đơn hết hạn (T2-13) */}
      {isFailed && (
        <div
          data-testid="order-expired-warning"
          style={{
            padding: '10px 12px',
            backgroundColor: '#F6E9B8',
            border: '1px solid #E5D598',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#280A60',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: '1.4',
          }}
        >
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <span>{vi.payment.ui.adminActions.expiredOrderWarning}</span>
        </div>
      )}

      {/* Sidebar đơn: Link thanh toán cho đơn createdByAdmin còn pending */}
      {orderInfo?.url && orderInfo.isPending && (
        <div
          style={{
            padding: '10px',
            backgroundColor: '#FDE6F6',
            border: '1px solid #EF3B83',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#280A60' }}>
            🔗 {vi.payment.ui.adminActions.paymentLinkTitle}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#333',
              wordBreak: 'break-all',
              backgroundColor: '#FFFFFF',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid #E9DDF9',
            }}
          >
            {orderInfo.url}
          </div>
          <button
            type="button"
            data-testid="order-payment-link-copy"
            onClick={handleCopyLink}
            style={{
              padding: '6px 10px',
              backgroundColor: copiedLink ? '#D9F1EA' : '#BC039E',
              color: copiedLink ? '#0F5132' : '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'background-color 0.2s',
            }}
          >
            {copiedLink
              ? vi.payment.ui.adminActions.copiedLinkButton
              : vi.payment.ui.adminActions.copyLinkButton}
          </button>
        </div>
      )}

      {feedback && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            lineHeight: '1.4',
            backgroundColor: feedback.type === 'success' ? '#D9F1EA' : '#FDE6F6',
            color: feedback.type === 'success' ? '#0F5132' : '#842029',
            border: `1px solid ${feedback.type === 'success' ? '#A3E2D1' : '#F8D7DA'}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Trạng thái không pending và không failed (đã thanh toán hoặc đã hủy) */}
      {!isPending && !isFailed && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            textAlign: 'center',
            backgroundColor: isPaid ? '#D9F1EA' : '#FDE6F6',
            color: isPaid ? '#0F5132' : '#842029',
            border: `1px solid ${isPaid ? '#A3E2D1' : '#F8D7DA'}`,
          }}
        >
          {isPaid
            ? vi.payment.ui.adminActions.statusPaidNotice
            : vi.payment.ui.adminActions.statusCancelledNotice}
        </div>
      )}

      {/* Hiển thị nút Xác nhận khi đơn pending hoặc failed; nút Hủy chỉ khi pending */}
      {(isPending || isFailed) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            data-testid="order-confirm-button"
            onClick={() => setConfirmModal('confirm')}
            disabled={loading !== null}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: '#280A60',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading !== null ? 'not-allowed' : 'pointer',
              opacity: loading !== null ? 0.7 : 1,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (loading === null) e.currentTarget.style.backgroundColor = '#3B1287'
            }}
            onMouseLeave={(e) => {
              if (loading === null) e.currentTarget.style.backgroundColor = '#280A60'
            }}
          >
            <span>✓</span>
            <span>
              {loading === 'confirm'
                ? vi.payment.ui.adminActions.processing
                : vi.payment.ui.adminActions.confirmButton}
            </span>
          </button>

          {isPending && (
            <button
              type="button"
              data-testid="order-cancel-button"
              onClick={() => setConfirmModal('cancel')}
              disabled={loading !== null}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#FFFFFF',
                color: '#842029',
                border: '1px solid #DC3545',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: loading !== null ? 'not-allowed' : 'pointer',
                opacity: loading !== null ? 0.7 : 1,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (loading === null) e.currentTarget.style.backgroundColor = '#FDF2F2'
              }}
              onMouseLeave={(e) => {
                if (loading === null) e.currentTarget.style.backgroundColor = '#FFFFFF'
              }}
            >
              <span>✕</span>
              <span>
                {loading === 'cancel'
                  ? vi.payment.ui.adminActions.processing
                  : vi.payment.ui.adminActions.cancelButton}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Nút gửi lại email xác nhận: chỉ đơn paid có deliveryStatus khác email_sent */}
      {canResendConfirmation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            data-testid="order-resend-confirmation-button"
            onClick={() => setConfirmModal('resend')}
            disabled={loading !== null}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: '#BC039E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading !== null ? 'not-allowed' : 'pointer',
              opacity: loading !== null ? 0.7 : 1,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (loading === null) e.currentTarget.style.backgroundColor = '#280A60'
            }}
            onMouseLeave={(e) => {
              if (loading === null) e.currentTarget.style.backgroundColor = '#BC039E'
            }}
          >
            <span>✉️</span>
            <span>
              {loading === 'resend'
                ? vi.payment.ui.adminActions.processing
                : vi.payment.ui.adminActions.resendConfirmationButton}
            </span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#280A60' }}>
              {confirmModal === 'confirm'
                ? vi.payment.ui.adminActions.confirmModalTitle
                : confirmModal === 'cancel'
                  ? vi.payment.ui.adminActions.cancelModalTitle
                  : vi.payment.ui.adminActions.resendConfirmationModalTitle}
            </h4>

            <p style={{ margin: 0, fontSize: '13px', color: '#444', lineHeight: '1.5' }}>
              {confirmModal === 'confirm'
                ? isFailed
                  ? vi.payment.ui.adminActions.confirmExpiredModalDesc
                  : vi.payment.ui.adminActions.confirmModalDesc
                : confirmModal === 'cancel'
                  ? vi.payment.ui.adminActions.cancelModalDesc
                  : vi.payment.ui.adminActions.resendConfirmationModalDesc}
            </p>

            {confirmModal === 'cancel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>
                  {vi.payment.ui.adminActions.cancelReasonLabel}
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={vi.payment.ui.adminActions.cancelReasonPlaceholder}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #CCC',
                    borderRadius: '6px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={loading !== null}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#EAEAEA',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {vi.payment.ui.adminActions.closeButton}
              </button>

              <button
                type="button"
                onClick={
                  confirmModal === 'confirm'
                    ? handleConfirmPayment
                    : confirmModal === 'cancel'
                      ? handleCancelOrder
                      : handleResendConfirmation
                }
                disabled={loading !== null}
                style={{
                  padding: '8px 16px',
                  backgroundColor:
                    confirmModal === 'confirm'
                      ? '#280A60'
                      : confirmModal === 'cancel'
                        ? '#DC3545'
                        : '#BC039E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading !== null ? 'not-allowed' : 'pointer',
                  opacity: loading !== null ? 0.7 : 1,
                }}
              >
                {loading !== null
                  ? vi.payment.ui.adminActions.processing
                  : confirmModal === 'confirm'
                    ? vi.payment.ui.adminActions.agreeConfirmButton
                    : confirmModal === 'cancel'
                      ? vi.payment.ui.adminActions.agreeCancelButton
                      : vi.payment.ui.adminActions.agreeResendButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderActions
