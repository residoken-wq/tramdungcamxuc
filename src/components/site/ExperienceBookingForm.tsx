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
        setServerError(res.error || res.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.')
        if (res.fieldErrors) {
          setErrors(res.fieldErrors as ExperienceBookingFormErrors)
        }
      }
    } catch (err) {
      setStatus('error')
      setServerError(err instanceof Error ? err.message : 'Có lỗi không mong muốn xảy ra.')
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
                Phiên trải nghiệm 1:1
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
              <span className="text-xs font-medium text-deep-navy/70">Chi phí đầu tư</span>
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
                <span className="text-accent-pink font-bold">✓</span>
                <span>Thời lượng 60–90 phút đồng hành cá nhân hóa</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-pink font-bold">✓</span>
                <span>Thanh toán chuyển khoản quét mã VietQR tự động tiện lợi</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-pink font-bold">✓</span>
                <span>Chủ động chọn khung giờ sau khi xác nhận thanh toán</span>
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
                  Thông tin đăng ký phiên
                </h3>
                <p className="font-sans text-xs text-deep-navy/70">
                  Vui lòng cung cấp thông tin chính xác để Trạm gửi xác nhận và link đặt lịch.
                </p>
              </div>

              {serverError && (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 leading-relaxed"
                >
                  {serverError}
                </div>
              )}

              {/* Honeypot field for bot protection */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor={honeypotId}>Không điền ô này nếu bạn là người thật</label>
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
                  Họ và tên <span className="text-accent-pink">*</span>
                </label>
                <input
                  id={nameId}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  placeholder="Ví dụ: Nguyễn Minh Thư"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-lavender-mist focus:border-bright-magenta focus:ring-accent-pink/20'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor={emailId} className="block text-sm font-semibold text-deep-navy">
                  Địa chỉ email <span className="text-accent-pink">*</span>
                </label>
                <input
                  id={emailId}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  placeholder="name@example.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-lavender-mist focus:border-bright-magenta focus:ring-accent-pink/20'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label htmlFor={phoneId} className="block text-sm font-semibold text-deep-navy">
                  Số điện thoại{' '}
                  <span className="text-xs font-normal text-deep-navy/60">(tùy chọn)</span>
                </label>
                <input
                  id={phoneId}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full px-4 py-2.5 rounded-xl border border-lavender-mist text-sm text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:border-bright-magenta focus:ring-2 focus:ring-accent-pink/20 transition-all"
                />
              </div>

              {/* Nhu cầu ngắn */}
              <div className="space-y-1.5">
                <label htmlFor={needId} className="block text-sm font-semibold text-deep-navy">
                  Nhu cầu hoặc mục tiêu khi đặt phiên{' '}
                  <span className="text-xs font-normal text-deep-navy/60">
                    (tối đa 1.000 ký tự)
                  </span>
                </label>
                <textarea
                  id={needId}
                  rows={3}
                  maxLength={1000}
                  value={need}
                  onChange={(e) => {
                    setNeed(e.target.value)
                    if (errors.need) setErrors((prev) => ({ ...prev, need: undefined }))
                  }}
                  placeholder="Bạn đang gặp khó khăn gì hoặc mong muốn đạt được điều gì sau phiên trải nghiệm này?..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 transition-all resize-y ${
                    errors.need
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-lavender-mist focus:border-bright-magenta focus:ring-accent-pink/20'
                  }`}
                />
                {errors.need && <p className="text-xs text-red-600 mt-1">{errors.need}</p>}
              </div>

              {/* Ô tick bắt buộc: Điều khoản & Chính sách giá thanh toán */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-start gap-3">
                  <input
                    id={termsId}
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked)
                      if (errors.termsAccepted) {
                        setErrors((prev) => ({ ...prev, termsAccepted: undefined }))
                      }
                    }}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-accent-pink focus:ring-accent-pink cursor-pointer"
                  />
                  <label
                    htmlFor={termsId}
                    className="text-xs sm:text-sm text-deep-navy/85 leading-relaxed cursor-pointer"
                  >
                    Tôi đã đọc và đồng ý với{' '}
                    <Link
                      href="/dieu-khoan-su-dung"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-pink font-semibold underline hover:text-bright-magenta"
                    >
                      Điều khoản sử dụng
                    </Link>{' '}
                    và{' '}
                    <Link
                      href="/gia-thanh-toan"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-pink font-semibold underline hover:text-bright-magenta"
                    >
                      Chính sách giá – thanh toán
                    </Link>{' '}
                    của Trạm Dừng Cảm Xúc. <span className="text-accent-pink">*</span>
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p className="text-xs text-red-600 mt-1 pl-7">{errors.termsAccepted}</p>
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
                    ? 'Đang tạo đơn thanh toán...'
                    : 'Tiếp tục thanh toán VietQR'}
                </Button>
              </div>

              <p className="text-center text-xs text-deep-navy/60 italic">
                Sau khi gửi thông tin, bạn sẽ được chuyển tới trang hiển thị mã QR và nội dung
                chuyển khoản.
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ExperienceBookingForm
