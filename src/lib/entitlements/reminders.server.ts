import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Customer, Entitlement, Product } from '@/payload-types'
import { getAccess } from './service.server'
import { getEffectivePrice, getToolUrl } from '@/lib/products'
import { sendTrialReminderEmail } from '@/lib/email/service.server'
import type { EmailSender } from '@/lib/email/types'
import { getSiteUrl } from '@/lib/site-url'

export interface TrialReminderResult {
  processedTrials: number
  remindersSent: number
  skippedDuplicate: number
  errors: number
}

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`
}

/**
 * REVIEW-REQUIRED: Xử lý gửi email nhắc hạn dùng thử công cụ số tại mốc Ngày 18 và Ngày 21 với tính lũy đẳng (idempotency) tuyệt đối.
 *
 * Quy trình:
 * 1. Tìm các quyền dùng thử (status === 'trial') có thời hạn expiresAt hợp lệ.
 * 2. Bỏ qua nếu khách hàng đã mua sản phẩm (getAccess trả về status === 'active').
 * 3. Xác định mốc nhắc dựa trên thời gian còn lại:
 *    - Day 21 (ngày cuối): khi 0 < timeLeftMs <= 24h.
 *    - Day 18 (còn 3 ngày): khi 24h < timeLeftMs <= 72h.
 * 4. Chống gửi trùng lặp (Idempotency):
 *    - Tạo bản ghi trong collection `trialReminders` trước bằng khóa duy nhất (entitlement:milestone).
 *    - Khóa duy nhất được bảo vệ ở cả cấp tầng ứng dụng (uniqueKeyHook) và cấp CSDL (Postgres UNIQUE index).
 *    - Nếu tạo thành công -> mới tiến hành gửi email qua sendTrialReminderEmail.
 *    - Nếu bị trùng khóa -> bỏ qua ngay lập tức.
 * 5. Lỗi gửi email:
 *    - Xóa bản ghi nhắc vừa tạo để lượt cron kế tiếp (vẫn trong cửa sổ hợp lệ) gửi lại.
 *    - Không ghi email PII vào log hệ thống.
 */
export async function sendTrialReminders(
  now: Date = new Date(),
  options?: {
    payload?: Payload
    emailSender?: EmailSender
    siteUrl?: string
  },
): Promise<TrialReminderResult> {
  const payload = options?.payload ?? (await getPayload({ config: await config }))
  const siteUrl = options?.siteUrl ?? getSiteUrl()

  const oneDayMsQuery = 24 * 60 * 60 * 1000
  // Chỉ lấy quyền dùng thử sắp hết hạn trong 3 ngày tới (lọc ở DB, không quét toàn bộ mỗi giờ)
  const entitlementsRes = await payload.find({
    collection: 'entitlements',
    where: {
      and: [
        { status: { equals: 'trial' } },
        { expiresAt: { greater_than: now.toISOString() } },
        {
          expiresAt: {
            less_than_equal: new Date(now.getTime() + 3 * oneDayMsQuery).toISOString(),
          },
        },
      ],
    },
    depth: 1,
    pagination: false,
    overrideAccess: true,
  })

  let processedTrials = 0
  let remindersSent = 0
  let skippedDuplicate = 0
  let errors = 0

  const oneDayMs = 24 * 60 * 60 * 1000
  const threeDaysMs = 3 * oneDayMs

  for (const rawDoc of entitlementsRes.docs) {
    // Một bản ghi lỗi không làm dừng cả lượt cron
    try {
      const ent = rawDoc as unknown as Entitlement
      if (!ent.expiresAt) continue

      const expiresAt = new Date(ent.expiresAt)
      const timeLeftMs = expiresAt.getTime() - now.getTime()

      // Đã hết hạn hoặc chưa tới mốc nhắc (còn > 3 ngày) -> bỏ qua
      if (timeLeftMs <= 0 || timeLeftMs > threeDaysMs) {
        continue
      }

      // Đọc thông tin sản phẩm và khách hàng
      const rawProduct = ent.product
      const product =
        typeof rawProduct === 'object' && rawProduct !== null
          ? (rawProduct as Product)
          : await payload.findByID({
              collection: 'products',
              id: Number(rawProduct),
              depth: 0,
              overrideAccess: true,
            })

      if (!product || !product.trialDays || product.trialDays <= 0) {
        continue
      }

      const rawCustomer = ent.customer
      const customer =
        typeof rawCustomer === 'object' && rawCustomer !== null
          ? (rawCustomer as Customer)
          : await payload.findByID({
              collection: 'customers',
              id: Number(rawCustomer),
              depth: 0,
              overrideAccess: true,
            })

      if (!customer || !customer.email) {
        continue
      }

      // Kiểm tra quyền hiện tại: nếu đã mua (active) thì KHÔNG nhắc
      const currentAccess = await getAccess(customer.id, product.id, { payload, now })
      if (currentAccess.status === 'active') {
        continue
      }

      processedTrials++

      // Xác định mốc
      let milestone: 'day_18' | 'day_21'
      let daysLeft: number

      if (timeLeftMs <= oneDayMs) {
        if (product.trialDays <= 3) {
          const hasDay18 = await payload.count({
            collection: 'trialReminders',
            where: {
              and: [{ entitlement: { equals: ent.id } }, { milestone: { equals: 'day_18' } }],
            },
            overrideAccess: true,
          })
          if (hasDay18.totalDocs === 0) {
            milestone = 'day_18'
            daysLeft = Math.max(1, Math.ceil(timeLeftMs / oneDayMs))
          } else {
            milestone = 'day_21'
            daysLeft = 1
          }
        } else {
          milestone = 'day_21'
          daysLeft = 1
        }
      } else {
        milestone = 'day_18'
        daysLeft = Math.max(1, Math.ceil(timeLeftMs / oneDayMs))
      }

      // Chuẩn bị thông tin giá và link
      const effective = getEffectivePrice(product, now)
      const formattedPrice =
        effective.salePrice != null
          ? formatVnd(effective.salePrice)
          : effective.price != null
            ? formatVnd(effective.price)
            : null

      const originalPriceFormatted =
        effective.salePrice != null &&
        effective.price != null &&
        effective.salePrice < effective.price
          ? formatVnd(effective.price)
          : null

      const checkoutUrl = `${siteUrl}/thanh-toan?san-pham=${encodeURIComponent(product.slug)}`
      const toolUrl = `${siteUrl}${getToolUrl(product)}`

      // 1. Tạo bản ghi nhắc trước trong DB (nhận việc)
      let reminderId: number | null = null
      try {
        const created = await payload.create({
          collection: 'trialReminders',
          data: {
            entitlement: ent.id,
            milestone,
            sentAt: now.toISOString(),
          },
          overrideAccess: true,
        })
        reminderId = created.id
      } catch (_err) {
        // Đã tồn tại bản ghi nhắc cho mốc này (hoặc lượt chạy đồng thời đã nhận việc)
        skippedDuplicate++
        continue
      }

      // 2. Gửi email
      if (reminderId !== null) {
        try {
          await sendTrialReminderEmail(
            payload,
            {
              name: customer.name || '',
              email: customer.email,
              toolName: product.name,
              milestone,
              daysLeft,
              formattedPrice,
              originalPriceFormatted,
              isLifetime: !product.accessDurationDays || product.accessDurationDays <= 0,
              checkoutUrl,
              toolUrl,
            },
            options?.emailSender,
          )
          remindersSent++
        } catch (err) {
          console.error(
            `[Trial Reminder] Lỗi gửi email nhắc (customer ${customer.id}, entitlement ${ent.id}):`,
            err,
          )

          // Gửi lỗi: xóa bản ghi vừa tạo để lượt cron sau có thể gửi lại
          try {
            await payload.delete({
              collection: 'trialReminders',
              id: reminderId,
              overrideAccess: true,
            })
          } catch (deleteErr) {
            console.error(
              `[Trial Reminder] Không thể xóa bản ghi nhắc sau lỗi gửi (id ${reminderId}):`,
              deleteErr,
            )
          }
          errors++
        }
      }
    } catch (err) {
      console.error(
        `[Trial Reminder] Lỗi xử lý quyền dùng thử ${(rawDoc as { id?: number }).id}:`,
        err,
      )
      errors++
    }
  }

  return {
    processedTrials,
    remindersSent,
    skippedDuplicate,
    errors,
  }
}

/**
 * REVIEW-REQUIRED: Gửi email nhắc mốc day_18 ngay lập tức cho các sản phẩm có trialDays <= 3 (T2-18 / T2-04 BACKLOG).
 * Khi trialDays <= 3, thời gian dùng thử quá ngắn để chờ mốc ngày 18 qua cron thông thường.
 * Do đó, email nhắc mốc day_18 được gửi ngay khi kích hoạt dùng thử, đồng thời ghi nhận vào collection
 * trialReminders để đảm bảo tính lũy đẳng (chống gửi trùng lặp).
 */
export async function sendImmediateDay18Reminder(
  entitlementId: number,
  options?: {
    payload?: Payload
    emailSender?: EmailSender
    siteUrl?: string
    now?: Date
  },
): Promise<boolean> {
  const payload = options?.payload ?? (await getPayload({ config: await config }))
  const siteUrl = options?.siteUrl ?? getSiteUrl()
  const now = options?.now ?? new Date()

  const ent = (await payload.findByID({
    collection: 'entitlements',
    id: entitlementId,
    depth: 1,
    overrideAccess: true,
  })) as Entitlement | null

  if (!ent || ent.status !== 'trial' || !ent.expiresAt) {
    return false
  }

  const rawProduct = ent.product
  const product =
    typeof rawProduct === 'object' && rawProduct !== null
      ? (rawProduct as Product)
      : await payload.findByID({
          collection: 'products',
          id: Number(rawProduct),
          depth: 0,
          overrideAccess: true,
        })

  if (!product || !product.trialDays || product.trialDays <= 0 || product.trialDays > 3) {
    return false
  }

  const rawCustomer = ent.customer
  const customer =
    typeof rawCustomer === 'object' && rawCustomer !== null
      ? (rawCustomer as Customer)
      : await payload.findByID({
          collection: 'customers',
          id: Number(rawCustomer),
          depth: 0,
          overrideAccess: true,
        })

  if (!customer || !customer.email) {
    return false
  }

  // Nếu khách đã có quyền active (đã mua) thì không nhắc
  const currentAccess = await getAccess(customer.id, product.id, { payload, now })
  if (currentAccess.status === 'active') {
    return false
  }

  const expiresAt = new Date(ent.expiresAt)
  const timeLeftMs = expiresAt.getTime() - now.getTime()
  const daysLeft = Math.max(1, Math.ceil(timeLeftMs / (24 * 60 * 60 * 1000)))

  // 1. Tạo bản ghi nhắc trước trong DB (nhận việc) để chống gửi trùng lặp
  let reminderId: number | null = null
  try {
    const created = await payload.create({
      collection: 'trialReminders',
      data: {
        entitlement: ent.id,
        milestone: 'day_18',
        sentAt: now.toISOString(),
      },
      overrideAccess: true,
    })
    reminderId = created.id
  } catch (_err) {
    // Đã tồn tại bản ghi nhắc cho mốc này (lũy đẳng)
    return false
  }

  // 2. Gửi email nhắc
  const effective = getEffectivePrice(product, now)
  const formattedPrice =
    effective.salePrice != null
      ? formatVnd(effective.salePrice)
      : effective.price != null
        ? formatVnd(effective.price)
        : null

  const originalPriceFormatted =
    effective.salePrice != null && effective.price != null && effective.salePrice < effective.price
      ? formatVnd(effective.price)
      : null

  const checkoutUrl = `${siteUrl}/thanh-toan?san-pham=${encodeURIComponent(product.slug)}`
  const toolUrl = `${siteUrl}${getToolUrl(product)}`

  try {
    await sendTrialReminderEmail(
      payload,
      {
        name: customer.name || '',
        email: customer.email,
        toolName: product.name,
        milestone: 'day_18',
        daysLeft,
        formattedPrice,
        originalPriceFormatted,
        isLifetime: !product.accessDurationDays || product.accessDurationDays <= 0,
        checkoutUrl,
        toolUrl,
      },
      options?.emailSender,
    )
    return true
  } catch (err) {
    console.error(
      `[Trial Reminder] Lỗi gửi email nhắc ngay (customer ${customer.id}, entitlement ${ent.id}):`,
      err,
    )
    // Gửi lỗi: xóa bản ghi vừa tạo để lần sau có thể gửi lại
    if (reminderId !== null) {
      try {
        await payload.delete({
          collection: 'trialReminders',
          id: reminderId,
          overrideAccess: true,
        })
      } catch (deleteErr) {
        console.error(
          `[Trial Reminder] Không thể xóa bản ghi nhắc sau lỗi gửi (id ${reminderId}):`,
          deleteErr,
        )
      }
    }
    throw err
  }
}
