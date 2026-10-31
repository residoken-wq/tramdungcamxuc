import 'server-only'
import { getPayload, ValidationError, type Payload } from 'payload'
import config from '@/payload.config'
import type { Customer, HabitPlan, Product } from '@/payload-types'
import { getAccess } from '@/lib/entitlements'
import { HABIT_TRACKER_PRODUCT_SLUG } from './config'
import { getSiteUrl } from '@/lib/site-url'
import { sendTrackerNudgeEmail } from '@/lib/email/service.server'
import type { EmailSender } from '@/lib/email/types'
import { getReminderOptOutUrl } from '@/lib/reminders/token'

import { getVietnamYmd, vietnamTodayIso } from './tracker-stats'
import { missedVotingRun, shouldNudgeMissed } from './rhythm'
export * from './tracker-stats'

/**
 * Latest plan already owned by the customer. Read-only: never attaches or creates a plan,
 * so it is safe to call for customers without access.
 */
export async function findOwnTrackerPlan(
  customerId: number,
  payload: Payload,
): Promise<HabitPlan | null> {
  const userPlans = await payload.find({
    collection: 'habitPlans',
    where: {
      customer: { equals: customerId },
    },
    sort: ['-createdAt', '-id'],
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  return (userPlans.docs[0] as HabitPlan | undefined) ?? null
}

/**
 * REVIEW-REQUIRED: Lấy kế hoạch thói quen hiện có của khách hàng, hoặc liên kết kế hoạch Habit Loop mồ côi
 * (trùng leadEmail và chưa gán customer) cho khách hàng đã xác minh qua OTP.
 * Hỗ trợ bắt đầu lại hành trình (HB-13): nếu có kế hoạch leadEmail mới hơn kế hoạch cũ đã gắn customer,
 * tự động gắn kế hoạch mới làm kế hoạch hiện tại (vẫn giữ kế hoạch cũ trong DB).
 * REVIEW-REQUIRED (HB-13c): khách đã có kế hoạch chỉ nhận kế hoạch leadEmail mới khi có `restartSince`
 * (khách bấm "Bắt đầu lại" trên chính trình duyệt này) và kế hoạch đó tạo sau thời điểm ấy, vì leadEmail
 * do người dùng tự gõ, không xác minh.
 * Nếu chưa có, tạo kế hoạch mới khi được cung cấp identityStatement với startDate là hôm nay theo giờ VN.
 */
export async function getOrCreateTrackerPlan(
  customerId: number,
  options?: {
    identityStatement?: string
    payload?: Payload
    now?: Date
    /** HB-13c: when the customer pressed "Bắt đầu lại" (see restart-marker.server.ts). */
    restartSince?: Date | null
  },
): Promise<HabitPlan | null> {
  const payload = options?.payload ?? (await getPayload({ config: await config }))

  // 1. Tìm kế hoạch mới nhất đã gắn với customer
  const ownPlan = await findOwnTrackerPlan(customerId, payload)

  // 2. Kiểm tra kế hoạch Habit Loop cùng leadEmail chưa gắn customer (bao gồm trường hợp khách bắt đầu lại ở /habit/5-phut)
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
      sort: ['-createdAt', '-id'],
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })

    if (emailPlans.docs.length > 0) {
      const planToAttach = emailPlans.docs[0] as HabitPlan
      const ownCreatedMs = ownPlan ? new Date(ownPlan.createdAt).getTime() : -1
      const attachCreatedMs = new Date(planToAttach.createdAt).getTime()
      const restartSinceMs = options?.restartSince ? options.restartSince.getTime() : null
      const isNewerThanOwn =
        !ownPlan ||
        (restartSinceMs !== null &&
          attachCreatedMs >= restartSinceMs &&
          (attachCreatedMs > ownCreatedMs ||
            (attachCreatedMs === ownCreatedMs && planToAttach.id > ownPlan.id)))

      if (!planToAttach.customer && isNewerThanOwn) {
        const attached = await payload.update({
          collection: 'habitPlans',
          id: planToAttach.id,
          data: {
            customer: customerId,
            startDate: vietnamTodayIso(options?.now),
          },
          depth: 1,
          overrideAccess: true,
        })
        return attached as HabitPlan
      }
    }
  }

  if (ownPlan) {
    return ownPlan
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
 * REVIEW-REQUIRED: Xử lý gửi email nhắc nhở khi học viên lỡ nhịp 2 ngày bỏ phiếu liên tiếp theo nhịp tuần (HB-06).
 *
 * Tiêu chí & Quy trình:
 * 1. Chỉ áp dụng cho học viên còn quyền truy cập (status trial còn hạn hoặc active đã mua).
 * 2. Kế hoạch đọc depth: 0; customer đọc riêng qua findByID + select (email, name, reminderEmailsOptOut).
 * 3. Chuỗi lỡ nhịp được tính theo luật nhịp tuần (missedVotingRun): đếm 2 ngày bỏ phiếu liên tiếp bị lỡ kết thúc trước hôm nay, bỏ qua ngày nghỉ.
 * 4. Nhận việc trước bằng khóa duy nhất (plan + missedStartDay) trong collection ẩn trackerNudges.
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

  // 2. Lấy các kế hoạch thói quen đã gắn khách hàng và có ngày bắt đầu còn trong hành trình
  const maxDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const minStartDateIso = new Date(`${getVietnamYmd(maxDaysAgo)}T00:00:00+07:00`).toISOString()
  const maxStartDateIso = new Date(`${getVietnamYmd(twoDaysAgo)}T23:59:59.999+07:00`).toISOString()

  const plansRes = await payload.find({
    collection: 'habitPlans',
    where: {
      and: [
        { customer: { exists: true } },
        { startDate: { greater_than_equal: minStartDateIso } },
        { startDate: { less_than_equal: maxStartDateIso } },
      ],
    },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })

  for (const rawPlan of plansRes.docs) {
    try {
      const plan = rawPlan as unknown as HabitPlan
      if (!plan.startDate || !plan.customer) continue

      // Đọc thông tin khách hàng riêng bằng depth: 0 + select
      const rawCustomer = plan.customer
      const customerId =
        typeof rawCustomer === 'object' && rawCustomer !== null
          ? (rawCustomer as { id: number }).id
          : Number(rawCustomer)

      if (!customerId) continue

      // Chỉ xét kế hoạch hiện tại (mới nhất) của khách hàng; bỏ qua kế hoạch cũ nếu khách đã bắt đầu lại (HB-13)
      const latestPlan = await findOwnTrackerPlan(customerId, payload)
      if (!latestPlan || latestPlan.id !== plan.id) {
        continue
      }

      const customer = (await payload.findByID({
        collection: 'customers',
        id: customerId,
        depth: 0,
        overrideAccess: true,
        select: {
          email: true,
          name: true,
          reminderEmailsOptOut: true,
        },
      })) as Customer | null

      if (!customer?.email) continue

      // Kiểm tra quyền: chỉ khách còn quyền mới nhắc
      const access = await getAccess(customer.id, product.id, { payload, now })
      if (!access.hasAccess) {
        continue
      }

      processedPlans++

      // Đọc các check-in đã có của kế hoạch (truyền đủ day, done, status)
      const checkinsRes = await payload.find({
        collection: 'habitCheckins',
        where: {
          plan: { equals: plan.id },
        },
        depth: 0,
        pagination: false,
        overrideAccess: true,
        select: {
          day: true,
          done: true,
          status: true,
        },
      })

      // Kiểm tra điều kiện nhắc lỡ nhịp theo luật nhịp tuần (>= 2 ngày bỏ phiếu lỡ, chưa qua ngày cuối hành trình)
      if (!shouldNudgeMissed(plan, checkinsRes.docs, now)) {
        continue
      }

      const { startDay: missedStartDay } = missedVotingRun(plan, checkinsRes.docs, now)
      if (!missedStartDay) {
        continue
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
      } catch (err) {
        const isValidationErr =
          err instanceof ValidationError || (err as { name?: string })?.name === 'ValidationError'

        if (isValidationErr) {
          // Đã gửi nhắc cho chuỗi lỡ nhịp này
          skippedDuplicate++
          continue
        }

        console.error(`[Tracker Nudge] Lỗi tạo bản ghi giữ chỗ cho plan ${plan.id}:`, err)
        errors++
        continue
      }

      // 4. Gửi email nhắc nhở nhẹ nhàng
      if (nudgeId !== null) {
        // REVIEW-REQUIRED: Khách đã tắt nhận email nhắc -> bỏ qua gửi email (T2-21).
        // Vẫn giữ lại bản ghi trackerNudges (sentAt) để đánh dấu đã xử lý và không gửi lại.
        if (customer.reminderEmailsOptOut) {
          continue
        }

        try {
          const optOutUrl = getReminderOptOutUrl(customer.id, siteUrl)
          await sendTrackerNudgeEmail(
            payload,
            {
              name: customer.name || '',
              email: customer.email,
              trackerUrl: `${siteUrl}/habit/tracker`,
              optOutUrl,
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
