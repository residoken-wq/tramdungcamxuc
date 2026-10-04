'use client'

import React, { useEffect, useRef } from 'react'
import { vi } from '@/lib/i18n/vi'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  triggerRef?: React.RefObject<HTMLElement | null>
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  triggerRef,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  // Lưu phần tử active trước khi mở modal để trả lại focus khi đóng
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null

      // Khóa cuộn màn hình nền
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Trả focus về nút kích hoạt khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      const returnTarget = triggerRef?.current || previousActiveElementRef.current
      if (returnTarget && typeof returnTarget.focus === 'function') {
        // Đặt timeout nhẹ để đảm bảo modal đã đóng khỏi DOM hoàn toàn trước khi focus
        setTimeout(() => {
          returnTarget.focus()
        }, 10)
      }
    }
  }, [isOpen, triggerRef])

  // Focus trap và xử lý phím Esc
  useEffect(() => {
    if (!isOpen) return

    const modalElement = modalRef.current
    if (!modalElement) return

    // Tìm tất cả các phần tử có thể nhận focus
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const focusableElements = Array.from(
      modalElement.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)

    // Focus vào phần tử đầu tiên (thường là nút đóng hoặc nội dung đầu)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Phím Escape đóng modal
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // 2. Phím Tab điều hướng tuần hoàn trong modal (Focus Trap)
      if (e.key === 'Tab') {
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
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/55 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        // Đóng khi click vào vùng nền (outside modal card)
        if (e.target === e.currentTarget) {
          onClose()
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
            id="modal-title"
            className="font-display text-2xl uppercase tracking-tight text-deep-navy sm:text-3xl"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
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
