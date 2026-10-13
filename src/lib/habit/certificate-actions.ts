'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { vi } from '@/lib/i18n/vi'
import { issueCertificate, toggleCertificatePublic } from './certificate.server'
import type { PublicCertificateData } from './certificate-types'

export type IssueCertificateActionResult = {
  success: boolean
  error?: string
  message?: string
  certificate?: PublicCertificateData
}

export type ToggleCertificatePublicActionResult = {
  success: boolean
  error?: string
  message?: string
  isPublic?: boolean
}

/**
 * REVIEW-REQUIRED: Server action cho học viên yêu cầu cấp chứng nhận 21 ngày.
 * Danh tính học viên được lấy trực tiếp từ session cookie.
 */
export async function issueCertificateAction(): Promise<IssueCertificateActionResult> {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: vi.certificate.errors.unauthorized,
    }
  }

  try {
    const cert = await issueCertificate(customer.id)

    try {
      revalidatePath('/habit/tracker')
    } catch {
      // Bỏ qua lỗi revalidate ngoài request context
    }

    return {
      success: true,
      certificate: {
        code: cert.code || '',
        customerName: customer.name || 'Học viên',
        identityStatement: cert.identityStatement || '',
        daysCompleted: cert.daysCompleted ?? 0,
        issuedAt: cert.issuedAt || new Date().toISOString(),
        isPublic: Boolean(cert.isPublic),
        isOwner: true,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : vi.tracker.actions.createFailed
    return {
      success: false,
      error: 'ISSUE_FAILED',
      message,
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
    const message = err instanceof Error ? err.message : vi.certificate.errors.forbidden
    return {
      success: false,
      error: 'TOGGLE_FAILED',
      message,
    }
  }
}
