import React from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import type { CourseDashboardLesson } from '@/lib/courses/types'

export interface LessonCardProps {
  lesson: CourseDashboardLesson
  index?: number
}

export function LessonCard({ lesson, index }: LessonCardProps) {
  const durationText = lesson.durationSec
    ? vi.learning.dashboard.durationSeconds(lesson.durationSec)
    : null

  const href = `/habit/hoc/${lesson.id}`

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 motion-reduce:transition-none ${
        lesson.canAccess
          ? 'border-lavender-mist/70 bg-warm-ivory shadow-sm hover:border-bright-magenta/40 hover:shadow-md'
          : 'border-lavender-mist/40 bg-warm-ivory/60'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {typeof index === 'number' && (
              <span className="font-ui text-xs font-bold text-deep-navy/60">#{index + 1}</span>
            )}
            {durationText && (
              <span className="rounded-md bg-lavender-mist/40 px-2 py-0.5 font-ui text-[11px] font-semibold text-deep-navy/80">
                {durationText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {lesson.isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-haze px-2.5 py-0.5 font-ui text-xs font-bold text-deep-navy">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {vi.learning.dashboard.status.completed}
              </span>
            )}

            {lesson.isFreePreview && (
              <span className="rounded-full bg-soft-pink px-2.5 py-0.5 font-ui text-xs font-bold text-bright-magenta">
                {vi.learning.dashboard.status.preview}
              </span>
            )}

            {!lesson.canAccess && (
              <span className="inline-flex items-center gap-1 rounded-full bg-butter-cream/60 px-2.5 py-0.5 font-ui text-xs font-bold text-deep-navy">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
                {vi.learning.dashboard.status.locked}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="mt-3 font-ui text-base sm:text-lg font-bold text-deep-navy leading-snug">
          {lesson.canAccess ? (
            <Link
              href={href}
              className="hover:text-bright-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded-sm transition-colors"
            >
              {lesson.title}
            </Link>
          ) : (
            <span className="text-deep-navy/80">{lesson.title}</span>
          )}
        </h4>

        {/* Summary */}
        {lesson.summary && (
          <p className="mt-2 line-clamp-2 font-body text-xs sm:text-sm text-deep-navy/70 leading-relaxed">
            {lesson.summary}
          </p>
        )}
      </div>

      {/* Action CTA */}
      <div className="mt-4 pt-3 border-t border-lavender-mist/40 flex items-center justify-between">
        {lesson.canAccess ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 font-ui text-xs sm:text-sm font-bold text-bright-magenta hover:text-deep-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded transition-colors motion-reduce:transition-none"
          >
            {lesson.isCompleted
              ? vi.learning.dashboard.reviewLesson
              : vi.learning.dashboard.startLearning}
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <Link
            href={vi.learning.dashboard.offerHref}
            className="inline-flex items-center gap-1 font-ui text-xs font-bold text-bright-magenta hover:text-deep-navy underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded transition-colors motion-reduce:transition-none"
          >
            {vi.learning.dashboard.unlockCta}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </div>
  )
}
