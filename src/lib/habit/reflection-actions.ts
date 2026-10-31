'use server'

import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getAccess } from '@/lib/entitlements'
import { HABIT_TRACKER_PRODUCT_SLUG } from './config'
import { getCurrentDayOfPlan, getOrCreateTrackerPlan } from './tracker.server'
import { getHabitJourneyContent } from './journey-content.server'
import { splitJourneyIntoStations } from './stations'
import { vi } from '@/lib/i18n/vi'
import { revalidatePath } from 'next/cache'

export interface SaveReflectionResult {
  success: boolean
  error?: string
  message?: string
  reflectionId?: number
}

export interface StationReflectionView {
  id: number
  stationIndex: number
  answers: {
    question: string
    answer: string
  }[]
  updatedAt?: string
}

const saveReflectionSchema = z.object({
  stationIndex: z.number().int().min(0).max(10),
  answers: z.array(z.string().max(1000, vi.hb12.errors.answerTooLong(1000))),
})

/**
 * REVIEW-REQUIRED: Server action cho học viên lưu bài suy ngẫm cuối trạm (HB-12).
 *
 * Kiểm soát bảo mật:
 * 1. Khách hàng lấy trực tiếp từ phiên đăng nhập (getCurrentCustomer).
 * 2. Kế hoạch phải thuộc chính khách hàng.
 * 3. Khách hàng phải còn quyền truy cập còn hạn (hasAccess).
 * 4. Trạm phải đã mở (hôm nay >= ngày cuối trạm theo splitJourneyIntoStations, hoặc hành trình đã kết thúc).
 * 5. Câu hỏi suy ngẫm chỉ lấy từ CMS phía server, không nhận từ client.
 * 6. Giới hạn độ dài mỗi câu trả lời <= 1000 ký tự. Không cho phép lưu khi toàn bộ câu trả lời đều trống.
 * 7. Cập nhật bản ghi cũ nếu đã có (theo khóa plan + stationIndex) hoặc tạo mới.
 */
