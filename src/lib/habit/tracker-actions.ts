'use server'

import { z } from 'zod'
import { getPayload, ValidationError } from 'payload'
import config from '@/payload.config'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getAccess } from '@/lib/entitlements'
import { HABIT_TRACKER_PRODUCT_SLUG } from './config'
import { getCurrentDayOfPlan, getOrCreateTrackerPlan } from './tracker.server'
import { EMOTIONS, type EmotionKey } from '@/lib/emotions'
import { vi } from '@/lib/i18n/vi'
import { revalidatePath } from 'next/cache'
import { getJourneyDays } from './journey'

import { CHECKIN_STATUS_VALUES, type CheckinStatus } from '@/collections/HabitCheckins'

const emotionKeys = EMOTIONS.map((e) => e.key) as [EmotionKey, ...EmotionKey[]]

const checkInDaySchema = z
  .object({
    day: z.number().int().min(1).max(60),
    done: z.boolean().optional(),
    status: z
      .enum(CHECKIN_STATUS_VALUES, {
        errorMap: () => ({ message: vi.hb04.errors.statusRequired }),
      })
      .nullable()
      .optional(),
    emotion: z.enum(emotionKeys).nullable().optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .refine(
    (data) => (data.status !== undefined && data.status !== null) || data.done !== undefined,
    {
      message: vi.hb04.errors.statusOrDoneRequired,
      path: ['status'],
    },
  )

const trackerPlanStatementSchema = z
  .string()
  .trim()
  .min(1, vi.tracker.actions.emptyStatement)
  .max(300, vi.tracker.actions.tooLongStatement)

// Only async functions may be exported from a 'use server' module; helpers stay private.
const planCreationLocks = new Map<string, Promise<unknown>>()

async function withPlanLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  while (planCreationLocks.has(key)) {
    try {
      await planCreationLocks.get(key)
    } catch {
      // Bỏ qua lỗi từ luồng trước
    }
  }
  let resolveLock!: () => void
  const lockPromise = new Promise<void>((resolve) => {
    resolveLock = resolve
  })
  planCreationLocks.set(key, lockPromise)
  try {
    return await fn()
  } finally {
    planCreationLocks.delete(key)
    resolveLock()
  }
}

export type CheckInDayResult = {
  success: boolean
  error?: string
  message?: string
  day?: number
  done?: boolean
  status?: CheckinStatus
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
 * 7. Quyền riêng tư: sự kiện phân tích 'tracker_day_checked' kích hoạt từ client, chỉ chứa { day }.
 */
export async function checkInDay(
  day: number,
  done?: boolean,
  emotion?: string | null,
  note?: string | null,
  status?: CheckinStatus | null,
): Promise<CheckInDayResult> {
  // 1. Xác thực khách hàng từ phiên
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: vi.tracker.actions.unauthorized,
    }
  }

  // 2. Validate dữ liệu đầu vào bằng Zod
  const validation = checkInDaySchema.safeParse({
    day,
    done,
    status: status ?? undefined,
    emotion: emotion || null,
    note: note || null,
  })

  if (!validation.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: validation.error.issues[0]?.message || vi.tracker.actions.invalidInput,
    }
  }

  const effectiveStatus: CheckinStatus =
    validation.data.status !== undefined && validation.data.status !== null
      ? validation.data.status
      : validation.data.done
        ? 'voted'
        : 'missed'

  const effectiveDone = effectiveStatus === 'voted' || effectiveStatus === 'minimal'

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

  const access = await getAccess(customer.id, product.id, { payload, now: new Date() })
  if (!access.hasAccess) {
    return {
      success: false,
      error: 'ACCESS_DENIED',
      message: vi.tracker.actions.accessDenied,
    }
  }

  // 4. Lấy kế hoạch của khách hàng
  const plan = await getOrCreateTrackerPlan(customer.id, { payload })
  if (!plan) {
    return {
      success: false,
      error: 'PLAN_NOT_FOUND',
      message: vi.tracker.actions.planNotFound,
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
      message: vi.tracker.actions.forbidden,
    }
  }

  // 5. REVIEW-REQUIRED: Chặn ngày check-in vượt quá số ngày hành trình hoặc ngày tương lai (giờ VN)
  const journeyDays = getJourneyDays(plan)
  if (validation.data.day > journeyDays) {
    return {
      success: false,
      error: 'INVALID_DAY',
      message: vi.tracker.actions.dayExceedsPlan(validation.data.day, journeyDays),
    }
  }

  const currentDay = getCurrentDayOfPlan(plan.startDate, new Date())
  if (validation.data.day > currentDay) {
    return {
      success: false,
      error: 'FUTURE_DAY',
      message: vi.tracker.actions.futureDay,
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
        status: effectiveStatus,
        done: effectiveDone,
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
          status: effectiveStatus,
          done: effectiveDone,
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
              status: effectiveStatus,
              done: effectiveDone,
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

  try {
    revalidatePath('/habit/tracker')
  } catch (_e) {}

  return {
    success: true,
    day: validation.data.day,
    done: effectiveDone,
    status: effectiveStatus,
  }
}

/**
 * REVIEW-REQUIRED: Khách hàng tạo kế hoạch 21 ngày cần kiểm tra quyền sử dụng và khóa đồng thời.
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
      message: vi.tracker.actions.createUnauthorized,
    }
  }

  const validation = trackerPlanStatementSchema.safeParse(identityStatement)
  if (!validation.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: validation.error.issues[0]?.message || vi.tracker.actions.invalidInput,
    }
  }

  const payload = await getPayload({ config: await config })

  // Kiểm tra cấu hình sản phẩm và quyền truy cập
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

  const access = await getAccess(customer.id, product.id, { payload, now: new Date() })
  if (!access.hasAccess) {
    return {
      success: false,
      error: 'ACCESS_DENIED',
      message: vi.tracker.actions.createAccessDenied,
    }
  }

  return withPlanLock(String(customer.id), async () => {
    // Kiểm tra xem khách đã có kế hoạch hay chưa
    const existingPlans = await payload.find({
      collection: 'habitPlans',
      where: { customer: { equals: customer.id } },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existingPlans.docs.length > 0) {
      return {
        success: true,
        planId: existingPlans.docs[0].id,
      }
    }

    const plan = await getOrCreateTrackerPlan(customer.id, {
      identityStatement: validation.data,
      payload,
    })

    if (!plan) {
      return {
        success: false,
        error: 'CREATE_FAILED',
        message: vi.tracker.actions.createFailed,
      }
    }

    try {
      revalidatePath('/habit/tracker')
    } catch (_e) {}

    return {
      success: true,
      planId: plan.id,
    }
  })
}
