'use client'

import React, { useState, useSyncExternalStore } from 'react'
import { vi } from '@/lib/i18n/vi'
import { EmotionPicker } from '@/components/habit/EmotionPicker'
import type { EmotionKey } from '@/lib/emotions'
import { Button } from '@/components/ui/Button'
import { checkInDay } from '@/lib/habit/tracker-actions'
import { track } from '@/lib/analytics/track'

export interface CheckInModalProps {
  day: number
  initialDone: boolean
  initialEmotion?: EmotionKey | null
  initialNote?: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (day: number, done: boolean, emotion?: EmotionKey | null, note?: string | null) => void
  readOnly?: boolean
}

export function CheckInModal({
  day,
  initialDone,
  initialEmotion,
  initialNote,
  isOpen,
  onClose,
  onSuccess,
  readOnly = false,
}: CheckInModalProps) {
  const [done, setDone] = useState(initialDone)
  const [emotion, setEmotion] = useState<EmotionKey | null>(initialEmotion || null)
  const [note, setNote] = useState(initialNote || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Khóa nút submit tới khi trang chạy JavaScript
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (readOnly) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await checkInDay(day, done, emotion, note)
      if (res.success) {
        // Ghi nhận sự kiện phân tích chỉ từ client: chỉ chứa { day }
        try {
          track('tracker_day_checked', { day })
        } catch (_e) {}
        onSuccess(day, done, emotion, note)
        onClose()
      } else {
        setError(res.message || vi.tracker.dialog.errorSave)
      }
    } catch (_err) {
      setError(vi.tracker.dialog.errorGeneral)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/40 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-lg bg-warm-ivory rounded-card border border-deep-navy/15 p-6 sm:p-7 shadow-xl max-h-[90vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-deep-navy/10 pb-3">
          <h2 id="checkin-modal-title" className="font-ui font-bold text-lg text-deep-navy">
            {vi.tracker.dialog.title(day)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-deep-navy/60 hover:text-deep-navy text-xl font-bold p-1 rounded-lg focus-visible:outline-2 focus-visible:outline-deep-navy"
            aria-label={vi.tracker.dialog.closeAria}
          >
            ✕
          </button>
        </div>

        {readOnly && (
          <div className="bg-butter-cream/40 p-3 rounded-xl border border-deep-navy/10 text-xs font-sans text-deep-navy/80">
            {vi.tracker.readOnlyBanner}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Tick done */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-deep-navy/15 bg-warm-ivory/50 cursor-pointer hover:bg-soft-pink/20 transition-colors motion-reduce:transition-none">
            <input
              type="checkbox"
              checked={done}
              onChange={(e) => setDone(e.target.checked)}
              disabled={readOnly || isSubmitting}
              className="w-5 h-5 rounded border-deep-navy/30 text-bright-magenta focus:ring-accent-pink"
            />
            <span className="font-ui font-semibold text-sm text-deep-navy select-none">
              {vi.tracker.dialog.doneLabel}
            </span>
          </label>

          {/* 2. Chọn cảm xúc */}
          <div>
            <EmotionPicker
              value={emotion}
              onChange={(key) => setEmotion(key)}
              disabled={readOnly || isSubmitting}
              label={vi.tracker.dialog.emotionLabel}
            />
          </div>

          {/* 3. Ghi chú */}
          <div>
            <label
              htmlFor="checkin-note"
              className="block text-xs font-ui font-semibold text-deep-navy mb-1.5"
            >
              {vi.tracker.dialog.noteLabel}
            </label>
            <textarea
              id="checkin-note"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={vi.tracker.dialog.notePlaceholder}
              disabled={readOnly || isSubmitting}
              className="w-full rounded-xl border border-deep-navy/20 p-3 text-xs sm:text-sm font-sans text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 focus:ring-accent-pink/50 focus:border-accent-pink resize-none"
            />
            <div className="text-right text-[11px] text-deep-navy/70 mt-1">{note.length} / 500</div>
          </div>

          {error && (
            <p className="text-xs font-ui text-accent-pink bg-soft-pink p-2.5 rounded-lg border border-accent-pink/30">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-deep-navy/10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {vi.tracker.dialog.cancel}
            </Button>
            {!readOnly && (
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!isHydrated || isSubmitting}
              >
                {isSubmitting ? vi.tracker.dialog.saving : vi.tracker.dialog.submit}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
