import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { resolveLoginMethods } from '@/lib/auth/methods'
import {
  signOAuthCookie,
  verifyOAuthCookie,
  verifyGoogleIdToken,
  findOrCreateGoogleCustomer,
  clearJwksCache,
  type GoogleOAuthStatePayload,
} from '@/lib/auth/google.server'
import { createMockIdToken, getMockPublicJwk } from '@/lib/auth/google-mock.server'
import { verifyOtpAction, requestOtpAction } from '@/lib/auth/actions'
import { vi as i18nVi } from '@/lib/i18n/vi'

describe('GL-01 Google Login Unit Tests', () => {
  let payload: Payload
  const clientId = 'test-google-client-id'

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  describe('1.1: resolveLoginMethods', () => {
    const completeEnv = {
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    }

    it('Row 1: Google enabled + env complete, OTP enabled -> both methods active', () => {
      const result = resolveLoginMethods(
        { loginGoogleEnabled: true, loginOtpEnabled: true },
        completeEnv,
      )
      expect(result).toEqual({ google: true, otp: true })
    })

    it('Row 1 (defaults): default settings with complete env -> both methods active', () => {
      const result = resolveLoginMethods({}, completeEnv)
      expect(result).toEqual({ google: true, otp: true })
    })

    it('Row 2: Google enabled + env complete, OTP disabled -> only Google active', () => {
      const result = resolveLoginMethods(
        { loginGoogleEnabled: true, loginOtpEnabled: false },
        completeEnv,
      )
      expect(result).toEqual({ google: true, otp: false })
    })

    it('Row 3: Google enabled but env missing GOOGLE_CLIENT_ID -> falls back to OTP form', () => {
      const result = resolveLoginMethods(
        { loginGoogleEnabled: true, loginOtpEnabled: false },
        { GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: 'secret' },
      )
      expect(result).toEqual({ google: false, otp: true })
    })

    it('Row 3: Google enabled but env missing GOOGLE_CLIENT_SECRET -> falls back to OTP form', () => {
      const result = resolveLoginMethods(
        { loginGoogleEnabled: true, loginOtpEnabled: false },
        { GOOGLE_CLIENT_ID: 'client-id', GOOGLE_CLIENT_SECRET: '' },
      )
      expect(result).toEqual({ google: false, otp: true })
    })

    it('Row 3: Google disabled in settings -> falls back to OTP form regardless of OTP setting', () => {
      const result1 = resolveLoginMethods(
        { loginGoogleEnabled: false, loginOtpEnabled: true },
        completeEnv,
      )
      expect(result1).toEqual({ google: false, otp: true })

      const result2 = resolveLoginMethods(
        { loginGoogleEnabled: false, loginOtpEnabled: false },
        completeEnv,
      )
      expect(result2).toEqual({ google: false, otp: true })
    })
  })

  describe('1.2: OAuth State Cookie', () => {
    const validPayload: GoogleOAuthStatePayload = {
      state: 'random-state-12345',
      nonce: 'random-nonce-67890',
      verifier: 'random-verifier-abcdef',
      next: '/dung-thu',
      consent: 1,
      marketing: 0,
      exp: Math.floor(Date.now() / 1000) + 600,
    }

    it('signs and verifies a valid state cookie', () => {
      const cookie = signOAuthCookie(validPayload, 'test-secret')
      const verified = verifyOAuthCookie(cookie, 'test-secret')
      expect(verified).toEqual(validPayload)
    })

    it('rejects tampered cookie signature', () => {
      const cookie = signOAuthCookie(validPayload, 'test-secret')
      const tamperedSig = cookie.slice(0, -6) + 'abcdef'
      expect(verifyOAuthCookie(tamperedSig, 'test-secret')).toBeNull()

      const [, sig] = cookie.split('.')
      const tamperedData = Buffer.from(
        JSON.stringify({ ...validPayload, state: 'hacked-state' }),
      ).toString('base64url')
      expect(verifyOAuthCookie(`${tamperedData}.${sig}`, 'test-secret')).toBeNull()
    })

    it('rejects cookie signed with wrong secret', () => {
      const cookie = signOAuthCookie(validPayload, 'test-secret-1')
      expect(verifyOAuthCookie(cookie, 'test-secret-2')).toBeNull()
    })

    it('rejects expired state cookie', () => {
      const expiredPayload: GoogleOAuthStatePayload = {
        ...validPayload,
        exp: Math.floor(Date.now() / 1000) - 10,
      }
      const cookie = signOAuthCookie(expiredPayload, 'test-secret')
      expect(verifyOAuthCookie(cookie, 'test-secret')).toBeNull()
    })
  })

  describe('1.2: Google ID Token Verification', () => {
    const mockJwksUrl = 'http://localhost:3000/api/test-google/jwks'
    const nonce = 'expected-nonce-xyz'

    beforeAll(() => {
      // Mock global fetch to return our mock JWKS keys
      vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('/jwks')) {
          return new Response(JSON.stringify({ keys: [getMockPublicJwk()] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=3600' },
          })
        }
        return new Response('Not found', { status: 404 })
      })
    })

    afterAll(() => {
      vi.restoreAllMocks()
    })

    it('successfully verifies a valid ID token', async () => {
      clearJwksCache()
      const token = createMockIdToken({
        sub: 'google-sub-1001',
        email: 'student@example.com',
        name: 'Hana Học Viên',
        nonce,
        aud: clientId,
      })

      const verified = await verifyGoogleIdToken(token, nonce, clientId, mockJwksUrl)
      expect(verified).toEqual({
        sub: 'google-sub-1001',
        email: 'student@example.com',
        name: 'Hana Học Viên',
      })
    })

    it('rejects ID token with mismatched nonce', async () => {
      clearJwksCache()
      const token = createMockIdToken({
        sub: 'google-sub-1002',
        email: 'student2@example.com',
        nonce: 'other-nonce',
        aud: clientId,
      })

      await expect(verifyGoogleIdToken(token, nonce, clientId, mockJwksUrl)).rejects.toThrow(
        /Nonce mismatch/,
      )
    })

    it('rejects ID token with mismatched audience', async () => {
      clearJwksCache()
      const token = createMockIdToken({
        sub: 'google-sub-1003',
        email: 'student3@example.com',
        nonce,
        aud: 'wrong-client-id',
      })

      await expect(verifyGoogleIdToken(token, nonce, clientId, mockJwksUrl)).rejects.toThrow(
        /Audience mismatch/,
      )
    })

    it('rejects expired ID token', async () => {
      clearJwksCache()
      const token = createMockIdToken({
        sub: 'google-sub-1004',
        email: 'student4@example.com',
        nonce,
        aud: clientId,
        expiresInSeconds: -100,
      })

      await expect(verifyGoogleIdToken(token, nonce, clientId, mockJwksUrl)).rejects.toThrow(
        /expired/,
      )
    })

    it('rejects ID token when email_verified is false', async () => {
      clearJwksCache()
      const token = createMockIdToken({
        sub: 'google-sub-1005',
        email: 'unverified@example.com',
        nonce,
        aud: clientId,
        email_verified: false,
      })

      await expect(verifyGoogleIdToken(token, nonce, clientId, mockJwksUrl)).rejects.toThrow(
        /Email is not verified/,
      )
    })

    it('rejects ID token with tampered signature', async () => {
      clearJwksCache()
      const token = createMockIdToken({
        sub: 'google-sub-1006',
        email: 'tampered@example.com',
        nonce,
        aud: clientId,
      })

      const parts = token.split('.')
      const tampered = `${parts[0]}.${parts[1]}.tamperedSignature`

      await expect(verifyGoogleIdToken(tampered, nonce, clientId, mockJwksUrl)).rejects.toThrow(
        /Invalid signature/,
      )
    })
  })

  describe('1.2: findOrCreateGoogleCustomer on database', () => {
    it('does NOT create new customer when consentPolicy !== 1', async () => {
      const email = `gl01-noconsent-${Date.now()}@example.com`
      const res = await findOrCreateGoogleCustomer({
        payload,
        googleSub: `sub-noconsent-${Date.now()}`,
        email,
        consentPolicy: 0,
      })

      expect(res.error).toBe('can-dong-y')
      expect(res.customer).toBeUndefined()

      // Verify no customer exists in DB
      const query = await payload.find({
        collection: 'customers',
        where: { email: { equals: email } },
        overrideAccess: true,
      })
      expect(query.totalDocs).toBe(0)
    })

    it('creates new customer when consentPolicy === 1 and records consentAt', async () => {
      const email = `gl01-new-${Date.now()}@example.com`
      const sub = `sub-new-${Date.now()}`
      const name = 'Người Dùng Mới'

      const res = await findOrCreateGoogleCustomer({
        payload,
        googleSub: sub,
        email,
        name,
        consentPolicy: 1,
        consentMarketing: 1,
      })

      expect(res.error).toBeUndefined()
      expect(res.customer).toBeDefined()
      expect(res.customer?.email).toBe(email)
      expect(res.customer?.name).toBe(name)
      expect(res.customer?.googleSub).toBe(sub)
      expect(res.customer?.consentAt).toBeTruthy()
      expect(res.customer?.consentMarketing).toBe(true)
    })

    it('links googleSub to existing customer with same email, preserving customer ID and existing name', async () => {
      const email = `gl01-existing-${Date.now()}@example.com`
      const originalName = 'Tên Gốc Lúc Đăng Ký OTP'

      // 1. Create customer without googleSub (simulating prior OTP login)
      const existing = await payload.create({
        collection: 'customers',
        data: {
          email,
          name: originalName,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      expect(existing.googleSub).toBeFalsy()

      // 2. Customer logs in via Google with same email but Google profile has a different name
      const sub = `sub-link-${Date.now()}`
      const res = await findOrCreateGoogleCustomer({
        payload,
        googleSub: sub,
        email,
        name: 'Tên Trên Google Khác',
        consentPolicy: 1,
      })

      expect(res.error).toBeUndefined()
      expect(res.customer?.id).toBe(existing.id)
      expect(res.customer?.googleSub).toBe(sub)
      // Name was NOT overwritten!
      expect(res.customer?.name).toBe(originalName)
    })

    it('rejects login when customer email is already linked to a different googleSub', async () => {
      const email = `gl01-diffsub-${Date.now()}@example.com`
      const sub1 = `sub-first-${Date.now()}`
      const sub2 = `sub-second-${Date.now()}`

      // Create with sub1
      await payload.create({
        collection: 'customers',
        data: {
          email,
          googleSub: sub1,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })

      // Attempt login with sub2
      const res = await findOrCreateGoogleCustomer({
        payload,
        googleSub: sub2,
        email,
        consentPolicy: 1,
      })

      expect(res.error).toBe('lien-ket-khac')
      expect(res.customer).toBeUndefined()
    })

    it('allows login when sub matches even if Google returns a different email (does not mutate DB email)', async () => {
      const originalEmail = `gl01-orig-${Date.now()}@example.com`
      const sub = `sub-matched-${Date.now()}`

      const cust = await payload.create({
        collection: 'customers',
        data: {
          email: originalEmail,
          googleSub: sub,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })

      // Google returns different email for same sub
      const res = await findOrCreateGoogleCustomer({
        payload,
        googleSub: sub,
        email: `new-google-email-${Date.now()}@example.com`,
        consentPolicy: 1,
      })

      expect(res.error).toBeUndefined()
      expect(res.customer?.id).toBe(cust.id)
      expect(res.customer?.email).toBe(originalEmail)
    })
  })

  describe('1.1: actions error when OTP is disabled', () => {
    it('returns error when OTP is toggled off and Google is usable', async () => {
      // Temporarily set SiteSettings loginOtpEnabled to false
      const origSettings = await payload.findGlobal({ slug: 'siteSettings', overrideAccess: true })

      try {
        await payload.updateGlobal({
          slug: 'siteSettings',
          data: {
            loginGoogleEnabled: true,
            loginOtpEnabled: false,
          },
          overrideAccess: true,
        })

        // Ensure env has Google keys during this test
        const origId = process.env.GOOGLE_CLIENT_ID
        const origSecret = process.env.GOOGLE_CLIENT_SECRET
        process.env.GOOGLE_CLIENT_ID = 'test-id'
        process.env.GOOGLE_CLIENT_SECRET = 'test-secret'

        const formData = new FormData()
        formData.append('email', 'test@example.com')
        formData.append('code', '123456')

        const res = await verifyOtpAction(null, formData)
        expect(res.success).toBe(false)
        expect(res.error).toBe(i18nVi.gl01.loginDisabled)

        const reqRes = await requestOtpAction(null, formData)
        expect(reqRes.success).toBe(false)
        expect(reqRes.error).toBe(i18nVi.gl01.loginDisabled)

        // Restore env
        process.env.GOOGLE_CLIENT_ID = origId
        process.env.GOOGLE_CLIENT_SECRET = origSecret
      } finally {
        await payload.updateGlobal({
          slug: 'siteSettings',
          data: {
            loginGoogleEnabled: origSettings.loginGoogleEnabled ?? true,
            loginOtpEnabled: origSettings.loginOtpEnabled ?? true,
          },
          overrideAccess: true,
        })
      }
    })
  })
})
