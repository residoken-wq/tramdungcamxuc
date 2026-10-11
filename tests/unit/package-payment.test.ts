// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import config from '../../src/payload.config'
import type { SiteSetting } from '../../src/payload-types'
import { acceptOrderTermsForToken as acceptOrderTerms } from '../../src/lib/payments/orders.server'
import { grantEntitlementsForOrder } from '../../src/lib/payments/entitlements.server'
import {
  InvalidOrderStatusError,
  confirmManualPayment,
  getPublicOrderView,
} from '../../src/lib/payments/orders.server'
import { vi as viStrings } from '../../src/lib/i18n/vi'

type AdminUser = NonNullable<PayloadRequest['user']>

describe('Package Payment Link & Entitlements (T1-13)', () => {
  let payload: Payload
  let owner: AdminUser
  let editor: AdminUser
  let customerId: number
  let toolProduct1Id: number
  let toolProduct2Id: number
  let packageProductId: number
  let packageNoGrantId: number
  let trialOrderId: number
  let settingsBefore: SiteSetting | null = null

  const createdOrders: number[] = []
  const createdCustomers: number[] = []
  const createdProducts: number[] = []
  const createdUsers: number[] = []
  const createdEntitlements: number[] = []

  const asUser = (doc: { id: number; role?: string; email?: string }) =>
    ({ ...doc, collection: 'users' }) as unknown as AdminUser

  beforeAll(async () => {
    payload = await getPayload({ config })

    settingsBefore = await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })

    // 1. Tạo owner và editor
    const makeUser = async (role: 'owner' | 'editor') => {
      const u = await payload.create({
        collection: 'users',
        data: {
          email: `t1-13-${role}-${randomUUID()}@example.test`,
          password: randomUUID(),
          role,
        },
        overrideAccess: true,
      })
      createdUsers.push(u.id)
      if (role === 'owner' && u.role !== 'owner') {
        const updated = await payload.update({
          collection: 'users',
          id: u.id,
          data: { role: 'owner' },
          overrideAccess: true,
        })
        return asUser(updated)
      }
      return asUser(u)
    }

    owner = await makeUser('owner')
    editor = await makeUser('editor')

    // 2. Tạo customer test
    const cust = await payload.create({
      collection: 'customers',
      data: {
        email: `customer-t1-13-${randomUUID()}@example.test`,
        name: 'Khách hàng Test T1-13',
      },
      overrideAccess: true,
    })
    customerId = cust.id
    createdCustomers.push(cust.id)

    // 3. Tạo 2 digital_tool products (1 có accessDurationDays = 365, 1 vĩnh viễn = null)
    const tool1 = await payload.create({
      collection: 'products',
      data: {
        name: 'Habit Tracker Số (Test T1-13)',
        slug: `habit-tracker-test-${randomUUID()}`,
        web: 'habit',
        type: 'digital_tool',
        _status: 'published',
        price: 250000,
        accessDurationDays: 365,
        saleStatus: 'on_sale',
        isSample: false,
      },
      overrideAccess: true,
    })
    toolProduct1Id = tool1.id
    createdProducts.push(tool1.id)

    const tool2 = await payload.create({
      collection: 'products',
      data: {
        name: 'EQ Buddy Số (Test T1-13)',
        slug: `eq-buddy-test-${randomUUID()}`,
        web: 'eq',
        type: 'digital_tool',
        _status: 'published',
        price: 250000,
        accessDurationDays: null,
        saleStatus: 'on_sale',
        isSample: false,
      },
      overrideAccess: true,
    })
    toolProduct2Id = tool2.id
    createdProducts.push(tool2.id)

    // 4. Tạo gói package có 2 components cấp quyền
    const pkg = await payload.create({
      collection: 'products',
      data: {
        name: 'Gói BUILD Growth Mirror (Test T1-13)',
        slug: `package-build-test-${randomUUID()}`,
        web: 'site',
        type: 'package',
        _status: 'published',
        price: 2900000,
        saleStatus: 'on_sale',
        isSample: false,
        components: [
          {
            label: 'Habit Tracker Số 1 Năm',
            quantity: 1,
            unitValue: 250000,
            grantsProduct: toolProduct1Id,
          },
          {
            label: 'EQ Buddy Số Vĩnh Viễn',
            quantity: 1,
            unitValue: 250000,
            grantsProduct: toolProduct2Id,
          },
          {
            label: 'Coaching 1:1 Vững vàng chuyển mình',
            quantity: 3,
            unitValue: 1000000,
          },
        ],
      },
      overrideAccess: true,
    })
    packageProductId = pkg.id
    createdProducts.push(pkg.id)

    // 5. Tạo gói package KHÔNG có grantsProduct
    const pkgNoGrant = await payload.create({
      collection: 'products',
      data: {
        name: 'Gói Không Cấp Tool (Test T1-13)',
        slug: `package-no-grant-${randomUUID()}`,
        web: 'site',
        type: 'package',
        _status: 'published',
        price: 1500000,
        saleStatus: 'on_sale',
        isSample: false,
        components: [
          {
            label: 'Chỉ có Workshop',
            quantity: 1,
            unitValue: 500000,
          },
        ],
      },
      overrideAccess: true,
    })
    packageNoGrantId = pkgNoGrant.id
    createdProducts.push(pkgNoGrant.id)

    // 6. Tạo đơn coaching_trial đã paid cho khách hàng này (dùng kiểm thử trialCreditApplies)
    const trialProduct = await payload.create({
      collection: 'products',
      data: {
        name: 'Phiên trải nghiệm Growth Mirror 149k (Test T1-13)',
        slug: `trial-product-test-${randomUUID()}`,
        web: 'site',
        type: 'coaching_trial',
        _status: 'published',
        price: 149000,
        saleStatus: 'on_sale',
        isSample: false,
      },
      overrideAccess: true,
    })
    createdProducts.push(trialProduct.id)

    const paidTrial = await payload.create({
      collection: 'orders',
      data: {
        customer: customerId,
        items: [{ product: trialProduct.id, price: 149000 }],
        subtotal: 149000,
        total: 149000,
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
        paymentRef: `TDCXTRIAL${randomUUID().slice(0, 6)}`,
        payToken: `pt-trial-${randomUUID()}`,
      } as never,
      context: { paymentAction: true },
      overrideAccess: true,
    })
    trialOrderId = paidTrial.id
    createdOrders.push(paidTrial.id)
  }, 60000)

  afterAll(async () => {
    if (!payload) return

    // Xóa entitlements
    for (const entId of createdEntitlements) {
      try {
        await payload.delete({ collection: 'entitlements', id: entId, overrideAccess: true })
      } catch {}
    }
    // Xóa tất cả entitlements liên quan tới createdOrders
    for (const orderId of createdOrders) {
      try {
        await payload.delete({
          collection: 'entitlements',
          where: { order: { equals: orderId } },
          overrideAccess: true,
        })
      } catch {}
    }

    // Xóa orders
    for (const orderId of createdOrders) {
      try {
        await payload.delete({ collection: 'orders', id: orderId, overrideAccess: true })
      } catch {}
    }

    // Xóa customers
    for (const custId of createdCustomers) {
      try {
        await payload.delete({ collection: 'customers', id: custId, overrideAccess: true })
      } catch {}
    }

    // Xóa products
    for (const prodId of createdProducts) {
      try {
        await payload.delete({ collection: 'products', id: prodId, overrideAccess: true })
      } catch {}
    }

    // Xóa users
    for (const userId of createdUsers) {
      try {
        await payload.delete({ collection: 'users', id: userId, overrideAccess: true })
      } catch {}
    }

    // Khôi phục siteSettings
    if (settingsBefore) {
      try {
        await payload.updateGlobal({
          slug: 'siteSettings',
          data: {
            trialCreditApplies: settingsBefore.trialCreditApplies ?? false,
          },
        })
      } catch {}
    }
  })

  describe('1. Quyền tạo createdByAdmin & Tính giá server-side', () => {
    it('editor tạo đơn với createdByAdmin = true -> bị ép về false', async () => {
      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageProductId, price: 2900000 }],
          createdByAdmin: true,
        } as never,
        user: editor,
        overrideAccess: false,
      })
      createdOrders.push(order.id)

      expect(order.createdByAdmin).toBe(false)
    })

    it('owner tạo đơn gói -> giá tính tự động từ DB (dù payload gõ sai)', async () => {
      // Đảm bảo trialCreditApplies đang tắt
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: { trialCreditApplies: false },
      })

      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageProductId, price: 999999 }],
          subtotal: 999999,
          total: 999999,
          createdByAdmin: true,
        } as never,
        user: owner,
        overrideAccess: false,
      })
      createdOrders.push(order.id)

      expect(order.createdByAdmin).toBe(true)
      expect(order.items[0].price).toBe(2900000)
      expect(order.subtotal).toBe(2900000)
      expect(order.total).toBe(2900000)
      expect(order.paymentStatus).toBe('pending')
      expect(order.payToken).toBeTruthy()
    })

    it('owner tạo đơn createdByAdmin với sản phẩm không phải gói -> từ chối; trialCreditOrder gửi lên bị bỏ', async () => {
      await expect(
        payload.create({
          collection: 'orders',
          data: {
            customer: customerId,
            items: [{ product: toolProduct1Id, price: 1000 }],
            createdByAdmin: true,
          } as never,
          user: owner,
          overrideAccess: false,
        }),
      ).rejects.toThrow()

      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageProductId, price: 2900000 }],
          createdByAdmin: true,
          trialCreditOrder: trialOrderId,
        } as never,
        user: owner,
        overrideAccess: false,
      })
      createdOrders.push(order.id)
      // REVIEW-REQUIRED: trialCreditOrder chỉ do server tính (trialCreditApplies đang tắt)
      expect(order.trialCreditOrder).toBeFalsy()
      expect(order.total).toBe(2900000)
    })
  })

  describe('2. Khấu trừ phí trải nghiệm (trialCreditApplies)', () => {
    it('trialCreditApplies bật -> trừ 1 lần 149k, đơn thứ 2 không trừ lại', async () => {
      // Bật công tắc
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: { trialCreditApplies: true },
      })

      // Đơn gói 1: Khách đã có đơn trialOrderId (149k) đã paid
      const order1 = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageProductId, price: 2900000 }],
          createdByAdmin: true,
        } as never,
        user: owner,
        overrideAccess: false,
      })
      createdOrders.push(order1.id)

      // Kỳ vọng: giá 2.900.000 - 149.000 = 2.751.000
      expect(order1.subtotal).toBe(2900000)
      expect(order1.total).toBe(2751000)
      expect(order1.notes).toContain('Đã trừ phí trải nghiệm')
      expect(order1.notes).toContain('149.000')

      const populatedOrder1 = await payload.findByID({
        collection: 'orders',
        id: order1.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(populatedOrder1.trialCreditOrder).toBe(trialOrderId)

      // Đơn gói 2 của cùng khách hàng: đơn trialOrderId đã được dùng để trừ ở đơn 1
      const order2 = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageProductId, price: 2900000 }],
          createdByAdmin: true,
        } as never,
        user: owner,
        overrideAccess: false,
      })
      createdOrders.push(order2.id)

      // Kỳ vọng: không trừ lại lần thứ 2, giữ nguyên giá gốc 2.900.000
      expect(order2.total).toBe(2900000)
      expect(order2.trialCreditOrder).toBeFalsy()
    })
  })

  describe('3. Xác nhận điều khoản thanh toán (acceptOrderTerms)', () => {
    let testOrderToken: string
    let testOrderId: number

    beforeAll(async () => {
      const ord = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageProductId, price: 2900000 }],
          createdByAdmin: true,
        } as never,
        user: owner,
        overrideAccess: false,
      })
      createdOrders.push(ord.id)
      testOrderId = ord.id
      testOrderToken = ord.payToken!
    })

    it('trước khi đồng ý: trang đơn không gửi QR, tài khoản, mã chuyển khoản; owner chưa xác nhận được', async () => {
      const view = await getPublicOrderView(testOrderToken, { payload })
      expect(view).not.toBeNull()
      expect(view!.qrSvg).toBe('')
      expect(view!.qrPayload).toBe('')
      expect(view!.paymentRef).toBe('')
      expect(view!.bankInfo.accountNumber).toBe('')
      expect(view!.packageSummary).toBeTruthy()

      await expect(
        confirmManualPayment(testOrderId, { id: owner.id, role: 'owner' }, { payload }),
      ).rejects.toThrow(viStrings.payment.errors.termsNotAccepted)
    })

    it('token sai hoặc không tồn tại -> ném 404 (NEXT_NOT_FOUND)', async () => {
      await expect(
        acceptOrderTerms('fake-invalid-token-123456', { payload, ip: '127.0.0.10' }),
      ).rejects.toThrow()
    })

    it('đơn không ở trạng thái pending -> báo lỗi InvalidOrderStatusError', async () => {
      const nonPendingOrd = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageProductId, price: 2900000 }],
          createdByAdmin: true,
          paymentStatus: 'paid',
        } as never,
        context: { paymentAction: true },
        overrideAccess: true,
      })
      createdOrders.push(nonPendingOrd.id)

      await expect(
        acceptOrderTerms(nonPendingOrd.payToken!, { payload, ip: '127.0.0.11' }),
      ).rejects.toThrow(InvalidOrderStatusError)
    })

    it('đơn pending hợp lệ -> cập nhật termsAcceptedAt thành công', async () => {
      const res = await acceptOrderTerms(testOrderToken, { payload, ip: '127.0.0.12' })
      expect(res.success).toBe(true)

      const updated = await payload.findByID({
        collection: 'orders',
        id: testOrderId,
        overrideAccess: true,
      })
      expect(updated.termsAcceptedAt).toBeTruthy()
    })

    it('gọi lần 2 trên cùng đơn hàng -> idempotent, không ném lỗi', async () => {
      const res = await acceptOrderTerms(testOrderToken, { payload, ip: '127.0.0.13' })
      expect(res.success).toBe(true)
    })

    it('sau khi đồng ý: trang đơn có QR và mã chuyển khoản', async () => {
      const view = await getPublicOrderView(testOrderToken, { payload })
      expect(view!.qrSvg).toContain('<svg')
      expect(view!.paymentRef.startsWith('TDCX')).toBe(true)
    })
  })

  describe('4. Cấp quyền tự động (grantEntitlementsForOrder)', () => {
    it('gọi 2 lần đồng thời (Promise.all) -> đúng số entitlement, không nhân đôi', async () => {
      const paidOrd = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageProductId, price: 2900000 }],
          createdByAdmin: true,
          paymentStatus: 'paid',
          paidAt: new Date().toISOString(),
        } as never,
        context: { paymentAction: true },
        overrideAccess: true,
      })
      createdOrders.push(paidOrd.id)

      // Chạy 2 lần đồng thời
      const [res1, res2] = await Promise.all([
        grantEntitlementsForOrder(paidOrd.id, { payload }),
        grantEntitlementsForOrder(paidOrd.id, { payload }),
      ])

      // Tổng số quyền được cấp cho đơn này trong collection entitlements phải đúng là 2 (tool1 và tool2)
      const ents = await payload.find({
        collection: 'entitlements',
        where: { order: { equals: paidOrd.id } },
        overrideAccess: true,
      })

      expect(ents.totalDocs).toBe(2)
      ents.docs.forEach((doc) => createdEntitlements.push(doc.id))

      // Một lời gọi tạo được, lời gọi kia gặp trùng khóa bỏ qua
      expect(res1.grantedCount + res2.grantedCount).toBe(2)
    })

    it('gói không có grantsProduct -> 0 entitlement được cấp', async () => {
      const noGrantOrd = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageNoGrantId, price: 1500000 }],
          createdByAdmin: true,
          paymentStatus: 'paid',
          paidAt: new Date().toISOString(),
        } as never,
        context: { paymentAction: true },
        overrideAccess: true,
      })
      createdOrders.push(noGrantOrd.id)

      const res = await grantEntitlementsForOrder(noGrantOrd.id, { payload })
      expect(res.grantedCount).toBe(0)

      const ents = await payload.find({
        collection: 'entitlements',
        where: { order: { equals: noGrantOrd.id } },
        overrideAccess: true,
      })
      expect(ents.totalDocs).toBe(0)
    })

    it('accessDurationDays: 365 có ngày hết hạn; rỗng (null) vĩnh viễn (expiresAt = null)', async () => {
      const now = new Date('2026-10-01T00:00:00.000Z')
      const paidOrd = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageProductId, price: 2900000 }],
          createdByAdmin: true,
          paymentStatus: 'paid',
          paidAt: now.toISOString(),
        } as never,
        context: { paymentAction: true },
        overrideAccess: true,
      })
      createdOrders.push(paidOrd.id)

      await grantEntitlementsForOrder(paidOrd.id, { payload, now })

      const ents = await payload.find({
        collection: 'entitlements',
        where: { order: { equals: paidOrd.id } },
        depth: 0,
        overrideAccess: true,
      })
      ents.docs.forEach((doc) => createdEntitlements.push(doc.id))

      const entTool1 = ents.docs.find((d) => d.product === toolProduct1Id)
      const entTool2 = ents.docs.find((d) => d.product === toolProduct2Id)

      expect(entTool1).toBeDefined()
      expect(entTool2).toBeDefined()

      // Tool 1: 365 ngày
      expect(entTool1!.expiresAt).toBeTruthy()
      const diffDays =
        (new Date(entTool1!.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      expect(Math.round(diffDays)).toBe(365)

      // Tool 2: vĩnh viễn (null)
      expect(entTool2!.expiresAt).toBeNull()
    })

    it('đơn 149k (coaching_trial) xác nhận -> 0 entitlement', async () => {
      const res = await grantEntitlementsForOrder(trialOrderId, { payload })
      expect(res.grantedCount).toBe(0)
    })

    it('đơn gói hết hạn (failed) được owner xác nhận -> cấp entitlement cho grantsProduct đúng 1 lần (T2-13)', async () => {
      const now = new Date()
      // Tạo đơn gói do admin tạo
      const expiredOrd = await payload.create({
        collection: 'orders',
        data: {
          customer: customerId,
          items: [{ product: packageProductId, price: 2900000 }],
          createdByAdmin: true,
          paymentStatus: 'pending',
        } as never,
        context: { paymentAction: true },
        overrideAccess: true,
      })
      createdOrders.push(expiredOrd.id)

      // Khách hàng đã đồng ý điều khoản trên link thanh toán, sau đó đơn chuyển sang failed (hết hạn sau 24h)
      await payload.update({
        collection: 'orders',
        id: expiredOrd.id,
        data: {
          termsAcceptedAt: now.toISOString(),
          paymentStatus: 'failed',
        },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      // Owner xác nhận đơn gói đã hết hạn
      const confirmed = (await confirmManualPayment(expiredOrd.id, owner, {
        payload,
        now,
      })) as { paymentStatus: string; paidAt: string }

      expect(confirmed.paymentStatus).toBe('paid')
      expect(confirmed.paidAt).toBeDefined()

      // Kiểm tra entitlements được cấp đúng 1 lần (2 công cụ số tool1 và tool2)
      const ents = await payload.find({
        collection: 'entitlements',
        where: { order: { equals: expiredOrd.id } },
        overrideAccess: true,
      })

      expect(ents.totalDocs).toBe(2)
      ents.docs.forEach((doc) => createdEntitlements.push(doc.id))

      // Kiểm tra audit log ghi confirm_expired_order
      const auditQuery = await payload.find({
        collection: 'auditLogs',
        where: { target: { equals: `orders:${expiredOrd.id}` } },
        overrideAccess: true,
      })
      expect(auditQuery.totalDocs).toBe(1)
      expect(auditQuery.docs[0].action).toBe('confirm_expired_order')
    })
  })
})
