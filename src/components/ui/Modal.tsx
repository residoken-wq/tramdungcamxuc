'use client'

import React, { useEffect, useId, useRef } from 'react'
import { vi } from '@/lib/i18n/vi'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  triggerRef?: React.RefObject<HTMLElement | null>
  id?: string
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  triggerRef,
  id,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const generatedId = useId()
  const titleId = id ? `${id}-title` : generatedId

  // B1 Guardrail: Quản lý cuộn màn hình và chỉ trả focus khi modal chuyển từ mở sang đóng (không chạy lần mount đầu)
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true
      previousActiveElementRef.current = document.activeElement as HTMLElement | null

      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalOverflow
      }
    } else if (wasOpenRef.current) {
      // Chỉ khi modal thực sự chuyển từ MỞ sang ĐÓNG mới trả lại focus
      wasOpenRef.current = false
      const returnTarget = triggerRef?.current || previousActiveElementRef.current
      if (returnTarget && typeof returnTarget.focus === 'function') {
        setTimeout(() => {
          returnTarget.focus()
        }, 10)
      }
    }
  }, [isOpen, triggerRef])

  // B2 Guardrail: Focus vào phần tử đầu tiên DUY NHẤT một lần khi mở modal (không chạy lại khi component cha re-render)
  useEffect(() => {
    if (!isOpen) return

    const modalElement = modalRef.current
    if (!modalElement) return

    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const focusableElements = Array.from(
      modalElement.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)

    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }, [isOpen])

  // B2 Guardrail: Focus trap tính toán danh sách phần tử focus tại thời điểm bấm Tab và bẫy Esc không phụ thuộc onClose
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Phím Escape đóng modal
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }

      // 2. Phím Tab điều hướng tuần hoàn trong modal (tính danh sách focus động tại thời điểm bấm)
      if (e.key === 'Tab') {
        const modalElement = modalRef.current
        if (!modalElement) return

        const focusableSelectors =
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        const focusableElements = Array.from(
          modalElement.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)

        if (focusableElements.length === 0) {
          e.preventDefault()
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          // Shift + Tab: nếu đang ở phần tử đầu -> nhảy về phần tử cuối
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: nếu đang ở phần tử cuối -> nhảy về phần tử đầu
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/55 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none"
      onClick={(e) => {
        // Đóng khi click vào vùng nền ngoài modal card
        if (e.target === e.currentTarget) {
          onCloseRef.current()
        }
      }}
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-lg rounded-card bg-white p-6 sm:p-8 shadow-soft border border-deep-navy/10 ${className}`}
      >
        {/* Header với tiêu đề và nút Đóng */}
        <div className="flex items-start justify-between gap-4 border-b border-deep-navy/10 pb-4">
          <h2
            id={titleId}
            className="font-display text-2xl uppercase tracking-tight text-deep-navy sm:text-3xl"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label={vi.common.close}
            className="rounded-lg p-2 text-deep-navy/60 hover:text-deep-navy hover:bg-deep-navy/5 transition-colors focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nội dung modal */}
        <div className="mt-4 font-ui text-base text-deep-navy/85 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}
