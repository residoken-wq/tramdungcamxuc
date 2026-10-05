'use client'

import React, { useEffect, useRef, useState } from 'react'
import { vi } from '@/lib/i18n/vi'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  type?: ToastType
  message: string
  description?: string
  isOpen: boolean
  onClose?: () => void
  duration?: number // miligiây, 0 = không tự đóng
  className?: string
}

export const TOAST_STYLES: Record<
  ToastType,
  { container: string; iconColor: string; role: 'status' | 'alert' }
> = {
  success: {
    container: 'bg-mint-haze border-deep-navy/15 text-deep-navy',
    iconColor: 'text-deep-navy',
    role: 'status',
  },
  error: {
    container: 'bg-soft-pink border-bright-magenta/40 text-deep-navy',
    iconColor: 'text-bright-magenta',
    role: 'alert',
  },
  info: {
    container: 'bg-lavender-mist border-deep-navy/15 text-deep-navy',
    iconColor: 'text-deep-navy',
    role: 'status',
  },
}

export function Toast({
  type = 'info',
  message,
  description,
  isOpen,
  onClose,
  duration = 4000,
  className = '',
}: ToastProps) {
  const [isPaused, setIsPaused] = useState(false)
  const remainingTimeRef = useRef(duration)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isOpen || duration <= 0 || !onClose) return

    remainingTimeRef.current = duration
    startTimeRef.current = Date.now()

    const startTimer = () => {
      timerRef.current = setTimeout(() => {
        onClose()
      }, remainingTimeRef.current)
    }

    if (!isPaused) {
      startTimer()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isOpen, duration, onClose, isPaused])

  const handleMouseEnter = () => {
    if (duration <= 0) return
    setIsPaused(true)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    const elapsed = Date.now() - startTimeRef.current
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
  }

  const handleMouseLeave = () => {
    if (duration <= 0) return
    startTimeRef.current = Date.now()
    setIsPaused(false)
  }

  if (!isOpen) return null

  const config = TOAST_STYLES[type]

  return (
    <div
      role={config.role}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-card border p-4 shadow-soft transition-all duration-300 motion-reduce:transition-none ${config.container} ${className}`}
    >
      {/* Icon trạng thái */}
      <div className={`mt-0.5 shrink-0 ${config.iconColor}`} aria-hidden="true">
        {type === 'success' && (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {type === 'error' && (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        {type === 'info' && (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>

      {/* Nội dung Toast */}
      <div className="flex-1 font-ui">
        <p className="text-sm font-bold leading-tight">{message}</p>
        {description && (
          <p className="mt-1 text-xs text-deep-navy/75 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Nút đóng Toast */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={vi.toast.close}
          className="shrink-0 rounded p-1 text-deep-navy/60 hover:text-deep-navy transition-colors focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
