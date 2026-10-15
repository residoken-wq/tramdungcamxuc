// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { SiteSetting } from '../../src/payload-types'
import { extractPaymentRef } from '../../src/lib/payments/payment-ref'
import { getPaymentProvider, ManualPaymentProvider } from '../../src/lib/payments/provider'
import { SepayPaymentProvider } from '../../src/lib/payments/sepay'
import * as ordersServer from '../../src/lib/payments/orders.server'
import {
  confirmManualPayment,
  createDigitalToolOrder,
  InvalidOrderStatusError,
} from '../../src/lib/payments/orders.server'
import { getAccess } from '../../src/lib/entitlements'
import { POST as sepayWebhookRoute } from '../../src/app/(site)/api/payments/sepay/webhook/route'
import { GET as orderStatusRoute } from '../../src/app/(site)/api/payments/status/[token]/route'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

const advanceClockPastResume = () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(Date.now() + 2 * 60 * 1000))
}

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('SePay Automated Payment & VietQR Integration (T2-09 & T2-09b)', () => {
  let payload: Payload
  let testStartedAt = ''
  let ownerUser: { id: number; role: string; email: string }
  let digitalToolProductId: number
  let digitalToolSlug: string
  let settingsBefore: SiteSetting | null = null

  const TEST_SEPAY_API_KEY = 'sepay_test_api_key_secret_123456789'

  const createdEntitlements: number[] = []
  const createdOrders: number[] = []
  const createdPaymentEvents: number[] = []
  const createdAuditLogs: number[] = []
  const createdCustomers: number[] = []
  const createdProducts: number[] = []
  const createdUsers: number[] = []

  let ipCounter = 100
  const nextIp = () => `192.168.99.${ipCounter++}`

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    testStartedAt = new Date().toISOString()

    settingsBefore = await payload.findGlobal({
      slug: 'siteSettings',
      overrideAccess: true,
    })

    await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        bankBin: '970422',
        bankName: 'Ngân hàng Quân Đội (MB)',
        accountNumber: '9999999999',
        accountName: 'CONG TY TNHH TRAM DUNG CAM XUC',
        transferPrefix: 'TDCX',
      },
      overrideAccess: true,
    })

    const adminDoc = await payload.create({
      collection: 'users',
      data: {
        email: `sepay-owner-${randomUUID()}@example.test`,
        password: `TestP@ss!${randomUUID()}`,
        role: 'owner',
      },
      overrideAccess: true,
    })
    createdUsers.push(adminDoc.id)
    ownerUser = { id: adminDoc.id, role: 'owner', email: adminDoc.email }

    digitalToolSlug = `habit-tool-${randomUUID().slice(0, 8)}`
    const prodDoc = await payload.create({
      collection: 'products',
      data: {
        name: 'Bộ công cụ Habit Tracker số',
        slug: digitalToolSlug,
        web: 'habit',
        type: 'digital_tool',
        saleStatus: 'on_sale',
        price: 250000,
        salePrice: 178000,
        accessDurationDays: 0,
        _status: 'published',
      },
      overrideAccess: true,
    })
    createdProducts.push(prodDoc.id)
    digitalToolProductId = prodDoc.id
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    // Dọn dẹp triệt để theo thứ tự khóa ngoại con trước cha
    for (const customerId of createdCustomers) {
      try {
        const entDocs = await payload.find({
          collection: 'entitlements',
          where: { customer: { equals: customerId } },
          overrideAccess: true,
          limit: 100,
        })
        for (const doc of entDocs.docs) {
          await payload.delete({ collection: 'entitlements', id: doc.id, overrideAccess: true })
        }
      } catch (e) {
        console.error('[cleanup] Failed to delete entitlements for customer', customerId, e)
      }
    }

    for (const id of createdEntitlements) {
      await payload
        .delete({ collection: 'entitlements', id, overrideAccess: true })
        .catch((e) => console.error('[cleanup] entitlement:', e))
    }

    for (const id of createdPaymentEvents) {
      await payload
        .delete({ collection: 'paymentEvents', id, overrideAccess: true })
        .catch((e) => console.error('[cleanup] paymentEvent:', e))
    }

    // Event không gắn đơn (401 / invalid_payload / no_match / ignored) do test tạo trong lúc chạy
    await payload
      .delete({
        collection: 'paymentEvents',
        where: {
          and: [
            { provider: { equals: 'sepay' } },
            { order: { exists: false } },
            { createdAt: { greater_than_equal: testStartedAt } },
          ],
        },
        overrideAccess: true,
      })
      .catch((e) => console.error('[cleanup] orphan paymentEvents:', e))

    for (const orderId of createdOrders) {
      try {
        const pEvents = await payload.find({
          collection: 'paymentEvents',
          where: { order: { equals: orderId } },
          overrideAccess: true,
          limit: 100,
        })
        for (const pe of pEvents.docs) {
          await payload.delete({ collection: 'paymentEvents', id: pe.id, overrideAccess: true })
        }
      } catch (e) {
        console.error('[cleanup] Failed to delete paymentEvents for order', orderId, e)
      }

      try {
        const logs = await payload.find({
          collection: 'auditLogs',
          where: { target: { equals: `orders:${orderId}` } },
          overrideAccess: true,
          limit: 100,
        })
        for (const log of logs.docs) {
          await payload.delete({ collection: 'auditLogs', id: log.id, overrideAccess: true })
        }
      } catch (e) {
        console.error('[cleanup] Failed to delete auditLogs for order', orderId, e)
      }
    }

    for (const id of createdAuditLogs) {
      await payload
        .delete({ collection: 'auditLogs', id, overrideAccess: true })
        .catch((e) => console.error('[cleanup] auditLog:', e))
    }

    // Lượt rate limit do test tạo (key là hash theo IP / email ngẫu nhiên) → xóa theo thời gian chạy
    await payload
      .delete({
        collection: 'rateLimitHits',
        where: { createdAt: { greater_than_equal: testStartedAt } },
        overrideAccess: true,
      })
      .catch((e) => console.error('[cleanup] rateLimitHits:', e))

    for (const id of createdOrders) {
      await payload
        .delete({ collection: 'orders', id, overrideAccess: true })
        .catch((e) => console.error('[cleanup] order:', e))
    }

    for (const id of createdCustomers) {
      await payload
        .delete({
          collection: 'customers',
          id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
        .catch((e) => console.error('[cleanup] customer:', e))
    }

    for (const id of createdProducts) {
      await payload
        .delete({ collection: 'products', id, overrideAccess: true })
        .catch((e) => console.error('[cleanup] product:', e))
    }

    for (const id of createdUsers) {
      await payload
        .delete({ collection: 'users', id, overrideAccess: true })
        .catch((e) => console.error('[cleanup] user:', e))
    }

    if (settingsBefore) {
      await payload
        .updateGlobal({
          slug: 'siteSettings',
          data: {
            bankBin: settingsBefore.bankBin,
            bankName: settingsBefore.bankName,
            accountNumber: settingsBefore.accountNumber,
            accountName: settingsBefore.accountName,
            transferPrefix: settingsBefore.transferPrefix,
          },
          overrideAccess: true,
        })
        .catch((e) => console.error('[cleanup] siteSettings:', e))
    }
  })

  describe('1. Trích xuất mã paymentRef (extractPaymentRef)', () => {
    it('khớp chính xác các dạng chuỗi ngân hàng hợp lệ', () => {
      expect(extractPaymentRef('TDCX8F3K2 chuyen tien')).toBe('TDCX8F3K2')
      expect(extractPaymentRef('ck tdcx8f3k2')).toBe('TDCX8F3K2')
      expect(extractPaymentRef('MBVCB.123.TDCX8F3K2.CT')).toBe('TDCX8F3K2')
      expect(extractPaymentRef('TDCX 8F3K2 chuyen khoan')).toBe('TDCX8F3K2')
    })

    it('không có mã -> trả về null', () => {
      expect(extractPaymentRef('Nguyen Van A chuyen tien mua hang')).toBeNull()
      expect(extractPaymentRef('')).toBeNull()
      expect(extractPaymentRef(null)).toBeNull()
      expect(extractPaymentRef(undefined)).toBeNull()
    })

    it('xuất hiện 2 mã khác nhau -> trả về null để tránh nhầm đơn', () => {
      expect(extractPaymentRef('TDCX8F3K2 va TDCX9A2B3 chuyen tien')).toBeNull()
    })

    it('cùng 1 mã xuất hiện nhiều lần -> vẫn khớp thành công', () => {
      expect(extractPaymentRef('TDCX8F3K2 TDCX8F3K2')).toBe('TDCX8F3K2')
      expect(extractPaymentRef('ck TDCX8F3K2 / tdcx8f3k2')).toBe('TDCX8F3K2')
    })
  })

  describe('2. Provider Authentication & Registry (getPaymentProvider / SepayPaymentProvider)', () => {
    it('getPaymentProvider trả về đúng provider theo cấu hình', () => {
      const manual = getPaymentProvider('manual')
      expect(manual).toBeInstanceOf(ManualPaymentProvider)
      expect(manual.name).toBe('manual')

      const sepay = getPaymentProvider('sepay')
      expect(sepay).toBeInstanceOf(SepayPaymentProvider)
      expect(sepay.name).toBe('sepay')

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.stubEnv('PAYMENT_PROVIDER', 'unknown_env_provider')
      const fallback = getPaymentProvider()
      expect(fallback).toBeInstanceOf(ManualPaymentProvider)
      expect(warnSpy).toHaveBeenCalled()

      expect(() => getPaymentProvider('unsupported_gateway')).toThrow(
        /chưa được hỗ trợ trong hệ thống/,
      )
    })

    it('verifyWebhook kiểm tra API key bằng timingSafeEqual', async () => {
      const provider = new SepayPaymentProvider()
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      // Thiếu header
      expect(await provider.verifyWebhook(new Request('http://localhost'))).toBe(false)

      // Sai khóa
      expect(
        await provider.verifyWebhook(
          new Request('http://localhost', {
            headers: { Authorization: 'Apikey wrong_key' },
          }),
        ),
      ).toBe(false)

      // Đúng khóa dạng Apikey
      expect(
        await provider.verifyWebhook(
          new Request('http://localhost', {
            headers: { Authorization: `Apikey ${TEST_SEPAY_API_KEY}` },
          }),
        ),
      ).toBe(true)

      // Đúng khóa dạng Bearer
      expect(
        await provider.verifyWebhook(
          new Request('http://localhost', {
            headers: { Authorization: `Bearer ${TEST_SEPAY_API_KEY}` },
          }),
        ),
      ).toBe(true)

      // Đúng khóa chuỗi trần
      expect(
        await provider.verifyWebhook(
          new Request('http://localhost', {
            headers: { Authorization: TEST_SEPAY_API_KEY },
          }),
        ),
      ).toBe(true)
    })

    it('verifyWebhook trả về false khi thiếu SEPAY_WEBHOOK_API_KEY và không in khóa', async () => {
      const provider = new SepayPaymentProvider()
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', '')

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await provider.verifyWebhook(
        new Request('http://localhost', {
          headers: { Authorization: 'Apikey some_key' },
        }),
      )
      expect(result).toBe(false)
      expect(errorSpy).toHaveBeenCalled()
      // Đảm bảo không in khóa ra console
      for (const call of errorSpy.mock.calls) {
        expect(call.join(' ')).not.toContain('some_key')
      }
    })
  })

  describe('3. Route POST /api/payments/sepay/webhook', () => {
    it('PAYMENT_PROVIDER=manual -> 404', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'manual')
      const req = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
      })
      const res = await sepayWebhookRoute(req)
      expect(res.status).toBe(404)
    })

    it('Thiếu header Authorization -> 401', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const req = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '123' }),
      })

      const res = await sepayWebhookRoute(req)
      expect(res.status).toBe(401)
    })

    it('Thiếu SEPAY_WEBHOOK_API_KEY trên server -> 401', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', '')

      const req = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Apikey some_key',
        },
        body: JSON.stringify({ id: '123' }),
      })

      const res = await sepayWebhookRoute(req)
      expect(res.status).toBe(401)
    })

    it('A1: Khóa sai không giữ chỗ transactionId -> sau đó gửi khóa đúng với cùng ID vẫn thành công', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-a1-${randomUUID()}@example.test`, name: 'Khach A1' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      const sharedTxId = String(Date.now() + 1111)

      // 1. Kẻ xấu gọi khóa sai với sharedTxId
      const badReq = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Apikey invalid_attacker_key',
        },
        body: JSON.stringify({
          id: sharedTxId,
          transferAmount: 178000,
          content: `ck ${order.paymentRef}`,
          transferType: 'in',
        }),
      })

      const badRes = await sepayWebhookRoute(badReq)
      expect(badRes.status).toBe(401)

      // Kiểm tra event 401: transactionId PHẢI để rỗng (không giữ chỗ)
      const invalidEvents = await payload.find({
        collection: 'paymentEvents',
        where: { result: { equals: 'invalid_signature' } },
        sort: '-receivedAt',
        limit: 1,
        overrideAccess: true,
      })
      expect(invalidEvents.totalDocs).toBeGreaterThan(0)
      const invEv = invalidEvents.docs[0]
      createdPaymentEvents.push(invEv.id)
      expect(invEv.signatureValid).toBe(false)
      expect(invEv.transactionId).toBeNull()

      // 2. Webhook thật từ SePay đến với đúng sharedTxId
      const emailSender = new MockEmailSender()
      const goodReq = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
        },
        body: JSON.stringify({
          id: sharedTxId,
          transferAmount: 178000,
          content: `ck ${order.paymentRef}`,
          transferType: 'in',
        }),
      })

      const goodRes = await sepayWebhookRoute(goodReq, { emailSender })
      expect(goodRes.status).toBe(200)
      const goodJson = await goodRes.json()
      expect(goodJson.success).toBe(true)
      expect(goodJson.result).toBe('paid')

      // Đơn hàng đổi sang paid và khách có quyền
      const refreshedOrder = await payload.findByID({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
      })
      expect(refreshedOrder.paymentStatus).toBe('paid')
      expect(emailSender.sent).toHaveLength(1)

      const access = await getAccess(customer.id, digitalToolProductId, { payload })
      expect(access.hasAccess).toBe(true)
    })

    it('Kích thước body > 16 KB -> 413 Payload Too Large', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const largeContent = 'A'.repeat(20 * 1024)
      const req = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
        },
        body: JSON.stringify({ id: '123', content: largeContent }),
      })

      const res = await sepayWebhookRoute(req)
      expect(res.status).toBe(413)
    })

    it('JSON body lỗi -> ghi event invalid_payload và trả 400', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const req = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
        },
        body: 'invalid-json-{broken',
      })

      const res = await sepayWebhookRoute(req)
      expect(res.status).toBe(400)
    })

    it('Tiền ra (transferType: out) -> 200 result: ignored, không đổi đơn', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const txId = String(Date.now() + 100)
      const req = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
        },
        body: JSON.stringify({
          id: txId,
          gateway: 'MBBank',
          transferAmount: 500000,
          content: 'Rut tien mat',
          transferType: 'out',
        }),
      })

      const res = await sepayWebhookRoute(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.result).toBe('ignored')
    })

    it('Không có mã hoặc mã không có đơn -> 200 result: no_match, không đổi đơn', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const txId = String(Date.now() + 200)
      const req = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
        },
        body: JSON.stringify({
          id: txId,
          gateway: 'MBBank',
          transferAmount: 178000,
          content: 'Khach khong ghi ma thanh toan',
          transferType: 'in',
        }),
      })

      const res = await sepayWebhookRoute(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.result).toBe('no_match')
    })

    it('Lệch số tiền (thiếu 1đ hoặc thừa 1đ) -> 200 result: amount_mismatch, đơn vẫn pending', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-mismatch-${randomUUID()}@example.test`, name: 'Khach Mismatch' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      // Gửi thiếu 1đ: 177.999đ
      const txIdMismatch = String(Date.now() + 300)
      const reqMismatch = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
        },
        body: JSON.stringify({
          id: txIdMismatch,
          gateway: 'MBBank',
          transferAmount: 177999,
          content: `chuyen tien ${order.paymentRef}`,
          transferType: 'in',
        }),
      })

      const resMismatch = await sepayWebhookRoute(reqMismatch)
      expect(resMismatch.status).toBe(200)
      const jsonMismatch = await resMismatch.json()
      expect(jsonMismatch.success).toBe(true)
      expect(jsonMismatch.result).toBe('amount_mismatch')

      const refreshed = await payload.findByID({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
      })
      expect(refreshed.paymentStatus).toBe('pending')
    })

    it('Đúng số tiền -> 200 result: paid, gửi đúng 1 email, cấp quyền', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-paid-${randomUUID()}@example.test`, name: 'Khach Paid' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      const emailSender = new MockEmailSender()
      const txId = String(Date.now() + 400)
      const req = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
        },
        body: JSON.stringify({
          id: txId,
          gateway: 'Vietcombank',
          transferAmount: 178000,
          content: `CK ${order.paymentRef} MUA TOOL`,
          transferType: 'in',
        }),
      })

      const res = await sepayWebhookRoute(req, { emailSender })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.result).toBe('paid')
      expect(emailSender.sent).toHaveLength(1)

      const refreshedOrder = await payload.findByID({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
      })
      expect(refreshedOrder.paymentStatus).toBe('paid')
      expect(refreshedOrder.deliveryStatus).toBe('access_granted')

      const access = await getAccess(customer.id, digitalToolProductId, { payload })
      expect(access.hasAccess).toBe(true)
      expect(access.status).toBe('active')

      // Gửi lại cùng transactionId -> duplicate và KHÔNG gửi thêm email
      const dupReq = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
        },
        body: JSON.stringify({
          id: txId,
          transferAmount: 178000,
          content: `CK ${order.paymentRef} MUA TOOL`,
          transferType: 'in',
        }),
      })
      const dupRes = await sepayWebhookRoute(dupReq, { emailSender })
      expect(dupRes.status).toBe(200)
      const dupJson = await dupRes.json()
      expect(dupJson.result).toBe('duplicate')
      expect(emailSender.sent).toHaveLength(1)
    })

    it('Idempotency: Cùng transactionId gửi 2 lần song song -> 1 event paid, đúng 1 email, đúng 1 entitlement', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-parallel-${randomUUID()}@example.test`, name: 'Khach Parallel' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      const emailSender = new MockEmailSender()
      const txIdParallel = String(Date.now() + 500)
      const makeReq = () =>
        new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
          },
          body: JSON.stringify({
            id: txIdParallel,
            gateway: 'BIDV',
            transferAmount: 178000,
            content: `CT ${order.paymentRef}`,
            transferType: 'in',
          }),
        })

      const [res1, res2] = await Promise.all([
        sepayWebhookRoute(makeReq(), { emailSender }),
        sepayWebhookRoute(makeReq(), { emailSender }),
      ])

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)

      const json1 = await res1.json()
      const json2 = await res2.json()

      // Lần 2 có thể gặp event còn 'processing' và xử lý lại (markOrderPaid không cấp lần 2)
      const results = [json1.result, json2.result]
      expect(results).toContain('paid')
      for (const r of results) expect(['paid', 'duplicate']).toContain(r)
      expect(emailSender.sent).toHaveLength(1)

      const events = await payload.find({
        collection: 'paymentEvents',
        where: { transactionId: { equals: txIdParallel } },
        overrideAccess: true,
      })
      expect(events.totalDocs).toBe(1)
      expect(events.docs[0].result).toBe('paid')

      const ents = await payload.find({
        collection: 'entitlements',
        where: { customer: { equals: customer.id } },
        overrideAccess: true,
      })
      expect(ents.totalDocs).toBe(1)
    })

    it('2 giao dịch khác nhau cho cùng 1 đơn -> lần 2 là already_paid, đúng 1 entitlement', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-doubletx-${randomUUID()}@example.test`, name: 'Khach Double Tx' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      const txId1 = String(Date.now() + 601)
      const txId2 = String(Date.now() + 602)

      const res1 = await sepayWebhookRoute(
        new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
          },
          body: JSON.stringify({
            id: txId1,
            transferAmount: 178000,
            content: `${order.paymentRef} lan 1`,
            transferType: 'in',
          }),
        }),
      )
      const json1 = await res1.json()
      expect(json1.result).toBe('paid')

      const res2 = await sepayWebhookRoute(
        new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
          },
          body: JSON.stringify({
            id: txId2,
            transferAmount: 178000,
            content: `${order.paymentRef} lan 2`,
            transferType: 'in',
          }),
        }),
      )
      const json2 = await res2.json()
      expect(json2.result).toBe('already_paid')

      const ents = await payload.find({
        collection: 'entitlements',
        where: { customer: { equals: customer.id } },
        overrideAccess: true,
      })
      expect(ents.totalDocs).toBe(1)
    })

    it('C6: 2 giao dịch khác nhau cho cùng 1 đơn đến song song -> lần thua race là already_paid', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: {
          email: `cust-parallel-2tx-${randomUUID()}@example.test`,
          name: 'Khach Parallel 2Tx',
        },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      const txIdA = String(Date.now() + 610)
      const txIdB = String(Date.now() + 611)

      const [resA, resB] = await Promise.all([
        sepayWebhookRoute(
          new Request('http://localhost/api/payments/sepay/webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
            },
            body: JSON.stringify({
              id: txIdA,
              transferAmount: 178000,
              content: `CK ${order.paymentRef} A`,
              transferType: 'in',
            }),
          }),
        ),
        sepayWebhookRoute(
          new Request('http://localhost/api/payments/sepay/webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
            },
            body: JSON.stringify({
              id: txIdB,
              transferAmount: 178000,
              content: `CK ${order.paymentRef} B`,
              transferType: 'in',
            }),
          }),
        ),
      ])

      expect(resA.status).toBe(200)
      expect(resB.status).toBe(200)

      const jsonA = await resA.json()
      const jsonB = await resB.json()

      const results = [jsonA.result, jsonB.result]
      expect(results).toContain('paid')
      expect(results).toContain('already_paid')

      const ents = await payload.find({
        collection: 'entitlements',
        where: { customer: { equals: customer.id } },
        overrideAccess: true,
      })
      expect(ents.totalDocs).toBe(1)
    })

    it('Đơn cancelled -> không đổi đơn, result: order_cancelled', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-cancel-${randomUUID()}@example.test`, name: 'Khach Cancel' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { paymentStatus: 'cancelled' },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      const txIdCancel = String(Date.now() + 700)
      const res = await sepayWebhookRoute(
        new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
          },
          body: JSON.stringify({
            id: txIdCancel,
            transferAmount: 178000,
            content: `CK ${order.paymentRef}`,
            transferType: 'in',
          }),
        }),
      )
      const json = await res.json()
      expect(json.result).toBe('order_cancelled')

      const refreshed = await payload.findByID({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
      })
      expect(refreshed.paymentStatus).toBe('cancelled')
    })

    it('Đơn failed (quá 24 giờ) + đúng tiền -> paid', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-failed-${randomUUID()}@example.test`, name: 'Khach Failed' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { paymentStatus: 'failed' },
        overrideAccess: true,
      })

      const txIdFailed = String(Date.now() + 800)
      const res = await sepayWebhookRoute(
        new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
          },
          body: JSON.stringify({
            id: txIdFailed,
            transferAmount: 178000,
            content: `CK ${order.paymentRef}`,
            transferType: 'in',
          }),
        }),
      )
      const json = await res.json()
      expect(json.result).toBe('paid')

      const refreshed = await payload.findByID({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
      })
      expect(refreshed.paymentStatus).toBe('paid')
    })

    it('Đơn Hana tạo chưa đồng ý điều khoản -> result: terms_missing, không đổi đơn', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-terms-${randomUUID()}@example.test`, name: 'Khach Terms Missing' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const testPkg = await payload.create({
        collection: 'products',
        data: {
          name: 'Gói Growth Mirror Test Terms',
          slug: `pkg-terms-${randomUUID().slice(0, 8)}`,
          web: 'site',
          type: 'package',
          saleStatus: 'on_sale',
          price: 1750000,
          components: [{ label: 'Buổi coaching', quantity: 1, unitValue: 1000000 }],
          _status: 'published',
        },
        overrideAccess: true,
      })
      createdProducts.push(testPkg.id)

      const adminOrder = await payload.create({
        collection: 'orders',
        data: {
          customer: customer.id,
          createdByAdmin: true,
          items: [{ product: testPkg.id, price: 1750000 }],
          total: 1750000,
          paymentStatus: 'pending',
        },
        overrideAccess: true,
      })
      createdOrders.push(adminOrder.id)

      const txIdTerms = String(Date.now() + 900)
      const res = await sepayWebhookRoute(
        new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
          },
          body: JSON.stringify({
            id: txIdTerms,
            transferAmount: 1750000,
            content: `CK ${adminOrder.paymentRef}`,
            transferType: 'in',
          }),
        }),
      )
      const json = await res.json()
      expect(json.result).toBe('terms_missing')

      const refreshed = await payload.findByID({
        collection: 'orders',
        id: adminOrder.id,
        overrideAccess: true,
      })
      expect(refreshed.paymentStatus).toBe('pending')
    })

    it('B2: Hủy đơn giữa lúc webhook (markOrderPaid ném InvalidOrderStatusError) -> event order_cancelled, trả 200', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-b2-cancel-${randomUUID()}@example.test`, name: 'Khach B2 Cancel' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      // Giả lập markOrderPaid bị ném InvalidOrderStatusError sau khi đơn bị hủy
      vi.spyOn(ordersServer, 'markOrderPaid').mockImplementation(async () => {
        // Cập nhật đơn thành cancelled trong DB để mô phỏng đơn bị hủy đồng thời
        await payload.update({
          collection: 'orders',
          id: order.id,
          data: { paymentStatus: 'cancelled' },
          context: { paymentAction: true },
          overrideAccess: true,
        })
        throw new InvalidOrderStatusError('Đơn hàng không ở trạng thái chờ thanh toán')
      })

      const txIdB2Cancel = String(Date.now() + 950)
      const res = await sepayWebhookRoute(
        new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
          },
          body: JSON.stringify({
            id: txIdB2Cancel,
            transferAmount: 178000,
            content: `CK ${order.paymentRef}`,
            transferType: 'in',
          }),
        }),
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.result).toBe('order_cancelled')

      const evs = await payload.find({
        collection: 'paymentEvents',
        where: { transactionId: { equals: txIdB2Cancel } },
        overrideAccess: true,
      })
      expect(evs.totalDocs).toBe(1)
      expect(evs.docs[0].result).toBe('order_cancelled')
    })

    it('B2: Lỗi DB tạm thời trong markOrderPaid -> 500, event giữ processing, gửi lại cùng ID -> paid', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-b2-retry-${randomUUID()}@example.test`, name: 'Khach B2 Retry' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      const txIdB2Retry = String(Date.now() + 980)

      // 1. Giả lập lỗi DB tạm thời
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(ordersServer, 'markOrderPaid').mockRejectedValueOnce(
        new Error('DB simulated network failure'),
      )

      const failReq = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
        },
        body: JSON.stringify({
          id: txIdB2Retry,
          transferAmount: 178000,
          content: `CK ${order.paymentRef}`,
          transferType: 'in',
        }),
      })

      const failRes = await sepayWebhookRoute(failReq)
      expect(failRes.status).toBe(500)

      // Event giữ 'processing' để lần gửi lại xử lý tiếp
      const stuckCheck = await payload.find({
        collection: 'paymentEvents',
        where: { transactionId: { equals: txIdB2Retry } },
        overrideAccess: true,
      })
      expect(stuckCheck.totalDocs).toBe(1)
      expect(stuckCheck.docs[0].result).toBe('processing')

      // 2. SePay gửi lại cùng ID sau > 60 giây -> xử lý lại event kẹt, thành công paid
      errorSpy.mockRestore()
      vi.restoreAllMocks()
      advanceClockPastResume()

      const retryReq = new Request('http://localhost/api/payments/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
        },
        body: JSON.stringify({
          id: txIdB2Retry,
          transferAmount: 178000,
          content: `CK ${order.paymentRef}`,
          transferType: 'in',
        }),
      })

      const retryRes = await sepayWebhookRoute(retryReq)
      expect(retryRes.status).toBe(200)
      const retryJson = await retryRes.json()
      expect(retryJson.result).toBe('paid')

      const refreshed = await payload.findByID({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
      })
      expect(refreshed.paymentStatus).toBe('paid')

      const finalEvent = await payload.find({
        collection: 'paymentEvents',
        where: { transactionId: { equals: txIdB2Retry } },
        overrideAccess: true,
      })
      expect(finalEvent.docs[0].result).toBe('paid')
    })

    it('T2-09c: đơn đã chuyển paid rồi lỗi (event kẹt processing) -> gửi lại ghi paid_incomplete, không cấp quyền lần 2', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-postcommit-${randomUUID()}@example.test`, name: 'Khach Post Commit' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      const txId = String(Date.now() + 990)
      // Giả lập lần trước: đã ghi event 'processing', đơn đã chuyển paid, rồi tiến trình chết
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          order: order.id,
          rawPayload: { id: txId },
          signatureValid: true,
          result: 'processing',
          transactionId: txId,
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      const firstSender = new MockEmailSender()
      await ordersServer.markOrderPaid(order.id, {
        source: 'webhook',
        payload,
        emailSender: firstSender,
      })

      const retrySender = new MockEmailSender()
      advanceClockPastResume()
      const retryRes = await sepayWebhookRoute(
        new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
          },
          body: JSON.stringify({
            id: txId,
            transferAmount: 178000,
            content: `CK ${order.paymentRef}`,
            transferType: 'in',
          }),
        }),
        { emailSender: retrySender },
      )
      expect(retryRes.status).toBe(200)
      expect((await retryRes.json()).result).toBe('paid_incomplete')
      expect(retrySender.sent).toHaveLength(0)

      const events = await payload.find({
        collection: 'paymentEvents',
        where: { transactionId: { equals: txId } },
        overrideAccess: true,
      })
      expect(events.totalDocs).toBe(1)
      expect(events.docs[0].result).toBe('paid_incomplete')

      const ents = await payload.find({
        collection: 'entitlements',
        where: { customer: { equals: customer.id } },
        overrideAccess: true,
      })
      expect(ents.totalDocs).toBe(1)
    })

    it('T2-09c: tiến trình chết sau khi đơn chuyển paid, trước khi cấp quyền -> gửi lại cấp bù quyền', async () => {
      vi.stubEnv('PAYMENT_PROVIDER', 'sepay')
      vi.stubEnv('SEPAY_WEBHOOK_API_KEY', TEST_SEPAY_API_KEY)

      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-nogrant-${randomUUID()}@example.test`, name: 'Khach No Grant' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const order = (
        await payload.find({
          collection: 'orders',
          where: { payToken: { equals: orderResult.payToken } },
          overrideAccess: true,
        })
      ).docs[0]
      createdOrders.push(order.id)

      const txId = String(Date.now() + 995)
      await payload.create({
        collection: 'paymentEvents',
        data: {
          provider: 'sepay',
          order: order.id,
          rawPayload: { id: txId },
          signatureValid: true,
          result: 'processing',
          transactionId: txId,
          receivedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      // Đơn đã paid nhưng chưa cấp quyền (deliveryStatus vẫn 'none')
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { paymentStatus: 'paid', paidAt: new Date().toISOString() },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      advanceClockPastResume()
      const res = await sepayWebhookRoute(
        new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Apikey ${TEST_SEPAY_API_KEY}`,
          },
          body: JSON.stringify({
            id: txId,
            transferAmount: 178000,
            content: `CK ${order.paymentRef}`,
            transferType: 'in',
          }),
        }),
        { emailSender: new MockEmailSender() },
      )
      expect(res.status).toBe(200)
      expect((await res.json()).result).toBe('paid_incomplete')

      const ents = await payload.find({
        collection: 'entitlements',
        where: { customer: { equals: customer.id } },
        overrideAccess: true,
      })
      expect(ents.docs.some((e) => e.status === 'active')).toBe(true)
      const refreshed = await payload.findByID({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
      })
      expect(refreshed.deliveryStatus).toBe('access_granted')
    })
  })

  describe('4. Route GET /api/payments/status/[token]', () => {
    it('Token sai -> trả về 404', async () => {
      const res = await orderStatusRoute(new Request('http://localhost'), {
        params: Promise.resolve({ token: 'non_existent_token_123' }),
      })
      expect(res.status).toBe(404)
    })

    it('Token đúng -> chỉ trả về paymentStatus kèm Cache-Control: no-store', async () => {
      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-status-${randomUUID()}@example.test`, name: 'Khach Polling' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      createdOrders.push(orderRes.docs[0].id)

      const res = await orderStatusRoute(new Request('http://localhost'), {
        params: Promise.resolve({ token: orderResult.payToken }),
      })
      expect(res.status).toBe(200)
      expect(res.headers.get('cache-control')).toBe('no-store')

      const data = await res.json()
      expect(data).toEqual({ paymentStatus: 'pending' })
      expect(data.email).toBeUndefined()
      expect(data.name).toBeUndefined()
      expect(data.amount).toBeUndefined()
      expect(data.total).toBeUndefined()
      expect(data.id).toBeUndefined()
    })
  })

  describe('5. Xác nhận thủ công (confirmManualPayment) vẫn hoạt động nguyên vẹn', () => {
    it('Owner gọi confirmManualPayment thành công cho đơn pending', async () => {
      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-manual-${randomUUID()}@example.test`, name: 'Khach Manual' },
        overrideAccess: true,
      })
      createdCustomers.push(customer.id)

      const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
        termsAccepted: true,
        ip: nextIp(),
      })
      const orderRes = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderResult.payToken } },
        overrideAccess: true,
      })
      const order = orderRes.docs[0]
      createdOrders.push(order.id)

      const confirmed = (await confirmManualPayment(order.id, ownerUser, { payload })) as {
        paymentStatus: string
      }
      expect(confirmed.paymentStatus).toBe('paid')
    })
  })
})
