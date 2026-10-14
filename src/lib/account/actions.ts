'use server'

import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { render } from '@react-email/render'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAdminUser, isOwnerUser } from '@/lib/auth/access'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { checkAndRecordRateLimit, RateLimitError } from '@/lib/forms/ratelimit.server'
import { getDefaultEmailSender } from '@/lib/email/sender.server'
import type { EmailSender } from '@/lib/email/types'
import { AdminNotificationEmail } from '@/emails/AdminNotificationEmail'
import { vi } from '@/lib/i18n/vi'
import { deleteCustomerData } from './delete-customer.server'
import type { DeleteCustomerDataResult, RequestAccountDeletionResult } from './types'

// REVIEW-REQUIRED: Server action cho khách hàng gửi yêu cầu xóa tài khoản và dữ liệu cá nhân.
// - Khách hàng xác thực nghiêm ngặt từ phiên máy chủ (getCurrentCustomer); khách khác không thể gửi hộ.
// - Ghi nhận deletionRequestedAt = now nếu chưa có; nếu đã gửi thì giữ nguyên và không gửi lại email thông báo.
// - Giới hạn tần suất 3 lần/giờ theo email của khách hàng để chống lạm dụng.
// - Gửi email thông báo cho Hana chỉ chứa ID khách hàng và thời điểm, tuyệt đối không lộ email hoặc tên trong tiêu đề.
export async function requestAccountDeletionAction(
  options: { payload?: Payload; emailSender?: EmailSender } = {},
): Promise<RequestAccountDeletionResult> {
  try {
    const payload = options.payload ?? (await getPayload({ config: await config }))
    const customer = await getCurrentCustomer(payload)

    if (!customer) {
      return {
        success: false,
        message: vi.account.deletion.unauthorized,
      }
    }

    // Kiểm tra giới hạn tần suất 3 lần / giờ theo email khách hàng
    try {
      await checkAndRecordRateLimit(payload, {
        form: 'account_deletion',
        email: customer.email,
        windowMinutes: 60,
        maxHits: 3,
      })
    } catch (err) {
      if (err instanceof RateLimitError) {
        return {
          success: false,
          message: vi.account.deletion.rateLimited,
        }
      }
      throw err
    }

    // Đọc trạng thái khách hàng mới nhất từ cơ sở dữ liệu
    const currentCustomerDoc = await payload.findByID({
      collection: 'customers',
      id: customer.id,
      overrideAccess: true,
    })

    if (!currentCustomerDoc) {
      return {
        success: false,
        message: vi.account.deletion.unauthorized,
      }
    }

    // Nếu đã có yêu cầu xóa: giữ nguyên và trả về thành công mà không gửi lại email
    if (currentCustomerDoc.deletionRequestedAt) {
      return {
        success: true,
        message: vi.account.deletion.success,
        alreadyRequested: true,
        requestedAt: currentCustomerDoc.deletionRequestedAt,
      }
    }

    const now = new Date().toISOString()

    // Ghi nhận thời điểm yêu cầu xóa dữ liệu
    await payload.update({
      collection: 'customers',
      id: customer.id,
      data: {
        deletionRequestedAt: now,
      },
      overrideAccess: true,
    })

    // Gửi email thông báo cho Hana (chỉ ghi ID khách và thời điểm, không ghi tên/email trong tiêu đề)
    try {
      const siteSettings = await payload.findGlobal({
        slug: 'siteSettings',
        overrideAccess: true,
      })
      const adminEmail = siteSettings?.email

      if (adminEmail && adminEmail.trim().length > 0) {
        const sender = options.emailSender || getDefaultEmailSender()
        const requestedAtStr = new Date(now).toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
        })

        const adminHtml = await render(
          React.createElement(AdminNotificationEmail, {
            formType: 'lead',
            name: `Khách hàng ID: ${customer.id}`,
            email: `ID: ${customer.id}`,
            message: `Khách hàng ID ${customer.id} đã gửi yêu cầu xóa tài khoản vào lúc ${requestedAtStr}. Hana vui lòng xử lý trong 7 ngày làm việc. Đơn hàng sẽ được ẩn danh để đối soát.`,
          }),
        )

        const adminText = await render(
          React.createElement(AdminNotificationEmail, {
            formType: 'lead',
            name: `Khách hàng ID: ${customer.id}`,
            email: `ID: ${customer.id}`,
            message: `Khách hàng ID ${customer.id} đã gửi yêu cầu xóa tài khoản vào lúc ${requestedAtStr}. Hana vui lòng xử lý trong 7 ngày làm việc. Đơn hàng sẽ được ẩn danh để đối soát.`,
          }),
          { plainText: true },
        )

        await sender.send({
          to: adminEmail,
          subject: `[TDCX] Yêu cầu xóa dữ liệu: Khách hàng #${customer.id} (${requestedAtStr})`,
          html: adminHtml,
          text: adminText,
        })
      }
    } catch (emailErr) {
      console.error('[AccountDeletion] Lỗi khi gửi email thông báo cho admin:', emailErr)
    }

    return {
      success: true,
      message: vi.account.deletion.success,
      alreadyRequested: false,
      requestedAt: now,
    }
  } catch (err) {
    console.error('[AccountDeletion] Lỗi bất ngờ trong requestAccountDeletionAction:', err)
    return {
      success: false,
      message: vi.account.deletion.serverError,
    }
  }
}

// REVIEW-REQUIRED: Server action cho chủ sở hữu (owner) xóa toàn bộ dữ liệu khách hàng từ admin.
// Bắt buộc xác thực người dùng trên server và kiểm tra nghiêm ngặt quyền owner (isAdminUser + isOwnerUser).
export async function deleteCustomerAdminAction(
  customerId: number,
  confirmationEmail: string,
  options: { payload?: Payload } = {},
): Promise<DeleteCustomerDataResult> {
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
        message: vi.account.adminDeletion.unauthorized,
      }
    }

    return await deleteCustomerData(payload, {
      customerId,
      confirmationEmail,
      actorUserId: user.id,
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : vi.account.adminDeletion.serverError
    console.error('[DeleteCustomerAction] Lỗi khi thực hiện xóa dữ liệu khách hàng:', err)
    return {
      success: false,
      message: errorMsg,
    }
  }
}
