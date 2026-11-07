'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import type { CleanHabitDiagnose } from '@/lib/habit/journey-content.server'
import {
  type Dp01Step1Content,
  DEFAULT_DIAGNOSE_QUESTIONS,
  DEFAULT_CATEGORY_MAP,
} from '@/lib/habit/dp01-content'
import { vi } from '@/lib/i18n/vi'

export interface Step1DiagnoseProps {
  diagnose?: CleanHabitDiagnose | null
  step1Content?: Dp01Step1Content
  answers: Record<number, number>
  onAnswerChange: (questionId: number, score: number) => void
  onNext: () => void
}

export { DEFAULT_DIAGNOSE_QUESTIONS }
export const CATEGORY_MAP = DEFAULT_CATEGORY_MAP

export function Step1Diagnose({
  diagnose,
  step1Content,
  answers,
  onAnswerChange,
  onNext,
}: Step1DiagnoseProps) {
  const questions =
    diagnose?.questions && diagnose.questions.length > 0
      ? diagnose.questions.map((q, idx) => ({
          id: idx + 1,
          text: q.statement,
          category: (q.stage || 'cue').toLowerCase(),
        }))
      : DEFAULT_DIAGNOSE_QUESTIONS

  const answeredCount = Object.values(answers).filter((v) => typeof v === 'number' && v > 0).length
  const isAllAnswered = answeredCount === questions.length

  // Tính điểm trung bình 4 nhóm (thang 1–5 theo quyết định H3)
  const getStageAverage = (stage: string) => {
    const stageQuestions = questions.filter((q) => q.category === stage)
    if (stageQuestions.length === 0) return 0
    let total = 0
    let count = 0
    stageQuestions.forEach((q) => {
      const score = answers[q.id]
      if (typeof score === 'number' && score > 0) {
        total += score
        count++
      }
    })
    return count > 0 ? total / count : 0
  }

  const avgCue = getStageAverage('cue')
  const avgCraving = getStageAverage('craving')
  const avgResponse = getStageAverage('response')
  const avgReward = getStageAverage('reward')

  const categories = [
    {
      ...CATEGORY_MAP.cue,
      diagnosis: step1Content?.cueDiagnosis || CATEGORY_MAP.cue.diagnosis,
      score: avgCue,
    },
    {
      ...CATEGORY_MAP.craving,
      diagnosis: step1Content?.cravingDiagnosis || CATEGORY_MAP.craving.diagnosis,
      score: avgCraving,
    },
    {
      ...CATEGORY_MAP.response,
      diagnosis: step1Content?.responseDiagnosis || CATEGORY_MAP.response.diagnosis,
      score: avgResponse,
    },
    {
      ...CATEGORY_MAP.reward,
      diagnosis: step1Content?.rewardDiagnosis || CATEGORY_MAP.reward.diagnosis,
      score: avgReward,
    },
  ]

  // Tìm nhóm có điểm cao nhất
  let topCategory = categories[0]
  for (let i = 1; i < categories.length; i++) {
    if (categories[i].score > topCategory.score) {
      topCategory = categories[i]
    }
  }

  // H4: Chỉ hiện thẻ số liệu khi có nguồn
  const statCards = diagnose?.stats
    ? diagnose.stats.filter((c) => Boolean(c.sourceLabel?.trim()))
    : []

  return (
    <div className="space-y-8">
      {/* 1. Hộp mở đầu */}
      <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-lavender-mist shadow-soft text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-deep-navy via-bright-magenta to-accent-pink" />
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-soft-pink text-bright-magenta text-xs font-semibold uppercase tracking-wider mb-2 font-ui">
          <span>{vi.dp01.stage1Badge}</span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl text-deep-navy uppercase tracking-wide mb-3">
          {step1Content?.title || vi.dp01.stage1Title}
        </h2>
        <blockquote className="font-quote italic text-lg sm:text-xl md:text-2xl text-deep-navy max-w-2xl mx-auto leading-relaxed">
          &ldquo;{step1Content?.quoteText || vi.dp01.stage1QuoteText}&rdquo;
        </blockquote>
        <p className="mt-2 font-ui font-semibold text-xs sm:text-sm text-bright-magenta tracking-wide">
          {step1Content?.quoteAuthor || vi.dp01.stage1QuoteAuthor}
        </p>
      </div>

      {/* Lead-in Text */}
      <p className="text-center text-deep-navy/60 text-sm md:text-base max-w-2xl mx-auto mt-4 mb-8 leading-relaxed font-ui">
        {step1Content?.leadIn || vi.dp01.stage1LeadIn}
      </p>

      {/* 2. Thẻ số liệu (chỉ hiện khi có nguồn per H4) */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((item, idx) => {
            const isHighlight = idx === 0
            return (
              <div
                key={idx}
                className={`p-5 rounded-[20px] border shadow-soft flex flex-col justify-between transition-all ${
                  isHighlight
                    ? 'bg-gradient-to-b from-soft-pink/60 to-white border-bright-magenta/35 ring-1 ring-bright-magenta/20 shadow-soft-md'
                    : 'bg-white border-lavender-mist/90'
                }`}
              >
                <div>
                  <div className="mb-2">
                    <span
                      className={`font-display text-3xl sm:text-4xl tracking-tight ${
                        isHighlight ? 'text-bright-magenta font-black' : 'text-deep-navy'
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-deep-navy/80 leading-relaxed font-ui">
                    {item.label}
                  </p>
                </div>
                {item.sourceLabel && (
                  <p className="text-[10px] text-deep-navy/70 font-ui mt-3 pt-2 border-t border-lavender-mist/60">
                    {item.sourceLabel}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 3. Khối khảo sát 8 câu */}
      <div className="bg-white rounded-[20px] border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-6">
        <div className="border-b border-lavender-mist/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-bright-magenta" />
                <h2 className="font-ui font-bold text-lg text-deep-navy">
                  {step1Content?.surveyTitle || vi.dp01.stage1SurveyTitle}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-deep-navy/60 font-ui mt-0.5">
                {step1Content?.surveyDesc || vi.dp01.stage1SurveyDesc}
              </p>
            </div>

            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-soft-pink text-bright-magenta border border-bright-magenta/20 self-start sm:self-auto font-ui">
              {answeredCount}/{questions.length}
            </div>
          </div>
        </div>

        {/* List câu hỏi */}
        <div className="space-y-4">
          {questions.map((q) => {
            const currentScore = answers[q.id]
            const hasAnswered = typeof currentScore === 'number' && currentScore > 0

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition-all ${
                  hasAnswered
                    ? 'bg-warm-ivory/50 border-lavender-mist'
                    : 'bg-white border-lavender-mist/60 hover:border-bright-magenta/40'
                }`}
              >
                <div className="flex items-start gap-2.5 mb-3">
                  <span className="w-5 h-5 rounded-full bg-soft-pink text-bright-magenta flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 font-ui">
                    {q.id}
                  </span>
                  <p
                    id={`diagnose-q-${q.id}`}
                    className="font-ui text-xs sm:text-sm text-deep-navy font-medium leading-relaxed"
                  >
                    {q.text}
                  </p>
                </div>

                {/* Dãy 5 nút: số 1, 2, 3, 4, 5 (bấm lại thì bỏ chọn theo H3) */}
                <div
                  role="group"
                  aria-labelledby={`diagnose-q-${q.id}`}
                  className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 max-w-md"
                >
                  {[1, 2, 3, 4, 5].map((score) => {
                    const isSelected = hasAnswered && currentScore === score
                    return (
                      <button
                        key={score}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onAnswerChange(q.id, isSelected ? 0 : score)}
                        className={`flex items-center justify-center py-2 rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-bright-magenta text-white border-bright-magenta shadow-sm font-bold'
                            : 'bg-white text-deep-navy/70 border-lavender-mist/80 hover:border-bright-magenta/50 hover:bg-soft-pink/30'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-bold font-ui">{score}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Dòng chú giải 2 đầu dưới câu 1 */}
                {q.id === 1 && (
                  <div className="flex justify-between text-xs text-deep-navy/70 mt-1.5 max-w-md px-0.5 font-ui">
                    <span>{vi.dp01.scaleMin}</span>
                    <span>{vi.dp01.scaleMax}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Khi chưa trả lời đủ: dòng chữ nghiêng */}
        {!isAllAnswered && (
          <p className="text-xs sm:text-sm italic text-deep-navy/60 font-ui text-center pt-2">
            {vi.dp01.unansweredNotice(answeredCount, questions.length)}
          </p>
        )}
      </div>

      {/* 4. Khối Kết quả Chẩn đoán */}
      {isAllAnswered && (
        <div className="space-y-4">
          <div
            className={`border-2 rounded-[20px] p-5 sm:p-7 bg-white shadow-soft space-y-5 ${topCategory.borderColor}`}
          >
            <p className="text-xs sm:text-sm text-deep-navy/70 font-ui">
              {vi.dp01.topCategoryNotice}
            </p>

            <h3
              className={`font-display text-2xl sm:text-3xl font-black uppercase tracking-wide ${topCategory.textColor}`}
            >
              {topCategory.name}
            </h3>

            <p className="text-xs sm:text-sm text-deep-navy/85 font-ui leading-relaxed bg-warm-ivory/60 p-3.5 rounded-2xl border border-lavender-mist/60">
              {topCategory.diagnosis}
            </p>

            {/* Biểu đồ 4 thanh ngang theo thang /5 */}
            <div className="space-y-3.5 pt-2 font-ui">
              {[
                { id: 'cue', label: vi.dp01.cueName, score: avgCue, color: 'bg-[#3b4991]' },
                {
                  id: 'craving',
                  label: vi.dp01.cravingName,
                  score: avgCraving,
                  color: 'bg-[#a8325d]',
                },
                {
                  id: 'response',
                  label: vi.dp01.responseName,
                  score: avgResponse,
                  color: 'bg-[#b87614]',
                },
                {
                  id: 'reward',
                  label: vi.dp01.rewardName,
                  score: avgReward,
                  color: 'bg-[#23684a]',
                },
              ].map((item, idx) => {
                const percent = Math.min(100, Math.max(0, (item.score / 5) * 100))
                const isWeakest = item.id === topCategory.id

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between text-xs sm:text-sm transition-opacity duration-200 ${
                      isWeakest ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div className="w-44 sm:w-52 flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`font-semibold ${
                          isWeakest ? 'text-deep-navy font-bold text-sm' : 'text-deep-navy/80'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    <div className="flex-1 mx-3 sm:mx-4 h-3 bg-lavender-mist/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${item.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <span
                      className={`w-12 font-bold text-right flex-shrink-0 ${
                        isWeakest ? 'text-deep-navy text-sm font-black' : 'text-deep-navy/70'
                      }`}
                    >
                      {item.score.toFixed(1)}/5
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-deep-navy/70 font-ui italic pt-2 border-t border-lavender-mist/60">
              {vi.dp01.scoreHint}
            </p>
          </div>

          {/* Hộp dẫn dắt */}
          <div className="p-5 sm:p-6 rounded-[20px] bg-soft-pink/60 border border-bright-magenta/25 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-deep-navy/85 font-ui leading-relaxed">
              <strong className="text-deep-navy font-bold">{vi.dp01.step1NextLeadInBold}</strong>{' '}
              {vi.dp01.step1NextLeadIn}
            </p>

            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white text-xs sm:text-sm font-ui font-semibold shadow-soft hover:shadow-soft-md transition-all active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <span>{vi.dp01.nextStep1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
