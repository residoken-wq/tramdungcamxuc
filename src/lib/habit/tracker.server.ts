import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Customer, HabitCheckin, HabitPlan, Product } from '@/payload-types'
import { EMOTIONS, type EmotionKey, getEmotion } from '@/lib/emotions'
import { getAccess } from '@/lib/entitlements'
import { HABIT_TRACKER_PRODUCT_SLUG } from './config'
import { getSiteUrl } from '@/lib/site-url'
import { sendTrackerNudgeEmail } from '@/lib/email/service.server'
import type { EmailSender } from '@/lib/email/types'

export interface TrackerStats {
  completedDays: number
  mostFrequentEmotion: {
    key: EmotionKey
    label: string
    emoji: string
    count: number
  } | null
}

/**
 * Lấy chuỗi YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 */
export function getVietnamYmd(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Trả về ISO string của đầu ngày hôm nay theo giờ Việt Nam (00:00:00+07:00).
 * Giúp lưu vào DB lúc 0h–7h sáng không bị lùi về hôm trước theo UTC.
 */
export function vietnamTodayIso(now: Date = new Date()): string {
  const ymd = getVietnamYmd(now)
  return new Date(`${ymd}T00:00:00+07:00`).toISOString()
}

/**
 * Tính số ngày chênh lệch giữa 2 ngày lịch theo giờ Việt Nam.
 */
export function getVietnamCalendarDayDiff(
  startDate: Date | string,
  now: Date = new Date(),
): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const startYmd = getVietnamYmd(start)
  const nowYmd = getVietnamYmd(now)

  const [sy, sm, sd] = startYmd.split('-').map(Number)
  const [ny, nm, nd] = nowYmd.split('-').map(Number)

  const startUtcMidnight = Date.UTC(sy, sm - 1, sd)
  const nowUtcMidnight = Date.UTC(ny, nm - 1, nd)

  return Math.floor((nowUtcMidnight - startUtcMidnight) / (24 * 60 * 60 * 1000))
}

/**
 * Tính ngày thứ N của kế hoạch theo giờ Việt Nam.
 * Ngày bắt đầu (startDate) là Ngày 1.
 * Ngày thứ N = số ngày từ startDate (giờ VN) + 1.
 */
export function getCurrentDayOfPlan(startDate: Date | string, now: Date = new Date()): number {
  const diff = getVietnamCalendarDayDiff(startDate, now)
  return diff + 1
}

/**
 * Tính toán thống kê hoàn thành và cảm xúc thường gặp nhất từ danh sách check-in.
 */
export function calculateTrackerStats(
  checkins: Array<{ done?: boolean | null; emotion?: string | null }>,
): TrackerStats {
  const completed = checkins.filter((c) => Boolean(c.done))
  const completedDays = completed.length

  const emotionCounts = new Map<string, number>()
  for (const c of completed) {
    if (c.emotion) {
      emotionCounts.set(c.emotion, (emotionCounts.get(c.emotion) ?? 0) + 1)
    }
  }

  let mostFrequent: TrackerStats['mostFrequentEmotion'] = null
  let maxCount = 0

  for (const [key, count] of emotionCounts.entries()) {
    if (count > maxCount) {
      maxCount = count
      const em = getEmotion(key)
      if (em) {
        mostFrequent = {
          key: em.key as EmotionKey,
          label: em.label,
          emoji: em.emoji,
          count,
        }
      }
    }
  }

  return {
    completedDays,
    mostFrequentEmotion: mostFrequent,
  }
}

/**
 * REVIEW-REQUIRED: Lấy kế hoạch thói quen hiện có của khách hàng, hoặc liên kết kế hoạch Habit Loop mồ côi
 * (trùng leadEmail và chưa gán customer) cho khách hàng đã xác minh qua OTP.
 * Nếu chưa có, tạo kế hoạch mới khi được cung cấp identityStatement với startDate là hôm nay theo giờ VN.
 */
