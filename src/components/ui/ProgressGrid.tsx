'use client'

import React from 'react'
import { getEmotion } from '@/lib/emotions'
import { vi } from '@/lib/i18n/vi'

export type DayStatus =
  'done' | 'missed' | 'today' | 'future' | 'locked' | 'rest' | 'voted' | 'minimal' | 'upcoming'

export interface ProgressDayItem {
  day: number
  status: DayStatus
  emotionKey?: string
  note?: string
  disabled?: boolean
  date?: { short: string; full: string } | null
}

export interface ProgressStationItem {
  name: string | null
  fromDay: number
  toDay: number
  votedCount?: number
  votingDaysTotal?: number
  days: ProgressDayItem[]
}

export interface ProgressGridProps {
  /**
   * Mảng trạng thái chi tiết cho từng ngày (1–28).
   */
  days?: ProgressDayItem[]
  /**
   * Danh sách ngày đã hoàn thành (số lượng ngày đã xong, ví dụ 5 -> ngày 1..5 done; hoặc mảng [1, 2, 5]).
   */
  doneDays?: number | number[]
  /**
   * Tổng số ngày của hành trình (mặc định tự suy từ days/doneDays hoặc 21).
   */
  totalDays?: number
  /**
   * Callback khi người dùng chọn ngày (nếu ở chế độ tương tác).
   */
  onSelectDay?: (day: number) => void
  /**
   * ClassName bổ sung cho container.
   */
  className?: string
  /**
   * Chế độ chỉ xem (view-only), không cho phép click. Mặc định là true nếu không truyền onSelectDay.
   */
  readOnly?: boolean
  /**
   * Chia lưới theo trạm (HB-11). Khi truyền vào, ProgressGrid sẽ hiển thị từng khối trạm.
   */
  stations?: ProgressStationItem[]
}

/**
 * Generator for days in journey.
 * Hỗ trợ linh hoạt prop `days`, `doneDays` và `totalDays` (21 hoặc 28 ngày).
 */
export function build21Days(
  provided?: ProgressDayItem[],
  doneDays?: number | number[],
  customTotalDays?: number,
): ProgressDayItem[] {
  const map = new Map<number, ProgressDayItem>()
  let maxProvidedDay = 0
  if (provided) {
    for (const item of provided) {
      map.set(item.day, item)
      if (item.day > maxProvidedDay) maxProvidedDay = item.day
    }
  }

  // Nếu truyền doneDays (number hoặc number[])
  let maxDoneDay = 0
  const doneSet = new Set<number>()
  if (typeof doneDays === 'number') {
    maxDoneDay = Math.max(0, doneDays)
    for (let i = 1; i <= maxDoneDay; i++) {
      doneSet.add(i)
    }
  } else if (Array.isArray(doneDays)) {
    for (const d of doneDays) {
      if (d >= 1) {
        doneSet.add(d)
        if (d > maxDoneDay) maxDoneDay = d
      }
    }
  }

  const total = customTotalDays ?? Math.max(21, maxProvidedDay, maxDoneDay)
  const result: ProgressDayItem[] = []
  for (let d = 1; d <= total; d++) {
    if (map.has(d)) {
      result.push(map.get(d)!)
    } else if (doneSet.has(d)) {
      result.push({
        day: d,
        status: 'done',
      })
    } else {
      result.push({
        day: d,
        status: d === 1 && doneSet.size === 0 ? 'today' : 'future',
      })
    }
  }
  return result
}

/**
 * Checkmark icon cho trạng thái hoàn thành.
 */
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  )
}

/**
 * Lock icon cho trạng thái đã khóa.
 */
function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V4.5a2.5 2.5 0 015 0V7" />
    </svg>
  )
}

/**
 * Missed icon cho trạng thái bỏ lỡ.
 */
function MissedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <line x1="4" y1="8" x2="12" y2="8" />
    </svg>
  )
}

/**
 * ProgressGrid: Lưới 21 ô hiển thị tiến trình thói quen 21 ngày.
 * Chuẩn Brand Book 2026: ô hoàn thành màu mint-haze, tương thích tốt trên mobile 375px.
 * Lưu ý: T2-06 sẽ mở rộng thành tracker có tick tương tác thật và chọn cảm xúc.
 */
function getStatusLabel(status: DayStatus): string {
  switch (status) {
    case 'voted':
      return vi.hb11.status.voted
    case 'minimal':
      return vi.hb11.status.minimal
    case 'missed':
      return vi.hb11.status.missed
    case 'rest':
      return vi.hb11.status.rest
    case 'today':
      return vi.hb11.status.today
    case 'upcoming':
      return vi.hb11.status.upcoming
    case 'done':
      return vi.habit.statuses.done
    case 'locked':
      return vi.habit.statuses.locked
    case 'future':
    default:
      return vi.habit.statuses.future
  }
}

/**
 * ProgressGrid: Lưới hiển thị tiến trình thói quen theo ngày hoặc theo các khối trạm (HB-11).
 * Chuẩn Brand Book 2026: các ô ngày dùng 8 màu token, tương thích tốt trên mobile 375px.
 */
