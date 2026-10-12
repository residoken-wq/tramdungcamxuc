import React from 'react'
import { vi } from '@/lib/i18n/vi'

export interface CourseProgressBarProps {
  completedLessons: number
  totalLessons: number
  progressPercent: number
  className?: string
}

export function CourseProgressBar({
  completedLessons,
  totalLessons,
  progressPercent,
  className = '',
}: CourseProgressBarProps) {
  const percent = Math.min(100, Math.max(0, progressPercent))

  return (
    <div
      className={`rounded-2xl border border-lavender-mist/60 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-sm ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy/80">
            {vi.learning.dashboard.progressTitle}
          </h3>
          <p className="mt-1 font-ui text-xs sm:text-sm text-deep-navy/70">
            {vi.learning.dashboard.progressCount(completedLessons, totalLessons)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl sm:text-3xl font-bold text-bright-magenta">
            {percent}%
          </span>
        </div>
      </div>

      <div
        className="mt-3.5 h-3 w-full overflow-hidden rounded-full bg-lavender-mist/40"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={vi.learning.dashboard.overallProgress}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-pink to-bright-magenta transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
