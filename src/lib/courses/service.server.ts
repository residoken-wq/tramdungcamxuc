import 'server-only'
import { ValidationError, getPayload, type Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import type { CourseModule, Lesson, LessonProgress } from '@/payload-types'
import { hasAccess } from '@/lib/entitlements'
import { HABIT_TRACKER_PRODUCT_SLUG, HABIT_TRACKER_PRODUCT_SLUGS } from '@/lib/habit/config'
import { getVideoProvider } from '@/lib/video'
import type {
  CourseDashboardData,
  CourseDashboardLesson,
  CourseModuleItem,
  LessonPlaybackResult,
  LessonSummary,
} from './types'

function parseCtx(
  nowOrCtx?: Date | { payload?: Payload; now?: Date },
  injectedPayload?: Payload,
): { now: Date; payload?: Payload } {
  let now = new Date()
  let payload = injectedPayload

  if (nowOrCtx instanceof Date) {
    now = nowOrCtx
  } else if (nowOrCtx && typeof nowOrCtx === 'object') {
    if (nowOrCtx.now instanceof Date) now = nowOrCtx.now
    if (nowOrCtx.payload) payload = nowOrCtx.payload
  }
  return { now, payload }
}

const GROUP_ORDER: Record<string, number> = {
  insight: 1, // Hiểu mình
  principle: 2, // Nguyên tắc
  technique: 3, // Kỹ thuật
}

import { cache } from 'react'

/**
 * REVIEW-REQUIRED: Kiểm quyền xem bài học và lấy thông tin phát video.
 *
 * Nguyên tắc bảo mật (AGENTS.md & prompt T2-05a):
 * 1. Bài học phải đã xuất bản (_status === 'published') và nhóm bài học (module) cũng phải đã xuất bản (mục 8).
 * 2. isFreePreview -> cho phép xem, kể cả khi chưa đăng nhập (customerId === null).
 * 3. Bài thường -> bắt buộc kiểm tra quyền qua hasAccess(customerId, HABIT_TRACKER_PRODUCT_SLUG).
 *    Nếu chưa đăng nhập, hết hạn hoặc chưa có quyền -> không trả gì về video (playback = null).
 * 4. Đọc videoId bằng overrideAccess CHỈ SAU KHI đã xác minh quyền xem bài.
 * 5. Trình duyệt KHÔNG BAO GIỜ nhận videoId trong kết quả trả về, chỉ nhận kết quả từ getPlayback().
 * 6. Bọc bằng React cache() để tránh chạy trùng 2 lần mỗi request giữa generateMetadata và Page component (mục 10).
 */
async function getLessonPlaybackInternal(
  lessonId: number,
  customerId: number | null,
  nowOrCtx?: Date | { payload?: Payload; now?: Date },
  injectedPayload?: Payload,
): Promise<LessonPlaybackResult> {
  const { now, payload: rawPayload } = parseCtx(nowOrCtx, injectedPayload)
  const payload = rawPayload ?? (await getPayload({ config: await config }))

  if (!lessonId || typeof lessonId !== 'number' || isNaN(lessonId)) {
    return {
      allowed: false,
      reason: 'not_found',
      lesson: null,
      playback: null,
    }
  }

  // 1. Tìm bài học trong database
  let lesson: (Lesson & { videoId?: string | null }) | null = null
  try {
    lesson = (await payload.findByID({
      collection: 'lessons',
      id: lessonId,
      depth: 1,
      overrideAccess: true,
    })) as (Lesson & { videoId?: string | null }) | null
  } catch {
    return {
      allowed: false,
      reason: 'not_found',
      lesson: null,
      playback: null,
    }
  }

  if (!lesson) {
    return {
      allowed: false,
      reason: 'not_found',
      lesson: null,
      playback: null,
    }
  }

  // Bài học phải đã xuất bản
  if (lesson._status !== 'published') {
    return {
      allowed: false,
      reason: 'not_published',
      lesson: null,
      playback: null,
    }
  }

  // REVIEW-REQUIRED: Nhóm bài học (module) phải tồn tại và đã xuất bản (mục 8)
  let isModulePublished = false
  if (typeof lesson.module === 'object' && lesson.module !== null) {
    isModulePublished = (lesson.module as CourseModule)._status === 'published'
  } else if (typeof lesson.module === 'number') {
    try {
      const mod = await payload.findByID({
        collection: 'courseModules',
        id: lesson.module,
        depth: 0,
        overrideAccess: true,
      })
      isModulePublished = mod?._status === 'published'
    } catch {
      isModulePublished = false
    }
  }

  if (!isModulePublished) {
    return {
      allowed: false,
      reason: 'not_published',
      lesson: null,
      playback: null,
    }
  }

  const isFreePreview = Boolean(lesson.isFreePreview)

  // Hàm tạo đối tượng an toàn không bao giờ chứa videoId
  const createSafeLesson = (): LessonSummary => ({
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary ?? null,
    durationSec: lesson.durationSec ?? null,
    order: lesson.order ?? 0,
    stage: lesson.stage ?? null,
    isFreePreview,
    module: lesson.module,
    _status: lesson._status,
  })

  // 2. Nếu là bài xem thử: cho phép xem kể cả khi khách chưa đăng nhập
  if (isFreePreview) {
    const videoProvider = getVideoProvider()
    const playback = await videoProvider.getPlayback(lesson.videoId || '')
    return {
      allowed: true,
      reason: null,
      lesson: createSafeLesson(),
      playback,
    }
  }

  // 3. Bài thường: yêu cầu đăng nhập
  if (!customerId || typeof customerId !== 'number') {
    return {
      allowed: false,
      reason: 'unauthenticated',
      lesson: createSafeLesson(),
      playback: null,
    }
  }

  // 4. Kiểm tra quyền truy cập sản phẩm Habit Tracker số
  const productRes = await payload.find({
    collection: 'products',
    where: { slug: { in: Array.from(HABIT_TRACKER_PRODUCT_SLUGS) } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  const trackerProduct = productRes.docs[0]
  if (!trackerProduct) {
    // Không tìm thấy sản phẩm trong hệ thống -> từ chối an toàn
    return {
      allowed: false,
      reason: 'entitlement_required',
      lesson: createSafeLesson(),
      playback: null,
    }
  }

  const hasEntitlement = await hasAccess(customerId, trackerProduct.id, { payload, now })
  if (!hasEntitlement) {
    return {
      allowed: false,
      reason: 'entitlement_required',
      lesson: createSafeLesson(),
      playback: null,
    }
  }

  // 5. Đã xác minh có quyền -> lấy thông tin phát video
  const videoProvider = getVideoProvider()
  const playback = await videoProvider.getPlayback(lesson.videoId || '')

  return {
    allowed: true,
    reason: null,
    lesson: createSafeLesson(),
    playback,
  }
}

export const getLessonPlayback = cache(getLessonPlaybackInternal)

/**
 * Lấy dữ liệu tổng quan cho trang Dashboard /habit/hoc.
 */
export async function getCourseDashboardData(
  customerId: number,
  nowOrCtx?: Date | { payload?: Payload; now?: Date },
  injectedPayload?: Payload,
): Promise<CourseDashboardData> {
  const { now, payload: rawPayload } = parseCtx(nowOrCtx, injectedPayload)
  const payload = rawPayload ?? (await getPayload({ config: await config }))

  // 1. Kiểm tra quyền truy cập của khách hàng với Habit Tracker số
  const productRes = await payload.find({
    collection: 'products',
    where: { slug: { in: Array.from(HABIT_TRACKER_PRODUCT_SLUGS) } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  const trackerProduct = productRes.docs[0]
  const hasTrackerAccess = trackerProduct
    ? await hasAccess(customerId, trackerProduct.id, { payload, now })
    : false

  // 2. Lấy toàn bộ nhóm bài học đã xuất bản
  const modulesRes = await payload.find({
    collection: 'courseModules',
    where: { _status: { equals: 'published' } },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })

  // 3. Sắp xếp modules theo nhóm: Hiểu mình (insight) -> Nguyên tắc (principle) -> Kỹ thuật (technique), rồi theo order
  const sortedModules = (modulesRes.docs as CourseModule[]).sort((a, b) => {
    const groupA = GROUP_ORDER[a.group ?? ''] ?? 99
    const groupB = GROUP_ORDER[b.group ?? ''] ?? 99
    if (groupA !== groupB) return groupA - groupB
    return (a.order ?? 0) - (b.order ?? 0)
  })

  const publishedModuleIds = new Set(sortedModules.map((m) => m.id))

  // 4. Lấy toàn bộ bài học đã xuất bản
  const lessonsRes = await payload.find({
    collection: 'lessons',
    where: { _status: { equals: 'published' } },
    depth: 0,
    limit: 500,
    overrideAccess: true,
  })

  // 5. Lấy tiến độ của khách hàng
  const progressRes = await payload.find({
    collection: 'lessonProgress',
    where: { customer: { equals: customerId } },
    depth: 0,
    limit: 500,
    overrideAccess: true,
  })

  const progressMap = new Map<number, { isCompleted: boolean; watchedPercent: number }>()
  for (const prog of progressRes.docs as LessonProgress[]) {
    const lessonId =
      typeof prog.lesson === 'object' && prog.lesson !== null
        ? prog.lesson.id
        : (prog.lesson as number)
    if (lessonId) {
      progressMap.set(lessonId, {
        isCompleted: Boolean(prog.completedAt),
        watchedPercent: prog.watchedPercent ?? 0,
      })
    }
  }

  // 6. REVIEW-REQUIRED: Chỉ đếm bài học đã xuất bản VÀ thuộc module đã xuất bản (mục 9)
  const publishedLessons = (lessonsRes.docs as Lesson[]).filter((lesson) => {
    const modId =
      typeof lesson.module === 'object' && lesson.module !== null
        ? lesson.module.id
        : (lesson.module as number | undefined)
    return modId !== undefined && publishedModuleIds.has(modId)
  })

  const totalLessons = publishedLessons.length
  let completedLessonsCount = 0

  const moduleItems: CourseModuleItem[] = sortedModules.map((moduleDoc) => {
    const moduleLessons = publishedLessons
      .filter((lesson) => {
        const modId =
          typeof lesson.module === 'object' && lesson.module !== null
            ? lesson.module.id
            : (lesson.module as number | undefined)
        return modId === moduleDoc.id
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((lesson): CourseDashboardLesson => {
        const prog = progressMap.get(lesson.id)
        const isCompleted = prog?.isCompleted ?? false
        if (isCompleted) {
          completedLessonsCount++
        }
        const isFreePreview = Boolean(lesson.isFreePreview)
        const canAccess = isFreePreview || hasTrackerAccess

        return {
          id: lesson.id,
          title: lesson.title,
          summary: lesson.summary ?? null,
          durationSec: lesson.durationSec ?? null,
          order: lesson.order ?? 0,
          isFreePreview,
          isCompleted,
          watchedPercent: prog?.watchedPercent ?? 0,
          canAccess,
        }
      })

    return {
      id: moduleDoc.id,
      title: moduleDoc.title,
      group: (moduleDoc.group as 'insight' | 'principle' | 'technique') || 'insight',
      order: moduleDoc.order ?? 0,
      lessons: moduleLessons,
    }
  })

  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0

  return {
    hasTrackerAccess,
    totalLessons,
    completedLessons: completedLessonsCount,
    progressPercent,
    modules: moduleItems,
  }
}

/**
 * Tìm bài học trước và sau của một bài học đã xuất bản.
 */
export async function getAdjacentLessons(
  currentLessonId: number,
  injectedPayload?: Payload,
): Promise<{
  prev: { id: number; title: string } | null
  next: { id: number; title: string } | null
}> {
  const payload = injectedPayload ?? (await getPayload({ config: await config }))

  const [modulesRes, lessonsRes] = await Promise.all([
    payload.find({
      collection: 'courseModules',
      where: { _status: { equals: 'published' } },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'lessons',
      where: { _status: { equals: 'published' } },
      depth: 0,
      limit: 500,
      overrideAccess: true,
    }),
  ])

  const sortedModules = (modulesRes.docs as CourseModule[]).sort((a, b) => {
    const groupA = GROUP_ORDER[a.group ?? ''] ?? 99
    const groupB = GROUP_ORDER[b.group ?? ''] ?? 99
    if (groupA !== groupB) return groupA - groupB
    return (a.order ?? 0) - (b.order ?? 0)
  })

  const moduleOrderMap = new Map<number, number>()
  sortedModules.forEach((m, idx) => moduleOrderMap.set(m.id, idx))

  // Chỉ lấy bài học đã xuất bản và nằm trong nhóm đã xuất bản
  const sortedLessons = (lessonsRes.docs as Lesson[])
    .filter((l) => {
      const modId =
        typeof l.module === 'object' && l.module !== null ? l.module.id : (l.module as number)
      return moduleOrderMap.has(modId)
    })
    .sort((a, b) => {
      const modA =
        typeof a.module === 'object' && a.module !== null ? a.module.id : (a.module as number)
      const modB =
        typeof b.module === 'object' && b.module !== null ? b.module.id : (b.module as number)

      const orderA = moduleOrderMap.get(modA) ?? 999
      const orderB = moduleOrderMap.get(modB) ?? 999
      if (orderA !== orderB) return orderA - orderB
      return (a.order ?? 0) - (b.order ?? 0)
    })

  const currentIndex = sortedLessons.findIndex((l) => l.id === currentLessonId)
  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null

  return {
    prev: prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null,
    next: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
  }
}

interface DrizzleDbExecutor {
  execute: (query: unknown) => Promise<unknown>
}

function getDrizzleDb(payload: Payload): DrizzleDbExecutor {
  return (payload.db as unknown as { drizzle: DrizzleDbExecutor }).drizzle
}

/**
 * REVIEW-REQUIRED: Ghi tiến độ bài học vào cơ sở dữ liệu.
 * - watchedPercent kẹp trong [0, 100], xử lý an toàn nếu NaN.
 * - CHỈ TĂNG, không giảm (GREATEST).
 * - >= 80% -> hoàn thành (completedAt, COALESCE).
 * - UPDATE nguyên tử tại DB chống xung đột tương tranh, newlyCompleted đúng 1 lần.
 */
export async function recordLessonProgressInternal(
  customerId: number,
  lessonId: number,
  watchedPercent: number,
  nowOrCtx?: Date | { payload?: Payload; now?: Date },
  injectedPayload?: Payload,
  isRetry = false,
): Promise<{
  success: boolean
  watchedPercent: number
  completedAt: Date | null
  newlyCompleted: boolean
}> {
  const { now, payload: rawPayload } = parseCtx(nowOrCtx, injectedPayload)
  const payload = rawPayload ?? (await getPayload({ config: await config }))

  // Kẹp giá trị trong [0, 100], an toàn nếu là NaN (mục 7)
  const safePercent = Number.isFinite(watchedPercent) ? watchedPercent : 0
  const clampedPercent = Math.min(100, Math.max(0, Math.round(safePercent)))

  // Tìm tiến độ hiện tại
  const existingRes = await payload.find({
    collection: 'lessonProgress',
    where: {
      and: [{ customer: { equals: customerId } }, { lesson: { equals: lessonId } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const existing = existingRes.docs[0] as LessonProgress | undefined

  if (existing) {
    const isCompleted = clampedPercent >= 80
    const nowIso = now.toISOString()
    const db = getDrizzleDb(payload)

    // REVIEW-REQUIRED: Một câu UPDATE nguyên tử với GREATEST(watched_percent, $1) và COALESCE(completed_at, $now)
    // RETURNING để biết chính xác lần này có vừa hoàn thành hay không (chống xung đột tương tranh)
    const updateResult = await db.execute(
      sql`WITH prev AS (
        SELECT "id", "watched_percent", "completed_at"
        FROM "lesson_progress"
        WHERE "id" = ${existing.id}
        FOR UPDATE
      )
      UPDATE "lesson_progress" AS lp
      SET
        "watched_percent" = GREATEST(lp."watched_percent", ${clampedPercent}),
        "completed_at" = COALESCE(lp."completed_at", ${isCompleted ? nowIso : null}::timestamptz),
        "updated_at" = ${nowIso}::timestamptz
      FROM prev
      WHERE lp."id" = prev."id"
      RETURNING
        lp."id",
        lp."watched_percent" AS "new_watched_percent",
        lp."completed_at" AS "new_completed_at",
        prev."watched_percent" AS "old_watched_percent",
        prev."completed_at" AS "old_completed_at"`,
    )

    const rows =
      (
        updateResult as {
          rows?: Array<{
            id: number
            new_watched_percent: string | number
            new_completed_at: string | Date | null
            old_watched_percent: string | number
            old_completed_at: string | Date | null
          }>
        }
      ).rows ?? []

    if (rows.length > 0) {
      const row = rows[0]
      const newWatched = Number(row.new_watched_percent)
      const newCompleted = row.new_completed_at ? new Date(row.new_completed_at) : null
      const oldCompleted = row.old_completed_at ? new Date(row.old_completed_at) : null
      const newlyCompleted = !oldCompleted && Boolean(newCompleted)

      return {
        success: true,
        watchedPercent: newWatched,
        completedAt: newCompleted,
        newlyCompleted,
      }
    }

    return {
      success: true,
      watchedPercent: existing.watchedPercent ?? 0,
      completedAt: existing.completedAt ? new Date(existing.completedAt) : null,
      newlyCompleted: false,
    }
  }

  // Chưa có bản ghi: tạo mới
  const isCompleted = clampedPercent >= 80
  const completedAt = isCompleted ? now : null
  const customerLesson = `${customerId}:${lessonId}`

  try {
    await payload.create({
      collection: 'lessonProgress',
      data: {
        customer: customerId,
        lesson: lessonId,
        watchedPercent: clampedPercent,
        customerLesson,
        ...(completedAt ? { completedAt: completedAt.toISOString() } : {}),
      },
      overrideAccess: true,
    })

    return {
      success: true,
      watchedPercent: clampedPercent,
      completedAt,
      newlyCompleted: isCompleted,
    }
  } catch (err: unknown) {
    // Concurrent request created the same (customer, lesson) row first: Payload reports the
    // unique-key clash as a ValidationError. Retry once through the atomic UPDATE path; a second
    // failure is a real validation error and must surface instead of looping.
    const isValidationErr =
      err instanceof ValidationError || (err as { name?: string })?.name === 'ValidationError'
    if (isValidationErr && !isRetry) {
      return recordLessonProgressInternal(customerId, lessonId, safePercent, now, payload, true)
    }
    throw err
  }
}
