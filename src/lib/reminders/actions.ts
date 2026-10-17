'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { verifyReminderOptOutToken } from './token'
import { vi } from '@/lib/i18n/vi'

export interface OptOutActionResult {
  success: boolean
  message: string
}

/**
 * REVIEW-REQUIRED: Server action hủy nhận email nhắc qua token HMAC từ email (không cần đăng nhập).
 * Xác thực token bằng timingSafeEqual trước khi cập nhật CSDL.
 */
export async function optOutWithTokenAction(token: string): Promise<OptOutActionResult> {
  const customerId = verifyReminderOptOutToken(token)
  if (!customerId) {
    return {
      success: false,
      message: vi.reminders.optOut.invalidTokenMessage,
    }
  }

  try {
    const payload = await getPayload({ config: await config })
    await payload.update({
      collection: 'customers',
      id: customerId,
      data: {
        reminderEmailsOptOut: true,
      },
      overrideAccess: true,
    })

    return {
      success: true,
      message: vi.reminders.optOut.successMessage,
    }
  } catch (err) {
    console.error('[ReminderOptOut] Lỗi khi cập nhật hủy nhận email:', err)
    return {
      success: false,
      message: vi.reminders.optOut.invalidTokenMessage,
    }
  }
}

export interface ToggleReminderActionResult {
  success: boolean
  optOut?: boolean
  message: string
}

/**
 * REVIEW-REQUIRED: Server action bật/tắt nhận email nhắc lịch trong trang /tai-khoan.
 * Bảo mật tuyệt đối: Lấy danh tính khách hàng DUY NHẤT từ phiên đăng nhập hiện tại (getCurrentCustomer).
 * Tuyệt đối KHÔNG nhận hay tin cậy bất kỳ customerId nào gửi từ client/form nhằm ngăn chặn tấn công giả mạo (T3-04 review).
 */
export async function updateReminderPreferenceAction(
  enabled: boolean,
  ..._untrustedArgs: unknown[]
): Promise<ToggleReminderActionResult> {
  if (typeof enabled !== 'boolean') {
    return { success: false, message: vi.reminders.account.error }
  }
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      message: vi.reminders.account.error,
    }
  }

  const optOut = !enabled

  try {
    const payload = await getPayload({ config: await config })
    await payload.update({
      collection: 'customers',
      id: customer.id,
      data: {
        reminderEmailsOptOut: optOut,
      },
      overrideAccess: true,
    })

    return {
      success: true,
      optOut,
      message: enabled ? vi.reminders.account.enabledSuccess : vi.reminders.account.disabledSuccess,
    }
  } catch (err) {
    console.error(`[ReminderToggle] Lỗi cập nhật tùy chọn cho customer ${customer.id}:`, err)
    return {
      success: false,
      message: vi.reminders.account.error,
    }
  }
}
