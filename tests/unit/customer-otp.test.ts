// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import {
  requestOtp,
  verifyOtp,
  computeOtpHash,
  OtpVerificationError,
} from '../../src/lib/auth/otp.server'
import { getSafeRedirectUrl } from '../../src/lib/auth/redirect'
import { vi as viDict } from '../../src/lib/i18n/vi'
import { RateLimitError } from '../../src/lib/forms/ratelimit.server'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

class MockEmailSender implements EmailSender {
  public sentEmails: SendEmailParams[] = []
  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sentEmails.push(params)
    return { success: true, id: `mock-${Date.now()}` }
  }
}

describe('Customer Email OTP Authentication (T2-01)', () => {
  let payload: Payload
  let emailSender: MockEmailSender
  const created: { collection: CollectionSlug; id: number }[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  let ipCounter = 1
  const uniqueIp = () => `10.99.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`

  beforeAll(async () => {
    payload = await getPayload({ config })
    emailSender = new MockEmailSender()
    try {
      await payload.delete({
        collection: 'rateLimitHits',
        where: { id: { exists: true } },
        overrideAccess: true,
      })
    } catch {
      // ignore cleanup
    }
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const entry of created.reverse()) {
        try {
          await payload.delete({ collection: entry.collection, id: entry.id, overrideAccess: true })
        } catch {
          // ignore cleanup failures
        }
      }
    } finally {
      await payload.destroy()
    }
  })

  describe('requestOtp', () => {
    it('returns identical message whether email exists or not (anti-enumeration)', async () => {
      const existingEmail = `existing-${randomUUID()}@example.test`
      const customer = await payload.create({
        collection: 'customers',
        data: { email: existingEmail, name: 'Khách Đã Có' },
        overrideAccess: true,
      })
      track('customers', customer)

      const nonExistingEmail = `nonexistent-${randomUUID()}@example.test`

      const res1 = await requestOtp(
        { email: existingEmail },
        { ip: uniqueIp() },
        { payload, emailSender },
      )
      const res2 = await requestOtp(
        { email: nonExistingEmail },
        { ip: uniqueIp() },
        { payload, emailSender },
      )

      expect(res1.success).toBe(true)
      expect(res2.success).toBe(true)
      expect(res1.message).toBe(res2.message)
      expect(res1.message).toBe(viDict.auth.otpRequestedSuccess)
    })

    it('silently ignores requests with filled honeypot without sending email or saving OTP', async () => {
      const email = `bot-${randomUUID()}@example.test`
      const countBefore = emailSender.sentEmails.length

      const res = await requestOtp(
        { email, honeypot: 'spam-bot' },
        { ip: uniqueIp() },
        { payload, emailSender },
      )

      expect(res.success).toBe(true)
      expect(res.message).toBe(viDict.auth.otpRequestedSuccess)
      expect(emailSender.sentEmails.length).toBe(countBefore)

      const stored = await payload.find({
        collection: 'otpCodes',
        where: { email: { equals: email } },
        overrideAccess: true,
      })
      expect(stored.docs).toHaveLength(0)
    })

    it('rate limits after 5 requests per 10 minutes', async () => {
      const email = `ratelimit-${randomUUID()}@example.test`
      const ip = `192.168.1.${Math.floor(Math.random() * 200 + 10)}`

      for (let i = 0; i < 5; i++) {
        await requestOtp({ email }, { ip }, { payload, emailSender })
      }

      await expect(requestOtp({ email }, { ip }, { payload, emailSender })).rejects.toThrow(
        RateLimitError,
      )
    })

    it('invalidates previous unused OTP codes for the same email', async () => {
      const email = `multi-otp-${randomUUID()}@example.test`

      await requestOtp({ email }, { ip: uniqueIp() }, { payload, emailSender })
      const firstCodes = await payload.find({
        collection: 'otpCodes',
        where: { email: { equals: email } },
        sort: '-createdAt',
        overrideAccess: true,
      })
      expect(firstCodes.docs).toHaveLength(1)
      expect(firstCodes.docs[0].usedAt).toBeNull()

      await requestOtp({ email }, { ip: uniqueIp() }, { payload, emailSender })
      const allCodes = await payload.find({
        collection: 'otpCodes',
        where: { email: { equals: email } },
        sort: '-createdAt',
        overrideAccess: true,
      })
      expect(allCodes.docs).toHaveLength(2)

      // Latest code is unused, older code is marked used/invalidated
      expect(allCodes.docs[0].usedAt).toBeNull()
      expect(allCodes.docs[1].usedAt).not.toBeNull()
    })
  })

  describe('verifyOtp', () => {
    it('verifies valid OTP, creates new customer, records consent, and signs session token', async () => {
      const email = `newcustomer-${randomUUID()}@example.test`
      const code = '123456'
      const codeHash = computeOtpHash(email, code)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()

      const otp = await payload.create({
        collection: 'otpCodes',
        data: {
          email,
          codeHash,
          expiresAt,
          attempts: 0,
        },
        overrideAccess: true,
      })
      track('otpCodes', otp)

      const result = await verifyOtp(
        { email, code, consentPolicy: true, consentMarketing: true },
        { ip: uniqueIp() },
        { payload, now },
      )

      expect(result.success).toBe(true)
      expect(result.customer.email).toBe(email)
      expect(result.customer.consentAt).toBeDefined()
      expect(result.customer.consentMarketing).toBe(true)
      expect(result.token).toBeDefined()
      track('customers', result.customer)

      // OTP is marked used
      const updatedOtp = await payload.findByID({
        collection: 'otpCodes',
        id: otp.id,
        overrideAccess: true,
      })
      expect(updatedOtp.usedAt).toBeDefined()
    })

    it('rejects invalid code and increments attempts', async () => {
      const email = `invalid-code-${randomUUID()}@example.test`
      const code = '654321'
      const codeHash = computeOtpHash(email, code)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()

      const otp = await payload.create({
        collection: 'otpCodes',
        data: {
          email,
          codeHash,
          expiresAt,
          attempts: 0,
        },
        overrideAccess: true,
      })
      track('otpCodes', otp)

      await expect(
        verifyOtp({ email, code: '000000' }, { ip: uniqueIp() }, { payload, now }),
      ).rejects.toThrow(OtpVerificationError)

      const updatedOtp = await payload.findByID({
        collection: 'otpCodes',
        id: otp.id,
        overrideAccess: true,
      })
      expect(updatedOtp.attempts).toBe(1)
      expect(updatedOtp.usedAt).toBeNull()
    })

    it('locks OTP code after 5 failed attempts', async () => {
      const email = `lock-code-${randomUUID()}@example.test`
      const code = '777888'
      const codeHash = computeOtpHash(email, code)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()

      const otp = await payload.create({
        collection: 'otpCodes',
        data: {
          email,
          codeHash,
          expiresAt,
          attempts: 4, // already 4 failed attempts
        },
        overrideAccess: true,
      })
      track('otpCodes', otp)

      // 5th failed attempt -> locks and throws codeLocked
      await expect(
        verifyOtp({ email, code: '000000' }, { ip: uniqueIp() }, { payload, now }),
      ).rejects.toThrow(viDict.auth.codeLocked)

      // 6th attempt (even with correct code) is rejected because code is locked
      await expect(
        verifyOtp({ email, code }, { ip: uniqueIp() }, { payload, now }),
      ).rejects.toThrow(viDict.auth.codeLocked)
    })

    it('rejects expired OTP code', async () => {
      const email = `expired-${randomUUID()}@example.test`
      const code = '111222'
      const codeHash = computeOtpHash(email, code)
      const now = new Date()
      // Expired 1 minute ago
      const expiresAt = new Date(now.getTime() - 60 * 1000).toISOString()

      const otp = await payload.create({
        collection: 'otpCodes',
        data: {
          email,
          codeHash,
          expiresAt,
          attempts: 0,
        },
        overrideAccess: true,
      })
      track('otpCodes', otp)

      await expect(
        verifyOtp({ email, code }, { ip: uniqueIp() }, { payload, now }),
      ).rejects.toThrow(viDict.auth.codeExpired)
    })

    it('rejects already used OTP code', async () => {
      const email = `used-${randomUUID()}@example.test`
      const code = '333444'
      const codeHash = computeOtpHash(email, code)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()

      const otp = await payload.create({
        collection: 'otpCodes',
        data: {
          email,
          codeHash,
          expiresAt,
          attempts: 0,
          usedAt: new Date(now.getTime() - 30 * 1000).toISOString(),
        },
        overrideAccess: true,
      })
      track('otpCodes', otp)

      await expect(
        verifyOtp({ email, code }, { ip: uniqueIp() }, { payload, now }),
      ).rejects.toThrow(viDict.auth.codeUsed)
    })

    it('ensures exactly one of two concurrent verifyOtp requests succeeds', async () => {
      const email = `concurrent-${randomUUID()}@example.test`
      const code = '555666'
      const codeHash = computeOtpHash(email, code)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()

      const otp = await payload.create({
        collection: 'otpCodes',
        data: {
          email,
          codeHash,
          expiresAt,
          attempts: 0,
        },
        overrideAccess: true,
      })
      track('otpCodes', otp)

      const results = await Promise.allSettled([
        verifyOtp({ email, code }, { ip: uniqueIp() }, { payload, now }),
        verifyOtp({ email, code }, { ip: uniqueIp() }, { payload, now }),
      ])

      const fulfilled = results.filter((r) => r.status === 'fulfilled')
      const rejected = results.filter((r) => r.status === 'rejected')

      expect(fulfilled).toHaveLength(1)
      expect(rejected).toHaveLength(1)

      const err = (rejected[0] as PromiseRejectedResult).reason as Error
      expect(err.message).toBe(viDict.auth.codeUsed)
    })
  })

  describe('getSafeRedirectUrl', () => {
    it('allows valid internal paths', () => {
      expect(getSafeRedirectUrl('/tai-khoan')).toBe('/tai-khoan')
      expect(getSafeRedirectUrl('/habit')).toBe('/habit')
      expect(getSafeRedirectUrl('/eq-buddy')).toBe('/eq-buddy')
      expect(getSafeRedirectUrl('/khoa-hoc/123')).toBe('/khoa-hoc/123')
    })

    it('disallows open redirect attempts and falls back to /tai-khoan', () => {
      expect(getSafeRedirectUrl('https://evil.com')).toBe('/tai-khoan')
      expect(getSafeRedirectUrl('http://evil.com')).toBe('/tai-khoan')
      expect(getSafeRedirectUrl('//evil.com')).toBe('/tai-khoan')
      expect(getSafeRedirectUrl('/\\evil.com')).toBe('/tai-khoan')
      expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/tai-khoan')
      expect(getSafeRedirectUrl('')).toBe('/tai-khoan')
      expect(getSafeRedirectUrl(null)).toBe('/tai-khoan')
      expect(getSafeRedirectUrl(undefined)).toBe('/tai-khoan')
    })
  })
})
