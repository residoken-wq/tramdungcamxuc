'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import {
  HABIT_LOOP_STORAGE_KEY,
  HABIT_OFFER_PATH,
  HABIT_STAGES,
  formatIdentityStatement,
  flattenChosenTechniques,
  type PublicTechnique,
  type HabitScorecardRating,
} from '@/lib/habit'
import type { HabitStage } from '@/lib/diagnostic'
import type { Weekday } from '@/lib/habit/rhythm'
import type {
  CleanHabitOnePercent,
  CleanHabitDiagnose,
  CleanTitledText,
  CleanHabitStepQuotes,
  CleanHabitLoop,
} from '@/lib/habit/journey-content.server'
import { scoreFlowDiagnose } from '@/lib/habit/flow-content'
import { addVietnamDays, getVietnamYmd } from '@/lib/habit/tracker-stats'
import {
  getDefaultHabitFlowDraft,
  migrateHabitDraft,
  serializeHabitDraftForStorage,
  type HabitFlowDraft,
  type HabitFlowStep,
} from './draft'
import { FlowProgressBar } from './FlowProgressBar'
import { StepDiagnose } from './StepDiagnose'
import { StepOnePercent } from './StepOnePercent'
import { StepMentor } from './StepMentor'
import { StepName } from './StepName'
import { StepLoop } from './StepLoop'
import { StepBoardingPass } from './StepBoardingPass'

export interface HabitFlowProps {
  techniques: PublicTechnique[]
  journeyDays?: number
  onePercent?: CleanHabitOnePercent | null
  onePercentUnknowns?: CleanTitledText[]
  stepQuotes?: CleanHabitStepQuotes
  diagnose?: CleanHabitDiagnose | null
  loop?: CleanHabitLoop | null
  boardingPassCaption?: string | null
  boardingPassIntro?: string | null
  privacyNote?: string | null
}

export function HabitFlow({
  techniques,
  journeyDays = 28,
  onePercent,
  onePercentUnknowns,
  stepQuotes,
  diagnose,
  loop,
  boardingPassCaption,
  boardingPassIntro,
  privacyNote,
}: HabitFlowProps) {
  const startTimeRef = useRef<number | null>(null)
  // Ghi habit_loop_completed đúng 1 lần mỗi lần mở trang (Quay lại → Tiếp tục không ghi lại)
  const completedTrackedRef = useRef(false)
  // Ghi diagnostic_completed đúng 1 lần khi hoàn thành khám (F5 khôi phục không ghi lại)
  const diagnosticTrackedRef = useRef(false)
  // Moving between steps keeps the scroll position, which on phones lands mid-step or in the
  // footer: bring the step card into view and move focus there (skip the first render).
  const stepCardRef = useRef<HTMLDivElement>(null)
  const previousStepRef = useRef<number | null>(null)
  const [draft, setDraft] = useState<HabitFlowDraft>(getDefaultHabitFlowDraft())
  const [isLoaded, setIsLoaded] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [zaloGroupUrl, setZaloGroupUrl] = useState<string>('')
  const [trackerDestination, setTrackerDestination] = useState<string>('/habit/tracker')
  const [honeypot, setHoneypot] = useState('')

  const selectedTechniqueIds = React.useMemo(() => {
    const ids: number[] = []
    for (const stg of HABIT_STAGES) {
      const list = draft.chosenTechniques[stg] || []
      for (const item of list) {
        ids.push(item.techniqueId)
      }
    }
    return ids
  }, [draft.chosenTechniques])

  const questions = React.useMemo(() => diagnose?.questions ?? [], [diagnose?.questions])
  const flowScore = React.useMemo(
    () => scoreFlowDiagnose(draft.diagnoseAnswers ?? [], questions),
    [draft.diagnoseAnswers, questions],
  )

  // 1. Khôi phục dữ liệu từ localStorage (chuyển nháp v1 -> v2 nếu cần)
  useEffect(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
    }
    const knownIds = new Set((techniques || []).map((t) => t.id))
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(HABIT_LOOP_STORAGE_KEY)
        if (stored) {
          const parsed: unknown = JSON.parse(stored)
          const migrated = migrateHabitDraft(parsed, knownIds, diagnose?.questions?.length)
          setDraft(migrated)

          // Nếu nháp đã trả lời đủ hết câu hỏi từ trước (F5 khôi phục), đánh dấu đã track để không gửi lại
          if (questions.length > 0 && Array.isArray(migrated.diagnoseAnswers)) {
            const restoredScore = scoreFlowDiagnose(migrated.diagnoseAnswers, questions)
            if (restoredScore.isComplete) {
              diagnosticTrackedRef.current = true
            }
          }
        }
      } catch {
        // Bỏ qua nếu localStorage bị tắt hoặc lỗi parse
      } finally {
        setIsLoaded(true)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [techniques, diagnose?.questions?.length, questions])

  // Analytics: gửi diagnostic_completed đúng 1 lần khi hoàn thành khám (không gửi khi F5 khôi phục)
  useEffect(() => {
    if (!isLoaded) return
    if (flowScore.isComplete && flowScore.topStage && !diagnosticTrackedRef.current) {
      diagnosticTrackedRef.current = true
      track('diagnostic_completed', {
        stage: flowScore.topStage,
        totalQuestions: questions.length,
      })
    }
  }, [flowScore.isComplete, flowScore.topStage, isLoaded, questions.length])

  // 2. Tự động lưu nháp v2 vào localStorage mỗi khi thay đổi (T2-03: không lưu consent, name, email)
  useEffect(() => {
    if (!isLoaded || submitSuccess) return
    try {
      localStorage.setItem(HABIT_LOOP_STORAGE_KEY, serializeHabitDraftForStorage(draft))
    } catch {
      // QuotaExceeded hoặc Private mode
    }
  }, [draft, isLoaded, submitSuccess])

  const handleActionChange = (val: string) => {
    setDraft((prev) => {
      const next = { ...prev, actionText: val }
      next.identityStatement = formatIdentityStatement(val, prev.personText)
      return next
    })
    setStepError(null)
  }

  const handlePersonChange = (val: string) => {
    setDraft((prev) => {
      const next = { ...prev, personText: val }
      next.identityStatement = formatIdentityStatement(prev.actionText, val)
      return next
    })
    setStepError(null)
  }

  // Quản lý Bảng điểm thói quen (Bước 3: Tìm Mentor)
  const handleAddHabit = (text: string, rating: HabitScorecardRating) => {
    setDraft((prev) => ({
      ...prev,
      scorecard: [...prev.scorecard, { habit: text, rating }],
    }))
    setStepError(null)
  }

  const handleUpdateTime = (index: number, timeVal: string) => {
    setDraft((prev) => ({
      ...prev,
      scorecard: prev.scorecard.map((item, i) =>
        i === index ? { ...item, time: timeVal.trim() || undefined } : item,
      ),
    }))
  }

  const handleSelectAnchor = (habitText: string) => {
    setDraft((prev) => ({
      ...prev,
      anchorHabit: prev.anchorHabit === habitText ? '' : habitText,
    }))
  }

  const handleRemoveHabit = (index: number) => {
    setDraft((prev) => {
      const removed = prev.scorecard[index]
      return {
        ...prev,
        scorecard: prev.scorecard.filter((_, i) => i !== index),
        anchorHabit: removed && prev.anchorHabit === removed.habit ? '' : prev.anchorHabit,
      }
    })
  }

  const handleUpdateRating = (index: number, rating: HabitScorecardRating) => {
    setDraft((prev) => {
      const item = prev.scorecard[index]
      const unselectAnchor = item && prev.anchorHabit === item.habit && rating !== 'good'
      return {
        ...prev,
        scorecard: prev.scorecard.map((s, i) => (i === index ? { ...s, rating } : s)),
        anchorHabit: unselectAnchor ? '' : prev.anchorHabit,
      }
    })
  }

  // Quản lý kỹ thuật (Bước 5: Vòng lặp)
  const handleToggleTechnique = (stage: HabitStage, techId: number, defaultName: string) => {
    setStepError(null)
    setDraft((prev) => {
      const currentList = prev.chosenTechniques[stage] || []
      const exists = currentList.find((item) => item.techniqueId === techId)

      if (exists) {
        return {
          ...prev,
          chosenTechniques: {
            ...prev.chosenTechniques,
            [stage]: currentList.filter((item) => item.techniqueId !== techId),
          },
        }
      }

      if (currentList.length >= 2) {
        setStepError(vi.habit.wizard.errors.techniquesTooMany)
        return prev
      }

      return {
        ...prev,
        chosenTechniques: {
          ...prev.chosenTechniques,
          [stage]: [...currentList, { techniqueId: techId, action: defaultName }],
        },
      }
    })
  }

  const handleUpdateTechniqueAction = (stage: HabitStage, techId: number, action: string) => {
    setDraft((prev) => ({
      ...prev,
      chosenTechniques: {
        ...prev.chosenTechniques,
        [stage]: prev.chosenTechniques[stage].map((item) =>
          item.techniqueId === techId ? { ...item, action } : item,
        ),
      },
    }))
  }

  const handleToggleRhythmDay = (day: Weekday) => {
    setStepError(null)
    setDraft((prev) => {
      const exists = prev.rhythmDays.includes(day)
      const nextDays = exists ? prev.rhythmDays.filter((d) => d !== day) : [...prev.rhythmDays, day]
      return { ...prev, rhythmDays: nextDays }
    })
  }

  const handleSelectDiagnoseAnswer = (questionIndex: number, score: number) => {
    setStepError(null)
    setDraft((prev) => {
      const qCount = questions.length
      const current = Array.isArray(prev.diagnoseAnswers)
        ? [...prev.diagnoseAnswers]
        : new Array<number | null>(qCount).fill(null)
      while (current.length < qCount) {
        current.push(null)
      }
      current[questionIndex] = score
      return {
        ...prev,
        diagnoseAnswers: current,
        diagnoseQuestionCount: qCount,
      }
    })
  }

  const handleSelectStep = (targetStep: HabitFlowStep) => {
    if (submitSuccess) {
      setSubmitSuccess(false)
      setStepError(null)
      setDraft((prev) => ({ ...prev, step: targetStep }))
      return
    }
    if (targetStep <= draft.step) {
      setStepError(null)
      setDraft((prev) => ({ ...prev, step: targetStep }))
    }
  }

  // Kiểm tra chuyển bước 1 -> 6
  const handleNextStep = () => {
    setStepError(null)

    if (draft.step === 1) {
      if (questions.length > 0 && !flowScore.isComplete) {
        return
      }
      setDraft((prev) => ({ ...prev, step: 2 }))
    } else if (draft.step === 2) {
      setDraft((prev) => ({ ...prev, step: 3 }))
    } else if (draft.step === 3) {
      if (draft.scorecard.length === 0) {
        setStepError(vi.hb19.errors.scorecardEmpty)
        return
      }
      if (!draft.anchorHabit) {
        setStepError(vi.hb19.errors.anchorRequired)
        return
      }
      setDraft((prev) => ({ ...prev, step: 4 }))
    } else if (draft.step === 4) {
      if (!draft.actionText.trim() || !draft.personText.trim()) {
        setStepError(vi.habit.wizard.errors.identityRequired)
        return
      }
      if (draft.rhythmDays.length === 0) {
        setStepError(vi.hb20.errors.rhythmEmpty)
        return
      }
      const targetFreq = draft.rhythmFrequency ?? draft.rhythmDays.length
      if (draft.rhythmDays.length !== targetFreq) {
        setStepError(vi.hb20.errors.rhythmCountMismatch(targetFreq, draft.rhythmDays.length))
        return
      }
      const todayYmd = getVietnamYmd()
      const maxStartDayYmd = getVietnamYmd(new Date(addVietnamDays(todayYmd, 14)))
      const selectedDate = draft.startDate?.trim() || todayYmd
      if (selectedDate < todayYmd || selectedDate > maxStartDayYmd) {
        setStepError(vi.hb20.errors.startDateOutOfRange)
        return
      }
      if (draft.privateReason && draft.privateReason.length > 500) {
        setStepError(vi.hb20.errors.privateReasonTooLong)
        return
      }
      if (draft.companionName && draft.companionName.length > 100) {
        setStepError(vi.hb20.errors.companionNameTooLong)
        return
      }
      setDraft((prev) => ({ ...prev, step: 5 }))
    } else if (draft.step === 5) {
      if (techniques.length > 0) {
        const allChosen = HABIT_STAGES.flatMap((stage) => draft.chosenTechniques[stage] || [])
        if (allChosen.length === 0) {
          setStepError(vi.hb21.errors.atLeastOneTechnique)
          return
        }
        for (const item of allChosen) {
          if (!item.action.trim()) {
            setStepError(vi.hb21.errors.actionRequired)
            return
          }
        }
      }
      const duration = startTimeRef.current
        ? Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000))
        : 0
      if (!completedTrackedRef.current) {
        completedTrackedRef.current = true
        track('habit_loop_completed', { step: 6, duration })
      }
      setDraft((prev) => ({ ...prev, step: 6 }))
    }
  }

  const handlePrevStep = () => {
    setStepError(null)
    setDraft((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as HabitFlowStep,
    }))
  }

  // Nộp kế hoạch (Bước 6)
  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setStepError(null)

    const cleanEmail = draft.email?.trim() || ''

    if (!cleanEmail) {
      setStepError(vi.habit.wizard.errors.emailRequired)
      return
    }

    if (!draft.consent) {
      setStepError(vi.habit.wizard.errors.consentRequired)
      return
    }

    setIsSubmitting(true)

    try {
      const flattenedTechniques = flattenChosenTechniques(draft.chosenTechniques)

      const payload = {
        scorecard: draft.scorecard,
        identityStatement:
          draft.identityStatement || formatIdentityStatement(draft.actionText, draft.personText),
        chosenTechniques: flattenedTechniques,
        anchorHabit: draft.anchorHabit || undefined,
        rhythmDays: draft.rhythmDays,
        twoMinuteAction: draft.twoMinuteAction || undefined,
        privateReason: draft.privateReason?.trim() || undefined,
        companionName: draft.companionName?.trim() || undefined,
        startDate: draft.startDate?.trim() || undefined,
        name: draft.name?.trim() || undefined,
        email: cleanEmail,
        consent: true,
        turnstileToken: turnstileToken || undefined,
        honeypot: honeypot || undefined,
      }

      const { submitHabitPlanAction } = await import('@/lib/habit/actions')
      const res = await submitHabitPlanAction(payload)

      if (!res.success) {
        setStepError(res.error || vi.habit.wizard.errors.submitFailed)
        setIsSubmitting(false)
        return
      }

      if (res.trackerDestination) {
        setTrackerDestination(res.trackerDestination)
      }

      if (res.trialStarted) {
        const { HABIT_TRACKER_PRODUCT_SLUG } = await import('@/lib/habit/config')
        track('trial_started', {
          productSlug: HABIT_TRACKER_PRODUCT_SLUG,
          days: res.trialDays ?? journeyDays,
        })
      }

      // Xóa nháp sau khi lưu thành công
      try {
        localStorage.removeItem(HABIT_LOOP_STORAGE_KEY)
      } catch {
        // noop
      }

      setZaloGroupUrl(res.zaloGroupUrl || '')
      setSubmitSuccess(true)
    } catch {
      setStepError(vi.habit.wizard.errors.submitFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    try {
      localStorage.removeItem(HABIT_LOOP_STORAGE_KEY)
    } catch {
      // noop
    }
    startTimeRef.current = Date.now()
    setDraft(getDefaultHabitFlowDraft())
    setSubmitSuccess(false)
    setStepError(null)
  }

  useEffect(() => {
    const previous = previousStepRef.current
    previousStepRef.current = draft.step
    if (previous === null || previous === draft.step) return
    const card = stepCardRef.current
    if (!card) return
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (typeof card.scrollIntoView === 'function') {
      card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    }
    card.focus({ preventScroll: true })
  }, [draft.step])

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero: Dòng nhỏ trên cùng + Tiêu đề 2 tầng + Nhãn + Dòng cảm xúc + Đoạn mở đầu + 3 nhãn giai đoạn */}
      <div className="mb-8 text-center space-y-4">
        <p className="text-xs sm:text-sm font-ui font-semibold text-deep-navy/70 tracking-wide uppercase">
          {vi.habit.wizard.topLine(vi.footerBrand, journeyDays)}
        </p>

        <SectionHeader
          seriesLabel={vi.habit.wizard.badge}
          titleLine1={vi.habit.wizard.titleLine1}
          titleLine2={vi.habit.wizard.titleLine2}
          as="h1"
          emotionLine={vi.habit.wizard.emotionalLine}
          className="text-center"
        />

        <p className="font-ui text-xs sm:text-sm text-deep-navy/80 leading-relaxed max-w-2xl mx-auto">
          {vi.habit.wizard.intro(journeyDays)}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {vi.habit.wizard.stagesPills.map((pill) => (
            <span
              key={pill}
              className="px-3.5 py-1 rounded-full text-xs font-ui font-bold bg-soft-pink text-bright-magenta border border-bright-magenta/20 shadow-2xs"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Thanh tiến trình 3 giai đoạn / 6 bước */}
      <FlowProgressBar
        currentStep={draft.step}
        journeyDays={journeyDays}
        isPlanSaved={submitSuccess}
        trackerUrl={trackerDestination}
        onSelectStep={handleSelectStep}
      />

      {/* Thông báo lỗi nếu có */}
      {stepError && draft.step !== 3 && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-card bg-accent-pink/10 border border-accent-pink/20 text-deep-navy text-sm font-medium flex items-center gap-3 animate-fade-in"
        >
          <span className="text-accent-pink font-bold text-lg" aria-hidden="true">
            !
          </span>
          <span>{stepError}</span>
        </div>
      )}

      {/* Màn hình thành công */}
      {submitSuccess ? (
        <div className="bg-white rounded-card shadow-soft border border-lavender-mist/60 p-6 sm:p-10 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-mint-haze flex items-center justify-center text-deep-navy text-2xl font-bold">
            ✓
          </div>
          <h2 className="font-display text-2xl sm:text-3xl !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy mb-3">
            {vi.hb22.successTitle}
          </h2>
          <p className="text-deep-navy/80 text-base mb-6 max-w-lg mx-auto">
            {vi.hb22.successSubtitle(journeyDays)}
          </p>

          <div className="p-4 rounded-xl bg-warm-ivory border border-lavender-mist mb-8 max-w-md mx-auto text-left">
            <span className="text-xs uppercase tracking-wider text-bright-magenta font-semibold block mb-1">
              {vi.habit.wizard.step4.identityHeading}
            </span>
            <p className="font-quote italic text-deep-navy text-base">
              &ldquo;{draft.identityStatement}&rdquo;
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Nút chính dẫn vào tracker */}
            <Link
              href={trackerDestination}
              data-testid="success-tracker-link"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-accent-pink text-white font-bold text-[19px] tracking-tight shadow-soft hover:bg-bright-magenta transition-colors"
            >
              {vi.hb22.goToTracker(journeyDays)}
            </Link>

            {/* Nút phụ: Zalo & Offer */}
            {zaloGroupUrl && (
              <a
                href={zaloGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="success-zalo-link"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-lavender-mist text-deep-navy font-semibold text-base hover:bg-soft-pink transition-colors"
              >
                {vi.habit.wizard.step4.joinZaloButton}
              </a>
            )}
            <Link
              href={HABIT_OFFER_PATH}
              data-testid="success-offer-link"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-warm-ivory border border-lavender-mist text-deep-navy font-semibold text-base hover:bg-soft-pink transition-colors"
            >
              {vi.habit.wizard.step4.viewOfferButton(journeyDays)}
            </Link>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-6 text-sm text-deep-navy/70 hover:text-deep-navy underline"
          >
            {vi.habit.wizard.step4.retakeButton}
          </button>
        </div>
      ) : (
        /* Các bước trong Flow 6 bước */
        <div
          ref={stepCardRef}
          tabIndex={-1}
          role="region"
          aria-label={vi.habit.wizard.stepIndicator(draft.step, 6)}
          className="bg-white rounded-card shadow-soft border border-lavender-mist/60 p-6 sm:p-8 scroll-mt-4 focus:outline-none"
        >
          {draft.step === 1 && (
            <StepDiagnose
              diagnose={diagnose}
              answers={draft.diagnoseAnswers ?? []}
              onSelectAnswer={handleSelectDiagnoseAnswer}
              onSkip={() => setDraft((prev) => ({ ...prev, step: 2 }))}
            />
          )}

          {draft.step === 2 && (
            <StepOnePercent
              onePercent={onePercent}
              unknowns={onePercentUnknowns}
              quote={stepQuotes?.onePercent}
            />
          )}

          {draft.step === 3 && (
            <StepMentor
              scorecard={draft.scorecard}
              anchorHabit={draft.anchorHabit}
              onAddHabit={handleAddHabit}
              onUpdateTime={handleUpdateTime}
              onSelectAnchor={handleSelectAnchor}
              onRemoveHabit={handleRemoveHabit}
              onUpdateRating={handleUpdateRating}
              onError={setStepError}
              error={stepError}
              quote={stepQuotes?.mentor}
            />
          )}

          {draft.step === 4 && (
            <StepName
              quote={stepQuotes?.name}
              actionText={draft.actionText}
              personText={draft.personText}
              identityStatement={draft.identityStatement}
              anchorHabit={draft.anchorHabit}
              rhythmDays={draft.rhythmDays}
              rhythmFrequency={draft.rhythmFrequency}
              twoMinuteAction={draft.twoMinuteAction}
              privateReason={draft.privateReason}
              companionName={draft.companionName}
              startDate={draft.startDate}
              journeyDays={journeyDays}
              error={draft.step === 4 ? stepError : null}
              onActionChange={handleActionChange}
              onPersonChange={handlePersonChange}
              onToggleRhythmDay={handleToggleRhythmDay}
              onRhythmFrequencyChange={(val) =>
                setDraft((prev) => ({
                  ...prev,
                  rhythmFrequency: val,
                }))
              }
              onTwoMinuteChange={(val) =>
                setDraft((prev) => ({
                  ...prev,
                  twoMinuteAction: val,
                }))
              }
              onPrivateReasonChange={(val) =>
                setDraft((prev) => ({
                  ...prev,
                  privateReason: val,
                }))
              }
              onCompanionChange={(val) =>
                setDraft((prev) => ({
                  ...prev,
                  companionName: val,
                }))
              }
              onStartDateChange={(val) =>
                setDraft((prev) => ({
                  ...prev,
                  startDate: val,
                }))
              }
            />
          )}

          {draft.step === 5 && (
            <StepLoop
              techniques={techniques}
              chosenTechniques={draft.chosenTechniques}
              onToggleTechnique={handleToggleTechnique}
              onUpdateTechniqueAction={handleUpdateTechniqueAction}
              loop={loop}
              quote={stepQuotes?.loop}
              error={draft.step === 5 ? stepError : null}
            />
          )}

          {draft.step === 6 && (
            <StepBoardingPass
              identityStatement={draft.identityStatement}
              actionText={draft.actionText}
              personText={draft.personText}
              anchorHabit={draft.anchorHabit}
              twoMinuteAction={draft.twoMinuteAction}
              rhythmDays={draft.rhythmDays}
              chosenTechniques={draft.chosenTechniques}
              selectedTechniqueIds={selectedTechniqueIds}
              journeyDays={journeyDays}
              startDate={draft.startDate}
              techniques={techniques}
              name={draft.name || ''}
              email={draft.email || ''}
              consent={Boolean(draft.consent)}
              honeypot={honeypot}
              privacyNote={privacyNote}
              quote={stepQuotes?.boardingPass}
              captionTemplate={boardingPassCaption}
              intro={boardingPassIntro}
              isSubmitting={isSubmitting}
              onNameChange={(val) => setDraft((prev) => ({ ...prev, name: val }))}
              onEmailChange={(val) => setDraft((prev) => ({ ...prev, email: val }))}
              onConsentChange={(val) => setDraft((prev) => ({ ...prev, consent: val }))}
              onHoneypotChange={setHoneypot}
              onTurnstileVerify={setTurnstileToken}
              onSubmitPlan={handleSubmitPlan}
            />
          )}

          {/* Điều khiển chuyển bước */}
          <div className="mt-8 pt-6 border-t border-lavender-mist/60 flex items-center justify-between gap-3">
            {draft.step > 1 ? (
              <Button type="button" variant="secondary" onClick={handlePrevStep}>
                ← {vi.habit.wizard.controls.prev}
              </Button>
            ) : (
              <div />
            )}

            {draft.step === 2 ? (
              <Button type="button" variant="primary" onClick={handleNextStep}>
                {vi.hb16.controls.toStage2}
              </Button>
            ) : draft.step < 6 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNextStep}
                disabled={
                  (draft.step === 1 && questions.length > 0 && !flowScore.isComplete) ||
                  (draft.step === 3 && !draft.scorecard.some((item) => item.rating === 'good'))
                }
              >
                {vi.habit.wizard.controls.next} →
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
