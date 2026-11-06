'use client'

import React from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import type { HabitStageGateResult } from '@/lib/habit/actions'

export interface StageGateProps {
  gate: HabitStageGateResult
  prescribedCategory?: 'cue' | 'craving' | 'response' | 'reward' | null
  onBack?: () => void
  onBeforeLogin?: () => void
}

/**
 * REVIEW-REQUIRED: DP-03 Màn hình cổng sau Giai đoạn 1 (/habit/5-phut).
 * Hiển thị khi khách chưa đăng nhập (login) hoặc đã hết quyền dùng thử (buy).
 * Nội dung bước 3 trở đi hoàn toàn không được render khi chưa vượt qua cổng này.
 */
export function StageGate({ gate, prescribedCategory, onBack, onBeforeLogin }: StageGateProps) {
  const isBuy = gate.status === 'buy'

  const handleLoginClick = () => {
    track('habit_gate_login_clicked')
    if (onBeforeLogin) {
      onBeforeLogin()
    }
  }

  const handleBuyClick = () => {
    track('habit_gate_buy_clicked')
  }

  // Chẩn đoán bước 1 tóm tắt
  const diagnoseSummaryText = prescribedCategory
    ? vi.dp03.diagnoseSummary[prescribedCategory] || vi.dp03.diagnoseSummary.default
    : vi.dp03.diagnoseSummary.default

  // Giá hiển thị lấy từ CMS
  const formatVnd = (amount: number) =>
    `${amount.toLocaleString('vi-VN')} ${vi.dp03.currencySuffix}`
  const hasSalePrice = typeof gate.salePrice === 'number' && gate.salePrice > 0
  const hasPrice = typeof gate.price === 'number' && gate.price > 0

  return (
    <div className="w-full max-w-xl mx-auto py-6 sm:py-10 px-4 animate-fadeIn">
      <div className="bg-warm-ivory rounded-2xl sm:rounded-3xl border border-deep-navy/15 p-6 sm:p-8 shadow-soft text-center space-y-6">
        {/* Badge nhận diện */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-ui font-bold bg-soft-pink text-deep-navy">
            <span>♡</span>
            <span>{isBuy ? vi.dp01.inProgressBadge : vi.dp01.completedBadge}</span>
          </span>
        </div>

        {/* Tiêu đề & Lời mời */}
        <div className="space-y-3">
          <h2 className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy leading-tight">
            {isBuy ? vi.dp03.buyTitle : vi.dp03.loginTitle}
          </h2>

          {!isBuy ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-lavender-mist/40 border border-lavender-mist text-xs sm:text-sm text-deep-navy/90 text-left leading-relaxed">
                <span className="font-semibold block mb-0.5 text-bright-magenta">
                  {vi.dp01.completedBadge}:
                </span>
                {diagnoseSummaryText}
              </div>
              <p className="font-sans text-sm sm:text-base text-deep-navy/80 max-w-md mx-auto leading-relaxed">
                {vi.dp03.loginPrompt}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-sans text-sm sm:text-base text-deep-navy/80 max-w-md mx-auto leading-relaxed">
                {vi.dp03.buyDescription}
              </p>
              {(hasSalePrice || hasPrice) && (
                <div className="inline-flex items-baseline gap-2 px-4 py-2 rounded-xl bg-soft-pink/50 border border-lavender-mist">
                  {hasSalePrice ? (
                    <>
                      <span className="text-xs text-deep-navy/70 font-ui font-medium">
                        {vi.dp03.salePricePrefix}
                      </span>
                      <span className="text-lg sm:text-xl font-ui font-bold text-bright-magenta">
                        {formatVnd(gate.salePrice!)}
                      </span>
                      {hasPrice && (
                        <span className="text-xs text-deep-navy/50 line-through">
                          {formatVnd(gate.price!)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-deep-navy/70 font-ui font-medium">
                        {vi.dp03.pricePrefix}
                      </span>
                      <span className="text-lg sm:text-xl font-ui font-bold text-deep-navy">
                        {formatVnd(gate.price!)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nút hành động */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {!isBuy ? (
            <>
              {gate.loginUrl && (
                <Link
                  href={gate.loginUrl}
                  onClick={handleLoginClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-ui font-bold text-sm sm:text-base shadow-soft hover:shadow-soft-md transition-all active:scale-95 cursor-pointer"
                >
                  {vi.dp03.loginButton}
                </Link>
              )}
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-full border border-deep-navy/20 text-deep-navy bg-warm-ivory hover:bg-lavender-mist/40 font-ui font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  {vi.dp03.backToStage1}
                </button>
              )}
            </>
          ) : (
            <>
              {gate.buyUrl && (
                <Link
                  href={gate.buyUrl}
                  onClick={handleBuyClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-ui font-bold text-sm sm:text-base shadow-soft hover:shadow-soft-md transition-all active:scale-95 cursor-pointer"
                >
                  {vi.dp03.buyButton}
                </Link>
              )}
              {gate.offerUrl && (
                <Link
                  href={gate.offerUrl}
                  className="w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-full border border-deep-navy/20 text-deep-navy bg-warm-ivory hover:bg-lavender-mist/40 font-ui font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  {vi.dp03.viewOfferButton}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
