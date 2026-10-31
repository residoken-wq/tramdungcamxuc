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
import type { CleanHabitOnePercent } from '@/lib/habit/journey-content.server'
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
}

export function HabitFlow({ techniques, journeyDays = 28, onePercent }: HabitFlowProps) {
  const startTimeRef = useRef<number | null>(null)
  // Ghi habit_loop_completed đúng 1 lần mỗi lần mở trang (Quay lại → Tiếp tục không ghi lại)
  const completedTrackedRef = useRef(false)
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
  const [honeypot, setHoneypot] = useState('')

  const todayFormatted = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date())
    } catch {
      return new Date().toLocaleDateString('vi-VN')
    }
  }, [])

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

  // 1. Khôi phục dữ liệu từ localStorage (chuyển nháp v1 -> v2 nếu cần)
  useEffect(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
    }
    const knownIds = new Set(techniques.map((t) => t.id))
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(HABIT_LOOP_STORAGE_KEY)
        if (stored) {
          const parsed: unknown = JSON.parse(stored)
          const migrated = migrateHabitDraft(parsed, knownIds)
          setDraft(migrated)
        }
      } catch {
        // Bỏ qua nếu localStorage bị tắt hoặc lỗi parse
      } finally {
        setIsLoaded(true)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [techniques])

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
      setDraft((prev) => ({ ...prev, step: 2 }))
    } else if (draft.step === 2) {
      setDraft((prev) => ({ ...prev, step: 3 }))
    } else if (draft.step === 3) {
      if (draft.scorecard.length === 0) {
        setStepError(vi.habit.wizard.errors.scorecardEmpty)
        return
      }
      setDraft((prev) => ({ ...prev, step: 4 }))
    } else if (draft.step === 4) {
      if (!draft.actionText.trim() || !draft.personText.trim()) {
        setStepError(vi.habit.wizard.errors.identityRequired)
        return
      }
      if (draft.rhythmDays.length === 0) {
        setStepError(vi.hb09.step2.rhythmEmptyError)
        return
      }
      setDraft((prev) => ({ ...prev, step: 5 }))
    } else if (draft.step === 5) {
      for (const stg of HABIT_STAGES) {
        const stageTechs = techniques.filter((t) => t.stage === stg)
        const list = draft.chosenTechniques[stg] || []

        if (stageTechs.length > 0 && list.length === 0) {
          setStepError(
            `${vi.habit.wizard.errors.techniquesEmpty} (${vi.habit.wizard.step3.stages[stg].title})`,
          )
          return
        }
        for (const item of list) {
          if (!item.action.trim()) {
            setStepError(vi.habit.wizard.errors.actionRequired)
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
      {/* Tiêu đề 2 tầng chuẩn Brand Book */}
      <SectionHeader
        seriesLabel={vi.habit.wizard.badge}
        titleLine1={vi.habit.wizard.titleLine1}
        titleLine2={vi.habit.wizard.titleLine2}
        as="h1"
        emotionLine={vi.habit.wizard.emotionalLine}
        className="mb-8 text-center"
      />

      {/* Thanh tiến trình 3 giai đoạn / 6 bước */}
      <FlowProgressBar
        currentStep={draft.step}
        journeyDays={journeyDays}
        isPlanSaved={submitSuccess}
        onSelectStep={handleSelectStep}
      />

      {/* Thông báo lỗi nếu có */}
      {stepError && (
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
          <h2 className="font-display text-2xl sm:text-3xl text-deep-navy mb-3">
            {vi.habit.wizard.step4.savedSuccessTitle}
          </h2>
          <p className="text-deep-navy/80 text-base mb-6 max-w-lg mx-auto">
            {vi.habit.wizard.step4.savedSuccessMessage}
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
            {zaloGroupUrl && (
              <a
                href={zaloGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-accent-pink text-white font-bold text-[19px] tracking-tight shadow-soft hover:bg-bright-magenta transition-colors"
              >
                {vi.habit.wizard.step4.joinZaloButton}
              </a>
            )}
            <Link
              href={HABIT_OFFER_PATH}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-lavender-mist text-deep-navy font-semibold text-base hover:bg-soft-pink transition-colors"
            >
              {vi.habit.wizard.step4.viewOfferButton(journeyDays)}
            </Link>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-6 text-sm text-deep-navy/60 hover:text-deep-navy underline"
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
          {draft.step === 1 && <StepDiagnose />}

          {draft.step === 2 && <StepOnePercent onePercent={onePercent} />}

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
            />
          )}

          {draft.step === 4 && (
            <StepName
              actionText={draft.actionText}
              personText={draft.personText}
              identityStatement={draft.identityStatement}
              anchorHabit={draft.anchorHabit}
              rhythmDays={draft.rhythmDays}
              twoMinuteAction={draft.twoMinuteAction}
              todayFormatted={todayFormatted}
              onActionChange={handleActionChange}
              onPersonChange={handlePersonChange}
              onToggleRhythmDay={handleToggleRhythmDay}
              onTwoMinuteChange={(val) =>
                setDraft((prev) => ({
                  ...prev,
                  twoMinuteAction: val,
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
              techniques={techniques}
              name={draft.name || ''}
              email={draft.email || ''}
              consent={Boolean(draft.consent)}
              honeypot={honeypot}
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
              <Button type="button" variant="primary" onClick={handleNextStep}>
                {vi.habit.wizard.controls.next} →
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
