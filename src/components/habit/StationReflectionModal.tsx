'use client'

import React, { useState, useEffect, useId } from 'react'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import { saveStationReflection } from '@/lib/habit/reflection-actions'

export interface StationReflectionModalProps {
  isOpen: boolean
  onClose: () => void
  stationName: string
  stationIndex: number
  /**
   * Danh sách câu hỏi và câu trả lời ban đầu.
   * Nếu đã lưu suy ngẫm trước đó: các câu hỏi được lấy từ snapshot đã chụp lại (reflection.answers).
   * Nếu chưa lưu: lấy từ CMS (station.reflectionQuestions).
   */
  initialQuestions: {
    question: string
    answer?: string
  }[]
  readOnly?: boolean
  onSuccess?: (savedData: {
    stationIndex: number
    answers: { question: string; answer: string }[]
  }) => void
}

export function StationReflectionModal({
  isOpen,
  onClose,
  stationName,
  stationIndex,
  initialQuestions,
  readOnly = false,
  onSuccess,
}: StationReflectionModalProps) {
  const baseId = useId()
  const [answers, setAnswers] = useState<string[]>(() =>
    initialQuestions.map((q) => q.answer || ''),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lắng nghe phím Escape để đóng modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const handleAnswerChange = (index: number, val: string) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = val
      return next
    })
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (readOnly || isSubmitting) return

    const trimmed = answers.map((a) => (a || '').trim())
    const hasAny = trimmed.some((a) => a.length > 0)
    if (!hasAny) {
      setError(vi.hb12.errors.allAnswersEmpty)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await saveStationReflection(stationIndex, answers)
      if (result.success) {
        const cleanAnswers = initialQuestions.map((q, idx) => ({
          question: q.question,
          answer: (answers[idx] || '').trim(),
        }))
        onSuccess?.({
          stationIndex,
          answers: cleanAnswers,
        })
        onClose()
      } else {
        setError(result.message || vi.hb12.errors.saveFailed)
      }
    } catch (err) {
      console.error('Error saving reflection:', err)
      setError(vi.hb12.errors.saveFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${baseId}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-warm-ivory rounded-card border border-deep-navy/15 p-6 sm:p-7 shadow-xl max-h-[90vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-deep-navy/10 pb-3">
          <h2 id={`${baseId}-title`} className="font-ui font-bold text-lg text-deep-navy">
            {vi.hb12.modalTitle(stationName)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-deep-navy/60 hover:text-deep-navy text-xl font-bold p-1 rounded-lg focus-visible:outline-2 focus-visible:outline-deep-navy disabled:opacity-50"
            aria-label={vi.hb12.closeButton}
          >
            ✕
          </button>
        </div>

        {/* Subtitle & Notices */}
        <p className="text-xs sm:text-sm font-sans text-deep-navy/80 italic">
          {vi.hb12.modalSubtitle}
        </p>

        {readOnly && (
          <div className="bg-butter-cream/40 p-3 rounded-xl border border-deep-navy/10 text-xs font-sans text-deep-navy/80">
            {vi.hb12.readOnlyNotice}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-accent-pink/10 border border-accent-pink/30 text-xs font-sans text-deep-navy"
          >
            {error}
          </div>
        )}

        {/* Questions form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {initialQuestions.map((item, idx) => {
            const inputId = `${baseId}-q-${idx}`
            const currentVal = answers[idx] || ''
            return (
              <div key={inputId} className="space-y-1.5">
                <label
                  htmlFor={inputId}
                  className="block text-xs sm:text-sm font-ui font-semibold text-deep-navy"
                >
                  {idx + 1}. {item.question}
                </label>
                <textarea
                  id={inputId}
                  value={currentVal}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  maxLength={1000}
                  disabled={readOnly || isSubmitting}
                  rows={3}
                  placeholder={vi.hb12.answerPlaceholder}
                  className="w-full p-3 rounded-xl border border-deep-navy/20 bg-white/80 focus:bg-white text-xs sm:text-sm text-deep-navy font-sans placeholder:text-deep-navy/40 focus:border-deep-navy focus-visible:outline-2 focus-visible:outline-deep-navy transition-colors disabled:opacity-60 resize-y"
                />
                <div className="flex justify-end">
                  <span className="text-[11px] font-sans text-deep-navy/60">
                    {vi.hb12.charCount(currentVal.length, 1000)}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-deep-navy/10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {vi.hb12.closeButton}
            </Button>
            {!readOnly && (
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? vi.hb12.savingButton : vi.hb12.saveButton}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
