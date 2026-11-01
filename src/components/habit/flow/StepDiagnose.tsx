'use client'

import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { isRichTextEmpty } from '@/lib/legal'
import { vi } from '@/lib/i18n/vi'
import { scoreFlowDiagnose } from '@/lib/habit/flow-content'
import type { CleanHabitDiagnose } from '@/lib/habit/journey-content.server'

type RichTextData = React.ComponentProps<typeof RichText>['data']

const SCALE_POINTS = [1, 2, 3, 4, 5] as const

export interface StepDiagnoseProps {
  diagnose?: CleanHabitDiagnose | null
  answers: (number | null)[]
  onSelectAnswer: (questionIndex: number, score: number) => void
  onSkip: () => void
}

export function StepDiagnose({ diagnose, answers, onSelectAnswer, onSkip }: StepDiagnoseProps) {
  const rawTitle = diagnose?.title?.trim() || ''
  const hasCmsTitle = rawTitle.length > 0
  const hasCmsIntro = Boolean(diagnose?.intro && !isRichTextEmpty(diagnose.intro))
  const quote = diagnose?.quote ?? null
  const stats = diagnose?.stats ?? []
  const questions = React.useMemo(() => diagnose?.questions ?? [], [diagnose?.questions])

  let titleLine1 = rawTitle
  let titleLine2: string | undefined = undefined
  if (rawTitle.includes('|')) {
    const parts = rawTitle.split('|')
    titleLine1 = parts[0]?.trim() || ''
    titleLine2 = parts.slice(1).join('|').trim() || undefined
  }

  const scoreResult = React.useMemo(
    () => scoreFlowDiagnose(answers, questions),
    [answers, questions],
  )

  const topStage = scoreResult.topStage
  const matchedResult = topStage ? diagnose?.results?.find((r) => r.stage === topStage) : null
  const stageFallbackName = topStage
    ? vi.diagnostic.stages[topStage]?.name || vi.hb17.result.stageNames[topStage] || topStage
    : ''
  const topStageTitle = topStage ? matchedResult?.title?.trim() || stageFallbackName : ''

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

        {stats.length > 0 && (
          <div data-testid="diagnose-stats" className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {stats.map((st, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white border border-lavender-mist p-4 space-y-1 shadow-soft"
              >
                <div className="font-display text-2xl sm:text-3xl text-bright-magenta">
                  {st.value}
                </div>
                <p className="font-ui text-xs sm:text-sm text-deep-navy font-semibold">
                  {st.label}
                </p>
                <div className="font-ui text-[11px] text-deep-navy/70 pt-1">
                  <span className="font-medium">{vi.hb17.sourcePrefix}: </span>
                  {st.sourceUrl ? (
                    <a
                      href={st.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-bright-magenta focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bright-magenta rounded"
                    >
                      {st.sourceLabel}
                    </a>
                  ) : (
                    <span>{st.sourceLabel}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Khảo sát: chỉ hiện khi CMS có câu hỏi */}
      {questions.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-lavender-mist">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="font-ui font-bold text-base sm:text-lg text-deep-navy">
              {vi.hb17.surveyHeading(questions.length)}
            </h3>
            <div className="flex items-center gap-2">
              <span
                data-testid="diagnose-counter"
                aria-label={vi.hb17.surveyCounterAria(
                  scoreResult.answeredCount,
                  scoreResult.totalCount,
                )}
                className="inline-flex items-center px-3 py-1 rounded-full bg-lavender-mist text-deep-navy font-ui text-xs font-bold"
              >
                {vi.hb17.surveyCounter(scoreResult.answeredCount, scoreResult.totalCount)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((question, idx) => {
              const selectedScore = answers[idx]
              const legendId = `diagnose-q-${idx}-legend`

              return (
                <fieldset
                  key={idx}
                  role="radiogroup"
                  aria-labelledby={legendId}
                  className="rounded-2xl border border-lavender-mist bg-white p-4 sm:p-5 space-y-3"
                >
                  <legend
                    id={legendId}
                    className="font-ui font-semibold text-sm sm:text-base text-deep-navy mb-2"
                  >
                    <span className="text-bright-magenta font-bold mr-1.5">{idx + 1}.</span>
                    {question.statement}
                  </legend>

                  <div className="flex items-center justify-between font-ui text-xs text-deep-navy/70">
                    <span>1 · {diagnose?.scaleMinLabel || vi.hb17.scaleMinLabel}</span>
                    <span>5 · {diagnose?.scaleMaxLabel || vi.hb17.scaleMaxLabel}</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {SCALE_POINTS.map((scoreVal) => {
                      const isSelected = selectedScore === scoreVal
                      const scoreLabel = vi.hb17.scaleLabels[scoreVal]
                      return (
                        <label
                          key={scoreVal}
                          className={`relative flex items-center justify-center min-h-[44px] rounded-xl border font-ui text-sm sm:text-base cursor-pointer select-none transition-colors focus-within:ring-2 focus-within:ring-bright-magenta focus-within:ring-offset-1 ${
                            isSelected
                              ? 'bg-deep-navy text-white border-deep-navy font-bold shadow-soft'
                              : 'bg-white text-deep-navy border-lavender-mist hover:bg-soft-pink/50 font-semibold'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`diagnose-question-${idx}`}
                            value={scoreVal}
                            checked={isSelected}
                            onChange={() => onSelectAnswer(idx, scoreVal)}
                            aria-label={vi.hb17.scaleOptionAria(scoreVal, scoreLabel)}
                            className="sr-only"
                          />
                          <span>{scoreVal}</span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              )
            })}
          </div>

          {/* 3. Khối kết quả nút thắt: hiện ngay khi trả lời đủ */}
          {scoreResult.isComplete && topStage && (
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

              {matchedResult?.suggestion && (
                <p className="font-ui text-sm sm:text-base text-deep-navy/85 leading-relaxed">
                  {matchedResult.suggestion}
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
