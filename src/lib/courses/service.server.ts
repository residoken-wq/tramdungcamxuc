import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { CourseModule, Lesson, LessonProgress } from '@/payload-types'
import { hasAccess } from '@/lib/entitlements'
import { HABIT_TRACKER_PRODUCT_SLUG } from '@/lib/habit/config'
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

/**
 * REVIEW-REQUIRED: Kiểm quyền xem bài học và lấy thông tin phát video.
 *
 * Nguyên tắc bảo mật (AGENTS.md & prompt T2-05a):
 * 1. Bài học phải đã xuất bản (_status === 'published').
 * 2. isFreePreview -> cho phép xem, kể cả khi chưa đăng nhập (customerId === null).
 * 3. Bài thường -> bắt buộc kiểm tra quyền qua hasAccess(customerId, HABIT_TRACKER_PRODUCT_SLUG).
 *    Nếu chưa đăng nhập, hết hạn hoặc chưa có quyền -> không trả gì về video (playback = null).
 * 4. Đọc videoId bằng overrideAccess CHỈ SAU KHI đã xác minh quyền xem bài.
 * 5. Trình duyệt KHÔNG BAO GIỜ nhận videoId trong kết quả trả về, chỉ nhận kết quả từ getPlayback().
 */
export async function getLessonPlayback(
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
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
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
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
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

  // 6. Gom bài học vào từng module
  const publishedLessons = lessonsRes.docs as Lesson[]
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

  const sortedLessons = (lessonsRes.docs as Lesson[]).sort((a, b) => {
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

/**
 * REVIEW-REQUIRED: Ghi tiến độ bài học vào cơ sở dữ liệu.
 * - watchedPercent kẹp trong [0, 100].
 * - CHỈ TĂNG, không giảm.
 * - >= 80% -> hoàn thành (completedAt).
 * - Khóa duy nhất (customerLesson) ngăn chặn bản ghi trùng lặp khi chạy song song.
 */
export async function recordLessonProgressInternal(
  customerId: number,
  lessonId: number,
  watchedPercent: number,
  nowOrCtx?: Date | { payload?: Payload; now?: Date },
  injectedPayload?: Payload,
): Promise<{
  success: boolean
  watchedPercent: number
  completedAt: Date | null
  newlyCompleted: boolean
}> {
  const { now, payload: rawPayload } = parseCtx(nowOrCtx, injectedPayload)
  const payload = rawPayload ?? (await getPayload({ config: await config }))

  // Kẹp giá trị trong [0, 100]
  const clampedPercent = Math.min(100, Math.max(0, Math.round(watchedPercent)))

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
    // Chỉ tăng, không giảm
    const currentPercent = existing.watchedPercent ?? 0
    const targetPercent = Math.max(currentPercent, clampedPercent)

    let completedAt = existing.completedAt ? new Date(existing.completedAt) : null
    let newlyCompleted = false

    // Đạt >= 80% lần đầu -> ghi nhận hoàn thành
    if (targetPercent >= 80 && !completedAt) {
      completedAt = now
      newlyCompleted = true
    }

    // Nếu không có gì thay đổi thì trả về luôn
    if (targetPercent === currentPercent && !newlyCompleted) {
      return {
        success: true,
        watchedPercent: currentPercent,
        completedAt,
        newlyCompleted: false,
      }
    }

    await payload.update({
      collection: 'lessonProgress',
      id: existing.id,
      data: {
        watchedPercent: targetPercent,
        ...(completedAt && !existing.completedAt ? { completedAt: completedAt.toISOString() } : {}),
      },
      overrideAccess: true,
    })

    return {
      success: true,
      watchedPercent: targetPercent,
      completedAt,
      newlyCompleted,
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
    // Xử lý xung đột tương tranh nếu một request khác vừa tạo cùng lúc
    const msg = err instanceof Error ? err.message : String(err)
    if (
      msg.includes('unique') ||
      msg.includes('duplicate') ||
      msg.includes('Đã có tiến độ') ||
      (err as { code?: string })?.code === '23505'
    ) {
      // Đọc lại và cập nhật
      return recordLessonProgressInternal(customerId, lessonId, watchedPercent, now, payload)
    }
    throw err
  }
}
