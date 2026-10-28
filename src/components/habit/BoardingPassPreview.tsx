'use client'

import React, { useState } from 'react'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import {
  buildBoardingPass,
  type BoardingPassInput,
  type HabitStage,
} from '@/lib/habit/boarding-pass'
import type { Weekday } from '@/lib/habit/rhythm'

export interface BoardingPassPreviewProps {
  identityStatement: string
  anchorHabit?: string
  twoMinuteAction?: string
  rhythmDays?: Weekday[]
  techniqueIds?: number[]
  journeyDays?: number
  availableTechniques?: Array<{ id: number; name: string; stage?: string }>
}

export function BoardingPassPreview({
  identityStatement,
  anchorHabit,
  twoMinuteAction,
  rhythmDays,
  techniqueIds = [],
  journeyDays = 28,
  availableTechniques = [],
}: BoardingPassPreviewProps) {
  const [generatingFormat, setGeneratingFormat] = useState<'4x5' | '9x16' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inputPayload: BoardingPassInput = {
    identityStatement: identityStatement?.trim() || '',
    anchorHabit: anchorHabit?.trim() || undefined,
    twoMinuteAction: twoMinuteAction?.trim() || undefined,
    rhythmDays:
      rhythmDays && rhythmDays.length > 0
        ? rhythmDays
        : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    techniqueIds,
  }

  // Dựng dữ liệu hiển thị xem trước thuần client (không gọi server)
  const data = buildBoardingPass(inputPayload, {
    journeyDays,
    startDate: new Date(),
    techniques: availableTechniques,
  })

  const handleDownload = async (format: '4x5' | '9x16') => {
    setErrorMessage(null)
    setGeneratingFormat(format)

    try {
      const res = await fetch(`/habit/boarding-pass/anh/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputPayload),
      })

      if (!res.ok) {
        let errorText = vi.hb10.errorGenerating
        try {
          const resJson = await res.json()
          if (resJson?.error) {
            errorText = resJson.error
          }
        } catch {
          // noop
        }
        setErrorMessage(errorText)
        return
      }

      const blob = await res.blob()
      const fileName = `tdcx-boarding-pass-${format}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      let shared = false
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] }) &&
        typeof navigator.share === 'function'
      ) {
        try {
          await navigator.share({
            files: [file],
            title: 'Habit Boarding Pass – Trạm Dừng Cảm Xúc',
          })
          shared = true
          track('boarding_pass_downloaded', { format, method: 'share' })
        } catch {
          // Người dùng hủy chia sẻ hoặc không hỗ trợ -> tiếp tục tải file trực tiếp
        }
      }

      if (!shared) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        track('boarding_pass_downloaded', { format, method: 'download' })
      }
    } catch {
      setErrorMessage(vi.hb10.errorGenerating)
    } finally {
      setGeneratingFormat(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h3 className="font-display text-lg sm:text-xl text-deep-navy mb-1">
          {vi.hb10.previewHeading}
        </h3>
        <p className="text-xs sm:text-sm text-deep-navy/80">{vi.hb10.previewSubtitle}</p>
      </div>

      {/* Khung Boarding Pass HTML xem trước theo Brand Book */}
      <div className="p-6 sm:p-8 rounded-2xl bg-warm-ivory border-2 border-deep-navy shadow-card space-y-6 relative overflow-hidden">
        {/* Nền gradient pastel nhẹ */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-warm-ivory via-soft-pink/30 to-lavender-mist/40 pointer-events-none"
          aria-hidden="true"
        />

        {/* Header vé */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-accent-pink/40 pb-4">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-soft-pink border border-bright-magenta text-bright-magenta font-ui font-bold text-xs tracking-wider">
            {vi.hb10.seriesLabel}
          </span>
          <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-mint-haze border border-deep-navy text-deep-navy font-ui font-bold text-xs">
            {vi.hb10.journeyBadge(data.journeyDays)} · {vi.hb10.startDatePrefix} {data.startDateStr}
          </span>
        </div>

        {/* Tiêu đề 2 tầng */}
        <div className="relative z-10">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl text-deep-navy tracking-wide">
              {vi.hb10.titleLine1.toUpperCase()}
            </span>
            <span className="font-display text-2xl sm:text-3xl text-bright-magenta tracking-wide">
              {vi.hb10.titleLine2.toUpperCase()}
            </span>
          </div>
        </div>

        {/* 1. Mục tiêu định danh */}
        <div className="relative z-10 p-4 sm:p-5 rounded-xl bg-white border border-deep-navy shadow-xs space-y-2">
          <span className="block text-[11px] font-ui font-bold uppercase tracking-wider text-bright-magenta">
            {vi.hb10.identityLabel}
          </span>
          <p className="font-quote italic text-deep-navy text-lg sm:text-xl leading-relaxed">
            &ldquo;{data.identityStatement}&rdquo;
          </p>
        </div>

        {/* 2. Thói quen neo & Bản tối giản (nếu có) */}
        {(data.anchorFormula || data.twoMinuteAction) && (
          <div className="relative z-10 p-4 rounded-xl bg-soft-pink/40 border border-accent-pink/60 space-y-1">
            <span className="block text-[11px] font-ui font-bold uppercase tracking-wider text-accent-pink">
              {data.anchorFormula ? vi.hb10.anchorLabel : vi.hb10.twoMinuteLabel}
            </span>
            <p className="font-ui font-semibold text-deep-navy text-sm sm:text-base">
              {data.anchorFormula || data.twoMinuteAction}
            </p>
          </div>
        )}

        {/* 3. Nhịp tuần (7 ô) */}
        <div className="relative z-10 p-4 sm:p-5 rounded-xl bg-white border border-lavender-mist shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-ui font-bold uppercase tracking-wider text-deep-navy">
              {vi.hb10.rhythmLabel}
            </span>
            <span className="font-ui font-bold text-bright-magenta bg-soft-pink px-2.5 py-0.5 rounded-full">
              {vi.hb10.rhythmDaysCount(data.activeRhythmCount)}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {data.rhythmDays.map((item) => (
              <div
                key={item.day}
                className={`py-2 text-center rounded-lg font-ui text-xs sm:text-sm transition-colors ${
                  item.isActive
                    ? 'bg-mint-haze border-2 border-deep-navy text-deep-navy font-bold'
                    : 'bg-lavender-mist/30 border border-dashed border-deep-navy/20 text-deep-navy/40 font-normal'
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Kỹ thuật theo 4 giai đoạn */}
        <div className="relative z-10 space-y-2.5">
          <span className="block text-[11px] font-ui font-bold uppercase tracking-wider text-deep-navy">
            {vi.hb10.techniquesHeading}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {data.techniquesByStage.map((stageItem) => (
              <div
                key={stageItem.stage}
                className="p-3 rounded-xl bg-white border border-lavender-mist text-xs space-y-1"
              >
                <span className="font-ui font-bold text-bright-magenta block">
                  {stageItem.stageTitle}
                </span>
                {stageItem.techniqueNames.length === 0 ? (
                  <span className="text-deep-navy/40 italic">{vi.hb10.noTechniquesForStage}</span>
                ) : (
                  stageItem.techniqueNames.map((name, i) => (
                    <div key={i} className="text-deep-navy font-medium">
                      • {name}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer vé */}
        <div className="relative z-10 pt-4 border-t border-deep-navy/15 flex items-center justify-between text-xs text-deep-navy/70">
          <span>Trạm Dừng Cảm Xúc</span>
          <span className="font-ui font-bold text-bright-magenta">{vi.hb10.footerUrl}</span>
        </div>
      </div>

      {/* Thông báo lỗi nếu tạo ảnh thất bại */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-soft-pink border border-accent-pink text-deep-navy text-xs sm:text-sm font-medium"
        >
          {errorMessage}
        </div>
      )}

      {/* 2 nút Tải ảnh 4:5 và Tải ảnh 9:16 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleDownload('4x5')}
          disabled={generatingFormat !== null}
          className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-deep-navy text-warm-ivory font-ui font-bold text-sm hover:bg-deep-navy/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {generatingFormat === '4x5' ? vi.hb10.generatingImage : vi.hb10.download45}
        </button>

        <button
          type="button"
          onClick={() => handleDownload('9x16')}
          disabled={generatingFormat !== null}
          className="w-full sm:w-auto px-6 py-2.5 rounded-full border-2 border-accent-pink text-deep-navy bg-warm-ivory hover:bg-soft-pink disabled:opacity-60 disabled:cursor-not-allowed font-ui font-bold text-sm transition-all shadow-xs"
        >
          {generatingFormat === '9x16' ? vi.hb10.generatingImage : vi.hb10.download916}
        </button>
      </div>
    </div>
  )
}
