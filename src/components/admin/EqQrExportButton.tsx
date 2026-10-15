'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'

export const EqQrExportButton: React.FC = () => {
  const handleExport = () => {
    if (typeof window === 'undefined') return
    window.open('/api/eq-cards/qr-export', '_blank')
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '0 4px',
      }}
    >
      <button
        type="button"
        onClick={handleExport}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#280A60',
          color: '#FFFFFF',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#3B1287'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#280A60'
        }}
      >
        <span aria-hidden="true">📥</span>
        <span>{vi.eqBuddy.qrExport.exportCsvButton}</span>
      </button>
    </div>
  )
}

export default EqQrExportButton