export async function saveStationReflection(
  stationIndex: number,
  answers: string[],
): Promise<SaveReflectionResult> {
  // 1. Xác thực khách hàng từ phiên
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: vi.hb12.errors.unauthenticated,
    }
  }

  // 2. Validate dữ liệu đầu vào bằng Zod
  const validation = saveReflectionSchema.safeParse({ stationIndex, answers })
  if (!validation.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: validation.error.issues[0]?.message || vi.tracker.actions.invalidInput,
    }
  }

  const payload = await getPayload({ config: await config })

  // 3. Kiểm tra sản phẩm và quyền truy cập
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
    overrideAccess: true,
    limit: 1,
  })

  const product = products.docs[0]
  if (!product) {
    return {
      success: false,
      error: 'PRODUCT_NOT_FOUND',
      message: vi.tracker.actions.productNotFound,
    }
  }

  const now = new Date()
  const access = await getAccess(customer.id, product.id, { payload, now })
  if (!access.hasAccess) {
    return {
      success: false,
      error: 'ACCESS_EXPIRED',
      message: vi.hb12.errors.accessExpired,
    }
  }

  // 4. Lấy kế hoạch của khách hàng
  const plan = await getOrCreateTrackerPlan(customer.id, { payload })
  if (!plan) {
    return {
      success: false,
      error: 'PLAN_NOT_FOUND',
      message: vi.hb12.errors.planNotFound,
    }
  }

  // 5. Kiểm tra trạm và điều kiện mở trạm
  let journeyContent
  try {
    journeyContent = await getHabitJourneyContent(payload)
  } catch {
    return {
      success: false,
      error: 'CONTENT_LOAD_FAILED',
      message: vi.hb12.errors.noQuestionsInCMS,
    }
  }

  const stations = journeyContent.stations || []
  const stationCount = Math.max(1, stations.length || 4)
  const journeyDays = plan.journeyDays ?? 28
  const ranges = splitJourneyIntoStations(journeyDays, stationCount)
  const targetRange = ranges.find((r) => r.index === stationIndex)

  if (!targetRange) {
    return {
      success: false,
      error: 'STATION_OUT_OF_RANGE',
      message: vi.hb12.errors.stationOutOfRange,
    }
  }

  const currentDay = getCurrentDayOfPlan(plan.startDate, now)
  // Trạm mở khi hôm nay > toDay hoặc hành trình đã kết thúc (currentDay > journeyDays).
  // Ví dụ trạm 1 (ngày 1–7) kết thúc ở ngày 7 -> mở vào ngày 8.
  const openDay = targetRange.toDay + 1
  const isOpen = currentDay >= openDay || currentDay > journeyDays
  if (!isOpen) {
    return {
      success: false,
      error: 'STATION_NOT_OPEN',
      message: vi.hb12.errors.stationNotOpen(openDay),
    }
  }

  // 6. Lấy câu hỏi từ CMS cho trạm này
  const cmsStation = stations[stationIndex]
  const cmsQuestions = (cmsStation?.reflectionQuestions || [])
    .map((q) => q.question?.trim())
    .filter(Boolean) as string[]

  if (cmsQuestions.length === 0) {
    return {
      success: false,
      error: 'NO_QUESTIONS',
      message: vi.hb12.errors.noQuestionsInCMS,
    }
  }

  // 7. Kiểm tra nội dung câu trả lời
  const trimmedAnswers = answers.map((a) => (a || '').trim())
  const hasAnyAnswer = trimmedAnswers.some((a) => a.length > 0)
  if (!hasAnyAnswer) {
    return {
      success: false,
      error: 'ALL_EMPTY',
      message: vi.hb12.errors.allAnswersEmpty,
    }
  }

  // Ghép câu hỏi từ CMS với câu trả lời tương ứng
  const cleanAnswers = cmsQuestions.map((q, idx) => ({
    question: q,
    answer: trimmedAnswers[idx] || '',
  }))

  try {
    // 8. Tìm bản ghi suy ngẫm cũ nếu có
    const existingRes = await payload.find({
      collection: 'habitReflections',
      where: {
        and: [{ plan: { equals: plan.id } }, { stationIndex: { equals: stationIndex } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const existing = existingRes.docs[0]
    let reflectionId: number

    if (existing) {
      const updated = await payload.update({
        collection: 'habitReflections',
        id: existing.id,
        data: {
          answers: cleanAnswers,
        },
        overrideAccess: true,
      })
      reflectionId = updated.id
    } else {
      const created = await payload.create({
        collection: 'habitReflections',
        data: {
          customer: customer.id,
          plan: plan.id,
          stationIndex,
          answers: cleanAnswers,
        },
        overrideAccess: true,
      })
      reflectionId = created.id
    }

    try {
      revalidatePath('/habit/tracker')
    } catch (_e) {}

    return {
      success: true,
      reflectionId,
    }
  } catch (err) {
    console.error('Failed to save habit reflection:', err)
    return {
      success: false,
      error: 'SAVE_FAILED',
      message: vi.hb12.errors.saveFailed,
    }
  }
}

/**
 * Đọc toàn bộ bài suy ngẫm đã lưu của kế hoạch cho học viên.
 * Sử dụng phiên khách hàng với overrideAccess: false để bảo đảm quyền riêng tư.
 */
export async function getStationReflectionsForPlan(
  planId: number,
  customerId: number,
): Promise<StationReflectionView[]> {
  const payload = await getPayload({ config: await config })
  try {
    const res = await payload.find({
      collection: 'habitReflections',
      where: {
        and: [{ plan: { equals: planId } }, { customer: { equals: customerId } }],
      },
      pagination: false,
      depth: 0,
      user: { id: customerId, collection: 'customers' } as never,
      overrideAccess: false,
    })

    return (res.docs || []).map((doc) => ({
      id: doc.id,
      stationIndex: Number(doc.stationIndex),
      answers: (doc.answers || []).map((a) => ({
        question: a.question,
        answer: a.answer || '',
      })),
      updatedAt: doc.updatedAt,
    }))
  } catch (err) {
    console.error('Failed to get station reflections:', err)
    return []
  }
}
