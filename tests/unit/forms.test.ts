// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { vi as viStrings } from '../../src/lib/i18n/vi'
import { b2bBriefSchema, coachingFormSchema, leadFormSchema } from '../../src/lib/forms/schemas'
import { submitB2BBrief, submitCoachingForm, submitLead } from '../../src/lib/forms/submit.server'
import { RateLimitError } from '../../src/lib/forms/ratelimit.server'
import { TurnstileError } from '../../src/lib/forms/turnstile.server'
import { handleActionError } from '../../src/lib/forms/actions'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []
  public shouldFail = false

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    if (this.shouldFail) {
      throw new Error('Simulated email provider network failure')
    }
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('Forms & Email Infrastructure (T1-06 & T1-06b)', () => {
  let payload: Payload
  const createdLeads: number[] = []
  const createdHits: number[] = []
  const createdServices: number[] = []

  beforeAll(async () => {
    payload = await getPayload({ config })

    // Ensure siteSettings has contact email for admin notification
    await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        email: 'hana@tramdungcamxuc.com',
      },
    })
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const id of createdLeads) {
        await payload.delete({ collection: 'leads', id, overrideAccess: true })
      }
      for (const id of createdHits) {
        await payload.delete({ collection: 'rateLimitHits', id, overrideAccess: true })
      }
      for (const id of createdServices) {
        await payload.delete({ collection: 'services', id, overrideAccess: true })
      }
    } catch {
      // Ignore cleanup errors
    } finally {
      await payload.destroy()
    }
  }, 30000)

  describe('Zod Validation with Vietnamese Messages & Length Limits (T1-06b)', () => {
    it('requires consent and returns Vietnamese error message', () => {
      const result = leadFormSchema.safeParse({
        name: 'Nguyễn Văn A',
        email: 'vana@example.com',
        consent: false,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const consentError = result.error.issues.find((i) => i.path.includes('consent'))
        expect(consentError?.message).toBe(viStrings.forms.validation.consentRequired)
      }
    })

    it('requires valid email format and returns Vietnamese error message', () => {
      const result = leadFormSchema.safeParse({
        name: 'Nguyễn Văn A',
        email: 'invalid-email-address',
        consent: true,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const emailError = result.error.issues.find((i) => i.path.includes('email'))
        expect(emailError?.message).toBe(viStrings.forms.validation.emailInvalid)
      }
    })

    it('requires name and returns Vietnamese error message', () => {
      const result = leadFormSchema.safeParse({
        name: '   ',
        email: 'valid@example.com',
        consent: true,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const nameError = result.error.issues.find((i) => i.path.includes('name'))
        expect(nameError?.message).toBe(viStrings.forms.validation.nameRequired)
      }
    })

    it('requires company in B2B brief form', () => {
      const result = b2bBriefSchema.safeParse({
        name: 'Trần Doanh Nghiệp',
        email: 'hr@company.com',
        company: '',
        consent: true,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const compError = result.error.issues.find((i) => i.path.includes('company'))
        expect(compError?.message).toBe(viStrings.forms.validation.companyRequired)
      }
    })

    it('requires message in coaching form', () => {
      const result = coachingFormSchema.safeParse({
        name: 'Lê Học Viên',
        email: 'hocvien@example.com',
        message: '',
        consent: true,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const msgError = result.error.issues.find((i) => i.path.includes('message'))
        expect(msgError?.message).toBe(viStrings.forms.validation.messageRequired)
      }
    })

    it('rejects message exceeding 2000 characters with Vietnamese error message', () => {
      const longMessage = 'A'.repeat(2001)
      const result = coachingFormSchema.safeParse({
        name: 'Lê Học Viên',
        email: 'hocvien@example.com',
        message: longMessage,
        consent: true,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const msgError = result.error.issues.find((i) => i.path.includes('message'))
        expect(msgError?.message).toBe(viStrings.forms.validation.messageMax)
      }
    })

    it('rejects field lengths exceeding bounds (name > 100, company > 200, tags > 10)', () => {
      // Name > 100
      const nameRes = leadFormSchema.safeParse({
        name: 'N'.repeat(101),
        email: 'user@example.com',
        consent: true,
      })
      expect(nameRes.success).toBe(false)
      if (!nameRes.success) {
        expect(
          nameRes.error.issues.some((i) => i.message === viStrings.forms.validation.nameMax),
        ).toBe(true)
      }

      // Company > 200
      const compRes = b2bBriefSchema.safeParse({
        name: 'Nguyễn Văn B',
        email: 'b@corp.com',
        company: 'C'.repeat(201),
        consent: true,
      })
      expect(compRes.success).toBe(false)
      if (!compRes.success) {
        expect(
          compRes.error.issues.some((i) => i.message === viStrings.forms.validation.companyMax),
        ).toBe(true)
      }

      // Tags count > 10
      const tagsRes = leadFormSchema.safeParse({
        name: 'Nguyễn Văn C',
        email: 'c@example.com',
        consent: true,
        interestTags: Array.from({ length: 11 }, (_, i) => `tag-${i}`),
      })
      expect(tagsRes.success).toBe(false)
      if (!tagsRes.success) {
        expect(
          tagsRes.error.issues.some(
            (i) => i.message === viStrings.forms.validation.interestTagsMaxCount,
          ),
        ).toBe(true)
      }
    })
  })

  describe('Safe Error Masking (actions.ts, T1-06b)', () => {
    it('masks internal server/database errors and never leaks raw message or lead id', () => {
      const sensitiveError = new Error(
        'FATAL: Connection to PostgreSQL failed at 127.0.0.1:5432 with password=secret123',
      )
      const actionRes = handleActionError(sensitiveError)

      expect(actionRes.success).toBe(false)
      expect(actionRes.error).toBe(viStrings.forms.serverError)
      expect(actionRes.error).not.toContain('PostgreSQL')
      expect(actionRes.error).not.toContain('password')
      expect(actionRes.error).not.toContain('5432')
      expect('id' in actionRes).toBe(false)
    })
  })

  describe('Check Order: Honeypot -> Zod -> Turnstile -> Rate Limit (T1-06b)', () => {
    it('does NOT create rateLimitHits when Turnstile verification fails', async () => {
      const originalEnv = process.env.TURNSTILE_SECRET_KEY
      process.env.TURNSTILE_SECRET_KEY = 'dummy-secret-key-for-test'
      const testEmail = `turnstile-fail-${randomUUID()}@example.test`

      try {
        // Missing turnstileToken while TURNSTILE_SECRET_KEY is configured
        await expect(
          submitLead(
            {
              name: 'Bot User',
              email: testEmail,
              consent: true,
              turnstileToken: '',
            },
            { ip: '10.50.60.70' },
            { payload },
          ),
        ).rejects.toThrow(TurnstileError)

        // Verify that rateLimitHits was NOT created because Turnstile failed before rate limit step
        const hits = await payload.find({
          collection: 'rateLimitHits',
          limit: 10,
          sort: '-createdAt',
          overrideAccess: true,
        })

        // There should be no hit recorded for this attempt
        const emailHashPrefix = testEmail.toLowerCase()
        const foundLeak = hits.docs.some((doc) => doc.key.includes(emailHashPrefix))
        expect(foundLeak).toBe(false)
      } finally {
        if (originalEnv === undefined) {
          delete process.env.TURNSTILE_SECRET_KEY
        } else {
          process.env.TURNSTILE_SECRET_KEY = originalEnv
        }
      }
    })
  })

  describe('Honeypot Antispam Protection', () => {
    it('returns success but does NOT create lead and does NOT send email when honeypot is filled', async () => {
      const email = `honeypot-${randomUUID()}@example.test`
      const sender = new MockEmailSender()

      const res = await submitLead(
        {
          name: 'Spam Bot',
          email,
          consent: true,
          honeypot: 'http://spam-link.com',
        },
        { ip: '10.0.0.1' },
        { payload, emailSender: sender },
      )

      expect(res.success).toBe(true)
      expect(res.fake).toBe(true)
      expect(sender.sent).toHaveLength(0)

      // Verify no lead was created in database
      const found = await payload.find({
        collection: 'leads',
        where: { email: { equals: email } },
        overrideAccess: true,
      })
      expect(found.totalDocs).toBe(0)
    })
  })

  describe('Rate Limiting & Privacy (NĐ 13/2023)', () => {
    it('blocks 6th submission within 10 minutes and never stores raw IP in DB', async () => {
      const testIp = `192.168.100.${Math.floor(Math.random() * 200) + 10}`
      const testEmail = `ratelimit-${randomUUID()}@example.test`
      const sender = new MockEmailSender()

      // 5 submissions should succeed
      for (let i = 1; i <= 5; i++) {
        const res = await submitLead(
          {
            name: `Test User ${i}`,
            email: testEmail,
            consent: true,
          },
          { ip: testIp },
          { payload, emailSender: sender },
        )
        expect(res.success).toBe(true)
        if (typeof res.id === 'number') createdLeads.push(res.id)
      }

      // 6th submission must be blocked by rate limit
      await expect(
        submitLead(
          {
            name: 'Test User 6',
            email: testEmail,
            consent: true,
          },
          { ip: testIp },
          { payload, emailSender: sender },
        ),
      ).rejects.toThrow(RateLimitError)

      // Verify that rateLimitHits collection NEVER stores the raw IP address
      const hits = await payload.find({
        collection: 'rateLimitHits',
        limit: 20,
        sort: '-createdAt',
        overrideAccess: true,
      })

      expect(hits.totalDocs).toBeGreaterThanOrEqual(5)
      for (const doc of hits.docs) {
        if (typeof doc.id === 'number') createdHits.push(doc.id)
        expect(doc.key).not.toBe(testIp)
        expect(doc.key).not.toContain(testIp)
        // Ensure keys are SHA-256 hashes (64 hex characters)
        expect(doc.key).toMatch(/^[a-f0-9]{64}$/)
      }
    })
  })

  describe('B2B Corporate Brief Form & Dual Email Delivery', () => {
    it('creates lead with need=business, brief fields, consentAt, and delivers 2 emails (customer + Hana)', async () => {
      const sender = new MockEmailSender()
      const b2bEmail = `b2b-${randomUUID()}@corp.test`

      const res = await submitB2BBrief(
        {
          name: 'Nguyễn Quản Lý',
          email: b2bEmail,
          phone: '0901234567',
          company: 'Công ty Cổ phần Alpha',
          teamSize: '50-100 người',
          targetBehaviors: 'Tăng cường gắn kết đội ngũ, quản lý căng thẳng',
          timeline: 'Tháng 11/2026',
          message: 'Mong muốn tổ chức workshop trực tiếp',
          consent: true,
        },
        {
          ip: `172.16.${Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 50)}`,
          page: '/doanh-nghiep',
          utm: 'utm_source=linkedin&utm_campaign=b2b_launch',
        },
        { payload, emailSender: sender },
      )

      expect(res.success).toBe(true)
      expect(res.id).toBeDefined()
      if (typeof res.id === 'number') createdLeads.push(res.id)

      // Check DB record
      const lead = await payload.findByID({
        collection: 'leads',
        id: res.id as number,
        overrideAccess: true,
      })

      expect(lead.need).toBe('business')
      expect(lead.name).toBe('Nguyễn Quản Lý')
      expect(lead.email).toBe(b2bEmail)
      expect(lead.phone).toBe('0901234567')
      expect(lead.brief?.company).toBe('Công ty Cổ phần Alpha')
      expect(lead.brief?.teamSize).toBe('50-100 người')
      expect(lead.brief?.targetBehaviors).toBe('Tăng cường gắn kết đội ngũ, quản lý căng thẳng')
      expect(lead.brief?.timeline).toBe('Tháng 11/2026')
      expect(lead.consent).toBe(true)
      expect(lead.consentAt).toBeDefined()
      expect(lead.source?.form).toBe('b2b')
      expect(lead.source?.page).toBe('/doanh-nghiep')
      expect(lead.source?.utm).toBe('utm_source=linkedin&utm_campaign=b2b_launch')

      // Verify emails: 1 confirmation to customer, 1 notification to Hana (admin)
      expect(sender.sent).toHaveLength(2)
      const customerEmail = sender.sent.find((e) => e.to === b2bEmail)
      const adminEmail = sender.sent.find((e) => e.to === 'hana@tramdungcamxuc.com')

      expect(customerEmail).toBeDefined()
      expect(customerEmail?.subject).toContain('Trạm Dừng Cảm Xúc')
      expect(customerEmail?.html).toContain('Công ty Cổ phần Alpha')

      expect(adminEmail).toBeDefined()
      expect(adminEmail?.subject).toContain('[TDCX]')
      expect(adminEmail?.html).toContain('Công ty Cổ phần Alpha')
    })
  })

  describe('Email Provider Resilience', () => {
    it('creates lead in database even if email sender throws an error', async () => {
      const failingSender = new MockEmailSender()
      failingSender.shouldFail = true
      const email = `resilience-${randomUUID()}@example.test`

      const res = await submitLead(
        {
          name: 'Phạm Kiên Cường',
          email,
          consent: true,
        },
        { ip: `10.10.${Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 50)}` },
        { payload, emailSender: failingSender },
      )

      expect(res.success).toBe(true)
      expect(res.id).toBeDefined()
      if (typeof res.id === 'number') createdLeads.push(res.id)

      // Verify lead still exists in DB
      const lead = await payload.findByID({
        collection: 'leads',
        id: res.id as number,
        overrideAccess: true,
      })
      expect(lead).toBeDefined()
      expect(lead.email).toBe(email)
    })
  })

  describe('Coaching Form Submission with Service Name (T1-06b)', () => {
    it('creates coaching lead with service.name relation and delivers emails containing service name', async () => {
      const sender = new MockEmailSender()
      const email = `coaching-${randomUUID()}@example.test`

      // Create a service in services collection
      const service = await payload.create({
        collection: 'services',
        data: {
          name: 'Khai vấn Thấu cảm 1:1',
          slug: `service-${randomUUID()}`,
          saleStatus: 'on_sale',
        },
        overrideAccess: true,
      })
      createdServices.push(service.id)

      const res = await submitCoachingForm(
        {
          name: 'Trần Khách Hàng',
          email,
          service: service.id,
          message: 'Em muốn tư vấn giải tỏa stress công việc',
          consent: true,
        },
        { ip: `10.20.${Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 50)}` },
        { payload, emailSender: sender },
      )

      expect(res.success).toBe(true)
      if (typeof res.id === 'number') createdLeads.push(res.id)

      const lead = await payload.findByID({
        collection: 'leads',
        id: res.id as number,
        overrideAccess: true,
      })

      expect(lead.need).toBe('personal')
      expect(lead.message).toBe('Em muốn tư vấn giải tỏa stress công việc')
      expect(lead.source?.form).toBe('coaching')
      expect(sender.sent).toHaveLength(2)

      // Verify customer confirmation email contains the exact service name
      const customerEmail = sender.sent.find((e) => e.to === email)
      expect(customerEmail).toBeDefined()
      expect(customerEmail?.html).toContain('Khai vấn Thấu cảm 1:1')

      // Verify admin notification email contains the exact service name
      const adminEmail = sender.sent.find((e) => e.to === 'hana@tramdungcamxuc.com')
      expect(adminEmail).toBeDefined()
      expect(adminEmail?.html).toContain('Khai vấn Thấu cảm 1:1')
    })
  })
})
