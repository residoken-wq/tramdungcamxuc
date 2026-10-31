'use client'

import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { isRichTextEmpty } from '@/lib/legal'
import { vi } from '@/lib/i18n/vi'
import {
  DIAGNOSTIC_SCALE_MIN,
  DIAGNOSTIC_SCALE_MAX,
  scoreDiagnostic,
  type DiagnosticScoreResult,
} from '@/lib/diagnostic'
import type { CleanHabitDiagnose } from '@/lib/habit/journey-content.server'
import { getDiagnoseQuestionKey } from './draft'

type RichTextData = React.ComponentProps<typeof RichText>['data']

const SCALE_POINTS = Array.from(
  { length: DIAGNOSTIC_SCALE_MAX - DIAGNOSTIC_SCALE_MIN + 1 },
  (_, i) => DIAGNOSTIC_SCALE_MIN + i,
) as (1 | 2 | 3 | 4 | 5)[]

export interface StepDiagnoseProps {
  diagnose?: CleanHabitDiagnose | null
  answers: Record<string, number>
  onSelectAnswer: (questionKey: string, score: number) => void
  onSkip: () => void
}

export function computeStepDiagnoseResult(
  diagnose: CleanHabitDiagnose | null | undefined,
  answers: Record<string, number>,
): DiagnosticScoreResult | null {
  const questions = diagnose?.questions ?? []
  if (questions.length === 0) return null

  for (let i = 0; i < questions.length; i++) {
    const key = getDiagnoseQuestionKey(questions[i]!, i)
    const val = answers[key]
    if (typeof val !== 'number' || val < DIAGNOSTIC_SCALE_MIN || val > DIAGNOSTIC_SCALE_MAX) {
      return null
    }
  }

  const refs = questions.map((q, idx) => ({
    id: idx + 1,
    stage: q.stage,
    statement: q.statement,
    order: idx + 1,
  }))

  const answerList = questions.map((q, idx) => ({
    questionId: idx + 1,
    score: answers[getDiagnoseQuestionKey(q, idx)]!,
  }))

  return scoreDiagnostic(answerList, refs)
}

