'use client'

import React from 'react'
import { ArrowLeft, ArrowRight, Plus, Trash2, Check, Anchor, ArrowUp } from 'lucide-react'
import type { DailyRoutineItem } from '../types'
import { StepQuoteHeader } from '../StepQuoteHeader'
import type { CleanStepQuote } from '@/lib/habit/journey-content.server'
import { DEFAULT_DP01_CONTENT, type Dp01Step3Content } from '@/lib/habit/dp01-content'
import { vi } from '@/lib/i18n/vi'

export interface Step3FindMentorProps {
  routines: DailyRoutineItem[]
  selectedMentor: string
  mentorTime?: string
  step3Content?: Dp01Step3Content
  stepQuote?: CleanStepQuote | null
  onRoutinesChange: (routines: DailyRoutineItem[]) => void
  onMentorSelect: (mentor: string) => void
  onMentorTimeChange?: (time: string) => void
  onNext: () => void
  onPrev: () => void
}

export function Step3FindMentor({
  routines,
  selectedMentor,
  mentorTime = '',
  step3Content = DEFAULT_DP01_CONTENT.step3,
  stepQuote,
  onRoutinesChange,
  onMentorSelect,
  onMentorTimeChange,
  onNext,
  onPrev,
}: Step3FindMentorProps) {
  // Update activity text
  const handleActivityChange = (id: string, text: string) => {
    onRoutinesChange(routines.map((r) => (r.id === id ? { ...r, activity: text } : r)))
  }

  // Update score
  const handleScoreChange = (id: string, score: '+' | '-' | '=') => {
    onRoutinesChange(
      routines.map((r) => (r.id === id ? { ...r, score: r.score === score ? null : score } : r)),
    )
  }

  // Add routine
  const handleAddRoutine = () => {
    const newRoutine: DailyRoutineItem = {
      id: `r-${Date.now()}`,
      activity: '',
      score: null,
    }
    onRoutinesChange([...routines, newRoutine])
  }

  // Delete routine
  const handleDeleteRoutine = (id: string) => {
    if (routines.length <= 1) return
    onRoutinesChange(routines.filter((r) => r.id !== id))
  }

  // Lọc ra các thói quen có score là "+" và có text
  const positiveRoutines = routines.filter((r) => r.score === '+' && r.activity.trim().length > 0)

  // Mentor chỉ hợp lệ khi nằm trong danh sách các việc [+]
  const isMentorValid = positiveRoutines.some((r) => r.activity === selectedMentor)

  const quoteText = stepQuote?.text?.trim()
    ? `“${stepQuote.text.replace(/^["“”\s]+|["“”\s]+$/g, '')}”`
    : '“Môi trường là bàn tay vô hình định hình hành vi của con người.”'
  const quoteAuthor = stepQuote?.author?.trim()
    ? stepQuote.author
    : '— James Clear, Atomic Habits —'

  return (
    <div className="space-y-8">
      {/* 1. Quote Block */}
      <StepQuoteHeader
        stage="GIAI ĐOẠN 2 · XÂY THÓI QUEN"
        title={step3Content.title || 'Tìm Mentor cho thói quen mới'}
        quote={quoteText}
        author={quoteAuthor}
      />

      {/* Lead-in Text */}
      <p className="text-center text-deep-navy/60 text-sm md:text-base max-w-2xl mx-auto mt-4 mb-8 leading-relaxed font-ui">
        {step3Content.leadIn}
      </p>

      {/* 2. Khối 1: Soi lại một ngày của bạn (Habit Scorecard) */}
      <div
        id="soi-lai-mot-ngay-section"
        className="bg-white rounded-[20px] border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-6 scroll-mt-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-lavender-mist/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bright-magenta" />
              <h2 className="font-ui font-bold text-lg text-deep-navy">
                {step3Content.scorecardTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-deep-navy/60 font-ui mt-0.5">
              {step3Content.scorecardDesc}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-ui">
            <span className="px-2 py-0.5 rounded bg-mint-haze text-deep-navy font-bold">
              {vi.dp01.scorecardUseful}
            </span>
            <span className="px-2 py-0.5 rounded bg-soft-pink text-bright-magenta font-bold">
              {vi.dp01.scorecardNotUseful}
            </span>
            <span className="px-2 py-0.5 rounded bg-lavender-mist/60 text-deep-navy/70 font-bold">
              {vi.dp01.scorecardNeutral}
            </span>
          </div>
        </div>

        {/* List of routine items */}
        <div className="space-y-3">
          {routines.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-warm-ivory/60 border border-lavender-mist/70 transition-all hover:border-bright-magenta/30"
            >
              <span className="w-6 text-center text-xs font-bold text-deep-navy/70 font-ui">
                #{index + 1}
              </span>

              {/* Text input */}
              <input
                type="text"
                value={item.activity}
                onChange={(e) => handleActivityChange(item.id, e.target.value)}
                placeholder={
                  index === 0
                    ? vi.dp01.routinePlaceholder1
                    : index === 1
                      ? vi.dp01.routinePlaceholder2
                      : index === 2
                        ? vi.dp01.routinePlaceholder3
                        : vi.dp01.routinePlaceholderDefault
                }
                className="flex-1 px-3 py-2 rounded-lg bg-white border border-lavender-mist focus:border-bright-magenta focus:ring-2 focus:ring-soft-pink outline-none text-xs sm:text-sm font-ui text-deep-navy transition-all"
              />

              {/* Score selector [+ / - / =] */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScoreChange(item.id, '+')}
                  title={vi.dp01.scorecardUsefulTitle}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                    item.score === '+'
                      ? 'bg-mint-haze text-deep-navy border border-deep-navy/40'
                      : 'bg-white text-deep-navy/70 border border-lavender-mist hover:bg-mint-haze/30'
                  }`}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleScoreChange(item.id, '-')}
                  title={vi.dp01.scorecardNotUsefulTitle}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                    item.score === '-'
                      ? 'bg-soft-pink text-bright-magenta border border-bright-magenta'
                      : 'bg-white text-deep-navy/70 border border-lavender-mist hover:bg-soft-pink/40'
                  }`}
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => handleScoreChange(item.id, '=')}
                  title={vi.dp01.scorecardNeutralTitle}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                    item.score === '='
                      ? 'bg-lavender-mist text-deep-navy border border-deep-navy/40'
                      : 'bg-white text-deep-navy/70 border border-lavender-mist hover:bg-lavender-mist/40'
                  }`}
                >
                  =
                </button>
              </div>

              {/* Delete button */}
              {routines.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteRoutine(item.id)}
                  title={vi.dp01.deleteRoutineTitle}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-deep-navy/70 hover:text-accent-pink hover:bg-white transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Nút [+ Thêm một việc] */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleAddRoutine}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-dashed border-bright-magenta/40 hover:border-bright-magenta text-bright-magenta text-xs sm:text-sm font-ui font-semibold bg-soft-pink/30 hover:bg-soft-pink/60 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{vi.dp01.addRoutine}</span>
          </button>
        </div>
      </div>

      {/* 3. Khối 2: "Chọn Mentor" */}
      <div className="bg-white rounded-[20px] border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-5">
        <div className="border-b border-lavender-mist/80 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Anchor className="w-5 h-5 text-bright-magenta" />
            <h2 className="font-ui font-bold text-lg text-deep-navy">{step3Content.mentorTitle}</h2>
          </div>
          <p className="text-xs sm:text-sm text-deep-navy/70 font-ui leading-relaxed">
            {step3Content.mentorDesc}
          </p>
        </div>

        {/* Khi chưa có việc [+] */}
        {positiveRoutines.length === 0 ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-warm-ivory/80 border border-dashed border-lavender-mist text-center space-y-3">
            <p className="text-xs sm:text-sm italic text-deep-navy/70 font-ui">
              {step3Content.emptyMentorHint}
            </p>
            <div>
              <button
                type="button"
                onClick={() => {
                  const scorecardEl = document.getElementById('soi-lai-mot-ngay-section')
                  if (scorecardEl) {
                    scorecardEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  } else {
                    window.scrollTo({ top: 100, behavior: 'smooth' })
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-soft-pink text-bright-magenta hover:bg-bright-magenta hover:text-white border border-bright-magenta/30 text-xs sm:text-sm font-ui font-semibold transition-all active:scale-95 shadow-soft cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>{vi.dp01.markUsefulRoutine}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Khi đã có việc [+]: Hiển thị thành các nút Chip */
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-deep-navy/60 font-ui">
              {vi.dp01.selectMentorPrompt}
            </label>

            <div className="flex flex-wrap gap-2.5">
              {positiveRoutines.map((routine) => {
                const isSelected = isMentorValid && selectedMentor === routine.activity
                return (
                  <button
                    key={routine.id}
                    type="button"
                    onClick={() => onMentorSelect(routine.activity)}
                    className={`px-4 py-2 rounded-full font-ui text-xs sm:text-sm font-semibold border transition-all active:scale-95 flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-bright-magenta text-white border-bright-magenta shadow-sm'
                        : 'bg-white text-deep-navy/80 border-lavender-mist hover:border-bright-magenta/40 hover:bg-soft-pink/30'
                    }`}
                  >
                    <span>{routine.activity}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                )
              })}
            </div>

            {/* Khi đã chọn 1 Chip Mentor */}
            {isMentorValid && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-warm-ivory/60 border border-lavender-mist/80 space-y-1.5">
                  <label
                    htmlFor="mentor-time-input"
                    className="block text-xs font-bold text-deep-navy/70 font-ui"
                  >
                    {step3Content.mentorTimeLabel}
                  </label>
                  <input
                    id="mentor-time-input"
                    type="time"
                    value={mentorTime}
                    onChange={(e) => onMentorTimeChange?.(e.target.value)}
                    className="px-3 py-2 text-xs sm:text-sm font-ui font-semibold text-deep-navy bg-white border border-lavender-mist rounded-xl focus:border-bright-magenta focus:ring-1 focus:ring-bright-magenta outline-none cursor-pointer shadow-sm"
                  />
                </div>

                {/* Hộp xanh xác nhận */}
                <div className="p-4 sm:p-5 rounded-[20px] bg-mint-haze/40 border border-deep-navy/20 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚓</span>
                    <h4 className="text-sm sm:text-base font-bold text-deep-navy font-ui">
                      {vi.dp01.yourMentorLabel}:{' '}
                      <span className="text-bright-magenta">{selectedMentor}</span>
                      {mentorTime ? (
                        <span className="text-deep-navy/70 font-normal">
                          {' '}
                          {vi.dp01.atTimePrefix} {mentorTime}
                        </span>
                      ) : (
                        ''
                      )}
                    </h4>
                  </div>
                  <p className="text-xs text-deep-navy/75 font-ui leading-relaxed pl-7">
                    {step3Content.mentorSuccessHint}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
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
          <span>{vi.dp01.nextMentor}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
