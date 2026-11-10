'use client'

import React, { useState, useId } from 'react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import { TurnstileWidget } from './forms/TurnstileWidget'

export type RegistrationFormType =
  | 'community-me-time'
  | 'community-yoga-buddy'
  | 'brochure-chuyen-minh'

export interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  formType: RegistrationFormType
  title?: string
  description?: string
  successMessage?: string
  privacyHref?: string
  triggerRef?: React.RefObject<HTMLElement | null>
  pageSlug?: string
}

export function RegistrationModal({
  isOpen,
  onClose,
  formType,
  title,
  description,
  successMessage,
  privacyHref = '/chinh-sach-bao-mat',
  triggerRef,
  pageSlug,
}: RegistrationModalProps) {
  const id = useId()
  const nameInputId = `${id}-name`
  const phoneInputId = `${id}-phone`
  const emailInputId = `${id}-email`
  const consentInputId = `${id}-consent`
  const honeypotInputId = `${id}-hp`

  const isBrochure = formType === 'brochure-chuyen-minh'

  const defaultTitle = isBrochure
    ? 'Đăng ký nhận brochure chi tiết'
    : formType === 'community-yoga-buddy'
      ? 'Tham gia YOGA BUDDY'
      : 'Tham gia ME TIME'

  const defaultSuccessMessage = isBrochure
    ? 'Em sẽ liên hệ trực tiếp.'
    : '[MẪU] Cảm ơn bạn, Trạm sẽ liên hệ qua Zalo sớm.'

  const modalTitle = title?.trim() || defaultTitle
  const finalSuccessMessage = successMessage?.trim() || defaultSuccessMessage

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined)

  const [errors, setErrors] = useState<{
    name?: string
    phone?: string
    email?: string
    consent?: string
    [key: string]: string | undefined
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setPhone('')
    setEmail('')
    setConsent(false)
    setHoneypot('')
    setErrors({})
    setServerError(null)
    setIsSuccess(false)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validate = (): boolean => {
    const nextErrors: typeof errors = {}

    if (!isBrochure && !name.trim()) {
      nextErrors.name = vi.forms.validation.nameRequired
    }

    const trimmedPhone = phone.trim()
    if (!trimmedPhone) {
      nextErrors.phone = vi.forms.validation.phoneRequired || 'Vui lòng nhập số điện thoại'
    } else {
      const cleaned = trimmedPhone.replace(/[\s.-]/g, '')
      if (!/^(?:\+?84|0)[0-9]{9,10}$/.test(cleaned)) {
        nextErrors.phone = vi.forms.validation.phoneInvalid
      }
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      nextErrors.email = vi.forms.validation.emailRequired
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        nextErrors.email = vi.forms.validation.emailInvalid
      }
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

    // Honeypot defense
    if (honeypot.trim() !== '') {
      setIsSuccess(true)
      return
    }

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const { submitRegistrationAction } = await import('@/lib/forms/actions')
      const res = await submitRegistrationAction({
        name: isBrochure ? undefined : name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        formType,
        consent,
        honeypot: honeypot.trim(),
        turnstileToken,
        page: pageSlug || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      })

      if (res.success) {
        setIsSuccess(true)
        // REVIEW-REQUIRED: Never pass PII (name, phone, email) to analytics
        track('lead_submitted', { form: formType })
      } else {
        setServerError(res.error || vi.leadForm.errorMessage)
        if (res.fieldErrors) {
          setErrors(res.fieldErrors)
        }
      }
    } catch {
      setServerError(vi.leadForm.errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      triggerRef={triggerRef}
      className="max-w-md"
    >
      {isSuccess ? (
        <div className="space-y-4 py-2 text-center" role="status" aria-live="polite">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint-haze text-emerald-700">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-ui text-base font-semibold text-deep-navy">{finalSuccessMessage}</p>
          <div className="pt-2">
            <Button variant="primary" size="md" onClick={handleClose} className="w-full">
              Đóng
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
          {description && (
            <p className="font-ui text-sm text-deep-navy/80 mb-2">{description}</p>
          )}

          {serverError && (
            <div
              role="alert"
              className="rounded-lg bg-soft-pink border border-bright-magenta/20 p-3 text-xs text-bright-magenta font-semibold"
            >
              {serverError}
            </div>
          )}

          {/* Honeypot field */}
          <div className="absolute left-[-9999px]" aria-hidden="true">
            <label htmlFor={honeypotInputId}>Không điền ô này nếu bạn là người</label>
            <input
              id={honeypotInputId}
              type="text"
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {!isBrochure && (
            <div>
              <label
                htmlFor={nameInputId}
                className="block font-ui text-xs font-bold uppercase tracking-wider text-deep-navy mb-1"
              >
                Họ và tên <span className="text-bright-magenta">*</span>
              </label>
              <input
                id={nameInputId}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                aria-invalid={Boolean(errors.name)}
                className={`w-full rounded-xl border px-3.5 py-2.5 font-ui text-sm text-deep-navy bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-bright-magenta/50 ${
                  errors.name ? 'border-bright-magenta' : 'border-deep-navy/20'
                }`}
              />
              {errors.name && (
                <p className="mt-1 font-ui text-xs text-bright-magenta font-medium">{errors.name}</p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor={phoneInputId}
              className="block font-ui text-xs font-bold uppercase tracking-wider text-deep-navy mb-1"
            >
              Số điện thoại (Zalo) <span className="text-bright-magenta">*</span>
            </label>
            <input
              id={phoneInputId}
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0901234567"
              aria-invalid={Boolean(errors.phone)}
              className={`w-full rounded-xl border px-3.5 py-2.5 font-ui text-sm text-deep-navy bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-bright-magenta/50 ${
                errors.phone ? 'border-bright-magenta' : 'border-deep-navy/20'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 font-ui text-xs text-bright-magenta font-medium">{errors.phone}</p>
            )}
          </div>

          <div>
            <label
              htmlFor={emailInputId}
              className="block font-ui text-xs font-bold uppercase tracking-wider text-deep-navy mb-1"
            >
              Email <span className="text-bright-magenta">*</span>
            </label>
            <input
              id={emailInputId}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: ban@example.com"
              aria-invalid={Boolean(errors.email)}
              className={`w-full rounded-xl border px-3.5 py-2.5 font-ui text-sm text-deep-navy bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-bright-magenta/50 ${
                errors.email ? 'border-bright-magenta' : 'border-deep-navy/20'
              }`}
            />
            {errors.email && (
              <p className="mt-1 font-ui text-xs text-bright-magenta font-medium">{errors.email}</p>
            )}
          </div>

          <div className="pt-1">
            <label
              htmlFor={consentInputId}
              className="flex items-start gap-2.5 text-xs text-deep-navy/80 cursor-pointer select-none"
            >
              <input
                id={consentInputId}
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-deep-navy/30 text-bright-magenta focus:ring-bright-magenta/50 accent-bright-magenta flex-shrink-0 cursor-pointer"
              />
              <span>
                Tôi đồng ý với{' '}
                <Link
                  href={privacyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-bright-magenta underline underline-offset-2 hover:text-deep-navy"
                >
                  chính sách bảo mật
                </Link>{' '}
                của Trạm Dừng Cảm Xúc.
              </span>
            </label>
            {errors.consent && (
              <p className="mt-1 font-ui text-xs text-bright-magenta font-medium">{errors.consent}</p>
            )}
          </div>

          <TurnstileWidget
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(undefined)}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="w-full justify-center"
            >
              {isSubmitting
                ? 'Đang gửi...'
                : isBrochure
                  ? 'Đăng ký nhận brochure'
                  : 'Gửi thông tin tham gia'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

