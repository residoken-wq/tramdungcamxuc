// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, Product } from '../../src/payload-types'
import {
  getAccess,
  hasAccess,
  markExpiredEntitlements,
  startTrial,
} from '../../src/lib/entitlements'
import { grantEntitlementsForOrder } from '../../src/lib/payments/entitlements.server'
import { signCustomerToken } from '../../src/lib/auth/token'
import { vi as viStrings } from '../../src/lib/i18n/vi'
import { POST as expireEntitlementsRoute } from '../../src/app/(site)/api/cron/expire-entitlements/route'

describe('Entitlement Service – 21-day trial, lifetime purchase & access control (T2-02)', () => {
  let payload: Payload
  let customerA: Customer
  let customerB: Customer
  let tool21Days: Product
  let tool365Days: Product
  let toolNoTrial: Product
  let toolNotOnSale: Product

  const created: { collection: CollectionSlug; id: number }[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  const getRealCustomerSession = async (customer: Customer) => {
    const token = signCustomerToken({ id: customer.id, email: customer.email })
    const headers = new Headers({ cookie: `tdcx_customer_token=${token}` })
    const authResult = await payload.auth({ headers })
    if (!authResult.user) throw new Error('Failed to authenticate customer session')
    return authResult.user
  }

  beforeAll(async () => {
    payload = await getPayload({ config })

    // 1. Tạo 2 khách hàng test
    customerA = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `customer-a-t202-${randomUUID()}@example.test`,
          name: 'Khách Hàng A (T2-02)',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    customerB = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `customer-b-t202-${randomUUID()}@example.test`,
          name: 'Khách Hàng B (T2-02)',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    // 2. Tạo công cụ số 21 ngày dùng thử, mua vĩnh viễn (accessDurationDays = null)
    tool21Days = track(
      'products',
      (await payload.create({
        collection: 'products',
        data: {
          name: 'Habit Tracker Số 21 Ngày',
          slug: `habit-tracker-21-${randomUUID()}`,
          web: 'habit',
          type: 'digital_tool',
          saleStatus: 'on_sale',
          _status: 'published',
          trialDays: 21,
          price: 250000,
          salePrice: 178000,
        },
        overrideAccess: true,
      })) as Product,
    )

    // 3. Tạo công cụ số 14 ngày dùng thử, mua có thời hạn 365 ngày
    tool365Days = track(
      'products',
      (await payload.create({
        collection: 'products',
        data: {
          name: 'EQ Buddy 365 Ngày',
          slug: `eq-buddy-365-${randomUUID()}`,
          web: 'eq',
          type: 'digital_tool',
          saleStatus: 'on_sale',
          _status: 'published',
          trialDays: 14,
          accessDurationDays: 365,
          price: 250000,
          salePrice: 178000,
        },
        overrideAccess: true,
      })) as Product,
    )

    // 4. Tạo sản phẩm không có trial (trialDays = 0)
    toolNoTrial = track(
      'products',
      (await payload.create({
        collection: 'products',
        data: {
          name: 'Công Cụ Không Trial',
          slug: `no-trial-${randomUUID()}`,
          web: 'site',
          type: 'digital_tool',
          saleStatus: 'on_sale',
          _status: 'published',
          trialDays: 0,
          price: 149000,
        },
        overrideAccess: true,
      })) as Product,
    )

    // 5. Tạo sản phẩm chưa mở bán hoặc chưa publish
    toolNotOnSale = track(
      'products',
      (await payload.create({
        collection: 'products',
        data: {
          name: 'Công Cụ Chưa Mở Bán',
          slug: `not-on-sale-${randomUUID()}`,
          web: 'site',
          type: 'digital_tool',
          saleStatus: 'coming_soon',
          _status: 'draft',
          trialDays: 21,
          price: 149000,
        },
        overrideAccess: true,
      })) as Product,
    )
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const entry of created.reverse()) {
        try {
          await payload.delete({ collection: entry.collection, id: entry.id, overrideAccess: true })
        } catch {
          // ignore cleanup failures
        }
      }
    } finally {
      await payload.destroy()
    }
  })

  describe('1. Khởi tạo dùng thử (startTrial)', () => {
    it('dùng thử lần 1 thành công: trial 21 ngày theo cấu hình sản phẩm', async () => {
      const now = new Date('2026-10-15T10:00:00.000Z')
      const result = await startTrial(customerA.id, tool21Days.id, { payload, now })

      expect(result.success).toBe(true)
      expect(result.status).toBe('trial')
      expect(result.daysLeft).toBe(21)
      expect(result.entitlementId).toBeDefined()
      if (result.entitlementId)
        created.push({ collection: 'entitlements', id: result.entitlementId })

      const expectedExpiry = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
      expect(result.expiresAt?.toISOString()).toBe(expectedExpiry.toISOString())

      // Quyền truy cập có hiệu lực
      const access = await getAccess(customerA.id, tool21Days.id, { payload, now })
      expect(access.hasAccess).toBe(true)
      expect(access.status).toBe('trial')
      expect(access.daysLeft).toBe(21)
    })

    it('dùng thử lần 2 bị từ chối với thông báo tiếng Việt rõ ràng, không ném 500', async () => {
      const now = new Date('2026-10-15T12:00:00.000Z')
      const result2 = await startTrial(customerA.id, tool21Days.id, { payload, now })

      expect(result2.success).toBe(false)
      expect(result2.code).toBe('TRIAL_ALREADY_USED')
      expect(result2.message).toContain('đã dùng thử')
    })

    it('gọi đồng thời 2 lần -> đúng 1 bản ghi trial duy nhất tại DB', async () => {
      // Tạo customer mới để test race condition
      const custRace = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `customer-race-${randomUUID()}@example.test`,
            name: 'Khách Hàng Race Test',
            consentAt: new Date().toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const now = new Date('2026-10-15T10:00:00.000Z')
      const [res1, res2] = await Promise.all([
        startTrial(custRace.id, tool365Days.id, { payload, now }),
        startTrial(custRace.id, tool365Days.id, { payload, now }),
      ])

      const successCount = [res1, res2].filter((r) => r.success).length
      const failureCount = [res1, res2].filter((r) => !r.success).length
      expect(successCount).toBe(1)
      expect(failureCount).toBe(1)

      const successfulRes = res1.success ? res1 : res2
      if (successfulRes.entitlementId) {
        created.push({ collection: 'entitlements', id: successfulRes.entitlementId })
      }

      // Kiểm tra DB có đúng 1 bản ghi
      const count = await payload.count({
        collection: 'entitlements',
        where: {
          and: [
            { customer: { equals: custRace.id } },
            { product: { equals: tool365Days.id } },
            { source: { equals: 'trial' } },
          ],
        },
        overrideAccess: true,
      })
      expect(count.totalDocs).toBe(1)
    })

    it('từ chối khi trialDays = 0 hoặc saleStatus ≠ on_sale', async () => {
      const now = new Date()

      // trialDays = 0
      const resNoTrial = await startTrial(customerB.id, toolNoTrial.id, { payload, now })
      expect(resNoTrial.success).toBe(false)
      expect(resNoTrial.code).toBe('NOT_ELIGIBLE')

      // saleStatus ≠ on_sale hoặc chưa publish
      const resNotOnSale = await startTrial(customerB.id, toolNotOnSale.id, { payload, now })
      expect(resNotOnSale.success).toBe(false)
      expect(resNotOnSale.code).toBe('NOT_ELIGIBLE')
    })

    it('từ chối tạo trial nếu khách hàng đã có quyền active còn hiệu lực', async () => {
      // Cấp quyền active thủ công cho Customer B với toolNoTrial
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerB.id,
            product: tool365Days.id,
            source: 'manual',
            status: 'active',
            grantedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const res = await startTrial(customerB.id, tool365Days.id, { payload, now: new Date() })
      expect(res.success).toBe(false)
      expect(res.code).toBe('ALREADY_HAVE_ACTIVE')
      expect(res.message).toBe(viStrings.entitlement.alreadyHasActiveAccess)
    })
  })

  describe('2. Đọc quyền truy cập & Biên hạn (getAccess & hasAccess)', () => {
    it('ngày 21 còn quyền, ngày 22 hết quyền (biên expiresAt)', async () => {
      const startAt = new Date('2026-10-01T00:00:00.000Z')
      const custBorder = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `customer-border-${randomUUID()}@example.test`,
            name: 'Khách Biên Hạn',
            consentAt: startAt.toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const trialRes = await startTrial(custBorder.id, tool21Days.id, { payload, now: startAt })
      expect(trialRes.success).toBe(true)
      if (trialRes.entitlementId)
        created.push({ collection: 'entitlements', id: trialRes.entitlementId })

      // Ngày 21: (sau 20 ngày 23 giờ) -> còn quyền
      const day21 = new Date('2026-10-21T23:00:00.000Z')
      const accessDay21 = await getAccess(custBorder.id, tool21Days.id, { payload, now: day21 })
      expect(accessDay21.hasAccess).toBe(true)
      expect(accessDay21.status).toBe('trial')
      expect(accessDay21.daysLeft).toBe(1)
      expect(await hasAccess(custBorder.id, tool21Days.id, { payload, now: day21 })).toBe(true)

      // Ngày 22: (sau 21 ngày 1 phút) -> hết quyền
      const day22 = new Date('2026-10-22T00:01:00.000Z')
      const accessDay22 = await getAccess(custBorder.id, tool21Days.id, { payload, now: day22 })
      expect(accessDay22.hasAccess).toBe(false)
      expect(accessDay22.status).toBe('expired')
      expect(accessDay22.daysLeft).toBe(0)
      expect(await hasAccess(custBorder.id, tool21Days.id, { payload, now: day22 })).toBe(false)
    })

    it('có nhiều bản ghi (trial cũ đã hết hạn + mua active) -> lấy quyền tốt nhất (active vĩnh viễn)', async () => {
      const custMulti = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `customer-multi-${randomUUID()}@example.test`,
            name: 'Khách Đa Quyền',
            consentAt: new Date().toISOString(),
          },
          overrideAccess: true,
        }),
      )

      // 1. Bản ghi trial đã hết hạn từ 30 ngày trước
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: custMulti.id,
            product: tool21Days.id,
            source: 'trial',
            status: 'trial',
            grantedAt: new Date('2026-09-01T00:00:00.000Z').toISOString(),
            expiresAt: new Date('2026-09-22T00:00:00.000Z').toISOString(),
            trialKey: `${custMulti.id}:${tool21Days.id}`,
          },
          overrideAccess: true,
        }),
      )

      // 2. Bản ghi mua active vĩnh viễn (expiresAt = null)
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: custMulti.id,
            product: tool21Days.id,
            source: 'order',
            status: 'active',
            grantedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const now = new Date('2026-10-15T00:00:00.000Z')
      const access = await getAccess(custMulti.id, tool21Days.id, { payload, now })

      expect(access.hasAccess).toBe(true)
      expect(access.status).toBe('active')
      expect(access.expiresAt).toBeNull()
      expect(access.daysLeft).toBeNull()
    })
  })

  describe('3. Mua lẻ công cụ số & Cấp quyền đơn hàng (grantEntitlementsForOrder)', () => {
    it('mua sau khi hết trial -> active vĩnh viễn (expiresAt = null); giữ nguyên bản ghi trial cũ', async () => {
      const custBuyer = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `customer-buyer-${randomUUID()}@example.test`,
            name: 'Khách Mua Lẻ',
            consentAt: new Date().toISOString(),
          },
          overrideAccess: true,
        }),
      )

      // Đã từng có trial cũ
      const trialEnt = track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: custBuyer.id,
            product: tool21Days.id,
            source: 'trial',
            status: 'trial',
            grantedAt: new Date('2026-09-01T00:00:00.000Z').toISOString(),
            expiresAt: new Date('2026-09-22T00:00:00.000Z').toISOString(),
            trialKey: `${custBuyer.id}:${tool21Days.id}`,
          },
          overrideAccess: true,
        }),
      )

      // Tạo đơn hàng mua lẻ digital_tool tool21Days (accessDurationDays = null)
      const order = track(
        'orders',
        await payload.create({
          collection: 'orders',
          data: {
            customer: custBuyer.id,
            items: [{ product: tool21Days.id, price: 178000 }],
            subtotal: 178000,
            total: 178000,
            paymentStatus: 'paid',
            paidAt: new Date('2026-10-10T10:00:00.000Z').toISOString(),
          },
          context: { paymentAction: true },
          overrideAccess: true,
        }),
      )

      const grantRes = await grantEntitlementsForOrder(order.id, { payload, now: new Date() })
      expect(grantRes.grantedCount).toBe(1)

      // Kiểm tra DB: bản ghi trial cũ VẪN CÒN
      const checkTrial = await payload.findByID({
        collection: 'entitlements',
        id: trialEnt.id,
        overrideAccess: true,
      })
      expect(checkTrial).not.toBeNull()

      // Kiểm tra bản ghi active mới
      const entitlements = await payload.find({
        collection: 'entitlements',
        where: {
          and: [
            { customer: { equals: custBuyer.id } },
            { product: { equals: tool21Days.id } },
            { source: { equals: 'order' } },
          ],
        },
        overrideAccess: true,
      })
      expect(entitlements.totalDocs).toBe(1)
      const activeDoc = entitlements.docs[0]!
      expect(activeDoc.status).toBe('active')
      expect(activeDoc.expiresAt).toBeNull()

      // Idempotency: gọi lần 2 không nhân đôi
      const grantRes2 = await grantEntitlementsForOrder(order.id, { payload, now: new Date() })
      expect(grantRes2.grantedCount).toBe(0)
    })

    it('mua sản phẩm có accessDurationDays = 365 -> expiresAt = paidAt + 365 ngày', async () => {
      const custAnnual = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `customer-annual-${randomUUID()}@example.test`,
            name: 'Khách Mua Năm',
            consentAt: new Date().toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const paidAt = new Date('2026-10-10T08:00:00.000Z')
      const order = track(
        'orders',
        await payload.create({
          collection: 'orders',
          data: {
            customer: custAnnual.id,
            items: [{ product: tool365Days.id, price: 250000 }],
            subtotal: 250000,
            total: 250000,
            paymentStatus: 'paid',
            paidAt: paidAt.toISOString(),
          },
          context: { paymentAction: true },
          overrideAccess: true,
        }),
      )

      const grantRes = await grantEntitlementsForOrder(order.id, { payload, now: paidAt })
      expect(grantRes.grantedCount).toBe(1)

      const res = await payload.find({
        collection: 'entitlements',
        where: {
          and: [
            { customer: { equals: custAnnual.id } },
            { product: { equals: tool365Days.id } },
            { order: { equals: order.id } },
          ],
        },
        overrideAccess: true,
      })
      const ent = res.docs[0]!
      expect(ent.status).toBe('active')
      const expectedExpiry = new Date(paidAt.getTime() + 365 * 24 * 60 * 60 * 1000)
      expect(new Date(ent.expiresAt!).toISOString()).toBe(expectedExpiry.toISOString())
    })
  })

  describe('4. Phân quyền đọc & REST phiên khách thật', () => {
    it('khách A đọc được entitlement của chính mình nhưng không đọc được entitlement của khách B', async () => {
      // Tạo entitlement cho Khách B
      const entB = track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerB.id,
            product: tool21Days.id,
            source: 'manual',
            status: 'active',
            grantedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const userA = await getRealCustomerSession(customerA)

      // Khách A truy vấn entitlements qua quyền truy cập thông thường (overrideAccess: false)
      const resA = await payload.find({
        collection: 'entitlements',
        user: userA,
        overrideAccess: false,
      })

      const ids = resA.docs.map((d) => d.id)
      expect(ids).not.toContain(entB.id)

      // Khách B truy vấn thấy entB của mình
      const userB = await getRealCustomerSession(customerB)
      const resB = await payload.find({
        collection: 'entitlements',
        user: userB,
        overrideAccess: false,
      })
      const idsB = resB.docs.map((d) => d.id)
      expect(idsB).toContain(entB.id)
    })

    it('khách hàng không thể tự tạo entitlement qua quyền thông thường', async () => {
      const userA = await getRealCustomerSession(customerA)

      await expect(
        payload.create({
          collection: 'entitlements',
          data: {
            customer: customerA.id,
            product: tool21Days.id,
            source: 'manual',
            status: 'active',
            grantedAt: new Date().toISOString(),
          },
          user: userA,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })
  })

  describe('5. Cron cập nhật quyền hết hạn & Analytics', () => {
    it('markExpiredEntitlements cập nhật status = expired cho các bản ghi quá hạn', async () => {
      const pastExpiry = new Date('2026-10-01T00:00:00.000Z')
      const entExpired = track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerB.id,
            product: toolNoTrial.id,
            source: 'trial',
            status: 'trial',
            grantedAt: new Date('2026-09-01T00:00:00.000Z').toISOString(),
            expiresAt: pastExpiry.toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const result = await markExpiredEntitlements(new Date('2026-10-15T00:00:00.000Z'), {
        payload,
      })
      expect(result.updatedCount).toBeGreaterThanOrEqual(1)

      const refreshed = await payload.findByID({
        collection: 'entitlements',
        id: entExpired.id,
        overrideAccess: true,
      })
      expect(refreshed?.status).toBe('expired')
    })

    it('cron endpoint /api/cron/expire-entitlements: 401 khi sai secret, 200 khi đúng secret', async () => {
      process.env.CRON_SECRET = 'test-secret-t202'

      // Sai secret -> 401
      const reqBad = new Request('http://localhost:3000/api/cron/expire-entitlements', {
        method: 'POST',
        headers: { Authorization: 'Bearer wrong-secret' },
      })
      const resBad = await expireEntitlementsRoute(reqBad)
      expect(resBad.status).toBe(401)

      // Đúng secret -> 200
      const reqGood = new Request('http://localhost:3000/api/cron/expire-entitlements', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret-t202' },
      })
      const resGood = await expireEntitlementsRoute(reqGood)
      expect(resGood.status).toBe(200)
      const data = await resGood.json()
      expect(data.success).toBe(true)
      expect(data.message).toBeDefined()
    })
  })
})
