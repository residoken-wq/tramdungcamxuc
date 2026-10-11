'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import { requestOtpAction, verifyOtpAction, getSafeRedirectUrl } from '@/lib/auth/actions'
import { Button } from '@/components/ui/Button'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'

export interface LoginFormProps {
  initialNext?: string | null
}

export function LoginForm({ initialNext }: LoginFormProps) {
  const safeNext = getSafeRedirectUrl(initialNext)

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [consentPolicy, setConsentPolicy] = useState(true)
  const [consentMarketing, setConsentMarketing] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [honeypot, setHoneypot] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const codeInputRef = useRef<HTMLInputElement>(null)

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Focus code input on entering code step
  useEffect(() => {
    if (step === 'code') {
      codeInputRef.current?.focus()
    }
  }, [step])

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setInfoMessage(null)

    if (!email.trim()) {
      setErrorMessage(vi.forms.validation.emailRequired)
      return
    }

    if (!consentPolicy) {
      setErrorMessage(vi.auth.consentRequired)
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append('email', email.trim())
    formData.append('honeypot', honeypot)
    if (turnstileToken) {
      formData.append('turnstileToken', turnstileToken)
    }

    try {
      const res = await requestOtpAction(null, formData)
      if (res.success) {
        setStep('code')
        setCountdown(60)
        setInfoMessage(res.message || vi.auth.otpRequestedSuccess)
      } else {
        setErrorMessage(res.error || vi.builder.error)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : vi.builder.error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return
    setErrorMessage(null)
    setInfoMessage(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('email', email.trim())
    formData.append('honeypot', honeypot)
    if (turnstileToken) {
      formData.append('turnstileToken', turnstileToken)
    }

    try {
      const res = await requestOtpAction(null, formData)
      if (res.success) {
        setCountdown(60)
        setInfoMessage(vi.auth.resendSuccess)
      } else {
        setErrorMessage(res.error || vi.builder.error)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : vi.builder.error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const cleanCode = code.trim()
    if (!/^\d{6}$/.test(cleanCode)) {
      setErrorMessage(vi.auth.invalidCode)
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append('email', email.trim())
    formData.append('code', cleanCode)
    formData.append('consentPolicy', consentPolicy ? 'true' : 'false')
    formData.append('consentMarketing', consentMarketing ? 'true' : 'false')
    formData.append('next', safeNext)

    try {
      const res = await verifyOtpAction(null, formData)
      if (res.success && res.redirectTo) {
        window.location.href = res.redirectTo
      } else {
        setErrorMessage(res.error || vi.auth.invalidCode)
        setIsLoading(false)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : vi.auth.invalidCode)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white/95 rounded-2xl sm:rounded-3xl border border-lavender-mist shadow-sm p-6 sm:p-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-bright-magenta mb-1">
          TRẠM DỪNG CẢM XÚC
        </p>
        <h1 className="font-heading text-2xl sm:text-3xl text-deep-navy">{vi.auth.loginTitle}</h1>
        <p className="font-serif italic text-sm text-deep-navy/70 mt-1">{vi.auth.loginSubtitle}</p>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-soft-pink border border-accent-pink/40 text-deep-navy text-sm font-medium"
        >
          {errorMessage}
        </div>
      )}

      {infoMessage && (
        <div
          role="status"
          className="mb-5 p-3.5 rounded-xl bg-mint-haze border border-mint-haze text-deep-navy text-sm font-medium"
        >
          {infoMessage}
        </div>
      )}

      {/* STEP 1: Enter Email */}
      {step === 'email' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          {/* Honeypot field for bot detection */}
          <div aria-hidden="true" className="hidden">
            <label htmlFor="auth-company">Company</label>
            <input
              id="auth-company"
              type="text"
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="auth-email"
              className="font-ui text-sm font-semibold text-deep-navy block mb-1.5"
            >
              {vi.auth.emailLabel}
            </label>
            <input
              id="auth-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder={vi.auth.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-deep-navy/20 bg-warm-ivory/50 text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 focus:ring-bright-magenta/40 focus:border-bright-magenta font-sans text-base transition-colors"
            />
          </div>

          {/* Privacy Policy Consent */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="auth-consent-policy"
              type="checkbox"
              name="consentPolicy"
              checked={consentPolicy}
              onChange={(e) => setConsentPolicy(e.target.checked)}
              required
              className="mt-1 h-4 w-4 rounded border-deep-navy/30 text-accent-pink focus:ring-bright-magenta cursor-pointer"
            />
            <label
              htmlFor="auth-consent-policy"
              className="font-sans text-xs text-deep-navy/80 leading-relaxed cursor-pointer"
            >
              {vi.auth.consentLabel}{' '}
              <Link
                href="/chinh-sach-bao-mat"
                target="_blank"
                className="text-bright-magenta underline font-semibold hover:text-deep-navy"
              >
                {vi.auth.privacyPolicy}
              </Link>
              .
            </label>
          </div>

          {/* Optional Marketing Consent */}
          <div className="flex items-start gap-2.5">
            <input
              id="auth-consent-marketing"
              type="checkbox"
              name="consentMarketing"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-deep-navy/30 text-accent-pink focus:ring-bright-magenta cursor-pointer"
            />
            <label
              htmlFor="auth-consent-marketing"
              className="font-sans text-xs text-deep-navy/80 leading-relaxed cursor-pointer"
            >
              {vi.auth.consentMarketingLabel}
            </label>
          </div>

          {/* Bot Protection Widget */}
          <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              isLoading={isLoading}
              disabled={isLoading || !consentPolicy}
            >
              {isLoading ? vi.auth.sendingOtp : vi.auth.sendOtpButton}
            </Button>
          </div>
        </form>
      ) : (
        /* STEP 2: Enter 6-digit Code */
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="p-3 bg-lavender-mist/40 rounded-xl text-center">
            <p className="text-xs text-deep-navy/70">{vi.auth.codeStepSubtitle(email)}</p>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
                setErrorMessage(null)
                setInfoMessage(null)
              }}
              className="mt-1 text-xs font-semibold text-bright-magenta hover:underline cursor-pointer"
            >
              {vi.auth.changeEmail}
            </button>
          </div>

          <div>
            <label
              htmlFor="auth-code"
              className="font-ui text-sm font-semibold text-deep-navy block mb-1.5 text-center"
            >
              {vi.auth.codeLabel}
            </label>
            <input
              id="auth-code"
              ref={codeInputRef}
              type="text"
              name="code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              required
              placeholder={vi.auth.codePlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-bright-magenta/40 bg-soft-pink/30 text-deep-navy text-center font-mono text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-bright-magenta focus:border-bright-magenta transition-colors"
            />
          </div>

          {/* Resend button with 60s countdown */}
          <div className="text-center">
            {countdown > 0 ? (
              <span className="text-xs font-medium text-deep-navy/60">
                {vi.auth.resendCountdown(countdown)}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-xs font-semibold text-bright-magenta hover:underline cursor-pointer"
              >
                {vi.auth.resendOtp}
              </button>
            )}
          </div>

          {/* Verify & Login Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center"
            isLoading={isLoading}
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? vi.auth.verifyingOtp : vi.auth.verifyOtpButton}
          </Button>
        </form>
      )}
    </div>
  )
}
