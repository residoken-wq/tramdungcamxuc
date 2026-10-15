import React from 'react'

/**
 * Admin Icon for Trạm Dừng Cảm Xúc CMS
 * Displayed in collapsed navigation and browser tab / header.
 * Uses brand colors (deep-navy, accent-pink) with WCAG AA compliance.
 */
export function AdminIcon() {
  return (
    <div
      className="admin-brand-icon"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Trạm Dừng Cảm Xúc"
        role="img"
      >
        <rect width="28" height="28" rx="6" fill="#280A60" />
        <path
          d="M2.5 15.5H8L10 11L12 18L13.5 13.5L15 16H16.5C16.5 14.8 17.5 13.8 18.7 13.8C19.6 13.8 20.4 14.3 20.8 15.1C21.2 14.3 22 13.8 22.9 13.8C24.1 13.8 25.1 14.8 25.1 16C25.1 17.6 22.6 19.4 20.8 20.3C19.1 19.4 16.5 17.6 16.5 16H25.5"
          stroke="#EF3B83"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
