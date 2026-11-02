'use client'

import React, { useId, useMemo, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { BoardingPassPreview } from '@/components/habit/BoardingPassPreview'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'
import { vi } from '@/lib/i18n/vi'
import {
  formatIdentityStatement,
  type HabitChosenTechnique,
  type PublicTechnique,
} from '@/lib/habit'
import type { HabitStage } from '@/lib/diagnostic'
import type { Weekday } from '@/lib/habit/rhythm'
import type { CleanStepQuote } from '@/lib/habit/journey-content.server'
import { fillBoardingCaption } from '@/lib/habit/flow-content'
import { formatStartDateVN } from '@/lib/habit/boarding-pass'
import { safeHref } from '@/lib/safe-href'

export interface StepBoardingPassProps {
  identityStatement: string
  actionText: string
  personText: string
  anchorHabit: string
  twoMinuteAction: string
  rhythmDays: Weekday[]
  chosenTechniques: Record<HabitStage, HabitChosenTechnique[]>
  selectedTechniqueIds: number[]
  journeyDays: number
  startDate?: string
  techniques: PublicTechnique[]
  name: string
  email: string
  consent: boolean
  honeypot: string
  isSubmitting: boolean
  privacyNote?: string | null
  quote?: CleanStepQuote | null
  captionTemplate?: string | null
  intro?: string | null
  onNameChange: (val: string) => void
  onEmailChange: (val: string) => void
  onConsentChange: (val: boolean) => void
  onHoneypotChange: (val: string) => void
  onTurnstileVerify: (token: string) => void
  onSubmitPlan: (e: React.FormEvent) => void
}

export function StepBoardingPass({
  identityStatement,
  actionText,
  personText,
  anchorHabit,
  twoMinuteAction,
  rhythmDays,
  chosenTechniques: _chosenTechniques,
  selectedTechniqueIds,
  journeyDays,
  startDate,
  techniques,
  name,
  email,
  consent,
  honeypot,
  isSubmitting,
  privacyNote,
  quote,
  captionTemplate,
  intro,
  onNameChange,
  onEmailChange,
  onConsentChange,
  onHoneypotChange,
  onTurnstileVerify,
  onSubmitPlan,
}: StepBoardingPassProps) {
  const nameInputId = useId()
  const emailInputId = useId()
  const consentInputId = useId()
  const fallbackTextareaId = useId()

  const [toastOpen, setToastOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [showFallbackCaption, setShowFallbackCaption] = useState(false)
  const fallbackTextareaRef = useRef<HTMLTextAreaElement>(null)

  const effectiveIdentity =
    identityStatement || formatIdentityStatement(actionText ?? '', personText ?? '')

  // HB-22: Điền caption gợi ý qua fillBoardingCaption chỉ với {tuyen_ngon}, {so_ngay}, {ngay_bat_dau}
  const filledCaption = useMemo(() => {
    if (!captionTemplate?.trim()) return ''
    return fillBoardingCaption(captionTemplate, {
      tuyen_ngon: effectiveIdentity,
      so_ngay: journeyDays,
      ngay_bat_dau: formatStartDateVN(startDate ?? new Date()),
    })
  }, [captionTemplate, effectiveIdentity, journeyDays, startDate])

  const handleCopyCaption = async () => {
    if (!filledCaption) return
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(filledCaption)
        setIsCopied(true)
        setToastOpen(true)
        setTimeout(() => setIsCopied(false), 3000)
      } else {
        setShowFallbackCaption(true)
      }
    } catch {
      setShowFallbackCaption(true)
    }
  }

  useEffect(() => {
    if (showFallbackCaption && fallbackTextareaRef.current) {
      fallbackTextareaRef.current.focus()
      fallbackTextareaRef.current.select()
    }
  }, [showFallbackCaption])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Tiêu đề, câu trích stepQuotes.boardingPass và boardingPass.intro */}
      <div>
        <h2 className="font-display text-xl sm:text-2xl !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy mb-1">
          {vi.hb22.stepTitle(journeyDays)}
        </h2>
        <p className="text-sm sm:text-base text-deep-navy/80">
          {vi.hb22.stepSubtitle(journeyDays)}
        </p>
      </div>

      {quote && quote.text && (
        <blockquote
          data-testid="boarding-pass-quote"
          className="rounded-2xl bg-lavender-mist/40 border border-lavender-mist p-4 sm:p-5 space-y-2"
        >
          <p className="font-quote italic text-base sm:text-lg text-deep-navy leading-relaxed">
            &ldquo;{quote.text}&rdquo;
          </p>
          <footer className="font-ui text-xs sm:text-sm text-deep-navy/80 font-medium">
            <span>— {quote.author}</span>
            <span> · </span>
            {quote.sourceUrl && safeHref(quote.sourceUrl) ? (
              <a
                href={safeHref(quote.sourceUrl)!}
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

      {intro && intro.trim() && (
        <div
          data-testid="boarding-pass-intro"
          className="p-4 rounded-xl bg-warm-ivory border border-lavender-mist font-ui text-xs sm:text-sm text-deep-navy/85 leading-relaxed"
        >
          {intro}
        </div>
      )}

      {/* 2 & 3. Xem trước Boarding Pass + 3 nút tải ảnh & sao chép caption */}
      <BoardingPassPreview
        identityStatement={effectiveIdentity}
        actionText={actionText || undefined}
        anchorHabit={anchorHabit || undefined}
        twoMinuteAction={twoMinuteAction || undefined}
        rhythmDays={rhythmDays}
        techniqueIds={selectedTechniqueIds}
        journeyDays={journeyDays}
        startDate={startDate}
        availableTechniques={techniques}
        caption={filledCaption || null}
        onCopyCaption={filledCaption ? handleCopyCaption : undefined}
        isCopied={isCopied}
      />

      {/* Ô sao chép thủ công dự phòng khi Clipboard API không hỗ trợ */}
      {showFallbackCaption && filledCaption && (
        <div
          data-testid="caption-fallback-box"
          className="p-4 rounded-xl bg-warm-ivory border border-lavender-mist space-y-2 animate-fade-in"
        >
          <div className="flex items-center justify-between text-xs text-deep-navy font-semibold">
            <label htmlFor={fallbackTextareaId}>{vi.hb22.captionFallbackLabel}</label>
            <button
              type="button"
              onClick={() => setShowFallbackCaption(false)}
              className="text-deep-navy/70 hover:text-deep-navy p-1"
              aria-label="Đóng ô sao chép"
            >
              ✕
            </button>
          </div>
          <textarea
            id={fallbackTextareaId}
            ref={fallbackTextareaRef}
            aria-label={vi.hb22.captionFallbackLabel}
            readOnly
            rows={4}
            value={filledCaption}
            onFocus={(e) => e.target.select()}
            className="w-full p-2.5 text-xs text-deep-navy bg-white rounded border border-lavender-mist focus:outline-none focus:ring-1 focus:ring-bright-magenta font-sans"
          />
          <p className="text-[11px] text-deep-navy/70 italic">{vi.hb22.captionFallbackHint}</p>
        </div>
      )}

      {/* Toast thông báo đã sao chép caption */}
      <Toast
        type="success"
        message={vi.hb22.copiedToast}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />

      {/* Form lưu kế hoạch & Nút chính Lên chuyến · Bắt đầu 28 ngày */}
      <form
        onSubmit={onSubmitPlan}
        className="p-6 rounded-card bg-soft-pink/40 border border-soft-pink space-y-4"
      >
        <div>
          <h3 className="font-display text-lg !leading-[var(--tdcx-title-lh,1.3)] text-deep-navy mb-1">
            {vi.habit.wizard.step4.emailHeading}
          </h3>
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
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
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
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder={vi.habit.wizard.step4.emailPlaceholder}
            className="w-full px-4 py-2.5 rounded-lg border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-2 focus:ring-bright-magenta"
          />
        </div>

        {/* Honeypot field (hidden from real users) */}
        <input
          type="text"
          name="user_note"
          value={honeypot}
          onChange={(e) => onHoneypotChange(e.target.value)}
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
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-bright-magenta focus:ring-bright-magenta cursor-pointer"
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
        <TurnstileWidget onVerify={onTurnstileVerify} />

        {/* Nút chính Lên chuyến · Bắt đầu 28 ngày */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full justify-center !text-[19px] !font-bold py-3.5 shadow-soft hover:bg-bright-magenta transition-colors"
        >
          {isSubmitting ? vi.hb22.savingButton : vi.hb22.startJourneyButton(journeyDays)}
        </Button>

        {privacyNote && (
          <p
            data-testid="boarding-pass-privacy-note"
            className="font-ui text-xs text-deep-navy/70 text-center leading-relaxed pt-2"
          >
            {privacyNote}
          </p>
        )}
      </form>
    </div>
  )
}
