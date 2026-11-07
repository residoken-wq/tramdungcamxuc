'use client'

import React, { useState, useId } from 'react'
import Link from 'next/link'
import {
  Copy,
  Check,
  Plane,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Download,
} from 'lucide-react'
import { IdentityFormData, LoopTechniques } from '../types'
import { StepQuoteHeader } from '../StepQuoteHeader'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'
import type { PublicTechnique } from '@/lib/habit'
import type { CleanStepQuote } from '@/lib/habit/journey-content.server'
import { daysToWeekdays } from '../draft-adapter'
import { DEFAULT_DP01_CONTENT, type Dp01Step6Content } from '@/lib/habit/dp01-content'
import { vi } from '@/lib/i18n/vi'

interface BoardingPassCardProps {
  /** Journey length stored in site settings (default 28). */
  journeyDays?: number
  identity: IdentityFormData
  loopTechniques: LoopTechniques
  techniques?: PublicTechnique[]
  step6Content?: Dp01Step6Content
  stepQuote?: CleanStepQuote | null
  onPrev: () => void
  // Submission fields
  name?: string
  email?: string
  consent?: boolean
  honeypot?: string
  isSubmitting?: boolean
  submitError?: string | null
  submitSuccess?: boolean
  trackerDestination?: string
  zaloGroupUrl?: string
  privacyNote?: string | null
  isEmailReadOnly?: boolean
  showConsentCheckbox?: boolean
  showTurnstile?: boolean
  onNameChange?: (val: string) => void
  onEmailChange?: (val: string) => void
  onConsentChange?: (val: boolean) => void
  onHoneypotChange?: (val: string) => void
  onTurnstileVerify?: (token: string) => void
  onSubmitPlan?: (e: React.FormEvent) => void
  onStartTracking?: () => void
}

