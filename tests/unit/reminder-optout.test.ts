// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { createHmac, randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, Order, Product, Workshop } from '../../src/payload-types'
import { signReminderOptOutToken, verifyReminderOptOutToken } from '../../src/lib/reminders/token'
import {
  optOutWithTokenAction,
  updateReminderPreferenceAction,
} from '../../src/lib/reminders/actions'
import { sendWorkshopReminders } from '../../src/lib/workshops/reminders.server'
import { sendTrackerNudges, vietnamTodayIso } from '../../src/lib/habit/tracker.server'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import { getAuthSecret } from '../../src/lib/auth/token'
import * as sessionServer from '../../src/lib/auth/session.server'
import {
  sendCustomerOtpEmail,
  sendDigitalToolOrderPaidEmail,
} from '../../src/lib/email/service.server'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('Reminder Emails Opt-Out Flow (T2-21)', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []
  let habitProduct: Product

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    // Đảm bảo có sản phẩm HABIT_TRACKER_PRODUCT_SLUG cho các bài kiểm tra tracker
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      habitProduct = existing.docs[0] as Product
    } else {
      habitProduct = track(
        'products',
        await payload.create({
          collection: 'products',
          data: {
            name: '[TEST] Habit Tracker 21 Ngày T2-21',
            slug: HABIT_TRACKER_PRODUCT_SLUG,
            type: 'digital_tool',
            web: 'habit',
            price: 250000,
            salePrice: 178000,
            saleStatus: 'on_sale',
            _status: 'published',
          },
          overrideAccess: true,
        }),
      )
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    // Dọn dẹp dữ liệu test theo thứ tự ngược lại, CHỈ dọn dữ liệu do bài test tạo
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
        // Bỏ qua nếu bản ghi đã được dọn
      }
    }
  })

  async function createCustomer(name: string, optOut = false): Promise<Customer> {
    const id = randomUUID().slice(0, 8)
    return track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          name: `[TEST] ${name}`,
          email: `test-optout-${id}@example.test`,
          reminderEmailsOptOut: optOut,
        },
        overrideAccess: true,
      }),
    )
  }

  async function createPackageProduct(name: string): Promise<Product> {
    const id = randomUUID().slice(0, 8)
    return track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          name: `[TEST] ${name}`,
          slug: `package-test-${id}`,
          web: 'site',
          type: 'package',
          price: 1750000,
          saleStatus: 'on_sale',
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )
  }

  async function createWorkshop(data: {
    title: string
    audienceProducts: number[]
    startsAt: string
    endsAt?: string
  }): Promise<Workshop> {
    return track(
      'workshops',
      await payload.create({
        collection: 'workshops',
        data: {
          title: `[TEST] ${data.title}`,
          audienceProducts: data.audienceProducts,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )
  }

  async function createPaidOrder(customerId: number, productId: number): Promise<Order> {
    return track(
      'orders',
      await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: productId, price: 1750000 }],
          total: 1750000,
          paymentStatus: 'paid',
          paidAt: new Date().toISOString(),
        },
        context: { paymentAction: true },
        overrideAccess: true,
      }),
    )
  }

  describe('1. Token ký HMAC & Xác thực an toàn (timingSafeEqual)', () => {
    it('token đúng -> xác thực thành công và tắt nhắc', async () => {
      const customer = await createCustomer('Khách Token Đúng', false)
      expect(customer.reminderEmailsOptOut).toBe(false)

      const token = signReminderOptOutToken(customer.id)
      expect(token).toBeTruthy()
      expect(token).not.toContain(customer.email) // Không chứa email
      expect(token.startsWith(`${customer.id}.`)).toBe(true)

      const verifiedId = verifyReminderOptOutToken(token)
      expect(verifiedId).toBe(customer.id)

      // Chạy action tắt nhắc
      const res = await optOutWithTokenAction(token)
      expect(res.success).toBe(true)

      // Kiểm tra DB đã cập nhật reminderEmailsOptOut = true
      const updated = await payload.findByID({
        collection: 'customers',
        id: customer.id,
        overrideAccess: true,
      })
      expect(updated.reminderEmailsOptOut).toBe(true)
    })

    it('token sửa 1 ký tự -> từ chối xác thực và không đổi dữ liệu', async () => {
      const customer = await createCustomer('Khách Token Bị Sửa', false)
      const token = signReminderOptOutToken(customer.id)

      // Sửa 1 ký tự cuối của signature
      const tamperedChar = token.slice(-1) === 'a' ? 'b' : 'a'
      const tamperedToken = `${token.slice(0, -1)}${tamperedChar}`

      expect(verifyReminderOptOutToken(tamperedToken)).toBeNull()

      const res = await optOutWithTokenAction(tamperedToken)
      expect(res.success).toBe(false)

      const freshCustomer = await payload.findByID({
        collection: 'customers',
        id: customer.id,
        overrideAccess: true,
      })
      expect(freshCustomer.reminderEmailsOptOut).toBe(false)
    })

    it('token từ miền chữ ký khác -> từ chối xác thực và không đổi dữ liệu', async () => {
      const customer = await createCustomer('Khách Sai Miền Ký', false)
      const secret = getAuthSecret()

      // Ký với tiền tố miền khác
      const otherDomainSig = createHmac('sha256', secret)
        .update(`other-domain:${customer.id}`)
        .digest('base64url')
      const wrongDomainToken = `${customer.id}.${otherDomainSig}`

      expect(verifyReminderOptOutToken(wrongDomainToken)).toBeNull()

      const res = await optOutWithTokenAction(wrongDomainToken)
      expect(res.success).toBe(false)

      const freshCustomer = await payload.findByID({
        collection: 'customers',
        id: customer.id,
        overrideAccess: true,
      })
      expect(freshCustomer.reminderEmailsOptOut).toBe(false)
    })

    it('token không hợp lệ (rỗng, rác, id âm) -> từ chối xác thực an toàn', () => {
      expect(verifyReminderOptOutToken('')).toBeNull()
      expect(verifyReminderOptOutToken(null)).toBeNull()
      expect(verifyReminderOptOutToken(undefined)).toBeNull()
      expect(verifyReminderOptOutToken('abc')).toBeNull()
      expect(verifyReminderOptOutToken('123')).toBeNull()
      expect(verifyReminderOptOutToken('123.sig.extra')).toBeNull()
      expect(verifyReminderOptOutToken('-5.someSignature')).toBeNull()
    })
  })

  describe('2. Tính an toàn của phương thức GET (Safe GET semantics)', () => {
    it('GET và kiểm tra token không làm thay đổi dữ liệu trong CSDL', async () => {
      const customer = await createCustomer('Khách GET An Toàn', false)
      const token = signReminderOptOutToken(customer.id)

      // Giả lập nhiều lượt kiểm tra GET (như link scanner quét email)
      const verifiedId1 = verifyReminderOptOutToken(token)
      const verifiedId2 = verifyReminderOptOutToken(token)
      expect(verifiedId1).toBe(customer.id)
      expect(verifiedId2).toBe(customer.id)

      // CSDL vẫn phải giữ nguyên false
      const freshCustomer = await payload.findByID({
        collection: 'customers',
        id: customer.id,
        overrideAccess: true,
      })
      expect(freshCustomer.reminderEmailsOptOut).toBe(false)
    })
  })

  describe('3. Workshop Reminders: Bỏ qua khách đã tắt nhận nhắc', () => {
    it('sendWorkshopReminders không gửi cho khách tắt nhắc nhưng vẫn gửi cho khách khác', async () => {
      const pkg = await createPackageProduct('Gói Học Workshop T2-21')
      const now = new Date('2026-10-20T10:00:00Z')
      const wsStartsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // sau 24h
      const ws = await createWorkshop({
        title: 'Tập thương cảm xúc 24h T2-21',
        audienceProducts: [pkg.id],
        startsAt: wsStartsAt,
        endsAt: new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString(),
      })

      // Khách A: đã tắt nhận nhắc (reminderEmailsOptOut = true)
      const customerOptOut = await createCustomer('Khách Workshop Đã Tắt Nhắc', true)
      await createPaidOrder(customerOptOut.id, pkg.id)

      // Khách B: vẫn nhận nhắc bình thường (reminderEmailsOptOut = false)
      const customerActive = await createCustomer('Khách Workshop Vẫn Nhận', false)
      await createPaidOrder(customerActive.id, pkg.id)

      const emailSender = new MockEmailSender()

      const result = await sendWorkshopReminders(now, {
        payload,
        emailSender,
      })

      // Kiểm tra kết quả gửi
      expect(result.processedWorkshops).toBe(1)
      expect(result.remindersSent).toBe(1) // Chỉ gửi đúng 1 email cho Khách B
      expect(emailSender.sent).toHaveLength(1)
      expect(emailSender.sent[0].to).toBe(customerActive.email)

      // Email gửi cho Khách B phải chứa link hủy nhắc
      const emailHtml = emailSender.sent[0].html
      expect(emailHtml).toContain('/nhac-lich/huy?t=')

      // Kiểm tra bản ghi workshopReminders được lưu cho CẢ HAI khách hàng để không bị thử lại
      const remindersA = await payload.find({
        collection: 'workshopReminders',
        where: {
          and: [{ workshop: { equals: ws.id } }, { customer: { equals: customerOptOut.id } }],
        },
        overrideAccess: true,
      })
      expect(remindersA.docs).toHaveLength(1)
      track('workshopReminders', remindersA.docs[0])

      const remindersB = await payload.find({
        collection: 'workshopReminders',
        where: {
          and: [{ workshop: { equals: ws.id } }, { customer: { equals: customerActive.id } }],
        },
        overrideAccess: true,
      })
      expect(remindersB.docs).toHaveLength(1)
      track('workshopReminders', remindersB.docs[0])
    })
  })

  describe('4. Habit Tracker Nudge: Bỏ qua khách đã tắt nhận nhắc', () => {
    it('sendTrackerNudges không gửi cho khách tắt nhắc nhưng vẫn gửi cho khách khác', async () => {
      const now = new Date('2026-10-20T08:00:00Z')
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

      // Khách C: Đã tắt nhận nhắc (reminderEmailsOptOut = true)
      const customerOptOut = await createCustomer('Khách Tracker Đã Tắt Nhắc', true)
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerOptOut.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )
      const planOptOut = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerOptOut.id,
            identityStatement: 'Tập thở mỗi sáng (Tắt nhắc)',
            startDate: vietnamTodayIso(threeDaysAgo),
          },
          overrideAccess: true,
        }),
      )
      // Ngày 1 check-in, ngày 2 & 3 lỡ
      track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: { plan: planOptOut.id, day: 1, done: true, emotion: 'peaceful' },
          overrideAccess: true,
        }),
      )

      // Khách D: Vẫn nhận nhắc (reminderEmailsOptOut = false)
      const customerActive = await createCustomer('Khách Tracker Vẫn Nhận', false)
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerActive.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )
      const planActive = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerActive.id,
            identityStatement: 'Tập thở mỗi sáng (Nhận nhắc)',
            startDate: vietnamTodayIso(threeDaysAgo),
          },
          overrideAccess: true,
        }),
      )
      // Ngày 1 check-in, ngày 2 & 3 lỡ
      track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: { plan: planActive.id, day: 1, done: true, emotion: 'joyful' },
          overrideAccess: true,
        }),
      )

      const emailSender = new MockEmailSender()

      await sendTrackerNudges(now, {
        payload,
        emailSender,
      })

      // Khách D nhận được email, Khách C không nhận
      const sentToD = emailSender.sent.filter((item) => item.to === customerActive.email)
      const sentToC = emailSender.sent.filter((item) => item.to === customerOptOut.email)

      expect(sentToD).toHaveLength(1)
      expect(sentToC).toHaveLength(0)

      // Email Khách D có link hủy nhắc
      expect(sentToD[0].html).toContain('/nhac-lich/huy?t=')

      // Cả 2 plan đều có bản ghi trackerNudges để tránh gửi lặp
      const nudgesC = await payload.find({
        collection: 'trackerNudges',
        where: { plan: { equals: planOptOut.id } },
        overrideAccess: true,
      })
      expect(nudgesC.docs).toHaveLength(1)
      track('trackerNudges', nudgesC.docs[0])

      const nudgesD = await payload.find({
        collection: 'trackerNudges',
        where: { plan: { equals: planActive.id } },
        overrideAccess: true,
      })
      expect(nudgesD.docs).toHaveLength(1)
      track('trackerNudges', nudgesD.docs[0])
    })
  })

  describe('5. Email giao dịch quan trọng không bị ảnh hưởng bởi opt-out', () => {
    it('khách đã tắt nhận nhắc vẫn nhận email OTP và email xác nhận thanh toán bình thường', async () => {
      const customer = await createCustomer('Khách Giao Dịch Quan Trọng', true)
      expect(customer.reminderEmailsOptOut).toBe(true)

      const emailSender = new MockEmailSender()

      // 1. Gửi OTP
      await sendCustomerOtpEmail(payload, { email: customer.email, code: '123456' }, emailSender)
      expect(emailSender.sent).toHaveLength(1)
      expect(emailSender.sent[0].to).toBe(customer.email)

      // 2. Gửi email xác nhận thanh toán công cụ số
      await sendDigitalToolOrderPaidEmail(
        payload,
        {
          name: customer.name || '',
          email: customer.email,
          paymentRef: 'TDCX-PAID-001',
          amount: 178000,
          toolName: 'Habit Tracker 21 Ngày',
          toolUrl: 'https://tramdungcamxuc.com/habit/tracker',
        },
        emailSender,
      )
      expect(emailSender.sent).toHaveLength(2)
      expect(emailSender.sent[1].to).toBe(customer.email)
    })
  })

  describe('6. Tùy chọn trong trang /tai-khoan: Bảo mật phiên và không tin dữ liệu client', () => {
    it('updateReminderPreferenceAction chỉ đổi của chính khách, bỏ qua hoàn toàn ID gửi kèm từ client', async () => {
      const customer1 = await createCustomer('Khách Phiên Thật 1', false)
      const customer2 = await createCustomer('Khách Bị Tấn Công 2', false)

      // Giả lập phiên đăng nhập là Customer 1
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer1)

      // Customer 1 gửi yêu cầu tắt nhận nhắc nhưng cố tình gửi kèm ID của Customer 2
      const res = await updateReminderPreferenceAction(false, customer2.id, {
        maliciousId: customer2.id,
      })
      expect(res.success).toBe(true)
      expect(res.optOut).toBe(true)

      // Customer 1 đã đổi thành reminderEmailsOptOut = true
      const fresh1 = await payload.findByID({
        collection: 'customers',
        id: customer1.id,
        overrideAccess: true,
      })
      expect(fresh1.reminderEmailsOptOut).toBe(true)

      // Customer 2 KHÔNG HỀ BỊ THAY ĐỔI
      const fresh2 = await payload.findByID({
        collection: 'customers',
        id: customer2.id,
        overrideAccess: true,
      })
      expect(fresh2.reminderEmailsOptOut).toBe(false)

      // Customer 1 bật lại tùy chọn
      const resOn = await updateReminderPreferenceAction(true)
      expect(resOn.success).toBe(true)
      expect(resOn.optOut).toBe(false)

      const fresh1On = await payload.findByID({
        collection: 'customers',
        id: customer1.id,
        overrideAccess: true,
      })
      expect(fresh1On.reminderEmailsOptOut).toBe(false)
    })

    it('updateReminderPreferenceAction từ chối khi chưa đăng nhập', async () => {
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(null)

      const res = await updateReminderPreferenceAction(false)
      expect(res.success).toBe(false)
    })
  })
})
