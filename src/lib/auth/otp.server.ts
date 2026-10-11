import 'server-only'
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { z } from 'zod'
import config from '@/payload.config'
import type { Customer } from '@/payload-types'
import { vi } from '../i18n/vi'
import { checkAndRecordRateLimit } from '../forms/ratelimit.server'
import { verifyTurnstile } from '../forms/turnstile.server'
import { sendCustomerOtpEmail } from '../email/service.server'
import type { EmailSender } from '../email/types'
import { signCustomerToken } from './token'

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

export interface VerifyOtpInput {
  email: string
  code: string
  consentPolicy?: boolean
  consentMarketing?: boolean
}

export interface VerifyOtpOptions {
  payload?: Payload
  now?: Date
}

export interface VerifyOtpResult {
  success: boolean
  customer: Customer
  token: string
}

export class OtpVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OtpVerificationError'
  }
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

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, vi.forms.validation.emailRequired)
    .max(254, vi.forms.validation.emailMax)
    .email(vi.forms.validation.emailInvalid),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, vi.auth.invalidCode),
  consentPolicy: z.boolean().optional(),
  consentMarketing: z.boolean().optional(),
})

async function resolvePayload(injected?: Payload): Promise<Payload> {
  if (injected) return injected
  return await getPayload({ config })
}

interface DrizzleDbExecutor {
  execute: (query: unknown) => Promise<unknown>
}

function getDrizzleDb(payload: Payload): DrizzleDbExecutor | null {
  const db = (payload.db as unknown as { drizzle?: DrizzleDbExecutor })?.drizzle
  return db && typeof db.execute === 'function' ? db : null
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

/**
 * REVIEW-REQUIRED: Verify customer login OTP and create customer session.
 * Security controls:
 * 1. Constant-time comparison (crypto.timingSafeEqual).
 * 2. Maximum 5 attempts before the OTP is locked permanently.
 * 3. Atomic conditional UPDATE at DB level (UPDATE ... WHERE used_at IS NULL RETURNING id)
 *    to prevent concurrent requests from reusing the same OTP code.
 * 4. Find or create customer with lowercase normalized email.
 * 5. Record consentAt timestamp when user accepts privacy policy; consentMarketing is optional.
 * 6. Sign secure session token for customer.
 */
export async function verifyOtp(
  input: VerifyOtpInput | Record<string, unknown>,
  ctx: OtpContext = {},
  options: VerifyOtpOptions = {},
): Promise<VerifyOtpResult> {
  const validated = verifyOtpSchema.parse(input)
  const normalizedEmail = validated.email.trim().toLowerCase()
  const cleanCode = validated.code.trim()

  const payload = await resolvePayload(options.payload)

  // Rate limiting on verification attempts per IP & email
  await checkAndRecordRateLimit(payload, {
    form: 'customer_otp_verify',
    ip: ctx.ip,
    email: normalizedEmail,
    windowMinutes: 10,
    maxHits: 10,
  })

  // Find latest OTP code for this email
  const otpQuery = await payload.find({
    collection: 'otpCodes',
    where: {
      email: { equals: normalizedEmail },
    },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
  })

  const otpDoc = otpQuery.docs[0]
  if (!otpDoc) {
    throw new OtpVerificationError(vi.auth.otpNotFound)
  }

  // Check if already used
  if (otpDoc.usedAt) {
    throw new OtpVerificationError(vi.auth.codeUsed)
  }

  // Check if locked due to >= 5 failed attempts
  if (typeof otpDoc.attempts === 'number' && otpDoc.attempts >= 5) {
    throw new OtpVerificationError(vi.auth.codeLocked)
  }

  const now = options.now ?? new Date()
  const nowIso = now.toISOString()

  // Check expiration (10 minutes)
  if (new Date(otpDoc.expiresAt).getTime() < now.getTime()) {
    throw new OtpVerificationError(vi.auth.codeExpired)
  }

  // Constant-time hash comparison
  const expectedHash = computeOtpHash(normalizedEmail, cleanCode)
  const expectedBuf = Buffer.from(expectedHash, 'hex')
  const storedBuf = Buffer.from(otpDoc.codeHash, 'hex')
  const isMatch = expectedBuf.length === storedBuf.length && timingSafeEqual(expectedBuf, storedBuf)

  if (!isMatch) {
    const currentAttempts = typeof otpDoc.attempts === 'number' ? otpDoc.attempts : 0
    const newAttempts = currentAttempts + 1
    await payload.update({
      collection: 'otpCodes',
      id: otpDoc.id,
      data: { attempts: newAttempts },
      overrideAccess: true,
    })

    if (newAttempts >= 5) {
      throw new OtpVerificationError(vi.auth.codeLocked)
    }
    throw new OtpVerificationError(vi.auth.invalidCode)
  }

  // REVIEW-REQUIRED: Race-condition safe atomic update on DB level
  const db = getDrizzleDb(payload)
  if (db) {
    const updateResult = await db.execute(
      sql`UPDATE "otp_codes" SET "used_at" = ${nowIso}::timestamptz, "updated_at" = ${nowIso}::timestamptz WHERE "id" = ${otpDoc.id} AND "used_at" IS NULL RETURNING "id"`,
    )
    const rows = Array.isArray(updateResult)
      ? updateResult
      : ((updateResult as { rows?: Array<{ id: number }> }).rows ?? [])
    if (rows.length === 0) {
      throw new OtpVerificationError(vi.auth.codeUsed)
    }
  } else {
    // Fallback for non-postgres or test mocks without direct drizzle executor
    if (otpDoc.usedAt) {
      throw new OtpVerificationError(vi.auth.codeUsed)
    }
    await payload.update({
      collection: 'otpCodes',
      id: otpDoc.id,
      data: { usedAt: nowIso },
      overrideAccess: true,
    })
  }

  // Find or create customer
  const customerQuery = await payload.find({
    collection: 'customers',
    where: {
      email: { equals: normalizedEmail },
    },
    limit: 1,
    overrideAccess: true,
  })

  let customer = customerQuery.docs[0]
  if (!customer) {
    customer = await payload.create({
      collection: 'customers',
      data: {
        email: normalizedEmail,
        consentAt: validated.consentPolicy !== false ? nowIso : undefined,
        consentMarketing: Boolean(validated.consentMarketing),
      },
      overrideAccess: true,
    })
  } else {
    const updateData: Record<string, unknown> = {}
    if (!customer.consentAt && validated.consentPolicy !== false) {
      updateData.consentAt = nowIso
    }
    if (validated.consentMarketing && !customer.consentMarketing) {
      updateData.consentMarketing = true
    }
    if (Object.keys(updateData).length > 0) {
      customer = await payload.update({
        collection: 'customers',
        id: customer.id,
        data: updateData,
        overrideAccess: true,
      })
    }
  }

  // Sign session token
  const secret = process.env.PAYLOAD_SECRET || 'tramdungcamxuc-default-secret'
  const token = signCustomerToken(
    {
      id: Number(customer.id),
      email: customer.email,
    },
    secret,
  )

  return {
    success: true,
    customer,
    token,
  }
}
