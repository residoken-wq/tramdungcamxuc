'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { HabitStep, DailyRoutineItem, IdentityFormData, LoopTechniques } from './types'
import { INITIAL_ROUTINES, INITIAL_IDENTITY_DATA, INITIAL_LOOP_TECHNIQUES } from './constants'
import { HabitTrackerHeader } from './HabitTrackerHeader'
import StepNavigation from './StepNavigation'
import { DEFAULT_DIAGNOSE_QUESTIONS, Step1Diagnose } from './Steps/Step1Diagnose'
import { Step2PercentPrinciple } from './Steps/Step2PercentPrinciple'
import { Step3FindMentor } from './Steps/Step3FindMentor'
import { Step4IdentityHabit } from './Steps/Step4IdentityHabit'
import { Step5LoopDesign } from './Steps/Step5LoopDesign'
import { BoardingPassCard } from './Result/BoardingPassCard'
import { HabitTrackerFooter } from './HabitTrackerFooter'
import { HABIT_LOOP_STORAGE_KEY, flattenChosenTechniques, type PublicTechnique } from '@/lib/habit'
import {
  getDefaultHabitFlowDraft,
  migrateHabitDraft,
  serializeHabitDraftForStorage,
} from '@/components/habit/flow/draft'
import { zipStateToFlowDraft, flowDraftToZipState, type ZipState } from './draft-adapter'
import { track } from '@/lib/analytics/track'
import { addVietnamDays, getVietnamYmd } from '@/lib/habit/tracker-stats'
import type {
  CleanHabitDiagnose,
  CleanHabitLoop,
  CleanHabitStepQuotes,
} from '@/lib/habit/journey-content.server'
import { withDp01Defaults, type Dp01AllContent } from '@/lib/habit/dp01-content'
import { vi } from '@/lib/i18n/vi'
import { StageGate } from './StageGate'
import type { HabitStageGateResult } from '@/lib/habit/stage-gate'

export interface HabitTrackerAppProps {
  techniques?: PublicTechnique[]
  journeyDays?: number
  diagnose?: CleanHabitDiagnose | null
  stepQuotes?: CleanHabitStepQuotes
  loopContent?: CleanHabitLoop | null
  privacyNote?: string | null
  dp01Content?: Dp01AllContent
  initialGate?: HabitStageGateResult
  initialStepParam?: number
}

