'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { vi } from '@/lib/i18n/vi'

export const EqQrDownloadButton: React.FC = () => {
  const { id } = useDocumentInfo()

  if (!id) {
    return (
      <div style={{ padding: '8px 0' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
          {vi.eqBuddy.qrExport.saveBeforeDownloadNotice}
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <a
        href={`/api/eq-cards/${id}/qr`}
        download
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
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <span aria-hidden="true">🖼️</span>
        <span>{vi.eqBuddy.qrExport.downloadPngButton}</span>
      </a>
      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#666' }}>
        {vi.eqBuddy.qrExport.downloadPngHint}
      </p>
    </div>
  )
}

export default EqQrDownloadButton
