import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getAdjacentLessons, getLessonPlayback } from '@/lib/courses/service.server'
import { vi } from '@/lib/i18n/vi'
import { VideoPlayer } from '@/components/habit/learning/VideoPlayer'
import { LockedLessonCard } from '@/components/habit/learning/LockedLessonCard'
import { LessonNavigation } from '@/components/habit/learning/LessonNavigation'

export const dynamic = 'force-dynamic'

interface LessonPageProps {
  params: Promise<{ lessonId: string }>
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { lessonId: rawId } = await params
  const lessonId = parseInt(rawId, 10)

  if (isNaN(lessonId)) {
    return {
      title: vi.learning.lesson.notFoundTitle,
      robots: { index: false, follow: false },
    }
  }

  const customer = await getCurrentCustomer()
  const result = await getLessonPlayback(lessonId, customer ? customer.id : null)

  const title = result.lesson?.title
    ? `${result.lesson.title} | ${vi.learning.pageTitle}`
    : vi.learning.pageTitle

  return {
    title,
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function HabitLessonPage({ params }: LessonPageProps) {
  const { lessonId: rawId } = await params
  const lessonId = parseInt(rawId, 10)

  if (isNaN(lessonId)) {
    notFound()
  }

  const customer = await getCurrentCustomer()
  const result = await getLessonPlayback(lessonId, customer ? customer.id : null)

  // 1. Bài học không tồn tại hoặc chưa xuất bản -> trả 404
  if (result.reason === 'not_found' || result.reason === 'not_published') {
    notFound()
  }

  // 2. Không có quyền xem bài học (chưa đăng nhập hoặc chưa sở hữu gói)
  if (!result.allowed || !result.lesson || !result.playback) {
    return (
      <div className="min-h-screen bg-warm-ivory py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-xl">
          <LockedLessonCard
            lessonTitle={result.lesson?.title || 'Bài học'}
            isUnauthenticated={result.reason === 'unauthenticated'}
            lessonId={lessonId}
          />
        </div>
      </div>
    )
  }

  const lesson = result.lesson

  // 3. Lấy bài học trước/sau và kiểm tra trạng thái đã hoàn thành của khách
  const [adjacent, payload] = await Promise.all([
    getAdjacentLessons(lessonId),
    getPayload({ config: await config }),
  ])

  let isCompleted = false
  if (customer) {
    const progressDoc = await payload.find({
      collection: 'lessonProgress',
      where: {
        and: [{ customer: { equals: customer.id } }, { lesson: { equals: lessonId } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    isCompleted = Boolean(progressDoc.docs[0]?.completedAt)
  }

  const modTitle =
    typeof lesson.module === 'object' && lesson.module !== null ? lesson.module.title : null
  const modId =
    typeof lesson.module === 'object' && lesson.module !== null
      ? lesson.module.id
      : (lesson.module as number) || 0

  const durationText = lesson.durationSec
    ? vi.learning.dashboard.durationSeconds(lesson.durationSec)
    : null

  return (
    <div className="min-h-screen bg-warm-ivory py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/habit/hoc"
            className="inline-flex items-center gap-1.5 font-ui text-xs sm:text-sm font-semibold text-deep-navy/70 hover:text-bright-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-pink rounded-sm transition-colors"
          >
            <span aria-hidden="true">←</span>
            {vi.learning.lesson.backToDashboard}
          </Link>

          {lesson.isFreePreview && (
            <span className="rounded-full bg-soft-pink px-2.5 py-0.5 font-ui text-xs font-bold text-bright-magenta">
              {vi.learning.dashboard.status.preview}
            </span>
          )}
        </div>

        {/* Lesson Header */}
        <header className="space-y-2">
          {modTitle && (
            <span className="font-ui text-xs font-bold uppercase tracking-widest text-bright-magenta">
              {modTitle}
            </span>
          )}

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-deep-navy leading-tight">
            {lesson.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 pt-1 font-ui text-xs text-deep-navy/60">
            {typeof lesson.order === 'number' && <span>Bài {lesson.order + 1}</span>}
            {durationText && (
              <>
                <span>•</span>
                <span>{durationText}</span>
              </>
            )}
          </div>
        </header>

        {/* Video Player Box */}
        <main>
          <VideoPlayer
            lessonId={lesson.id}
            playback={result.playback}
            moduleId={modId}
            lessonOrder={lesson.order ?? 0}
            initialCompleted={isCompleted}
          />
        </main>

        {/* Lesson Summary / Content */}
        {lesson.summary && (
          <div className="rounded-2xl border border-lavender-mist/70 bg-white p-5 sm:p-7 shadow-sm">
            <h2 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy/80">
              {vi.learning.lesson.summaryHeading}
            </h2>
            <p className="mt-2.5 font-body text-sm sm:text-base leading-relaxed text-deep-navy/80 whitespace-pre-line">
              {lesson.summary}
            </p>
          </div>
        )}

        {/* Previous / Next Lesson Navigation */}
        <LessonNavigation prevLesson={adjacent.prev} nextLesson={adjacent.next} />
      </div>
    </div>
  )
}
