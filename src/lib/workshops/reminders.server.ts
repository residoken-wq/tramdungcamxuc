import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Workshop } from '@/payload-types'
import { formatWorkshopTime } from './format'
import { sendWorkshopReminderEmail } from '@/lib/email/service.server'
import type { EmailSender } from '@/lib/email/types'

export interface WorkshopReminderResult {
  processedWorkshops: number
  remindersSent: number
  skippedDuplicate: number
  errors: number
}

/**
 * REVIEW-REQUIRED: Xử lý gửi email nhắc workshop trước 24 giờ với tính lũy đẳng (idempotency) tuyệt đối.
 *
 * Quy trình:
 * 1. Tìm các workshop đã xuất bản (_status === 'published') có startsAt trong khoảng (now + 23h, now + 25h].
 * 2. Xác định các khách hàng có đơn hàng đã thanh toán (paymentStatus === 'paid') chứa sản phẩm trong audienceProducts.
 * 3. Chống gửi trùng lặp (Idempotency):
 *    - Tạo bản ghi trong collection `workshopReminders` trước bằng khóa duy nhất (workshop:customer).
 *    - Khóa duy nhất được bảo vệ ở cả cấp tầng ứng dụng (uniqueKeyHook) và cấp CSDL (Postgres UNIQUE index).
 *    - Nếu tạo thành công -> mới tiến hành gửi email qua sendWorkshopReminderEmail.
 *    - Nếu bị trùng khóa (lỗi ValidationError hoặc duplicate key) -> bỏ qua ngay lập tức.
 *    - Ngay cả khi 2 cron chạy song song (concurrent Promise.all) hoặc chạy lại nhiều lần,
 *      mỗi khách hàng chỉ nhận đúng 1 email duy nhất.
 * 4. Lỗi gửi của một email đơn lẻ không làm dừng cả lượt cron (ghi log và tiếp tục).
 */
export async function sendWorkshopReminders(
  now: Date = new Date(),
  options?: {
    payload?: Payload
    emailSender?: EmailSender
    accountUrl?: string
  },
): Promise<WorkshopReminderResult> {
  const payload = options?.payload ?? (await getPayload({ config }))

  // Khoảng thời gian (now + 23h, now + 25h]
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const workshopsRes = await payload.find({
    collection: 'workshops',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { startsAt: { greater_than: windowStart.toISOString() } },
        { startsAt: { less_than_equal: windowEnd.toISOString() } },
      ],
    },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })

  let processedWorkshops = 0
  let remindersSent = 0
  let skippedDuplicate = 0
  let errors = 0

  for (const rawDoc of workshopsRes.docs) {
    const ws = rawDoc as unknown as Workshop
    if (!ws.startsAt) continue

    const startTime = new Date(ws.startsAt)
    // Kiểm tra chính xác nửa khoảng mở (windowStart, windowEnd]
    if (startTime.getTime() <= windowStart.getTime() || startTime.getTime() > windowEnd.getTime()) {
      continue
    }

    processedWorkshops++

    const audience = Array.isArray(ws.audienceProducts) ? ws.audienceProducts : []
    const audienceIds = new Set(
      audience
        .map((item) =>
          typeof item === 'object' && item !== null ? (item as { id: number }).id : Number(item),
        )
        .filter((id) => Number.isFinite(id) && id > 0),
    )

    if (audienceIds.size === 0) {
      continue
    }

    // Tìm các đơn hàng đã thanh toán chứa sản phẩm trong audienceProducts
    const paidOrders = await payload.find({
      collection: 'orders',
      where: {
        paymentStatus: { equals: 'paid' },
      },
      depth: 1,
      limit: 1000,
      overrideAccess: true,
    })

    const eligibleCustomers = new Map<number, { id: number; email: string; name: string }>()

    for (const order of paidOrders.docs) {
      if (!Array.isArray(order.items)) continue
      const matchesAudience = order.items.some((item) => {
        const rawP = item.product
        const pid =
          typeof rawP === 'object' && rawP !== null ? (rawP as { id: number }).id : Number(rawP)
        return audienceIds.has(pid)
      })

      if (matchesAudience && order.customer) {
        const c = order.customer
        const custId =
          typeof c === 'object' && c !== null ? (c as { id: number }).id : Number(c)
        if (Number.isFinite(custId) && custId > 0 && !eligibleCustomers.has(custId)) {
          if (typeof c === 'object' && c !== null && (c as { email?: string }).email) {
            eligibleCustomers.set(custId, {
              id: custId,
              email: (c as { email: string }).email,
              name: (c as { name?: string }).name || '',
            })
          } else {
            const custDoc = await payload.findByID({
              collection: 'customers',
              id: custId,
              depth: 0,
              overrideAccess: true,
            })
            if (custDoc?.email) {
              eligibleCustomers.set(custId, {
                id: custId,
                email: custDoc.email,
                name: custDoc.name || '',
              })
            }
          }
        }
      }
    }

    // Với mỗi khách hàng đủ điều kiện: tạo bản ghi nhắc trước, tạo thành công mới gửi email
    for (const customer of eligibleCustomers.values()) {
      let created = false
      try {
        await payload.create({
          collection: 'workshopReminders',
          data: {
            workshop: ws.id,
            customer: customer.id,
            sentAt: now.toISOString(),
          },
          overrideAccess: true,
        })
        created = true
      } catch (_err) {
        // Trùng khóa duy nhất (đã nhắc hoặc lượt chạy song song đã nhận việc)
        skippedDuplicate++
      }

      if (created) {
        try {
          const formattedTime = formatWorkshopTime(ws.startsAt, ws.endsAt)
          await sendWorkshopReminderEmail(
            payload,
            {
              name: customer.name,
              email: customer.email,
              workshopTitle: ws.title,
              workshopTimeFormatted: formattedTime,
              accountUrl: options?.accountUrl,
            },
            options?.emailSender,
          )
          remindersSent++
        } catch (err) {
          console.error(
            `[Workshop Reminder] Lỗi gửi email nhắc cho khách hàng ${customer.email} (workshop ${ws.id}):`,
            err,
          )
          errors++
        }
      }
    }
  }

  return {
    processedWorkshops,
    remindersSent,
    skippedDuplicate,
    errors,
  }
}
