'use client'

import React from 'react'
import {
  formatTimeAmPm,
  parse24hTime,
  to24hTime,
  type ParsedTime12,
} from '@/lib/habit/tracker-stats'

export { formatTimeAmPm, parse24hTime, to24hTime, type ParsedTime12 }

const DEFAULT_MINUTES = ['00', '15', '30', '45']
const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export interface TimePickerAmPmProps {
  id?: string
  value?: string // HH:mm (24h)
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
  hourAriaLabel?: string
  minuteAriaLabel?: string
  periodAriaLabel?: string
}

export function TimePickerAmPm({
  id,
  value,
  onChange,
  disabled = false,
  className = '',
  ariaLabel = 'Thời gian',
  hourAriaLabel = 'Giờ',
  minuteAriaLabel = 'Phút',
  periodAriaLabel = 'Buổi (AM hoặc PM)',
}: TimePickerAmPmProps) {
  const [pendingMinute, setPendingMinute] = React.useState('00')
  const [pendingPeriod, setPendingPeriod] = React.useState<'AM' | 'PM'>('AM')

  const parsed = parse24hTime(value)

  const currentHour = parsed ? String(parsed.hour12) : ''
  const currentMinute = parsed ? parsed.minute : pendingMinute
  const currentPeriod = parsed ? parsed.period : pendingPeriod

  const minuteOptions =
    parsed?.minute && !DEFAULT_MINUTES.includes(parsed.minute)
      ? [...DEFAULT_MINUTES, parsed.minute].sort((a, b) => Number(a) - Number(b))
      : DEFAULT_MINUTES

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextHour = e.target.value
    if (!nextHour) {
      onChange?.('')
      return
    }
    const nextTime = to24hTime(Number(nextHour), currentMinute, currentPeriod)
    onChange?.(nextTime)
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMinute = e.target.value
    setPendingMinute(nextMinute)
    if (!currentHour) return
    const nextTime = to24hTime(Number(currentHour), nextMinute, currentPeriod)
    onChange?.(nextTime)
  }

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPeriod = e.target.value as 'AM' | 'PM'
    setPendingPeriod(nextPeriod)
    if (!currentHour) return
    const nextTime = to24hTime(Number(currentHour), currentMinute, nextPeriod)
    onChange?.(nextTime)
  }

  const selectBaseClass =
    'h-10 px-2.5 py-1.5 text-xs sm:text-sm font-ui font-semibold text-deep-navy bg-white border border-lavender-mist rounded-xl focus:border-bright-magenta focus:ring-1 focus:ring-bright-magenta outline-none cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 ${className}`.trim()}
    >
      {/* 1. Chọn Giờ (1-12) */}
      <select
        id={id}
        value={currentHour}
        onChange={handleHourChange}
        disabled={disabled}
        aria-label={hourAriaLabel}
        className={`${selectBaseClass} min-w-[64px]`}
      >
        <option value="">--</option>
        {HOURS_12.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="text-deep-navy/70 font-bold select-none" aria-hidden="true">
        :
      </span>

      {/* 2. Chọn Phút (00, 15, 30, 45) */}
      <select
        id={id ? `${id}-minute` : undefined}
        value={currentMinute}
        onChange={handleMinuteChange}
        disabled={disabled}
        aria-label={minuteAriaLabel}
        className={`${selectBaseClass} min-w-[60px]`}
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* 3. Chọn AM / PM */}
      <select
        id={id ? `${id}-period` : undefined}
        value={currentPeriod}
        onChange={handlePeriodChange}
        disabled={disabled}
        aria-label={periodAriaLabel}
        className={`${selectBaseClass} min-w-[64px] font-bold text-bright-magenta`}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

