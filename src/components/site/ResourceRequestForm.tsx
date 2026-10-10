'use client'

import React, { useState, useId } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'
import { submitResourceRequestAction } from '@/lib/forms/actions'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'

export interface ResourceRequestFormProps {
  slug: string
  productName: string
  className?: string
}

export function ResourceRequestForm({
  slug,
  productName,
  className = '',
}: ResourceRequestFormProps) {
  const id = useId()
  const nameInputId = `${id}-name`
  const emailInputId = `${id}-email`
  const consentInputId = `${id}-consent`
  const honeypotInputId = `${id}-hp`

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!name.trim()) {
      errors.name = vi.forms.validation.nameRequired
    }
    if (!email.trim()) {
      errors.email = vi.forms.validation.emailRequired
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        errors.email = vi.forms.validation.emailInvalid
      }
    }
    if (!consent) {
      errors.consent = vi.forms.validation.consentRequired
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const res = await submitResourceRequestAction({
        name,
        email,
        slug,
        consent,
        honeypot,
        turnstileToken,
      })

      if (res.success) {
        setIsSuccess(true)
        track('lead_submitted', { resource: slug, productName })
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

  if (isSuccess) {
    return (
      <Card
        variant="white"
        className={`w-full max-w-xl mx-auto p-6 sm:p-8 bg-white border-2 border-mint-haze shadow-sm text-center ${className}`}
      >
        <div className="w-16 h-16 rounded-full bg-mint-haze/60 text-deep-navy flex items-center justify-center mx-auto mb-4 text-2xl">
          ✓
        </div>
        <h3 className="font-display uppercase tracking-tight text-2xl sm:text-3xl text-deep-navy mb-3">
          {vi.resource.successTitle}
        </h3>
        <p className="font-body text-base text-deep-navy/85 leading-relaxed mb-6">
          {vi.forms.success.resource}
        </p>
        <p className="font-body text-xs text-deep-navy/60 italic">{vi.resource.successNote}</p>
      </Card>
    )
  }

  return (
    <Card
      variant="white"
      className={`w-full max-w-xl mx-auto p-6 sm:p-8 bg-white border border-lavender-mist shadow-sm ${className}`}
    >
      <div className="mb-6 text-center">
        <h3 className="font-display uppercase tracking-tight text-2xl sm:text-3xl text-deep-navy">
          {vi.resource.formTitle}
        </h3>
        <p className="mt-2 font-body text-sm text-deep-navy/75">{vi.resource.formSubtitle}</p>
      </div>

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
            name="honeypot"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Name input */}
        <div>
          <label
            htmlFor={nameInputId}
            className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
          >
            {vi.resource.nameLabel} <span className="text-bright-magenta">*</span>
          </label>
          <input
            id={nameInputId}
            type="text"
            required
            placeholder={vi.resource.namePlaceholder}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: '' }))
              }
            }}
            className={`w-full px-4 py-3 rounded-xl border bg-warm-ivory/50 font-body text-base text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 focus:ring-bright-magenta focus:bg-white transition-all ${
              fieldErrors.name ? 'border-bright-magenta' : 'border-lavender-mist'
            }`}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? `${nameInputId}-err` : undefined}
          />
          {fieldErrors.name && (
            <p
              id={`${nameInputId}-err`}
              className="mt-1 font-ui text-xs text-bright-magenta font-medium"
            >
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Email input */}
        <div>
          <label
            htmlFor={emailInputId}
            className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
          >
            {vi.resource.emailLabel} <span className="text-bright-magenta">*</span>
          </label>
          <input
            id={emailInputId}
            type="email"
            required
            placeholder={vi.resource.emailPlaceholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: '' }))
              }
            }}
            className={`w-full px-4 py-3 rounded-xl border bg-warm-ivory/50 font-body text-base text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 focus:ring-bright-magenta focus:bg-white transition-all ${
              fieldErrors.email ? 'border-bright-magenta' : 'border-lavender-mist'
            }`}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? `${emailInputId}-err` : undefined}
          />
          {fieldErrors.email && (
            <p
              id={`${emailInputId}-err`}
              className="mt-1 font-ui text-xs text-bright-magenta font-medium"
            >
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Consent checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              id={consentInputId}
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                if (fieldErrors.consent) {
                  setFieldErrors((prev) => ({ ...prev, consent: '' }))
                }
              }}
              className="mt-1 h-5 w-5 rounded border-lavender-mist text-bright-magenta focus:ring-bright-magenta accent-bright-magenta cursor-pointer"
            />
            <span className="font-body text-xs sm:text-sm text-deep-navy/80 leading-normal">
              {vi.resource.privacyConsent}{' '}
              <Link
                href="/chinh-sach-bao-mat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-bright-magenta font-semibold underline underline-offset-2 hover:text-deep-navy"
              >
                {vi.resource.privacyPolicy}
              </Link>
              {vi.resource.privacyConsentEnd}
            </span>
          </label>
          {fieldErrors.consent && (
            <p className="mt-1 font-ui text-xs text-bright-magenta font-medium">
              {fieldErrors.consent}
            </p>
          )}
        </div>

        {/* Cloudflare Turnstile */}
        <TurnstileWidget
          onVerify={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken('')}
        />

        {/* Submit button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? vi.resource.submitting : vi.resource.submit}
          </Button>
        </div>
      </form>
    </Card>
  )
}
