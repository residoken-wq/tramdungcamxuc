'use client'

import React, { useState, useSyncExternalStore } from 'react'
import { updateReminderPreferenceAction } from '@/lib/reminders/actions'
import { vi } from '@/lib/i18n/vi'

export interface ReminderEmailToggleProps {
  initialOptOut?: boolean | null
}

export function ReminderEmailToggle({ initialOptOut }: ReminderEmailToggleProps) {
  // initialOptOut === true -> toggle is OFF (disabled); false/null/undefined -> toggle is ON (enabled)
  const [enabled, setEnabled] = useState(!initialOptOut)
  const [isLoading, setIsLoading] = useState(false)
  // Khóa công tắc tới khi trang chạy JavaScript (bấm trước đó chỉ đổi giao diện, không lưu)
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  const t = vi.reminders.account

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.checked
    setEnabled(nextVal)
    setIsLoading(true)
    setFeedback(null)

    try {
      // REVIEW-REQUIRED: Gọi server action không kèm customerId (danh tính lấy từ phiên trên máy chủ)
      const res = await updateReminderPreferenceAction(nextVal)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
      } else {
        // Revert on failure
        setEnabled(!nextVal)
        setFeedback({ type: 'error', message: res.message })
      }
    } catch (err) {
      console.error('[ReminderEmailToggle] Lỗi cập nhật tùy chọn:', err)
      setEnabled(!nextVal)
      setFeedback({ type: 'error', message: t.error })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/95 rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
      <h2 className="font-ui text-base font-bold text-deep-navy">{t.cardHeading}</h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="space-y-1 max-w-lg">
          <label
            htmlFor="reminder-toggle"
            className="text-sm font-semibold text-deep-navy cursor-pointer block"
          >
            {t.toggleLabel}
          </label>
          <p className="text-xs text-deep-navy/70 leading-relaxed">{t.toggleDescription}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <label
            htmlFor="reminder-toggle"
            className="relative inline-flex items-center cursor-pointer select-none"
          >
            <input
              id="reminder-toggle"
              type="checkbox"
              checked={enabled}
              role="switch"
              aria-checked={enabled}
              disabled={!isHydrated || isLoading}
              onChange={handleToggle}
              className="sr-only peer"
              aria-label={t.toggleLabel}
            />
            <div
              className={`w-11 h-6 bg-lavender-mist rounded-full peer peer-focus-visible:ring-2 peer-focus-visible:ring-accent-pink peer-focus-visible:ring-offset-2 peer-checked:after:translate-x-full peer-checked:after:border-accent-pink after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-warm-ivory after:border-deep-navy/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all motion-reduce:after:transition-none peer-checked:bg-accent-pink ${
                !isHydrated || isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />
          </label>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`text-xs px-3 py-2 rounded-lg ${
            feedback.type === 'success'
              ? 'bg-mint-haze/60 text-deep-navy border border-mint-haze'
              : 'bg-soft-pink text-bright-magenta border border-accent-pink/30'
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  )
}
