'use client'

import React, { useState, useId } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import { TurnstileWidget } from './forms/TurnstileWidget'

export interface B2BBriefFormProps {
  version?: number
  title?: string
  description?: string
  submitLabel?: string
  className?: string
  pageSlug?: string
  puck?: { isEditing?: boolean }
}

export interface B2BBriefFormErrors {
  name?: string
  email?: string
  phone?: string
  company?: string
  teamSize?: string
  targetBehaviors?: string
  timeline?: string
  message?: string
  consent?: string
  [key: string]: string | undefined
}

export function B2BBriefForm({
  title = vi.forms.b2b.defaultTitle,
  description = vi.forms.b2b.defaultDescription,
  submitLabel = vi.forms.b2b.defaultSubmitLabel,
  className = '',
  pageSlug,
}: B2BBriefFormProps) {
  const id = useId()
  const nameId = `${id}-b2b-name`
  const emailId = `${id}-b2b-email`
  const phoneId = `${id}-b2b-phone`
  const companyId = `${id}-b2b-company`
  const teamSizeId = `${id}-b2b-teamsize`
  const behaviorsId = `${id}-b2b-behaviors`
  const timelineId = `${id}-b2b-timeline`
  const messageId = `${id}-b2b-message`
  const consentId = `${id}-b2b-consent`
  const honeypotId = `${id}-b2b-hp`

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [targetBehaviors, setTargetBehaviors] = useState('')
  const [timeline, setTimeline] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined)

  const [errors, setErrors] = useState<B2BBriefFormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)

  const validate = (): boolean => {
    const nextErrors: B2BBriefFormErrors = {}

    if (!name.trim()) {
      nextErrors.name = vi.forms.validation.nameRequired
    }
    if (!email.trim()) {
      nextErrors.email = vi.forms.validation.emailRequired
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        nextErrors.email = vi.forms.validation.emailInvalid
      }
    }
    if (!company.trim()) {
      nextErrors.company = vi.forms.validation.companyRequired
    }
    if (!consent) {
      nextErrors.consent = vi.forms.validation.consentRequired
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError(null)

    if (honeypot.trim() !== '') {
      setStatus('success')
      return
    }

    if (!validate()) {
      return
    }

    setStatus('submitting')

    try {
      const { submitB2BBriefAction } = await import('@/lib/forms/actions')
      const res = await submitB2BBriefAction({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        company: company.trim(),
        teamSize: teamSize.trim() || undefined,
        targetBehaviors: targetBehaviors.trim() || undefined,
        timeline: timeline.trim() || undefined,
        message: message.trim() || undefined,
        consent,
        honeypot: honeypot.trim(),
        turnstileToken,
        page: pageSlug,
      })

      if (res.success) {
        setStatus('success')
        track('b2b_brief_submitted', { company: company.trim() })
      } else {
        setStatus('error')
        setServerError(res.error || vi.forms.serverError)
        if (res.fieldErrors) {
          setErrors(res.fieldErrors)
        }
      }
    } catch {
      setStatus('error')
      setServerError(vi.forms.serverError)
    }
  }

  const handleReset = () => {
    setName('')
    setEmail('')
    setPhone('')
    setCompany('')
    setTeamSize('')
    setTargetBehaviors('')
    setTimeline('')
    setMessage('')
    setConsent(false)
    setHoneypot('')
    setErrors({})
    setStatus('idle')
    setServerError(null)
  }

  return (
    <div id="gui-brief" className={`scroll-mt-24 ${className}`}>
      <Card variant="white" className="p-6 sm:p-10 max-w-2xl mx-auto shadow-md">
        <div className="mb-8">
          <h3 className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy mb-2 tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="font-sans text-sm sm:text-base text-deep-navy/80 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {status === 'success' ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl bg-mint-haze border border-deep-navy/15 p-8 text-center space-y-4"
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
              <h4 className="font-ui font-bold text-xl text-deep-navy">
                {vi.forms.b2b.successTitle}
              </h4>
              <p className="text-sm font-sans text-deep-navy/80 mt-2 max-w-md mx-auto">
                {vi.forms.success.b2b}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="mt-4">
              {vi.forms.b2b.resetButton}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {serverError && (
              <div
                role="alert"
                className="rounded-lg bg-soft-pink border border-bright-magenta/30 p-3.5 text-sm font-medium text-bright-magenta"
              >
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Họ và tên */}
              <div>
                <label
                  htmlFor={nameId}
                  className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
                >
                  {vi.leadForm.nameLabel} <span className="text-bright-magenta">*</span>
                </label>
                <input
                  id={nameId}
                  type="text"
                  name="name"
                  disabled={status === 'submitting'}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  placeholder={vi.forms.b2b.namePlaceholder}
                  aria-invalid={Boolean(errors.name)}
                  className={`w-full px-4 py-2.5 rounded-xl border font-sans text-base text-deep-navy bg-white transition-colors duration-200 placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy ${
                    errors.name
                      ? 'border-bright-magenta ring-1 ring-bright-magenta/40'
                      : 'border-deep-navy/20 hover:border-deep-navy/40'
                  } ${status === 'submitting' ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {errors.name && (
                  <p
                    role="alert"
                    className="mt-1.5 text-xs font-semibold text-bright-magenta font-ui"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor={emailId}
                  className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
                >
                  {vi.leadForm.emailLabel} <span className="text-bright-magenta">*</span>
                </label>
                <input
                  id={emailId}
                  type="email"
                  name="email"
                  disabled={status === 'submitting'}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  placeholder={vi.forms.b2b.emailPlaceholder}
                  aria-invalid={Boolean(errors.email)}
                  className={`w-full px-4 py-2.5 rounded-xl border font-sans text-base text-deep-navy bg-white transition-colors duration-200 placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy ${
                    errors.email
                      ? 'border-bright-magenta ring-1 ring-bright-magenta/40'
                      : 'border-deep-navy/20 hover:border-deep-navy/40'
                  } ${status === 'submitting' ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {errors.email && (
                  <p
                    role="alert"
                    className="mt-1.5 text-xs font-semibold text-bright-magenta font-ui"
                  >
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tên công ty */}
              <div>
                <label
                  htmlFor={companyId}
                  className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
                >
                  {vi.forms.b2b.companyLabel} <span className="text-bright-magenta">*</span>
                </label>
                <input
                  id={companyId}
                  type="text"
                  name="company"
                  disabled={status === 'submitting'}
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value)
                    if (errors.company) setErrors((prev) => ({ ...prev, company: undefined }))
                  }}
                  placeholder={vi.forms.b2b.companyPlaceholder}
                  aria-invalid={Boolean(errors.company)}
                  className={`w-full px-4 py-2.5 rounded-xl border font-sans text-base text-deep-navy bg-white transition-colors duration-200 placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy ${
                    errors.company
                      ? 'border-bright-magenta ring-1 ring-bright-magenta/40'
                      : 'border-deep-navy/20 hover:border-deep-navy/40'
                  } ${status === 'submitting' ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {errors.company && (
                  <p
                    role="alert"
                    className="mt-1.5 text-xs font-semibold text-bright-magenta font-ui"
                  >
                    {errors.company}
                  </p>
                )}
              </div>

              {/* Số điện thoại */}
              <div>
                <label
                  htmlFor={phoneId}
                  className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
                >
                  {vi.forms.b2b.phoneLabel}
                </label>
                <input
                  id={phoneId}
                  type="tel"
                  name="phone"
                  disabled={status === 'submitting'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={vi.forms.b2b.phonePlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl border border-deep-navy/20 hover:border-deep-navy/40 font-sans text-base text-deep-navy bg-white transition-colors duration-200 placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy ${
                    status === 'submitting' ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quy mô đội ngũ */}
              <div>
                <label
                  htmlFor={teamSizeId}
                  className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
                >
                  {vi.forms.b2b.teamSizeLabel}
                </label>
                <input
                  id={teamSizeId}
                  type="text"
                  name="teamSize"
                  disabled={status === 'submitting'}
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  placeholder={vi.forms.b2b.teamSizePlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl border border-deep-navy/20 hover:border-deep-navy/40 font-sans text-base text-deep-navy bg-white transition-colors duration-200 placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy ${
                    status === 'submitting' ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Thời gian triển khai */}
              <div>
                <label
                  htmlFor={timelineId}
                  className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
                >
                  {vi.forms.b2b.timelineLabel}
                </label>
                <input
                  id={timelineId}
                  type="text"
                  name="timeline"
                  disabled={status === 'submitting'}
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder={vi.forms.b2b.timelinePlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl border border-deep-navy/20 hover:border-deep-navy/40 font-sans text-base text-deep-navy bg-white transition-colors duration-200 placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy ${
                    status === 'submitting' ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Hành vi mục tiêu */}
            <div>
              <label
                htmlFor={behaviorsId}
                className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
              >
                {vi.forms.b2b.targetBehaviorsLabel}
              </label>
              <textarea
                id={behaviorsId}
                rows={2}
                name="targetBehaviors"
                disabled={status === 'submitting'}
                value={targetBehaviors}
                onChange={(e) => setTargetBehaviors(e.target.value)}
                placeholder={vi.forms.b2b.targetBehaviorsPlaceholder}
                className={`w-full px-4 py-2.5 rounded-xl border border-deep-navy/20 hover:border-deep-navy/40 font-sans text-base text-deep-navy bg-white transition-colors duration-200 placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy ${
                  status === 'submitting' ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Lời nhắn thêm */}
            <div>
              <label
                htmlFor={messageId}
                className="block font-ui text-sm font-bold text-deep-navy mb-1.5"
              >
                {vi.forms.b2b.messageLabel}
              </label>
              <textarea
                id={messageId}
                rows={3}
                name="message"
                disabled={status === 'submitting'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={vi.forms.b2b.messagePlaceholder}
                className={`w-full px-4 py-2.5 rounded-xl border border-deep-navy/20 hover:border-deep-navy/40 font-sans text-base text-deep-navy bg-white transition-colors duration-200 placeholder:text-deep-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy ${
                  status === 'submitting' ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Hidden Honeypot Field */}
            <div
              className="absolute opacity-0 pointer-events-none -z-10 h-0 w-0 overflow-hidden"
              aria-hidden="true"
            >
              <label htmlFor={honeypotId}>Organization HP</label>
              <input
                id={honeypotId}
                type="text"
                name="b2b_hp"
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
                  id={consentId}
                  type="checkbox"
                  name="consent"
                  disabled={status === 'submitting'}
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked)
                    if (errors.consent) setErrors((prev) => ({ ...prev, consent: undefined }))
                  }}
                  aria-invalid={Boolean(errors.consent)}
                  className="mt-1 h-4 w-4 rounded border-deep-navy/30 text-bright-magenta accent-bright-magenta focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer"
                />
                <label
                  htmlFor={consentId}
                  className="text-xs font-sans text-deep-navy/80 leading-normal select-none cursor-pointer"
                >
                  {vi.forms.b2b.consentText}{' '}
                  <Link
                    href="/chinh-sach-bao-mat"
                    className="font-bold underline text-deep-navy hover:text-bright-magenta transition-colors"
                  >
                    {vi.forms.b2b.privacyLink}
                  </Link>
                  . <span className="text-bright-magenta">*</span>
                </label>
              </div>
              {errors.consent && (
                <p
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
                className="w-full py-3"
              >
                {status === 'submitting' ? vi.forms.b2b.submitting : submitLabel}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
