'use client'

import React, { useState, useId } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import { TurnstileWidget } from './forms/TurnstileWidget'

export interface LeadFormValues {
  name: string
  email: string
  consent: boolean
}

export interface LeadFormErrors {
  name?: string
  email?: string
  consent?: string
  [key: string]: string | undefined
}

export type LeadFormStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface LeadFormProps {
  title: string
  description?: string
  privacyHref?: string
  onSubmit?: (values: LeadFormValues) => Promise<void>
  submitLabel?: string
  className?: string
  pageSlug?: string
  need?: 'personal' | 'business' | 'resource'
  interestTags?: string[]
  resourceSlug?: string
  puck?: { isEditing?: boolean }
}

export function LeadForm({
  title,
  description,
  privacyHref = '/chinh-sach-bao-mat',
  onSubmit,
  submitLabel,
  className = '',
  pageSlug,
  need = 'resource',
  interestTags,
  resourceSlug,
}: LeadFormProps) {
  const id = useId()
  const nameInputId = `${id}-name`
  const emailInputId = `${id}-email`
  const consentInputId = `${id}-consent`
  const honeypotInputId = `${id}-org-hp`
  const nameErrorId = `${id}-name-error`
  const emailErrorId = `${id}-email-error`
  const consentErrorId = `${id}-consent-error`

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined)

  const [errors, setErrors] = useState<LeadFormErrors>({})
  const [status, setStatus] = useState<LeadFormStatus>('idle')
  const [serverError, setServerError] = useState<string | null>(null)

  const validate = (): boolean => {
    const nextErrors: LeadFormErrors = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      nextErrors.name = vi.leadForm.errors.nameRequired
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      nextErrors.email = vi.leadForm.errors.emailRequired
    } else {
      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        nextErrors.email = vi.leadForm.errors.emailInvalid
      }
    }

    if (!consent) {
      nextErrors.consent = vi.leadForm.errors.consentRequired
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError(null)

    // Honeypot defense: silently succeed without invoking onSubmit
    if (honeypot.trim() !== '') {
      setStatus('success')
      return
    }

    if (!validate()) {
      return
    }

    setStatus('submitting')

    try {
      if (onSubmit) {
        await onSubmit({
          name: name.trim(),
          email: email.trim(),
          consent,
        })
        setStatus('success')
        track('lead_submitted', { need: need || 'resource', resource: resourceSlug })
      } else {
        const tags: string[] = Array.isArray(interestTags) ? [...interestTags] : []
        if (resourceSlug && !tags.includes(`resource:${resourceSlug}`)) {
          tags.push(`resource:${resourceSlug}`)
        }
        const { submitLeadAction } = await import('@/lib/forms/actions')
        const res = await submitLeadAction({
          name: name.trim(),
          email: email.trim(),
          consent,
          need: need || 'resource',
          interestTags: tags.length > 0 ? tags : ['resource'],
          honeypot: honeypot.trim(),
          turnstileToken,
          page: pageSlug,
        })
        if (res.success) {
          setStatus('success')
          track('lead_submitted', { need: need || 'resource', resource: resourceSlug })
        } else {
          setStatus('error')
          setServerError(res.error || vi.leadForm.errorMessage)
          if (res.fieldErrors) {
            setErrors(res.fieldErrors)
          }
        }
      }
    } catch {
      setStatus('error')
      setServerError(vi.leadForm.errorMessage)
    }
  }

  const handleReset = () => {
    setName('')
    setEmail('')
    setConsent(false)
    setHoneypot('')
    setErrors({})
    setStatus('idle')
    setServerError(null)
  }

  return (
    <Card variant="white" className={`p-6 sm:p-8 max-w-lg mx-auto ${className}`}>
      {/* Form Header */}
      <div className="mb-6">
        <h3 className="font-ui font-bold text-2xl text-deep-navy mb-2 tracking-tight">{title}</h3>
        {description && (
          <p className="font-sans text-sm text-deep-navy/80 leading-relaxed">{description}</p>
        )}
      </div>

      {status === 'success' ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl bg-mint-haze border border-deep-navy/15 p-6 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-full bg-white text-deep-navy flex items-center justify-center mx-auto shadow-sm">
            <svg
              className="w-6 h-6 text-deep-navy"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-ui font-bold text-lg text-deep-navy">{vi.leadForm.successTitle}</h4>
            <p className="text-sm font-sans text-deep-navy/80 mt-1">{vi.leadForm.successMessage}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="mt-2">
            {vi.leadForm.reset}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Top server error banner */}
          {serverError && (
            <div
              role="alert"
              className="rounded-lg bg-soft-pink border border-bright-magenta/30 p-3 text-sm font-medium text-bright-magenta"
            >
              {serverError}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label
              htmlFor={nameInputId}
              className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
            >
              {vi.leadForm.nameLabel} <span className="text-bright-magenta">*</span>
            </label>
            <input
              id={nameInputId}
              type="text"
              name="name"
              disabled={status === 'submitting'}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }))
                }
              }}
              placeholder={vi.leadForm.namePlaceholder}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? nameErrorId : undefined}
              className={[
                'w-full px-4 py-2.5 rounded-xl border font-sans text-base text-deep-navy bg-white transition-colors duration-200',
                'placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy',
                errors.name
                  ? 'border-bright-magenta ring-1 ring-bright-magenta/40'
                  : 'border-deep-navy/20 hover:border-deep-navy/40',
                status === 'submitting' ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            />
            {errors.name && (
              <p
                id={nameErrorId}
                role="alert"
                className="mt-1.5 text-xs font-semibold text-bright-magenta font-ui"
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor={emailInputId}
              className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
            >
              {vi.leadForm.emailLabel} <span className="text-bright-magenta">*</span>
            </label>
            <input
              id={emailInputId}
              type="email"
              name="email"
              disabled={status === 'submitting'}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }))
                }
              }}
              placeholder={vi.leadForm.emailPlaceholder}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? emailErrorId : undefined}
              className={[
                'w-full px-4 py-2.5 rounded-xl border font-sans text-base text-deep-navy bg-white transition-colors duration-200',
                'placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy',
                errors.email
                  ? 'border-bright-magenta ring-1 ring-bright-magenta/40'
                  : 'border-deep-navy/20 hover:border-deep-navy/40',
                status === 'submitting' ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            />
            {errors.email && (
              <p
                id={emailErrorId}
                role="alert"
                className="mt-1.5 text-xs font-semibold text-bright-magenta font-ui"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Hidden Honeypot Field */}
          <div
            className="absolute opacity-0 pointer-events-none -z-10 h-0 w-0 overflow-hidden"
            aria-hidden="true"
          >
            <label htmlFor={honeypotInputId}>Company Name</label>
            <input
              id={honeypotInputId}
              type="text"
              name="organization_hp"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Consent Checkbox */}
          <div className="pt-1">
            <div className="flex items-start gap-3">
              <input
                id={consentInputId}
                type="checkbox"
                name="consent"
                disabled={status === 'submitting'}
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked)
                  if (errors.consent) {
                    setErrors((prev) => ({ ...prev, consent: undefined }))
                  }
                }}
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? consentErrorId : undefined}
                className="mt-1 h-4 w-4 rounded border-deep-navy/30 text-accent-pink accent-accent-pink focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer"
              />
              <label
                htmlFor={consentInputId}
                className="text-xs font-sans text-deep-navy/80 leading-normal select-none cursor-pointer"
              >
                {vi.leadForm.consentText}{' '}
                <Link
                  href={privacyHref}
                  className="font-bold underline text-deep-navy hover:text-bright-magenta transition-colors"
                >
                  {vi.leadForm.privacyLink}
                </Link>
                . <span className="text-bright-magenta">*</span>
              </label>
            </div>
            {errors.consent && (
              <p
                id={consentErrorId}
                role="alert"
                className="mt-1.5 text-xs font-semibold text-bright-magenta font-ui ml-7"
              >
                {errors.consent}
              </p>
            )}
          </div>

          <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={status === 'submitting'}
              disabled={status === 'submitting'}
              className="w-full"
            >
              {status === 'submitting' ? vi.leadForm.submitting : submitLabel || vi.leadForm.submit}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
