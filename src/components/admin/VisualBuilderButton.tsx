'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const VisualBuilderButton: React.FC = () => {
  const { id } = useDocumentInfo()

  if (!id) {
    return (
      <div style={{ padding: '8px 0' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
          Vui lòng lưu trang trước khi mở trình chỉnh sửa trực quan.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <a
        href={`/builder/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 16px',
          backgroundColor: '#280A60',
          color: '#FFFFFF',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '13px',
          textDecoration: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          transition: 'background-color 0.2s',
        }}
      >
        <span>🎨</span>
        <span>Chỉnh sửa trực quan (Puck Editor)</span>
      </a>
      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#666' }}>
        Mở giao diện kéo thả trực quan toàn màn hình trong tab mới.
      </p>
    </div>
  )
}

export default VisualBuilderButton
