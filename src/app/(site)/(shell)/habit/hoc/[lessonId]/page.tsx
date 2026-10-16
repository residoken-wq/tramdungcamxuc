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
import { getVideoProvider } from '@/lib/video'
import { getAdminPreviewUser } from '@/lib/live-preview.server'
import type { Lesson } from '@/payload-types'
import type { LessonPlaybackResult } from '@/lib/courses/types'

export const dynamic = 'force-dynamic'

interface LessonPageProps {
  params: Promise<{ lessonId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { lessonId: rawId } = await params
  const lessonId = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : NaN

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

export default async function HabitLessonPage({ params, searchParams }: LessonPageProps) {
  const { lessonId: rawId } = await params
  if (!/^\d+$/.test(rawId)) {
    notFound()
  }
  const lessonId = parseInt(rawId, 10)
  const search = (await searchParams) || {}

  // REVIEW-REQUIRED: Chỉ phiên quản trị viên (users collection) mới được phép xem trước bài học.
  // Khách vãng lai và học viên dù có preview=1 vẫn KHÔNG được cấp quyền xem video bài học trả phí,
  // và tuyệt đối không được ghi nhận tiến độ bài học.
  const adminUser = await getAdminPreviewUser(search)
  const customer = adminUser ? null : await getCurrentCustomer()

  let result: LessonPlaybackResult

  if (adminUser) {
    const payload = await getPayload({ config: await config })
    const doc = (await payload
      .findByID({
        collection: 'lessons',
        id: lessonId,
        depth: 1,
        draft: true,
        overrideAccess: false,
        user: adminUser as never,
      })
      .catch(() => null)) as (Lesson & { videoId?: string | null }) | null

    if (!doc) {
      notFound()
    }

    const provider = getVideoProvider()
    const playback = doc.videoId ? await provider.getPlayback(doc.videoId) : null

    result = {
      allowed: true,
      reason: null,
      lesson: {
        id: doc.id,
        title: doc.title,
        summary: doc.summary ?? null,
        durationSec: doc.durationSec ?? null,
        stage: doc.stage ?? 'none',
        order: doc.order ?? 0,
        isFreePreview: Boolean(doc.isFreePreview),
        module: doc.module,
      },
      playback,
    }
  } else {
    result = await getLessonPlayback(lessonId, customer ? customer.id : null)
  }

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
            lessonTitle={result.lesson?.title || vi.learning.lesson.defaultLessonTitle}
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
  if (!adminUser) {
    const customer = await getCurrentCustomer()
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
            {typeof lesson.order === 'number' && (
              <span>{vi.learning.lesson.lessonOrderLabel(lesson.order)}</span>
            )}
            {durationText && (
              <>
                <span>•</span>
                <span>{durationText}</span>
              </>
            )}
          </div>
        </header>

        {/* Video Player Box */}
        <div>
          <VideoPlayer
            lessonId={lesson.id}
            playback={result.playback}
            moduleId={modId}
            lessonOrder={lesson.order ?? 0}
            initialCompleted={isCompleted}
            // Admin preview never records progress (no customer session).
            isAuthenticated={Boolean(customer)}
          />
        </div>

        {/* Lesson Summary / Content */}
        {lesson.summary && (
          <div className="rounded-2xl border border-lavender-mist/70 bg-warm-ivory p-5 sm:p-7 shadow-sm">
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
