'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import { requestOtpAction, verifyOtpAction } from '@/lib/auth/actions'
import { getSafeRedirectUrl } from '@/lib/auth/redirect'
import type { LoginMethodsResult } from '@/lib/auth/methods'
import { Button } from '@/components/ui/Button'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'

export interface LoginFormProps {
  initialNext?: string | null
  methods?: LoginMethodsResult
  initialError?: string | null
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
)

function resolveInitialErrorMessage(error?: string | null): string | null {
  if (!error) return null
  if (error === 'can-dong-y') return vi.gl01.errors.canDongY
  if (error === 'huy') return vi.gl01.errors.huy
  if (error === 'lien-ket-khac') return vi.gl01.errors.lienKetKhac
  if (error === 'that-bai') return vi.gl01.errors.thatBai
  return null
}

export function LoginForm({
  initialNext,
  methods = { google: true, otp: true },
  initialError,
}: LoginFormProps) {
  const safeNext = getSafeRedirectUrl(initialNext)

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [consentPolicy, setConsentPolicy] = useState(false)
  const [consentMarketing, setConsentMarketing] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [honeypot, setHoneypot] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    resolveInitialErrorMessage(initialError),
  )
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

  const googleAuthHref = `/api/auth/google/start?next=${encodeURIComponent(
    safeNext,
  )}&consent=${consentPolicy ? 1 : 0}&marketing=${consentMarketing ? 1 : 0}`

  return (
    <div className="w-full max-w-md mx-auto bg-white/95 rounded-2xl sm:rounded-3xl border border-lavender-mist shadow-sm p-6 sm:p-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-bright-magenta mb-1">
          TRẠM DỪNG CẢM XÚC
        </p>
        <h1 className="font-display text-2xl sm:text-3xl text-deep-navy">{vi.auth.loginTitle}</h1>
        <p className="font-quote italic text-sm text-deep-navy/70 mt-1">{vi.auth.loginSubtitle}</p>
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

      {/* Shared Consent Checkboxes (rendered when on email step or when OTP is disabled) */}
      {step === 'email' && (
        <div className="space-y-3 mb-5 pb-1">
          {/* Privacy Policy Consent */}
          <div className="flex items-start gap-2.5">
            <input
              id="auth-consent-policy"
              type="checkbox"
              name="consentPolicy"
              checked={consentPolicy}
              onChange={(e) => setConsentPolicy(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-deep-navy/30 text-bright-magenta focus:ring-bright-magenta cursor-pointer"
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
              className="mt-1 h-4 w-4 rounded border-deep-navy/30 text-bright-magenta focus:ring-bright-magenta cursor-pointer"
            />
            <label
              htmlFor="auth-consent-marketing"
              className="font-sans text-xs text-deep-navy/80 leading-relaxed cursor-pointer"
            >
              {vi.auth.consentMarketingLabel}
            </label>
          </div>
        </div>
      )}

      {/* Google Login Button */}
      {step === 'email' && methods.google && (
        <div className="mb-2">
          <a
            href={googleAuthHref}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-deep-navy/20 bg-white hover:bg-warm-ivory text-deep-navy font-semibold text-sm sm:text-base flex items-center justify-center gap-3 transition shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-bright-magenta focus:ring-offset-2"
            aria-label={vi.gl01.googleSignInAria}
          >
            <GoogleIcon className="w-5 h-5 shrink-0" />
            <span>{vi.gl01.continueWithGoogle}</span>
          </a>
          <p className="text-xs text-deep-navy/60 text-center mt-2 font-ui">
            {vi.gl01.firstTimeConsentHint}
          </p>
        </div>
      )}

      {/* Divider between Google and OTP */}
      {step === 'email' && methods.google && methods.otp && (
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-deep-navy/15" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/95 px-3 text-deep-navy/60 font-semibold font-ui">
              {vi.gl01.orDivider}
            </span>
          </div>
        </div>
      )}

      {/* OTP Login Form */}
      {methods.otp && (
        <>
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
        </>
      )}
    </div>
  )
}
