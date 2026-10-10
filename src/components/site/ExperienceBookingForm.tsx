'use client'

import React, { useState, useId } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import { formatVnd } from '@/lib/format'
import { track } from '@/lib/analytics/track'
import { TurnstileWidget } from './forms/TurnstileWidget'
import { createExperienceOrderAction } from '@/lib/forms/actions'

export interface ExperienceBookingProductInfo {
  id: number
  name: string
  slug: string
  currentPrice: number
  originalPrice?: number | null
  shortDescription?: string | null
}

export interface ExperienceBookingFormProps {
  product: ExperienceBookingProductInfo
  className?: string
  pageSlug?: string
}

export interface ExperienceBookingFormErrors {
  name?: string
  email?: string
  phone?: string
  need?: string
  termsAccepted?: string
  [key: string]: string | undefined
}

export function ExperienceBookingForm({
  product,
  className = '',
  pageSlug,
}: ExperienceBookingFormProps) {
  const router = useRouter()
  const id = useId()
  const nameId = `${id}-exp-name`
  const emailId = `${id}-exp-email`
  const phoneId = `${id}-exp-phone`
  const needId = `${id}-exp-need`
  const termsId = `${id}-exp-terms`
  const honeypotId = `${id}-exp-hp`

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [need, setNeed] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined)

  const [errors, setErrors] = useState<ExperienceBookingFormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)

  const validate = (): boolean => {
    const nextErrors: ExperienceBookingFormErrors = {}

    if (!name.trim()) {
      nextErrors.name = vi.payment.validation.nameRequired
    }

    if (!email.trim()) {
      nextErrors.email = vi.payment.validation.emailRequired
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        nextErrors.email = vi.forms.validation.emailInvalid
      }
    }

    if (need.trim().length > 1000) {
      nextErrors.need = vi.payment.validation.needMax
    }

    if (!termsAccepted) {
      nextErrors.termsAccepted = vi.payment.validation.termsAcceptedRequired
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setStatus('submitting')
    setServerError(null)

    try {
      const res = await createExperienceOrderAction({
        productId: product.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        need: need.trim() || undefined,
        termsAccepted,
        honeypot,
        turnstileToken,
      })

      if (res.success && res.payToken) {
        track('experience_session_booked', {
          productSlug: product.slug,
          productId: product.id,
          pageSlug,
        })
        router.push(`/thanh-toan/don/${res.payToken}`)
      } else {
        setStatus('error')
        setServerError(res.error || res.message || vi.payment.ui.booking.createOrderFailed)
        if (res.fieldErrors) {
          setErrors(res.fieldErrors as ExperienceBookingFormErrors)
        }
      }
    } catch (err) {
      setStatus('error')
      setServerError(vi.payment.errors.serverError)
    }
  }

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Summary Card */}
        <div className="lg:col-span-5 space-y-6">
          <Card
            variant="soft-pink"
            className="p-6 sm:p-8 space-y-6 border border-lavender-mist/60 shadow-sm"
          >
            <div className="space-y-2">
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-bright-magenta">
                {vi.payment.ui.booking.cardBadge}
              </span>
              <h2 className="font-ui font-bold text-2xl text-deep-navy leading-tight">
                {product.name}
              </h2>
            </div>

            {product.shortDescription && (
              <p className="font-sans text-sm text-deep-navy/80 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            <div className="pt-4 border-t border-lavender-mist/60 space-y-2">
              <span className="text-xs font-medium text-deep-navy/70">
                {vi.payment.ui.booking.feeLabel}
              </span>
              <div className="flex items-baseline gap-3">
                <span className="font-ui font-bold text-3xl text-bright-magenta">
                  {formatVnd(product.currentPrice)}
                </span>
                {product.originalPrice != null && product.originalPrice > product.currentPrice && (
                  <span className="font-sans text-base text-deep-navy/40 line-through">
                    {formatVnd(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-deep-navy/75">
              <div className="flex items-start gap-2">
                <span className="text-bright-magenta font-bold">✓</span>
                <span>{vi.payment.ui.booking.featureVietQr}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-bright-magenta font-bold">✓</span>
                <span>{vi.payment.ui.booking.featureSchedule}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Booking Form */}
        <div className="lg:col-span-7">
          <Card
            variant="white"
            className="p-6 sm:p-8 bg-white border border-lavender-mist/60 shadow-sm rounded-2xl"
          >
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="space-y-1">
                <h3 className="font-ui font-bold text-xl text-deep-navy">
                  {vi.payment.ui.booking.formTitle}
                </h3>
                <p className="font-sans text-xs text-deep-navy/70">
                  {vi.payment.ui.booking.formDesc}
                </p>
              </div>

              {serverError && (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-soft-pink border border-accent-pink/40 text-sm text-deep-navy font-medium leading-relaxed"
                >
                  {serverError}
                </div>
              )}

              {/* Honeypot field for bot protection */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor={honeypotId}>{vi.payment.ui.booking.honeypotLabel}</label>
                <input
                  id={honeypotId}
                  name="honeypot"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label htmlFor={nameId} className="block text-sm font-semibold text-deep-navy">
                  {vi.payment.ui.booking.nameLabel} <span className="text-bright-magenta">*</span>
                </label>
                <input
                  id={nameId}
                  type="text"
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? `${nameId}-error` : undefined}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  placeholder={vi.payment.ui.booking.namePlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-accent-pink focus:border-accent-pink focus:ring-accent-pink/30'
                      : 'border-lavender-mist focus:border-bright-magenta focus:ring-accent-pink/20'
                  }`}
                />
                {errors.name && (
                  <p
                    id={`${nameId}-error`}
                    className="text-xs text-bright-magenta font-medium mt-1"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor={emailId} className="block text-sm font-semibold text-deep-navy">
                  {vi.payment.ui.booking.emailLabel} <span className="text-bright-magenta">*</span>
                </label>
                <input
                  id={emailId}
                  type="email"
                  required
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? `${emailId}-error` : undefined}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  placeholder={vi.payment.ui.booking.emailPlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-accent-pink focus:border-accent-pink focus:ring-accent-pink/30'
                      : 'border-lavender-mist focus:border-bright-magenta focus:ring-accent-pink/20'
                  }`}
                />
                {errors.email && (
                  <p
                    id={`${emailId}-error`}
                    className="text-xs text-bright-magenta font-medium mt-1"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label htmlFor={phoneId} className="block text-sm font-semibold text-deep-navy">
                  {vi.payment.ui.booking.phoneLabel}{' '}
                  <span className="text-xs font-normal text-deep-navy/60">
                    {vi.payment.ui.booking.phoneOptional}
                  </span>
                </label>
                <input
                  id={phoneId}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={vi.payment.ui.booking.phonePlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-lavender-mist text-sm text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:border-bright-magenta focus:ring-2 focus:ring-accent-pink/20 transition-all"
                />
              </div>

              {/* Nhu cầu ngắn */}
              <div className="space-y-1.5">
                <label htmlFor={needId} className="block text-sm font-semibold text-deep-navy">
                  {vi.payment.ui.booking.needLabel}{' '}
                  <span className="text-xs font-normal text-deep-navy/60">
                    {vi.payment.ui.booking.needMaxHint}
                  </span>
                </label>
                <textarea
                  id={needId}
                  rows={3}
                  maxLength={1000}
                  aria-invalid={Boolean(errors.need)}
                  aria-describedby={errors.need ? `${needId}-error` : undefined}
                  value={need}
                  onChange={(e) => {
                    setNeed(e.target.value)
                    if (errors.need) setErrors((prev) => ({ ...prev, need: undefined }))
                  }}
                  placeholder={vi.payment.ui.booking.needPlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 transition-all resize-y ${
                    errors.need
                      ? 'border-accent-pink focus:border-accent-pink focus:ring-accent-pink/30'
                      : 'border-lavender-mist focus:border-bright-magenta focus:ring-accent-pink/20'
                  }`}
                />
                {errors.need && (
                  <p
                    id={`${needId}-error`}
                    className="text-xs text-bright-magenta font-medium mt-1"
                  >
                    {errors.need}
                  </p>
                )}
              </div>

              {/* Ô tick bắt buộc: Điều khoản & Chính sách giá thanh toán */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-start gap-3">
                  <input
                    id={termsId}
                    type="checkbox"
                    aria-invalid={Boolean(errors.termsAccepted)}
                    aria-describedby={errors.termsAccepted ? `${termsId}-error` : undefined}
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked)
                      if (errors.termsAccepted) {
                        setErrors((prev) => ({ ...prev, termsAccepted: undefined }))
                      }
                    }}
                    className="mt-1 h-4 w-4 rounded border-lavender-mist text-bright-magenta focus:ring-bright-magenta cursor-pointer"
                  />
                  <label
                    htmlFor={termsId}
                    className="text-xs sm:text-sm text-deep-navy/85 leading-relaxed cursor-pointer"
                  >
                    {vi.payment.ui.booking.termsPrefix}{' '}
                    <Link
                      href="/dieu-khoan-su-dung"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-bright-magenta font-semibold underline hover:text-deep-navy"
                    >
                      {vi.payment.ui.booking.termsLink}
                    </Link>{' '}
                    {vi.payment.ui.booking.andText}{' '}
                    <Link
                      href="/gia-thanh-toan"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-bright-magenta font-semibold underline hover:text-deep-navy"
                    >
                      {vi.payment.ui.booking.pricingPolicyLink}
                    </Link>{' '}
                    {vi.payment.ui.booking.termsSuffix}{' '}
                    <span className="text-bright-magenta">*</span>
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p
                    id={`${termsId}-error`}
                    className="text-xs text-bright-magenta font-medium mt-1 pl-7"
                  >
                    {errors.termsAccepted}
                  </p>
                )}
              </div>

              {/* Turnstile Widget */}
              <TurnstileWidget
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(undefined)}
              />

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={status === 'submitting'}
                  className="w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {status === 'submitting'
                    ? vi.payment.ui.booking.submittingButton
                    : vi.payment.ui.booking.submitButton}
                </Button>
              </div>

              <p className="text-center text-xs text-deep-navy/60 italic">
                {vi.payment.ui.booking.redirectNotice}
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ExperienceBookingForm
