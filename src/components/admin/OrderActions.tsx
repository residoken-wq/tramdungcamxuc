'use client'

import React, { useState } from 'react'
import { useAuth, useDocumentInfo } from '@payloadcms/ui'
import { confirmManualPaymentAdminAction, cancelOrderAdminAction } from '@/lib/payments/actions'
import { vi } from '@/lib/i18n/vi'

export const OrderActions: React.FC = () => {
  const { user } = useAuth()
  const { id } = useDocumentInfo()

  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null)
  const [confirmModal, setConfirmModal] = useState<'confirm' | 'cancel' | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

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

  const orderId = Number(id)

  const handleConfirmPayment = async () => {
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
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

        <button
          type="button"
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
      </div>

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
                : vi.payment.ui.adminActions.cancelModalTitle}
            </h4>

            <p style={{ margin: 0, fontSize: '13px', color: '#444', lineHeight: '1.5' }}>
              {confirmModal === 'confirm'
                ? vi.payment.ui.adminActions.confirmModalDesc
                : vi.payment.ui.adminActions.cancelModalDesc}
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
                onClick={confirmModal === 'confirm' ? handleConfirmPayment : handleCancelOrder}
                disabled={loading !== null}
                style={{
                  padding: '8px 16px',
                  backgroundColor: confirmModal === 'confirm' ? '#280A60' : '#DC3545',
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
                    : vi.payment.ui.adminActions.agreeCancelButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderActions
