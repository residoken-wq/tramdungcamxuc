'use client'

import React, { useState, useId } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'
import { submitNewsletterAction } from '@/lib/forms/actions'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'

export interface NewsletterFormProps {
  version?: number
  title?: string
  description?: string
  submitLabel?: string
  consentText?: string
  bgColor?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  pageSlug?: string
  className?: string
  isDemo?: boolean
  puck?: {
    isEditing?: boolean
  }
}

const BG_COLOR_CLASSES: Record<string, string> = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
}

const PADDING_CLASSES: Record<string, string> = {
  none: 'py-0',
  sm: 'py-6 sm:py-8',
  md: 'py-12 sm:py-16',
  lg: 'py-16 sm:py-24',
  xl: 'py-20 sm:py-32',
}

export function NewsletterForm({
  title = vi.sm05.newsletter.defaultTitle,
  description = vi.sm05.newsletter.defaultDesc,
  submitLabel = vi.sm05.newsletter.defaultSubmit,
  consentText = vi.sm05.newsletter.defaultConsent,
  bgColor = 'warm-ivory',
  padding = 'md',
  pageSlug,
  className = '',
  isDemo = false,
}: NewsletterFormProps) {
  const id = useId()
  const emailInputId = `${id}-email`
  const nameInputId = `${id}-name`
  const consentInputId = `${id}-consent`
  const honeypotInputId = `${id}-nl-hp`

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      errors.email = vi.forms.validation.emailRequired
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = vi.forms.validation.emailInvalid
      }
    }

    if (name.trim().length > 100) {
      errors.name = vi.account.validation.nameMax100
    } else if (/[<>{}]|[\x00-\x1F\x7F]/.test(name.trim())) {
      errors.name = vi.account.validation.nameSpecialChars
    }

    if (!isDemo && !consent) {
      errors.consent = vi.forms.validation.consentRequired
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    if (isDemo) {
      setIsSuccess(true)
      return
    }

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const res = await submitNewsletterAction({
        email: email.trim(),
        name: name.trim() || undefined,
        consent,
        honeypot: honeypot.trim(),
        turnstileToken,
        pageSlug,
      })

      if (res.success) {
        setIsSuccess(true)
        // Privacy compliance: Do not send email or name to analytics
        track('lead_submitted', { need: 'resource', form: 'newsletter' })
      } else {
        setErrorMessage(res.error || vi.forms.serverError)
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors)
        }
      }
    } catch {
      setErrorMessage(vi.forms.serverError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const bgClass = BG_COLOR_CLASSES[bgColor] || 'bg-warm-ivory'
  const paddingClass = PADDING_CLASSES[padding] || 'py-12 sm:py-16'

  return (
    <section aria-label={title} className={`w-full ${bgClass} ${paddingClass} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card
          variant="white"
          className="w-full max-w-xl mx-auto p-6 sm:p-10 bg-white border border-lavender-mist shadow-sm"
        >
          {isSuccess ? (
            <div role="status" aria-live="polite" className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-mint-haze/60 text-deep-navy flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
                ✓
              </div>
              <h3 className="font-display uppercase tracking-tight text-2xl sm:text-3xl text-deep-navy mb-3">
                {vi.sm05.newsletter.successTitle}
              </h3>
              <p className="font-body text-base text-deep-navy/85 leading-relaxed">
                {vi.sm05.newsletter.successMessage}
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6 text-center">
                <h3 className="font-display uppercase tracking-tight text-2xl sm:text-3xl text-deep-navy">
                  {title}
                </h3>
                {description && (
                  <p className="mt-2.5 font-body text-sm sm:text-base text-deep-navy/75 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              {/* Server error alert */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-xl bg-soft-pink border border-bright-magenta/30 text-bright-magenta font-ui text-sm font-semibold text-center"
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                {/* Honeypot field (hidden) */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <label htmlFor={honeypotInputId}>Do not fill this</label>
                  <input
                    id={honeypotInputId}
                    type="text"
                    name="organization_newsletter_hp"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Email input (required) */}
                <div>
                  <label
                    htmlFor={emailInputId}
                    className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
                  >
                    {vi.sm05.newsletter.emailLabel} <span className="text-bright-magenta">*</span>
                  </label>
                  <input
                    id={emailInputId}
                    type="email"
                    required
                    disabled={isSubmitting}
                    placeholder={vi.sm05.newsletter.emailPlaceholder}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: '' }))
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border bg-warm-ivory/50 font-body text-base text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 focus:ring-bright-magenta focus:bg-white transition-all ${
                      fieldErrors.email ? 'border-bright-magenta' : 'border-lavender-mist'
                    } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? `${emailInputId}-err` : undefined}
                  />
                  {fieldErrors.email && (
                    <p
                      id={`${emailInputId}-err`}
                      role="alert"
                      className="mt-1 font-ui text-xs text-bright-magenta font-semibold"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Name input (optional) */}
                <div>
                  <label
                    htmlFor={nameInputId}
                    className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
                  >
                    {vi.sm05.newsletter.nameLabel}
                  </label>
                  <input
                    id={nameInputId}
                    type="text"
                    disabled={isSubmitting}
                    placeholder={vi.sm05.newsletter.namePlaceholder}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: '' }))
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border bg-warm-ivory/50 font-body text-base text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 focus:ring-bright-magenta focus:bg-white transition-all ${
                      fieldErrors.name ? 'border-bright-magenta' : 'border-lavender-mist'
                    } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? `${nameInputId}-err` : undefined}
                  />
                  {fieldErrors.name && (
                    <p
                      id={`${nameInputId}-err`}
                      role="alert"
                      className="mt-1 font-ui text-xs text-bright-magenta font-semibold"
                    >
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Consent checkbox (required) */}
                <div className="pt-1">
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
                        id={consentInputId}
                        type="checkbox"
                        disabled={isSubmitting}
                        checked={consent}
                        onChange={(e) => {
                          setConsent(e.target.checked)
                          if (fieldErrors.consent) {
                            setFieldErrors((prev) => ({ ...prev, consent: '' }))
                          }
                        }}
                        className="mt-1 h-5 w-5 rounded border-lavender-mist text-bright-magenta focus:ring-bright-magenta accent-bright-magenta cursor-pointer"
                      />
                    )}
                    <span className="font-body text-xs sm:text-sm text-deep-navy/80 leading-normal">
                      {consentText}{' '}
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
                  {fieldErrors.consent && (
                    <p
                      role="alert"
                      className="mt-1 font-ui text-xs text-bright-magenta font-semibold"
                    >
                      {fieldErrors.consent}
                    </p>
                  )}
                </div>

                {/* Cloudflare Turnstile */}
                {!isDemo && (
                  <TurnstileWidget
                    onVerify={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken('')}
                  />
                )}

                {/* Submit button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full min-h-[48px]"
                  >
                    {isSubmitting ? vi.sm05.newsletter.submitting : submitLabel}
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </section>
  )
}
