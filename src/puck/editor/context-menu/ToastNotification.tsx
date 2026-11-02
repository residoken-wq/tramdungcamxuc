'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { useContextMenu } from './context-menu-context'

export function ToastNotification() {
  const { toastMessage } = useContextMenu()

  if (!toastMessage || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-12 right-6 z-[999999] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-deep-navy text-white shadow-xl text-xs font-ui font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      <svg className="w-4 h-4 text-mint-haze" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>{toastMessage}</span>
    </div>,
    document.body,
  )
}