export function ProgressGrid({
  days,
  doneDays,
  totalDays,
  onSelectDay,
  className = '',
  readOnly = false,
  stations,
}: ProgressGridProps) {
  const allDays = build21Days(days, doneDays, totalDays)
  const isInteractive = Boolean(onSelectDay) && !readOnly

  const renderDayButton = (item: ProgressDayItem) => {
    const { day, status, emotionKey, disabled: itemDisabled } = item
    const isNonInteractive =
      !isInteractive ||
      Boolean(itemDisabled) ||
      status === 'future' ||
      status === 'locked' ||
      status === 'upcoming'

    const emotion = emotionKey ? getEmotion(emotionKey) : undefined
    const statusText = getStatusLabel(status)
    let ariaLabel = vi.hb11.ariaDay(day, statusText, emotion?.label)
    if (item.date?.full) {
      ariaLabel += vi.hb23.ariaDayDateSuffix(item.date.full)
    }

    let stateStyle = ''
    let indicatorIcon: React.ReactNode = null

    switch (status) {
      case 'voted':
      case 'done':
        stateStyle = 'bg-mint-haze border-deep-navy/20 text-deep-navy font-bold shadow-xs'
        if (isInteractive && !isNonInteractive) {
          stateStyle += ' hover:border-deep-navy cursor-pointer'
        }
        indicatorIcon = emotion ? (
          <span
            className="text-xs sm:text-sm leading-none select-none"
            role="img"
            aria-hidden="true"
          >
            {emotion.emoji}
          </span>
        ) : (
          <CheckIcon className="w-3.5 h-3.5 text-deep-navy" />
        )
        break

      case 'minimal':
        stateStyle = 'bg-soft-pink/70 border-bright-magenta/30 text-deep-navy font-bold shadow-xs'
        if (isInteractive && !isNonInteractive) {
          stateStyle += ' hover:border-bright-magenta cursor-pointer'
        }
        indicatorIcon = emotion ? (
          <span
            className="text-xs sm:text-sm leading-none select-none"
            role="img"
            aria-hidden="true"
          >
            {emotion.emoji}
          </span>
        ) : (
          <span className="text-[10px] font-ui font-extrabold text-bright-magenta tracking-tight">
            2m
          </span>
        )
        break

      case 'today':
        stateStyle =
          'bg-warm-ivory border-2 border-accent-pink text-deep-navy font-bold shadow-xs ring-2 ring-accent-pink/30'
        if (isInteractive && !isNonInteractive) {
          stateStyle += ' hover:bg-soft-pink/30 cursor-pointer'
        }
        indicatorIcon = (
          <span className="w-1.5 h-1.5 rounded-full bg-accent-pink animate-pulse motion-reduce:animate-none" />
        )
        break

      case 'missed':
        stateStyle = 'bg-butter-cream/40 border-deep-navy/20 text-deep-navy/80 font-medium'
        if (isInteractive && !isNonInteractive) {
          stateStyle += ' hover:bg-butter-cream/70 cursor-pointer'
        }
        indicatorIcon = <MissedIcon className="w-3.5 h-3.5 text-deep-navy/70" />
        break

      case 'rest':
        stateStyle = 'bg-warm-ivory border-dashed border-deep-navy/20 text-deep-navy/70 font-normal'
        if (isInteractive && !isNonInteractive) {
          stateStyle += ' hover:bg-lavender-mist/30 cursor-pointer'
        }
        indicatorIcon = (
          <span className="text-[10px] font-semibold text-deep-navy/70 select-none">
            {vi.hb11.status.rest}
          </span>
        )
        break

      case 'locked':
        stateStyle =
          'bg-deep-navy/5 border-dashed border-deep-navy/15 text-deep-navy/70 cursor-not-allowed opacity-60'
        indicatorIcon = <LockIcon className="w-3 h-3 text-deep-navy/70" />
        break

      case 'upcoming':
      case 'future':
      default:
        stateStyle =
          'bg-deep-navy/[0.02] border-deep-navy/15 text-deep-navy/70 cursor-not-allowed opacity-75'
        indicatorIcon = <LockIcon className="w-3 h-3 text-deep-navy/70" />
        break
    }

    return (
      <button
        key={day}
        type="button"
        disabled={isNonInteractive}
        onClick={() => {
          if (!isNonInteractive && onSelectDay) {
            onSelectDay(day)
          }
        }}
        aria-label={ariaLabel}
        className={[
          'relative flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl border transition-all motion-reduce:transition-none duration-150',
          item.date?.short
            ? 'min-w-0 min-h-[56px] sm:min-h-[64px]'
            : 'min-w-0 min-h-[46px] sm:min-h-[58px]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy',
          stateStyle,
        ].join(' ')}
      >
        {/* Day Number */}
        <span className="font-ui text-xs sm:text-sm leading-none font-bold">{day}</span>

        {/* Calendar Date (HB-23) */}
        {item.date?.short && (
          <span className="font-sans text-[10px] sm:text-[11px] leading-tight font-medium mt-0.5 select-none">
            {item.date.short}
          </span>
        )}

        {/* Status Indicator Slot */}
        <div className="flex items-center justify-center h-4 w-4 mt-1" aria-hidden="true">
          {indicatorIcon}
        </div>
      </button>
    )
  }

  // Nếu có stations, hiển thị theo từng trạm
  if (stations && stations.length > 0) {
    return (
      <div
        role="region"
        aria-label={vi.habit.progressGridLabel}
        className={`w-full max-w-xl mx-auto space-y-6 ${className}`}
      >
        {stations.map((st, sIdx) => {
          const stationVoted =
            st.votedCount ??
            st.days.filter(
              (d) => d.status === 'voted' || d.status === 'minimal' || d.status === 'done',
            ).length
          const stationTotal =
            st.votingDaysTotal ?? st.days.filter((d) => d.status !== 'rest').length

          return (
            <div
              key={`station-${st.fromDay}-${st.toDay}`}
              className="p-4 sm:p-5 rounded-2xl bg-warm-ivory/80 border border-deep-navy/10 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-deep-navy/10 pb-2.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="font-ui font-bold text-sm sm:text-base text-deep-navy">
                    {st.name || vi.hb11.stationFallback(sIdx + 1)}
                  </h3>
                  <span className="text-xs font-sans text-deep-navy/70">
                    {vi.hb11.stationRange(st.fromDay, st.toDay)}
                  </span>
                  {(() => {
                    const firstDate = st.days[0]?.date?.short
                    const lastDate = st.days[st.days.length - 1]?.date?.short
                    if (firstDate && lastDate) {
                      return (
                        <span className="text-xs font-sans text-deep-navy/70">
                          {vi.hb23.stationDateRange(firstDate, lastDate)}
                        </span>
                      )
                    }
                    return null
                  })()}
                </div>
                <span className="text-xs font-ui font-semibold px-2.5 py-0.5 rounded-full bg-soft-pink text-deep-navy border border-bright-magenta/15 shrink-0">
                  {vi.hb11.stationProgress(stationVoted, stationTotal)}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                {st.days.map((item) => renderDayButton(item))}
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-4 text-[11px] sm:text-xs font-sans text-deep-navy/70">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-mint-haze border border-deep-navy/20 flex items-center justify-center">
              <CheckIcon className="w-2 h-2 text-deep-navy" />
            </span>
            <span>{vi.hb11.status.voted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-soft-pink/70 border border-bright-magenta/30 flex items-center justify-center text-[9px] font-bold text-bright-magenta">
              2m
            </span>
            <span>{vi.hb11.status.minimal}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-butter-cream/40 border border-deep-navy/20 flex items-center justify-center">
              <MissedIcon className="w-2 h-2 text-deep-navy/70" />
            </span>
            <span>{vi.hb11.status.missed}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-warm-ivory border border-dashed border-deep-navy/20 flex items-center justify-center text-[9px] text-deep-navy/70 font-semibold">
              -
            </span>
            <span>{vi.hb11.status.rest}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-warm-ivory border-2 border-accent-pink flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-accent-pink" />
            </span>
            <span>{vi.hb11.status.today}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-deep-navy/5 border border-dashed border-deep-navy/15 flex items-center justify-center">
              <LockIcon className="w-2 h-2 text-deep-navy/70" />
            </span>
            <span>{vi.hb11.status.upcoming}</span>
          </div>
        </div>
      </div>
    )
  }

  // Hành vi cũ phẳng khi không truyền stations (VD: bước 4 Habit Loop)
  return (
    <div
      role="region"
      aria-label={vi.habit.progressGridLabel}
      className={`w-full max-w-xl mx-auto ${className}`}
    >
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {allDays.map((item) => renderDayButton(item))}
      </div>

      {/* Legend / Chú thích trực quan */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-[11px] sm:text-xs font-sans text-deep-navy/70">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-mint-haze border border-deep-navy/20 flex items-center justify-center">
            <CheckIcon className="w-2 h-2 text-deep-navy" />
          </span>
          <span>{vi.habit.statuses.done}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-warm-ivory border-2 border-accent-pink flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-accent-pink" />
          </span>
          <span>{vi.habit.statuses.today}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-butter-cream/40 border border-deep-navy/20 flex items-center justify-center">
            <MissedIcon className="w-2 h-2 text-deep-navy/60" />
          </span>
          <span>{vi.habit.statuses.missed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-deep-navy/5 border border-dashed border-deep-navy/15 flex items-center justify-center">
            <LockIcon className="w-2 h-2 text-deep-navy/70" />
          </span>
          <span>{vi.habit.statuses.locked} / Chưa tới</span>
        </div>
        {allDays.some((d) => d.status === 'rest') && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-lavender-mist/30 border border-dashed border-deep-navy/20 flex items-center justify-center text-[9px] text-deep-navy/60 font-semibold">
              -
            </span>
            <span>{vi.hb04.status.rest}</span>
          </div>
        )}
      </div>
    </div>
  )
}
