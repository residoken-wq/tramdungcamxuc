'use client'

import React, { useId } from 'react'
import { vi } from '@/lib/i18n/vi'
import { DEFAULT_RHYTHM_DAYS } from '@/lib/habit'
import type { Weekday } from '@/lib/habit/rhythm'

export interface StepNameProps {
  actionText: string
  personText: string
  identityStatement: string
  anchorHabit: string
  rhythmDays: Weekday[]
  twoMinuteAction: string
  todayFormatted: string
  onActionChange: (val: string) => void
  onPersonChange: (val: string) => void
  onToggleRhythmDay: (day: Weekday) => void
  onTwoMinuteChange: (val: string) => void
}

export function StepName({
  actionText,
  personText,
  identityStatement,
  anchorHabit,
  rhythmDays,
  twoMinuteAction,
  todayFormatted,
  onActionChange,
  onPersonChange,
  onToggleRhythmDay,
  onTwoMinuteChange,
}: StepNameProps) {
  const rhythmLabelId = useId()
  const rhythmDescId = useId()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
          {vi.habit.wizard.step2.title}
        </h2>
        <p className="text-sm sm:text-base text-deep-navy/80">{vi.habit.wizard.step2.subtitle}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-deep-navy mb-1.5">
            {vi.habit.wizard.step2.actionLabel}
          </label>
          <input
            type="text"
            value={actionText}
            onChange={(e) => onActionChange(e.target.value)}
            placeholder={vi.habit.wizard.step2.actionPlaceholder}
            className="w-full px-4 py-3 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-deep-navy mb-1.5">
            {vi.habit.wizard.step2.identityLabel}
          </label>
          <input
            type="text"
            value={personText}
            onChange={(e) => onPersonChange(e.target.value)}
            placeholder={vi.habit.wizard.step2.identityPlaceholder}
            className="w-full px-4 py-3 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta"
          />
        </div>
      </div>

      {/* Gợi ý công thức gắn thói quen neo (chỉ hiển thị khi đã chọn thói quen neo) */}
      {anchorHabit && (
        <div className="p-4 rounded-xl bg-mint-haze/30 border border-mint-haze text-xs sm:text-sm text-deep-navy">
          <span className="font-semibold text-bright-magenta block mb-1">
            💡 {vi.hb09.step1.anchorSectionTitle}:
          </span>
          <p className="font-quote italic text-deep-navy text-sm sm:text-base">
            &ldquo;{vi.hb09.step2.anchorFormulaPreview(anchorHabit, actionText)}&rdquo;
          </p>
        </div>
      )}

      {/* Nhịp tuần (ngày bỏ phiếu) */}
      <div className="p-4 rounded-xl bg-warm-ivory border border-lavender-mist space-y-2.5">
        <div className="flex items-center justify-between">
          <p id={rhythmLabelId} className="block text-sm font-semibold text-deep-navy">
            {vi.hb09.step2.rhythmLabel}
          </p>
          <span className="text-xs text-deep-navy/60 font-medium">
            {vi.hb09.step2.rhythmCount(rhythmDays.length)}
          </span>
        </div>
        <p id={rhythmDescId} className="text-xs text-deep-navy/70">
          {vi.hb09.step2.rhythmDesc}
        </p>
        <div
          role="group"
          aria-labelledby={rhythmLabelId}
          aria-describedby={rhythmDescId}
          className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1"
        >
          {DEFAULT_RHYTHM_DAYS.map((day) => {
            const isSelected = rhythmDays.includes(day)
            const dayLabel = vi.hb03.fields.rhythmDaysOptions[day]
            return (
              <button
                key={day}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggleRhythmDay(day)}
                className={`py-2 px-1 text-xs sm:text-sm font-semibold rounded-lg border transition-all text-center ${
                  isSelected
                    ? 'bg-bright-magenta text-white border-bright-magenta shadow-soft'
                    : 'bg-white text-deep-navy/70 border-lavender-mist hover:bg-soft-pink/50 hover:border-accent-pink'
                }`}
              >
                {dayLabel}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bản tối giản dưới 2 phút */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="field-two-minute-action"
            className="block text-sm font-semibold text-deep-navy"
          >
            {vi.hb09.step2.twoMinuteLabel}
          </label>
          <span className="text-xs text-deep-navy/60">
            {vi.hb09.step2.twoMinuteCharCount(twoMinuteAction.length, 200)}
          </span>
        </div>
        <input
          id="field-two-minute-action"
          type="text"
          maxLength={200}
          value={twoMinuteAction}
          onChange={(e) => onTwoMinuteChange(e.target.value.slice(0, 200))}
          placeholder={vi.hb09.step2.twoMinutePlaceholder}
          className="w-full px-4 py-3 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm sm:text-base"
        />
      </div>

      {/* Dòng chỉ đọc ngày bắt đầu + Nhắc nhở dữ liệu riêng tư */}
      <div className="p-4 rounded-xl bg-warm-ivory border border-lavender-mist text-xs sm:text-sm text-deep-navy/80 space-y-1.5">
        <div className="font-semibold text-deep-navy flex items-center gap-1.5">
          <span>📅</span>
          <span>{vi.hb09.step2.startDateReadOnly(todayFormatted)}</span>
        </div>
        <div className="text-deep-navy/70 italic flex items-center gap-1.5">
          <span>🔒</span>
          <span>{vi.hb09.step2.privateDataNote}</span>
        </div>
      </div>

      {/* Hộp xem trước câu định danh thời gian thực */}
      <div className="p-6 rounded-card bg-brand-gradient border border-lavender-mist">
        <span className="text-xs uppercase tracking-wider text-bright-magenta font-semibold block mb-2">
          {vi.habit.wizard.step2.previewLabel}
        </span>
        <p className="font-quote italic text-deep-navy text-lg sm:text-xl">
          {identityStatement || (
            <span className="text-deep-navy/70">{vi.habit.wizard.errors.identityExample}</span>
          )}
        </p>
      </div>

      {/* Lời khuyên từ Hana */}
      <div className="p-4 rounded-xl bg-butter-cream/40 border border-butter-cream text-xs sm:text-sm text-deep-navy">
        <strong className="block mb-1">{vi.habit.wizard.step2.tipTitle}</strong>
        <span>{vi.habit.wizard.step2.tipContent}</span>
      </div>
    </div>
  )
}
