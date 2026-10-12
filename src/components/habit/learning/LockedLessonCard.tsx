import React from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'

export interface LockedLessonCardProps {
  lessonTitle: string
  isUnauthenticated?: boolean
  lessonId?: number
}

export function LockedLessonCard({
  lessonTitle,
  isUnauthenticated = false,
  lessonId,
}: LockedLessonCardProps) {
  const loginUrl = lessonId
    ? `/tai-khoan/dang-nhap?next=/habit/hoc/${lessonId}`
    : '/tai-khoan/dang-nhap?next=/habit/hoc'

  return (
    <div className="overflow-hidden rounded-3xl border border-lavender-mist/80 bg-white/95 p-8 sm:p-12 text-center shadow-md backdrop-blur-sm">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-butter-cream/60 text-deep-navy">
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      </div>

      <span className="rounded-full bg-soft-pink px-3 py-1 font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta">
        {vi.learning.dashboard.status.locked}
      </span>

      <h3 className="mt-4 font-ui text-xl sm:text-2xl font-bold text-deep-navy">{lessonTitle}</h3>

      <p className="mx-auto mt-2 max-w-lg font-body text-sm sm:text-base text-deep-navy/75 leading-relaxed">
        {isUnauthenticated
          ? 'Vui lòng đăng nhập vào tài khoản của bạn để kiểm tra quyền truy cập bài học này.'
          : vi.learning.lesson.lockedDesc}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        {isUnauthenticated ? (
          <Link
            href={loginUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-accent-pink px-6 py-3 font-ui text-sm font-bold text-white shadow-sm hover:bg-bright-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink transition-all"
          >
            {vi.common.login}
          </Link>
        ) : (
          <Link
            href={vi.learning.dashboard.offerHref}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-accent-pink px-6 py-3 font-ui text-sm font-bold text-white shadow-sm hover:bg-bright-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink transition-all"
          >
            {vi.learning.lesson.unlockButton}
          </Link>
        )}

        <Link
          href="/habit/hoc"
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-lavender-mist bg-white px-5 py-3 font-ui text-sm font-semibold text-deep-navy hover:bg-lavender-mist/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-navy transition-colors"
        >
          {vi.learning.lesson.backToDashboard}
        </Link>
      </div>
    </div>
  )
}
