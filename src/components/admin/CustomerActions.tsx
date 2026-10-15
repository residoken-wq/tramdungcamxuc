'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useDocumentInfo } from '@payloadcms/ui'
import {
  deleteCustomerAdminAction,
  checkCustomerPendingOrdersAdminAction,
} from '@/lib/account/actions'
import { vi } from '@/lib/i18n/vi'

export const CustomerActions: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()
  const { id, data } = useDocumentInfo()

  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [typedEmail, setTypedEmail] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number | null>(null)

  const isOwner = Boolean(user && (user as { role?: string }).role === 'owner')
  const customerId = id ? Number(id) : null
  const customerEmail = ((data as { email?: string })?.email || '').trim()
  const deletionRequestedAt = (data as { deletionRequestedAt?: string | null })?.deletionRequestedAt

  useEffect(() => {
    let active = true
    if (isOwner && customerId) {
      checkCustomerPendingOrdersAdminAction(customerId).then((res) => {
        if (active) {
          setPendingOrdersCount(res.pendingCount)
        }
      })
    }
    return () => {
      active = false
    }
  }, [isOwner, customerId])

  // Chỉ hiển thị panel thao tác cho người dùng có vai trò 'owner'
  if (!isOwner || !customerId) {
    return null
  }

  const handleDelete = async () => {
    if (loading) return

    if (typedEmail.trim().toLowerCase() !== customerEmail.toLowerCase()) {
      setFeedback({ type: 'error', message: vi.account.adminDeletion.emailMismatch })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
      const res = await deleteCustomerAdminAction(customerId, typedEmail)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
        setTimeout(() => {
          router.push('/admin/collections/customers')
          router.refresh()
        }, 1200)
      } else {
        setFeedback({ type: 'error', message: res.message })
      }
    } catch (err) {
      console.error('[CustomerActions] Lỗi khi xóa khách:', err)
      setFeedback({ type: 'error', message: vi.account.adminDeletion.serverError })
    } finally {
      setLoading(false)
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
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#280A60' }}>
          {vi.account.adminDeletion.panelTitle}
        </span>
      </div>

      {deletionRequestedAt && (
        <div
          data-testid="deletion-requested-banner"
          style={{
            padding: '10px 12px',
            backgroundColor: '#FDE6F6',
            border: '1px solid #EF3B83',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#280A60',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            lineHeight: '1.4',
          }}
        >
          <span>
            {vi.account.adminDeletion.requestedOn(
              new Date(deletionRequestedAt).toLocaleDateString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
              }),
            )}
          </span>
        </div>
      )}

      {feedback && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: feedback.type === 'success' ? '#D9F1EA' : '#FDE6F6',
            color: feedback.type === 'success' ? '#280A60' : '#BC039E',
            border: `1px solid ${feedback.type === 'success' ? '#D9F1EA' : '#EF3B83'}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      {pendingOrdersCount !== null && pendingOrdersCount > 0 && (
        <div
          data-testid="pending-orders-warning"
          style={{
            padding: '10px 12px',
            backgroundColor: '#FDE6F6',
            border: '1px solid #EF3B83',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#280A60',
            lineHeight: '1.4',
          }}
        >
          {vi.account.adminDeletion.pendingOrders(pendingOrdersCount)}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (pendingOrdersCount !== null && pendingOrdersCount > 0) {
            setFeedback({
              type: 'error',
              message: vi.account.adminDeletion.pendingOrders(pendingOrdersCount),
            })
            return
          }
          setTypedEmail('')
          setFeedback(null)
          setShowModal(true)
        }}
        disabled={loading || (pendingOrdersCount !== null && pendingOrdersCount > 0)}
        style={{
          padding: '8px 14px',
          backgroundColor: '#EF3B83',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          cursor:
            loading || (pendingOrdersCount !== null && pendingOrdersCount > 0)
              ? 'not-allowed'
              : 'pointer',
          opacity: loading || (pendingOrdersCount !== null && pendingOrdersCount > 0) ? 0.6 : 1,
          transition: 'background-color 0.2s',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <span>{vi.account.adminDeletion.button}</span>
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(40, 10, 96, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(40, 10, 96, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              border: '1px solid #E9DDF9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#280A60' }}>
                {vi.account.adminDeletion.modalTitle}
              </h3>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#280A60',
                opacity: 0.8,
                lineHeight: '1.5',
              }}
            >
              {vi.account.adminDeletion.modalWarning}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#280A60' }}>
                {vi.account.adminDeletion.confirmPrompt(customerEmail)}
              </label>
              <input
                type="email"
                value={typedEmail}
                onChange={(e) => setTypedEmail(e.target.value)}
                placeholder={customerEmail}
                disabled={loading}
                style={{
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #E9DDF9',
                  borderRadius: '8px',
                  width: '100%',
                  boxSizing: 'border-box',
                  color: '#280A60',
                }}
              />
            </div>

            {feedback && feedback.type === 'error' && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#FDE6F6',
                  color: '#BC039E',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: '1px solid #EF3B83',
                }}
              >
                {feedback.message}
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
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#FAF7F4',
                  color: '#280A60',
                  border: '1px solid #E9DDF9',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {vi.account.adminDeletion.cancel}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={
                  loading || typedEmail.trim().toLowerCase() !== customerEmail.toLowerCase()
                }
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#EF3B83',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor:
                    loading || typedEmail.trim().toLowerCase() !== customerEmail.toLowerCase()
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    loading || typedEmail.trim().toLowerCase() !== customerEmail.toLowerCase()
                      ? 0.5
                      : 1,
                }}
              >
                {loading
                  ? vi.account.adminDeletion.deleting
                  : vi.account.adminDeletion.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerActions
