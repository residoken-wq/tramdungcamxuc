'use client'

import React, { useState, useRef, useSyncExternalStore } from 'react'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'

export interface CardShareButtonsProps {
  cardCode: string
  qrSlug: string
  className?: string
}

export function CardShareButtons({ cardCode, qrSlug, className = '' }: CardShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Khóa nút tới khi trang chạy JavaScript trên client
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const handleDownload = (format: '4x5' | '9x16') => {
    track('card_shared', { cardCode, format, platform: 'download' })
    const downloadUrl = `/eq-buddy/the/${qrSlug}/anh/${format}`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `eq-buddy-${cardCode}-${format}.png`
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    const cardUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/eq-buddy/the/${qrSlug}`
        : `/eq-buddy/the/${qrSlug}`

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: vi.eqBuddy.share.shareTitle(cardCode),
          text: vi.eqBuddy.share.shareText(cardCode),
          url: cardUrl,
        })
        track('card_shared', { cardCode, format: 'link', platform: 'native' })
        return
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
      }
    }

    // Fallback: Sao chép liên kết vào clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cardUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = cardUrl
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setCopied(true)
      track('card_shared', { cardCode, format: 'link', platform: 'copy' })

      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false)
      }, 2500)
    } catch {
      // Bỏ qua lỗi sao chép không được hỗ trợ
    }
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        {/* Nút Tải ảnh 4:5 */}
        <button
          type="button"
          disabled={!isHydrated}
          onClick={() => handleDownload('4x5')}
          aria-label={vi.eqBuddy.share.ariaDownload45}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-deep-navy bg-white/90 border border-deep-navy/20 shadow-sm hover:bg-soft-pink hover:border-bright-magenta/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 motion-reduce:transition-none"
        >
          <svg
            className="w-4 h-4 text-bright-magenta shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>{vi.eqBuddy.share.download45}</span>
        </button>

        {/* Nút Tải ảnh 9:16 */}
        <button
          type="button"
          disabled={!isHydrated}
          onClick={() => handleDownload('9x16')}
          aria-label={vi.eqBuddy.share.ariaDownload916}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-deep-navy bg-white/90 border border-deep-navy/20 shadow-sm hover:bg-soft-pink hover:border-bright-magenta/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 motion-reduce:transition-none"
        >
          <svg
            className="w-4 h-4 text-bright-magenta shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>{vi.eqBuddy.share.download916}</span>
        </button>

        {/* Nút Chia sẻ link */}
        <button
          type="button"
          disabled={!isHydrated}
          onClick={handleShare}
          aria-label={vi.eqBuddy.share.ariaShare}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-accent-pink shadow-sm hover:bg-bright-magenta active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 motion-reduce:transition-none"
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span>{vi.eqBuddy.share.share}</span>
        </button>
      </div>

      {/* Thông báo sao chép */}
      {copied && (
        <div
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-mint-haze border border-mint-haze/80 text-deep-navy text-xs font-semibold shadow-sm transition-opacity duration-200 motion-reduce:transition-none"
        >
          <svg
            className="w-3.5 h-3.5 text-bright-magenta shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{vi.eqBuddy.share.copied}</span>
        </div>
      )}
    </div>
  )
}

export default CardShareButtons
