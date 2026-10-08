'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { isAdminUser, isOwnerUser } from '@/lib/auth/access'
import { confirmManualPayment, cancelOrder } from './orders.server'
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
    const message = err instanceof Error ? err.message : vi.payment.errors.unauthorized
    return {
      success: false,
      message,
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
    const message = err instanceof Error ? err.message : vi.payment.errors.unauthorized
    return {
      success: false,
      message,
    }
  }
}
