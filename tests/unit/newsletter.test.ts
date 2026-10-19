// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { vi as viStrings } from '../../src/lib/i18n/vi'
import { newsletterSchema } from '../../src/lib/forms/schemas'
import { submitNewsletter } from '../../src/lib/forms/submit.server'

describe('Newsletter Form & Lead Deduplication (SM-05)', () => {
  let payload: Payload
  const createdLeads: number[] = []

  beforeAll(async () => {
    payload = await getPayload({ config })
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const id of createdLeads) {
        await payload.delete({ collection: 'leads', id, overrideAccess: true })
      }
    } catch {
      // Ignore cleanup errors
    } finally {
      await payload.destroy()
    }
  }, 30000)

  describe('newsletterSchema validation', () => {
    it('validates correct email and consent', () => {
      const parsed = newsletterSchema.safeParse({
        email: 'doc-gia-test-01@example.com',
        consent: true,
      })
      expect(parsed.success).toBe(true)
    })

    it('accepts optional name within limits', () => {
      const parsed = newsletterSchema.safeParse({
        name: '[MẪU] Độc Giả Test 01',
        email: 'doc-gia-test-01@example.com',
        consent: true,
      })
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.name).toBe('[MẪU] Độc Giả Test 01')
      }
    })

    it('rejects missing or false consent', () => {
      const parsed = newsletterSchema.safeParse({
        email: 'doc-gia-test-01@example.com',
        consent: false,
      })
      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        const consentErr = parsed.error.issues.find((i) => i.path.includes('consent'))
        expect(consentErr?.message).toBe(viStrings.forms.validation.consentRequired)
      }
    })

    it('rejects invalid email format', () => {
      const parsed = newsletterSchema.safeParse({
        email: 'not-an-email',
        consent: true,
      })
      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        const emailErr = parsed.error.issues.find((i) => i.path.includes('email'))
        expect(emailErr?.message).toBe(viStrings.forms.validation.emailInvalid)
      }
    })

    it('rejects name exceeding 100 characters', () => {
      const parsed = newsletterSchema.safeParse({
        name: 'a'.repeat(101),
        email: 'test@example.com',
        consent: true,
      })
      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        const nameErr = parsed.error.issues.find((i) => i.path.includes('name'))
        expect(nameErr?.message).toBe(viStrings.account.validation.nameMax100)
      }
    })

    it('rejects name with special or injection characters', () => {
      const parsed = newsletterSchema.safeParse({
        name: '<script>alert(1)</script>',
        email: 'test@example.com',
        consent: true,
      })
      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        const nameErr = parsed.error.issues.find((i) => i.path.includes('name'))
        expect(nameErr?.message).toBe(viStrings.account.validation.nameSpecialChars)
      }
    })
  })

  const randomIp = () =>
    `10.50.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`

  describe('submitNewsletter Database Integration & Deduplication', () => {
    it('creates a new lead with need = resource, tag newsletter, consentAt when valid', async () => {
      const uniqueSuffix = randomUUID()
      const testEmail = `newsletter-test-${uniqueSuffix}@example.com`
      const testName = `[MẪU] Độc Giả ${uniqueSuffix.slice(0, 8)}`

      const result = await submitNewsletter(
        {
          name: testName,
          email: testEmail,
          consent: true,
          pageSlug: 'tai-nguyen',
        },
        { ip: randomIp() },
        { payload },
      )

      expect(result.success).toBe(true)
      expect(result.message).toBe(viStrings.sm05.newsletter.successMessage)

      // Query database directly to verify stored lead document
      const found = await payload.find({
        collection: 'leads',
        where: { email: { equals: testEmail } },
        overrideAccess: true,
      })

      expect(found.totalDocs).toBe(1)
      const leadDoc = found.docs[0]
      createdLeads.push(leadDoc.id)

      expect(leadDoc.need).toBe('resource')
      const tagTexts = ((leadDoc.interestTags as Array<{ text: string }>) || []).map((t) => t.text)
      expect(tagTexts).toContain('newsletter')
      expect(leadDoc.source?.form).toBe('newsletter')
      expect(leadDoc.source?.page).toBe('tai-nguyen')
      expect(leadDoc.consent).toBe(true)
      expect(leadDoc.consentAt).toBeTruthy()
    })

    it('deduplicates submission with same email in different case (returns same success, does not create duplicate lead)', async () => {
      const uniqueSuffix = randomUUID()
      const testEmailLower = `newsletter-dedup-${uniqueSuffix}@example.com`
      const testEmailUpper = `NEWSLETTER-DEDUP-${uniqueSuffix}@EXAMPLE.COM`
      const testIp = randomIp()

      // First submission
      const res1 = await submitNewsletter(
        {
          email: testEmailLower,
          consent: true,
          pageSlug: 'tai-nguyen',
        },
        { ip: testIp },
        { payload },
      )
      expect(res1.success).toBe(true)

      // Second submission with uppercase email (same or different IP)
      const res2 = await submitNewsletter(
        {
          email: testEmailUpper,
          consent: true,
          pageSlug: 'tai-nguyen',
        },
        { ip: randomIp() },
        { payload },
      )
      expect(res2.success).toBe(true)
      expect(res2.message).toBe(viStrings.sm05.newsletter.successMessage)

      // Query database: should only have 1 lead record
      const found = await payload.find({
        collection: 'leads',
        where: { email: { equals: testEmailLower } },
        overrideAccess: true,
      })

      expect(found.totalDocs).toBe(1)
      createdLeads.push(found.docs[0].id)
    })

    it('silently rejects honeypot submission and does not create lead', async () => {
      const uniqueSuffix = randomUUID()
      const testEmail = `newsletter-bot-${uniqueSuffix}@example.com`

      const res = await submitNewsletter(
        {
          email: testEmail,
          consent: true,
          honeypot: 'i-am-a-spambot',
        },
        { ip: '127.0.0.1' },
        { payload },
      )

      expect(res.fake).toBe(true)
      expect(res.success).toBe(true)

      // Verify no lead was created
      const found = await payload.find({
        collection: 'leads',
        where: { email: { equals: testEmail } },
        overrideAccess: true,
      })
      expect(found.totalDocs).toBe(0)
    })

    it('rejects missing consent and does not create lead', async () => {
      const uniqueSuffix = randomUUID()
      const testEmail = `newsletter-noconsent-${uniqueSuffix}@example.com`

      await expect(
        submitNewsletter(
          {
            email: testEmail,
            consent: false,
          },
          { ip: '127.0.0.1' },
          { payload },
        ),
      ).rejects.toThrow()

      const found = await payload.find({
        collection: 'leads',
        where: { email: { equals: testEmail } },
        overrideAccess: true,
      })
      expect(found.totalDocs).toBe(0)
    })
  })
})
