'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatVnd } from '@/lib/format'
import { vi } from '@/lib/i18n/vi'
import { acceptOrderTerms } from '@/lib/payments/actions'

export interface PackageSummaryTermsProps {
  summary?: {
    name: string
    components: Array<{
      label: string
      quantity: number | null
      unitValue: number | null
    }>
    totalValue: number
    sellingPrice: number
    discountPercent: number | null
    notes?: string | null
  } | null
  productName?: string
  amount: number
  payToken: string
  onTermsAccepted: () => void
}

export function PackageSummaryTerms({
  summary,
  productName,
  amount,
  payToken,
  onTermsAccepted,
}: PackageSummaryTermsProps) {
  const [isChecked, setIsChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const packageName = summary?.name || productName || 'Gói đồng hành Growth Mirror'
  const sellingPrice = summary?.sellingPrice ?? amount
  const totalValue = summary?.totalValue ?? 0
  const discountPercent = summary?.discountPercent ?? null
  const components = summary?.components ?? []

  const handleAccept = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await acceptOrderTerms(payToken)
      if (res.success) {
        onTermsAccepted()
      } else {
        setError(res.message || vi.payment.errors.serverError)
        setIsChecked(false)
      }
    } catch {
      setError(vi.payment.errors.serverError)
      setIsChecked(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIsChecked(checked)
    if (checked) {
      await handleAccept()
    }
  }

  return (
    <Card
      variant="white"
      className="p-6 sm:p-8 bg-white border border-lavender-mist/80 shadow-md rounded-2xl space-y-6"
    >
      {/* Tiêu đề tóm tắt gói */}
      <div className="space-y-2 border-b border-lavender-mist/40 pb-4">
        <span className="text-xs font-bold text-bright-magenta uppercase tracking-wider">
          {vi.payment.ui.packageSummary.title}
        </span>
        <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy">{packageName}</h2>
      </div>

      {/* Danh sách cấu phần */}
      {components.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-ui font-semibold text-sm text-deep-navy/90">
            {vi.payment.ui.packageSummary.componentsHeading}
          </h3>
          <ul className="space-y-2.5">
            {components.map((comp, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-deep-navy/85">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-soft-pink text-bright-magenta font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="leading-relaxed">
                  <strong className="font-semibold text-deep-navy">{comp.label}</strong>
                  {typeof comp.quantity === 'number' && comp.quantity > 1 && (
                    <span className="text-deep-navy/60 font-medium"> ({comp.quantity} phiên)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Giá trị và mức đầu tư */}
      <div className="p-4 sm:p-5 rounded-xl bg-warm-ivory border border-lavender-mist/60 space-y-3">
        {totalValue > 0 && totalValue > sellingPrice && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-deep-navy/70">
              {vi.payment.ui.packageSummary.totalValueLabel}
            </span>
            <span className="line-through text-deep-navy/50 font-medium">
              {formatVnd(totalValue)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-semibold text-deep-navy text-sm sm:text-base">
            {vi.payment.ui.packageSummary.sellingPriceLabel}
          </span>
          <div className="flex items-center gap-2">
            {discountPercent != null && discountPercent > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-bright-magenta text-white text-xs font-bold">
                -{discountPercent}%
              </span>
            )}
            <span className="font-ui font-bold text-xl sm:text-2xl text-bright-magenta">
              {formatVnd(sellingPrice)}
            </span>
          </div>
        </div>

        {summary?.notes && (
          <div className="p-2.5 rounded-lg bg-mint-haze/60 border border-mint-haze text-xs text-emerald-900 leading-relaxed">
            💡 {summary.notes}
          </div>
        )}
      </div>

      {/* Điều khoản & Xác nhận */}
      <div className="pt-4 border-t border-lavender-mist/60 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer text-sm text-deep-navy select-none">
          <input
            type="checkbox"
            data-testid="terms-checkbox"
            id="terms-checkbox"
            checked={isChecked}
            disabled={isSubmitting}
            onChange={handleCheckboxChange}
            className="mt-1 h-4 w-4 rounded border-lavender-mist text-bright-magenta focus:ring-bright-magenta"
          />
          <span className="leading-relaxed">
            {vi.payment.ui.packageSummary.termsCheckboxText}{' '}
            <Link
              href="/dieu-khoan-su-dung"
              target="_blank"
              className="text-bright-magenta underline font-semibold hover:text-deep-navy"
            >
              {vi.payment.ui.packageSummary.termsLink}
            </Link>{' '}
            {vi.payment.ui.packageSummary.andText}{' '}
            <Link
              href="/gia-thanh-toan"
              target="_blank"
              className="text-bright-magenta underline font-semibold hover:text-deep-navy"
            >
              {vi.payment.ui.packageSummary.pricingPolicyLink}
            </Link>{' '}
            {vi.payment.ui.packageSummary.termsSuffix}
          </span>
        </label>

        {error && (
          <p role="alert" className="text-xs text-red-600 font-semibold">
            {error}
          </p>
        )}

        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!isChecked || isSubmitting}
            onClick={handleAccept}
            className="w-full sm:w-auto"
          >
            {isSubmitting
              ? vi.payment.ui.packageSummary.accepting
              : vi.payment.ui.packageSummary.acceptButton}
          </Button>
        </div>
      </div>
    </Card>
  )
}
