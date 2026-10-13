'use server'

import { z } from 'zod'
import { getPayload, ValidationError } from 'payload'
import config from '@/payload.config'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getAccess } from '@/lib/entitlements'
import { HABIT_TRACKER_PRODUCT_SLUG } from './config'
import { getCurrentDayOfPlan, getOrCreateTrackerPlan } from './tracker.server'
import { EMOTIONS, type EmotionKey } from '@/lib/emotions'
import { track } from '@/lib/analytics/track'
import { revalidatePath } from 'next/cache'

const emotionKeys = EMOTIONS.map((e) => e.key) as [EmotionKey, ...EmotionKey[]]

export const checkInDaySchema = z.object({
  day: z.number().int().min(1).max(21),
  done: z.boolean(),
  emotion: z.enum(emotionKeys).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
})

export type CheckInDayResult = {
  success: boolean
  error?: string
  message?: string
  day?: number
  done?: boolean
}

/**
 * REVIEW-REQUIRED: Server action cho học viên check-in từng ngày trong hành trình 21 ngày.
 *
 * Kiểm soát bảo mật:
 * 1. Khách hàng lấy trực tiếp từ phiên đăng nhập (getCurrentCustomer).
 * 2. Kế hoạch thói quen phải thuộc về chính khách hàng (plan.customer === customer.id).
 * 3. Khách hàng phải còn quyền truy cập (status trial còn hạn hoặc đã mua active).
 * 4. Không cho phép tick ngày trong tương lai (day <= currentDay tính theo giờ Việt Nam).
 * 5. Giới hạn độ dài ghi chú <= 500 ký tự và cảm xúc phải thuộc bộ 10 chuẩn.
 * 6. Tính lũy đẳng & đồng thời: bắt ValidationError khi ghi song song để đọc lại và cập nhật an toàn.
 * 7. Quyền riêng tư: sự kiện phân tích 'tracker_day_checked' chỉ chứa { day }, tuyệt đối không chứa cảm xúc, ghi chú hay id khách.
 */
export async function checkInDay(
  day: number,
  done: boolean,
  emotion?: string | null,
  note?: string | null,
): Promise<CheckInDayResult> {
  // 1. Xác thực khách hàng từ phiên
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để thực hiện check-in.',
    }
  }

  // 2. Validate dữ liệu đầu vào bằng Zod
  const validation = checkInDaySchema.safeParse({
    day,
    done,
    emotion: emotion || null,
    note: note || null,
  })

  if (!validation.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: 'Dữ liệu check-in không hợp lệ.',
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
      message: 'Không tìm thấy cấu hình sản phẩm Habit Tracker.',
    }
  }

  const access = await getAccess(customer.id, product.id, { payload, now: new Date() })
  if (!access.hasAccess) {
    return {
      success: false,
      error: 'ACCESS_DENIED',
      message: 'Thời gian dùng thử đã hết hạn. Vui lòng mua công cụ để tiếp tục check-in.',
    }
  }

  // 4. Lấy kế hoạch của khách hàng
  const plan = await getOrCreateTrackerPlan(customer.id, { payload })
  if (!plan) {
    return {
      success: false,
      error: 'PLAN_NOT_FOUND',
      message: 'Không tìm thấy kế hoạch thói quen của bạn.',
    }
  }

  // Kế hoạch phải thuộc quyền sở hữu của chính khách hàng
  const planCustomerId =
    typeof plan.customer === 'object' && plan.customer !== null
      ? plan.customer.id
      : Number(plan.customer)

  if (planCustomerId !== customer.id) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Bạn không có quyền thao tác trên kế hoạch này.',
    }
  }

  // 5. Kiểm tra ràng buộc ngày không vượt quá ngày hiện tại (giờ Việt Nam)
  const currentDay = getCurrentDayOfPlan(plan.startDate, new Date())
  if (validation.data.day > currentDay) {
    return {
      success: false,
      error: 'FUTURE_DAY',
      message: 'Không thể check-in cho ngày chưa tới trong tương lai.',
    }
  }

  const cleanEmotion = (validation.data.emotion ?? null) as EmotionKey | null
  const cleanNote = validation.data.note?.trim() || null

  // 6. Upsert bản ghi check-in (plan + day) với xử lý xung đột song song an toàn
  const existingCheckins = await payload.find({
    collection: 'habitCheckins',
    where: {
      and: [{ plan: { equals: plan.id } }, { day: { equals: validation.data.day } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existingCheckins.docs.length > 0) {
    await payload.update({
      collection: 'habitCheckins',
      id: existingCheckins.docs[0].id,
      data: {
        done: validation.data.done,
        emotion: cleanEmotion,
        note: cleanNote,
      },
      overrideAccess: true,
    })
  } else {
    try {
      await payload.create({
        collection: 'habitCheckins',
        data: {
          plan: plan.id,
          day: validation.data.day,
          done: validation.data.done,
          emotion: cleanEmotion,
          note: cleanNote,
        },
        overrideAccess: true,
      })
    } catch (err) {
      // Concurrency: nếu 2 request cùng chạy song song, bắt ValidationError từ unique key
      if (
        err instanceof ValidationError ||
        (err as { name?: string })?.name === 'ValidationError'
      ) {
        const raceExisting = await payload.find({
          collection: 'habitCheckins',
          where: {
            and: [{ plan: { equals: plan.id } }, { day: { equals: validation.data.day } }],
          },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })

        if (raceExisting.docs.length > 0) {
          await payload.update({
            collection: 'habitCheckins',
            id: raceExisting.docs[0].id,
            data: {
              done: validation.data.done,
              emotion: cleanEmotion,
              note: cleanNote,
            },
            overrideAccess: true,
          })
        }
      } else {
        throw err
      }
    }
  }

  // 7. Ghi nhận sự kiện phân tích: CHỈ gửi day, bảo mật tuyệt đối dữ liệu cảm xúc & ghi chú
  try {
    track('tracker_day_checked', { day: validation.data.day })
  } catch (_e) {}

  try {
    revalidatePath('/habit/tracker')
  } catch (_e) {}

  return {
    success: true,
    day: validation.data.day,
    done: validation.data.done,
  }
}

/**
 * Server action cho phép học viên khởi tạo kế hoạch mới khi chưa có kế hoạch nào.
 */
export async function createTrackerPlanAction(identityStatement: string): Promise<{
  success: boolean
  error?: string
  message?: string
  planId?: number
}> {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để tạo kế hoạch.',
    }
  }

  const clean = identityStatement.trim()
  if (!clean) {
    return {
      success: false,
      error: 'EMPTY_STATEMENT',
      message: 'Vui lòng nhập câu định danh thói quen của bạn.',
    }
  }

  const payload = await getPayload({ config: await config })
  const plan = await getOrCreateTrackerPlan(customer.id, {
    identityStatement: clean,
    payload,
  })

  if (!plan) {
    return {
      success: false,
      error: 'CREATE_FAILED',
      message: 'Không thể tạo kế hoạch thói quen. Vui lòng thử lại.',
    }
  }

  try {
    revalidatePath('/habit/tracker')
  } catch (_e) {}
  return {
    success: true,
    planId: plan.id,
  }
}
