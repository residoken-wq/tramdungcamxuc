import crypto from 'node:crypto'

export interface DownloadTokenPayload {
  productId: number | string
  fileId: number | string
  expiresAt: number
  /** Có khi link tải file đã mua: route bắt buộc đúng khách đăng nhập + đơn đã thanh toán. */
  orderId?: number
  customerId?: number
}

export interface SignDownloadTokenOptions {
  productId: number | string
  fileId: number | string
  expiresAt?: number
  secret?: string
  orderId?: number
  customerId?: number
}

export type VerifyDownloadTokenResult =
  | { valid: true; payload: DownloadTokenPayload }
  | { valid: false; reason: 'expired' | 'invalid'; payload?: DownloadTokenPayload }

/**
 * Signs a download token valid for 7 days (by default) using HMAC-SHA256 and base64url.
 * Pure function independent of Payload CMS. Does not store tokens in the database.
 */
export function signDownloadToken({
  productId,
  fileId,
  expiresAt,
  secret,
  orderId,
  customerId,
}: SignDownloadTokenOptions): string {
  const secretKey = secret || process.env.PAYLOAD_SECRET
  if (!secretKey) {
    throw new Error('Missing PAYLOAD_SECRET for signing download token')
  }

  const effectiveExpiresAt =
    typeof expiresAt === 'number' ? expiresAt : Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  const payload: DownloadTokenPayload = {
    productId,
    fileId,
    expiresAt: effectiveExpiresAt,
    ...(orderId !== undefined ? { orderId } : {}),
    ...(customerId !== undefined ? { customerId } : {}),
  }

  const payloadString = JSON.stringify(payload)
  const dataBase64 = Buffer.from(payloadString, 'utf8').toString('base64url')
  const messageToSign = `download:v1:${dataBase64}`
  const signature = crypto.createHmac('sha256', secretKey).update(messageToSign).digest('base64url')

  return `${dataBase64}.${signature}`
}

/**
 * Verifies a download token with timingSafeEqual against PAYLOAD_SECRET.
 * Returns valid true + payload, or valid false with reason ('expired' | 'invalid').
 */
export function verifyDownloadToken(
  token: string,
  now?: number,
  secret?: string,
): VerifyDownloadTokenResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'invalid' }
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return { valid: false, reason: 'invalid' }
  }

  const [dataBase64, signature] = parts
  if (!dataBase64 || !signature) {
    return { valid: false, reason: 'invalid' }
  }

  const secretKey = secret || process.env.PAYLOAD_SECRET
  if (!secretKey) {
    throw new Error('Missing PAYLOAD_SECRET for verifying download token')
  }

  const messageToSign = `download:v1:${dataBase64}`
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(messageToSign)
    .digest('base64url')

  const sigBuf = Buffer.from(signature, 'utf8')
  const expectedBuf = Buffer.from(expectedSignature, 'utf8')

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, reason: 'invalid' }
  }

  let payload: DownloadTokenPayload
  try {
    const jsonStr = Buffer.from(dataBase64, 'base64url').toString('utf8')
    payload = JSON.parse(jsonStr)
  } catch {
    return { valid: false, reason: 'invalid' }
  }

  if (
    payload === null ||
    typeof payload !== 'object' ||
    payload.productId === undefined ||
    payload.fileId === undefined ||
    typeof payload.expiresAt !== 'number' ||
    (payload.orderId !== undefined && typeof payload.orderId !== 'number') ||
    (payload.customerId !== undefined && typeof payload.customerId !== 'number') ||
    (payload.orderId !== undefined) !== (payload.customerId !== undefined)
  ) {
    return { valid: false, reason: 'invalid' }
  }

  const currentTime = typeof now === 'number' ? now : Date.now()
  if (currentTime >= payload.expiresAt) {
    return { valid: false, reason: 'expired', payload }
  }

  return { valid: true, payload }
}
