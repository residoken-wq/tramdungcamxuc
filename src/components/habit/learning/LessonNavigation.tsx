import React from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'

export interface LessonNavigationProps {
  prevLesson: { id: number; title: string } | null
  nextLesson: { id: number; title: string } | null
}

export function LessonNavigation({ prevLesson, nextLesson }: LessonNavigationProps) {
  return (
    <nav
      aria-label={vi.learning.lesson.navAriaLabel}
      className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-lavender-mist/70"
    >
      {prevLesson ? (
        <Link
          href={`/habit/hoc/${prevLesson.id}`}
          className="group flex items-center gap-2 rounded-xl border border-lavender-mist/80 bg-warm-ivory p-3 sm:px-4 sm:py-2.5 text-left font-ui text-sm font-semibold text-deep-navy shadow-sm hover:border-bright-magenta/50 hover:bg-lavender-mist/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink transition-all motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="text-accent-pink transition-transform group-hover:-translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
          >
            ←
          </span>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-deep-navy/70">
              {vi.learning.lesson.prevLesson}
            </span>
            <span className="line-clamp-1 max-w-[200px] sm:max-w-[260px] font-bold text-deep-navy">
              {prevLesson.title}
            </span>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {nextLesson ? (
        <Link
          href={`/habit/hoc/${nextLesson.id}`}
          className="group flex items-center justify-end gap-2 rounded-xl border border-lavender-mist/80 bg-warm-ivory p-3 sm:px-4 sm:py-2.5 text-right font-ui text-sm font-semibold text-deep-navy shadow-sm hover:border-bright-magenta/50 hover:bg-lavender-mist/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink transition-all motion-reduce:transition-none"
        >
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-bold uppercase tracking-wider text-deep-navy/70">
              {vi.learning.lesson.nextLesson}
            </span>
            <span className="line-clamp-1 max-w-[200px] sm:max-w-[260px] font-bold text-deep-navy">
              {nextLesson.title}
            </span>
          </div>
          <span
            aria-hidden="true"
            className="text-accent-pink transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
          >
            →
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
    </nav>
  )
}
