'use client'

import React, { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import { GROWTH_MIRROR_PATH } from '@/lib/products'
import type { TrackerStats } from '@/lib/habit/tracker-stats'
import type { PublicCertificateData, CertificateEligibility } from '@/lib/habit/certificate-types'
import { issueCertificateAction } from '@/lib/habit/certificate-actions'
import { track } from '@/lib/analytics/track'

export interface TrackerSummaryCardProps {
  stats: TrackerStats
  isTrialOrExpired: boolean
  buyUrl: string
  initialCertificate?: PublicCertificateData | null
  eligibility?: CertificateEligibility | null
}

export function TrackerSummaryCard({
  stats,
  isTrialOrExpired,
  buyUrl,
  initialCertificate,
  eligibility,
}: TrackerSummaryCardProps) {
  const { completedDays, mostFrequentEmotion } = stats
  const [certificate, setCertificate] = useState<PublicCertificateData | null>(
    initialCertificate ?? eligibility?.existingCertificate ?? eligibility?.certificate ?? null,
  )
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Khóa nút tới khi trang chạy JavaScript (tránh form submit thuần trước hydration)
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const isEligible = Boolean(eligibility?.eligible) || Boolean(certificate)
  const minDays = eligibility?.certificateMinDays ?? eligibility?.minDays ?? 15

  const handleClaim = async () => {
    if (!isHydrated || isClaiming) return
    setIsClaiming(true)
    setClaimError(null)

    try {
      const res = await issueCertificateAction()
      if (res.success && res.certificate) {
        setCertificate(res.certificate)
        track('certificate_issued', { format: '4x5' })
      } else {
        setClaimError(res.error || 'Có lỗi xảy ra khi tạo chứng nhận.')
      }
    } catch {
      setClaimError('Có lỗi xảy ra khi tạo chứng nhận.')
    } finally {
      setIsClaiming(false)
    }
  }

  const handleShare = async () => {
    if (!certificate) return
    const shareUrl = `${window.location.origin}/chung-nhan/${certificate.code}`
    track('certificate_shared', { format: 'link' })

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: vi.certificate.pageTitle,
          text: vi.certificate.metaDescription,
          url: shareUrl,
        })
        return
      } catch {
        // Người dùng hủy chia sẻ hoặc không hỗ trợ -> chuyển sang sao chép clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } catch {
        // Bỏ qua lỗi sao chép
      }
    }
  }

  const handleDownload45 = () => {
    track('certificate_shared', { format: '4x5' })
  }

  const handleDownload916 = () => {
    track('certificate_shared', { format: '9x16' })
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-card border-2 border-bright-magenta/20 bg-linear-to-br from-warm-ivory via-soft-pink/30 to-lavender-mist/40 p-6 sm:p-8 shadow-md space-y-6">
      {/* 1. Header tổng kết */}
      <div className="text-center space-y-2">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-ui font-bold bg-bright-magenta text-warm-ivory shadow-xs">
          {vi.tracker.summary.badge}
        </span>
        <h2 className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy">
          {vi.tracker.summary.title}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-deep-navy/80 max-w-md mx-auto">
          {vi.tracker.summary.congrats}
        </p>
      </div>

      {/* 2. Thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Số ngày hoàn thành */}
        <div className="p-4 rounded-xl border border-deep-navy/10 bg-warm-ivory/90 text-center space-y-1">
          <p className="text-xs font-ui uppercase font-semibold text-deep-navy/60">
            {vi.tracker.summary.progressTitle}
          </p>
          <p className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy">
            {completedDays}{' '}
            <span className="text-base text-deep-navy/60 font-normal">
              {vi.tracker.summary.totalDaysSuffix}
            </span>
          </p>
          <div className="w-full bg-deep-navy/10 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-accent-pink h-full rounded-full transition-all duration-500 motion-reduce:transition-none"
              style={{ width: `${Math.min(100, Math.round((completedDays / 21) * 100))}%` }}
            />
          </div>
        </div>

        {/* Cảm xúc gặp nhiều nhất */}
        <div className="p-4 rounded-xl border border-deep-navy/10 bg-warm-ivory/90 text-center space-y-1 flex flex-col justify-center">
          <p className="text-xs font-ui uppercase font-semibold text-deep-navy/60">
            {vi.tracker.summary.mostFrequentEmotionTitle}
          </p>
          {mostFrequentEmotion ? (
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-3xl leading-none" role="img" aria-hidden="true">
                {mostFrequentEmotion.emoji}
              </span>
              <div className="text-left">
                <p className="font-ui font-bold text-base text-deep-navy">
                  {mostFrequentEmotion.label}
                </p>
                <p className="text-xs text-deep-navy/60">
                  {mostFrequentEmotion.count} {vi.tracker.summary.emotionCountSuffix}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-sans italic text-deep-navy/60 mt-1">
              {vi.tracker.summary.noEmotion}
            </p>
          )}
        </div>
      </div>

      {/* 3. Khối Chứng nhận 21 ngày */}
      <div className="pt-2">
        {certificate ? (
          // Đã có chứng nhận -> Hiện preview và các nút tải/chia sẻ
          <div className="p-5 sm:p-6 rounded-2xl border-2 border-accent-pink/30 bg-warm-ivory text-center space-y-5 shadow-sm">
            <div className="space-y-1">
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-ui font-bold bg-mint-haze text-deep-navy">
                {vi.certificate.badge}
              </span>
              <h3 className="font-ui font-bold text-xl text-deep-navy">
                {vi.certificate.pageTitle}
              </h3>
              <p className="text-xs font-sans text-deep-navy/70">
                {vi.certificate.verificationCodeLabel}{' '}
                <span className="font-mono font-bold text-deep-navy">{certificate.code}</span>
              </p>
            </div>

            {/* Ảnh xem trước 4:5 */}
            <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-deep-navy/10 shadow-md aspect-4/5 bg-soft-pink/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/chung-nhan/${certificate.code}/anh/4x5`}
                alt={certificate.customerName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Các nút thao tác */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <a
                href={`/chung-nhan/${certificate.code}/anh/4x5`}
                download={`chung-nhan-${certificate.code}-4x5.png`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownload45}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-accent-pink text-warm-ivory font-ui font-bold text-xs sm:text-sm hover:bg-accent-pink/90 transition-all shadow-xs"
              >
                {vi.certificate.actions.download45}
              </a>
              <a
                href={`/chung-nhan/${certificate.code}/anh/9x16`}
                download={`chung-nhan-${certificate.code}-9x16.png`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownload916}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full border-2 border-accent-pink text-deep-navy bg-warm-ivory hover:bg-soft-pink font-ui font-bold text-xs sm:text-sm transition-all shadow-xs"
              >
                {vi.certificate.actions.download916}
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-deep-navy/20 text-deep-navy bg-warm-ivory hover:bg-lavender-mist/40 font-ui font-semibold text-xs sm:text-sm transition-all"
              >
                {copied ? vi.certificate.actions.copiedLink : vi.certificate.actions.share}
              </button>
              <Link
                href={`/chung-nhan/${certificate.code}`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full text-bright-magenta hover:text-bright-magenta/80 underline font-ui font-semibold text-xs sm:text-sm transition-all"
              >
                {vi.certificate.actions.viewPublicPage} &rarr;
              </Link>
            </div>
          </div>
        ) : isEligible ? (
          // Đủ điều kiện nhưng chưa nhận -> Hiện nút nhận chứng nhận
          <div className="p-5 sm:p-6 rounded-2xl border-2 border-accent-pink/40 bg-warm-ivory text-center space-y-4 shadow-sm">
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-ui font-bold bg-mint-haze text-deep-navy">
              {vi.certificate.badge}
            </span>
            <h3 className="font-ui font-bold text-lg sm:text-xl text-deep-navy">
              {vi.certificate.pageTitle}
            </h3>
            <p className="font-sans text-xs sm:text-sm text-deep-navy/80 max-w-md mx-auto">
              Chúc mừng bạn đã hoàn thành chặng đường 21 ngày rèn luyện thói quen! Hãy nhận chứng
              nhận tốt nghiệp của riêng bạn.
            </p>

            {claimError && (
              <p className="text-xs font-sans text-bright-magenta bg-soft-pink/60 p-2.5 rounded-lg border border-bright-magenta/20 max-w-md mx-auto">
                {claimError}
              </p>
            )}

            <button
              type="button"
              disabled={!isHydrated || isClaiming}
              onClick={handleClaim}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-accent-pink text-warm-ivory font-ui font-bold text-sm hover:bg-accent-pink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isClaiming
                ? vi.certificate.actions.gettingCertificate
                : vi.certificate.actions.getCertificate}
            </button>
          </div>
        ) : (
          // Chưa đủ điều kiện -> Lời động viên, không cấp
          <div className="p-5 rounded-2xl border border-butter-cream bg-warm-ivory/90 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-deep-navy">
              <span className="text-xl" role="img" aria-hidden="true">
                🌱
              </span>
              <h4 className="font-ui font-bold text-sm text-deep-navy">
                {vi.certificate.notEligible.title}
              </h4>
            </div>
            <p className="font-sans text-xs text-deep-navy/80 max-w-md mx-auto">
              {eligibility?.reason === 'before_day_21' || eligibility?.reason === 'NOT_YET_DAY_21'
                ? vi.certificate.notEligible.notDay21Notice
                : vi.certificate.notEligible.minDaysNotice(minDays)}
            </p>
            <p className="font-sans text-xs italic text-bright-magenta">
              {vi.certificate.notEligible.keepGoing}
            </p>
          </div>
        )}
      </div>

      {/* 4. Hành động chuyển đổi */}
      <div className="pt-4 border-t border-deep-navy/10 flex flex-col sm:flex-row items-center justify-center gap-3">
        {isTrialOrExpired && (
          <Link
            href={buyUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-bright-magenta text-warm-ivory font-ui font-bold text-sm hover:bg-bright-magenta/90 shadow-sm transition-all motion-reduce:transition-none"
          >
            {vi.tracker.summary.buyButton}
          </Link>
        )}
        <Link
          href={GROWTH_MIRROR_PATH}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full border-2 border-accent-pink text-deep-navy bg-warm-ivory hover:bg-soft-pink font-ui font-bold text-sm transition-all motion-reduce:transition-none shadow-xs"
        >
          {vi.tracker.summary.bookingButton}
        </Link>
      </div>
    </div>
  )
}