export function StepDiagnose({ diagnose, answers, onSelectAnswer, onSkip }: StepDiagnoseProps) {
  const rawTitle = diagnose?.title?.trim() || ''
  const hasCmsTitle = rawTitle.length > 0
  const hasCmsIntro = Boolean(diagnose?.intro && !isRichTextEmpty(diagnose.intro))
  const quote = diagnose?.quote ?? null
  const stats = diagnose?.stats ?? []
  const questions = diagnose?.questions ?? []

  let titleLine1 = rawTitle
  let titleLine2: string | undefined = undefined
  if (rawTitle.includes('|')) {
    const parts = rawTitle.split('|')
    titleLine1 = parts[0]?.trim() || ''
    titleLine2 = parts.slice(1).join('|').trim() || undefined
  }

  const answeredCount = questions.reduce((acc, q, idx) => {
    const val = answers[getDiagnoseQuestionKey(q, idx)]
    return typeof val === 'number' && val >= DIAGNOSTIC_SCALE_MIN && val <= DIAGNOSTIC_SCALE_MAX
      ? acc + 1
      : acc
  }, 0)

  const scoreResult = React.useMemo(
    () => computeStepDiagnoseResult(diagnose, answers),
    [diagnose, answers],
  )

  const topStage = scoreResult?.topStage
  const topStageConfig = topStage ? diagnose?.stageResults?.[topStage] : null
  const topStageTitle = topStage
    ? topStageConfig?.title?.trim() ||
      vi.hb17.result.defaultStageTitle(vi.hb17.result.stageNames[topStage])
    : ''
  const hasTopStageRichSuggestion = Boolean(
    topStageConfig?.suggestion && !isRichTextEmpty(topStageConfig.suggestion),
  )
  const topStageNextHint = topStage
    ? topStageConfig?.nextStepHint?.trim() || vi.hb17.result.defaultNextStepHint
    : ''

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Phần mở đầu: tiêu đề + lời mở + câu trích có nguồn + các con số có nguồn */}
      <div className="space-y-4">
        {hasCmsTitle ? (
          <SectionHeader
            titleLine1={titleLine1}
            titleLine2={titleLine2}
            as="h2"
            align="left"
            className="mb-2"
          />
        ) : (
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
              {vi.hb16.steps.diagnose.title}
            </h2>
            {!hasCmsIntro && (
              <p className="text-sm sm:text-base text-deep-navy/80">
                {vi.hb16.steps.diagnose.subtitle}
              </p>
            )}
          </div>
        )}

        {hasCmsIntro && (
          <div
            data-testid="diagnose-intro"
            className="font-ui text-sm sm:text-base text-deep-navy/80 leading-relaxed space-y-2"
          >
            <RichText data={diagnose!.intro as RichTextData} />
          </div>
        )}

        {quote && (
          <blockquote
            data-testid="diagnose-quote"
            className="rounded-2xl bg-lavender-mist/40 border border-lavender-mist p-4 sm:p-5 space-y-2"
          >
            <p className="font-quote italic text-base sm:text-lg text-deep-navy leading-relaxed">
              &ldquo;{quote.text}&rdquo;
            </p>
            <footer className="font-ui text-xs sm:text-sm text-deep-navy/80 font-medium">
              <span>— {quote.author}</span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span className="text-deep-navy/70">
                {vi.hb17.sourcePrefix}:{' '}
                {quote.sourceUrl ? (
                  <a
                    href={quote.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bright-magenta underline hover:text-deep-navy"
                  >
                    {quote.source}
                  </a>
                ) : (
                  <span>{quote.source}</span>
                )}
              </span>
            </footer>
          </blockquote>
        )}

        {stats.length > 0 && (
          <div
            data-testid="diagnose-stats"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          >
            {stats.map((stat, idx) => (
              <div
                key={stat.id || idx}
                className="rounded-2xl bg-soft-pink/40 border border-lavender-mist p-4 sm:p-5"
              >
                <div className="font-display text-2xl sm:text-3xl text-bright-magenta">
                  {stat.value}
                </div>
                <div className="font-ui text-sm sm:text-base font-semibold text-deep-navy mt-1">
                  {stat.label}
                </div>
                <div className="font-ui text-xs text-deep-navy/70 mt-1.5">
                  {vi.hb17.sourcePrefix}:{' '}
                  {stat.sourceUrl ? (
                    <a
                      href={stat.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-bright-magenta underline hover:text-deep-navy"
                    >
                      {stat.source}
                    </a>
                  ) : (
                    <span>{stat.source}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Khảo sát: chỉ hiển thị khi CMS có câu hỏi */}
      {questions.length > 0 && (
        <div className="space-y-5 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-lavender-mist">
            <h3 className="font-ui text-base sm:text-lg font-bold text-deep-navy">
              {vi.hb17.surveyHeading(questions.length)}
            </h3>
            <span
              data-testid="diagnose-counter"
              aria-live="polite"
              aria-label={vi.hb17.surveyCounterAria(answeredCount, questions.length)}
              className="inline-flex items-center px-3 py-1 rounded-full bg-lavender-mist text-deep-navy font-ui text-xs sm:text-sm font-bold"
            >
              {vi.hb17.surveyCounter(answeredCount, questions.length)}
            </span>
          </div>

          <div className="space-y-4">
            {questions.map((question, idx) => {
              const qKey = getDiagnoseQuestionKey(question, idx)
              const selectedScore = answers[qKey]
              const labelId = `diagnose-q-label-${idx}`

              return (
                <div
                  key={qKey}
                  className="rounded-2xl border border-lavender-mist bg-warm-ivory/60 p-4 sm:p-5 space-y-3"
                >
                  <p
                    id={labelId}
                    className="font-ui text-sm sm:text-base font-semibold text-deep-navy leading-relaxed"
                  >
                    <span className="text-bright-magenta font-bold mr-1.5">{idx + 1}.</span>
                    {question.statement}
                  </p>

                  <div className="flex items-center justify-between font-ui text-xs text-deep-navy/70">
                    <span>1 · {vi.hb17.scaleMinLabel}</span>
                    <span>5 · {vi.hb17.scaleMaxLabel}</span>
                  </div>

                  <div
                    role="radiogroup"
                    aria-labelledby={labelId}
                    className="grid grid-cols-5 gap-2"
                  >
                    {SCALE_POINTS.map((score) => {
                      const isSelected = selectedScore === score
                      const scoreLabel = vi.hb17.scaleLabels[score]
                      return (
                        <label
                          key={score}
                          className={`relative flex items-center justify-center min-h-[44px] rounded-xl border font-ui text-sm sm:text-base cursor-pointer select-none transition-colors focus-within:ring-2 focus-within:ring-bright-magenta focus-within:ring-offset-1 ${
                            isSelected
                              ? 'bg-deep-navy text-white border-deep-navy font-bold shadow-soft'
                              : 'bg-white text-deep-navy border-lavender-mist hover:bg-soft-pink/50 font-semibold'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`diagnose-${qKey}`}
                            value={score}
                            checked={isSelected}
                            onChange={() => onSelectAnswer(qKey, score)}
                            aria-label={vi.hb17.scaleOptionAria(score, scoreLabel)}
                            className="sr-only"
                          />
                          <span>{score}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 3. Khối kết quả nút thắt: hiện ngay khi trả lời đủ */}
          {scoreResult && topStage && (
            <div
              data-testid="diagnose-result"
              role="status"
              aria-live="polite"
              className="rounded-2xl border-2 border-bright-magenta bg-soft-pink/35 p-5 sm:p-6 space-y-3 animate-fade-in"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-bright-magenta text-white font-ui text-xs font-bold uppercase tracking-wider">
                  {vi.hb17.result.badge}
                </span>
                <span className="font-ui text-xs sm:text-sm font-semibold text-deep-navy/80">
                  {vi.hb17.result.averageScore(scoreResult.averageScores[topStage].toFixed(1))}
                </span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl text-deep-navy">{topStageTitle}</h3>

              {hasTopStageRichSuggestion ? (
                <div className="font-ui text-sm sm:text-base text-deep-navy/85 leading-relaxed space-y-2">
                  <RichText data={topStageConfig!.suggestion as RichTextData} />
                </div>
              ) : (
                <p className="font-ui text-sm sm:text-base text-deep-navy/85 leading-relaxed">
                  {vi.diagnostic.stages[topStage].desc}
                </p>
              )}

              {topStageNextHint && (
                <div className="pt-2 border-t border-lavender-mist font-ui text-xs sm:text-sm font-semibold text-bright-magenta">
                  {topStageNextHint}
                </div>
              )}

              {scoreResult.secondaryStage && (
                <p
                  data-testid="diagnose-secondary-stage"
                  className="rounded-xl bg-butter-cream/60 border border-butter-cream px-3.5 py-2.5 font-ui text-xs sm:text-sm text-deep-navy"
                >
                  {vi.hb17.result.secondaryNotice(
                    vi.hb17.result.stageNames[scoreResult.secondaryStage],
                  )}
                </p>
              )}
            </div>
          )}

          {/* Link nhỏ bỏ qua phần khám để không chặn khách */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onSkip}
              className="font-ui text-xs sm:text-sm font-semibold text-deep-navy/70 hover:text-bright-magenta underline py-2 px-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta"
            >
              {vi.hb17.skipButton}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
