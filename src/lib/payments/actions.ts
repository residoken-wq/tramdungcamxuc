'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { isAdminUser, isOwnerUser } from '@/lib/auth/access'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getSiteUrl } from '@/lib/site-url'
import {
  confirmManualPayment,
  cancelOrder,
  resendPaymentConfirmation,
  PaymentError,
  acceptOrderTermsForToken,
  createDigitalToolOrder,
  AlreadyHasActiveAccessError,
} from './orders.server'
import { vi } from '@/lib/i18n/vi'
import { RateLimitError } from '@/lib/forms/ratelimit.server'

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

// REVIEW-REQUIRED: Server action gửi lại email xác nhận đơn hàng cho chủ sở hữu (owner).
// Bắt buộc xác thực người dùng trên server và kiểm tra nghiêm ngặt quyền owner (isAdminUser + isOwnerUser).
export async function resendPaymentConfirmationAction(
  orderId: number,
  options: { payload?: Payload } = {},
): Promise<AdminPaymentActionResult> {
  try {
    let headers: Headers | undefined
    try {
      headers = await getHeaders()
    } catch {
      // Ngoài request scope (môi trường kiểm thử)
    }

    const payload = options.payload ?? (await getPayload({ config: await config }))
    const { user } = await payload.auth({ headers: headers || new Headers() })

    if (!user || !isAdminUser(user) || !isOwnerUser(user)) {
      return {
        success: false,
        message: vi.payment.errors.unauthorized,
      }
    }

    await resendPaymentConfirmation(
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
      message: vi.payment.success.resendConfirmation,
    }
  } catch (err) {
    if (err instanceof PaymentError) {
      return {
        success: false,
        message: err.message,
      }
    }
    console.error('[AdminPaymentAction] Unexpected error in resendPaymentConfirmationAction:', err)
    return {
      success: false,
      message: vi.payment.errors.serverError,
    }
  }
}

export const resendPaymentConfirmationAdminAction = resendPaymentConfirmationAction

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
// Chỉ nhận token từ trình duyệt; IP và thời điểm do server tự lấy (không tin tham số client).
export async function acceptOrderTerms(
  token: string,
): Promise<{ success: boolean; message: string }> {
  let ip: string | undefined
  try {
    const headerStore = await getHeaders()
    const forwarded = headerStore.get('x-forwarded-for')
    ip =
      (forwarded ? forwarded.split(',')[0].trim() : headerStore.get('x-real-ip')?.trim()) ||
      undefined
  } catch {
    // Ngoài request scope
  }
  return acceptOrderTermsForToken(token, { ip })
}

export interface CreateDigitalToolOrderActionResult {
  success: boolean
  payToken?: string
  reused?: boolean
  error?: string
  unauthenticated?: boolean
  alreadyActive?: boolean
  toolUrl?: string
}

// REVIEW-REQUIRED: Server action tạo đơn mua lẻ công cụ số.
// Lấy ID khách hàng trực tiếp từ phiên đăng nhập server (getCurrentCustomer), không nhận ID từ client.
export async function createDigitalToolOrderAction(
  productSlug: string,
  termsAccepted: boolean,
): Promise<CreateDigitalToolOrderActionResult> {
  try {
    const customer = await getCurrentCustomer()
    if (!customer) {
      return {
        success: false,
        error: vi.auth.unauthorizedNotice,
        unauthenticated: true,
      }
    }

    let ip: string | undefined
    try {
      const headerStore = await getHeaders()
      const forwarded = headerStore.get('x-forwarded-for')
      ip =
        (forwarded ? forwarded.split(',')[0].trim() : headerStore.get('x-real-ip')?.trim()) ||
        undefined
    } catch {
      // Ngoài request scope
    }

    const res = await createDigitalToolOrder(customer.id, productSlug, { termsAccepted, ip })
    return {
      success: true,
      payToken: res.payToken,
      reused: res.reused,
    }
  } catch (err: unknown) {
    if (err instanceof AlreadyHasActiveAccessError) {
      return {
        success: false,
        alreadyActive: true,
        toolUrl: err.toolUrl,
        error: err.message,
      }
    }
    if (err instanceof PaymentError || err instanceof RateLimitError) {
      return {
        success: false,
        error: err.message,
      }
    }
    console.error('[PaymentAction] Unexpected error in createDigitalToolOrderAction:', err)
    return {
      success: false,
      error: vi.payment.errors.serverError,
    }
  }
}

export interface OrderPaymentEventItem {
  id: number
  receivedAt: string
  provider: string
  transactionId?: string | null
  result?: string | null
  signatureValid?: boolean | null
  amount?: number | null
  isMismatch?: boolean
  isCancelled?: boolean
  isTermsMissing?: boolean
  isPaidTwice?: boolean
  isStuck?: boolean
  isIncomplete?: boolean
}

// REVIEW-REQUIRED: Server action lấy danh sách sự kiện thanh toán của đơn hàng cho chủ sở hữu (owner).
// Dữ liệu chỉ đọc, dùng để hiển thị trên trang chi tiết đơn hàng trong CMS Admin.
export async function getOrderPaymentEventsAction(
  orderId: number,
  options: { payload?: Payload } = {},
): Promise<OrderPaymentEventItem[]> {
  try {
    let headers: Headers | undefined
    try {
      headers = await getHeaders()
    } catch {
      // Ngoài request scope
    }

    const payload = options.payload ?? (await getPayload({ config: await config }))
    const { user } = await payload.auth({ headers: headers || new Headers() })

    if (!user || !isAdminUser(user) || !isOwnerUser(user)) {
      return []
    }

    const events = await payload.find({
      collection: 'paymentEvents',
      where: {
        order: { equals: orderId },
      },
      sort: '-receivedAt',
      limit: 20,
      overrideAccess: true,
    })

    return events.docs.map((ev) => {
      const raw = ev.rawPayload as Record<string, unknown> | null
      const transferAmount =
        typeof raw?.transferAmount === 'number'
          ? raw.transferAmount
          : typeof raw?.amount === 'number'
            ? raw.amount
            : null

      return {
        id: ev.id,
        receivedAt: ev.receivedAt || '',
        provider: ev.provider,
        transactionId: ev.transactionId ?? null,
        result: ev.result ?? null,
        signatureValid: ev.signatureValid ?? null,
        amount: transferAmount,
        isMismatch: ev.result === 'amount_mismatch',
        isCancelled: ev.result === 'order_cancelled',
        isTermsMissing: ev.result === 'terms_missing',
        isPaidTwice: ev.result === 'already_paid',
        isStuck: ev.result === 'processing',
        isIncomplete: ev.result === 'paid_incomplete',
      }
    })
  } catch (err) {
    console.error('[AdminPaymentAction] Error fetching order payment events:', err)
    return []
  }
}
