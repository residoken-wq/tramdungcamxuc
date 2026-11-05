import React from 'react'
import { vi } from '@/lib/i18n/vi'

/**
 * GL-01 1.1: Warning displayed in Payload admin SiteSettings when Google OAuth environment variables
 * (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured.
 * Alerts the owner that login page will automatically fall back to OTP to prevent lockout.
 */
export const GoogleConfigWarning: React.FC = () => {
  const hasGoogleEnv = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_ID.trim().length > 0 &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CLIENT_SECRET.trim().length > 0,
  )

  if (hasGoogleEnv) return null

  return (
    <div
      role="status"
      style={{
        margin: '0 0 16px',
        padding: '10px 14px',
        borderRadius: 8,
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #f59e0b',
        fontSize: '13px',
        fontWeight: 500,
      }}
    >
      ⚠️ {vi.gl01.googleMissingWarning}
    </div>
  )
}
