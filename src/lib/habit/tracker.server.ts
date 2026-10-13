import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Customer, HabitCheckin, HabitPlan } from '@/payload-types'
import { EMOTIONS, type EmotionKey, getEmotion } from '@/lib/emotions'

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
