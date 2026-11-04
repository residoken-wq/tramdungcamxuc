'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { HabitStep, DailyRoutineItem, IdentityFormData, LoopTechniques } from './types'
import { INITIAL_ROUTINES, INITIAL_IDENTITY_DATA, INITIAL_LOOP_TECHNIQUES } from './constants'
import { HabitTrackerHeader } from './HabitTrackerHeader'
import StepNavigation from './StepNavigation'
import { Step1Diagnose } from './Steps/Step1Diagnose'
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

export interface HabitTrackerAppProps {
  techniques?: PublicTechnique[]
  journeyDays?: number
  diagnose?: CleanHabitDiagnose | null
  stepQuotes?: CleanHabitStepQuotes
  loopContent?: CleanHabitLoop | null
  privacyNote?: string | null
  dp01Content?: Dp01AllContent
}

export function HabitTrackerApp({
  techniques = [],
  journeyDays = 28,
  diagnose,
  loopContent,
  privacyNote,
  dp01Content,
}: HabitTrackerAppProps) {
  const resolvedDp01 = useMemo(() => withDp01Defaults(dp01Content), [dp01Content])
  const startTimeRef = useRef<number | null>(null)
  const completedTrackedRef = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Core navigation state
  const [currentStep, setCurrentStep] = useState<HabitStep>(1)
  const [maxReachedStep, setMaxReachedStep] = useState<number>(1)

  // Form State
  const [diagnoseAnswers, setDiagnoseAnswers] = useState<Record<number, number>>({})
  const [routines, setRoutines] = useState<DailyRoutineItem[]>(INITIAL_ROUTINES)
  const [identity, setIdentity] = useState<IdentityFormData>(INITIAL_IDENTITY_DATA)
  const [loopTechniques, setLoopTechniques] = useState<LoopTechniques>(INITIAL_LOOP_TECHNIQUES)

  // Submission Form State for Step 6
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
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
        const stored = window.localStorage.getItem(HABIT_LOOP_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          const knownIds = new Set((techniques || []).map((t) => t.id))
          const migrated = migrateHabitDraft(parsed, knownIds, diagnose?.questions?.length)
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
            setCurrentStep(migrated.step as HabitStep)
            setMaxReachedStep((prev) => Math.max(prev, migrated.step))
          }
          /* eslint-enable react-hooks/set-state-in-effect */
        }
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoaded(true)
    }
  }, [techniques, diagnose?.questions?.length])

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

  // Step 6: Submit habit plan action
  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setSubmitError(vi.dp01.emailRequiredError)
      return
    }
    if (!consent) {
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

  const handleStepTransition = (next: number) => {
    if (next === 6 && !completedTrackedRef.current) {
      completedTrackedRef.current = true
      const duration = startTimeRef.current
        ? Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000))
        : 0
      track('habit_loop_completed' as any, { step: 6, duration })
    }
    goToStep(next as HabitStep)
  }

  return (
    <div className="min-h-screen bg-warm-ivory text-deep-navy font-ui flex flex-col justify-between">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Header với 3 Thẻ tiến độ Giai đoạn */}
        <HabitTrackerHeader
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          headerContent={resolvedDp01.header}
          onStageClick={(step: HabitStep) => goToStep(step)}
        />

        {/* Thanh Điều hướng 6 Bước + Pill Bước 7 (28 ngày) */}
        <StepNavigation
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          hasSavedPlan={hasSavedPlan}
          onStepChange={(step: HabitStep) => goToStep(step)}
        />

        {/* Nội dung Bước Hiện Tại */}
        <main className="transition-all duration-300">
          {currentStep === 1 && (
            <Step1Diagnose
              answers={diagnoseAnswers}
              step1Content={resolvedDp01.step1}
              onAnswerChange={handleDiagnoseChange}
              onNext={() => handleStepTransition(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2PercentPrinciple
              step2Content={resolvedDp01.step2}
              onNext={() => handleStepTransition(3)}
              onPrev={() => goToStep(1)}
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
              onNext={() => handleStepTransition(4)}
              onPrev={() => goToStep(2)}
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
              onNext={() => handleStepTransition(5)}
              onPrev={() => goToStep(3)}
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
              onGoToStep={(step) => goToStep(step)}
              onTechniquesChange={setLoopTechniques}
              onNext={() => handleStepTransition(6)}
              onPrev={() => goToStep(4)}
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
              onNameChange={setName}
              onEmailChange={setEmail}
              onConsentChange={setConsent}
              onHoneypotChange={setHoneypot}
              onTurnstileVerify={setTurnstileToken}
              onSubmitPlan={handleSubmitPlan}
              onPrev={() => goToStep(5)}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <HabitTrackerFooter footerContent={resolvedDp01.footer} />
    </div>
  )
}
