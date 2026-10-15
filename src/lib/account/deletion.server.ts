import 'server-only'

import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { render } from '@react-email/render'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { isAdminUser, isOwnerUser } from '@/lib/auth/access'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { checkAndRecordRateLimit, RateLimitError } from '@/lib/forms/ratelimit.server'
import { getDefaultEmailSender } from '@/lib/email/sender.server'
import type { EmailSender } from '@/lib/email/types'
import { AccountDeletionNotificationEmail } from '@/emails/AccountDeletionNotificationEmail'
import { vi } from '@/lib/i18n/vi'
import { deleteCustomerData } from './delete-customer.server'
import type { DeleteCustomerDataResult, RequestAccountDeletionResult } from './types'

interface DrizzleDbExecutor {
  execute: (query: unknown) => Promise<unknown>
}

function getDrizzleDb(payload: Payload): DrizzleDbExecutor | null {
  const db = (payload.db as unknown as { drizzle?: DrizzleDbExecutor })?.drizzle
  return db && typeof db.execute === 'function' ? db : null
}

export interface RequestAccountDeletionOptions {
  payload?: Payload
  emailSender?: EmailSender
}

export interface DeleteCustomerAdminOptions {
  payload?: Payload
  actorUserId?: number
}

// REVIEW-REQUIRED: Core logic cho khách hàng gửi yêu cầu xóa tài khoản và dữ liệu cá nhân.
// - Khách hàng xác thực nghiêm ngặt từ phiên máy chủ (getCurrentCustomer); khách khác không thể gửi hộ.
// - Ghi nhận deletionRequestedAt = now nguyên tử trên DB qua UPDATE ... WHERE deletion_requested_at IS NULL RETURNING id.
// - Nếu 2 yêu cầu chạy song song, chỉ luồng đầu tiên cập nhật thành công và gửi email thông báo.
// - Giới hạn tần suất 3 lần/giờ theo email của khách hàng để chống lạm dụng.
// - Gửi email thông báo cho Hana qua AccountDeletionNotificationEmail chỉ chứa ID khách hàng và thời điểm.
export async function requestAccountDeletion(
  options: RequestAccountDeletionOptions = {},
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

    const now = new Date().toISOString()
    const db = getDrizzleDb(payload)

    if (db) {
      // C4: Ghi nhận nguyên tử trên cơ sở dữ liệu để phòng ngừa race condition
      const updateResult = await db.execute(
        sql`UPDATE "customers" SET "deletion_requested_at" = ${now}::timestamptz, "updated_at" = ${now}::timestamptz WHERE "id" = ${customer.id} AND "deletion_requested_at" IS NULL RETURNING "id"`,
      )
      const rows = Array.isArray(updateResult)
        ? updateResult
        : ((updateResult as { rows?: Array<{ id: number }> }).rows ?? [])

      if (rows.length === 0) {
        const freshCustomer = await payload.findByID({
          collection: 'customers',
          id: customer.id,
          overrideAccess: true,
        })
        if (!freshCustomer) {
          return {
            success: false,
            message: vi.account.deletion.unauthorized,
          }
        }
        return {
          success: true,
          message: vi.account.deletion.success,
          alreadyRequested: true,
          requestedAt: freshCustomer.deletionRequestedAt ?? undefined,
        }
      }
    } else {
      // Fallback cho môi trường test/mock không có drizzle executor
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

      if (currentCustomerDoc.deletionRequestedAt) {
        return {
          success: true,
          message: vi.account.deletion.success,
          alreadyRequested: true,
          requestedAt: currentCustomerDoc.deletionRequestedAt,
        }
      }

      await payload.update({
        collection: 'customers',
        id: customer.id,
        data: {
          deletionRequestedAt: now,
        },
        overrideAccess: true,
      })
    }

    // Gửi email thông báo cho Hana qua mẫu AccountDeletionNotificationEmail riêng
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
          React.createElement(AccountDeletionNotificationEmail, {
            customerId: customer.id,
            requestedAt: requestedAtStr,
          }),
        )

        const adminText = await render(
          React.createElement(AccountDeletionNotificationEmail, {
            customerId: customer.id,
            requestedAt: requestedAtStr,
          }),
          { plainText: true },
        )

        await sender.send({
          to: adminEmail,
          subject: vi.account.deletion.emailSubject(customer.id, requestedAtStr),
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
    console.error('[AccountDeletion] Lỗi bất ngờ trong requestAccountDeletion:', err)
    return {
      success: false,
      message: vi.account.deletion.serverError,
    }
  }
}

// REVIEW-REQUIRED: Owner check from the admin session cookie (payload.auth). Returns null when the
// caller is not a logged-in owner.
export async function getOwnerUserId(payload: Payload): Promise<number | null> {
  let headers: Headers | undefined
  try {
    headers = await getHeaders()
  } catch {
    // Outside request scope
  }
  const { user } = await payload.auth({ headers: headers || new Headers() })
  if (!user || !isAdminUser(user) || !isOwnerUser(user)) return null
  return user.id as number
}

// REVIEW-REQUIRED: Core logic cho chủ sở hữu (owner) xóa toàn bộ dữ liệu khách hàng.
export async function deleteCustomerAdmin(
  customerId: number,
  confirmationEmail: string,
  options: DeleteCustomerAdminOptions = {},
): Promise<DeleteCustomerDataResult> {
  try {
    const payload = options.payload ?? (await getPayload({ config: await config }))
    const actorUserId = options.actorUserId ?? (await getOwnerUserId(payload))
    if (!actorUserId) {
      return {
        success: false,
        message: vi.account.adminDeletion.unauthorized,
      }
    }

    return await deleteCustomerData(payload, {
      customerId,
      confirmationEmail,
      actorUserId,
    })
  } catch (err) {
    console.error('[DeleteCustomerAdmin] Lỗi khi thực hiện xóa dữ liệu khách hàng:', err)
    return {
      success: false,
      message: vi.account.adminDeletion.serverError,
    }
  }
}

// REVIEW-REQUIRED: Core logic kiểm tra số đơn hàng 'pending' của khách.
export async function checkCustomerPendingOrders(
  customerId: number,
  payloadInstance?: Payload,
): Promise<{ pendingCount: number }> {
  try {
    const payload = payloadInstance ?? (await getPayload({ config: await config }))
    const { totalDocs } = await payload.count({
      collection: 'orders',
      where: {
        and: [{ customer: { equals: customerId } }, { paymentStatus: { equals: 'pending' } }],
      },
      overrideAccess: true,
    })
    return { pendingCount: totalDocs }
  } catch {
    return { pendingCount: 0 }
  }
}