export function BoardingPassCard({
  journeyDays = 28,
  identity,
  loopTechniques,
  techniques = [],
  step6Content = DEFAULT_DP01_CONTENT.step6,
  stepQuote,
  onPrev,
  name = '',
  email = '',
  consent = false,
  honeypot = '',
  isSubmitting = false,
  submitError = null,
  submitSuccess = false,
  trackerDestination = '/habit/tracker',
  zaloGroupUrl = '',
  privacyNote,
  isEmailReadOnly = false,
  showConsentCheckbox = true,
  showTurnstile = true,
  onNameChange,
  onEmailChange,
  onConsentChange,
  onHoneypotChange,
  onTurnstileVerify,
  onSubmitPlan,
  onStartTracking,
}: BoardingPassCardProps) {
  const [copied, setCopied] = useState(false)
  const [downloadingFormat, setDownloadingFormat] = useState<'4x5' | '9x16' | null>(null)
  const nameId = useId()
  const emailId = useId()
  const consentId = useId()

  const handleDownloadImage = async (format: '4x5' | '9x16') => {
    setDownloadingFormat(format)
    try {
      const allTechIds = [
        ...loopTechniques.cues,
        ...loopTechniques.cravings,
        ...loopTechniques.responses,
        ...loopTechniques.rewards,
      ]
        .map((id) => Number(id))
        .filter((n) => !isNaN(n))

      const payload = {
        identityStatement: `Tôi sẽ ${identity.identityAction || ''} để trở thành ${identity.identityRole || ''}`,
        actionText: identity.identityAction || undefined,
        anchorHabit: identity.selectedMentor || undefined,
        twoMinuteAction: identity.atomicHabit || undefined,
        rhythmDays: daysToWeekdays(identity.selectedDays),
        techniqueIds: allTechIds,
        startDate: identity.startDate || undefined,
      }

      const res = await fetch(`/habit/boarding-pass/anh/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const blob = await res.blob()
        const fileName = `tdcx-boarding-pass-${format}.png`
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch {
      // Ignore download error
    } finally {
      setDownloadingFormat(null)
    }
  }

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`
    }
    return dateStr
  }

  // Tính chuỗi hiển thị nhịp điệu
  let rateText = 'Chưa chọn nhịp'
  if (identity.selectedDays.length === 7) {
    rateText = 'Mỗi ngày (cả tuần)'
  } else if (identity.selectedDays.length > 0) {
    rateText = `${identity.selectedDays.length} lần một tuần · ${identity.selectedDays.join(' · ')}`
  }

  // Social caption template theo đúng yêu cầu
  const handleCopyCaption = () => {
    const text = `Mình vừa lên chuyến 28 ngày: tôi sẽ ${identity.identityAction || '…'}, để trở thành ${identity.identityRole || '…'}.\n\nNhịp điệu: ${rateText}.\nThói quen hạt nhân: ${identity.atomicHabit || '…'}.\n\nĐều đặn một điều — mọi điều đều đặn. Ai muốn đi cùng thì nhắn mình nhé.`

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const resolveTechNames = (ids: string[]) => {
    return ids
      .map((id) => {
        const match = techniques?.find((t) => String(t.id) === String(id) || t.name === id)
        return match ? match.name : id
      })
      .filter(Boolean)
  }

  const cueNames = resolveTechNames(loopTechniques.cues)
  const cravingNames = resolveTechNames(loopTechniques.cravings)
  const responseNames = resolveTechNames(loopTechniques.responses)
  const rewardNames = resolveTechNames(loopTechniques.rewards)

  const quoteText = stepQuote?.text?.trim()
    ? `“${stepQuote.text.replace(/^["“”\s]+|["“”\s]+$/g, '')}”`
    : '“Chúng ta là kết quả của những hành động chúng ta lặp lại mỗi ngày.”'
  const quoteAuthor = stepQuote?.author?.trim() ? stepQuote.author : '— Aristotle —'

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Quote Block chuẩn hóa cho HABIT BOARDING PASS */}
      <StepQuoteHeader
        stage="GIAI ĐOẠN 2 · XÂY THÓI QUEN"
        title="Habit Boarding Pass"
        quote={quoteText}
        author={quoteAuthor}
      />

      {/* Lead-in Text */}
      <p className="text-center text-deep-navy/70 text-sm md:text-base max-w-2xl mx-auto mt-4 mb-8 leading-relaxed font-ui">
        {step6Content.leadIn}
      </p>

      {/* 2. Boarding Pass Ticket Container */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#F5D0E6] via-[#E0C6FA] to-[#D0CCF7] text-deep-navy shadow-soft-lg overflow-hidden border border-lavender-mist">
        {/* Soft pastel ambient glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-mint-haze/50 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-soft-pink/70 rounded-full blur-3xl pointer-events-none -ml-24 -mb-24" />

        {/* Ticket Header: Cạnh trái ghi HABIT BOARDING PASS, Cạnh phải ghi Trạm Dừng Cảm Xúc ♡ */}
        <div className="p-6 sm:p-7 bg-white/70 backdrop-blur-md border-b border-lavender-mist relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-lavender-mist shadow-xs flex-shrink-0">
                <Plane className="w-5 h-5 text-bright-magenta rotate-45" />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-2xl text-deep-navy uppercase tracking-wider">
                  {step6Content.passTitle}
                </h2>
                <span className="font-mono text-xs text-deep-navy/70 font-semibold">
                  {identity.startDate ? formatShortDate(identity.startDate) : ''} →{' '}
                  {identity.endDate ? formatShortDate(identity.endDate) : ''} - {journeyDays} ngày
                </span>
              </div>
            </div>

            <div className="text-right flex items-center gap-1.5 justify-end">
              <span className="font-quote italic text-lg sm:text-2xl text-deep-navy block">
                Trạm Dừng Cảm Xúc
              </span>
              <span
                className="text-bright-magenta text-lg sm:text-2xl font-quote leading-none select-none font-normal"
                aria-hidden="true"
              >
                ♡
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 sm:p-8 space-y-6 relative z-10">
          {/* Row 1: TUYÊN NGÔN VỀ THÓI QUEN */}
          <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-sm border border-lavender-mist shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-bright-magenta font-ui">
              TUYÊN NGÔN VỀ THÓI QUEN
            </span>
            <p className="font-ui text-base sm:text-lg text-deep-navy font-medium leading-relaxed">
              {identity.identityAction || identity.identityRole ? (
                <>
                  &ldquo;Tôi sẽ{' '}
                  <span className="text-bright-magenta font-bold underline decoration-bright-magenta/50 underline-offset-4">
                    {identity.identityAction || '...'}
                  </span>{' '}
                  để trở thành{' '}
                  <span className="text-bright-magenta font-bold underline decoration-accent-pink/50 underline-offset-4">
                    {identity.identityRole || '...'}
                  </span>
                  .&rdquo;
                </>
              ) : (
                <>&ldquo;Tôi sẽ ... để trở thành ....&rdquo;</>
              )}
            </p>
          </div>

          {/* Row 2: 4 Label thông tin nhỏ (Grid 2x2): NHỊP ĐIỆU, THÓI QUEN HẠT NHÂN, MENTOR, BẠN ĐỒNG HÀNH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. NHỊP ĐIỆU */}
            <div className="p-4 rounded-xl bg-white/75 backdrop-blur-sm border border-lavender-mist shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-bright-magenta font-ui block">
                NHỊP ĐIỆU
              </span>
              <div className="font-display text-base sm:text-lg text-deep-navy">{rateText}</div>
              <p className="text-xs text-deep-navy/70 font-ui font-medium">
                {identity.selectedDays.length > 0 ? 'Theo kế hoạch cam kết' : 'Chưa chọn ngày'}
              </p>
            </div>

            {/* 2. THÓI QUEN HẠT NHÂN */}
            <div className="p-4 rounded-xl bg-white/75 backdrop-blur-sm border border-lavender-mist shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-bright-magenta font-ui block">
                THÓI QUEN HẠT NHÂN
              </span>
              <div className="font-ui font-bold text-sm sm:text-base text-deep-navy truncate">
                {identity.atomicHabit || '—'}
              </div>
              <p className="text-xs text-deep-navy/60 font-ui">Phiên bản dưới 2 phút</p>
            </div>

            {/* 3. MENTOR */}
            <div className="p-4 rounded-xl bg-white/75 backdrop-blur-sm border border-lavender-mist shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-bright-magenta font-ui block">
                MENTOR
              </span>
              <div className="font-ui font-bold text-sm sm:text-base text-deep-navy truncate">
                {identity.selectedMentor
                  ? `Sau khi ${identity.selectedMentor}${identity.mentorTime ? ` · ${identity.mentorTime}` : ''}`
                  : '—'}
              </div>
              <p className="text-xs text-deep-navy/60 font-ui">Thói quen neo đã vững</p>
            </div>

            {/* 4. BẠN ĐỒNG HÀNH */}
            <div className="p-4 rounded-xl bg-white/75 backdrop-blur-sm border border-lavender-mist shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-bright-magenta font-ui block">
                BẠN ĐỒNG HÀNH
              </span>
              <div className="font-ui font-bold text-sm sm:text-base text-deep-navy truncate">
                {identity.companionName || identity.partnerName || '—'}
              </div>
              <p className="text-xs text-deep-navy/60 font-ui">Người soi chiếu & cổ vũ</p>
            </div>
          </div>

          {/* Row 3: 4 Khối bên dưới: 1 · CUE · TÍN HIỆU, 2 · CRAVING · KHAO KHÁT, 3 · RESPONSE · PHẢN HỒI, 4 · REWARD · PHẦN THƯỞNG */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-deep-navy/70 font-ui block">
              4 Quy luật đã chọn:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-ui">
              {/* Cue */}
              <div className="p-2.5 rounded-xl bg-white/75 backdrop-blur-sm border border-lavender-mist shadow-xs">
                <span className="text-bright-magenta font-bold block text-[10px] uppercase">
                  1 · CUE · TÍN HIỆU
                </span>
                <span className="text-deep-navy text-[11px] line-clamp-2 font-medium">
                  {cueNames.length > 0 ? (
                    cueNames.join(', ')
                  ) : (
                    <span className="opacity-40 italic">chưa chọn</span>
                  )}
                </span>
              </div>

              {/* Craving */}
              <div className="p-2.5 rounded-xl bg-white/75 backdrop-blur-sm border border-lavender-mist shadow-xs">
                <span className="text-bright-magenta font-bold block text-[10px] uppercase">
                  2 · CRAVING · KHAO KHÁT
                </span>
                <span className="text-deep-navy text-[11px] line-clamp-2 font-medium">
                  {cravingNames.length > 0 ? (
                    cravingNames.join(', ')
                  ) : (
                    <span className="opacity-40 italic">chưa chọn</span>
                  )}
                </span>
              </div>

              {/* Response */}
              <div className="p-2.5 rounded-xl bg-white/75 backdrop-blur-sm border border-lavender-mist shadow-xs">
                <span className="text-[#065F46] font-bold block text-[10px] uppercase">
                  3 · RESPONSE · PHẢN HỒI
                </span>
                <span className="text-deep-navy text-[11px] line-clamp-2 font-medium">
                  {responseNames.length > 0 ? (
                    responseNames.join(', ')
                  ) : (
                    <span className="opacity-40 italic">chưa chọn</span>
                  )}
                </span>
              </div>

              {/* Reward */}
              <div className="p-2.5 rounded-xl bg-white/75 backdrop-blur-sm border border-lavender-mist shadow-xs">
                <span className="text-[#9C7A14] font-bold block text-[10px] uppercase">
                  4 · REWARD · PHẦN THƯỞNG
                </span>
                <span className="text-deep-navy text-[11px] line-clamp-2 font-medium">
                  {rewardNames.length > 0 ? (
                    rewardNames.join(', ')
                  ) : (
                    <span className="opacity-40 italic">chưa chọn</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Footer Bar */}
          <div className="pt-4 border-t border-dashed border-lavender-mist flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-deep-navy/70 font-quote italic">
              <span
                className="text-bright-magenta text-base font-normal select-none"
                aria-hidden="true"
              >
                ♡
              </span>
              <span>Dừng lại • Lắng nghe • Sống trọn vẹn hơn</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Các nút tải ảnh & sao chép caption */}
      <div className="text-center pt-2 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownloadImage('9x16')}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-white hover:bg-warm-ivory text-deep-navy border border-lavender-mist hover:border-bright-magenta text-xs font-ui font-semibold transition-all active:scale-95 shadow-soft cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-bright-magenta" />
            <span>
              {downloadingFormat === '9x16' ? vi.dp01.generatingImage : vi.dp01.downloadCover916}
            </span>
          </button>

          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownloadImage('4x5')}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-white hover:bg-warm-ivory text-deep-navy border border-lavender-mist hover:border-bright-magenta text-xs font-ui font-semibold transition-all active:scale-95 shadow-soft cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-bright-magenta" />
            <span>
              {downloadingFormat === '4x5' ? vi.dp01.generatingImage : vi.dp01.downloadShare45}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopyCaption}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-white hover:bg-warm-ivory text-deep-navy border border-lavender-mist hover:border-bright-magenta text-xs font-ui font-semibold transition-all active:scale-95 shadow-soft cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#065F46]" />
                <span className="text-[#065F46] font-bold">{vi.dp01.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-bright-magenta" />
                <span>{vi.dp01.copyCaption}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Form Lên Chuyến (Quyết định H1: lưu kế hoạch máy chủ) */}
      {submitSuccess ? (
        <div className="p-6 sm:p-8 rounded-[20px] bg-mint-haze/60 border border-[#065F46]/20 shadow-soft text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-[#065F46]/10 text-[#065F46] flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl sm:text-2xl text-deep-navy uppercase">
              {vi.dp01.boardSuccessTitle}
            </h3>
            <p className="text-xs sm:text-sm text-deep-navy/80 font-ui max-w-md mx-auto leading-relaxed">
              {vi.dp01.boardSuccessDesc}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={trackerDestination}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-bright-magenta hover:bg-bright-magenta text-white font-ui font-bold text-sm shadow-soft hover:shadow-soft-md transition-all active:scale-95 w-full sm:w-auto"
            >
              <span>{vi.dp01.enterTrackerButton}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {zaloGroupUrl && (
              <a
                href={zaloGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full border border-lavender-mist bg-white hover:bg-warm-ivory text-deep-navy font-ui font-semibold text-xs transition-all active:scale-95 w-full sm:w-auto"
              >
                <span>{vi.dp01.joinZaloButton}</span>
                <ExternalLink className="w-3.5 h-3.5 text-deep-navy/60" />
              </a>
            )}
          </div>
        </div>
      ) : onSubmitPlan ? (
        <form
          onSubmit={onSubmitPlan}
          className="p-6 sm:p-7 rounded-[20px] bg-white border border-lavender-mist shadow-soft space-y-4 font-ui"
        >
          <div>
            <h3 className="font-display text-lg sm:text-xl text-deep-navy uppercase tracking-wide">
              {vi.dp01.boardingPassLeadTitle}
            </h3>
            <p className="text-xs sm:text-sm text-deep-navy/70 mt-0.5 leading-relaxed">
              {vi.dp01.boardingPassLeadDesc}
            </p>
          </div>

          {submitError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor={nameId}
                className="block text-[11px] font-bold uppercase tracking-wider text-deep-navy/70 mb-1"
              >
                {vi.dp01.nameFieldLabel}
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(e) => onNameChange && onNameChange(e.target.value)}
                placeholder={vi.dp01.namePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-lavender-mist focus:border-bright-magenta outline-none text-xs sm:text-sm text-deep-navy font-ui transition-all shadow-xs"
              />
            </div>

            <div>
              <label
                htmlFor={emailId}
                className="block text-[11px] font-bold uppercase tracking-wider text-deep-navy/70 mb-1"
              >
                {vi.dp01.emailFieldLabel} <span className="text-bright-magenta">*</span>
              </label>
              <input
                id={emailId}
                type="email"
                required
                readOnly={isEmailReadOnly}
                value={email}
                onChange={(e) => onEmailChange && onEmailChange(e.target.value)}
                placeholder="email@example.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs sm:text-sm text-deep-navy font-ui transition-all shadow-xs ${
                  isEmailReadOnly
                    ? 'bg-lavender-mist/30 border-lavender-mist/60 text-deep-navy/80 cursor-not-allowed select-all font-medium'
                    : 'bg-white border-lavender-mist focus:border-bright-magenta'
                }`}
              />
            </div>
          </div>

          {/* Honeypot */}
          <input
            type="text"
            name="user_note"
            value={honeypot}
            onChange={(e) => onHoneypotChange && onHoneypotChange(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          {/* Consent Checkbox: ẩn nếu khách đã có consentAt trước đó */}
          {showConsentCheckbox && (
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id={consentId}
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => onConsentChange && onConsentChange(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-bright-magenta focus:ring-bright-magenta cursor-pointer"
              />
              <label
                htmlFor={consentId}
                className="text-xs text-deep-navy/75 leading-relaxed cursor-pointer select-none"
              >
                {step6Content.termsText}{' '}
                <Link
                  href="/chinh-sach-bao-mat"
                  target="_blank"
                  className="text-bright-magenta underline font-semibold"
                >
                  {vi.dp01.privacyPolicyLink}
                </Link>
                .
              </label>
            </div>
          )}

          {/* Turnstile Widget: bỏ qua cho khách đã đăng nhập */}
          {showTurnstile && onTurnstileVerify && <TurnstileWidget onVerify={onTurnstileVerify} />}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-bright-magenta hover:bg-bright-magenta text-white font-ui font-bold text-sm sm:text-base shadow-soft hover:shadow-soft-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{isSubmitting ? vi.dp01.submittingPlan : vi.dp01.start28DaysButton}</span>
          </button>

          {privacyNote && (
            <p className="text-[11px] text-deep-navy/60 text-center leading-relaxed">
              {privacyNote}
            </p>
          )}
        </form>
      ) : onStartTracking ? (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onStartTracking}
            className="inline-flex items-center gap-2 px-7 sm:px-9 py-3 rounded-full bg-bright-magenta hover:bg-bright-magenta text-white text-sm sm:text-base font-ui font-semibold shadow-soft hover:shadow-soft-md transition-all active:scale-95 cursor-pointer"
          >
            <span>{vi.dp01.start28DaysButton}</span>
          </button>
        </div>
      ) : null}

      {/* 5. Navigation Bar */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-deep-navy/30 hover:border-deep-navy text-deep-navy text-sm font-ui font-semibold bg-white hover:bg-warm-ivory transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{vi.dp01.back}</span>
        </button>
      </div>
    </div>
  )
}
