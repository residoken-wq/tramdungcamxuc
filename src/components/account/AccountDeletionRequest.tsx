'use client'

import React, { useState, useSyncExternalStore } from 'react'
import { requestAccountDeletionAction } from '@/lib/account/actions'
import { vi } from '@/lib/i18n/vi'
import { Button } from '@/components/ui/Button'

export interface AccountDeletionRequestProps {
  initialRequestedAt?: string | null
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return isoString
  }
}

export function AccountDeletionRequest({ initialRequestedAt }: AccountDeletionRequestProps) {
  const [requestedAt, setRequestedAt] = useState<string | null>(initialRequestedAt || null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  // Khóa nút tương tác cho tới khi trang được hydrate đầy đủ phía client
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isHydrated || isLoading || !isConfirmed) return

    setIsLoading(true)
    setFeedback(null)

    try {
      const res = await requestAccountDeletionAction()
      if (res.success) {
        const now = res.requestedAt || new Date().toISOString()
        setRequestedAt(now)
        setFeedback({ type: 'success', message: res.message })
      } else {
        setFeedback({ type: 'error', message: res.message })
      }
    } catch (err) {
      console.error('[AccountDeletionRequest] Lỗi gửi yêu cầu:', err)
      setFeedback({ type: 'error', message: vi.account.deletion.serverError })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/95 rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
      <div>
        <h2 className="font-ui text-base font-bold text-deep-navy">
          {vi.account.deletion.heading}
        </h2>
        <p className="font-sans text-sm text-deep-navy/70 mt-1">
          {vi.account.deletion.description}
        </p>
      </div>

      {requestedAt ? (
        <div className="p-4 rounded-xl bg-mint-haze/40 border border-mint-haze space-y-2">
          <p className="font-ui text-sm font-semibold text-deep-navy">
            {vi.account.deletion.requestedOn(formatDate(requestedAt))}
          </p>
          <p className="font-sans text-xs text-deep-navy/80">
            {vi.account.deletion.requestedNotice}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-soft-pink/40 border border-soft-pink space-y-2">
            <p className="font-sans text-sm text-deep-navy/90 leading-relaxed">
              {vi.account.deletion.confirmNotice}
            </p>
            <label className="flex items-start gap-3 cursor-pointer pt-2 select-none">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                disabled={!isHydrated || isLoading}
                className="mt-0.5 h-4 w-4 rounded border-deep-navy/30 text-bright-magenta focus:ring-accent-pink"
              />
              <span className="font-sans text-xs text-deep-navy/80">
                {vi.account.deletion.confirmCheckbox}
              </span>
            </label>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs font-sans ${
                feedback.type === 'success'
                  ? 'bg-mint-haze/50 text-deep-navy border border-mint-haze'
                  : 'bg-soft-pink text-deep-navy border border-bright-magenta/20'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={!isHydrated || isLoading || !isConfirmed}
              isLoading={isLoading}
            >
              {isLoading ? vi.account.deletion.submitting : vi.account.deletion.requestButton}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
