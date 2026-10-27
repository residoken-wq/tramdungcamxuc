'use client'

import React, { useState, useId, useEffect, useMemo, useRef } from 'react'
import { compoundGrowth, formatGrowth, formatPercent } from '@/lib/habit/one-percent'
import { vi } from '@/lib/i18n/vi'

export interface OnePercentSliderProps {
  dailyPercent?: number
  maxDays?: number
  initialDays?: number
}

export function OnePercentSlider({
  dailyPercent = 1,
  maxDays = 365,
  initialDays,
}: OnePercentSliderProps) {
  const sliderId = useId()
  const effectiveMaxDays = typeof maxDays === 'number' && maxDays > 0 ? maxDays : 365
  const defaultInitial = initialDays !== undefined ? initialDays : Math.min(365, effectiveMaxDays)

  const [days, setDays] = useState<number>(defaultInitial)
  // Same percent the calculation uses, formatted vi-VN – labels never show a value the maths ignored.
  const percent = formatPercent(dailyPercent)

  // Tính toán lãi kép
  const growth = useMemo(
    () => compoundGrowth(dailyPercent, days, effectiveMaxDays),
    [dailyPercent, days, effectiveMaxDays],
  )

  const formattedBetter = useMemo(() => formatGrowth(growth.better), [growth.better])
  const formattedWorse = useMemo(() => formatGrowth(growth.worse), [growth.worse])

  // Quản lý aria-live thông báo cho screen reader với debounce 300ms
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setLiveAnnouncement(
        vi.hb08.ariaLiveAnnouncement(days, formattedBetter, formattedWorse, percent),
      )
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [days, formattedBetter, formattedWorse, percent])

  return (
    <div className="w-full bg-warm-ivory/80 rounded-2xl border border-deep-navy/10 p-5 sm:p-7 shadow-sm">
      {/* Vùng aria-live debounce để trợ năng screen reader đọc kết quả khi dừng kéo */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Thanh điều khiển số ngày */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor={sliderId}
            className="font-ui font-bold text-sm sm:text-base text-deep-navy whitespace-nowrap"
          >
            {vi.hb08.sliderLabel}
          </label>
          <span
            aria-hidden="true"
            className="inline-flex items-center px-3 py-1 rounded-full bg-lavender-mist/50 border border-deep-navy/10 font-display text-lg sm:text-xl text-deep-navy tracking-tight whitespace-nowrap"
          >
            {vi.hb08.daysCount(days)}
          </span>
        </div>

        {/* Thanh kéo input range */}
        <div className="relative py-2 flex items-center">
          <input
            id={sliderId}
            type="range"
            min={0}
            max={effectiveMaxDays}
            step={1}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={effectiveMaxDays}
            aria-valuenow={days}
            aria-valuetext={vi.hb08.ariaValueText(days)}
            aria-label={vi.hb08.sliderAriaLabel}
            className="w-full h-3 bg-lavender-mist rounded-full appearance-none cursor-pointer accent-accent-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink focus-visible:ring-offset-2 motion-reduce:transition-none"
          />
        </div>

        {/* Mốc giới hạn min - max */}
        <div className="flex justify-between items-center text-xs font-ui text-deep-navy/60 px-0.5">
          <span>{vi.hb08.daysCount(0)}</span>
          <span className="font-medium text-deep-navy/80">
            {days > 0 && days < effectiveMaxDays ? vi.hb08.daysCount(days) : ''}
          </span>
          <span>{vi.hb08.daysCount(effectiveMaxDays)}</span>
        </div>
      </div>

      {/* 2 Khối kết quả so sánh: Tốt hơn vs Kém đi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {/* Kết quả tốt: mint-haze / chữ deep-navy */}
        <div
          data-testid="result-better"
          className="bg-mint-haze rounded-2xl border border-deep-navy/10 p-5 flex flex-col justify-between transition-all duration-200 motion-reduce:transition-none"
        >
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/70 text-deep-navy font-ui text-xs font-bold uppercase tracking-wider mb-2">
              {vi.hb08.betterLabel}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display text-3xl sm:text-4xl text-deep-navy tracking-tight">
                {vi.hb08.betterMultiplier(formattedBetter)}
              </span>
            </div>
          </div>
          <p className="mt-3 font-ui text-xs sm:text-sm text-deep-navy/80 leading-snug">
            {vi.hb08.betterResult(percent, formattedBetter)}
          </p>
        </div>

        {/* Kết quả kém: soft-pink / chữ deep-navy */}
        <div
          data-testid="result-worse"
          className="bg-soft-pink rounded-2xl border border-deep-navy/10 p-5 flex flex-col justify-between transition-all duration-200 motion-reduce:transition-none"
        >
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/70 text-deep-navy font-ui text-xs font-bold uppercase tracking-wider mb-2">
              {vi.hb08.worseLabel}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display text-3xl sm:text-4xl text-deep-navy tracking-tight">
                {vi.hb08.worseMultiplier(formattedWorse)}
              </span>
            </div>
          </div>
          <p className="mt-3 font-ui text-xs sm:text-sm text-deep-navy/80 leading-snug">
            {vi.hb08.worseResult(percent, formattedWorse)}
          </p>
        </div>
      </div>
    </div>
  )
}
