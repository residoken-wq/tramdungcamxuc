// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, Order, Product, Workshop } from '../../src/payload-types'
import { getEligibleWorkshops } from '../../src/lib/workshops/eligible.server'
import { sendWorkshopReminders } from '../../src/lib/workshops/reminders.server'
import { POST as workshopRemindersCronRoute } from '../../src/app/(site)/api/cron/workshop-reminders/route'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('Workshop Schedule & 24h Reminder (T2-10)', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []
  const testCronSecret = 'test-cron-secret-t2-10'

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    process.env.CRON_SECRET = testCronSecret
    payload = await getPayload({ config })
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
          context: { accountDeletion: true },
        })
      } catch (_err) {
        // Bỏ qua lỗi dọn dẹp nếu bản ghi đã bị xóa
      }
    }
  })

  // Helper tạo khách hàng
  async function createCustomer(name: string): Promise<Customer> {
    return track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `cust-${randomUUID()}@example.test`,
          name,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )
  }

  // Helper tạo sản phẩm gói
  async function createProduct(name: string): Promise<Product> {
    return track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          name,
          slug: `prod-${randomUUID()}`,
          web: 'site',
          type: 'package',
          price: 2900000,
          saleStatus: 'on_sale',
          isSample: true,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )
  }

  // Helper tạo workshop
  async function createWorkshop(data: {
    title: string
    audienceProducts: number[]
    startsAt: string
    endsAt?: string
    joinUrl?: string
    status?: 'published' | 'draft'
  }): Promise<Workshop> {
    return track(
      'workshops',
      await payload.create({
        collection: 'workshops',
        data: {
          title: data.title,
          audienceProducts: data.audienceProducts,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          joinUrl: data.joinUrl,
          _status: data.status || 'published',
        },
        overrideAccess: true,
      }),
    )
  }

  // Helper tạo đơn hàng với trạng thái chỉ định
  async function createOrder(
    customerId: number,
    productId: number,
    paymentStatus: 'paid' | 'pending' | 'failed' | 'cancelled',
  ): Promise<Order> {
    return track(
      'orders',
      await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: productId, price: 2900000 }],
          total: 2900000,
          paymentStatus,
          paidAt: paymentStatus === 'paid' ? new Date().toISOString() : null,
        },
        context: { paymentAction: true },
        overrideAccess: true,
      }),
    )
  }

  describe('1. Quyền tham dự theo trạng thái đơn hàng (getEligibleWorkshops)', () => {
    it('khách có đơn paid gói -> thấy workshop; đơn pending/failed/cancelled -> không thấy', async () => {
      const packageProduct = await createProduct('Gói BUILD T2-10')
      const now = new Date('2026-10-15T08:00:00Z')
      const ws = await createWorkshop({
        title: 'Workshop Tập thương cảm xúc #1',
        audienceProducts: [packageProduct.id],
        startsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2h tới
        endsAt: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        joinUrl: 'https://zoom.us/j/test-audience',
      })

      // Khách A: có đơn paid
      const customerPaid = await createCustomer('Khách Paid')
      await createOrder(customerPaid.id, packageProduct.id, 'paid')

      // Khách B: đơn pending
      const customerPending = await createCustomer('Khách Pending')
      await createOrder(customerPending.id, packageProduct.id, 'pending')

      // Khách C: đơn failed
      const customerFailed = await createCustomer('Khách Failed')
      await createOrder(customerFailed.id, packageProduct.id, 'failed')

      // Khách D: đơn cancelled
      const customerCancelled = await createCustomer('Khách Cancelled')
      await createOrder(customerCancelled.id, packageProduct.id, 'cancelled')

      // Kiểm tra Khách A thấy workshop
      const eligibleA = await getEligibleWorkshops(customerPaid.id, now, payload)
      expect(eligibleA).toHaveLength(1)
      expect(eligibleA[0].id).toBe(ws.id)
      expect(eligibleA[0].title).toBe('Workshop Tập thương cảm xúc #1')

      // Kiểm tra Khách B, C, D không thấy workshop
      const eligibleB = await getEligibleWorkshops(customerPending.id, now, payload)
      expect(eligibleB).toHaveLength(0)

      const eligibleC = await getEligibleWorkshops(customerFailed.id, now, payload)
      expect(eligibleC).toHaveLength(0)

      const eligibleD = await getEligibleWorkshops(customerCancelled.id, now, payload)
      expect(eligibleD).toHaveLength(0)
    })

    it('khách khác (chưa mua hoặc mua sản phẩm khác) -> không thấy và không lấy được joinUrl', async () => {
      const packageProduct = await createProduct('Gói CLEAR T2-10')
      const otherProduct = await createProduct('Sản phẩm khác')
      const now = new Date('2026-10-15T08:00:00Z')

      await createWorkshop({
        title: 'Workshop Chuyên sâu',
        audienceProducts: [packageProduct.id],
        startsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        joinUrl: 'https://zoom.us/j/secret-link',
      })

      // Khách chưa mua gì
      const customerNoOrder = await createCustomer('Khách Chưa Mua')
      const eligibleNoOrder = await getEligibleWorkshops(customerNoOrder.id, now, payload)
      expect(eligibleNoOrder).toHaveLength(0)

      // Khách mua sản phẩm khác
      const customerOther = await createCustomer('Khách Mua Khác')
      await createOrder(customerOther.id, otherProduct.id, 'paid')
      const eligibleOther = await getEligibleWorkshops(customerOther.id, now, payload)
      expect(eligibleOther).toHaveLength(0)
    })
  })

  describe('2. Khung thời gian mở link phòng họp joinUrl (60 phút)', () => {
    it('joinUrl chỉ có trong khoảng 60 phút trước giờ bắt đầu đến hết giờ kết thúc', async () => {
      const packageProduct = await createProduct('Gói SHINE T2-10')
      const customer = await createCustomer('Khách VIP SHINE')
      await createOrder(customer.id, packageProduct.id, 'paid')

      const startTime = new Date('2026-10-20T10:00:00Z')
      const endTime = new Date('2026-10-20T12:00:00Z')
      const secretJoinUrl = 'https://meet.google.com/abc-defg-hij'

      const ws = await createWorkshop({
        title: 'Workshop Mở Link 60 Phút',
        audienceProducts: [packageProduct.id],
        startsAt: startTime.toISOString(),
        endsAt: endTime.toISOString(),
        joinUrl: secretJoinUrl,
      })

      // 1. Cách 61 phút trước giờ bắt đầu (08:59) -> chưa mở, joinUrl là null
      const time61mBefore = new Date('2026-10-20T08:59:00Z')
      const res61m = await getEligibleWorkshops(customer.id, time61mBefore, payload)
      expect(res61m).toHaveLength(1)
      expect(res61m[0].id).toBe(ws.id)
      expect(res61m[0].canJoinNow).toBe(false)
      expect(res61m[0].joinUrl).toBeNull()
      expect(res61m[0].status).toBe('upcoming')

      // 2. Đúng 60 phút trước giờ bắt đầu (09:00) -> đã mở, có joinUrl
      const time60mBefore = new Date('2026-10-20T09:00:00Z')
      const res60m = await getEligibleWorkshops(customer.id, time60mBefore, payload)
      expect(res60m).toHaveLength(1)
      expect(res60m[0].canJoinNow).toBe(true)
      expect(res60m[0].joinUrl).toBe(secretJoinUrl)
      expect(res60m[0].status).toBe('open')

      // 3. Đang trong giờ học (11:00) -> đã mở, có joinUrl
      const timeDuring = new Date('2026-10-20T11:00:00Z')
      const resDuring = await getEligibleWorkshops(customer.id, timeDuring, payload)
      expect(resDuring).toHaveLength(1)
      expect(resDuring[0].canJoinNow).toBe(true)
      expect(resDuring[0].joinUrl).toBe(secretJoinUrl)
      expect(resDuring[0].status).toBe('open')

      // 4. Đúng giờ kết thúc (12:00) -> vẫn có joinUrl
      const timeAtEnd = new Date('2026-10-20T12:00:00Z')
      const resAtEnd = await getEligibleWorkshops(customer.id, timeAtEnd, payload)
      expect(resAtEnd).toHaveLength(1)
      expect(resAtEnd[0].canJoinNow).toBe(true)
      expect(resAtEnd[0].joinUrl).toBe(secretJoinUrl)

      // 5. Sau khi kết thúc (12:01) -> workshop kết thúc, không còn trong danh sách active
      const timeAfterEnd = new Date('2026-10-20T12:01:00Z')
      const resAfterEnd = await getEligibleWorkshops(customer.id, timeAfterEnd, payload)
      expect(resAfterEnd).toHaveLength(0)
    })
  })

  describe('3. Cron nhắc nhở trước 24 giờ (sendWorkshopReminders)', () => {
    it('chỉ gửi nhắc cho workshop có startsAt trong khoảng (now+23h, now+25h]', async () => {
      const pkg = await createProduct('Gói Đồng Hành Cron Test')
      const customer = await createCustomer('Khách Nhắc 24h')
      await createOrder(customer.id, pkg.id, 'paid')

      const now = new Date('2026-10-25T10:00:00Z')
      const emailSender = new MockEmailSender()

      // W1: Trong khoảng 23-25h (startsAt = now + 24h)
      await createWorkshop({
        title: 'Workshop Trong Khoảng 24h',
        audienceProducts: [pkg.id],
        startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        joinUrl: 'https://zoom.us/w1',
      })

      // W2: Trước khoảng (startsAt = now + 22h, tức nhỏ hơn 23h)
      await createWorkshop({
        title: 'Workshop Ngoài Khoảng 22h',
        audienceProducts: [pkg.id],
        startsAt: new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString(),
        joinUrl: 'https://zoom.us/w2',
      })

      // W3: Sau khoảng (startsAt = now + 26h, tức lớn hơn 25h)
      await createWorkshop({
        title: 'Workshop Ngoài Khoảng 26h',
        audienceProducts: [pkg.id],
        startsAt: new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString(),
        joinUrl: 'https://zoom.us/w3',
      })

      const res = await sendWorkshopReminders(now, { payload, emailSender })
      expect(res.remindersSent).toBe(1)
      expect(emailSender.sent).toHaveLength(1)
      expect(emailSender.sent[0].to).toBe(customer.email)
      expect(emailSender.sent[0].subject).toContain('Workshop Trong Khoảng 24h')
      // Đảm bảo tuyệt đối KHÔNG đưa joinUrl vào nội dung email
      expect(emailSender.sent[0].html).not.toContain('https://zoom.us/w1')
    })

    it('chạy 2 lần -> khách nhận đúng 1 email (lũy đẳng theo workshop:customer)', async () => {
      const pkg = await createProduct('Gói Idempotency Lần 2')
      const customer = await createCustomer('Khách Lũy Đẳng')
      await createOrder(customer.id, pkg.id, 'paid')

      const now = new Date('2026-10-27T10:00:00Z')
      const emailSender = new MockEmailSender()

      await createWorkshop({
        title: 'Workshop Kiểm Tra Chạy Lại',
        audienceProducts: [pkg.id],
        startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      })

      // Lần 1: gửi thành công
      const res1 = await sendWorkshopReminders(now, { payload, emailSender })
      expect(res1.remindersSent).toBe(1)
      expect(res1.skippedDuplicate).toBe(0)
      expect(emailSender.sent).toHaveLength(1)

      // Lần 2: chạy lại trên cùng workshop và khách -> phát hiện trùng khóa, bỏ qua
      const res2 = await sendWorkshopReminders(now, { payload, emailSender })
      expect(res2.remindersSent).toBe(0)
      expect(res2.skippedDuplicate).toBe(1)
      expect(emailSender.sent).toHaveLength(1) // Vẫn chỉ có đúng 1 email được gửi
    })

    it('chạy 2 lần song song (Promise.all) -> khách nhận đúng 1 email duy nhất', async () => {
      const pkg = await createProduct('Gói Concurrency Test')
      const customer = await createCustomer('Khách Song Song')
      await createOrder(customer.id, pkg.id, 'paid')

      const now = new Date('2026-10-28T10:00:00Z')
      const emailSender = new MockEmailSender()

      await createWorkshop({
        title: 'Workshop Kiểm Tra Song Song',
        audienceProducts: [pkg.id],
        startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      })

      // Gọi đồng thời 2 lần bằng Promise.all
      const [resA, resB] = await Promise.all([
        sendWorkshopReminders(now, { payload, emailSender }),
        sendWorkshopReminders(now, { payload, emailSender }),
      ])

      const totalSent = resA.remindersSent + resB.remindersSent
      const totalSkipped = resA.skippedDuplicate + resB.skippedDuplicate

      expect(totalSent).toBe(1)
      expect(totalSkipped).toBe(1)
      expect(emailSender.sent).toHaveLength(1) // Đảm bảo đúng 1 email gửi đi
    })
  })

  describe('5. Sau QA (T2-10c)', () => {
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

    it('gửi lỗi -> lượt sau gửi lại (không mất email nhắc)', async () => {
      const pkg = await createProduct('Gói Gửi Lại')
      const customer = await createCustomer('Khách Gửi Lại')
      await createOrder(customer.id, pkg.id, 'paid')
      const now = new Date('2026-11-03T10:00:00Z')
      await createWorkshop({
        title: 'Workshop Gửi Lại',
        audienceProducts: [pkg.id],
        startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      })
      const sender = new FailingOnceSender()

      const first = await sendWorkshopReminders(now, { payload, emailSender: sender })
      expect(first.errors).toBe(1)
      expect(sender.sent).toHaveLength(0)

      // Next run 30 minutes later: workshop still inside the (23h, 25h] window.
      const second = await sendWorkshopReminders(new Date(now.getTime() + 30 * 60 * 1000), {
        payload,
        emailSender: sender,
      })
      expect(second.remindersSent).toBe(1)
      expect(sender.sent).toHaveLength(1)
    })

    it('email dẫn về /tai-khoan của đúng site đang chạy (getSiteUrl)', async () => {
      const pkg = await createProduct('Gói Link Email')
      const customer = await createCustomer('Khách Link Email')
      await createOrder(customer.id, pkg.id, 'paid')
      const now = new Date('2026-11-04T10:00:00Z')
      await createWorkshop({
        title: 'Workshop Link Email',
        audienceProducts: [pkg.id],
        startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      })
      const sender = new MockEmailSender()
      const previous = process.env.SITE_URL
      process.env.SITE_URL = 'http://demo.example.test:3400'
      try {
        await sendWorkshopReminders(now, { payload, emailSender: sender })
      } finally {
        if (previous === undefined) delete process.env.SITE_URL
        else process.env.SITE_URL = previous
      }
      expect(sender.sent).toHaveLength(1)
      expect(sender.sent[0].html).toContain('http://demo.example.test:3400/tai-khoan')
    })

    it('xóa workshop hoặc khách đã được nhắc -> xóa được, không lỗi DB', async () => {
      const pkg = await createProduct('Gói Xóa')
      const customer = await createCustomer('Khách Xóa')
      const order = await createOrder(customer.id, pkg.id, 'paid')
      const now = new Date('2026-11-05T10:00:00Z')
      const ws = await createWorkshop({
        title: 'Workshop Xóa',
        audienceProducts: [pkg.id],
        startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      })
      const sender = new MockEmailSender()
      await sendWorkshopReminders(now, { payload, emailSender: sender })
      expect(sender.sent).toHaveLength(1)

      await expect(
        payload.delete({ collection: 'workshops', id: ws.id, overrideAccess: true }),
      ).resolves.toBeTruthy()
      // Orders keep a required customer (outside T2-10); remove it so only the reminder FK is tested.
      await payload.delete({ collection: 'orders', id: order.id, overrideAccess: true })
      await expect(
        payload.delete({
          collection: 'customers',
          id: customer.id,
          overrideAccess: true,
          context: { accountDeletion: true },
        }),
      ).resolves.toBeTruthy()
    })
  })

  describe('4. Route Cron POST /api/cron/workshop-reminders (Xác thực)', () => {
    it('route cron: thiếu hoặc sai Authorization header -> 401; đúng header -> 200', async () => {
      // 1. Không có header
      const reqNoAuth = new Request('http://localhost:3000/api/cron/workshop-reminders', {
        method: 'POST',
      })
      const resNoAuth = await workshopRemindersCronRoute(reqNoAuth)
      expect(resNoAuth.status).toBe(401)

      // 2. Sai Bearer token
      const reqWrongAuth = new Request('http://localhost:3000/api/cron/workshop-reminders', {
        method: 'POST',
        headers: {
          authorization: 'Bearer invalid-cron-secret',
        },
      })
      const resWrongAuth = await workshopRemindersCronRoute(reqWrongAuth)
      expect(resWrongAuth.status).toBe(401)

      // 3. Đúng Bearer token
      const reqValidAuth = new Request('http://localhost:3000/api/cron/workshop-reminders', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${testCronSecret}`,
        },
      })
      const resValidAuth = await workshopRemindersCronRoute(reqValidAuth)
      expect(resValidAuth.status).toBe(200)
      const data = (await resValidAuth.json()) as { success: boolean; remindersSent: number }
      expect(data.success).toBe(true)
    })
  })
})
