'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatVnd } from '@/lib/format'
import { vi } from '@/lib/i18n/vi'
import type { PublicOrderViewDto } from '@/lib/payments/orders.server'
import { PackageSummaryTerms } from './PackageSummaryTerms'

export interface OrderPaymentViewProps {
  order: PublicOrderViewDto
}

export function OrderPaymentView({ order }: OrderPaymentViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const router = useRouter()
  // QR and bank details only arrive from the server after terms are accepted
  const termsAccepted = Boolean(order.termsAcceptedAt) || !order.createdByAdmin

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setCopiedField(fieldName)
        setTimeout(() => setCopiedField(null), 2000)
      }
    } catch {
      // Fallback
    }
  }

  const isPending = order.status === 'pending'
  const isPaid = order.status === 'paid'
  const isCancelled = order.status === 'cancelled'
  const isFailed = order.status === 'failed'

  const showPackageTerms = Boolean(order.createdByAdmin && !termsAccepted && isPending)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Sandbox Notice Banner */}
      {order.sandbox && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-center font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm"
        >
          <span aria-hidden="true">⚠️</span>
          <span>{order.sandboxNotice || vi.payment.sandboxNotice}</span>
        </div>
      )}

      {/* Status Header Banner */}
      <Card
        variant={isPending ? 'soft-pink' : 'white'}
        className={`p-6 sm:p-8 text-center space-y-3 border border-lavender-mist/60 shadow-sm rounded-2xl ${isPaid ? 'bg-mint-haze' : ''}`}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          {isPending && (
            <span className="bg-butter-cream text-deep-navy px-3 py-1 rounded-full border border-deep-navy/10">
              {vi.payment.ui.orderView.statusPendingBadge}
            </span>
          )}
          {isPaid && (
            <span className="bg-mint-haze text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
              {vi.payment.ui.orderView.statusPaidBadge}
            </span>
          )}
          {isCancelled && (
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full border border-red-200">
              {vi.payment.ui.orderView.statusCancelledBadge}
            </span>
          )}
          {isFailed && (
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full border border-gray-300">
              {vi.payment.ui.orderView.statusFailedBadge}
            </span>
          )}
        </div>

        <h1 className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy tracking-tight">
          {isPaid
            ? vi.payment.ui.orderView.titlePaid
            : isCancelled
              ? vi.payment.ui.orderView.titleCancelled
              : isFailed
                ? vi.payment.ui.orderView.titleFailed
                : vi.payment.ui.orderView.titlePending}
        </h1>

        <p className="font-sans text-sm sm:text-base text-deep-navy/80 max-w-xl mx-auto leading-relaxed">
          {isPaid
            ? vi.payment.ui.orderView.descPaid
            : isCancelled
              ? vi.payment.ui.orderView.descCancelled
              : isFailed
                ? vi.payment.ui.orderView.descFailed
                : vi.payment.ui.orderView.descPending}
        </p>

        {order.productName && (
          <div className="pt-2 text-xs text-deep-navy/60 font-medium">
            {vi.payment.ui.orderView.productPrefix}{' '}
            <span className="font-semibold text-deep-navy">{order.productName}</span>
          </div>
        )}
      </Card>

      {/* Tóm tắt gói & Điều khoản (Khi đơn do admin tạo chưa đồng ý điều khoản) */}
      {showPackageTerms && (
        <PackageSummaryTerms
          summary={order.packageSummary}
          productName={order.productName}
          amount={order.amount}
          payToken={order.payToken || ''}
          onTermsAccepted={() => router.refresh()}
        />
      )}

      {/* Main Payment Section (Shown when Pending or Paid, chỉ hiển thị sau khi đã đồng ý điều khoản) */}
      {!showPackageTerms && (isPending || isPaid) && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* QR Code Container */}
          <div className="md:col-span-5 flex flex-col items-center">
            <Card
              variant="white"
              className="p-6 bg-white border border-lavender-mist/60 shadow-md rounded-2xl flex flex-col items-center space-y-4 w-full"
            >
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-deep-navy uppercase tracking-wider">
                  {vi.payment.ui.orderView.qrTitle}
                </span>
                <p className="text-xs text-deep-navy/60">{vi.payment.ui.orderView.qrInstruction}</p>
              </div>

              {/* QR SVG */}
              <div
                data-testid="vietqr"
                className="w-56 h-56 max-w-full p-2 bg-white rounded-xl border border-lavender-mist/40 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: order.qrSvg }}
              />

              <div className="text-center">
                <span className="font-ui font-bold text-2xl text-bright-magenta">
                  {formatVnd(order.amount)}
                </span>
              </div>
            </Card>
          </div>

          {/* Transfer Details Card */}
          <div className="md:col-span-7 space-y-4">
            <Card
              variant="white"
              className="p-6 sm:p-7 bg-white border border-lavender-mist/60 shadow-sm rounded-2xl space-y-5"
            >
              <h2 className="font-ui font-bold text-lg text-deep-navy pb-2 border-b border-lavender-mist/40">
                {vi.payment.ui.orderView.transferCardTitle}
              </h2>

              <div className="space-y-4 text-sm">
                {/* Ngân hàng */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-lavender-mist/20">
                  <span className="text-deep-navy/70">{vi.payment.ui.orderView.bankNameLabel}</span>
                  <span className="font-semibold text-deep-navy text-right">
                    {order.bankInfo.bankName ||
                      `${vi.payment.ui.orderView.bankBinPrefix} ${order.bankInfo.bankBin}`}
                  </span>
                </div>

                {/* Số tài khoản */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-lavender-mist/20">
                  <span className="text-deep-navy/70">
                    {vi.payment.ui.orderView.accountNumberLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-deep-navy">
                      {order.bankInfo.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.bankInfo.accountNumber, 'accountNumber')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-lavender-mist/40 text-deep-navy hover:bg-lavender-mist transition-colors"
                      title={vi.payment.ui.orderView.copyAccountTitle}
                      aria-label={vi.payment.ui.orderView.copyAccountTitle}
                    >
                      {copiedField === 'accountNumber'
                        ? vi.payment.ui.orderView.copiedShort
                        : vi.payment.ui.orderView.copyButton}
                    </button>
                  </div>
                </div>

                {/* Chủ tài khoản */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-lavender-mist/20">
                  <span className="text-deep-navy/70">
                    {vi.payment.ui.orderView.accountNameLabel}
                  </span>
                  <span className="font-bold text-deep-navy uppercase text-right">
                    {order.bankInfo.accountName}
                  </span>
                </div>

                {/* Số tiền */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-lavender-mist/20">
                  <span className="text-deep-navy/70">{vi.payment.ui.orderView.amountLabel}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-ui font-bold text-lg text-bright-magenta">
                      {formatVnd(order.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(order.amount), 'amount')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-lavender-mist/40 text-deep-navy hover:bg-lavender-mist transition-colors"
                      title={vi.payment.ui.orderView.copyAmountTitle}
                      aria-label={vi.payment.ui.orderView.copyAmountTitle}
                    >
                      {copiedField === 'amount'
                        ? vi.payment.ui.orderView.copiedShort
                        : vi.payment.ui.orderView.copyButton}
                    </button>
                  </div>
                </div>

                {/* Nội dung chuyển khoản = paymentRef */}
                <div className="p-4 rounded-xl bg-soft-pink/50 border border-accent-pink/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-deep-navy">
                      {vi.payment.ui.orderView.paymentRefLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.paymentRef, 'paymentRef')}
                      className="px-3 py-1 text-xs font-bold rounded-lg bg-accent-pink text-white hover:bg-bright-magenta shadow-sm transition-colors"
                      title={vi.payment.ui.orderView.copyRefTitle}
                      aria-label={vi.payment.ui.orderView.copyRefTitle}
                    >
                      {copiedField === 'paymentRef'
                        ? vi.payment.ui.orderView.copiedButton
                        : vi.payment.ui.orderView.copyRefButton}
                    </button>
                  </div>

                  <div className="font-mono font-bold text-xl sm:text-2xl text-bright-magenta tracking-wide">
                    {order.paymentRef}
                  </div>

                  <p className="text-xs text-deep-navy/70 leading-relaxed">
                    ⚠️ <strong>{vi.payment.ui.orderView.noticeLabel}</strong>{' '}
                    {vi.payment.ui.orderView.refNotice}
                  </p>
                </div>
              </div>
            </Card>

            {isPending && (
              <div className="p-4 rounded-xl bg-warm-ivory border border-lavender-mist/60 text-xs text-deep-navy/75 space-y-1.5 leading-relaxed">
                <p className="font-semibold text-deep-navy">
                  {vi.payment.ui.orderView.timingNoticeTitle}
                </p>
                <p>{vi.payment.ui.orderView.timingNoticeLine1}</p>
                <p>{vi.payment.ui.orderView.timingNoticeLine2}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="md">
            {vi.payment.ui.orderView.backHomeButton}
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default OrderPaymentView
