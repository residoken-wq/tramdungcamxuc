'use client'

import React, { useId } from 'react'
import { vi } from '@/lib/i18n/vi'
import { DEFAULT_RHYTHM_DAYS } from '@/lib/habit'
import type { Weekday } from '@/lib/habit/rhythm'
import { addVietnamDays, getVietnamYmd } from '@/lib/habit/tracker-stats'

export interface StepNameProps {
  actionText: string
  personText: string
  identityStatement: string
  anchorHabit?: string
  rhythmDays: Weekday[]
  rhythmFrequency?: number
  twoMinuteAction: string
  privateReason?: string
  companionName?: string
  startDate?: string
  journeyDays?: number
  error?: string | null
  onActionChange: (val: string) => void
  onPersonChange: (val: string) => void
  onToggleRhythmDay: (day: Weekday) => void
  onRhythmFrequencyChange?: (val: number) => void
  onTwoMinuteChange: (val: string) => void
  onPrivateReasonChange?: (val: string) => void
  onCompanionChange?: (val: string) => void
  onStartDateChange?: (val: string) => void
}

export function StepName({
  actionText,
  personText,
  identityStatement,
  anchorHabit,
  rhythmDays,
  rhythmFrequency,
  twoMinuteAction,
  privateReason = '',
  companionName = '',
  startDate,
  journeyDays = 28,
  error,
  onActionChange,
  onPersonChange,
  onToggleRhythmDay,
  onRhythmFrequencyChange,
  onTwoMinuteChange,
  onPrivateReasonChange,
  onCompanionChange,
  onStartDateChange,
}: StepNameProps) {
  const rhythmLabelId = useId()
  const rhythmDescId = useId()

  const todayYmd = getVietnamYmd()
  const maxStartDayYmd = getVietnamYmd(new Date(addVietnamDays(todayYmd, 14)))
  const effectiveStartDate = startDate && startDate.trim() ? startDate.trim() : todayYmd

  // Tính ngày kết thúc = startDate + journeyDays - 1 (theo giờ VN)
  const endDateYmd = getVietnamYmd(new Date(addVietnamDays(effectiveStartDate, journeyDays - 1)))
  const [ey, em, ed] = endDateYmd.split('-')
  const endDateFormatted = `${ed}/${em}/${ey}`

  // Target frequency: ưu tiên rhythmFrequency, fallback độ dài rhythmDays, mặc định 7
  const targetFreq =
    typeof rhythmFrequency === 'number' && rhythmFrequency >= 1 && rhythmFrequency <= 7
      ? rhythmFrequency
      : rhythmDays.length || 7

  const isRhythmCountMismatch = rhythmDays.length !== targetFreq

  // Phân loại lỗi hiển thị ngay dưới phần tương ứng (role="alert")
  const isIdentityError =
    error === vi.hb20.errors.identityRequired || error === vi.habit.wizard.errors.identityRequired

  const isRhythmError =
    error === vi.hb20.errors.rhythmEmpty ||
    error === vi.hb09.step2.rhythmEmptyError ||
    error === vi.hb20.errors.rhythmCountMismatch(targetFreq, rhythmDays.length)

  const isStartDateError =
    error === vi.hb20.errors.startDateOutOfRange || error === vi.hb20.errors.startDateInvalid

  const isPrivateReasonError = error === vi.hb20.errors.privateReasonTooLong
  const isCompanionError = error === vi.hb20.errors.companionNameTooLong

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tiêu đề 2 tầng màu chuẩn Brand Book */}
      <div>
        <span className="font-ui font-semibold text-xs text-bright-magenta uppercase tracking-wider block mb-1">
          {vi.hb16.steps.name.shortTitle}
        </span>
        <h2 className="font-display text-2xl sm:text-3xl !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy mb-1.5">
          {vi.hb20.stepTitle}
        </h2>
        <p className="font-body text-sm sm:text-base text-deep-navy/80">{vi.hb20.stepSubtitle}</p>
      </div>

      {/* ============================================================== */}
      {/* 1. Tuyên ngôn danh tính                                         */}
      {/* ============================================================== */}
      <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-white border border-lavender-mist shadow-xs">
        <div className="border-b border-lavender-mist/50 pb-3">
          <h3 className="font-display text-lg sm:text-xl !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy mb-1">
            {vi.hb20.declaration.title}
          </h3>
          <p className="font-body text-xs sm:text-sm text-deep-navy/80">
            {vi.habit.wizard.step2.subtitle}
          </p>
        </div>

        <div className="space-y-3.5">
          <div>
            <label
              htmlFor="field-action-text"
              className="block text-xs sm:text-sm font-semibold text-deep-navy mb-1.5"
            >
              {vi.hb20.declaration.actionLabel}
            </label>
            <input
              id="field-action-text"
              type="text"
              value={actionText}
              onChange={(e) => onActionChange(e.target.value)}
              placeholder={vi.hb20.declaration.actionPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="field-person-text"
              className="block text-xs sm:text-sm font-semibold text-deep-navy mb-1.5"
            >
              {vi.hb20.declaration.personLabel}
            </label>
            <input
              id="field-person-text"
              type="text"
              value={personText}
              onChange={(e) => onPersonChange(e.target.value)}
              placeholder={vi.hb20.declaration.personPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm"
            />
          </div>
        </div>

        {/* Gợi ý công thức gắn Mentor (nếu đã chọn Mentor ở bước 3) */}
        {anchorHabit && (
          <div className="p-3.5 rounded-xl bg-mint-haze/40 border border-mint-haze text-xs sm:text-sm text-deep-navy">
            <span className="font-semibold text-bright-magenta block mb-1">
              💡 {vi.hb20.declaration.anchorFormulaTitle}
            </span>
            <p className="font-quote italic text-deep-navy text-sm sm:text-base">
              &ldquo;{vi.hb09.step2.anchorFormulaPreview(anchorHabit, actionText)}&rdquo;
            </p>
          </div>
        )}

        {/* Hộp xem trước câu định danh thời gian thực */}
        <div className="p-5 rounded-xl bg-brand-gradient border border-lavender-mist/70">
          <span className="text-xs uppercase tracking-wider text-bright-magenta font-semibold block mb-1.5">
            {vi.hb20.declaration.previewHeading}
          </span>
          <p className="font-quote italic text-deep-navy text-base sm:text-lg">
            {identityStatement || (
              <span className="text-deep-navy/70">{vi.habit.wizard.errors.identityExample}</span>
            )}
          </p>
        </div>

        {isIdentityError && (
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
      {/* 2. Nhịp điệu thói quen                                         */}
      {/* ============================================================== */}
      <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-white border border-lavender-mist shadow-xs">
        <div className="border-b border-lavender-mist/50 pb-3">
          <h3 className="font-display text-lg sm:text-xl !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy mb-1">
            {vi.hb20.rhythm.title}
          </h3>
          <p className="font-body text-xs sm:text-sm text-deep-navy/80">
            {vi.hb20.rhythm.frequencyHint}
          </p>
        </div>

        {/* Chọn số lần mỗi tuần (1 - 7) */}
        <div>
          <span className="block text-xs sm:text-sm font-semibold text-deep-navy mb-2">
            {vi.hb20.rhythm.frequencyLabel}
          </span>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              const isSelected = targetFreq === num
              return (
                <button
                  key={num}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={vi.hb20.rhythm.frequencyButtonAria(num)}
                  onClick={() => {
                    if (onRhythmFrequencyChange) {
                      onRhythmFrequencyChange(num)
                    }
                  }}
                  className={`min-h-[44px] py-2 px-1 rounded-xl font-ui text-sm sm:text-base font-bold transition-all text-center ${
                    isSelected
                      ? 'bg-deep-navy text-white shadow-soft ring-2 ring-bright-magenta/40'
                      : 'bg-warm-ivory text-deep-navy/80 border border-lavender-mist hover:bg-soft-pink/50 hover:text-deep-navy'
                  }`}
                >
                  {num}
                </button>
              )
            })}
          </div>
        </div>

        {/* Chọn đúng số thứ tương ứng */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span
              id={rhythmLabelId}
              className="block text-xs sm:text-sm font-semibold text-deep-navy"
            >
              {vi.hb20.rhythm.daysLabel}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isRhythmCountMismatch
                  ? 'bg-accent-pink/15 text-deep-navy'
                  : 'bg-mint-haze text-deep-navy'
              }`}
            >
              {vi.hb20.rhythm.countStatus(targetFreq, rhythmDays.length)}
            </span>
          </div>

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
                  className={`min-h-[44px] py-2 px-1 text-xs sm:text-sm font-semibold rounded-xl border transition-all text-center ${
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

        {/* Câu nhắc ngày nghỉ có kế hoạch */}
        <div className="p-3.5 rounded-xl bg-mint-haze/40 border border-mint-haze/70 flex items-start gap-2.5 text-xs sm:text-sm text-deep-navy">
          <span className="text-base select-none shrink-0" aria-hidden="true">
            🌿
          </span>
          <span className="font-medium leading-relaxed">{vi.hb20.rhythm.plannedRestNote}</span>
        </div>

        {isRhythmError && (
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
      {/* 3. Thói quen hạt nhân (dưới 2 phút)                            */}
      {/* ============================================================== */}
      <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-white border border-lavender-mist shadow-xs">
        <div className="border-b border-lavender-mist/50 pb-3">
          <h3 className="font-display text-lg sm:text-xl !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy mb-1">
            {vi.hb20.coreHabit.title}
          </h3>
          <p className="font-body text-xs sm:text-sm text-deep-navy/80">
            {vi.hb20.coreHabit.subtitle}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="field-two-minute-action"
              className="block text-xs sm:text-sm font-semibold text-deep-navy"
            >
              {vi.hb20.coreHabit.label}
            </label>
            <span className="text-xs text-deep-navy/60 font-medium">
              {vi.hb20.coreHabit.charCount(twoMinuteAction.length, 200)}
            </span>
          </div>
          <input
            id="field-two-minute-action"
            type="text"
            maxLength={200}
            value={twoMinuteAction}
            onChange={(e) => onTwoMinuteChange(e.target.value.slice(0, 200))}
            placeholder={vi.hb20.coreHabit.placeholder}
            className="w-full px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm"
          />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. Vì sao điều này quan trọng với bạn?                         */}
      {/* ============================================================== */}
      <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-white border border-lavender-mist shadow-xs">
        <div className="border-b border-lavender-mist/50 pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <h3 className="font-display text-lg sm:text-xl !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy">
              {vi.hb20.privateReason.title}
            </h3>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-soft-pink text-deep-navy border border-bright-magenta/20">
              {vi.hb20.privateReason.privateBadge}
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-deep-navy/80">
            {vi.hb20.privateReason.subtitle}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="field-private-reason"
              className="block text-xs sm:text-sm font-semibold text-deep-navy"
            >
              {vi.hb20.privateReason.label}
            </label>
            <span className="text-xs text-deep-navy/60 font-medium">
              {vi.hb20.privateReason.charCount(privateReason.length, 500)}
            </span>
          </div>
          <textarea
            id="field-private-reason"
            rows={3}
            maxLength={500}
            value={privateReason}
            onChange={(e) => {
              if (onPrivateReasonChange) {
                onPrivateReasonChange(e.target.value.slice(0, 500))
              }
            }}
            placeholder={vi.hb20.privateReason.placeholder}
            className="w-full px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm leading-relaxed"
          />
        </div>

        {isPrivateReasonError && (
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
      {/* 5. Ngày bắt đầu                                                */}
      {/* ============================================================== */}
      <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-white border border-lavender-mist shadow-xs">
        <div className="border-b border-lavender-mist/50 pb-3">
          <h3 className="font-display text-lg sm:text-xl !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy mb-1">
            {vi.hb20.startDate.title}
          </h3>
          <p className="font-body text-xs sm:text-sm text-deep-navy/80">
            {vi.hb20.startDate.subtitle}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="field-start-date"
              className="block text-xs sm:text-sm font-semibold text-deep-navy mb-1.5"
            >
              {vi.hb20.startDate.label}
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                id="field-start-date"
                type="date"
                min={todayYmd}
                max={maxStartDayYmd}
                value={effectiveStartDate}
                onChange={(e) => {
                  if (onStartDateChange) {
                    onStartDateChange(e.target.value)
                  }
                }}
                className="px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm font-medium"
              />
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-butter-cream/40 border border-butter-cream text-xs sm:text-sm font-semibold text-deep-navy">
                <span>🗓️</span>
                <span>{vi.hb20.startDate.endDateHint(endDateFormatted)}</span>
              </div>
            </div>
          </div>
        </div>

        {isStartDateError && (
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
      {/* 6. Bạn đồng hành                                               */}
      {/* ============================================================== */}
      <section className="space-y-4 p-5 sm:p-6 rounded-2xl bg-white border border-lavender-mist shadow-xs">
        <div className="border-b border-lavender-mist/50 pb-3">
          <h3 className="font-display text-lg sm:text-xl !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy mb-1">
            {vi.hb20.companion.title}
          </h3>
          <p className="font-body text-xs sm:text-sm text-deep-navy/80">
            {vi.hb20.companion.subtitle}
          </p>
        </div>

        <div>
          <label
            htmlFor="field-companion-name"
            className="block text-xs sm:text-sm font-semibold text-deep-navy mb-1.5"
          >
            {vi.hb20.companion.label}
          </label>
          <input
            id="field-companion-name"
            type="text"
            maxLength={100}
            value={companionName}
            onChange={(e) => {
              if (onCompanionChange) {
                onCompanionChange(e.target.value.slice(0, 100))
              }
            }}
            placeholder={vi.hb20.companion.placeholder}
            className="w-full px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm"
          />
          <p className="text-xs text-deep-navy/60 mt-1.5 font-normal">{vi.hb20.companion.note}</p>
        </div>

        {isCompanionError && (
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
