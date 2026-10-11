import 'server-only'
import { createHmac, randomInt } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import { z } from 'zod'
import config from '@/payload.config'
import { vi } from '../i18n/vi'
import { checkAndRecordRateLimit } from '../forms/ratelimit.server'
import { verifyTurnstile } from '../forms/turnstile.server'
import { sendCustomerOtpEmail } from '../email/service.server'
import type { EmailSender } from '../email/types'

export interface OtpContext {
  ip?: string
}

export interface RequestOtpOptions {
  payload?: Payload
  emailSender?: EmailSender
  now?: Date
}

export interface RequestOtpResult {
  success: boolean
  message: string
}

export const requestOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .max(254, vi.forms.validation.emailMax)
    .email(vi.forms.validation.emailInvalid),
  honeypot: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
  turnstileToken: z.string().max(2048, vi.forms.validation.tokenMax).optional(),
})

export type RequestOtpInput = z.infer<typeof requestOtpSchema>

async function resolvePayload(injected?: Payload): Promise<Payload> {
  if (injected) return injected
  return await getPayload({ config })
}

export function computeOtpHash(email: string, code: string): string {
  const secret = process.env.PAYLOAD_SECRET || 'tramdungcamxuc-default-secret'
  return createHmac('sha256', secret)
    .update(`${email.trim().toLowerCase()}:${code.trim()}`)
    .digest('hex')
}

/**
 * REVIEW-REQUIRED: Request customer login OTP.
 * Passwordless authentication via 6-digit email OTP.
 * Security controls:
 * 1. Honeypot check (silent discard).
 * 2. Zod email validation.
 * 3. Turnstile bot protection.
 * 4. Rate limiting per IP and per normalized email (5 requests per 10 mins).
 * 5. 6-digit cryptographically secure random number.
 * 6. Stored as HMAC-SHA256 with 10-minute expiration.
 * 7. Invalidation of prior unused OTP codes for the same email.
 * 8. Identical generic response to prevent email enumeration.
 */
export async function requestOtp(
  input: RequestOtpInput | Record<string, unknown>,
  ctx: OtpContext = {},
  options: RequestOtpOptions = {},
): Promise<RequestOtpResult> {
  // 1. Honeypot check on raw input
  if (typeof input === 'object' && input !== null && 'honeypot' in input) {
    const rawHoneypot = String(input.honeypot || '').trim()
    if (rawHoneypot.length > 0) {
      return { success: true, message: vi.auth.otpRequestedSuccess }
    }
  }

  // 2. Validate input schema
  const validated = requestOtpSchema.parse(input)
  if (validated.honeypot && validated.honeypot.trim().length > 0) {
    return { success: true, message: vi.auth.otpRequestedSuccess }
  }

  const normalizedEmail = validated.email.trim().toLowerCase()

  // 3. Bot protection: Cloudflare Turnstile
  await verifyTurnstile(validated.turnstileToken, ctx.ip)

  const payload = await resolvePayload(options.payload)

  // 4. Rate limiting per IP & normalized email
  await checkAndRecordRateLimit(payload, {
    form: 'customer_otp_request',
    ip: ctx.ip,
    email: normalizedEmail,
    windowMinutes: 10,
    maxHits: 5,
  })

  // 5. Generate 6-digit code
  const code = randomInt(100000, 1000000).toString()
  const codeHash = computeOtpHash(normalizedEmail, code)

  const now = options.now ?? new Date()
  const nowIso = now.toISOString()
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()

  // 6. Invalidate previous unused OTP codes for this email
  try {
    await payload.update({
      collection: 'otpCodes',
      where: {
        and: [{ email: { equals: normalizedEmail } }, { usedAt: { exists: false } }],
      },
      data: {
        usedAt: nowIso,
      },
      overrideAccess: true,
    })
  } catch (err) {
    console.warn('[OTP] Failed to invalidate previous OTPs:', err)
  }

  // 7. Store hashed OTP record
  await payload.create({
    collection: 'otpCodes',
    data: {
      email: normalizedEmail,
      codeHash,
      expiresAt,
      attempts: 0,
    },
    overrideAccess: true,
  })

  // 8. Log test code ONLY when NODE_ENV === 'test'
  if (process.env.NODE_ENV === 'test') {
    console.info(`[TEST-OTP] email="${normalizedEmail}" code="${code}"`)
  }

  // 9. Send email to customer
  await sendCustomerOtpEmail(
    payload,
    {
      email: normalizedEmail,
      code,
    },
    options.emailSender,
  )

  // 10. Always return generic uniform message to prevent email enumeration
  return {
    success: true,
    message: vi.auth.otpRequestedSuccess,
  }
}
