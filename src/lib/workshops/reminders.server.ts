import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Workshop } from '@/payload-types'
import { formatWorkshopTime } from './format'
import { sendWorkshopReminderEmail } from '@/lib/email/service.server'
import type { EmailSender } from '@/lib/email/types'
import { getSiteUrl } from '@/lib/site-url'
import { getReminderOptOutUrl } from '@/lib/reminders/token'

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
 *    Gửi lỗi -> xóa bản ghi nhắc vừa tạo để lượt cron kế tiếp (vẫn trong khoảng 23–25h) gửi lại.
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
  const accountUrl = options?.accountUrl ?? `${getSiteUrl()}/tai-khoan`

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

    // Tìm các đơn hàng đã thanh toán chứa sản phẩm trong audienceProducts (lọc ở DB, không giới hạn số đơn)
    const paidOrders = await payload.find({
      collection: 'orders',
      where: {
        and: [{ paymentStatus: { equals: 'paid' } }, { 'items.product': { in: [...audienceIds] } }],
      },
      depth: 1,
      pagination: false,
      overrideAccess: true,
    })

    const eligibleCustomers = new Map<
      number,
      { id: number; email: string; name: string; reminderEmailsOptOut: boolean }
    >()

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
        const custId = typeof c === 'object' && c !== null ? (c as { id: number }).id : Number(c)
        if (Number.isFinite(custId) && custId > 0 && !eligibleCustomers.has(custId)) {
          let email = ''
          let name = ''
          let reminderEmailsOptOut = false

          if (typeof c === 'object' && c !== null && (c as { email?: string }).email) {
            email = (c as { email: string }).email
            name = (c as { name?: string }).name || ''
            reminderEmailsOptOut = Boolean(
              (c as { reminderEmailsOptOut?: boolean }).reminderEmailsOptOut,
            )
          } else {
            const custDoc = await payload.findByID({
              collection: 'customers',
              id: custId,
              depth: 0,
              overrideAccess: true,
            })
            if (custDoc?.email) {
              email = custDoc.email
              name = custDoc.name || ''
              reminderEmailsOptOut = Boolean(custDoc.reminderEmailsOptOut)
            }
          }

          if (email) {
            eligibleCustomers.set(custId, {
              id: custId,
              email,
              name,
              reminderEmailsOptOut,
            })
          }
        }
      }
    }

    // Với mỗi khách hàng đủ điều kiện: tạo bản ghi nhắc trước, tạo thành công mới gửi email
    for (const customer of eligibleCustomers.values()) {
      let reminderId: number | null = null
      try {
        const reminder = await payload.create({
          collection: 'workshopReminders',
          data: {
            workshop: ws.id,
            customer: customer.id,
            sentAt: now.toISOString(),
          },
          overrideAccess: true,
        })
        reminderId = reminder.id
      } catch (_err) {
        // Trùng khóa duy nhất (đã nhắc hoặc lượt chạy song song đã nhận việc)
        skippedDuplicate++
      }

      if (reminderId !== null) {
        // REVIEW-REQUIRED: Khách đã tắt nhận email nhắc -> bỏ qua gửi email (T2-21).
        // Vẫn giữ lại bản ghi workshopReminders (sentAt) để ghi nhận đã xử lý và không thử gửi lại mãi.
        if (customer.reminderEmailsOptOut) {
          continue
        }

        try {
          const formattedTime = formatWorkshopTime(ws.startsAt, ws.endsAt)
          const optOutUrl = getReminderOptOutUrl(customer.id)
          await sendWorkshopReminderEmail(
            payload,
            {
              name: customer.name,
              email: customer.email,
              workshopTitle: ws.title,
              workshopTimeFormatted: formattedTime,
              accountUrl,
              optOutUrl,
            },
            options?.emailSender,
          )
          remindersSent++
        } catch (err) {
          // Log by id only: no customer email in server logs.
          console.error(
            `[Workshop Reminder] Lỗi gửi email nhắc (customer ${customer.id}, workshop ${ws.id}):`,
            err,
          )
          errors++
          // Release the claim so the next hourly run (still inside the 23–25h window) retries.
          await payload
            .delete({ collection: 'workshopReminders', id: reminderId, overrideAccess: true })
            .catch((deleteErr) =>
              console.error(
                `[Workshop Reminder] Không xóa được bản ghi nhắc ${reminderId}:`,
                deleteErr,
              ),
            )
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
