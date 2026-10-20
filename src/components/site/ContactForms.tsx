'use client'

import React, { useState, useId, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'

export interface ContactFormsProps {
  version?: number
  layout?: 'tabs' | 'columns'
  titleB2C?: string
  descriptionB2C?: string
  submitLabelB2C?: string
  successTitleB2C?: string
  successMessageB2C?: string
  titleB2B?: string
  descriptionB2B?: string
  submitLabelB2B?: string
  successTitleB2B?: string
  successMessageB2B?: string
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  pageSlug?: string
  _resolved?: {
    services?: Array<{ id: number; name: string }>
    programs?: Array<{ id: number; name: string }>
    leadStatusOptions?: Array<{ label: string }>
  }
  puck?: {
    isEditing?: boolean
  }
  isDemo?: boolean
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function ContactForms({
  layout = 'columns',
  titleB2C = vi.sm06.contactForms.defaultB2CTitle,
  descriptionB2C = vi.sm06.contactForms.defaultB2CDescription,
  submitLabelB2C = vi.sm06.contactForms.submitB2C,
  successTitleB2C = vi.sm06.contactForms.successTitle,
  successMessageB2C = vi.sm06.contactForms.defaultSuccessMessageB2C,
  titleB2B = vi.sm06.contactForms.defaultB2BTitle,
  descriptionB2B = vi.sm06.contactForms.defaultB2BDescription,
  submitLabelB2B = vi.sm06.contactForms.submitB2B,
  successTitleB2B = vi.sm06.contactForms.successTitle,
  successMessageB2B = vi.sm06.contactForms.defaultSuccessMessageB2B,
  bgColor = 'warm-ivory',
  padding = 'md',
  pageSlug,
  _resolved,
  isDemo = false,
}: ContactFormsProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const id = useId()

  // Tabs state
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal')
  const tabPersonalRef = useRef<HTMLButtonElement>(null)
  const tabBusinessRef = useRef<HTMLButtonElement>(null)

  // B2C Form State
  const [b2cName, setB2cName] = useState('')
  const [b2cEmail, setB2cEmail] = useState('')
  const [b2cPhone, setB2cPhone] = useState('')
  const [b2cService, setB2cService] = useState('')
  const [b2cStatus, setB2cStatus] = useState('')
  const [b2cMessage, setB2cMessage] = useState('')
  const [b2cConsent, setB2cConsent] = useState(false)
  const [b2cHoneypot, setB2cHoneypot] = useState('')
  const [b2cTurnstileToken, setB2cTurnstileToken] = useState<string | undefined>(undefined)
  const [b2cStatusState, setB2cStatusState] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [b2cErrors, setB2cErrors] = useState<Record<string, string>>({})
  const [b2cServerError, setB2cServerError] = useState<string | null>(null)

  // B2B Form State
  const [b2bName, setB2bName] = useState('')
  const [b2bEmail, setB2bEmail] = useState('')
  const [b2bPhone, setB2bPhone] = useState('')
  const [b2bCompany, setB2bCompany] = useState('')
  const [b2bContactRole, setB2bContactRole] = useState('')
  const [b2bTeamSize, setB2bTeamSize] = useState('')
  const [b2bProgram, setB2bProgram] = useState('')
  const [b2bTargetBehaviors, setB2bTargetBehaviors] = useState('')
  const [b2bTimeline, setB2bTimeline] = useState('')
  const [b2bMessage, setB2bMessage] = useState('')
  const [b2bConsent, setB2bConsent] = useState(false)
  const [b2bHoneypot, setB2bHoneypot] = useState('')
  const [b2bTurnstileToken, setB2bTurnstileToken] = useState<string | undefined>(undefined)
  const [b2bStatusState, setB2bStatusState] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [b2bErrors, setB2bErrors] = useState<Record<string, string>>({})
  const [b2bServerError, setB2bServerError] = useState<string | null>(null)

  const services = _resolved?.services || []
  const programs = _resolved?.programs || []
  const leadStatusOptions = _resolved?.leadStatusOptions || []

  // Keyboard navigation for tablist
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: 'personal' | 'business') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      if (currentTab === 'personal') {
        setActiveTab('business')
        tabBusinessRef.current?.focus()
      } else {
        setActiveTab('personal')
        tabPersonalRef.current?.focus()
      }
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveTab('personal')
      tabPersonalRef.current?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveTab('business')
      tabBusinessRef.current?.focus()
    }
  }

  // Validate B2C
  const validateB2C = (): boolean => {
    const errs: Record<string, string> = {}
    if (!b2cName.trim()) {
      errs.name = vi.forms.validation.nameRequired
    }
    if (!b2cEmail.trim()) {
      errs.email = vi.forms.validation.emailRequired
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(b2cEmail.trim())) {
        errs.email = vi.forms.validation.emailInvalid
      }
    }
    if (!b2cMessage.trim()) {
      errs.message = vi.forms.validation.messageRequired
    }
    if (!isDemo && !b2cConsent) {
      errs.consent = vi.forms.validation.consentRequired
    }
    setB2cErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit B2C
  const handleSubmitB2C = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setB2cServerError(null)

    if (isDemo) {
      setB2cStatusState('success')
      return
    }

    if (b2cHoneypot.trim() !== '') {
      setB2cStatusState('success')
      return
    }

    if (!validateB2C()) return

    setB2cStatusState('submitting')
    try {
      const { submitCoachingAction } = await import('@/lib/forms/actions')
      const res = await submitCoachingAction(
        {
          name: b2cName.trim(),
          email: b2cEmail.trim(),
          phone: b2cPhone.trim() || undefined,
          service: b2cService ? Number(b2cService) : undefined,
          currentStatus: b2cStatus.trim() || undefined,
          message: b2cMessage.trim(),
          consent: b2cConsent,
          honeypot: b2cHoneypot.trim(),
          turnstileToken: b2cTurnstileToken,
          form: 'contact-b2c',
          page: pageSlug,
        },
        { form: 'contact-b2c', page: pageSlug },
      )

      if (res.success) {
        setB2cStatusState('success')
        track('lead_submitted', { need: 'personal' })
      } else {
        setB2cStatusState('error')
        setB2cServerError(res.error || vi.forms.serverError)
        if (res.fieldErrors) setB2cErrors(res.fieldErrors)
      }
    } catch {
      setB2cStatusState('error')
      setB2cServerError(vi.forms.serverError)
    }
  }

  // Validate B2B
  const validateB2B = (): boolean => {
    const errs: Record<string, string> = {}
    if (!b2bName.trim()) {
      errs.name = vi.forms.validation.nameRequired
    }
    if (!b2bEmail.trim()) {
      errs.email = vi.forms.validation.emailRequired
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(b2bEmail.trim())) {
        errs.email = vi.forms.validation.emailInvalid
      }
    }
    if (!b2bCompany.trim()) {
      errs.company = vi.forms.validation.companyRequired
    }
    if (!isDemo && !b2bConsent) {
      errs.consent = vi.forms.validation.consentRequired
    }
    setB2bErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit B2B
  const handleSubmitB2B = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setB2bServerError(null)

    if (isDemo) {
      setB2bStatusState('success')
      return
    }

    if (b2bHoneypot.trim() !== '') {
      setB2bStatusState('success')
      return
    }

    if (!validateB2B()) return

    setB2bStatusState('submitting')
    try {
      const { submitB2BBriefAction } = await import('@/lib/forms/actions')
      const res = await submitB2BBriefAction(
        {
          name: b2bName.trim(),
          email: b2bEmail.trim(),
          phone: b2bPhone.trim() || undefined,
          company: b2bCompany.trim(),
          contactRole: b2bContactRole.trim() || undefined,
          teamSize: b2bTeamSize.trim() || undefined,
          interestedProgram: b2bProgram ? Number(b2bProgram) : undefined,
          targetBehaviors: b2bTargetBehaviors.trim() || undefined,
          timeline: b2bTimeline.trim() || undefined,
          message: b2bMessage.trim() || undefined,
          consent: b2bConsent,
          honeypot: b2bHoneypot.trim(),
          turnstileToken: b2bTurnstileToken,
          form: 'contact-b2b',
          page: pageSlug,
        },
        { form: 'contact-b2b', page: pageSlug },
      )

      if (res.success) {
        setB2bStatusState('success')
        track('b2b_brief_submitted', { company: b2bCompany.trim() })
      } else {
        setB2bStatusState('error')
        setB2bServerError(res.error || vi.forms.serverError)
        if (res.fieldErrors) setB2bErrors(res.fieldErrors)
      }
    } catch {
      setB2bStatusState('error')
      setB2bServerError(vi.forms.serverError)
    }
  }

  const cardBgClass = isDeepNavy
    ? 'bg-white/10 border-white/20 text-white shadow-soft'
    : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
  const textMutedClass = isDeepNavy ? 'text-white/70' : 'text-deep-navy/70'
  const inputBgClass = isDeepNavy
    ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-soft-pink focus:bg-white/15'
    : 'bg-warm-ivory/60 border-lavender-mist text-deep-navy placeholder:text-deep-navy/40 focus:border-bright-magenta focus:bg-white'

  // Render B2C Form Content
  const renderB2CForm = () => (
    <div className={`rounded-card p-6 sm:p-8 border ${cardBgClass}`}>
      {b2cStatusState === 'success' ? (
        <div role="status" aria-live="polite" className="text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-mint-haze text-deep-navy flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
            ✓
          </div>
          <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-bright-magenta">
            {successTitleB2C}
          </h3>
          <p className={`font-ui text-base leading-relaxed max-w-md mx-auto ${textMutedClass}`}>
            {successMessageB2C}
          </p>
          <div className="pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setB2cStatusState('idle')
                setB2cMessage('')
              }}
            >
              Gửi thêm tin nhắn khác
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-deep-navy mb-2">
              {titleB2C}
            </h3>
            {descriptionB2C && (
              <p className={`font-ui text-sm sm:text-base leading-relaxed ${textMutedClass}`}>
                {descriptionB2C}
              </p>
            )}
          </div>

          {b2cServerError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-soft-pink border border-bright-magenta/30 text-bright-magenta font-ui text-sm font-semibold"
            >
              {b2cServerError}
            </div>
          )}

          <form onSubmit={handleSubmitB2C} noValidate className="space-y-4 sm:space-y-5">
            {/* Honeypot field */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor={`${id}-b2c-hp`}>Do not fill this</label>
              <input
                id={`${id}-b2c-hp`}
                type="text"
                name="b2c_organization_hp"
                value={b2cHoneypot}
                onChange={(e) => setB2cHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Họ và tên */}
            <div>
              <label
                htmlFor={`${id}-b2c-name`}
                className="block font-ui text-sm font-bold mb-1.5"
              >
                {vi.sm06.contactForms.nameLabel} <span className="text-bright-magenta">*</span>
              </label>
              <input
                id={`${id}-b2c-name`}
                type="text"
                required
                disabled={b2cStatusState === 'submitting'}
                placeholder={vi.sm06.contactForms.namePlaceholder}
                value={b2cName}
                onChange={(e) => {
                  setB2cName(e.target.value)
                  if (b2cErrors.name) setB2cErrors((prev) => ({ ...prev, name: '' }))
                }}
                className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass} ${
                  b2cErrors.name ? 'border-bright-magenta' : ''
                }`}
                aria-invalid={Boolean(b2cErrors.name)}
                aria-describedby={b2cErrors.name ? `${id}-b2c-name-err` : undefined}
              />
              {b2cErrors.name && (
                <p id={`${id}-b2c-name-err`} role="alert" className="mt-1 font-ui text-xs text-bright-magenta font-semibold">
                  {b2cErrors.name}
                </p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${id}-b2c-email`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.emailLabel} <span className="text-bright-magenta">*</span>
                </label>
                <input
                  id={`${id}-b2c-email`}
                  type="email"
                  required
                  disabled={b2cStatusState === 'submitting'}
                  placeholder={vi.sm06.contactForms.emailPlaceholder}
                  value={b2cEmail}
                  onChange={(e) => {
                    setB2cEmail(e.target.value)
                    if (b2cErrors.email) setB2cErrors((prev) => ({ ...prev, email: '' }))
                  }}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass} ${
                    b2cErrors.email ? 'border-bright-magenta' : ''
                  }`}
                  aria-invalid={Boolean(b2cErrors.email)}
                  aria-describedby={b2cErrors.email ? `${id}-b2c-email-err` : undefined}
                />
                {b2cErrors.email && (
                  <p id={`${id}-b2c-email-err`} role="alert" className="mt-1 font-ui text-xs text-bright-magenta font-semibold">
                    {b2cErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${id}-b2c-phone`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.phoneLabel}
                </label>
                <input
                  id={`${id}-b2c-phone`}
                  type="tel"
                  disabled={b2cStatusState === 'submitting'}
                  placeholder={vi.sm06.contactForms.phonePlaceholder}
                  value={b2cPhone}
                  onChange={(e) => setB2cPhone(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass}`}
                />
              </div>
            </div>

            {/* Service & Current Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${id}-b2c-service`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.serviceLabel}
                </label>
                <select
                  id={`${id}-b2c-service`}
                  disabled={b2cStatusState === 'submitting'}
                  value={b2cService}
                  onChange={(e) => setB2cService(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass}`}
                >
                  <option value="">{vi.sm06.contactForms.serviceUncertain}</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {leadStatusOptions.length > 0 && (
                <div>
                  <label
                    htmlFor={`${id}-b2c-status`}
                    className="block font-ui text-sm font-bold mb-1.5"
                  >
                    {vi.sm06.contactForms.currentStatusLabel}
                  </label>
                  <select
                    id={`${id}-b2c-status`}
                    disabled={b2cStatusState === 'submitting'}
                    value={b2cStatus}
                    onChange={(e) => setB2cStatus(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass}`}
                  >
                    <option value="">{vi.sm06.contactForms.currentStatusPlaceholder}</option>
                    {leadStatusOptions.map((opt, i) => (
                      <option key={i} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Lời nhắn / trăn trở */}
            <div>
              <label
                htmlFor={`${id}-b2c-message`}
                className="block font-ui text-sm font-bold mb-1.5"
              >
                {vi.sm06.contactForms.messageB2CLabel} <span className="text-bright-magenta">*</span>
              </label>
              <textarea
                id={`${id}-b2c-message`}
                required
                rows={4}
                maxLength={2000}
                disabled={b2cStatusState === 'submitting'}
                placeholder={vi.sm06.contactForms.messageB2CPlaceholder}
                value={b2cMessage}
                onChange={(e) => {
                  setB2cMessage(e.target.value)
                  if (b2cErrors.message) setB2cErrors((prev) => ({ ...prev, message: '' }))
                }}
                className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass} ${
                  b2cErrors.message ? 'border-bright-magenta' : ''
                }`}
                aria-invalid={Boolean(b2cErrors.message)}
                aria-describedby={b2cErrors.message ? `${id}-b2c-msg-err` : undefined}
              />
              {b2cErrors.message && (
                <p id={`${id}-b2c-msg-err`} role="alert" className="mt-1 font-ui text-xs text-bright-magenta font-semibold">
                  {b2cErrors.message}
                </p>
              )}
            </div>

            {/* Turnstile Widget */}
            {!isDemo && (
              <TurnstileWidget
                onVerify={(token) => setB2cTurnstileToken(token)}
                onError={() => setB2cTurnstileToken(undefined)}
                onExpire={() => setB2cTurnstileToken(undefined)}
              />
            )}

            {/* Consent checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                {isDemo ? (
                  <span
                    className="mt-1 h-5 w-5 rounded border border-deep-navy/30 bg-white inline-flex items-center justify-center text-xs text-bright-magenta flex-shrink-0"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                ) : (
                  <input
                    id={`${id}-b2c-consent`}
                    type="checkbox"
                    disabled={b2cStatusState === 'submitting'}
                    checked={b2cConsent}
                    onChange={(e) => {
                      setB2cConsent(e.target.checked)
                      if (b2cErrors.consent) setB2cErrors((prev) => ({ ...prev, consent: '' }))
                    }}
                    className="mt-1 h-5 w-5 rounded border-lavender-mist text-bright-magenta focus:ring-bright-magenta accent-bright-magenta cursor-pointer"
                  />
                )}
                <span className={`font-ui text-xs sm:text-sm leading-normal ${textMutedClass}`}>
                  {vi.sm06.contactForms.consentText}{' '}
                  <Link
                    href="/chinh-sach-bao-mat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bright-magenta font-semibold underline underline-offset-2 hover:text-deep-navy"
                  >
                    {vi.resource.privacyPolicy}
                  </Link>
                  . <span className="text-bright-magenta">*</span>
                </span>
              </label>
              {b2cErrors.consent && (
                <p role="alert" className="mt-1 font-ui text-xs text-bright-magenta font-semibold">
                  {b2cErrors.consent}
                </p>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={b2cStatusState === 'submitting'}
                className="w-full text-center"
              >
                {b2cStatusState === 'submitting'
                  ? vi.sm06.contactForms.submitting
                  : submitLabelB2C}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )

  // Render B2B Form Content
  const renderB2BForm = () => (
    <div className={`rounded-card p-6 sm:p-8 border ${cardBgClass}`}>
      {b2bStatusState === 'success' ? (
        <div role="status" aria-live="polite" className="text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-mint-haze text-deep-navy flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
            ✓
          </div>
          <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-bright-magenta">
            {successTitleB2B}
          </h3>
          <p className={`font-ui text-base leading-relaxed max-w-md mx-auto ${textMutedClass}`}>
            {successMessageB2B}
          </p>
          <div className="pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setB2bStatusState('idle')
                setB2bMessage('')
              }}
            >
              Gửi thêm yêu cầu khác
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-deep-navy mb-2">
              {titleB2B}
            </h3>
            {descriptionB2B && (
              <p className={`font-ui text-sm sm:text-base leading-relaxed ${textMutedClass}`}>
                {descriptionB2B}
              </p>
            )}
          </div>

          {b2bServerError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-soft-pink border border-bright-magenta/30 text-bright-magenta font-ui text-sm font-semibold"
            >
              {b2bServerError}
            </div>
          )}

          <form onSubmit={handleSubmitB2B} noValidate className="space-y-4 sm:space-y-5">
            {/* Honeypot field */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor={`${id}-b2b-hp`}>Do not fill this</label>
              <input
                id={`${id}-b2b-hp`}
                type="text"
                name="b2b_organization_hp"
                value={b2bHoneypot}
                onChange={(e) => setB2bHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Họ và tên */}
            <div>
              <label
                htmlFor={`${id}-b2b-name`}
                className="block font-ui text-sm font-bold mb-1.5"
              >
                {vi.sm06.contactForms.nameLabel} <span className="text-bright-magenta">*</span>
              </label>
              <input
                id={`${id}-b2b-name`}
                type="text"
                required
                disabled={b2bStatusState === 'submitting'}
                placeholder={vi.sm06.contactForms.namePlaceholder}
                value={b2bName}
                onChange={(e) => {
                  setB2bName(e.target.value)
                  if (b2bErrors.name) setB2bErrors((prev) => ({ ...prev, name: '' }))
                }}
                className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass} ${
                  b2bErrors.name ? 'border-bright-magenta' : ''
                }`}
                aria-invalid={Boolean(b2bErrors.name)}
                aria-describedby={b2bErrors.name ? `${id}-b2b-name-err` : undefined}
              />
              {b2bErrors.name && (
                <p id={`${id}-b2b-name-err`} role="alert" className="mt-1 font-ui text-xs text-bright-magenta font-semibold">
                  {b2bErrors.name}
                </p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${id}-b2b-email`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.emailLabel} <span className="text-bright-magenta">*</span>
                </label>
                <input
                  id={`${id}-b2b-email`}
                  type="email"
                  required
                  disabled={b2bStatusState === 'submitting'}
                  placeholder={vi.sm06.contactForms.emailPlaceholder}
                  value={b2bEmail}
                  onChange={(e) => {
                    setB2bEmail(e.target.value)
                    if (b2bErrors.email) setB2bErrors((prev) => ({ ...prev, email: '' }))
                  }}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass} ${
                    b2bErrors.email ? 'border-bright-magenta' : ''
                  }`}
                  aria-invalid={Boolean(b2bErrors.email)}
                  aria-describedby={b2bErrors.email ? `${id}-b2b-email-err` : undefined}
                />
                {b2bErrors.email && (
                  <p id={`${id}-b2b-email-err`} role="alert" className="mt-1 font-ui text-xs text-bright-magenta font-semibold">
                    {b2bErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${id}-b2b-phone`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.phoneLabel}
                </label>
                <input
                  id={`${id}-b2b-phone`}
                  type="tel"
                  disabled={b2bStatusState === 'submitting'}
                  placeholder={vi.sm06.contactForms.phonePlaceholder}
                  value={b2bPhone}
                  onChange={(e) => setB2bPhone(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass}`}
                />
              </div>
            </div>

            {/* Công ty & Vai trò */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${id}-b2b-company`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.companyLabel} <span className="text-bright-magenta">*</span>
                </label>
                <input
                  id={`${id}-b2b-company`}
                  type="text"
                  required
                  disabled={b2bStatusState === 'submitting'}
                  placeholder={vi.sm06.contactForms.companyPlaceholder}
                  value={b2bCompany}
                  onChange={(e) => {
                    setB2bCompany(e.target.value)
                    if (b2bErrors.company) setB2bErrors((prev) => ({ ...prev, company: '' }))
                  }}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass} ${
                    b2bErrors.company ? 'border-bright-magenta' : ''
                  }`}
                  aria-invalid={Boolean(b2bErrors.company)}
                  aria-describedby={b2bErrors.company ? `${id}-b2b-comp-err` : undefined}
                />
                {b2bErrors.company && (
                  <p id={`${id}-b2b-comp-err`} role="alert" className="mt-1 font-ui text-xs text-bright-magenta font-semibold">
                    {b2bErrors.company}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${id}-b2b-role`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.contactRoleLabel}
                </label>
                <input
                  id={`${id}-b2b-role`}
                  type="text"
                  disabled={b2bStatusState === 'submitting'}
                  placeholder={vi.sm06.contactForms.contactRolePlaceholder}
                  value={b2bContactRole}
                  onChange={(e) => setB2bContactRole(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass}`}
                />
              </div>
            </div>

            {/* Quy mô & Chương trình quan tâm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${id}-b2b-teamsize`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.teamSizeLabel}
                </label>
                <input
                  id={`${id}-b2b-teamsize`}
                  type="text"
                  disabled={b2bStatusState === 'submitting'}
                  placeholder={vi.sm06.contactForms.teamSizePlaceholder}
                  value={b2bTeamSize}
                  onChange={(e) => setB2bTeamSize(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass}`}
                />
              </div>

              <div>
                <label
                  htmlFor={`${id}-b2b-program`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.programLabel}
                </label>
                <select
                  id={`${id}-b2b-program`}
                  disabled={b2bStatusState === 'submitting'}
                  value={b2bProgram}
                  onChange={(e) => setB2bProgram(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass}`}
                >
                  <option value="">{vi.sm06.contactForms.programUncertain}</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hành vi mục tiêu & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${id}-b2b-behaviors`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.targetBehaviorsLabel}
                </label>
                <input
                  id={`${id}-b2b-behaviors`}
                  type="text"
                  disabled={b2bStatusState === 'submitting'}
                  placeholder={vi.sm06.contactForms.targetBehaviorsPlaceholder}
                  value={b2bTargetBehaviors}
                  onChange={(e) => setB2bTargetBehaviors(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass}`}
                />
              </div>

              <div>
                <label
                  htmlFor={`${id}-b2b-timeline`}
                  className="block font-ui text-sm font-bold mb-1.5"
                >
                  {vi.sm06.contactForms.timelineLabel}
                </label>
                <input
                  id={`${id}-b2b-timeline`}
                  type="text"
                  disabled={b2bStatusState === 'submitting'}
                  placeholder={vi.sm06.contactForms.timelinePlaceholder}
                  value={b2bTimeline}
                  onChange={(e) => setB2bTimeline(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass}`}
                />
              </div>
            </div>

            {/* Lời nhắn thêm */}
            <div>
              <label
                htmlFor={`${id}-b2b-message`}
                className="block font-ui text-sm font-bold mb-1.5"
              >
                {vi.sm06.contactForms.messageB2BLabel}
              </label>
              <textarea
                id={`${id}-b2b-message`}
                rows={3}
                maxLength={2000}
                disabled={b2bStatusState === 'submitting'}
                placeholder={vi.sm06.contactForms.messageB2BPlaceholder}
                value={b2bMessage}
                onChange={(e) => setB2bMessage(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border font-ui text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-pink ${inputBgClass}`}
              />
            </div>

            {/* Turnstile Widget */}
            {!isDemo && (
              <TurnstileWidget
                onVerify={(token) => setB2bTurnstileToken(token)}
                onError={() => setB2bTurnstileToken(undefined)}
                onExpire={() => setB2bTurnstileToken(undefined)}
              />
            )}

            {/* Consent checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                {isDemo ? (
                  <span
                    className="mt-1 h-5 w-5 rounded border border-deep-navy/30 bg-white inline-flex items-center justify-center text-xs text-bright-magenta flex-shrink-0"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                ) : (
                  <input
                    id={`${id}-b2b-consent`}
                    type="checkbox"
                    disabled={b2bStatusState === 'submitting'}
                    checked={b2bConsent}
                    onChange={(e) => {
                      setB2bConsent(e.target.checked)
                      if (b2bErrors.consent) setB2bErrors((prev) => ({ ...prev, consent: '' }))
                    }}
                    className="mt-1 h-5 w-5 rounded border-lavender-mist text-bright-magenta focus:ring-bright-magenta accent-bright-magenta cursor-pointer"
                  />
                )}
                <span className={`font-ui text-xs sm:text-sm leading-normal ${textMutedClass}`}>
                  {vi.sm06.contactForms.consentText}{' '}
                  <Link
                    href="/chinh-sach-bao-mat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bright-magenta font-semibold underline underline-offset-2 hover:text-deep-navy"
                  >
                    {vi.resource.privacyPolicy}
                  </Link>
                  . <span className="text-bright-magenta">*</span>
                </span>
              </label>
              {b2bErrors.consent && (
                <p role="alert" className="mt-1 font-ui text-xs text-bright-magenta font-semibold">
                  {b2bErrors.consent}
                </p>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={b2bStatusState === 'submitting'}
                className="w-full text-center"
              >
                {b2bStatusState === 'submitting'
                  ? vi.sm06.contactForms.submitting
                  : submitLabelB2B}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {layout === 'tabs' ? (
          <div className="max-w-2xl mx-auto">
            {/* Tab Header List */}
            <div
              role="tablist"
              aria-label="Hình thức liên hệ"
              className="flex items-center justify-center p-1.5 rounded-2xl bg-lavender-mist/50 border border-deep-navy/10 mb-8 max-w-md mx-auto"
            >
              <button
                ref={tabPersonalRef}
                type="button"
                id={`${id}-tab-personal`}
                role="tab"
                aria-selected={activeTab === 'personal'}
                aria-controls={`${id}-panel-personal`}
                tabIndex={activeTab === 'personal' ? 0 : -1}
                onClick={() => setActiveTab('personal')}
                onKeyDown={(e) => handleTabKeyDown(e, 'personal')}
                className={`flex-1 py-3 px-6 rounded-xl font-ui text-sm sm:text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink ${
                  activeTab === 'personal'
                    ? 'bg-deep-navy text-white shadow-soft'
                    : 'text-deep-navy/80 hover:text-deep-navy'
                }`}
              >
                {vi.sm06.contactForms.tabPersonal}
              </button>
              <button
                ref={tabBusinessRef}
                type="button"
                id={`${id}-tab-business`}
                role="tab"
                aria-selected={activeTab === 'business'}
                aria-controls={`${id}-panel-business`}
                tabIndex={activeTab === 'business' ? 0 : -1}
                onClick={() => setActiveTab('business')}
                onKeyDown={(e) => handleTabKeyDown(e, 'business')}
                className={`flex-1 py-3 px-6 rounded-xl font-ui text-sm sm:text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink ${
                  activeTab === 'business'
                    ? 'bg-deep-navy text-white shadow-soft'
                    : 'text-deep-navy/80 hover:text-deep-navy'
                }`}
              >
                {vi.sm06.contactForms.tabBusiness}
              </button>
            </div>

            {/* Panels */}
            <div
              id={`${id}-panel-personal`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-personal`}
              hidden={activeTab !== 'personal'}
            >
              {renderB2CForm()}
            </div>

            <div
              id={`${id}-panel-business`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-business`}
              hidden={activeTab !== 'business'}
            >
              {renderB2BForm()}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {renderB2CForm()}
            {renderB2BForm()}
          </div>
        )}
      </div>
    </section>
  )
}
