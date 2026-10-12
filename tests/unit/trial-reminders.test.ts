// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, Entitlement, Product } from '../../src/payload-types'
import { sendTrialReminders } from '../../src/lib/entitlements/reminders.server'
import { POST as trialRemindersCronRoute } from '../../src/app/(site)/api/cron/trial-reminders/route'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('Trial 21-Day Reminders & Cron (T2-04)', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []
  const testCronSecret = 'test-trial-cron-secret-t2-04'

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    process.env.CRON_SECRET = testCronSecret
    payload = await getPayload({ config: await config })

    // Dọn dẹp bản ghi nhắc cũ nếu có từ lượt chạy trước bị ngắt
    const oldReminders = await payload.find({
      collection: 'trialReminders',
      limit: 100,
      overrideAccess: true,
    })
    for (const r of oldReminders.docs) {
      await payload.delete({ collection: 'trialReminders', id: r.id, overrideAccess: true })
    }
  })

  afterAll(async () => {
    // Dọn dẹp dữ liệu test theo thứ tự ngược lại
    for (let i = created.length - 1; i >= 0; i--) {
      const item = created[i]
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
        })
      } catch (_err) {
        // Bỏ qua nếu đã xóa
      }
    }
  })

  async function createCustomer(name: string): Promise<Customer> {
    return track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `trial-cust-${randomUUID()}@example.test`,
          name,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )
  }

  async function createDigitalToolProduct(name: string): Promise<Product> {
    return track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          name,
          slug: `prod-tool-${randomUUID()}`,
          web: 'habit',
          type: 'digital_tool',
          price: 250000,
          salePrice: 178000,
          trialDays: 21,
          saleStatus: 'on_sale',
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )
  }

  async function createTrialEntitlement(data: {
    customer: number
    product: number
    expiresAt: string
  }): Promise<Entitlement> {
    return track(
      'entitlements',
      await payload.create({
        collection: 'entitlements',
        data: {
          customer: data.customer,
          product: data.product,
          status: 'trial',
          source: 'trial',
          expiresAt: data.expiresAt,
          trialKey: `${data.customer}:${data.product}`,
        },
        overrideAccess: true,
      }),
    )
  }

  describe('1. Nhắc đúng mốc 18 và 21', () => {
    it('nhắc mốc day_18 khi còn 48h (trong khoảng 24h - 72h)', async () => {
      const product = await createDigitalToolProduct('Tool Day 18')
      const customer = await createCustomer('Khách Day 18')
      const now = new Date('2035-01-01T10:00:00Z')
      // expiresAt còn 48 giờ kể từ now
      const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
      await createTrialEntitlement({ customer: customer.id, product: product.id, expiresAt })

      const emailSender = new MockEmailSender()
      const res = await sendTrialReminders(now, { payload, emailSender })

      expect(res.remindersSent).toBe(1)
      expect(emailSender.sent).toHaveLength(1)
      expect(emailSender.sent[0].subject).toContain('Chỉ còn 3 ngày dùng thử')
    })

    it('nhắc mốc day_21 khi còn 12h (trong khoảng 0h - 24h cuối)', async () => {
      const product = await createDigitalToolProduct('Tool Day 21')
      const customer = await createCustomer('Khách Day 21')
      const now = new Date('2035-02-01T10:00:00Z')
      // expiresAt còn 12 giờ kể từ now
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString()
      await createTrialEntitlement({ customer: customer.id, product: product.id, expiresAt })

      const emailSender = new MockEmailSender()
      const res = await sendTrialReminders(now, { payload, emailSender })

      expect(res.remindersSent).toBe(1)
      expect(emailSender.sent).toHaveLength(1)
      expect(emailSender.sent[0].subject).toContain('Ngày dùng thử cuối cùng')
    })
  })

  describe('2. Không nhắc khi khách đã mua (active)', () => {
    it('khách đã có quyền active -> không gửi email nhắc', async () => {
      const product = await createDigitalToolProduct('Tool Đã Mua')
      const customer = await createCustomer('Khách Đã Mua')
      const now = new Date('2035-03-01T10:00:00Z')
      const expiresAt = new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString()
      await createTrialEntitlement({ customer: customer.id, product: product.id, expiresAt })

      // Tạo thêm entitlement active (sở hữu trọn đời)
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: product.id,
            status: 'active',
            source: 'order',
            expiresAt: null,
          },
          overrideAccess: true,
        }),
      )

      const emailSender = new MockEmailSender()
      const res = await sendTrialReminders(now, { payload, emailSender })

      expect(res.remindersSent).toBe(0)
      expect(emailSender.sent).toHaveLength(0)
    })
  })

  describe('3. Chống gửi trùng lặp & Chạy song song (Idempotency)', () => {
    it('chạy 2 lần -> đúng 1 email', async () => {
      const product = await createDigitalToolProduct('Tool Chạy 2 Lần')
      const customer = await createCustomer('Khách Chạy 2 Lần')
      const now = new Date('2035-04-01T10:00:00Z')
      const expiresAt = new Date(now.getTime() + 30 * 60 * 60 * 1000).toISOString()
      await createTrialEntitlement({ customer: customer.id, product: product.id, expiresAt })

      const emailSender = new MockEmailSender()
      const res1 = await sendTrialReminders(now, { payload, emailSender })
      expect(res1.remindersSent).toBe(1)
      expect(emailSender.sent).toHaveLength(1)

      const res2 = await sendTrialReminders(now, { payload, emailSender })
      expect(res2.remindersSent).toBe(0)
      expect(res2.skippedDuplicate).toBe(1)
      expect(emailSender.sent).toHaveLength(1)
    })

    it('song song (Promise.all) -> đúng 1 email', async () => {
      const product = await createDigitalToolProduct('Tool Song Song')
      const customer = await createCustomer('Khách Song Song')
      const now = new Date('2035-05-01T10:00:00Z')
      const expiresAt = new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString()
      await createTrialEntitlement({ customer: customer.id, product: product.id, expiresAt })

      const emailSender = new MockEmailSender()
      const [resA, resB] = await Promise.all([
        sendTrialReminders(now, { payload, emailSender }),
        sendTrialReminders(now, { payload, emailSender }),
      ])

      const totalSent = resA.remindersSent + resB.remindersSent
      const totalSkipped = resA.skippedDuplicate + resB.skippedDuplicate

      expect(totalSent).toBe(1)
      expect(totalSkipped).toBe(1)
      expect(emailSender.sent).toHaveLength(1)
    })
  })

  describe('4. Gửi email lỗi -> lượt sau gửi lại', () => {
    class FailingOnceSender implements EmailSender {
      public sent: SendEmailParams[] = []
      private failed = false
      async send(params: SendEmailParams): Promise<SendEmailResult> {
        if (!this.failed) {
          this.failed = true
          throw new Error('SMTP tạm lỗi')
        }
        this.sent.push(params)
        return { success: true, id: `mock-${randomUUID()}` }
      }
    }

    it('gửi lỗi -> xóa bản ghi nhắc để lượt sau gửi lại', async () => {
      const product = await createDigitalToolProduct('Tool Retry Test')
      const customer = await createCustomer('Khách Retry Test')
      const now = new Date('2035-06-01T10:00:00Z')
      const expiresAt = new Date(now.getTime() + 15 * 60 * 60 * 1000).toISOString()
      await createTrialEntitlement({ customer: customer.id, product: product.id, expiresAt })

      const sender = new FailingOnceSender()

      // Lượt 1: Thất bại khi gửi email
      const first = await sendTrialReminders(now, { payload, emailSender: sender })
      expect(first.errors).toBe(1)
      expect(sender.sent).toHaveLength(0)

      // Lượt 2: Chạy lại 1 giờ sau (vẫn trong khoảng cửa sổ) -> gửi thành công
      const second = await sendTrialReminders(new Date(now.getTime() + 60 * 60 * 1000), {
        payload,
        emailSender: sender,
      })
      expect(second.remindersSent).toBe(1)
      expect(sender.sent).toHaveLength(1)
    })
  })

  describe('5. Route Cron POST /api/cron/trial-reminders (Xác thực)', () => {
    it('route cron: thiếu hoặc sai Authorization header -> 401; đúng header -> 200', async () => {
      // 1. Không có header
      const reqNoAuth = new Request('http://localhost:3000/api/cron/trial-reminders', {
        method: 'POST',
      })
      const resNoAuth = await trialRemindersCronRoute(reqNoAuth)
      expect(resNoAuth.status).toBe(401)

      // 2. Sai Bearer token
      const reqWrongAuth = new Request('http://localhost:3000/api/cron/trial-reminders', {
        method: 'POST',
        headers: {
          authorization: 'Bearer invalid-cron-secret',
        },
      })
      const resWrongAuth = await trialRemindersCronRoute(reqWrongAuth)
      expect(resWrongAuth.status).toBe(401)

      // 3. Đúng Bearer token
      const reqValidAuth = new Request('http://localhost:3000/api/cron/trial-reminders', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${testCronSecret}`,
        },
      })
      const resValidAuth = await trialRemindersCronRoute(reqValidAuth)
      expect(resValidAuth.status).toBe(200)
      const data = (await resValidAuth.json()) as { success: boolean; remindersSent: number }
      expect(data.success).toBe(true)
    })
  })
})
