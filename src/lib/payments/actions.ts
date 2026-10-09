'use server'

import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload, type Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { isAdminUser, isOwnerUser } from '@/lib/auth/access'
import { getSiteUrl } from '@/lib/site-url'
import { checkAndRecordRateLimit } from '@/lib/forms/ratelimit.server'
import {
  confirmManualPayment,
  cancelOrder,
  PaymentError,
  InvalidOrderStatusError,
} from './orders.server'
import { vi } from '@/lib/i18n/vi'

export interface AdminPaymentActionResult {
  success: boolean
  message: string
}

// REVIEW-REQUIRED: Server action xác nhận thanh toán đơn hàng thủ công trong admin.
// Bắt buộc xác thực người dùng trên server và kiểm tra nghiêm ngặt quyền owner (isAdminUser + isOwnerUser).
export async function confirmManualPaymentAdminAction(
  orderId: number,
  options: { payload?: Payload } = {},
): Promise<AdminPaymentActionResult> {
  try {
    let headers: Headers | undefined
    try {
      headers = await getHeaders()
    } catch {
      // Bắt lỗi khi gọi ngoài request scope (ví dụ trong môi trường kiểm thử)
    }

    const payload = options.payload ?? (await getPayload({ config: await config }))
    const { user } = await payload.auth({ headers: headers || new Headers() })

    if (!user || !isAdminUser(user) || !isOwnerUser(user)) {
      return {
        success: false,
        message: vi.payment.errors.unauthorized,
      }
    }

    await confirmManualPayment(
      orderId,
      {
        id: user.id,
        role: (user as { role?: string }).role,
        email: (user as { email?: string }).email,
      },
      { payload },
    )

    return {
      success: true,
      message: vi.payment.success.confirmed,
    }
  } catch (err) {
    if (err instanceof PaymentError) {
      return {
        success: false,
        message: err.message,
      }
    }
    console.error('[AdminPaymentAction] Unexpected error in confirmManualPaymentAdminAction:', err)
    return {
      success: false,
      message: vi.payment.errors.serverError,
    }
  }
}

// REVIEW-REQUIRED: Server action hủy đơn hàng trong admin.
// Bắt buộc xác thực người dùng trên server và kiểm tra nghiêm ngặt quyền owner (isAdminUser + isOwnerUser).
export async function cancelOrderAdminAction(
  orderId: number,
  reason?: string,
  options: { payload?: Payload } = {},
): Promise<AdminPaymentActionResult> {
  try {
    let headers: Headers | undefined
    try {
      headers = await getHeaders()
    } catch {
      // Bắt lỗi khi gọi ngoài request scope (ví dụ trong môi trường kiểm thử)
    }

    const payload = options.payload ?? (await getPayload({ config: await config }))
    const { user } = await payload.auth({ headers: headers || new Headers() })

    if (!user || !isAdminUser(user) || !isOwnerUser(user)) {
      return {
        success: false,
        message: vi.payment.errors.unauthorized,
      }
    }

    await cancelOrder(
      orderId,
      {
        id: user.id,
        role: (user as { role?: string }).role,
        email: (user as { email?: string }).email,
      },
      reason,
      { payload },
    )

    return {
      success: true,
      message: vi.payment.success.cancelled,
    }
  } catch (err) {
    if (err instanceof PaymentError) {
      return {
        success: false,
        message: err.message,
      }
    }
    console.error('[AdminPaymentAction] Unexpected error in cancelOrderAdminAction:', err)
    return {
      success: false,
      message: vi.payment.errors.serverError,
    }
  }
}

// REVIEW-REQUIRED: Server action lấy link thanh toán cho đơn hàng do admin tạo (dùng getSiteUrl(), không ghép tay).
// Chỉ trả về đường dẫn thanh toán khi người dùng là quản trị viên, đơn do admin tạo và đang ở trạng thái pending.
export async function getOrderPaymentLinkAction(
  orderId: number,
  options: { payload?: Payload } = {},
): Promise<{ url: string | null; isPending: boolean; createdByAdmin: boolean } | null> {
  try {
    let headers: Headers | undefined
    try {
      headers = await getHeaders()
    } catch {
      // Ngoài request scope
    }

    const payload = options.payload ?? (await getPayload({ config: await config }))
    const { user } = await payload.auth({ headers: headers || new Headers() })

    if (!user || !isAdminUser(user)) {
      return null
    }

    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
    })

    if (!order) return null

    const isPending = order.paymentStatus === 'pending'
    const createdByAdmin = Boolean(order.createdByAdmin)
    const url =
      createdByAdmin && isPending && order.payToken
        ? `${getSiteUrl()}/thanh-toan/don/${order.payToken}`
        : null

    return {
      url,
      isPending,
      createdByAdmin,
    }
  } catch (err) {
    console.error('[AdminPaymentAction] Unexpected error in getOrderPaymentLinkAction:', err)
    return null
  }
}

// REVIEW-REQUIRED: Server action cho khách xác nhận đồng ý điều khoản đơn hàng do admin tạo.
// UPDATE nguyên tử: SET terms_accepted_at = now() WHERE pay_token = $1 AND terms_accepted_at IS NULL AND payment_status = 'pending'
// Rate limit theo IP, token sai -> notFound() (404).
export async function acceptOrderTerms(
  token: string,
  options: { payload?: Payload; now?: Date; ip?: string } = {},
): Promise<{ success: boolean; message: string }> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    notFound()
  }

  const cleanToken = token.trim()

  let ip = options.ip || '127.0.0.1'
  if (!options.ip) {
    try {
      const headerStore = await getHeaders()
      const forwarded = headerStore.get('x-forwarded-for')
      const realIp = headerStore.get('x-real-ip')
      ip = (forwarded ? forwarded.split(',')[0].trim() : realIp?.trim()) || '127.0.0.1'
    } catch {
      // Ngoài request scope
    }
  }

  const payload = options.payload ?? (await getPayload({ config: await config }))

  // Rate limit theo IP: 10 lần / 10 phút
  await checkAndRecordRateLimit(payload, {
    form: 'accept_order_terms',
    ip,
    maxHits: 10,
    windowMinutes: 10,
  })

  // Kiểm tra đơn hàng có tồn tại với token này không
  const orders = await payload.find({
    collection: 'orders',
    where: { payToken: { equals: cleanToken } },
    overrideAccess: true,
    limit: 1,
  })

  if (orders.totalDocs === 0) {
    notFound()
  }

  const order = orders.docs[0]
  if (order.paymentStatus !== 'pending') {
    throw new InvalidOrderStatusError(vi.payment.errors.onlyPendingCanBeConfirmed)
  }

  const now = options.now ?? new Date()
  const nowIso = now.toISOString()
  const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } })
    .drizzle

  // Cập nhật nguyên tử chỉ khi terms_accepted_at IS NULL và payment_status = 'pending'
  await db.execute(
    sql`UPDATE "orders" SET "terms_accepted_at" = ${nowIso}::timestamptz, "updated_at" = ${nowIso}::timestamptz WHERE "pay_token" = ${cleanToken} AND "terms_accepted_at" IS NULL AND "payment_status" = 'pending' RETURNING "id"`,
  )

  return {
    success: true,
    message: vi.payment.success.termsAccepted,
  }
}
