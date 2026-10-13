// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { SiteSetting } from '../../src/payload-types'
import { extractPaymentRef } from '../../src/lib/payments/payment-ref'
import { getPaymentProvider, ManualPaymentProvider } from '../../src/lib/payments/provider'
import { SepayPaymentProvider } from '../../src/lib/payments/sepay'
import { confirmManualPayment, createDigitalToolOrder } from '../../src/lib/payments/orders.server'
import { getAccess } from '../../src/lib/entitlements'
import { POST as sepayWebhookRoute } from '../../src/app/(site)/api/payments/sepay/webhook/route'
import { GET as orderStatusRoute } from '../../src/app/(site)/api/payments/status/[token]/route'

describe('SePay Automated Payment & VietQR Integration (T2-09)', () => {
  let payload: Payload
  let ownerUser: { id: number; role: string; email: string }
  let digitalToolProductId: number
  let digitalToolSlug: string
  let settingsBefore: SiteSetting | null = null

  const TEST_SEPAY_API_KEY = 'test_sepay_api_key_secure_12345678'

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

    // Sao lưu và cập nhật cấu hình ngân hàng
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

    // Tạo tài khoản admin owner
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

    // Tạo sản phẩm digital_tool để test cấp quyền
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

  afterAll(async () => {
    // Dọn dẹp theo thứ tự khóa ngoại
    for (const id of createdPaymentEvents) {
      try {
        await payload.delete({ collection: 'paymentEvents', id, overrideAccess: true })
      } catch {}
    }

    for (const id of createdEntitlements) {
      try {
        await payload.delete({ collection: 'entitlements', id, overrideAccess: true })
      } catch {}
    }

    for (const id of createdOrders) {
      try {
        await payload.delete({ collection: 'orders', id, overrideAccess: true })
      } catch {}
    }

    for (const id of createdAuditLogs) {
      try {
        await payload.delete({ collection: 'auditLogs', id, overrideAccess: true })
      } catch {}
    }

    for (const id of createdCustomers) {
      try {
        await payload.delete({ collection: 'customers', id, overrideAccess: true })
      } catch {}
    }

    for (const id of createdProducts) {
      try {
        await payload.delete({ collection: 'products', id, overrideAccess: true })
      } catch {}
    }

    for (const id of createdUsers) {
      try {
        await payload.delete({ collection: 'users', id, overrideAccess: true })
      } catch {}
    }

    if (settingsBefore) {
      await payload.updateGlobal({
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

      expect(() => getPaymentProvider('unknown_provider')).toThrow(
        'chưa được hỗ trợ trong hệ thống',
      )
    })

    it('verifyWebhook kiểm tra API key bằng timingSafeEqual', async () => {
      const provider = new SepayPaymentProvider()
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

        // Thiếu header
        expect(await provider.verifyWebhook(new Request('http://localhost'))).toBe(false)

        // Sai khóa
        const wrongReq = new Request('http://localhost', {
          headers: { Authorization: 'Apikey wrong_api_key' },
        })
        expect(await provider.verifyWebhook(wrongReq)).toBe(false)

        // Khác độ dài (không ném lỗi)
        const diffLenReq = new Request('http://localhost', {
          headers: { Authorization: 'Apikey short' },
        })
        expect(await provider.verifyWebhook(diffLenReq)).toBe(false)

        // Đúng khóa: hỗ trợ cả Apikey, Bearer, hoặc token trần
        const reqApikey = new Request('http://localhost', {
          headers: { Authorization: `Apikey ${TEST_SEPAY_API_KEY}` },
        })
        expect(await provider.verifyWebhook(reqApikey)).toBe(true)

        const reqBearer = new Request('http://localhost', {
          headers: { Authorization: `Bearer ${TEST_SEPAY_API_KEY}` },
        })
        expect(await provider.verifyWebhook(reqBearer)).toBe(true)

        const reqRaw = new Request('http://localhost', {
          headers: { Authorization: TEST_SEPAY_API_KEY },
        })
        expect(await provider.verifyWebhook(reqRaw)).toBe(true)
      } finally {
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })

    it('verifyWebhook khi thiếu biến SEPAY_WEBHOOK_API_KEY -> ghi log và trả false', async () => {
      const provider = new SepayPaymentProvider()
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        delete process.env.SEPAY_WEBHOOK_API_KEY
        const req = new Request('http://localhost', {
          headers: { Authorization: `Apikey ${TEST_SEPAY_API_KEY}` },
        })
        expect(await provider.verifyWebhook(req)).toBe(false)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Sepay] SEPAY_WEBHOOK_API_KEY is not configured'),
        )
      } finally {
        consoleErrorSpy.mockRestore()
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })
  })

  describe('3. Route POST /api/payments/sepay/webhook', () => {
    it('PAYMENT_PROVIDER=manual -> route trả về 404', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      try {
        process.env.PAYMENT_PROVIDER = 'manual'
        const req = new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          body: JSON.stringify({}),
        })
        const res = await sepayWebhookRoute(req)
        expect(res.status).toBe(404)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
      }
    })

    it('Khóa sai / thiếu -> 401 + ghi paymentEvents signatureValid: false (không lưu header khóa)', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.PAYMENT_PROVIDER = 'sepay'
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

        const mockBody = {
          id: 991001,
          gateway: 'MBBank',
          transferAmount: 178000,
          content: 'chuyen tien test 401',
          transferType: 'in',
        }

        const req = new Request('http://localhost/api/payments/sepay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Apikey invalid_key_here',
          },
          body: JSON.stringify(mockBody),
        })

        const res = await sepayWebhookRoute(req)
        expect(res.status).toBe(401)

        // Kiểm tra log trong paymentEvents
        const events = await payload.find({
          collection: 'paymentEvents',
          where: { transactionId: { equals: '991001' } },
          overrideAccess: true,
        })
        expect(events.totalDocs).toBe(1)
        const event = events.docs[0]
        createdPaymentEvents.push(event.id)
        expect(event.signatureValid).toBe(false)
        expect(event.result).toBe('invalid_signature')
        // Dữ liệu gốc chỉ lưu body, tuyệt đối không lưu header chứa API key
        expect(event.rawPayload).toEqual(mockBody)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })

    it('Tiền ra (transferType: out) -> 200 result: ignored, không đổi đơn', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.PAYMENT_PROVIDER = 'sepay'
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

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

        const events = await payload.find({
          collection: 'paymentEvents',
          where: { transactionId: { equals: txId } },
          overrideAccess: true,
        })
        if (events.totalDocs > 0) createdPaymentEvents.push(events.docs[0].id)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })

    it('Không có mã hoặc mã không có đơn -> 200 result: no_match, không đổi đơn', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.PAYMENT_PROVIDER = 'sepay'
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

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

        const events = await payload.find({
          collection: 'paymentEvents',
          where: { transactionId: { equals: txId } },
          overrideAccess: true,
        })
        if (events.totalDocs > 0) createdPaymentEvents.push(events.docs[0].id)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })

    it('Lệch số tiền (thiếu 1đ hoặc thừa 1đ) -> 200 result: amount_mismatch, đơn vẫn pending', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.PAYMENT_PROVIDER = 'sepay'
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

        // Tạo khách và đơn hàng
        const customer = await payload.create({
          collection: 'customers',
          data: { email: `cust-mismatch-${randomUUID()}@test.vn`, name: 'Khach Mismatch' },
          overrideAccess: true,
        })
        createdCustomers.push(customer.id)

        const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
          termsAccepted: true,
          ip: nextIp(),
        })
        expect(orderResult.success).toBe(true)

        const orderRes = await payload.find({
          collection: 'orders',
          where: { payToken: { equals: orderResult.payToken } },
          overrideAccess: true,
        })
        const order = orderRes.docs[0]
        createdOrders.push(order.id)
        expect(order.paymentStatus).toBe('pending')
        expect(order.total).toBe(178000)

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

        // Đơn hàng vẫn pending
        const refreshedOrder = await payload.findByID({
          collection: 'orders',
          id: order.id,
          overrideAccess: true,
        })
        expect(refreshedOrder.paymentStatus).toBe('pending')

        const evs = await payload.find({
          collection: 'paymentEvents',
          where: { transactionId: { equals: txIdMismatch } },
          overrideAccess: true,
        })
        if (evs.totalDocs > 0) createdPaymentEvents.push(evs.docs[0].id)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })

    it('Đúng số tiền -> paid, cấp quyền thành công', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.PAYMENT_PROVIDER = 'sepay'
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

        const customer = await payload.create({
          collection: 'customers',
          data: { email: `cust-paid-${randomUUID()}@test.vn`, name: 'Khach Paid Webhook' },
          overrideAccess: true,
        })
        createdCustomers.push(customer.id)

        const orderResult = await createDigitalToolOrder(customer.id, digitalToolSlug, {
          termsAccepted: true,
          ip: nextIp(),
        })
        expect(orderResult.success).toBe(true)

        const orderRes = await payload.find({
          collection: 'orders',
          where: { payToken: { equals: orderResult.payToken } },
          overrideAccess: true,
        })
        const order = orderRes.docs[0]
        createdOrders.push(order.id)

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

        const res = await sepayWebhookRoute(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.result).toBe('paid')

        // Đơn hàng chuyển sang paid
        const refreshedOrder = await payload.findByID({
          collection: 'orders',
          id: order.id,
          overrideAccess: true,
        })
        expect(refreshedOrder.paymentStatus).toBe('paid')
        expect(refreshedOrder.deliveryStatus).toBe('access_granted')

        // Quyền được cấp
        const access = await getAccess(customer.id, digitalToolProductId, { payload })
        expect(access.hasAccess).toBe(true)
        expect(access.status).toBe('active')

        const evs = await payload.find({
          collection: 'paymentEvents',
          where: { transactionId: { equals: txId } },
          overrideAccess: true,
        })
        if (evs.totalDocs > 0) createdPaymentEvents.push(evs.docs[0].id)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })

    it('Idempotency: Cùng transactionId gửi 2 lần song song -> đúng 1 lần paid, lần 2 là duplicate', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.PAYMENT_PROVIDER = 'sepay'
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

        const customer = await payload.create({
          collection: 'customers',
          data: { email: `cust-parallel-${randomUUID()}@test.vn`, name: 'Khach Parallel' },
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

        // Gọi 2 webhook song song
        const [res1, res2] = await Promise.all([
          sepayWebhookRoute(makeReq()),
          sepayWebhookRoute(makeReq()),
        ])

        expect(res1.status).toBe(200)
        expect(res2.status).toBe(200)

        const json1 = await res1.json()
        const json2 = await res2.json()

        const results = [json1.result, json2.result]
        expect(results).toContain('paid')
        expect(results).toContain('duplicate')

        const evs = await payload.find({
          collection: 'paymentEvents',
          where: { transactionId: { equals: txIdParallel } },
          overrideAccess: true,
        })
        if (evs.totalDocs > 0) createdPaymentEvents.push(evs.docs[0].id)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })

    it('2 giao dịch khác nhau cho cùng 1 đơn -> lần 2 là already_paid, không cấp lại', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.PAYMENT_PROVIDER = 'sepay'
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

        const customer = await payload.create({
          collection: 'customers',
          data: { email: `cust-doubletx-${randomUUID()}@test.vn`, name: 'Khach Double Tx' },
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

        // Giao dịch 1
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

        // Giao dịch 2 (mã giao dịch khác, cùng đơn)
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

        const evs = await payload.find({
          collection: 'paymentEvents',
          where: { order: { equals: order.id } },
          overrideAccess: true,
        })
        for (const d of evs.docs) createdPaymentEvents.push(d.id)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })

    it('Đơn cancelled -> không đổi đơn, result: order_cancelled', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.PAYMENT_PROVIDER = 'sepay'
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

        const customer = await payload.create({
          collection: 'customers',
          data: { email: `cust-cancel-${randomUUID()}@test.vn`, name: 'Khach Cancel' },
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

        // Hủy đơn qua admin
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

        const evs = await payload.find({
          collection: 'paymentEvents',
          where: { transactionId: { equals: txIdCancel } },
          overrideAccess: true,
        })
        if (evs.totalDocs > 0) createdPaymentEvents.push(evs.docs[0].id)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })

    it('Đơn failed (quá 24 giờ) + đúng tiền -> paid', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.PAYMENT_PROVIDER = 'sepay'
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

        const customer = await payload.create({
          collection: 'customers',
          data: { email: `cust-failed-${randomUUID()}@test.vn`, name: 'Khach Failed' },
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

        // Đánh dấu đơn là failed (hết hạn)
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

        const evs = await payload.find({
          collection: 'paymentEvents',
          where: { transactionId: { equals: txIdFailed } },
          overrideAccess: true,
        })
        if (evs.totalDocs > 0) createdPaymentEvents.push(evs.docs[0].id)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })

    it('Đơn Hana tạo chưa đồng ý điều khoản -> result: terms_missing, không đổi đơn', async () => {
      const prevProvider = process.env.PAYMENT_PROVIDER
      const prevKey = process.env.SEPAY_WEBHOOK_API_KEY
      try {
        process.env.PAYMENT_PROVIDER = 'sepay'
        process.env.SEPAY_WEBHOOK_API_KEY = TEST_SEPAY_API_KEY

        const customer = await payload.create({
          collection: 'customers',
          data: { email: `cust-terms-${randomUUID()}@test.vn`, name: 'Khach Terms Missing' },
          overrideAccess: true,
        })
        createdCustomers.push(customer.id)

        // Đơn createdByAdmin phải dùng đúng 1 sản phẩm gói đồng hành
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

        // Đơn createdByAdmin chưa đồng ý điều khoản
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

        const evs = await payload.find({
          collection: 'paymentEvents',
          where: { transactionId: { equals: txIdTerms } },
          overrideAccess: true,
        })
        if (evs.totalDocs > 0) createdPaymentEvents.push(evs.docs[0].id)
      } finally {
        process.env.PAYMENT_PROVIDER = prevProvider
        process.env.SEPAY_WEBHOOK_API_KEY = prevKey
      }
    })
  })

  describe('4. Route GET /api/payments/status/[token]', () => {
    it('Token sai -> trả về 404', async () => {
      const res = await orderStatusRoute(new Request('http://localhost'), {
        params: Promise.resolve({ token: 'non_existent_token_123' }),
      })
      expect(res.status).toBe(404)
    })

    it('Token đúng -> chỉ trả về paymentStatus, không trả thông tin nhạy cảm', async () => {
      const customer = await payload.create({
        collection: 'customers',
        data: { email: `cust-status-${randomUUID()}@test.vn`, name: 'Khach Polling' },
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
      const data = await res.json()

      // CHỈ có paymentStatus
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
        data: { email: `cust-manual-${randomUUID()}@test.vn`, name: 'Khach Manual' },
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
