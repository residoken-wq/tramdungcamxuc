// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import config from '../../src/payload.config'
import { submitResourceRequest } from '../../src/lib/forms/submit.server'
import { resourceRequestSchema } from '../../src/lib/forms/schemas'
import { verifyDownloadToken } from '../../src/lib/downloads/token'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

type AdminUser = NonNullable<PayloadRequest['user']>

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

describe('Free Resource Delivery & Access Control (T1-07)', () => {
  let payload: Payload
  let editor: AdminUser
  let owner: AdminUser
  let productId: number
  let productSlug: string
  let privateFileId: number
  let tempFilePath: string

  const createdLeads: number[] = []
  const createdHits: number[] = []
  const createdUsers: number[] = []

  beforeAll(async () => {
    process.env.PAYLOAD_SECRET = 'test-secret-payload-key-1234567890'
    payload = await getPayload({ config })

    // Create admin users for permission testing
    const makeAdmin = async (role: 'owner' | 'editor') => {
      const u = await payload.create({
        collection: 'users',
        data: {
          email: `t1-07-${role}-${randomUUID()}@example.test`,
          password: randomUUID(),
          role,
        },
      })
      createdUsers.push(u.id)
      return { ...u, collection: 'users' } as unknown as AdminUser
    }
    editor = await makeAdmin('editor')
    owner = await makeAdmin('owner')

    // Create a temporary valid PDF file and upload to privateFiles
    const testFileName = `test-resource-${randomUUID()}.pdf`
    tempFilePath = path.resolve(os.tmpdir(), testFileName)
    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<<>>\nendobj\nxref\n0 1\n0000000000 65535 f\ntrailer\n<<>>\nstartxref\n9\n%%EOF\n',
    )
    fs.writeFileSync(tempFilePath, validPdfBuffer)

    const fileDoc = await payload.create({
      collection: 'privateFiles',
      data: {
        description: 'Tài liệu test giao miễn phí',
      },
      filePath: tempFilePath,
      overrideAccess: true,
    })
    privateFileId = fileDoc.id

    // Create free ebook product
    productSlug = `ebook-mien-phi-${randomUUID()}`
    const productDoc = await payload.create({
      collection: 'products',
      data: {
        name: 'Sổ tay Thực hành Cảm xúc',
        slug: productSlug,
        web: 'site',
        type: 'ebook',
        saleStatus: 'free',
        files: [{ file: privateFileId }],
        shortDescription: 'Cẩm nang hướng dẫn gọi tên và chuyển hóa cảm xúc',
        includes: [{ text: 'File PDF sổ tay 40 trang' }],
        _status: 'published',
      },
      overrideAccess: true,
    })
    productId = productDoc.id
  }, 60000)

  afterAll(async () => {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath)
      } catch {
        // ignore
      }
    }

    if (payload) {
      try {
        for (const id of createdLeads) {
          await payload.delete({ collection: 'leads', id, overrideAccess: true })
        }
        for (const id of createdHits) {
          await payload.delete({ collection: 'rateLimitHits', id, overrideAccess: true })
        }
        for (const id of createdUsers) {
          await payload.delete({ collection: 'users', id, overrideAccess: true })
        }
        if (productId) {
          await payload.delete({ collection: 'products', id: productId, overrideAccess: true })
        }
        if (privateFileId) {
          await payload.delete({
            collection: 'privateFiles',
            id: privateFileId,
            overrideAccess: true,
          })
        }
      } catch {
        // ignore
      } finally {
        await payload.destroy()
      }
    }
  }, 30000)

  describe('Zod Validation for Resource Form', () => {
    it('validates required fields: name, email, slug, and consent', () => {
      const valid = resourceRequestSchema.safeParse({
        name: 'Học viên Test 01',
        email: 'hocvientest01@example.test',
        slug: productSlug,
        consent: true,
      })
      expect(valid.success).toBe(true)

      const missingConsent = resourceRequestSchema.safeParse({
        name: 'Học viên Test 01',
        email: 'hocvientest01@example.test',
        slug: productSlug,
        consent: false,
      })
      expect(missingConsent.success).toBe(false)

      const missingSlug = resourceRequestSchema.safeParse({
        name: 'Học viên Test 01',
        email: 'hocvientest01@example.test',
        slug: '   ',
        consent: true,
      })
      expect(missingSlug.success).toBe(false)
    })
  })

  describe('Resource Request Submission Flow (submitResourceRequest)', () => {
    it('creates lead with need=resource, tag=resource:<slug>, source.form=resource and delivers email with signed download link', async () => {
      const emailSender = new MockEmailSender()
      const email = `test-user-${randomUUID()}@example.test`

      const result = await submitResourceRequest(
        {
          name: 'Đặng Mai Lan',
          email,
          slug: productSlug,
          consent: true,
        },
        {
          ip: '127.0.0.1',
          page: `/tai-nguyen/${productSlug}`,
          utm: 'utm_source=facebook',
        },
        {
          payload,
          emailSender,
        },
      )

      expect(result.success).toBe(true)
      expect(result.id).toBeDefined()
      if (result.id) {
        createdLeads.push(Number(result.id))
      }

      // Verify Lead in DB
      const lead = await payload.findByID({
        collection: 'leads',
        id: result.id!,
        overrideAccess: true,
      })
      expect(lead).toBeDefined()
      expect(lead.name).toBe('Đặng Mai Lan')
      expect(lead.email).toBe(email.toLowerCase())
      expect(lead.need).toBe('resource')
      expect(lead.source?.form).toBe('resource')
      expect(lead.source?.page).toBe(`/tai-nguyen/${productSlug}`)
      expect(lead.source?.utm).toBe('utm_source=facebook')
      expect(lead.consent).toBe(true)
      expect(lead.consentAt).toBeDefined()

      const tagTexts = lead.interestTags?.map((t) => t.text) || []
      expect(tagTexts).toContain(`resource:${productSlug}`)

      // Verify email was sent with valid signed token
      expect(emailSender.sent).toHaveLength(1)
      const sentEmail = emailSender.sent[0]
      expect(sentEmail.to).toBe(email.toLowerCase())
      expect(sentEmail.subject).toContain('Sổ tay Thực hành Cảm xúc')
      expect(sentEmail.html).toContain('/api/download/')

      // Extract token from html and verify it
      const match = sentEmail.html.match(/\/api\/download\/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/)
      expect(match).not.toBeNull()
      if (match) {
        const token = match[1]
        const verified = verifyDownloadToken(token)
        expect(verified.valid).toBe(true)
        if (verified.valid) {
          expect(String(verified.payload.productId)).toBe(String(productId))
          expect(String(verified.payload.fileId)).toBe(String(privateFileId))
        }
      }
    })

    it('honeypot silently succeeds without creating lead in DB and without sending email', async () => {
      const emailSender = new MockEmailSender()
      const botEmail = `bot-${randomUUID()}@spam.test`

      const result = await submitResourceRequest(
        {
          name: 'Spam Bot',
          email: botEmail,
          slug: productSlug,
          consent: true,
          honeypot: 'i-am-a-bot',
        },
        { ip: '1.2.3.4' },
        { payload, emailSender },
      )

      expect(result.success).toBe(true)
      expect(result.fake).toBe(true)
      expect(result.id).toBeUndefined()
      expect(emailSender.sent).toHaveLength(0)

      const leads = await payload.find({
        collection: 'leads',
        where: { email: { equals: botEmail } },
        overrideAccess: true,
      })
      expect(leads.docs).toHaveLength(0)
    })

    it('creates lead successfully even when email provider fails (fault tolerance)', async () => {
      const emailSender = new MockEmailSender()
      emailSender.shouldFail = true
      const email = `fault-tolerance-${randomUUID()}@example.test`

      const result = await submitResourceRequest(
        {
          name: 'Khách hàng thử nghiệm',
          email,
          slug: productSlug,
          consent: true,
        },
        { ip: '127.0.0.1' },
        { payload, emailSender },
      )

      expect(result.success).toBe(true)
      expect(result.id).toBeDefined()
      if (result.id) {
        createdLeads.push(Number(result.id))
      }

      const lead = await payload.findByID({
        collection: 'leads',
        id: result.id!,
        overrideAccess: true,
      })
      expect(lead).toBeDefined()
      expect(lead.email).toBe(email.toLowerCase())
    })
  })

  describe('Access Control for privateFiles Collection', () => {
    it('blocks anonymous unauthenticated visitors from reading privateFiles list or document', async () => {
      // Unauthenticated find must reject / throw access forbidden
      await expect(
        payload.find({
          collection: 'privateFiles',
          overrideAccess: false,
        }),
      ).rejects.toThrow()

      // Unauthenticated findByID must reject / throw
      await expect(
        payload.findByID({
          collection: 'privateFiles',
          id: privateFileId,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })

    it('allows editor and owner admins to read and manage privateFiles', async () => {
      // Editor can read privateFiles
      const editorResult = await payload.find({
        collection: 'privateFiles',
        user: editor,
        overrideAccess: false,
      })
      expect(editorResult.docs.length).toBeGreaterThanOrEqual(1)

      // Owner can read privateFiles
      const ownerResult = await payload.findByID({
        collection: 'privateFiles',
        id: privateFileId,
        user: owner,
        overrideAccess: false,
      })
      expect(ownerResult).toBeDefined()
      expect(ownerResult.id).toBe(privateFileId)
    })
  })
})
