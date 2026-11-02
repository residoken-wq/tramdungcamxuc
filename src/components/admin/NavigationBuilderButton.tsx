'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import { vi } from '@/lib/i18n/vi'

interface NavigationBuilderButtonProps {
  fieldName: 'headerPage' | 'footerPage'
}

export const NavigationBuilderButton: React.FC<NavigationBuilderButtonProps> = ({ fieldName }) => {
  const pageField = useFormFields(([fields]) => fields[fieldName])
  const pageValue = pageField?.value

  const pageId =
    typeof pageValue === 'object' && pageValue !== null && 'id' in pageValue
      ? (pageValue as { id: string | number }).id
      : pageValue

  if (!pageId) {
    return null
  }

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

export const HeaderBuilderButton: React.FC = () => (
  <NavigationBuilderButton fieldName="headerPage" />
)
export const FooterBuilderButton: React.FC = () => (
  <NavigationBuilderButton fieldName="footerPage" />
)
