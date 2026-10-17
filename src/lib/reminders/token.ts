import { createHmac, timingSafeEqual } from 'node:crypto'
import { getAuthSecret } from '@/lib/auth/token'
import { getSiteUrl } from '@/lib/site-url'

export const REMINDER_OPTOUT_PREFIX = 'reminder-optout:'

/**
 * REVIEW-REQUIRED: Ký token hủy nhận email nhắc lịch / nhắc tập bằng HMAC-SHA256 với tiền tố miền riêng.
 * Chứa customerId duy nhất, không chứa email; không có thời hạn hết hạn để link trong email cũ vẫn dùng được.
 */
export function signReminderOptOutToken(
  customerId: number,
  secret: string = getAuthSecret(),
): string {
  if (!Number.isFinite(customerId) || customerId <= 0 || !Number.isInteger(customerId)) {
    throw new Error('customerId must be a positive integer')
  }
  const payload = String(customerId)
  const signature = createHmac('sha256', secret)
    .update(`${REMINDER_OPTOUT_PREFIX}${payload}`)
    .digest('base64url')

  return `${payload}.${signature}`
}

/**
 * REVIEW-REQUIRED: Xác thực token hủy nhận email nhắc lịch bằng timingSafeEqual chống timing attacks.
 * Chỉ chấp nhận token đúng tiền tố miền REMINDER_OPTOUT_PREFIX và đúng chữ ký.
 * Token bị sửa dù 1 ký tự hoặc sinh từ miền chữ ký khác đều trả về null.
 */
export function verifyReminderOptOutToken(
  token: string | null | undefined,
  secret: string = getAuthSecret(),
): number | null {
  if (!token || typeof token !== 'string') {
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return null
  }

  const [payload, signature] = parts
  const customerId = Number(payload)
  if (!Number.isFinite(customerId) || customerId <= 0 || !Number.isInteger(customerId)) {
    return null
  }

  try {
    const expectedSig = createHmac('sha256', secret)
      .update(`${REMINDER_OPTOUT_PREFIX}${payload}`)
      .digest('base64url')

    const sigBuf = Buffer.from(signature, 'utf-8')
    const expBuf = Buffer.from(expectedSig, 'utf-8')

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null
    }

    return customerId
  } catch {
    return null
  }
}

/**
 * Sinh link hủy nhận email nhắc lịch tuyệt đối dẫn tới /nhac-lich/huy?t=...
 */
export function getReminderOptOutUrl(customerId: number, siteUrl?: string): string {
  const base = siteUrl ?? getSiteUrl()
  const token = signReminderOptOutToken(customerId)
  return `${base}/nhac-lich/huy?t=${encodeURIComponent(token)}`
}
