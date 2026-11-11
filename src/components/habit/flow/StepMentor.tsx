'use client'

import React, { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TimePickerAmPm } from '@/components/habit/TimePickerAmPm'
import { vi } from '@/lib/i18n/vi'
import type { HabitScorecardItem, HabitScorecardRating } from '@/lib/habit'
import type { CleanStepQuote } from '@/lib/habit/journey-content.server'

export interface StepMentorProps {
  scorecard: HabitScorecardItem[]
  anchorHabit: string
  onAddHabit: (text: string, rating: HabitScorecardRating) => void
  onUpdateTime: (index: number, timeVal: string) => void
  onSelectAnchor: (habitText: string) => void
  onRemoveHabit: (index: number) => void
  onUpdateRating: (index: number, rating: HabitScorecardRating) => void
  onError: (msg: string | null) => void
  error?: string | null
  quote?: CleanStepQuote | null
}

export function StepMentor({
  scorecard,
  anchorHabit,
  onAddHabit,
  onUpdateTime,
  onSelectAnchor,
  onRemoveHabit,
  onUpdateRating,
  onError,
  error,
  quote,
}: StepMentorProps) {
  const [newHabitText, setNewHabitText] = useState('')
  const [newHabitRating, setNewHabitRating] = useState<HabitScorecardRating>('neutral')
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)
  const habitInputId = useId()

  const handleAdd = (textToAdd?: string, ratingToAdd?: HabitScorecardRating) => {
    const text = (textToAdd ?? newHabitText).trim()
    const rating = ratingToAdd ?? newHabitRating
    if (!text) {
      onError(vi.hb19.errors.habitRequired)
      return
    }
    onAddHabit(text, rating)
    if (textToAdd === undefined) {
      setNewHabitText('')
    }
    onError(null)
  }

  const handleRatingChange = (index: number, newRating: HabitScorecardRating) => {
    const targetItem = scorecard[index]
    if (targetItem && targetItem.habit === anchorHabit && newRating !== 'good') {
      onSelectAnchor('')
      setNoticeMessage(vi.hb19.part2.unselectedMentorNotice)
    }
    onUpdateRating(index, newRating)
    onError(null)
  }

  const handleRemove = (index: number) => {
    const targetItem = scorecard[index]
    if (targetItem && targetItem.habit === anchorHabit) {
      onSelectAnchor('')
      setNoticeMessage(vi.hb19.part2.deletedMentorNotice)
    }
    onRemoveHabit(index)
    onError(null)
  }

  const goodHabits = scorecard.filter((item) => item.rating === 'good' && item.habit.length <= 120)

  const isPart1Error =
    error === vi.hb19.errors.scorecardEmpty ||
    error === vi.habit.wizard.errors.scorecardEmpty ||
    error === vi.hb19.errors.habitRequired ||
    error === vi.habit.wizard.errors.habitRequired

  const isPart2Error =
    error === vi.hb19.errors.anchorRequired ||
    error === vi.hb09.errors.anchorHabitNotGood ||
    error === vi.hb19.errors.timeInvalidFormat
  // HB-19c: HabitFlow hides its own alert on step 3, so any other message must still show here.
  const showPart1Error = Boolean(error) && (isPart1Error || !isPart2Error)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tiêu đề 2 tầng màu chuẩn Brand Book */}
      <div>
        <span className="font-ui font-semibold text-xs text-bright-magenta uppercase tracking-wider block mb-1">
          {vi.hb16.steps.mentor.shortTitle}
        </span>
        <h2 className="font-display text-2xl sm:text-3xl !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy mb-1.5">
          {vi.hb19.stepTitle}
        </h2>
        <p className="font-body text-sm sm:text-base text-deep-navy/80">{vi.hb19.stepSubtitle}</p>
      </div>

      {/* Câu trích dẫn bước 3 từ CMS nếu có */}
      {quote && quote.text && (
        <blockquote
          data-testid="mentor-quote"
          className="rounded-2xl bg-lavender-mist/40 border border-lavender-mist p-4 sm:p-5 space-y-2"
        >
          <p className="font-quote italic text-base sm:text-lg text-deep-navy leading-relaxed">
            &ldquo;{quote.text}&rdquo;
          </p>
          <footer className="font-ui text-xs sm:text-sm text-deep-navy/80 font-medium">
            <span>— {quote.author}</span>
            <span> · </span>
            {quote.sourceUrl ? (
              <a
                href={quote.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-bright-magenta focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bright-magenta rounded"
              >
                {quote.source}
              </a>
            ) : (
              <span>{quote.source}</span>
            )}
          </footer>
        </blockquote>
      )}

      {/* ============================================================== */}
      {/* PHẦN 1: Soi lại một ngày của bạn                               */}
      {/* ============================================================== */}
      <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-white border border-lavender-mist shadow-sm">
        <div className="border-b border-lavender-mist/50 pb-3">
          <h3 className="font-display text-lg sm:text-xl text-deep-navy mb-1">
            {vi.hb19.part1.title}
          </h3>
          <p className="font-body text-xs sm:text-sm text-deep-navy/80">{vi.hb19.part1.subtitle}</p>
        </div>

        {/* Ô thêm thói quen */}
        <div className="p-4 rounded-xl bg-warm-ivory border border-lavender-mist/80">
          <label
            htmlFor={habitInputId}
            className="block text-xs font-semibold text-deep-navy uppercase tracking-wider mb-2"
          >
            {vi.hb19.part1.addInputPlaceholder}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id={habitInputId}
              type="text"
              value={newHabitText}
              onChange={(e) => setNewHabitText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              placeholder={vi.hb19.part1.addInputPlaceholder}
              className="flex-1 px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm"
            />
            <div className="flex gap-2">
              <select
                value={newHabitRating}
                onChange={(e) => setNewHabitRating(e.target.value as HabitScorecardRating)}
                className="px-3 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm font-medium"
                aria-label={vi.habit.wizard.errors.ratingAria}
              >
                <option value="good">{vi.hb19.part1.ratings.good.label}</option>
                <option value="neutral">{vi.hb19.part1.ratings.neutral.label}</option>
                <option value="bad">{vi.hb19.part1.ratings.bad.label}</option>
              </select>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleAdd()}
                className="whitespace-nowrap"
              >
                {vi.hb19.part1.addButton}
              </Button>
            </div>
          </div>

          {/* Gợi ý mẫu */}
          <div className="mt-4 pt-3 border-t border-lavender-mist/40">
            <span className="text-xs text-deep-navy/70 block mb-2 font-medium">
              {vi.hb19.part1.samplesPrompt}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {vi.hb19.part1.sampleHabits.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleAdd(sample, 'neutral')}
                  className="text-xs px-2.5 py-1 rounded-full bg-white border border-lavender-mist text-deep-navy hover:bg-soft-pink hover:border-accent-pink transition-colors font-medium"
                >
                  + {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Danh sách việc đã thêm */}
        <div role="list" className="space-y-2.5 pt-2">
          {scorecard.length === 0 ? (
            <p className="text-center py-6 text-deep-navy/60 italic text-sm">
              {vi.hb19.part1.emptyPrompt}
            </p>
          ) : (
            scorecard.map((item, index) => (
              <div
                key={index}
                role="listitem"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-lavender-mist bg-warm-ivory/60 hover:bg-warm-ivory transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-deep-navy break-words min-w-0 flex-1">
                    {item.habit}
                  </span>
                  {anchorHabit === item.habit && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-bright-magenta text-white shrink-0 tracking-wider">
                      {vi.hb19.part2.selectedBadge}
                    </span>
                  )}
                </div>

                {/* Rating buttons: Mỗi dấu có chữ đi kèm, không chỉ dựa vào màu */}
                <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleRatingChange(index, 'good')}
                    aria-pressed={item.rating === 'good'}
                    aria-label={vi.hb19.part1.ratings.good.ariaLabel(item.habit)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      item.rating === 'good'
                        ? 'bg-mint-haze text-deep-navy ring-2 ring-deep-navy/30 shadow-xs'
                        : 'bg-white text-deep-navy/70 border border-lavender-mist/70 hover:bg-mint-haze/40'
                    }`}
                  >
                    <span>+</span>
                    <span>Có ích</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRatingChange(index, 'neutral')}
                    aria-pressed={item.rating === 'neutral'}
                    aria-label={vi.hb19.part1.ratings.neutral.ariaLabel(item.habit)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      item.rating === 'neutral'
                        ? 'bg-butter-cream text-deep-navy ring-2 ring-deep-navy/30 shadow-xs'
                        : 'bg-white text-deep-navy/70 border border-lavender-mist/70 hover:bg-butter-cream/40'
                    }`}
                  >
                    <span>=</span>
                    <span>Trung tính</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRatingChange(index, 'bad')}
                    aria-pressed={item.rating === 'bad'}
                    aria-label={vi.hb19.part1.ratings.bad.ariaLabel(item.habit)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      item.rating === 'bad'
                        ? 'bg-soft-pink text-deep-navy ring-2 ring-deep-navy/30 shadow-xs'
                        : 'bg-white text-deep-navy/70 border border-lavender-mist/70 hover:bg-soft-pink/40'
                    }`}
                  >
                    <span>−</span>
                    <span>Không có ích</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="ml-1 p-1 text-deep-navy/60 hover:text-accent-pink text-sm transition-colors"
                    aria-label={vi.hb19.part1.deleteButtonAria(item.habit)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lỗi Phần 1 hiện ngay dưới phần 1 với role="alert" */}
        {showPart1Error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-accent-pink/10 border border-accent-pink/20 text-deep-navy text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-fade-in"
          >
            <span className="text-bright-magenta font-bold text-base" aria-hidden="true">
              !
            </span>
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* PHẦN 2: Chọn Mentor                                            */}
      {/* ============================================================== */}
      <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-white border border-lavender-mist shadow-sm">
        <div className="border-b border-lavender-mist/50 pb-3">
          <h3 className="font-display text-lg sm:text-xl text-deep-navy mb-1">
            {vi.hb19.part2.title}
          </h3>
          <p className="font-body text-xs sm:text-sm text-deep-navy/80 leading-relaxed">
            {vi.hb19.part2.explanation}
          </p>
        </div>

        {/* Thông báo nếu việc làm Mentor bị hủy bỏ do đổi rating hoặc xóa */}
        {noticeMessage && (
          <div
            role="status"
            aria-live="polite"
            className="p-3.5 rounded-xl bg-lavender-mist/50 border border-lavender-mist text-xs sm:text-sm text-deep-navy flex items-center justify-between gap-2 animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true">ℹ️</span>
              <span>{noticeMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setNoticeMessage(null)}
              className="text-deep-navy/70 hover:text-deep-navy text-xs font-bold px-1"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        )}

        {/* Chỉ cho chọn trong các việc đã đánh dấu (+) */}
        {goodHabits.length === 0 ? (
          <div
            data-testid="no-good-habits-hint"
            className="p-4 rounded-xl bg-butter-cream/40 border border-butter-cream text-xs sm:text-sm text-deep-navy flex items-start gap-2.5"
          >
            <span className="text-base select-none" aria-hidden="true">
              💡
            </span>
            <span className="font-medium">{vi.hb19.part2.noGoodHabitsPrompt}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-deep-navy uppercase tracking-wider block">
              {vi.hb19.part2.selectPrompt}
            </span>

            <div className="space-y-2.5">
              {goodHabits.map((item, idx) => {
                const isSelected = anchorHabit === item.habit
                const originalIndex = scorecard.findIndex((s) => s.habit === item.habit)

                return (
                  <div
                    key={`${item.habit}-${idx}`}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-bright-magenta bg-soft-pink/30 shadow-xs'
                        : 'border-lavender-mist bg-white hover:bg-warm-ivory/60'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="anchorHabit"
                        checked={isSelected}
                        onChange={() => {
                          onSelectAnchor(item.habit)
                          onError(null)
                          setNoticeMessage(null)
                        }}
                        className="w-4 h-4 text-bright-magenta focus:ring-bright-magenta cursor-pointer"
                        aria-label={`${vi.hb09.step1.anchorRadioLabel}: ${item.habit}`}
                      />
                      <span className="text-sm font-semibold text-deep-navy flex-1 break-words">
                        {item.habit}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-bright-magenta text-white uppercase tracking-wider">
                          {vi.hb19.part2.selectedBadge}
                        </span>
                      )}
                    </label>

                    {/* Ô "Việc này thường diễn ra lúc mấy giờ?" (không bắt buộc) gắn vào việc được chọn */}
                    {isSelected && (
                      <div className="mt-3.5 pt-3.5 border-t border-bright-magenta/20 flex flex-col sm:flex-row sm:items-center gap-2.5 animate-fade-in">
                        <label
                          htmlFor={`mentor-time-${originalIndex}`}
                          className="text-xs font-medium text-deep-navy shrink-0"
                        >
                          {vi.hb19.part2.timeLabel}
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          <TimePickerAmPm
                            id={`mentor-time-${originalIndex}`}
                            value={item.time || ''}
                            onChange={(nextTime) => onUpdateTime(originalIndex, nextTime)}
                            ariaLabel={vi.hb19.part2.timeAriaLabel(item.habit)}
                          />
                          <span className="text-[11px] text-deep-navy/70 italic">
                            {vi.hb19.part2.timeHint}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Lỗi Phần 2 hiện ngay dưới phần 2 với role="alert" */}
        {isPart2Error && error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-accent-pink/10 border border-accent-pink/20 text-deep-navy text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-fade-in"
          >
            <span className="text-bright-magenta font-bold text-base" aria-hidden="true">
              !
            </span>
            <span>{error}</span>
          </div>
        )}
      </section>
    </div>
  )
}
