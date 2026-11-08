'use client'

import React, { useState } from 'react'
import { useAuth, useField } from '@payloadcms/ui'
import { vi } from '@/lib/i18n/vi'

interface NavigationBuilderButtonProps {
  fieldName: 'headerPage' | 'footerPage'
}

export const NavigationBuilderButton: React.FC<NavigationBuilderButtonProps> = ({ fieldName }) => {
  const { value, setValue } = useField<number | string | { id: number | string } | null>({
    path: fieldName,
  })
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOwner = Boolean(user && (user as { role?: string }).role === 'owner')

  const pageId =
    typeof value === 'object' && value !== null && 'id' in value
      ? (value as { id: string | number }).id
      : value

  const kind = fieldName === 'headerPage' ? 'header' : 'footer'
  const buttonLabel =
    kind === 'header'
      ? vi.pk33.createHeaderFromTemplate
      : vi.pk33.createFooterFromTemplate

  const handleCreateFromTemplate = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      // REVIEW-REQUIRED: Gọi endpoint tạo đầu trang / chân trang từ mẫu (yêu cầu quyền owner)
      const res = await fetch('/api/pages/create-from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || vi.pk33.errorCreateFailed)
      }

      const { id } = await res.json()
      setValue(id)
      window.open(`/builder/${id}`, '_blank')
    } catch (err: any) {
      setError(err?.message || vi.pk33.errorCreateFailed)
    } finally {
      setLoading(false)
    }
  }

  // If a page is selected, show "Chỉnh sửa trực quan"
  if (pageId) {
    return (
      <div style={{ marginTop: '8px', marginBottom: '12px' }}>
        <a
          href={`/builder/${pageId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            backgroundColor: '#280A60',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '12px',
            textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <span>🎨</span>
          <span>{vi.eb10.openVisualBuilder}</span>
        </a>
      </div>
    )
  }

  // Only owner can see the "Tạo từ mẫu" button
  if (!isOwner) {
    return null
  }

  return (
    <div style={{ marginTop: '8px', marginBottom: '16px' }}>
      <button
        type="button"
        disabled={loading}
        onClick={handleCreateFromTemplate}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          backgroundColor: loading ? '#9E9E9E' : '#280A60',
          color: '#FFFFFF',
          borderRadius: '6px',
          fontWeight: 600,
          fontSize: '13px',
          cursor: loading ? 'not-allowed' : 'pointer',
          border: 'none',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          transition: 'background-color 0.15s ease',
        }}
      >
        <span>🪄</span>
        <span>{loading ? vi.pk33.creating : buttonLabel}</span>
      </button>

      {error && (
        <p style={{ color: '#E53E3E', fontSize: '12px', marginTop: '6px' }}>
          {error}
        </p>
      )}

      <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', maxWidth: '480px' }}>
        {vi.pk33.builderHint}
      </p>
    </div>
  )
}

export const HeaderBuilderButton: React.FC = () => (
  <NavigationBuilderButton fieldName="headerPage" />
)
export const FooterBuilderButton: React.FC = () => (
  <NavigationBuilderButton fieldName="footerPage" />
)
