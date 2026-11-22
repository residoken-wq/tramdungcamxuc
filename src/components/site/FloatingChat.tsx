'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'

/**
 * Path prefixes where the floating chat would cover a learning / card flow.
 * T3-01 adds /eq-buddy/the (card page opened from a printed QR).
 */
export const HIDE_FLOATING_CHAT_PREFIXES = [
  '/habit/hoc',
  '/habit/tracker',
  '/eq-buddy/the',
  '/eq-buddy/rut-the',
] as const

/**
 * Kiểm tra chung một đường dẫn có bắt đầu bằng bất kỳ tiền tố nào trong danh sách không.
 */
export function shouldHidePathWithPrefixes(
  pathname: string | null | undefined,
  prefixes: readonly string[],
): boolean {
  if (!pathname) return false
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/**
 * Kiểm tra xem một pathname có thuộc danh sách cần ẩn FloatingChat không.
 */
export function shouldHideFloatingChat(
  pathname: string | null | undefined,
  prefixes: readonly string[] = HIDE_FLOATING_CHAT_PREFIXES,
): boolean {
  return shouldHidePathWithPrefixes(pathname, prefixes)
}

export interface FloatingChatProps {
  showFloatingChat?: boolean | null
  zaloChatUrl?: string | null
  className?: string
  isStandalone?: boolean
}

export function FloatingChat({
  showFloatingChat,
  zaloChatUrl,
  className = '',
  isStandalone = true,
}: FloatingChatProps) {
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

  const link = (
    <a
      href={zaloChatUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={vi.site.floatingChat.ariaLabel}
      title={vi.site.floatingChat.tooltip}
      data-testid="floating-zalo"
      onClick={handleClick}
      className={`group flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-bright-magenta text-white shadow-soft hover:bg-accent-pink hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer ${
        !isStandalone ? className : ''
      }`}
    >
      <span className="sr-only">{vi.site.floatingChat.ariaLabel}</span>
      {/* "Zalo" word instead of a generic chat bubble, so the button is recognisable */}
      <span
        aria-hidden="true"
        className="font-ui text-[13px] sm:text-sm font-bold tracking-tight transition-transform duration-200 motion-reduce:transition-none group-hover:scale-105"
      >
        Zalo
      </span>
    </a>
  )

  if (!isStandalone) {
    return link
  }

  return (
    <aside
      aria-label={vi.site.floatingChat.ariaLabel}
      className={`fixed right-4 sm:right-6 z-30 ${className}`}
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
    >
      {link}
    </aside>
  )
}
