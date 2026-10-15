import React from 'react'

/**
 * Admin Logo for Trạm Dừng Cảm Xúc CMS
 * Displayed on Payload admin login page and navigation header.
 * Uses brand colors (deep-navy, bright-magenta, accent-pink) with WCAG AA compliance.
 */
export function AdminLogo() {
  return (
    <div
      className="admin-brand-logo"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        textDecoration: 'none',
        userSelect: 'none',
        padding: '4px 0',
      }}
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        <rect width="34" height="34" rx="8" fill="#280A60" />
        {/* HeartLine icon */}
        <path
          d="M4 18.5H10L12 13L14 21L16 16L18 19H19.5C19.5 17.6 20.6 16.5 22 16.5C23 16.5 23.9 17.1 24.3 18C24.7 17.1 25.6 16.5 26.6 16.5C28 16.5 29.1 17.6 29.1 19C29.1 20.8 26.2 22.8 24.3 23.8C22.4 22.8 19.5 20.8 19.5 19H30"
          stroke="#EF3B83"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
        <span
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--brand-deep-navy, #280A60)',
            textTransform: 'uppercase',
          }}
        >
          Trạm Dừng Cảm Xúc
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.02em',
            color: 'var(--brand-bright-magenta, #BC039E)',
          }}
        >
          Hệ thống quản trị
        </span>
      </div>
    </div>
  )
}
