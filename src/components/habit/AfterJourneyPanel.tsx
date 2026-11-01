'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import { safeHref } from '@/lib/safe-href'
import { track } from '@/lib/analytics/track'

export interface AfterJourneyPanelProps {
  title?: string | null
  text?: string | null
  coachBookingUrl?: string | null
  donationUrl?: string | null
  journeyDays?: number
  variant?: 'default' | 'highlighted'
  className?: string
}

export function AfterJourneyPanel({
  title,
  text,
  coachBookingUrl,
  donationUrl,
  journeyDays = 28,
  variant = 'default',
  className = '',
}: AfterJourneyPanelProps) {
  const safeCoachUrl = coachBookingUrl ? safeHref(coachBookingUrl) : null
  const safeDonationUrl = donationUrl ? safeHref(donationUrl) : null

  const displayTitle = title?.trim() || vi.hb14.title(journeyDays)
  // HB-14c: no hard-coded copy (AGENTS §2) – the paragraph comes only from the CMS
  const displayText = text?.trim() || null

  // Nếu không có cả 2 link và không có cả tiêu đề/nội dung tùy biến, vẫn hiển thị theo bản dịch mặc định
  // nếu ít nhất 1 link có thật. Nếu hoàn toàn không có link nào và không có chữ từ CMS -> không hiện khối rỗng.
  const hasCustomContent = Boolean(title?.trim() || text?.trim())
  const hasButtons = Boolean(safeCoachUrl || safeDonationUrl)

  if (!hasCustomContent && !hasButtons) {
    return null
  }

  const handleCoachClick = () => {
    track('booking_clicked', {
      pageSlug: 'habit-tracker',
      slug: 'habit-coach',
    })
  }

  const borderClass =
    variant === 'highlighted'
      ? 'border-2 border-bright-magenta/30 shadow-sm'
      : 'border border-deep-navy/10 shadow-xs'

  return (
    <div
      data-testid="after-journey-panel"
      className={`w-full bg-warm-ivory rounded-card ${borderClass} p-6 sm:p-8 space-y-4 ${className}`}
    >
      <div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-ui font-semibold bg-lavender-mist/60 text-deep-navy mb-2">
          {vi.hb14.badge}
        </span>
        <h2 className="font-ui font-bold text-lg sm:text-xl text-deep-navy">{displayTitle}</h2>
      </div>

      {displayText && (
        <p className="font-sans text-xs sm:text-sm text-deep-navy/80 leading-relaxed max-w-2xl whitespace-pre-line">
          {displayText}
        </p>
      )}

      {hasButtons && (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {safeCoachUrl && (
            <a
              href={safeCoachUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCoachClick}
              data-testid="after-journey-coach-button"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-bright-magenta text-warm-ivory font-ui font-bold text-sm hover:bg-bright-magenta/90 shadow-sm transition-all motion-reduce:transition-none"
            >
              {vi.hb14.coachButton}
            </a>
          )}

          {safeDonationUrl && (
            <a
              href={safeDonationUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="after-journey-donation-button"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border-2 border-accent-pink text-deep-navy bg-warm-ivory hover:bg-soft-pink font-ui font-bold text-sm transition-all motion-reduce:transition-none shadow-xs"
            >
              {vi.hb14.donateButton}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