export async function getOrCreateTrackerPlan(
  customerId: number,
  options?: {
    identityStatement?: string
    payload?: Payload
    now?: Date
  },
): Promise<HabitPlan | null> {
  const payload = options?.payload ?? (await getPayload({ config: await config }))

  // 1. Khách đã có habitPlans gắn với mình -> lấy kế hoạch mới nhất
  const userPlans = await payload.find({
    collection: 'habitPlans',
    where: {
      customer: { equals: customerId },
    },
    sort: '-createdAt',
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  if (userPlans.docs.length > 0) {
    return userPlans.docs[0] as HabitPlan
  }

  // 2. Chưa có kế hoạch gắn với customer, tìm kế hoạch Habit Loop cùng leadEmail
  const customer = (await payload.findByID({
    collection: 'customers',
    id: customerId,
    depth: 0,
    overrideAccess: true,
  })) as Customer | null

  if (customer?.email) {
    const cleanEmail = customer.email.toLowerCase().trim()
    const emailPlans = await payload.find({
      collection: 'habitPlans',
      where: {
        and: [{ leadEmail: { equals: cleanEmail } }, { customer: { exists: false } }],
      },
      sort: '-createdAt',
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })

    if (emailPlans.docs.length > 0) {
      const planToAttach = emailPlans.docs[0] as HabitPlan
      // Chỉ gắn khi customer đang thực sự trống
      if (!planToAttach.customer) {
        const attached = await payload.update({
          collection: 'habitPlans',
          id: planToAttach.id,
          data: {
            customer: customerId,
          },
          depth: 1,
          overrideAccess: true,
        })
        return attached as HabitPlan
      }
    }
  }

  // 3. Không có gì -> tạo mới nếu có identityStatement
  if (options?.identityStatement && options.identityStatement.trim().length > 0) {
    const created = await payload.create({
      collection: 'habitPlans',
      data: {
        customer: customerId,
        identityStatement: options.identityStatement.trim(),
        startDate: vietnamTodayIso(options?.now),
      },
      depth: 1,
      overrideAccess: true,
    })
    return created as HabitPlan
  }

  return null
}

export interface TrackerNudgeResult {
  processedPlans: number
  nudgesSent: number
  skippedDuplicate: number
  errors: number
}

/**
 * REVIEW-REQUIRED: Xử lý gửi email nhắc nhở khi học viên lỡ nhịp 2 ngày liên tiếp.
 *
 * Tiêu chí & Quy trình:
 * 1. Chỉ áp dụng cho học viên còn quyền truy cập (status trial còn hạn hoặc active đã mua).
 * 2. Chỉ áp dụng cho kế hoạch đang trong 21 ngày (currentDay >= 3 và currentDay <= 21).
 * 3. Lỡ 2 ngày liên tiếp kết thúc tại hôm qua (currentDay - 1 và currentDay - 2 đều chưa hoàn thành).
 * 4. Nhận việc trước bằng khóa duy nhất (kế hoạch, ngày bắt đầu chuỗi lỡ) trong collection ẩn trackerNudges.
 * 5. Nếu gửi email thất bại: xóa bản ghi vừa tạo để lượt cron sau thử lại.
 * 6. Bắt lỗi từng bản ghi; không làm dừng cả lượt cron.
 * 7. Link trong email dùng getSiteUrl().
 */
export async function sendTrackerNudges(
  now: Date = new Date(),
  options?: {
    payload?: Payload
    emailSender?: EmailSender
    siteUrl?: string
  },
): Promise<TrackerNudgeResult> {
  const payload = options?.payload ?? (await getPayload({ config: await config }))
  const siteUrl = options?.siteUrl ?? getSiteUrl()

  let processedPlans = 0
  let nudgesSent = 0
  let skippedDuplicate = 0
  let errors = 0

  // 1. Lấy sản phẩm Habit Tracker số để kiểm tra quyền
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
    overrideAccess: true,
    limit: 1,
  })
  const product = products.docs[0] as Product | undefined
  if (!product) {
    return { processedPlans, nudgesSent, skippedDuplicate, errors }
  }

  // 2. Lấy các kế hoạch thói quen đã gắn khách hàng và có ngày bắt đầu
  const plansRes = await payload.find({
    collection: 'habitPlans',
    where: {
      and: [{ customer: { exists: true } }, { startDate: { exists: true } }],
    },
    depth: 1,
    pagination: false,
    overrideAccess: true,
  })

  for (const rawPlan of plansRes.docs) {
    try {
      const plan = rawPlan as unknown as HabitPlan
      if (!plan.startDate || !plan.customer) continue

      const currentDay = getCurrentDayOfPlan(plan.startDate, now)
      // Chỉ kiểm tra khi học viên đã ở ít nhất ngày 3 và chưa qua ngày 21
      if (currentDay < 3 || currentDay > 21) {
        continue
      }

      // Đọc thông tin khách hàng
      const rawCustomer = plan.customer
      const customer =
        typeof rawCustomer === 'object' && rawCustomer !== null
          ? (rawCustomer as Customer)
          : ((await payload.findByID({
              collection: 'customers',
              id: Number(rawCustomer),
              overrideAccess: true,
            })) as Customer | null)

      if (!customer?.email) continue

      // Kiểm tra quyền: chỉ khách còn quyền mới nhắc
      const access = await getAccess(customer.id, product.id, { payload, now })
      if (!access.hasAccess) {
        continue
      }

      processedPlans++

      // Đọc các check-in đã có của kế hoạch trước ngày hôm nay
      const checkinsRes = await payload.find({
        collection: 'habitCheckins',
        where: {
          and: [{ plan: { equals: plan.id } }, { day: { less_than: currentDay } }],
        },
        depth: 0,
        pagination: false,
        overrideAccess: true,
      })

      const doneDaysSet = new Set<number>()
      for (const rawCheckin of checkinsRes.docs) {
        const c = rawCheckin as unknown as HabitCheckin
        if (c.done) {
          doneDaysSet.add(c.day)
        }
      }

      // Điều kiện: cả ngày hôm qua (currentDay - 1) và hôm kia (currentDay - 2) đều chưa tick
      const yesterday = currentDay - 1
      const dayBeforeYesterday = currentDay - 2
      if (doneDaysSet.has(yesterday) || doneDaysSet.has(dayBeforeYesterday)) {
        continue
      }

      // Tìm ngày bắt đầu chuỗi lỡ nhịp này
      let missedStartDay = dayBeforeYesterday
      while (missedStartDay > 1 && !doneDaysSet.has(missedStartDay - 1)) {
        missedStartDay--
      }

      // 3. Nhận việc trước bằng bản ghi duy nhất trong collection trackerNudges
      let nudgeId: number | null = null
      try {
        const created = await payload.create({
          collection: 'trackerNudges',
          data: {
            plan: plan.id,
            missedStartDay,
            sentAt: now.toISOString(),
          },
          overrideAccess: true,
        })
        nudgeId = created.id
      } catch (_err) {
        // Đã gửi nhắc cho chuỗi lỡ nhịp này
        skippedDuplicate++
        continue
      }

      // 4. Gửi email nhắc nhở nhẹ nhàng
      if (nudgeId !== null) {
        try {
          await sendTrackerNudgeEmail(
            payload,
            {
              name: customer.name || '',
              email: customer.email,
              trackerUrl: `${siteUrl}/habit/tracker`,
            },
            options?.emailSender,
          )
          nudgesSent++
        } catch (emailErr) {
          console.error(
            `[Tracker Nudge] Lỗi gửi email nhắc nhở (customerId ${customer.id}):`,
            emailErr,
          )
          // Xóa bản ghi đã tạo khi gửi lỗi để lượt cron sau thử lại
          try {
            await payload.delete({
              collection: 'trackerNudges',
              id: nudgeId,
              overrideAccess: true,
            })
          } catch (deleteErr) {
            console.error(
              `[Tracker Nudge] Không thể xóa bản ghi nudge sau lỗi gửi (id ${nudgeId}):`,
              deleteErr,
            )
          }
          errors++
        }
      }
    } catch (planErr) {
      console.error(
        `[Tracker Nudge] Lỗi khi xử lý kế hoạch ${(rawPlan as { id?: number }).id}:`,
        planErr,
      )
      errors++
    }
  }

  return {
    processedPlans,
    nudgesSent,
    skippedDuplicate,
    errors,
  }
}
