'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatVnd } from '@/lib/format'
import type { PublicOrderViewDto } from '@/lib/payments/orders.server'

export interface OrderPaymentViewProps {
  order: PublicOrderViewDto
}

export function OrderPaymentView({ order }: OrderPaymentViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

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

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Sandbox Notice Banner */}
      {order.sandbox && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-center font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm"
        >
          <span aria-hidden="true">⚠️</span>
          <span>{order.sandboxNotice || 'THỬ NGHIỆM – không chuyển tiền thật'}</span>
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
              ⏳ Chờ chuyển khoản
            </span>
          )}
          {isPaid && (
            <span className="bg-mint-haze text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
              ✓ Đã thanh toán thành công
            </span>
          )}
          {isCancelled && (
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full border border-red-200">
              ✕ Đơn hàng đã hủy
            </span>
          )}
          {isFailed && (
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full border border-gray-300">
              ⏱ Đơn hàng đã quá hạn
            </span>
          )}
        </div>

        <h1 className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy tracking-tight">
          {isPaid
            ? 'Cảm ơn bạn! Đơn hàng đã được xác nhận'
            : isCancelled
              ? 'Đơn hàng đã được hủy'
              : isFailed
                ? 'Đơn hàng đã hết hạn thanh toán'
                : 'Thông tin chuyển khoản thanh toán'}
        </h1>

        <p className="font-sans text-sm sm:text-base text-deep-navy/80 max-w-xl mx-auto leading-relaxed">
          {isPaid
            ? 'Hệ thống đã ghi nhận thanh toán thành công. Email hướng dẫn kèm link đặt lịch hẹn với Coach đã được gửi tới hộp thư của bạn.'
            : isCancelled
              ? 'Đơn hàng này đã bị hủy theo yêu cầu. Nếu cần hỗ trợ thêm, bạn vui lòng liên hệ với Trạm Dừng Cảm Xúc.'
              : isFailed
                ? 'Đơn hàng đã quá thời hạn 24 giờ để thanh toán. Bạn vui lòng quay lại trang chủ hoặc đặt phiên mới để tiếp tục.'
                : 'Vui lòng quét mã VietQR hoặc chuyển khoản chính xác thông tin bên dưới để đơn hàng được xác nhận tự động nhanh nhất.'}
        </p>

        {order.productName && (
          <div className="pt-2 text-xs text-deep-navy/60 font-medium">
            Sản phẩm: <span className="font-semibold text-deep-navy">{order.productName}</span>
          </div>
        )}
      </Card>

      {/* Main Payment Section (Shown when Pending or Paid) */}
      {(isPending || isPaid) && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* QR Code Container */}
          <div className="md:col-span-5 flex flex-col items-center">
            <Card
              variant="white"
              className="p-6 bg-white border border-lavender-mist/60 shadow-md rounded-2xl flex flex-col items-center space-y-4 w-full"
            >
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-deep-navy uppercase tracking-wider">
                  Mã QR VietQR
                </span>
                <p className="text-xs text-deep-navy/60">Mở app ngân hàng bất kỳ để quét mã</p>
              </div>

              {/* QR SVG */}
              <div
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
                Chi tiết chuyển khoản thủ công
              </h2>

              <div className="space-y-4 text-sm">
                {/* Ngân hàng */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-lavender-mist/20">
                  <span className="text-deep-navy/70">Ngân hàng thụ hưởng:</span>
                  <span className="font-semibold text-deep-navy text-right">
                    {order.bankInfo.bankName || `Mã BIN: ${order.bankInfo.bankBin}`}
                  </span>
                </div>

                {/* Số tài khoản */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-lavender-mist/20">
                  <span className="text-deep-navy/70">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-deep-navy">
                      {order.bankInfo.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.bankInfo.accountNumber, 'accountNumber')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-lavender-mist/40 text-deep-navy hover:bg-lavender-mist transition-colors"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === 'accountNumber' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                {/* Chủ tài khoản */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-lavender-mist/20">
                  <span className="text-deep-navy/70">Chủ tài khoản:</span>
                  <span className="font-bold text-deep-navy uppercase text-right">
                    {order.bankInfo.accountName}
                  </span>
                </div>

                {/* Số tiền */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-lavender-mist/20">
                  <span className="text-deep-navy/70">Số tiền chuyển:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-ui font-bold text-lg text-bright-magenta">
                      {formatVnd(order.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(order.amount), 'amount')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-lavender-mist/40 text-deep-navy hover:bg-lavender-mist transition-colors"
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'amount' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                {/* Nội dung chuyển khoản = paymentRef */}
                <div className="p-4 rounded-xl bg-soft-pink/50 border border-accent-pink/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-deep-navy">
                      Nội dung chuyển khoản (Bắt buộc)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.paymentRef, 'paymentRef')}
                      className="px-3 py-1 text-xs font-bold rounded-lg bg-accent-pink text-white hover:bg-bright-magenta shadow-sm transition-colors"
                      title="Sao chép mã nội dung chuyển khoản"
                    >
                      {copiedField === 'paymentRef' ? '✓ Đã sao chép' : 'Sao chép mã'}
                    </button>
                  </div>

                  <div className="font-mono font-bold text-xl sm:text-2xl text-bright-magenta tracking-wide">
                    {order.paymentRef}
                  </div>

                  <p className="text-xs text-deep-navy/70 leading-relaxed">
                    ⚠️ <strong>Lưu ý:</strong> Vui lòng giữ nguyên chính xác nội dung{' '}
                    <strong>{order.paymentRef}</strong> khi chuyển khoản để hệ thống đối soát chính
                    xác.
                  </p>
                </div>
              </div>
            </Card>

            {isPending && (
              <div className="p-4 rounded-xl bg-warm-ivory border border-lavender-mist/60 text-xs text-deep-navy/75 space-y-1.5 leading-relaxed">
                <p className="font-semibold text-deep-navy">Thời gian xử lý & Hỗ trợ:</p>
                <p>
                  • Sau khi nhận được chuyển khoản, Coach Hana Lương sẽ xác nhận đơn và gửi link đặt
                  lịch qua email của bạn trong thời gian sớm nhất.
                </p>
                <p>
                  • Nếu cần hỗ trợ khẩn cấp, bạn có thể nhắn tin qua nút chat Zalo ở góc dưới màn
                  hình.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="md">
            ← Quay về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default OrderPaymentView
