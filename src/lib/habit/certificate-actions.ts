'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Customer } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { vi } from '@/lib/i18n/vi'
import {
  issueCertificate,
  getCertificateEligibility,
  toggleCertificatePublic,
} from './certificate.server'
import type { PublicCertificateData } from './certificate-types'

export type IssueCertificateInput = {
  name?: string
}

export type IssueCertificateActionResult = {
  success: boolean
  error?: string
  message?: string
  certificate?: PublicCertificateData
  isNew?: boolean
}

export type ToggleCertificatePublicActionResult = {
  success: boolean
  error?: string
  message?: string
  isPublic?: boolean
}

// Zod validation cho họ tên: sau trim 2-60 ký tự, không chứa < > { } và ký tự điều khiển
const nameSchema = z
  .string()
  .transform((val) => val.trim())
  .pipe(
    z
      .string()
      .min(2, vi.certificate.errors.nameInvalid)
      .max(60, vi.certificate.errors.nameInvalid)
      .refine((val) => !/[<>{}\x00-\x1f\x7f]/.test(val), {
        message: vi.certificate.errors.nameInvalid,
      }),
  )

/**
 * REVIEW-REQUIRED: Server action cho học viên yêu cầu cấp chứng nhận 21 ngày.
 * Danh tính học viên được lấy trực tiếp từ session cookie.
 * Nếu học viên chưa có tên: kiểm tra điều kiện cấp trước, đạt mới cập nhật tên của chính học viên rồi cấp.
 */
export async function issueCertificateAction(
  input?: IssueCertificateInput,
): Promise<IssueCertificateActionResult> {
  const sessionCustomer = await getCurrentCustomer()
  if (!sessionCustomer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: vi.certificate.errors.unauthorized,
    }
  }

  try {
    const payload = await getPayload({ config: await config })

    // Đọc hồ sơ khách hàng mới nhất từ database
    const customer = (await payload.findByID({
      collection: 'customers',
      id: sessionCustomer.id,
      depth: 0,
      overrideAccess: true,
    })) as Customer | null

    if (!customer) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: vi.certificate.errors.unauthorized,
      }
    }

    const existingName = customer.name?.trim() || ''

    if (!existingName) {
      // Khách chưa có tên: kiểm tra name gửi lên
      const rawName = input?.name
      if (!rawName || rawName.trim().length === 0) {
        return {
          success: false,
          error: 'NAME_REQUIRED',
          message: vi.certificate.errors.nameRequired,
        }
      }

      const parseResult = nameSchema.safeParse(rawName)
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors[0]?.message || vi.certificate.errors.nameInvalid
        return {
          success: false,
          error: 'INVALID_NAME',
          message: errorMsg,
        }
      }

      const validatedName = parseResult.data

      // KIỂM ĐIỀU KIỆN CẤP TRƯỚC khi cập nhật tên
      const eligibility = await getCertificateEligibility(customer.id, { payload })
      if (!eligibility.eligible) {
        return {
          success: false,
          error: eligibility.reason || 'NOT_ELIGIBLE',
          message: eligibility.message || vi.certificate.notEligible.keepGoing,
        }
      }

      // REVIEW-REQUIRED: Khách đủ điều kiện -> cập nhật trường name của chính khách hàng
      await payload.update({
        collection: 'customers',
        id: customer.id,
        data: {
          name: validatedName,
        },
        depth: 0,
        overrideAccess: true,
      })

      customer.name = validatedName
    }
    // Nếu khách đã có tên -> bỏ qua input.name gửi lên (không đổi tên)

    const cert = await issueCertificate(customer.id, { payload })

    try {
      revalidatePath('/habit/tracker')
    } catch {
      // Bỏ qua lỗi revalidate ngoài request context
    }

    return {
      success: true,
      isNew: Boolean(cert.isNew),
      certificate: {
        code: cert.code || '',
        customerName: customer.name || '',
        identityStatement: cert.identityStatement || '',
        daysCompleted: cert.daysCompleted ?? 0,
        issuedAt: cert.issuedAt || new Date().toISOString(),
        isPublic: Boolean(cert.isPublic),
        isOwner: true,
      },
    }
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : ''

    // Kiểm tra nếu là lỗi nghiệp vụ đã biết
    const knownErrors: string[] = [
      vi.certificate.errors.unauthorized,
      vi.certificate.errors.noPlan,
      vi.certificate.errors.notDay21,
      vi.certificate.errors.notFound,
      vi.certificate.errors.forbidden,
      vi.certificate.errors.nameRequired,
      vi.certificate.errors.nameInvalid,
      vi.certificate.notEligible.notDay21Notice,
      vi.certificate.notEligible.keepGoing,
    ]

    const isKnownError =
      knownErrors.includes(rawMessage) ||
      rawMessage.startsWith(vi.certificate.errors.notEnoughDays(0).slice(0, 15))

    if (isKnownError) {
      return {
        success: false,
        error: 'ISSUE_FAILED',
        message: rawMessage,
      }
    }

    // Lỗi hệ thống bất ngờ: log không kèm dữ liệu khách, trả câu chung
    console.error('[issueCertificateAction] unexpected error:', rawMessage || 'Unknown')
    return {
      success: false,
      error: 'ISSUE_FAILED',
      message: vi.certificate.errors.generalError,
    }
  }
}

/**
 * REVIEW-REQUIRED: Server action cho chủ chứng nhận thay đổi trạng thái công khai của liên kết.
 */
export async function toggleCertificatePublicAction(
  code: string,
  isPublic: boolean,
): Promise<ToggleCertificatePublicActionResult> {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: vi.certificate.errors.unauthorized,
    }
  }

  try {
    const updated = await toggleCertificatePublic(code, isPublic, customer.id)

    try {
      revalidatePath(`/chung-nhan/${code}`)
      revalidatePath('/habit/tracker')
    } catch {
      // Bỏ qua lỗi revalidate ngoài request context
    }

    return {
      success: true,
      isPublic: updated,
    }
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : ''

    const knownErrors: string[] = [
      vi.certificate.errors.unauthorized,
      vi.certificate.errors.notFound,
      vi.certificate.errors.forbidden,
    ]

    if (knownErrors.includes(rawMessage)) {
      return {
        success: false,
        error: 'TOGGLE_FAILED',
        message: rawMessage,
      }
    }

    console.error('[toggleCertificatePublicAction] unexpected error:', rawMessage || 'Unknown')
    return {
      success: false,
      error: 'TOGGLE_FAILED',
      message: vi.certificate.errors.updateStatusFailed,
    }
  }
}
