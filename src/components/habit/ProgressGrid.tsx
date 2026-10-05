import React from 'react'
import { getEmotion } from '@/lib/emotions'
import { vi } from '@/lib/i18n/vi'

export type DayStatus = 'done' | 'missed' | 'today' | 'future' | 'locked'

export interface ProgressDayItem {
  day: number
  status: DayStatus
  emotionKey?: string
  note?: string
}

export interface ProgressGridProps {
  days?: ProgressDayItem[]
  onSelectDay?: (day: number) => void
  className?: string
}

/**
 * Default generator for 21 days if not fully provided.
 */
function default21Days(provided?: ProgressDayItem[]): ProgressDayItem[] {
  const map = new Map<number, ProgressDayItem>()
  if (provided) {
    for (const item of provided) {
      map.set(item.day, item)
    }
  }

  const result: ProgressDayItem[] = []
  for (let d = 1; d <= 21; d++) {
    if (map.has(d)) {
      result.push(map.get(d)!)
    } else {
      result.push({
        day: d,
        status: d === 1 ? 'today' : 'future',
      })
    }
  }
  return result
}

/**
 * Checkmark icon for completed status.
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
 * Lock icon for locked status.
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
 * Missed icon (dash / gentle pause) for missed status.
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

export function ProgressGrid({
  days,
  onSelectDay,
  className = '',
}: ProgressGridProps) {
  const allDays = default21Days(days)

  return (
    <div
      role="region"
      aria-label={vi.habit.progressGridLabel}
      className={`w-full max-w-xl mx-auto ${className}`}
    >
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {allDays.map((item) => {
          const { day, status, emotionKey } = item
          const isNonInteractive = status === 'future' || status === 'locked'
          const emotion = emotionKey ? getEmotion(emotionKey) : undefined
          const EmotionIcon = emotion?.icon

          const statusText = vi.habit.statuses[status]
          const ariaLabel = vi.habit.ariaDay(day, statusText, emotion?.label)

          // State styling and visual affordances
          let stateStyle = ''
          let indicatorIcon = null

          switch (status) {
            case 'done':
              stateStyle =
                'bg-mint-haze border-deep-navy/20 text-deep-navy font-bold hover:border-deep-navy shadow-sm cursor-pointer'
              indicatorIcon = EmotionIcon ? (
                <EmotionIcon className="w-3.5 h-3.5 text-deep-navy" />
              ) : (
                <CheckIcon className="w-3.5 h-3.5 text-deep-navy" />
              )
              break

            case 'today':
              stateStyle =
                'bg-white border-2 border-accent-pink text-deep-navy font-bold shadow-sm ring-2 ring-accent-pink/30 hover:bg-soft-pink/30 cursor-pointer'
              indicatorIcon = (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-pink animate-pulse" />
              )
              break

            case 'missed':
              stateStyle =
                'bg-soft-pink/40 border-dashed border-deep-navy/30 text-deep-navy/70 hover:border-deep-navy cursor-pointer'
              indicatorIcon = <MissedIcon className="w-3.5 h-3.5 text-deep-navy/70" />
              break

            case 'locked':
              stateStyle =
                'bg-warm-ivory border border-deep-navy/10 text-deep-navy/30 cursor-not-allowed'
              indicatorIcon = <LockIcon className="w-3.5 h-3.5 text-deep-navy/30" />
              break

            case 'future':
            default:
              stateStyle =
                'bg-white/50 border border-deep-navy/10 text-deep-navy/40 cursor-not-allowed'
              indicatorIcon = null
              break
          }

          return (
            <button
              key={day}
              type="button"
              disabled={isNonInteractive}
              aria-label={ariaLabel}
              onClick={() => {
                if (!isNonInteractive && onSelectDay) {
                  onSelectDay(day)
                }
              }}
              className={[
                'aspect-square min-h-[44px] min-w-[40px] sm:min-h-[52px] sm:min-w-[52px] p-1 rounded-xl',
                'flex flex-col items-center justify-center transition-all duration-200 select-none relative',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy',
                stateStyle,
              ].join(' ')}
            >
              <span className="text-xs sm:text-sm font-ui leading-none">
                {day}
              </span>
              <span className="h-4 flex items-center justify-center mt-0.5">
                {indicatorIcon}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
