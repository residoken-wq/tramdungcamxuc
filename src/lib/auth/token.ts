import { createHmac, timingSafeEqual } from 'node:crypto'

export const CUSTOMER_TOKEN_COOKIE = 'tdcx_customer_token'
export const DEFAULT_CUSTOMER_SESSION_EXPIRATION = 30 * 24 * 60 * 60 // 30 days in seconds

export interface CustomerTokenPayload {
  id: number
  email: string
  exp: number
  iat: number
  collection: 'customers'
  sv?: number
}

/**
 * REVIEW-REQUIRED: Resolves PAYLOAD_SECRET for customer authentication and hashing.
 * Strictly throws if unset or empty to prevent fallback to insecure hardcoded defaults.
 */
export function getAuthSecret(): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret || !secret.trim()) {
    throw new Error('PAYLOAD_SECRET environment variable is missing or empty')
  }
  return secret
}

/**
 * REVIEW-REQUIRED: Hashes a customer's email using HMAC-SHA256 and PAYLOAD_SECRET (T2-16b B6, anh Nhân chốt 14/10).
 * Email is trimmed and lowercased before hashing.
 * Used to track trial usage anonymously after account deletion (RGPD / Nghị định 13/2023/NĐ-CP).
 */
export function hashTrialEmail(email: string, secret: string = getAuthSecret()): string {
  const normalized = email.trim().toLowerCase()
  return createHmac('sha256', secret).update(normalized).digest('hex')
}

/**
 * REVIEW-REQUIRED: Signs a JWT-compatible session token for a customer using HMAC-SHA256 and PAYLOAD_SECRET.
 * Implemented with node:crypto without external dependencies.
 * Attaches sv (sessionVersion) to allow server-side session revocation.
 */
export function signCustomerToken(
  customer: { id: number; email: string; sessionVersion?: number },
  secret: string = getAuthSecret(),
  expiresInSeconds: number = DEFAULT_CUSTOMER_SESSION_EXPIRATION,
): string {
  if (!secret) {
    throw new Error('PAYLOAD_SECRET is required to sign customer token')
  }
  const now = Math.floor(Date.now() / 1000)
  const exp = now + expiresInSeconds
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: CustomerTokenPayload = {
    id: customer.id,
    email: customer.email.toLowerCase().trim(),
    exp,
    iat: now,
    collection: 'customers',
    sv: typeof customer.sessionVersion === 'number' ? customer.sessionVersion : 0,
  }

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const message = `${headerB64}.${payloadB64}`
  const signature = createHmac('sha256', secret).update(message).digest('base64url')

  return `${message}.${signature}`
}

/**
 * REVIEW-REQUIRED: Verifies a customer session token using constant-time HMAC comparison.
 * Returns decoded payload if valid and unexpired, null otherwise.
 * Legacy tokens without sv default to sv: 0 for backwards compatibility.
 */
export function verifyCustomerToken(
  token: string | null | undefined,
  secret: string = getAuthSecret(),
): CustomerTokenPayload | null {
  if (!token || typeof token !== 'string' || !secret) {
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  const [headerB64, payloadB64, signatureB64] = parts

  try {
    const message = `${headerB64}.${payloadB64}`
    const expectedSig = createHmac('sha256', secret).update(message).digest('base64url')

    const sigBuf = Buffer.from(signatureB64, 'base64url')
    const expBuf = Buffer.from(expectedSig, 'base64url')

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8')
    const payload = JSON.parse(payloadJson) as CustomerTokenPayload

    if (!payload || typeof payload !== 'object') {
      return null
    }

    if (payload.collection !== 'customers') {
      return null
    }

    if (typeof payload.id !== 'number' || typeof payload.email !== 'string') {
      return null
    }

    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.exp !== 'number' || payload.exp <= now) {
      return null
    }

    // REVIEW-REQUIRED: Default sv to 0 if missing in legacy tokens so active sessions stay valid
    payload.sv = typeof payload.sv === 'number' ? payload.sv : 0

    return payload
  } catch {
    return null
  }
}
