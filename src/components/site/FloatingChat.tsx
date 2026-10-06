'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'

/**
 * Các tiền tố đường dẫn cần ẩn nút chat nổi để tránh che nội dung trải nghiệm / học tập.
 * GĐ 2/3 sẽ bổ sung các màn hình tương tác sâu khác nếu cần.
 */
export const HIDE_FLOATING_CHAT_PREFIXES = [
  '/habit/hoc',
  '/habit/tracker',
  '/eq-buddy/rut-the',
] as const

/**
 * Kiểm tra xem một pathname có thuộc danh sách cần ẩn FloatingChat không.
 */
export function shouldHideFloatingChat(
  pathname: string | null | undefined,
  prefixes: readonly string[] = HIDE_FLOATING_CHAT_PREFIXES,
): boolean {
  if (!pathname) return false
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export interface FloatingChatProps {
  showFloatingChat?: boolean | null
  zaloChatUrl?: string | null
  className?: string
}

export function FloatingChat({ showFloatingChat, zaloChatUrl, className = '' }: FloatingChatProps) {
  const pathname = usePathname()

  // Ẩn khi bị tắt trong CMS hoặc chưa cấu hình URL chat Zalo
  if (!showFloatingChat || !zaloChatUrl) {
    return null
  }

  // Ẩn trên các route học tập / rút thẻ / thực hành tập trung
  if (shouldHideFloatingChat(pathname)) {
    return null
  }

  const handleClick = () => {
    track('zalo_chat_clicked')
  }

  return (
    <aside
      aria-label={vi.site.floatingChat.ariaLabel}
      className={`fixed right-4 sm:right-6 z-30 ${className}`}
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
    >
      <a
        href={zaloChatUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={vi.site.floatingChat.ariaLabel}
        onClick={handleClick}
        className="group flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-bright-magenta text-white shadow-soft hover:bg-accent-pink hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer"
      >
        <span className="sr-only">{vi.site.floatingChat.ariaLabel}</span>
        {/* Biểu tượng trò chuyện / Zalo */}
        <svg
          className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-200 group-hover:rotate-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          <path d="M8 11h.01M12 11h.01M16 11h.01" />
        </svg>
      </a>
    </aside>
  )
}
