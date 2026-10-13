'use server'

import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getLessonPlayback, recordLessonProgressInternal } from './service.server'

export interface RecordLessonProgressResponse {
  success: boolean
  error?: string
  watchedPercent?: number
  completedAt?: string | null
  newlyCompleted?: boolean
  meta?: {
    courseSlug: string
    moduleId: number
    lessonId: number
    lessonOrder: number
  }
}

/**
 * REVIEW-REQUIRED: Server action ghi nhận tiến độ xem bài học của khách hàng.
 *
 * Nguyên tắc bảo mật & tính toàn vẹn (AGENTS.md & prompt T2-05a):
 * 1. Khách hàng lấy từ phiên đăng nhập (session cookie), KHÔNG NHẬN customerId từ trình duyệt.
 * 2. Phải có quyền xem bài học: gọi lại hàm kiểm quyền getLessonPlayback.
 * 3. Kẹp giá trị watchedPercent trong [0, 100]; CHỈ TĂNG, không giảm so với tiến độ đã lưu.
 * 4. >= 80% -> đặt completedAt đúng một lần.
 * 5. Một dòng mỗi (khách, bài): khóa duy nhất có sẵn ngăn chặn 2 dòng khi có yêu cầu song song.
 * 6. Trả về meta thông tin bài học để client phát sự kiện analytics lesson_completed (chỉ whitelist keys).
 */
export async function recordLessonProgress(
  lessonId: number,
  watchedPercent: number,
): Promise<RecordLessonProgressResponse> {
  // 1. Lấy thông tin khách hàng từ phiên cookie
  const customer = await getCurrentCustomer()
  if (!customer) {
    return { success: false, error: 'unauthenticated' }
  }

  if (!lessonId || typeof lessonId !== 'number' || isNaN(lessonId)) {
    return { success: false, error: 'invalid_lesson_id' }
  }

  // 2. Xác thực quyền xem bài học (không cho ghi tiến độ nếu chưa có quyền xem)
  const playbackResult = await getLessonPlayback(lessonId, customer.id)
  if (!playbackResult.allowed || !playbackResult.lesson) {
    return { success: false, error: 'forbidden' }
  }

  // 3. Ghi nhận tiến độ vào cơ sở dữ liệu
  const result = await recordLessonProgressInternal(customer.id, lessonId, watchedPercent)

  const modId =
    typeof playbackResult.lesson.module === 'object' && playbackResult.lesson.module !== null
      ? playbackResult.lesson.module.id
      : (playbackResult.lesson.module as number) || 0

  return {
    success: true,
    watchedPercent: result.watchedPercent,
    completedAt: result.completedAt ? result.completedAt.toISOString() : null,
    newlyCompleted: result.newlyCompleted,
    meta: {
      courseSlug: 'habit',
      moduleId: modId,
      lessonId,
      lessonOrder: playbackResult.lesson.order ?? 0,
    },
  }
}
