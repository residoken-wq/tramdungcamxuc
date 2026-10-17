// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, Order, Product, SiteSetting } from '../../src/payload-types'
import {
  DEFAULT_SERVER_USER_AGENT,
  PLAUSIBLE_EVENT_API,
  trackServer,
} from '../../src/lib/analytics/track.server'
import { markOrderPaid } from '../../src/lib/payments/orders.server'
import * as emailService from '../../src/lib/email/service.server'

describe('Server-side Plausible Analytics (T2-22)', () => {
  let payload: Payload
  let originalEnv: NodeJS.ProcessEnv
  let originalFetch: typeof globalThis.fetch
  let fetchMock: ReturnType<typeof vi.fn>

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    originalEnv = { ...process.env }
    originalFetch = globalThis.fetch
  })

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 202 }))
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('trackServer Guards & Conditions', () => {
    it('không gọi fetch khi không có domain Plausible trong siteSettings / context', async () => {
      await trackServer(
        'order_paid',
        { productId: 1, amount: 100000 },
        {
          bypassTestEnv: true,
          plausibleDomain: '',
        },
      )

      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('không gọi fetch khi SITE_NOINDEX === "true"', async () => {
      process.env.SITE_NOINDEX = 'true'

      await trackServer(
        'order_paid',
        { productId: 1, amount: 100000 },
        {
          bypassTestEnv: true,
          plausibleDomain: 'tramdungcamxuc.com',
        },
      )

      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('không gọi fetch khi đang ở môi trường test mà không có cờ bypassTestEnv', async () => {
      // NODE_ENV === 'test' hoặc VITEST đang bật
      expect(process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST)).toBe(true)

      await trackServer(
        'order_paid',
        { productId: 1, amount: 100000 },
        {
          plausibleDomain: 'tramdungcamxuc.com',
        },
      )

      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('trackServer Request & Sanitization', () => {
    it('bật: gọi fetch 1 lần đúng endpoint, đúng headers, body đúng domain và URL không chứa token/email', async () => {
      const mockReq = new Request('https://tramdungcamxuc.com/api/download/test-token-123', {
        headers: {
          'user-agent': 'Mozilla/5.0 Custom Client',
          'x-forwarded-for': '203.0.113.195',
        },
      })

      await trackServer(
        'resource_downloaded',
        {
          resource: 'Ebook Bứt Phá',
          productSlug: 'ebook-but-pha',
          format: 'pdf',
          pageSlug: 'tai-nguyen/ebook-but-pha',
          // Các thuộc tính nhạy cảm hoặc không nằm trong whitelist phải bị loại bỏ hoàn toàn
          email: 'hocvien@example.test',
          name: 'Nguyen Van A',
          phone: '0901234567',
          emotion: 'vui ve',
          reflection: 'Cam thay rat thoai mai',
          randomField: 'unauthorized',
        },
        {
          bypassTestEnv: true,
          plausibleDomain: 'tramdungcamxuc.com',
          path: '/api/download?token=secret-token-must-be-stripped#hash',
          req: mockReq,
        },
      )

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, options] = fetchMock.mock.calls[0]

      expect(url).toBe(PLAUSIBLE_EVENT_API)
      expect(options.method).toBe('POST')
      expect(options.headers['Content-Type']).toBe('application/json')
      expect(options.headers['User-Agent']).toBe('Mozilla/5.0 Custom Client')
      expect(options.headers['X-Forwarded-For']).toBe('203.0.113.195')

      const body = JSON.parse(options.body)
      expect(body.name).toBe('resource_downloaded')
      expect(body.domain).toBe('tramdungcamxuc.com')

      // URL sự kiện tuyệt đối và không chứa query string hay token
      expect(body.url).not.toContain('secret-token-must-be-stripped')
      expect(body.url).not.toContain('?')
      expect(body.url).not.toContain('#')
      expect(body.url).toMatch(/\/api\/download$/)

      // Props chỉ gồm các khóa cho phép
      expect(body.props).toEqual({
        resource: 'Ebook Bứt Phá',
        productSlug: 'ebook-but-pha',
        format: 'pdf',
        pageSlug: 'tai-nguyen/ebook-but-pha',
      })

      // Đảm bảo không lộ thông tin nhạy cảm
      expect(body.props.email).toBeUndefined()
      expect(body.props.name).toBeUndefined()
      expect(body.props.phone).toBeUndefined()
      expect(body.props.emotion).toBeUndefined()
      expect(body.props.reflection).toBeUndefined()
      expect(body.props.randomField).toBeUndefined()
    })

    it('dùng User-Agent mặc định TDCX-Server khi không có thông tin request', async () => {
      await trackServer(
        'trial_expired',
        {
          productSlug: 'habit-tracker-21-ngay',
          productId: 12,
        },
        {
          bypassTestEnv: true,
          plausibleDomain: 'tramdungcamxuc.com',
        },
      )

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [, options] = fetchMock.mock.calls[0]
      expect(options.headers['User-Agent']).toBe(DEFAULT_SERVER_USER_AGENT)
      expect(options.headers['X-Forwarded-For']).toBeUndefined()
    })

    it('fetch ném lỗi mạng hoặc timeout: hàm không ném, luồng gọi vẫn thành công', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      fetchMock.mockRejectedValueOnce(new Error('Network connection timeout to plausible.io'))

      await expect(
        trackServer(
          'trial_converted',
          {
            productSlug: 'habit-tracker-21-ngay',
            productId: 10,
          },
          {
            bypassTestEnv: true,
            plausibleDomain: 'tramdungcamxuc.com',
          },
        ),
      ).resolves.toBeUndefined()

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AnalyticsServer] Lỗi gửi sự kiện Plausible'),
      )
      // Bảo đảm console.warn không in props
      const loggedArg = warnSpy.mock.calls[0]?.[0] || ''
      expect(loggedArg).not.toContain('habit-tracker-21-ngay')
    })

    it('Plausible trả về status lỗi (400 / 500): hàm không ném lỗi', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      fetchMock.mockResolvedValueOnce(new Response('Bad Request', { status: 400 }))

      await expect(
        trackServer(
          'order_paid',
          { amount: 250000 },
          {
            bypassTestEnv: true,
            plausibleDomain: 'tramdungcamxuc.com',
          },
        ),
      ).resolves.toBeUndefined()

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Plausible responded with status 400'),
      )
    })
  })

  describe('Tích hợp markOrderPaid với trackServer', () => {
    let testProduct: Product
    let testCustomer: Customer
    let testOrder: Order
    let settingsBefore: SiteSetting | null = null

    beforeAll(async () => {
      settingsBefore = (await payload.findGlobal({
        slug: 'siteSettings',
        depth: 0,
        overrideAccess: true,
      })) as SiteSetting | null

      // Bật domain Plausible trong settings để trackServer đọc được từ DB
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: {
          analytics: {
            provider: 'plausible',
            plausibleDomain: 'tramdungcamxuc.com',
          },
        },
        overrideAccess: true,
      })

      // Tạo sản phẩm mẫu
      testProduct = (await payload.create({
        collection: 'products',
        data: {
          name: '[TEST] Habit Tracker T2-22',
          slug: `test-habit-tracker-${randomUUID()}`,
          web: 'habit',
          type: 'digital_tool',
          price: 250000,
          salePrice: 178000,
          saleStatus: 'on_sale',
          isSample: true,
          _status: 'published',
        },
        overrideAccess: true,
      })) as Product

      // Tạo khách hàng mẫu
      testCustomer = (await payload.create({
        collection: 'customers',
        data: {
          email: `test-analytics-${randomUUID()}@example.test`,
          name: '[TEST] Khách Hàng T2-22',
          consentMarketing: false,
        },
        overrideAccess: true,
      })) as Customer

      // Tạo đơn hàng chờ thanh toán
      testOrder = (await payload.create({
        collection: 'orders',
        data: {
          customer: testCustomer.id,
          paymentStatus: 'pending',
          paymentMethod: 'vietqr',
          paymentRef: `TDCX${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`,
          total: 178000,
          items: [
            {
              product: testProduct.id,
              quantity: 1,
              price: 178000,
            },
          ],
        },
        overrideAccess: true,
      })) as Order
    })

    afterAll(async () => {
      // Khôi phục cài đặt siteSettings ban đầu
      if (settingsBefore) {
        try {
          await payload.updateGlobal({
            slug: 'siteSettings',
            data: {
              analytics: settingsBefore.analytics,
            },
            overrideAccess: true,
          })
        } catch {}
      }

      // Dọn dẹp bản ghi đơn hàng
      if (testOrder?.id) {
        try {
          await payload.delete({
            collection: 'orders',
            id: testOrder.id,
            context: { paymentAction: true },
            overrideAccess: true,
          })
        } catch {}
      }

      // Dọn dẹp khách hàng bằng context: { accountDeletion: true }
      if (testCustomer?.id) {
        try {
          await payload.delete({
            collection: 'customers',
            id: testCustomer.id,
            context: { accountDeletion: true },
            overrideAccess: true,
          })
        } catch {}
      }

      // Dọn dẹp sản phẩm mẫu
      if (testProduct?.id) {
        try {
          await payload.delete({
            collection: 'products',
            id: testProduct.id,
            overrideAccess: true,
          })
        } catch {}
      }
    })

    it('markOrderPaid lần đầu -> gửi 1 sự kiện order_paid; gọi lại đơn đã paid -> không gửi thêm', async () => {
      // Giả lập môi trường production (không có cờ test) để trackServer thực thi bình thường
      process.env.NODE_ENV = 'production'
      delete process.env.VITEST
      delete process.env.SITE_NOINDEX

      vi.spyOn(emailService, 'sendDigitalToolOrderPaidEmail').mockResolvedValue({
        success: true,
        id: 'mock-mail',
      })

      // Lần 1: Chuyển đơn sang trạng thái paid
      const paidOrder = await markOrderPaid(testOrder.id, {
        payload,
        source: 'manual',
      })

      expect(paidOrder.paymentStatus).toBe('paid')
      expect(fetchMock).toHaveBeenCalledTimes(1)

      const [url, options] = fetchMock.mock.calls[0]
      expect(url).toBe(PLAUSIBLE_EVENT_API)
      const body = JSON.parse(options.body)

      expect(body.name).toBe('order_paid')
      expect(body.domain).toBe('tramdungcamxuc.com')
      expect(body.url).toContain('/thanh-toan')
      expect(body.props).toEqual({
        productId: testProduct.id,
        productSlug: testProduct.slug,
        amount: 178000,
      })

      // Lần 2: Gọi lại markOrderPaid trên đơn đã paid (nhánh idempotent)
      fetchMock.mockClear()
      const alreadyPaidOrder = await markOrderPaid(testOrder.id, {
        payload,
        source: 'manual',
      })

      expect(alreadyPaidOrder.paymentStatus).toBe('paid')
      expect((alreadyPaidOrder as unknown as { __alreadyPaid?: boolean }).__alreadyPaid).toBe(true)

      // Không được gửi thêm sự kiện phân tích nào
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
