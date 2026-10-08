'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import { submitDiagnosticAction } from '@/lib/forms/actions'
import type { PublicDiagnosticQuestion, DiagnosticResultData } from '@/lib/diagnostic.server'

const STORAGE_KEY = 'tdcx_diagnostic_answers'

export interface DiagnosticQuizClientProps {
  questions: PublicDiagnosticQuestion[]
}

export function DiagnosticQuizClient({ questions }: DiagnosticQuizClientProps) {
  // Trạng thái câu trả lời: Map questionId -> score (1..4)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showEmailGate, setShowEmailGate] = useState(false)
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [honeypot, setHoneypot] = useState('')

  // Trạng thái nộp và kết quả
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<DiagnosticResultData | null>(null)

  const trackedRef = useRef(false)

  // 1. Phục hồi câu trả lời từ sessionStorage khi khởi tạo
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (typeof parsed === 'object' && parsed !== null) {
            setAnswers(parsed)
            // Tìm câu đầu tiên chưa trả lời
            const firstUnanswered = questions.findIndex((q) => typeof parsed[q.id] !== 'number')
            if (firstUnanswered !== -1) {
              setCurrentIndex(firstUnanswered)
            } else if (questions.length > 0) {
              // Đã trả lời hết -> chuyển sang câu cuối
              setCurrentIndex(questions.length - 1)
            }
          }
        }
      } catch {
        // Bỏ qua lỗi sessionStorage nếu bị tắt
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [questions])

  // 2. Ghi nhận analytics khi có kết quả
  useEffect(() => {
    if (result && !trackedRef.current) {
      trackedRef.current = true
      track('diagnostic_completed', { stage: result.topStage })
    }
  }, [result])

  // Nếu không có câu hỏi nào trong CMS
  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <SectionHeader
          seriesLabel={vi.diagnostic.badge}
          titleLine1={vi.diagnostic.titleLine1}
          titleLine2={vi.diagnostic.titleLine2}
          emotionLine={vi.diagnostic.emotionalLine}
          align="center"
          as="h1"
        />
        <div className="mt-8 rounded-2xl border border-deep-navy/10 bg-soft-pink/30 p-8">
          <p className="font-ui text-base text-deep-navy/80">
            {vi.diagnostic.result.noSuggestions}
          </p>
        </div>
      </div>
    )
  }

  // Lưu câu trả lời vào state & sessionStorage
  const handleSelectScore = (questionId: number, score: number) => {
    const updated = { ...answers, [questionId]: score }
    setAnswers(updated)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  // Chuyển sang câu tiếp theo hoặc mở cổng email
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      window.scrollTo({ top: 100, behavior: 'smooth' })
    } else {
      setShowEmailGate(true)
      window.scrollTo({ top: 100, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    if (showEmailGate) {
      setShowEmailGate(false)
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      window.scrollTo({ top: 100, behavior: 'smooth' })
    }
  }

  // Gửi nộp bài chẩn đoán
  const handleSubmit = async (withEmail: boolean) => {
    setGeneralError(null)
    setFieldErrors({})

    const answerArray = Object.entries(answers).map(([qId, sc]) => ({
      questionId: Number(qId),
      score: sc,
    }))

    if (answerArray.length === 0) {
      setGeneralError(vi.diagnostic.errors.emptyAnswers)
      return
    }

    if (withEmail) {
      const cleanEmail = email.trim()
      if (!cleanEmail) {
        setFieldErrors({ email: vi.forms.validation.emailRequired })
        return
      }
      if (!consent) {
        setFieldErrors({ consent: vi.forms.validation.consentRequired })
        return
      }
    }

    setIsSubmitting(true)

    try {
      const payloadData: Record<string, unknown> = {
        answers: answerArray,
        honeypot: honeypot || undefined,
      }

      if (withEmail && email.trim()) {
        payloadData.email = email.trim()
        payloadData.consent = consent
        payloadData.turnstileToken = turnstileToken || undefined
      }

      const res = await submitDiagnosticAction(payloadData)

      if (res.success && res.data) {
        setResult(res.data)
        try {
          sessionStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
      } else {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors)
        }
        setGeneralError(res.error || vi.diagnostic.errors.submitFailed)
      }
    } catch {
      setGeneralError(vi.diagnostic.errors.submitFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetQuiz = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setAnswers({})
    setCurrentIndex(0)
    setShowEmailGate(false)
    setEmail('')
    setConsent(false)
    setResult(null)
    setGeneralError(null)
    setFieldErrors({})
    trackedRef.current = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // =========================================================================
  // VIEW 3: TRANG HIỂN THỊ KẾT QUẢ CHẨN ĐOÁN
  // =========================================================================
  if (result) {
    const topStageInfo = vi.diagnostic.stages[result.topStage]
    const secondaryStageInfo = result.secondaryStage
      ? vi.diagnostic.stages[result.secondaryStage]
      : null

    return (
      <article className="w-full bg-warm-ivory py-12 sm:py-16 lg:py-20 min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header kết quả */}
          <SectionHeader
            seriesLabel={vi.diagnostic.badge}
            titleLine1="Kết quả chẩn đoán"
            titleLine2="thói quen của bạn"
            emotionLine={vi.diagnostic.emotionalLine}
            align="center"
            as="h1"
          />

          {/* Card giai đoạn nổi bật nhất */}
          <div className="rounded-3xl border border-deep-navy/15 bg-white p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <span className="inline-block px-3.5 py-1 rounded-full bg-bright-magenta text-white font-ui text-xs sm:text-sm font-bold uppercase tracking-wider">
                {vi.diagnostic.result.primaryHeading}
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-deep-navy uppercase tracking-tight">
              {topStageInfo?.title ?? result.topStage}
            </h2>

            <p className="font-ui text-base sm:text-lg text-deep-navy/85 leading-relaxed">
              {topStageInfo?.desc}
            </p>

            {/* Bảng điểm tổng quan 4 giai đoạn */}
            <div className="pt-4 border-t border-deep-navy/10">
              <h3 className="font-ui text-xs sm:text-sm font-bold text-deep-navy/60 uppercase tracking-wider mb-3">
                Tổng điểm 4 giai đoạn (Thang tối đa 16 điểm)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['cue', 'craving', 'response', 'reward'] as const).map((stg) => {
                  const isTop = stg === result.topStage
                  const isSec = stg === result.secondaryStage
                  const score = result.scores[stg] ?? 0
                  return (
                    <div
                      key={stg}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isTop
                          ? 'border-bright-magenta bg-soft-pink/40 shadow-xs'
                          : isSec
                            ? 'border-accent-pink/40 bg-butter-cream/30'
                            : 'border-deep-navy/10 bg-warm-ivory/50'
                      }`}
                    >
                      <div className="font-ui text-xs font-semibold text-deep-navy/70">
                        {vi.diagnostic.stages[stg].short}
                      </div>
                      <div className="font-display text-2xl text-deep-navy mt-1">{score}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ghi chú giai đoạn thứ 2 nếu chênh <= 1 điểm */}
            {secondaryStageInfo && (
              <div className="rounded-2xl border border-accent-pink/25 bg-butter-cream/40 p-4 sm:p-5 text-sm font-ui text-deep-navy/90 leading-relaxed">
                {vi.diagnostic.secondaryNotice(secondaryStageInfo.name)}
              </div>
            )}
          </div>

          {/* Phần gợi ý thực hành từ CMS */}
          <section className="space-y-6">
            <h3 className="font-display text-2xl sm:text-3xl text-deep-navy uppercase tracking-tight">
              {vi.diagnostic.result.suggestionsHeading}
            </h3>

            {result.suggestions.length > 0 ? (
              <div className="space-y-6">
                {result.suggestions.map((item, idx) => (
                  <div
                    key={item.questionId || idx}
                    className="rounded-2xl border border-deep-navy/10 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                  >
                    {item.statement && (
                      <div className="font-ui font-semibold text-base sm:text-lg text-deep-navy border-b border-deep-navy/10 pb-3">
                        <span className="text-bright-magenta mr-2 font-bold">{idx + 1}.</span>
                        {item.statement}
                      </div>
                    )}
                    {item.suggestion && (
                      <div className="font-ui text-base text-deep-navy/85 leading-relaxed space-y-3">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <RichText data={item.suggestion as any} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-deep-navy/10 bg-soft-pink/30 p-6 text-center">
                <p className="font-ui text-base text-deep-navy/80">
                  {vi.diagnostic.result.noSuggestions}
                </p>
              </div>
            )}
          </section>

          {/* CTA dẫn đến Growth Mirror (Tạm thời theo spec T1-14) */}
          <section className="rounded-3xl border border-deep-navy/15 bg-lavender-mist/40 p-8 sm:p-12 text-center space-y-6">
            <h3 className="font-display text-2xl sm:text-3xl text-deep-navy uppercase tracking-tight">
              {vi.diagnostic.result.ctaHeading}
            </h3>
            <p className="font-ui text-base sm:text-lg text-deep-navy/80 max-w-xl mx-auto leading-relaxed">
              {vi.diagnostic.result.ctaSubheading}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button href={result.ctaHref} variant="primary" size="lg">
                {vi.diagnostic.result.ctaButton}
              </Button>
              <Button variant="ghost" size="md" onClick={handleResetQuiz} type="button">
                {vi.diagnostic.result.retakeButton}
              </Button>
            </div>
          </section>
        </div>
      </article>
    )
  }

  // =========================================================================
  // VIEW 2: CỔNG NHẬP EMAIL (TÙY CHỌN) TRƯỚC KHI XEM KẾT QUẢ
  // =========================================================================
  if (showEmailGate) {
    return (
      <section className="w-full bg-warm-ivory py-12 sm:py-16 lg:py-20 min-h-[70vh]">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-deep-navy/15 bg-white p-6 sm:p-10 shadow-sm space-y-8">
            <div className="text-center space-y-3">
              <span className="font-ui text-xs font-bold uppercase tracking-widest text-bright-magenta">
                Hoàn thành bài test
              </span>
              <h1 className="font-display text-2xl sm:text-3xl text-deep-navy uppercase tracking-tight">
                {vi.diagnostic.emailGate.heading}
              </h1>
              <p className="font-ui text-sm sm:text-base text-deep-navy/80 leading-relaxed">
                {vi.diagnostic.emailGate.subheading}
              </p>
            </div>

            {generalError && (
              <div
                role="alert"
                className="rounded-xl border border-accent-pink/30 bg-soft-pink/50 p-4 font-ui text-sm text-deep-navy"
              >
                {generalError}
              </div>
            )}

            {/* Honeypot field (chống bot) */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="diag-hp">Không điền ô này</label>
              <input
                id="diag-hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit(true)
              }}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="diagnostic-email"
                  className="block font-ui text-sm font-semibold text-deep-navy mb-2"
                >
                  {vi.diagnostic.emailGate.emailLabel}
                </label>
                <input
                  id="diagnostic-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={vi.diagnostic.emailGate.emailPlaceholder}
                  className={`w-full rounded-xl border bg-warm-ivory/50 px-4 py-3 font-ui text-base text-deep-navy placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-deep-navy ${
                    fieldErrors.email ? 'border-accent-pink' : 'border-deep-navy/20'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 font-ui text-xs text-bright-magenta">{fieldErrors.email}</p>
                )}
              </div>

              {/* Checkbox đồng ý (bắt buộc nếu nhập email) */}
              {email.trim().length > 0 && (
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-deep-navy/30 text-bright-magenta focus:ring-bright-magenta cursor-pointer"
                    />
                    <span className="font-ui text-xs sm:text-sm text-deep-navy/80 leading-normal">
                      {vi.diagnostic.emailGate.consentLabel}{' '}
                      <Link
                        href="/chinh-sach-bao-mat"
                        target="_blank"
                        className="font-semibold text-bright-magenta underline hover:text-deep-navy"
                      >
                        {vi.diagnostic.emailGate.privacyPolicy}
                      </Link>
                      .
                    </span>
                  </label>
                  {fieldErrors.consent && (
                    <p className="font-ui text-xs text-bright-magenta">{fieldErrors.consent}</p>
                  )}
                </div>
              )}

              {/* Cloudflare Turnstile Captcha */}
              {email.trim().length > 0 && (
                <div className="flex justify-center pt-2">
                  <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />
                </div>
              )}

              <div className="pt-2 space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  {vi.diagnostic.emailGate.submitButton}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(false)}
                >
                  {vi.diagnostic.emailGate.skipButton}
                </Button>
              </div>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handlePrev}
                className="font-ui text-xs text-deep-navy/60 hover:text-bright-magenta underline cursor-pointer"
              >
                ← Quay lại câu hỏi trước
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // =========================================================================
  // VIEW 1: LÀM BÀI TEST CHẨN ĐOÁN (TỪNG CÂU MỘT)
  // =========================================================================
  const currentQuestion = questions[currentIndex]
  const currentScore = answers[currentQuestion.id]
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100)

  return (
    <main className="w-full bg-warm-ivory py-10 sm:py-14 lg:py-16 min-h-[75vh]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header giới thiệu */}
        <SectionHeader
          seriesLabel={vi.diagnostic.badge}
          titleLine1={vi.diagnostic.titleLine1}
          titleLine2={vi.diagnostic.titleLine2}
          emotionLine={vi.diagnostic.emotionalLine}
          align="center"
          as="h1"
        />

        {/* Thanh tiến độ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-ui text-xs sm:text-sm font-semibold text-deep-navy/70">
            <span>{vi.diagnostic.questionCounter(currentIndex + 1, questions.length)}</span>
            <span>{progressPercent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-2.5 bg-deep-navy/10 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-bright-magenta transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Card câu hỏi hiện tại */}
        <div className="rounded-3xl border border-deep-navy/15 bg-white p-6 sm:p-10 shadow-sm space-y-8">
          <fieldset className="space-y-6">
            <legend className="sr-only">
              {vi.diagnostic.questionCounter(currentIndex + 1, questions.length)}
            </legend>

            {/* Nội dung câu hỏi */}
            <div className="min-h-[70px] flex items-center">
              <h2 className="font-ui font-bold text-lg sm:text-xl lg:text-2xl text-deep-navy leading-snug">
                {currentQuestion.statement}
              </h2>
            </div>

            {/* Thang đo 1–4 (Radio Group) */}
            <div className="space-y-3" role="radiogroup" aria-label="Mức độ đúng với bạn">
              {[1, 2, 3, 4].map((score) => {
                const isSelected = currentScore === score
                const labelText = vi.diagnostic.scale[score as keyof typeof vi.diagnostic.scale]
                return (
                  <label
                    key={score}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer min-h-[52px] select-none ${
                      isSelected
                        ? 'border-bright-magenta bg-soft-pink/40 shadow-xs'
                        : 'border-deep-navy/15 bg-warm-ivory/30 hover:bg-lavender-mist/20 hover:border-deep-navy/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={score}
                      checked={isSelected}
                      onChange={() => handleSelectScore(currentQuestion.id, score)}
                      className="h-5 w-5 border-deep-navy/30 text-bright-magenta focus:ring-bright-magenta cursor-pointer"
                    />
                    <span
                      className={`font-ui text-sm sm:text-base leading-normal ${
                        isSelected ? 'font-bold text-deep-navy' : 'font-medium text-deep-navy/85'
                      }`}
                    >
                      {labelText}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* Các nút điều hướng */}
          <div className="flex items-center justify-between pt-4 border-t border-deep-navy/10 gap-4">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={currentIndex === 0}
              onClick={handlePrev}
            >
              {vi.diagnostic.prevButton}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={typeof currentScore !== 'number'}
              onClick={handleNext}
            >
              {currentIndex === questions.length - 1
                ? vi.diagnostic.finishButton
                : vi.diagnostic.nextButton}
            </Button>
          </div>
        </div>

        {/* Thông báo thời gian làm bài */}
        <p className="text-center font-ui text-xs text-deep-navy/60">
          {vi.diagnostic.durationNotice}
        </p>
      </div>
    </main>
  )
}
