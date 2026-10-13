'use client'

import React, { useState, useEffect, useId, useRef } from 'react'
import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { ProgressGrid } from '@/components/habit/ProgressGrid'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import {
  HABIT_LOOP_STORAGE_KEY,
  HABIT_OFFER_PATH,
  HABIT_STAGES,
  formatIdentityStatement,
  getDefaultHabitDraft,
  flattenChosenTechniques,
  type PublicTechnique,
  type HabitScorecardRating,
  type HabitPlanDraft,
} from '@/lib/habit'
import type { HabitStage } from '@/lib/diagnostic'

export interface HabitLoopWizardProps {
  techniques: PublicTechnique[]
}

export function HabitLoopWizard({ techniques }: HabitLoopWizardProps) {
  const startTimeRef = useRef<number | null>(null)
  // Ghi habit_loop_completed đúng 1 lần mỗi lần mở trang (Quay lại → Tiếp tục không ghi lại)
  const completedTrackedRef = useRef(false)
  const [draft, setDraft] = useState<HabitPlanDraft>(getDefaultHabitDraft())
  const [isLoaded, setIsLoaded] = useState(false)
  const [newHabitText, setNewHabitText] = useState('')
  const [newHabitRating, setNewHabitRating] = useState<HabitScorecardRating>('neutral')
  const [stepError, setStepError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [zaloGroupUrl, setZaloGroupUrl] = useState<string>('')
  const [honeypot, setHoneypot] = useState('')

  const habitInputId = useId()
  const nameInputId = useId()
  const emailInputId = useId()
  const consentInputId = useId()

  // 1. Khôi phục dữ liệu từ localStorage
  useEffect(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
    }
    const knownIds = new Set(techniques.map((t) => t.id))
    const keepKnown = (items: unknown) =>
      Array.isArray(items)
        ? items.filter(
            (item): item is { techniqueId: number; action: string } =>
              typeof item === 'object' &&
              item !== null &&
              knownIds.has((item as { techniqueId: number }).techniqueId) &&
              typeof (item as { action: unknown }).action === 'string',
          )
        : []
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(HABIT_LOOP_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<HabitPlanDraft>
          if (parsed && typeof parsed === 'object') {
            setDraft((prev) => ({
              ...prev,
              ...parsed,
              name: typeof parsed.name === 'string' ? parsed.name : '',
              email: typeof parsed.email === 'string' ? parsed.email : '',
              consent: false, // B11: Nghị định 13/2023 - không bao giờ tự động tick sẵn ô đồng ý từ nháp
              scorecard: Array.isArray(parsed.scorecard) ? parsed.scorecard : [],
              actionText: typeof parsed.actionText === 'string' ? parsed.actionText : '',
              personText: typeof parsed.personText === 'string' ? parsed.personText : '',
              identityStatement:
                typeof parsed.identityStatement === 'string' ? parsed.identityStatement : '',
              // Bỏ kỹ thuật không còn trong danh sách (Hana đã ẩn / xóa) để nháp cũ không kẹt ở bước 3
              chosenTechniques: parsed.chosenTechniques
                ? {
                    cue: keepKnown(parsed.chosenTechniques.cue),
                    craving: keepKnown(parsed.chosenTechniques.craving),
                    response: keepKnown(parsed.chosenTechniques.response),
                    reward: keepKnown(parsed.chosenTechniques.reward),
                  }
                : prev.chosenTechniques,
              step:
                typeof parsed.step === 'number' && parsed.step >= 1 && parsed.step <= 4
                  ? parsed.step
                  : 1,
            }))
          }
        }
      } catch {
        // Bỏ qua nếu localStorage bị tắt hoặc lỗi parse
      } finally {
        setIsLoaded(true)
      }
    }, 0)

    return () => clearTimeout(timer)
    // techniques là props từ server, không đổi trong vòng đời trang
  }, [techniques])

  // 2. Tự động lưu nháp vào localStorage mỗi khi thay đổi (không lưu consent)
  useEffect(() => {
    if (!isLoaded || submitSuccess) return
    try {
      const { consent: _ignoredConsent, ...draftToPersist } = draft
      localStorage.setItem(HABIT_LOOP_STORAGE_KEY, JSON.stringify(draftToPersist))
    } catch {
      // QuotaExceeded hoặc Private mode
    }
  }, [draft, isLoaded, submitSuccess])

  // Cập nhật câu định danh khi thay đổi hành động hoặc con người
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

  // Quản lý Bảng điểm thói quen (Bước 1)
  const handleAddHabit = (textToAdd?: string, ratingToAdd?: HabitScorecardRating) => {
    const text = (textToAdd ?? newHabitText).trim()
    const rating = ratingToAdd ?? newHabitRating
    if (!text) {
      setStepError(vi.habit.wizard.errors.habitRequired)
      return
    }
    setDraft((prev) => ({
      ...prev,
      scorecard: [...prev.scorecard, { habit: text, rating }],
    }))
    setNewHabitText('')
    setStepError(null)
  }

  const handleRemoveHabit = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      scorecard: prev.scorecard.filter((_, i) => i !== index),
    }))
  }

  const handleUpdateRating = (index: number, rating: HabitScorecardRating) => {
    setDraft((prev) => ({
      ...prev,
      scorecard: prev.scorecard.map((item, i) => (i === index ? { ...item, rating } : item)),
    }))
  }

  // Quản lý kỹ thuật (Bước 3)
  const handleToggleTechnique = (stage: HabitStage, techId: number, defaultName: string) => {
    setStepError(null)
    setDraft((prev) => {
      const currentList = prev.chosenTechniques[stage] || []
      const exists = currentList.find((item) => item.techniqueId === techId)

      if (exists) {
        // Hủy chọn
        return {
          ...prev,
          chosenTechniques: {
            ...prev.chosenTechniques,
            [stage]: currentList.filter((item) => item.techniqueId !== techId),
          },
        }
      }

      // Giới hạn 2 kỹ thuật cho mỗi giai đoạn
      if (currentList.length >= 2) {
        setStepError(vi.habit.wizard.errors.techniquesTooMany)
        return prev
      }

      // Thêm mới kỹ thuật vào giai đoạn
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

  // Kiểm tra chuyển bước
  const handleNextStep = () => {
    setStepError(null)

    if (draft.step === 1) {
      if (draft.scorecard.length === 0) {
        setStepError(vi.habit.wizard.errors.scorecardEmpty)
        return
      }
      setDraft((prev) => ({ ...prev, step: 2 }))
    } else if (draft.step === 2) {
      if (!draft.actionText.trim() || !draft.personText.trim()) {
        setStepError(vi.habit.wizard.errors.identityRequired)
        return
      }
      setDraft((prev) => ({ ...prev, step: 3 }))
    } else if (draft.step === 3) {
      // Chỉ bắt buộc chọn kỹ thuật cho những giai đoạn CÓ kỹ thuật trong DB; không chặn nếu giai đoạn trống
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
        track('habit_loop_completed', { step: 4, duration })
      }
      setDraft((prev) => ({ ...prev, step: 4 }))
    }
  }

  const handlePrevStep = () => {
    setStepError(null)
    setDraft((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }))
  }

  // Nộp kế hoạch (Bước 4)
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
    setDraft(getDefaultHabitDraft())
    setSubmitSuccess(false)
    setStepError(null)
  }

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

      {/* Thanh tiến độ 4 bước */}
      {!submitSuccess && (
        <div className="mb-8" aria-label={vi.habit.wizard.errors.progressAria}>
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-deep-navy mb-2">
            <span>{vi.habit.wizard.stepIndicator(draft.step, 4)}</span>
            <span className="text-bright-magenta">
              {draft.step === 1 && vi.habit.wizard.step1.title}
              {draft.step === 2 && vi.habit.wizard.step2.title}
              {draft.step === 3 && vi.habit.wizard.step3.title}
              {draft.step === 4 && vi.habit.wizard.step4.title}
            </span>
          </div>
          <div className="w-full h-2.5 bg-lavender-mist/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-bright-magenta transition-all duration-300 rounded-full"
              style={{ width: `${(draft.step / 4) * 100}%` }}
              role="progressbar"
              aria-valuenow={(draft.step / 4) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

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
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-accent-pink text-white font-semibold text-base shadow-soft hover:bg-bright-magenta transition-colors"
              >
                {vi.habit.wizard.step4.joinZaloButton}
              </a>
            )}
            <Link
              href={HABIT_OFFER_PATH}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-lavender-mist text-deep-navy font-semibold text-base hover:bg-soft-pink transition-colors"
            >
              {vi.habit.wizard.step4.viewOfferButton}
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
        /* Các bước trong Wizard */
        <div className="bg-white rounded-card shadow-soft border border-lavender-mist/60 p-6 sm:p-8">
          {/* ================= BƯỚC 1: BẢNG ĐIỂM THÓI QUEN ================= */}
          {draft.step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
                  {vi.habit.wizard.step1.title}
                </h3>
                <p className="text-sm sm:text-base text-deep-navy/80">
                  {vi.habit.wizard.step1.subtitle}
                </p>
              </div>

              {/* Ô thêm thói quen */}
              <div className="p-4 rounded-xl bg-warm-ivory border border-lavender-mist">
                <label
                  htmlFor={habitInputId}
                  className="block text-xs font-semibold text-deep-navy uppercase tracking-wider mb-2"
                >
                  {vi.habit.wizard.step1.addPlaceholder}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id={habitInputId}
                    type="text"
                    value={newHabitText}
                    onChange={(e) => setNewHabitText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddHabit()
                      }
                    }}
                    placeholder={vi.habit.wizard.step1.addPlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newHabitRating}
                      onChange={(e) => setNewHabitRating(e.target.value as HabitScorecardRating)}
                      className="px-3 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta text-sm"
                      aria-label={vi.habit.wizard.errors.ratingAria}
                    >
                      <option value="good">{vi.habit.wizard.step1.goodLabel}</option>
                      <option value="neutral">{vi.habit.wizard.step1.neutralLabel}</option>
                      <option value="bad">{vi.habit.wizard.step1.badLabel}</option>
                    </select>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => handleAddHabit()}
                      className="whitespace-nowrap"
                    >
                      {vi.habit.wizard.step1.addButton}
                    </Button>
                  </div>
                </div>

                {/* Gợi ý mẫu */}
                <div className="mt-4 pt-3 border-t border-lavender-mist/40">
                  <span className="text-xs text-deep-navy/70 block mb-2 font-medium">
                    {vi.habit.wizard.step1.samplesPrompt}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {vi.habit.wizard.step1.sampleHabits.map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => handleAddHabit(sample, 'neutral')}
                        className="text-xs px-2.5 py-1 rounded-full bg-white border border-lavender-mist text-deep-navy hover:bg-soft-pink hover:border-accent-pink transition-colors"
                      >
                        + {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Danh sách thói quen hiện tại */}
              <div className="space-y-2">
                {draft.scorecard.length === 0 ? (
                  <p className="text-center py-8 text-deep-navy/60 italic text-sm">
                    {vi.habit.wizard.step1.emptyPrompt}
                  </p>
                ) : (
                  draft.scorecard.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-lavender-mist bg-white hover:bg-warm-ivory transition-colors"
                    >
                      <span className="text-sm font-medium text-deep-navy flex-1">
                        {item.habit}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateRating(index, 'good')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            item.rating === 'good'
                              ? 'bg-mint-haze text-deep-navy ring-2 ring-deep-navy/20'
                              : 'bg-warm-ivory text-deep-navy/70 hover:bg-mint-haze/50'
                          }`}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateRating(index, 'neutral')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            item.rating === 'neutral'
                              ? 'bg-butter-cream text-deep-navy ring-2 ring-deep-navy/20'
                              : 'bg-warm-ivory text-deep-navy/70 hover:bg-butter-cream/50'
                          }`}
                        >
                          =
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateRating(index, 'bad')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            item.rating === 'bad'
                              ? 'bg-soft-pink text-deep-navy ring-2 ring-deep-navy/20'
                              : 'bg-warm-ivory text-deep-navy/70 hover:bg-soft-pink/50'
                          }`}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveHabit(index)}
                          className="ml-2 p-1 text-deep-navy/40 hover:text-accent-pink text-sm"
                          aria-label={vi.habit.wizard.step1.deleteButton}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= BƯỚC 2: GỌI TÊN THÓI QUEN ================= */}
          {draft.step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
                  {vi.habit.wizard.step2.title}
                </h3>
                <p className="text-sm sm:text-base text-deep-navy/80">
                  {vi.habit.wizard.step2.subtitle}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-deep-navy mb-1.5">
                    {vi.habit.wizard.step2.actionLabel}
                  </label>
                  <input
                    type="text"
                    value={draft.actionText}
                    onChange={(e) => handleActionChange(e.target.value)}
                    placeholder={vi.habit.wizard.step2.actionPlaceholder}
                    className="w-full px-4 py-3 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-deep-navy mb-1.5">
                    {vi.habit.wizard.step2.identityLabel}
                  </label>
                  <input
                    type="text"
                    value={draft.personText}
                    onChange={(e) => handlePersonChange(e.target.value)}
                    placeholder={vi.habit.wizard.step2.identityPlaceholder}
                    className="w-full px-4 py-3 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta"
                  />
                </div>
              </div>

              {/* Hộp xem trước câu định danh thời gian thực */}
              <div className="p-6 rounded-card bg-brand-gradient border border-lavender-mist">
                <span className="text-xs uppercase tracking-wider text-bright-magenta font-semibold block mb-2">
                  {vi.habit.wizard.step2.previewLabel}
                </span>
                <p className="font-quote italic text-deep-navy text-lg sm:text-xl">
                  {draft.identityStatement || (
                    <span className="text-deep-navy/40">
                      {vi.habit.wizard.errors.identityExample}
                    </span>
                  )}
                </p>
              </div>

              {/* Lời khuyên từ Hana */}
              <div className="p-4 rounded-xl bg-butter-cream/40 border border-butter-cream text-xs sm:text-sm text-deep-navy">
                <strong className="block mb-1">{vi.habit.wizard.step2.tipTitle}</strong>
                <span>{vi.habit.wizard.step2.tipContent}</span>
              </div>
            </div>
          )}

          {/* ================= BƯỚC 3: CHỌN KỸ THUẬT ================= */}
          {draft.step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
                  {vi.habit.wizard.step3.title}
                </h3>
                <p className="text-sm sm:text-base text-deep-navy/80">
                  {vi.habit.wizard.step3.subtitle}
                </p>
                <p className="text-xs text-bright-magenta font-medium mt-1">
                  {vi.habit.wizard.step3.maxSelectionNotice}
                </p>
              </div>

              {/* 4 Giai đoạn */}
              {HABIT_STAGES.map((stage) => {
                const stageInfo = vi.habit.wizard.step3.stages[stage]
                const stageTechniques = techniques.filter((t) => t.stage === stage)
                const currentChosen = draft.chosenTechniques[stage] || []

                return (
                  <div
                    key={stage}
                    className="p-5 rounded-card bg-warm-ivory border border-lavender-mist space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h4 className="font-semibold text-deep-navy text-base">
                          {stageInfo.title}
                        </h4>
                        <span className="text-xs text-bright-magenta font-medium block">
                          {stageInfo.rule}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-deep-navy/70">
                        {vi.habit.wizard.step3.selectedCount(currentChosen.length)}
                      </span>
                    </div>
                    <p className="text-xs text-deep-navy/70">{stageInfo.desc}</p>

                    {/* Danh sách kỹ thuật thuộc giai đoạn */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {stageTechniques.length === 0 ? (
                        <p className="col-span-full py-4 text-center text-xs text-deep-navy/60 italic">
                          {vi.habit.wizard.step3.emptyTechniquesList}
                        </p>
                      ) : (
                        stageTechniques.map((tech) => {
                          const isSelected = currentChosen.some(
                            (item) => item.techniqueId === tech.id,
                          )
                          const chosenItem = currentChosen.find(
                            (item) => item.techniqueId === tech.id,
                          )

                          return (
                            <div
                              key={tech.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-white border-bright-magenta ring-1 ring-bright-magenta shadow-soft'
                                  : 'bg-white/80 border-lavender-mist hover:border-accent-pink/50'
                              }`}
                            >
                              <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleTechnique(stage, tech.id, tech.name)}
                                  className="mt-1 w-4 h-4 rounded text-bright-magenta focus:ring-bright-magenta"
                                />
                                <span className="text-sm font-medium text-deep-navy">
                                  {tech.name}
                                </span>
                              </label>

                              {/* Ô nhập hành động cụ thể nếu được chọn */}
                              {isSelected && chosenItem && (
                                <div className="mt-3 pt-2.5 border-t border-lavender-mist/50">
                                  <label className="block text-xs font-semibold text-deep-navy mb-1">
                                    {vi.habit.wizard.step3.actionPrompt}
                                  </label>
                                  <input
                                    type="text"
                                    value={chosenItem.action}
                                    onChange={(e) =>
                                      handleUpdateTechniqueAction(stage, tech.id, e.target.value)
                                    }
                                    placeholder={vi.habit.wizard.step3.actionPlaceholder}
                                    className="w-full px-3 py-1.5 text-xs rounded border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-1 focus:ring-bright-magenta"
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ================= BƯỚC 4: TRACKER 21 NGÀY & LƯU KẾ HOẠCH ================= */}
          {draft.step === 4 && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
                  {vi.habit.wizard.step4.title}
                </h3>
                <p className="text-sm sm:text-base text-deep-navy/80">
                  {vi.habit.wizard.step4.subtitle}
                </p>
              </div>

              {/* Xem trước câu định danh */}
              <div className="p-6 rounded-card bg-brand-gradient border border-lavender-mist text-center">
                <span className="text-xs uppercase tracking-wider text-bright-magenta font-semibold block mb-2">
                  {vi.habit.wizard.step4.identityHeading}
                </span>
                <p className="font-quote italic text-deep-navy text-xl sm:text-2xl font-bold mb-3">
                  &ldquo;{draft.identityStatement}&rdquo;
                </p>
                <p className="text-xs sm:text-sm text-deep-navy/70 max-w-md mx-auto">
                  {vi.habit.wizard.step4.encouragement}
                </p>
              </div>

              {/* Lưới 21 ngày */}
              <div className="p-5 rounded-card bg-warm-ivory border border-lavender-mist">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-deep-navy text-sm">
                    {vi.habit.wizard.step4.trackerPreviewHeading}
                  </h4>
                  <span className="text-xs text-bright-magenta font-medium">
                    {vi.habit.wizard.step4.continuousDays}
                  </span>
                </div>
                <ProgressGrid />
                <p className="text-xs text-deep-navy/60 text-center mt-3 italic">
                  {vi.habit.wizard.step4.reassurance}
                </p>
              </div>

              {/* Tóm tắt kỹ thuật đã chọn */}
              <div className="p-5 rounded-card bg-white border border-lavender-mist space-y-3">
                <h4 className="font-semibold text-deep-navy text-sm">
                  {vi.habit.wizard.step4.techniquesHeading}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {HABIT_STAGES.map((stage) => {
                    const list = draft.chosenTechniques[stage] || []
                    return (
                      <div key={stage} className="p-2.5 rounded-lg bg-warm-ivory">
                        <span className="font-bold text-deep-navy block mb-1">
                          {vi.habit.wizard.step3.stages[stage].title}:
                        </span>
                        {list.length === 0 ? (
                          <span className="text-deep-navy/50 italic">
                            {vi.habit.wizard.step4.notSelected}
                          </span>
                        ) : (
                          list.map((item) => (
                            <div key={item.techniqueId} className="text-deep-navy/80 mb-1">
                              • <strong>{item.action}</strong>
                            </div>
                          ))
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Form lưu kế hoạch & Nhận link Zalo */}
              <form
                onSubmit={handleSubmitPlan}
                className="p-6 rounded-card bg-soft-pink/40 border border-soft-pink space-y-4"
              >
                <div>
                  <h4 className="font-display text-lg text-deep-navy mb-1">
                    {vi.habit.wizard.step4.emailHeading}
                  </h4>
                  <p className="text-xs sm:text-sm text-deep-navy/80">
                    {vi.habit.wizard.step4.emailSubheading}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor={nameInputId}
                    className="block text-xs font-semibold text-deep-navy uppercase tracking-wider mb-1.5"
                  >
                    {vi.habit.wizard.step4.nameLabel}
                  </label>
                  <input
                    id={nameInputId}
                    type="text"
                    value={draft.name || ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={vi.habit.wizard.step4.namePlaceholder}
                    className="w-full px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta"
                  />
                </div>

                <div>
                  <label
                    htmlFor={emailInputId}
                    className="block text-xs font-semibold text-deep-navy uppercase tracking-wider mb-1.5"
                  >
                    {vi.habit.wizard.step4.emailLabel}
                  </label>
                  <input
                    id={emailInputId}
                    type="email"
                    required
                    value={draft.email || ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder={vi.habit.wizard.step4.emailPlaceholder}
                    className="w-full px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta"
                  />
                </div>

                {/* Honeypot field (hidden from real users) */}
                <input
                  type="text"
                  name="user_note"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                {/* Consent checkbox (Nghị định 13/2023) */}
                <div className="flex items-start gap-2.5">
                  <input
                    id={consentInputId}
                    type="checkbox"
                    required
                    checked={Boolean(draft.consent)}
                    onChange={(e) => setDraft((prev) => ({ ...prev, consent: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded text-bright-magenta focus:ring-bright-magenta"
                  />
                  <label
                    htmlFor={consentInputId}
                    className="text-xs text-deep-navy/80 leading-relaxed cursor-pointer"
                  >
                    {vi.habit.wizard.step4.consentLabel}{' '}
                    <Link
                      href="/chinh-sach-bao-mat"
                      target="_blank"
                      className="text-bright-magenta underline font-medium"
                    >
                      {vi.habit.wizard.step4.privacyPolicy}
                    </Link>
                  </label>
                </div>

                {/* Turnstile Captcha */}
                <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

                {/* Nút lưu */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full justify-center"
                >
                  {isSubmitting
                    ? vi.habit.wizard.step4.savingButton
                    : vi.habit.wizard.step4.saveButton}
                </Button>
              </form>
            </div>
          )}

          {/* Điều khiển chuyển bước */}
          <div className="mt-8 pt-6 border-t border-lavender-mist/60 flex items-center justify-between">
            {draft.step > 1 ? (
              <Button type="button" variant="secondary" onClick={handlePrevStep}>
                ← {vi.habit.wizard.controls.prev}
              </Button>
            ) : (
              <div />
            )}

            {draft.step < 4 ? (
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
