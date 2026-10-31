'use client'

import React, { useId } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { BoardingPassPreview } from '@/components/habit/BoardingPassPreview'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'
import { vi } from '@/lib/i18n/vi'
import {
  HABIT_STAGES,
  formatIdentityStatement,
  type HabitChosenTechnique,
  type PublicTechnique,
} from '@/lib/habit'
import type { HabitStage } from '@/lib/diagnostic'
import type { Weekday } from '@/lib/habit/rhythm'

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
  techniques: PublicTechnique[]
  name: string
  email: string
  consent: boolean
  honeypot: string
  isSubmitting: boolean
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
  chosenTechniques,
  selectedTechniqueIds,
  journeyDays,
  techniques,
  name,
  email,
  consent,
  honeypot,
  isSubmitting,
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

  const effectiveIdentity = identityStatement || formatIdentityStatement(actionText, personText)

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
          {vi.habit.wizard.step4.title(journeyDays)}
        </h2>
        <p className="text-sm sm:text-base text-deep-navy/80">
          {vi.habit.wizard.step4.subtitle(journeyDays)}
        </p>
      </div>

      {/* Xem trước câu định danh */}
      <div className="p-6 rounded-card bg-brand-gradient border border-lavender-mist text-center">
        <span className="text-xs uppercase tracking-wider text-bright-magenta font-semibold block mb-2">
          {vi.habit.wizard.step4.identityHeading}
        </span>
        <p className="font-quote italic text-deep-navy text-xl sm:text-2xl font-bold mb-3">
          &ldquo;{effectiveIdentity}&rdquo;
        </p>
        <p className="text-xs sm:text-sm text-deep-navy/70 max-w-md mx-auto">
          {vi.habit.wizard.step4.encouragement}
        </p>
      </div>

      {/* Tóm tắt kỹ thuật đã chọn */}
      <div className="p-5 rounded-card bg-white border border-lavender-mist space-y-3">
        <h3 className="font-semibold text-deep-navy text-sm">
          {vi.habit.wizard.step4.techniquesHeading}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {HABIT_STAGES.map((stage) => {
            const list = chosenTechniques[stage] || []
            return (
              <div key={stage} className="p-2.5 rounded-lg bg-warm-ivory">
                <span className="font-bold text-deep-navy block mb-1">
                  {vi.habit.wizard.step3.stages[stage].title}:
                </span>
                {list.length === 0 ? (
                  <span className="text-deep-navy/70 italic">
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

      {/* Boarding Pass xem trước & Tải ảnh (HB-10) */}
      <BoardingPassPreview
        identityStatement={effectiveIdentity}
        actionText={actionText || undefined}
        anchorHabit={anchorHabit || undefined}
        twoMinuteAction={twoMinuteAction || undefined}
        rhythmDays={rhythmDays}
        techniqueIds={selectedTechniqueIds}
        journeyDays={journeyDays}
        availableTechniques={techniques}
      />

      {/* Form lưu kế hoạch & Nhận link Zalo */}
      <form
        onSubmit={onSubmitPlan}
        className="p-6 rounded-card bg-soft-pink/40 border border-soft-pink space-y-4"
      >
        <div>
          <h3 className="font-display text-lg text-deep-navy mb-1">
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
        <TurnstileWidget onVerify={onTurnstileVerify} />

        {/* Nút lưu */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full justify-center"
        >
          {isSubmitting ? vi.habit.wizard.step4.savingButton : vi.habit.wizard.step4.saveButton}
        </Button>
      </form>
    </div>
  )
}

