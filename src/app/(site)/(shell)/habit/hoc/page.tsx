import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getCourseDashboardData } from '@/lib/courses/service.server'
import type { CourseDashboardData } from '@/lib/courses/types'
import { vi } from '@/lib/i18n/vi'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CourseProgressBar } from '@/components/habit/learning/CourseProgressBar'
import { ModuleSection } from '@/components/habit/learning/ModuleSection'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: vi.learning.pageTitle,
  description: vi.learning.metaDescription,
  robots: {
    index: false,
    follow: false,
  },
}

export default async function HabitLearningDashboardPage() {
  // 1. Kiểm tra đăng nhập
  const customer = await getCurrentCustomer()
  if (!customer) {
    redirect('/tai-khoan/dang-nhap?next=/habit/hoc')
  }

  // 2. Tải dữ liệu dashboard với xử lý lỗi an toàn (mục 11)
  let data: CourseDashboardData | null = null
  let loadError = false
  try {
    data = await getCourseDashboardData(customer.id)
  } catch {
    loadError = true
  }

  return (
    <div className="min-h-screen bg-warm-ivory py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <SectionHeader
            seriesLabel={vi.learning.dashboard.seriesLabel}
            titleLine1={vi.learning.dashboard.titleLine1}
            titleLine2={vi.learning.dashboard.titleLine2}
            emotionLine={vi.learning.dashboard.emotionLine}
            as="h1"
            align="left"
          />
          <Link
            href="/habit/tracker"
            className="inline-flex items-center gap-1.5 self-start sm:self-end px-4 py-2 rounded-full border border-deep-navy/20 bg-warm-ivory hover:bg-lavender-mist/40 text-deep-navy font-ui font-semibold text-xs transition-all motion-reduce:transition-none shadow-xs"
          >
            <span>{vi.tracker.navLink}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loadError ? (
          /* Trạng thái lỗi (mục 11) */
          <div className="rounded-3xl border border-lavender-mist/80 bg-warm-ivory p-8 sm:p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-soft-pink text-bright-magenta">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 7.5h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h2 className="font-ui text-xl font-bold text-deep-navy">
              {vi.learning.dashboard.errorTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-md font-body text-sm text-deep-navy/70">
              {vi.learning.dashboard.errorDesc}
            </p>
            <div className="mt-6">
              <Link
                href="/habit/hoc"
                className="inline-flex items-center justify-center rounded-xl bg-accent-pink px-5 py-2.5 font-ui text-sm font-bold text-warm-ivory shadow transition-all hover:bg-bright-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink motion-reduce:transition-none"
              >
                {vi.learning.dashboard.retry}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Total Progress Bar */}
            {data && data.totalLessons > 0 && (
              <CourseProgressBar
                completedLessons={data.completedLessons}
                totalLessons={data.totalLessons}
                progressPercent={data.progressPercent}
              />
            )}

            {/* Modules & Lessons List */}
            {data && data.modules.length > 0 && data.totalLessons > 0 ? (
              <div className="space-y-10 pt-2">
                {data.modules.map((mod, idx) => (
                  <ModuleSection key={mod.id} module={mod} moduleIndex={idx} />
                ))}
              </div>
            ) : (
              /* Trạng thái rỗng */
              <div className="rounded-3xl border border-lavender-mist/80 bg-warm-ivory p-8 sm:p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lavender-mist/50 text-bright-magenta">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
                <h2 className="font-ui text-xl font-bold text-deep-navy">
                  {vi.learning.dashboard.emptyTitle}
                </h2>
                <p className="mx-auto mt-2 max-w-md font-body text-sm text-deep-navy/70">
                  {vi.learning.dashboard.emptyDesc}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
