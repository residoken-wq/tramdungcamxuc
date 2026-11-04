'use client'

import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { StepQuoteHeader } from '../StepQuoteHeader'
import type { HabitFlowDraft } from '@/components/habit/flow/draft'
import { daysToWeekdays, weekdaysToDays } from '../draft-adapter'
import { addVietnamDays, getVietnamYmd } from '@/lib/habit/tracker-stats'
import { DEFAULT_DP01_CONTENT, type Dp01Step4Content } from '@/lib/habit/dp01-content'
import { vi } from '@/lib/i18n/vi'

export interface Step4IdentityHabitProps {
  draft: HabitFlowDraft
  step4Content?: Dp01Step4Content
  onDraftChange: (draft: HabitFlowDraft) => void
  onNext: () => void
  onPrev: () => void
}

export const SUGGESTED_ROLE_PILLS = DEFAULT_DP01_CONTENT.step4.suggestedRoles
export const SUGGESTED_ATOMIC_HABIT_PILLS = DEFAULT_DP01_CONTENT.step4.suggestedAtomicHabits

const DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export function Step4IdentityHabit({
  draft,
  step4Content = DEFAULT_DP01_CONTENT.step4,
  onDraftChange,
  onNext,
  onPrev,
}: Step4IdentityHabitProps) {
  const selectedDays = weekdaysToDays(draft.rhythmDays)
  const startDate = draft.startDate || getVietnamYmd()
  const endDate = addVietnamDays(startDate, 27)

  // Toggle day of week (giữ ít nhất 1 ngày)
  const handleToggleDay = (day: string) => {
    let nextDays: string[]
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        nextDays = selectedDays.filter((d) => d !== day)
      } else {
        return
      }
    } else {
      nextDays = [...selectedDays, day]
    }
    onDraftChange({
      ...draft,
      rhythmDays: daysToWeekdays(nextDays),
      rhythmFrequency: nextDays.length,
    })
  }

  // Chọn tần suất có sẵn
  const handleSelectFrequency = (freq: 3 | 5 | 7) => {
    let nextDays: string[]
    if (freq === 3) nextDays = ['T2', 'T4', 'T6']
    else if (freq === 5) nextDays = ['T2', 'T3', 'T4', 'T5', 'T6']
    else nextDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

    onDraftChange({
      ...draft,
      rhythmDays: daysToWeekdays(nextDays),
      rhythmFrequency: freq,
    })
  }

  // Helper format YYYY-MM-DD to DD/MM/YYYY
  const formatFinishDate = (dateStr?: string) => {
    if (!dateStr) return '06/11/2026'
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  const is3Selected =
    selectedDays.length === 3 && ['T2', 'T4', 'T6'].every((d) => selectedDays.includes(d))
  const is5Selected =
    selectedDays.length === 5 &&
    ['T2', 'T3', 'T4', 'T5', 'T6'].every((d) => selectedDays.includes(d))
  const isAllSelected =
    selectedDays.length === 7 && DAYS_OF_WEEK.every((d) => selectedDays.includes(d))

  return (
    <div className="space-y-8">
      {/* 1. Quote Block */}
      <StepQuoteHeader
        stage="GIAI ĐOẠN 2 · XÂY THÓI QUEN"
        title="Gọi tên thói quen"
        quote="“Mỗi hành động bạn thực hiện là một lá phiếu cho con người mà bạn muốn trở thành.”"
        author="— James Clear, Atomic Habits —"
      />

      {/* Lead-in Text */}
      <p className="text-center text-deep-navy/60 text-sm md:text-base max-w-2xl mx-auto mt-4 mb-8 leading-relaxed font-ui">
        {step4Content.leadIn}
      </p>

      {/* 2. Khối 1: Tuyên ngôn về thói quen */}
      <div className="bg-white rounded-[20px] border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-5">
        <div className="border-b border-lavender-mist/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bright-magenta" />
            <h2 className="font-ui font-bold text-lg text-deep-navy">
              {step4Content.statementTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-deep-navy/60 font-ui mt-0.5">
            {step4Content.statementDesc}
          </p>
        </div>

        {/* Input formula */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-warm-ivory border border-lavender-mist space-y-4">
          <div className="space-y-3.5 font-ui text-deep-navy/80">
            {/* Dòng 1: Tôi sẽ */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="font-bold text-sm sm:text-base text-deep-navy sm:w-28 flex-shrink-0">
                Tôi sẽ
              </span>
              <input
                type="text"
                value={draft.actionText || ''}
                onChange={(e) => onDraftChange({ ...draft, actionText: e.target.value })}
                placeholder="đọc sách mỗi ngày"
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white border border-lavender-mist focus:border-bright-magenta outline-none text-xs sm:text-sm font-ui text-deep-navy transition-all"
              />
            </div>

            {/* Dòng 2: để trở thành */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="font-bold text-sm sm:text-base text-deep-navy sm:w-28 flex-shrink-0">
                để trở thành
              </span>
              <input
                type="text"
                value={draft.personText || ''}
                onChange={(e) => onDraftChange({ ...draft, personText: e.target.value })}
                placeholder="người luôn học hỏi"
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white border border-lavender-mist focus:border-bright-magenta outline-none text-xs sm:text-sm font-ui text-deep-navy transition-all"
              />
            </div>
          </div>

          {/* 4 Chip gợi ý vai trò */}
          <div className="pt-2 border-t border-lavender-mist/60">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-deep-navy/70 font-ui mb-2">
              Gợi ý vai trò:
            </span>
            <div className="flex flex-wrap gap-2">
              {step4Content.suggestedRoles.map((role, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onDraftChange({ ...draft, personText: role })}
                  className={`px-3 py-1.5 rounded-full text-xs font-ui border transition-all active:scale-95 cursor-pointer ${
                    draft.personText === role
                      ? 'bg-bright-magenta text-white border-bright-magenta font-semibold shadow-sm'
                      : 'bg-white hover:bg-bright-magenta/10 hover:border-bright-magenta/40 text-deep-navy/80 border-lavender-mist'
                  }`}
                >
                  ✨ {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Khối 2: Nhịp điệu thói quen */}
      <div className="bg-white rounded-[20px] border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-5">
        <div className="border-b border-lavender-mist/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bright-magenta" />
            <h2 className="font-ui font-bold text-lg text-deep-navy">{step4Content.rhythmTitle}</h2>
          </div>
          <p className="text-xs sm:text-sm text-deep-navy/60 font-ui mt-0.5">
            {step4Content.rhythmDesc}
          </p>
        </div>

        {/* 3 Nút chọn tần suất */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            aria-pressed={is3Selected}
            onClick={() => handleSelectFrequency(3)}
            className={`py-3.5 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
              is3Selected
                ? 'bg-deep-navy text-white border-deep-navy shadow-soft font-bold'
                : 'bg-white text-deep-navy/80 border-lavender-mist hover:border-bright-magenta/40 hover:bg-warm-ivory font-medium'
            }`}
          >
            <div className="font-display text-sm sm:text-base tracking-wide uppercase">
              3 lần một tuần
            </div>
          </button>

          <button
            type="button"
            aria-pressed={is5Selected}
            onClick={() => handleSelectFrequency(5)}
            className={`py-3.5 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
              is5Selected
                ? 'bg-deep-navy text-white border-deep-navy shadow-soft font-bold'
                : 'bg-white text-deep-navy/80 border-lavender-mist hover:border-bright-magenta/40 hover:bg-warm-ivory font-medium'
            }`}
          >
            <div className="font-display text-sm sm:text-base tracking-wide uppercase">
              5 lần một tuần
            </div>
          </button>

          <button
            type="button"
            aria-pressed={isAllSelected}
            onClick={() => handleSelectFrequency(7)}
            className={`py-3.5 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
              isAllSelected
                ? 'bg-deep-navy text-white border-deep-navy shadow-soft font-bold'
                : 'bg-white text-deep-navy/80 border-lavender-mist hover:border-bright-magenta/40 hover:bg-warm-ivory font-medium'
            }`}
          >
            <div className="font-display text-sm sm:text-base tracking-wide uppercase">
              Mỗi ngày
            </div>
          </button>
        </div>

        {/* Dãy 7 nút thứ */}
        <div className="pt-2 space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-deep-navy/60 font-ui">
            Chọn các ngày cụ thể:
          </span>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isChecked = selectedDays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={isChecked}
                  onClick={() => handleToggleDay(day)}
                  className={`py-2.5 rounded-2xl border font-ui font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-bright-magenta text-white border-bright-magenta shadow-sm'
                      : 'bg-white text-deep-navy/70 border-lavender-mist hover:border-bright-magenta/50 hover:bg-soft-pink/30'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <p className="text-xs text-deep-navy/60 font-ui italic pt-1 leading-relaxed">
            {step4Content.rhythmNote}
          </p>
        </div>
      </div>

      {/* 4. Khối 3: Thói quen hạt nhân */}
      <div className="bg-white rounded-[20px] border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-5">
        <div className="border-b border-lavender-mist/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bright-magenta" />
            <h2 className="font-ui font-bold text-lg text-deep-navy">
              {step4Content.atomicHabitTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-deep-navy/60 font-ui mt-0.5">
            {step4Content.atomicHabitDesc}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={draft.twoMinuteAction || ''}
              onChange={(e) => onDraftChange({ ...draft, twoMinuteAction: e.target.value })}
              placeholder="đọc 1 trang sách"
              className="w-full px-4 py-3 rounded-2xl bg-warm-ivory border border-lavender-mist focus:border-bright-magenta outline-none text-xs sm:text-sm font-ui text-deep-navy transition-all"
            />
          </div>

          {/* 4 Chip gợi ý */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-deep-navy/70 font-ui mb-2">
              Gợi ý thói quen:
            </span>
            <div className="flex flex-wrap gap-2">
              {step4Content.suggestedAtomicHabits.map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onDraftChange({ ...draft, twoMinuteAction: pill })}
                  className={`px-3 py-1.5 rounded-full text-xs font-ui border transition-all active:scale-95 cursor-pointer ${
                    draft.twoMinuteAction === pill
                      ? 'bg-bright-magenta text-white border-bright-magenta font-semibold shadow-sm'
                      : 'bg-white hover:bg-bright-magenta/10 hover:border-bright-magenta/40 text-deep-navy/80 border-lavender-mist'
                  }`}
                >
                  ✨ {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Hộp "Câu xếp chồng của bạn" */}
          {draft.anchorHabit ? (
            <div className="p-4 sm:p-5 rounded-[20px] bg-butter-cream/30 border border-deep-navy/10 text-deep-navy space-y-2 font-ui">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-deep-navy/70">
                <span>⚓</span>
                <span>Câu xếp chồng của bạn</span>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-deep-navy">
                <span>Sau khi </span>
                <strong className="font-bold text-deep-navy bg-white/70 px-2 py-0.5 rounded-md border border-deep-navy/10">
                  {draft.anchorHabit}
                </strong>
                <span>, tôi sẽ </span>
                <strong className="font-bold text-deep-navy bg-white/70 px-2 py-0.5 rounded-md border border-deep-navy/10">
                  {draft.twoMinuteAction || '[thói quen hạt nhân]'}
                </strong>
                <span>.</span>
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-[20px] bg-butter-cream/20 border border-deep-navy/10 text-deep-navy font-ui text-xs sm:text-sm italic text-deep-navy/70">
              Chọn một Mentor ở bước 3 để câu xếp chồng tự hiện ra đây.
            </div>
          )}
        </div>
      </div>

      {/* 5. Khối 4: Vì sao điều này quan trọng & Cam kết */}
      <div className="bg-white rounded-[20px] border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-5">
        <div className="border-b border-lavender-mist/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bright-magenta" />
            <h2 className="font-ui font-bold text-lg text-deep-navy">
              {step4Content.commitmentTitle}
            </h2>
          </div>
        </div>

        <div className="space-y-4 font-ui">
          {/* Textarea */}
          <div>
            <label
              htmlFor="field-private-reason"
              className="block text-xs font-bold uppercase tracking-wider text-deep-navy/70 mb-1.5"
            >
              {step4Content.whyImportantLabel}
            </label>
            <textarea
              id="field-private-reason"
              rows={3}
              value={draft.privateReason || ''}
              onChange={(e) => onDraftChange({ ...draft, privateReason: e.target.value })}
              placeholder={step4Content.whyImportantPlaceholder}
              className="w-full p-3.5 rounded-2xl bg-warm-ivory border border-lavender-mist focus:border-bright-magenta outline-none text-xs sm:text-sm text-deep-navy transition-all leading-relaxed"
            />
            <p className="text-xs text-deep-navy/70 font-ui mt-1.5 leading-relaxed">
              {step4Content.whyImportantNote}
            </p>
          </div>

          {/* Lưới 2 cột: Ngày bắt đầu & Ngày về đích */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
            {/* Cột 1: NGÀY BẮT ĐẦU */}
            <div>
              <label
                htmlFor="field-start-date"
                className="block text-xs font-bold uppercase tracking-wider text-deep-navy/70 mb-1.5"
              >
                Ngày bắt đầu
              </label>
              <input
                id="field-start-date"
                type="date"
                value={startDate}
                onChange={(e) => onDraftChange({ ...draft, startDate: e.target.value })}
                className="w-full h-11 px-3.5 py-2.5 rounded-2xl bg-white border border-lavender-mist focus:border-bright-magenta text-xs sm:text-sm font-ui text-deep-navy outline-none transition-all shadow-sm"
              />
              <p className="text-xs text-deep-navy/70 font-ui mt-1.5">
                Bạn sẽ về đích ngày {formatFinishDate(endDate)}.
              </p>
            </div>

            {/* Cột 2: NGÀY VỀ ĐÍCH */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-deep-navy/70 mb-1.5">
                Ngày về đích
              </label>
              <div className="w-full h-11 px-3.5 py-2.5 rounded-2xl bg-mint-haze/40 border border-deep-navy/20 text-xs sm:text-sm font-bold text-deep-navy flex items-center shadow-sm">
                {formatFinishDate(endDate)}
              </div>
            </div>
          </div>

          {/* Bạn đồng hành */}
          <div className="pt-1">
            <label
              htmlFor="field-companion"
              className="block text-xs font-bold uppercase tracking-wider text-deep-navy/70 mb-1.5"
            >
              BẠN ĐỒNG HÀNH{' '}
              <span className="font-normal lowercase text-deep-navy/70">(không bắt buộc)</span>
            </label>
            <input
              id="field-companion"
              type="text"
              value={draft.companionName || ''}
              onChange={(e) => onDraftChange({ ...draft, companionName: e.target.value })}
              placeholder="Người bạn muốn chia sẻ hành trình xây thói quen hạt nhân này"
              className="w-full h-11 px-3.5 py-2.5 rounded-2xl bg-white border border-lavender-mist focus:border-bright-magenta text-xs sm:text-sm font-ui text-deep-navy outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-deep-navy/30 hover:border-deep-navy text-deep-navy text-sm font-ui font-semibold bg-white hover:bg-warm-ivory transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{vi.dp01.back}</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white text-sm sm:text-base font-ui font-semibold shadow-soft hover:shadow-soft-md transition-all active:scale-95 group cursor-pointer"
        >
          <span>{vi.dp01.nextIdentity}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
