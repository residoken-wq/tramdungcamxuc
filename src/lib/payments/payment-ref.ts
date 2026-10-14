import { randomBytes, randomInt } from 'node:crypto'

// Unambiguous alphabet: no 0/O or 1/I so customers can type the transfer note correctly.
export const PAYMENT_REF_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
export const PAYMENT_REF_PREFIX = 'TDCX'
export const PAYMENT_REF_PATTERN = /^TDCX[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/

export function generatePaymentRef(pick: (max: number) => number = randomInt): string {
  let code = ''
  for (let i = 0; i < 5; i++) code += PAYMENT_REF_ALPHABET[pick(PAYMENT_REF_ALPHABET.length)]
  return `${PAYMENT_REF_PREFIX}${code}`
}

// REVIEW-REQUIRED: Retries until the reference is unused; `exists` must check the orders table.
export async function generateUniquePaymentRef(
  exists: (ref: string) => Promise<boolean>,
  pick?: (max: number) => number,
  attempts = 10,
): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const ref = generatePaymentRef(pick)
    if (!(await exists(ref))) return ref
  }
  throw new Error('Không tạo được mã chuyển khoản duy nhất. Vui lòng thử lại.')
}

/** Unguessable token for admin-created payment links (/thanh-toan/[payToken]). */
export function generatePayToken(): string {
  return randomBytes(24).toString('base64url')
}

/**
 * REVIEW-REQUIRED: Trích xuất paymentRef từ chuỗi nội dung chuyển khoản của ngân hàng.
 * Ngân hàng có thể thêm tiền tố/hậu tố, đổi chữ hoa/thường, hoặc thêm dấu cách.
 * Tìm TDCX + 5 ký tự thuộc PAYMENT_REF_ALPHABET, không phân biệt hoa thường.
 * Không thấy hoặc thấy 2 mã khác nhau -> trả về null.
 */
export function extractPaymentRef(text?: string | null): string | null {
  if (!text || typeof text !== 'string') return null
  const pattern = new RegExp(`TDCX\\s*[${PAYMENT_REF_ALPHABET}]{5}`, 'gi')
  const matches = text.match(pattern)
  if (!matches || matches.length === 0) return null

  const normalized = Array.from(
    new Set(matches.map((m) => m.replace(/\s+/g, '').toUpperCase())),
  )
  if (normalized.length !== 1) {
    return null
  }
  return normalized[0]
}