export function HabitTrackerApp({
  techniques = [],
  journeyDays = 28,
  diagnose,
  loopContent,
  privacyNote,
  dp01Content,
  initialGate = { status: 'ok' },
  initialStepParam,
}: HabitTrackerAppProps) {
  const resolvedDp01 = useMemo(() => withDp01Defaults(dp01Content), [dp01Content])
  const startTimeRef = useRef<number | null>(null)
  const completedTrackedRef = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Core navigation state
  const [currentStep, setCurrentStep] = useState<HabitStep>(1)
  const [maxReachedStep, setMaxReachedStep] = useState<number>(1)
  // The gate comes from the server on each request (page is force-dynamic); no client copy.
  const gate = initialGate
  const [showGate, setShowGate] = useState(false)
  const stage1TrackedRef = useRef(false)

  // Form State
  const [diagnoseAnswers, setDiagnoseAnswers] = useState<Record<number, number>>({})
  const [routines, setRoutines] = useState<DailyRoutineItem[]>(INITIAL_ROUTINES)
  const [identity, setIdentity] = useState<IdentityFormData>(INITIAL_IDENTITY_DATA)
  const [loopTechniques, setLoopTechniques] = useState<LoopTechniques>(INITIAL_LOOP_TECHNIQUES)

  // Submission Form State for Step 6
  const [name, setName] = useState(initialGate.customer?.name || '')
  const [email, setEmail] = useState(initialGate.customer?.email || '')
  const [consent, setConsent] = useState(Boolean(initialGate.customer?.hasConsent))
  const [honeypot, setHoneypot] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [trackerDestination, setTrackerDestination] = useState<string>('/habit/tracker')
  const [hasSavedPlan, setHasSavedPlan] = useState(false)

  // Calculate current date in Vietnam time for Step 4 defaults if empty
  // QA DP-01c: the end date always follows the start date (a restored draft had none, so the
  // ticket fell back to a fixed '06/11').
  useEffect(() => {
    const startYmd = identity.startDate || getVietnamYmd()
    const endYmd = getVietnamYmd(new Date(addVietnamDays(startYmd, journeyDays - 1)))
    if (identity.startDate !== startYmd || identity.endDate !== endYmd) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- DP-01c: synchronize computed end date with start date
      setIdentity((prev) => ({
        ...prev,
        startDate: startYmd,
        endDate: endYmd,
      }))
    }
  }, [identity.startDate, identity.endDate, journeyDays])

  // 1. Restore from localStorage (using tdcx_habit_loop_v1 key via draft adapter)
  useEffect(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
    }
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const buocFromUrl = urlParams.get('buoc')
        const parsedBuoc =
          buocFromUrl && /^[1-6]$/.test(buocFromUrl) ? parseInt(buocFromUrl, 10) : undefined
        const targetStep = initialStepParam ?? parsedBuoc

        const stored = window.localStorage.getItem(HABIT_LOOP_STORAGE_KEY)
        let restoredStep: number | undefined
        if (stored) {
          const parsed = JSON.parse(stored)
          const knownIds = new Set((techniques || []).map((t) => t.id))
          // QA DP-03c: Step 1 here always renders the 8 zip questions (it is not given `diagnose`),
          // so compare the stored answers with that count. Using the CMS count (0 on an empty
          // DB, 16 when "Câu hỏi chẩn đoán" is seeded) dropped every answer on reload / after login.
          const migrated = migrateHabitDraft(parsed, knownIds, DEFAULT_DIAGNOSE_QUESTIONS.length)
          const restoredZip = flowDraftToZipState(migrated)

          /* eslint-disable react-hooks/set-state-in-effect -- Safe initial hydration from localStorage on mount */
          if (Object.keys(restoredZip.diagnoseAnswers).length > 0) {
            setDiagnoseAnswers(restoredZip.diagnoseAnswers)
          }
          if (restoredZip.routines.length > 0) {
            setRoutines(restoredZip.routines)
          }
          setIdentity((prev) => ({
            ...prev,
            ...restoredZip.identity,
          }))
          setLoopTechniques(restoredZip.loopTechniques)

          if (migrated.step && migrated.step >= 1 && migrated.step <= 6) {
            restoredStep = migrated.step
          }
        }

        const effectiveStep = targetStep ?? restoredStep
        if (effectiveStep) {
          // REVIEW-REQUIRED: DP-03 Kiểm tra cổng khi vào thẳng ?buoc= hoặc khôi phục nháp bước >= 3
          if (effectiveStep >= 3) {
            if (gate.status === 'ok') {
              setCurrentStep(effectiveStep as HabitStep)
              setMaxReachedStep((prev) => Math.max(prev, effectiveStep))
              setShowGate(false)
            } else {
              setCurrentStep(2)
              setMaxReachedStep((prev) => Math.max(prev, 2))
              setShowGate(true)
            }
          } else {
            setCurrentStep(effectiveStep as HabitStep)
            setMaxReachedStep((prev) => Math.max(prev, effectiveStep))
            setShowGate(false)
          }
        }
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoaded(true)
    }
  }, [techniques, initialStepParam, gate.status])

  // 2. Auto-save to localStorage whenever state changes
  useEffect(() => {
    if (!isLoaded || submitSuccess) return
    try {
      const zipState: ZipState = {
        diagnoseAnswers,
        routines,
        identity,
        loopTechniques,
      }
      const baseDraft = getDefaultHabitFlowDraft()
      baseDraft.step = (typeof currentStep === 'number' ? currentStep : 6) as any
      const adaptedDraft = zipStateToFlowDraft(zipState, baseDraft)
      adaptedDraft.name = name
      adaptedDraft.email = email

      window.localStorage.setItem(
        HABIT_LOOP_STORAGE_KEY,
        serializeHabitDraftForStorage(adaptedDraft),
      )
    } catch {
      // Ignore QuotaExceeded
    }
  }, [
    isLoaded,
    submitSuccess,
    currentStep,
    diagnoseAnswers,
    routines,
    identity,
    loopTechniques,
    name,
    email,
  ])

  // Track max step reached and scroll to top on step change
  const goToStep = (step: HabitStep) => {
    setCurrentStep(step)
    if (typeof step === 'number') {
      setMaxReachedStep((prev) => Math.max(prev, step))
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Step 1: diagnose answer change (toggle on/off)
  const handleDiagnoseChange = (id: number, score: number) => {
    setDiagnoseAnswers((prev) => {
      const next = { ...prev }
      if (next[id] === score) {
        delete next[id]
      } else {
        next[id] = score
      }
      return next
    })
  }

  // Step 4 field change
  const handleIdentityChange = (field: keyof IdentityFormData, value: any) => {
    setIdentity((prev) => ({ ...prev, [field]: value }))
  }

  // Prescribed category calculated from Step 1 answers
  const prescribedCategory = useMemo((): 'cue' | 'craving' | 'response' | 'reward' | null => {
    if (!diagnoseAnswers || Object.keys(diagnoseAnswers).length === 0) return null
    const scoreCue = (diagnoseAnswers[1] || 0) + (diagnoseAnswers[2] || 0)
    const scoreCraving = (diagnoseAnswers[3] || 0) + (diagnoseAnswers[4] || 0)
    const scoreResponse = (diagnoseAnswers[5] || 0) + (diagnoseAnswers[6] || 0)
    const scoreReward = (diagnoseAnswers[7] || 0) + (diagnoseAnswers[8] || 0)

    const categories = [
      { id: 'cue' as const, score: scoreCue },
      { id: 'craving' as const, score: scoreCraving },
      { id: 'response' as const, score: scoreResponse },
      { id: 'reward' as const, score: scoreReward },
    ]
    categories.sort((a, b) => b.score - a.score)
    return categories[0].score > 0 ? categories[0].id : null
  }, [diagnoseAnswers])

  // REVIEW-REQUIRED: DP-03 Cổng kiểm tra quyền truy cập bước 3 trở đi
  const requestStep = (targetStep: HabitStep) => {
    const numeric = typeof targetStep === 'number' ? targetStep : 6
    if (numeric >= 3 && gate.status !== 'ok') {
      setShowGate(true)
      if (!stage1TrackedRef.current) {
        stage1TrackedRef.current = true
        track('habit_stage1_completed')
      }
      // StageGate scrolls itself into view (on a phone the page top is the long hero).
      return
    }
    if (numeric === 7) {
      // QA DP-03c: stage-3 card ("28 ngày") has no step screen; open the tracker once a plan
      // is saved, otherwise do nothing (same rule as the step-7 pill in StepNavigation).
      if (hasSavedPlan && typeof window !== 'undefined') window.location.assign(trackerDestination)
      return
    }
    setShowGate(false)
    if (numeric === 6 && !completedTrackedRef.current) {
      completedTrackedRef.current = true
      const duration = startTimeRef.current
        ? Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000))
        : 0
      track('habit_loop_completed' as any, { step: 6, duration })
    }
    goToStep(targetStep)
  }

  // Lưu nháp đảm bảo step=2 trước khi rời trang sang cổng đăng nhập
  const handleBeforeLogin = () => {
    try {
      const zipState: ZipState = {
        diagnoseAnswers,
        routines,
        identity,
        loopTechniques,
      }
      const baseDraft = getDefaultHabitFlowDraft()
      baseDraft.step = 2
      const adaptedDraft = zipStateToFlowDraft(zipState, baseDraft)
      adaptedDraft.name = name
      adaptedDraft.email = email
      window.localStorage.setItem(
        HABIT_LOOP_STORAGE_KEY,
        serializeHabitDraftForStorage(adaptedDraft),
      )
    } catch {
      // Ignore storage errors
    }
  }

  // Step 6: Submit habit plan action
  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const cleanEmail = (gate.customer?.email || email).trim()
    if (!cleanEmail) {
      setSubmitError(vi.dp01.emailRequiredError)
      return
    }
    const hasConsent = Boolean(gate.customer?.hasConsent || consent)
    if (!hasConsent) {
      setSubmitError(vi.dp01.termsRequiredError)
      return
    }

    setIsSubmitting(true)

    try {
      // Build draft to flatten chosen techniques
      const zipState: ZipState = {
        diagnoseAnswers,
        routines,
        identity,
        loopTechniques,
      }
      const draft = zipStateToFlowDraft(zipState, getDefaultHabitFlowDraft())
      const flattenedTechniques = flattenChosenTechniques(draft.chosenTechniques)

      const payload = {
        scorecard: draft.scorecard,
        identityStatement: draft.identityStatement,
        actionText: draft.actionText?.trim() || undefined,
        personText: draft.personText?.trim() || undefined,
        chosenTechniques: flattenedTechniques,
        anchorHabit: draft.anchorHabit || undefined,
        rhythmDays: draft.rhythmDays,
        twoMinuteAction: draft.twoMinuteAction || undefined,
        privateReason: draft.privateReason?.trim() || undefined,
        companionName: draft.companionName?.trim() || undefined,
        startDate: draft.startDate?.trim() || undefined,
        name: name.trim() || undefined,
        email: cleanEmail,
        consent: true,
        turnstileToken: turnstileToken || undefined,
        honeypot: honeypot || undefined,
      }

      const { submitHabitPlanAction } = await import('@/lib/habit/actions')
      // REVIEW-REQUIRED: Plan creation & trial unlock
      const res = await submitHabitPlanAction(payload)

      if (!res.success) {
        setSubmitError(res.error || vi.dp01.submitGeneralError)
        setIsSubmitting(false)
        return
      }

      if (res.trackerDestination) {
        setTrackerDestination(res.trackerDestination)
      }
      setHasSavedPlan(true)
      setSubmitSuccess(true)

      if (res.trialStarted) {
        const { HABIT_TRACKER_PRODUCT_SLUG } = await import('@/lib/habit/config')
        track('trial_started', {
          productSlug: HABIT_TRACKER_PRODUCT_SLUG,
          email: cleanEmail,
          source: 'habit_loop_5phut',
        })
      }

      track('habit_plan_submitted' as any, {
        step: 6,
        duration: startTimeRef.current
          ? Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000))
          : 0,
      })
    } catch (err: any) {
      setSubmitError(err?.message || vi.dp01.submitGeneralError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-ivory text-deep-navy font-ui flex flex-col justify-between">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Header với 3 Thẻ tiến độ Giai đoạn */}
        <HabitTrackerHeader
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          headerContent={resolvedDp01.header}
          onStageClick={(step: HabitStep) => requestStep(step)}
          onNavigateStep={(step: HabitStep) => requestStep(step)}
        />

        {/* Thanh Điều hướng 6 Bước + Pill Bước 7 (28 ngày) */}
        <StepNavigation
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          hasSavedPlan={hasSavedPlan}
          onStepChange={(step: HabitStep) => requestStep(step)}
        />

        {/* Nội dung Bước Hiện Tại hoặc Màn Cổng */}
        <main className="transition-all duration-300">
          {showGate ? (
            <StageGate
              gate={gate}
              prescribedCategory={prescribedCategory}
              onBack={() => {
                setShowGate(false)
                goToStep(2)
              }}
              onBeforeLogin={handleBeforeLogin}
            />
          ) : (
            <>
              {currentStep === 1 && (
                <Step1Diagnose
                  answers={diagnoseAnswers}
                  step1Content={resolvedDp01.step1}
                  onAnswerChange={handleDiagnoseChange}
                  onNext={() => requestStep(2)}
                />
              )}

              {currentStep === 2 && (
                <Step2PercentPrinciple
                  step2Content={resolvedDp01.step2}
                  onNext={() => requestStep(3)}
                  onPrev={() => requestStep(1)}
                />
              )}

              {currentStep === 3 && (
                <Step3FindMentor
                  routines={routines}
                  selectedMentor={identity.selectedMentor}
                  mentorTime={identity.mentorTime}
                  step3Content={resolvedDp01.step3}
                  onRoutinesChange={setRoutines}
                  onMentorSelect={(mentor: string) =>
                    setIdentity((prev) => ({
                      ...prev,
                      selectedMentor: mentor,
                    }))
                  }
                  onMentorTimeChange={(time: string) =>
                    setIdentity((prev) => ({
                      ...prev,
                      mentorTime: time,
                    }))
                  }
                  onNext={() => requestStep(4)}
                  onPrev={() => requestStep(2)}
                />
              )}

              {currentStep === 4 && (
                <Step4IdentityHabit
                  draft={zipStateToFlowDraft(
                    {
                      diagnoseAnswers,
                      routines,
                      identity,
                      loopTechniques,
                    },
                    getDefaultHabitFlowDraft(),
                  )}
                  step4Content={resolvedDp01.step4}
                  onDraftChange={(newDraft) => {
                    const zState = flowDraftToZipState(newDraft)
                    setIdentity((prev) => ({
                      ...prev,
                      ...zState.identity,
                    }))
                  }}
                  onNext={() => requestStep(5)}
                  onPrev={() => requestStep(3)}
                />
              )}

              {currentStep === 5 && (
                <Step5LoopDesign
                  loopTechniques={loopTechniques}
                  prescribedCategory={prescribedCategory}
                  identity={identity}
                  techniques={techniques}
                  loopContent={loopContent}
                  step5Content={resolvedDp01.step5}
                  onGoToStep={(step) => requestStep(step)}
                  onTechniquesChange={setLoopTechniques}
                  onNext={() => requestStep(6)}
                  onPrev={() => requestStep(4)}
                />
              )}

              {currentStep === 6 && (
                <BoardingPassCard
                  journeyDays={journeyDays}
                  identity={identity}
                  loopTechniques={loopTechniques}
                  techniques={techniques}
                  step6Content={resolvedDp01.step6}
                  name={name}
                  email={email}
                  consent={consent}
                  honeypot={honeypot}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                  submitSuccess={submitSuccess}
                  trackerDestination={trackerDestination}
                  privacyNote={privacyNote}
                  isEmailReadOnly={Boolean(gate.customer?.email)}
                  showConsentCheckbox={!gate.customer?.hasConsent}
                  showTurnstile={!gate.customer}
                  onNameChange={setName}
                  onEmailChange={setEmail}
                  onConsentChange={setConsent}
                  onHoneypotChange={setHoneypot}
                  onTurnstileVerify={setTurnstileToken}
                  onSubmitPlan={handleSubmitPlan}
                  onPrev={() => requestStep(5)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <HabitTrackerFooter footerContent={resolvedDp01.footer} />
    </div>
  )
}
