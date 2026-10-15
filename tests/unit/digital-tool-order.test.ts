// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import config from '../../src/payload.config'
import type { SiteSetting } from '../../src/payload-types'
import {
  confirmManualPayment,
  createDigitalToolOrder,
  AlreadyHasActiveAccessError,
  InvalidProductTypeError,
  ProductExternalError,
  ProductNotForSaleError,
  TermsNotAcceptedError,
} from '../../src/lib/payments/orders.server'
import { getAccess, startTrial } from '../../src/lib/entitlements'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

type AdminUser = NonNullable<PayloadRequest['user']>

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('Digital Tool Order Backend & Manual Confirmation (T2-08)', () => {
  let payload: Payload
  let owner: AdminUser
  let mockEmailSender: MockEmailSender
  let ipCounter = 1
  const nextIp = () => `192.168.10.${ipCounter++}`

  // Quản lý bản ghi để dọn dẹp triệt để trong afterAll theo thứ tự FK:
  // entitlements -> orders -> auditLogs -> customers -> products -> users
  const createdEntitlements: number[] = []
  const createdOrders: number[] = []
  const createdCustomers: number[] = []
  const createdProducts: number[] = []
  const createdUsers: number[] = []
  let settingsBefore: SiteSetting | null = null

  const asUser = (doc: { id: number; role?: string; email?: string }) =>
    ({ ...doc, collection: 'users' }) as unknown as AdminUser

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    mockEmailSender = new MockEmailSender()

    // 1. Sao lưu cấu hình ngân hàng hiện tại
    settingsBefore = await payload.findGlobal({
      slug: 'siteSettings',
      overrideAccess: true,
    })

    // Cập nhật cấu hình ngân hàng hợp lệ để tạo đơn VietQR
    await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        bankBin: '970422',
        bankName: 'Ngân hàng Quân Đội (MB)',
        accountNumber: '0000000000',
        accountName: 'TAI KHOAN TEST',
        transferPrefix: 'TDCX',
      },
      overrideAccess: true,
    })

    // 2. Tạo tài khoản admin owner
    const ownerUser = await payload.create({
      collection: 'users',
      data: {
        email: `t2-08-owner-${randomUUID()}@example.test`,
        password: `TestP@ss!${randomUUID()}`,
        role: 'owner',
      },
      overrideAccess: true,
    })
    createdUsers.push(ownerUser.id)
    owner = asUser({ ...ownerUser, role: 'owner' })
  })

  afterAll(async () => {
    // Dọn dẹp theo thứ tự FK: xóa con trước cha (nhắc dùng thử, quyền, đơn hàng -> khách hàng)
    for (const id of createdCustomers) {
      try {
        await payload.delete({
          collection: 'trialReminders',
          where: { 'entitlement.customer': { equals: id } },
          overrideAccess: true,
        })
      } catch {}
      try {
        await payload.delete({
          collection: 'entitlements',
          where: { customer: { equals: id } },
          overrideAccess: true,
        })
      } catch {}
      try {
        await payload.delete({
          collection: 'orders',
          where: { customer: { equals: id } },
          overrideAccess: true,
        })
      } catch {}
      await payload.delete({
        collection: 'customers',
        id,
        overrideAccess: true,
        context: { accountDeletion: true },
      })
    }

    for (const id of createdProducts) {
      try {
        await payload.delete({
          collection: 'orders',
          where: { 'items.product': { equals: id } },
          overrideAccess: true,
        })
      } catch {}
      try {
        await payload.delete({ collection: 'products', id, overrideAccess: true })
      } catch {}
    }

    for (const id of createdUsers) {
      try {
        await payload.delete({ collection: 'users', id, overrideAccess: true })
      } catch {
        // ignore
      }
    }

    // Khôi phục siteSettings
    if (settingsBefore) {
      try {
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
      } catch {
        // ignore
      }
    }
  })

  const createTestCustomer = async (emailPrefix = 'cust') => {
    const cust = await payload.create({
      collection: 'customers',
      data: {
        name: `Khách ${emailPrefix}`,
        email: `${emailPrefix}-${randomUUID().slice(0, 8)}@example.test`,
      },
      overrideAccess: true,
    })
    createdCustomers.push(cust.id)
    return cust
  }

  const createTestProduct = async (overrides: Record<string, unknown> = {}) => {
    const slug = `tool-${randomUUID().slice(0, 8)}`
    const prod = await payload.create({
      collection: 'products',
      data: {
        name: `Công cụ số ${slug}`,
        slug,
        web: 'habit',
        type: 'digital_tool',
        saleStatus: 'on_sale',
        price: 250000,
        salePrice: 178000,
        accessDurationDays: null, // Vĩnh viễn
        _status: 'published',
        ...overrides,
      },
      overrideAccess: true,
    })
    createdProducts.push(prod.id)
    return prod
  }

  it('1. giá lấy từ DB (getEffectivePrice = 178.000đ khi có ưu đãi), bỏ qua giá client', async () => {
    const customer = await createTestCustomer('price-check')
    const product = await createTestProduct({ price: 250000, salePrice: 178000 })

    const res = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )

    expect(res.success).toBe(true)
    expect(res.payToken).toBeTruthy()

    // Kiểm tra đơn hàng được lưu trong DB
    const orderRes = await payload.find({
      collection: 'orders',
      where: { payToken: { equals: res.payToken } },
      overrideAccess: true,
    })
    expect(orderRes.totalDocs).toBe(1)
    const order = orderRes.docs[0]!
    createdOrders.push(order.id)

    expect(order.total).toBe(178000) // Đọc đúng giá ưu đãi từ DB
    expect(order.paymentStatus).toBe('pending')
    expect(order.termsAcceptedAt).toBeTruthy()
    const itemProductId =
      typeof order.items?.[0]?.product === 'object' && order.items?.[0]?.product !== null
        ? (order.items[0].product as { id: number }).id
        : order.items?.[0]?.product
    expect(itemProductId).toBe(product.id)
  })

  it('2. từ chối khi sản phẩm không phải digital_tool / chưa mở bán / có externalUrl', async () => {
    const customer = await createTestCustomer('invalid-prod')

    // 2a. Không phải digital_tool (ví dụ ebook hoặc package)
    const packageProd = await createTestProduct({ type: 'package' })
    await expect(
      createDigitalToolOrder(
        customer.id,
        packageProd.slug,
        { termsAccepted: true, ip: nextIp() },
        { payload },
      ),
    ).rejects.toThrow(InvalidProductTypeError)

    // 2b. Chưa mở bán (coming_soon)
    const comingSoonProd = await createTestProduct({ saleStatus: 'coming_soon' })
    await expect(
      createDigitalToolOrder(
        customer.id,
        comingSoonProd.slug,
        { termsAccepted: true, ip: nextIp() },
        { payload },
      ),
    ).rejects.toThrow(ProductNotForSaleError)

    // 2c. Có externalUrl
    const externalProd = await createTestProduct({
      externalUrl: 'https://shopee.vn/product/12345',
    })
    await expect(
      createDigitalToolOrder(
        customer.id,
        externalProd.slug,
        { termsAccepted: true, ip: nextIp() },
        { payload },
      ),
    ).rejects.toThrow(ProductExternalError)
  })

  it('3. chưa tick điều khoản thanh toán -> từ chối với TermsNotAcceptedError', async () => {
    const customer = await createTestCustomer('no-terms')
    const product = await createTestProduct()

    // termsAccepted: false
    await expect(
      createDigitalToolOrder(
        customer.id,
        product.slug,
        { termsAccepted: false, ip: nextIp() },
        { payload },
      ),
    ).rejects.toThrow(TermsNotAcceptedError)

    // Không truyền termsAccepted
    await expect(
      createDigitalToolOrder(customer.id, product.slug, { ip: nextIp() }, { payload }),
    ).rejects.toThrow(TermsNotAcceptedError)
  })

  it('4. khách đã có quyền active còn hiệu lực -> không tạo đơn, ném AlreadyHasActiveAccessError', async () => {
    const customer = await createTestCustomer('has-active')
    const product = await createTestProduct()

    // Cấp quyền active thủ công cho khách
    const ent = await payload.create({
      collection: 'entitlements',
      data: {
        customer: customer.id,
        product: product.id,
        status: 'active',
        source: 'manual',
        grantedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    createdEntitlements.push(ent.id)

    // Thử tạo đơn cho sản phẩm này
    await expect(
      createDigitalToolOrder(
        customer.id,
        product.slug,
        { termsAccepted: true, ip: nextIp() },
        { payload },
      ),
    ).rejects.toThrow(AlreadyHasActiveAccessError)
  })

  it('5. đơn pending chưa quá 24 giờ được tái sử dụng (cùng payToken, không tạo đơn mới)', async () => {
    const customer = await createTestCustomer('reuse-pending')
    const product = await createTestProduct()

    // Lần 1: Tạo đơn
    const res1 = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )
    expect(res1.success).toBe(true)
    expect(res1.reused).toBeFalsy()

    const orderRes = await payload.find({
      collection: 'orders',
      where: { payToken: { equals: res1.payToken } },
      overrideAccess: true,
    })
    expect(orderRes.totalDocs).toBe(1)
    const order1 = orderRes.docs[0]!
    createdOrders.push(order1.id)

    // Lần 2: Tạo lại cho cùng khách và sản phẩm trong vòng 24h
    const res2 = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )
    expect(res2.success).toBe(true)
    expect(res2.payToken).toBe(res1.payToken)
    expect(res2.reused).toBe(true)

    // Tổng số đơn vẫn chỉ là 1
    const totalOrdersRes = await payload.find({
      collection: 'orders',
      where: { customer: { equals: customer.id } },
      overrideAccess: true,
    })
    expect(totalOrdersRes.totalDocs).toBe(1)
  })

  it('6. xác nhận thanh toán -> quyền active vĩnh viễn, deliveryStatus = access_granted, email gửi 1 lần', async () => {
    const customer = await createTestCustomer('confirm-grant')
    const product = await createTestProduct({ accessDurationDays: null })

    const orderRes = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )
    expect(orderRes.payToken).toBeTruthy()

    const orderDoc = (
      await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderRes.payToken } },
        overrideAccess: true,
      })
    ).docs[0]!
    createdOrders.push(orderDoc.id)

    mockEmailSender.sent = []

    // Owner xác nhận thanh toán thủ công
    const confirmed = (await confirmManualPayment(orderDoc.id, owner, {
      payload,
      emailSender: mockEmailSender,
    })) as { id: number; paymentStatus: string; deliveryStatus: string }

    expect(confirmed.paymentStatus).toBe('paid')
    expect(confirmed.deliveryStatus).toBe('email_sent')

    // Kiểm tra quyền truy cập được cấp
    const access = await getAccess(customer.id, product.id, { payload })
    expect(access.hasAccess).toBe(true)
    expect(access.status).toBe('active')
    expect(access.expiresAt).toBeNull() // Dùng vĩnh viễn

    // Theo dõi entitlement để dọn dẹp
    const entRes = await payload.find({
      collection: 'entitlements',
      where: {
        and: [{ customer: { equals: customer.id } }, { product: { equals: product.id } }],
      },
      overrideAccess: true,
    })
    expect(entRes.totalDocs).toBe(1)
    createdEntitlements.push(entRes.docs[0]!.id)

    // Email kích hoạt được gửi đúng 1 lần
    expect(mockEmailSender.sent.length).toBe(1)
    const email = mockEmailSender.sent[0]!
    expect(email.to).toBe(customer.email)
    expect(email.subject).toContain(product.name)
  })

  it('7. xác nhận thanh toán 2 lần (idempotent) -> vẫn chỉ 1 quyền, không gửi lại email', async () => {
    const customer = await createTestCustomer('idempotent-test')
    const product = await createTestProduct()

    const orderRes = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )

    const orderDoc = (
      await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderRes.payToken } },
        overrideAccess: true,
      })
    ).docs[0]!
    createdOrders.push(orderDoc.id)

    mockEmailSender.sent = []

    // Lần xác nhận 1
    await confirmManualPayment(orderDoc.id, owner, {
      payload,
      emailSender: mockEmailSender,
    })
    expect(mockEmailSender.sent.length).toBe(1)

    // Lần xác nhận 2
    await confirmManualPayment(orderDoc.id, owner, {
      payload,
      emailSender: mockEmailSender,
    })

    // Email vẫn chỉ gửi đúng 1 lần, không gửi lại
    expect(mockEmailSender.sent.length).toBe(1)

    // Chỉ có duy nhất 1 bản ghi entitlement
    const entRes = await payload.find({
      collection: 'entitlements',
      where: {
        and: [{ customer: { equals: customer.id } }, { product: { equals: product.id } }],
      },
      overrideAccess: true,
    })
    expect(entRes.totalDocs).toBe(1)
    createdEntitlements.push(entRes.docs[0]!.id)
  })

  it('8. khách đang dùng thử (trial) mua công cụ -> quyền active thắng, getAccess trả về active', async () => {
    const customer = await createTestCustomer('trial-upgrade')
    const product = await createTestProduct({ accessDurationDays: null, trialDays: 21 })

    // Khách bắt đầu dùng thử 21 ngày
    const trialRes = await startTrial(customer.id, product.id, { payload })
    expect(trialRes.success).toBe(true)
    if (trialRes.entitlementId) {
      createdEntitlements.push(trialRes.entitlementId)
    }

    // Đang trong thời gian trial
    const accessBefore = await getAccess(customer.id, product.id, { payload })
    expect(accessBefore.status).toBe('trial')
    expect(accessBefore.hasAccess).toBe(true)

    // Khách đặt mua công cụ số
    const orderRes = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )

    const orderDoc = (
      await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderRes.payToken } },
        overrideAccess: true,
      })
    ).docs[0]!
    createdOrders.push(orderDoc.id)

    // Owner xác nhận thanh toán
    await confirmManualPayment(orderDoc.id, owner, {
      payload,
      emailSender: mockEmailSender,
    })

    // Sau khi thanh toán, quyền active thắng trial
    const accessAfter = await getAccess(customer.id, product.id, { payload })
    expect(accessAfter.status).toBe('active')
    expect(accessAfter.hasAccess).toBe(true)
    expect(accessAfter.expiresAt).toBeNull() // Vĩnh viễn

    // Bản ghi entitlement từ order
    const allEnts = await payload.find({
      collection: 'entitlements',
      where: {
        and: [{ customer: { equals: customer.id } }, { product: { equals: product.id } }],
      },
      overrideAccess: true,
    })
    for (const e of allEnts.docs) {
      if (!createdEntitlements.includes(e.id)) {
        createdEntitlements.push(e.id)
      }
    }
  })

  it('9. giá đổi -> không dùng lại đơn pending cũ, hủy đơn cũ và tạo đơn mới với giá mới', async () => {
    const customer = await createTestCustomer('price-change')
    const product = await createTestProduct({ price: 250000, salePrice: null }) // Giá ban đầu 250k

    // 1. Tạo đơn lần 1 với giá 250k
    const res1 = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )
    expect(res1.success).toBe(true)
    const order1 = (
      await payload.find({
        collection: 'orders',
        where: { payToken: { equals: res1.payToken } },
        overrideAccess: true,
      })
    ).docs[0]!
    createdOrders.push(order1.id)
    expect(order1.total).toBe(250000)

    // 2. Hana đổi giá sang ưu đãi 178k
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { salePrice: 178000 },
      overrideAccess: true,
    })

    // 3. Khách đặt lại -> không dùng lại đơn cũ vì giá đã đổi
    const res2 = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )
    expect(res2.success).toBe(true)
    expect(res2.reused).toBeFalsy()
    expect(res2.payToken).not.toBe(res1.payToken)

    const order2 = (
      await payload.find({
        collection: 'orders',
        where: { payToken: { equals: res2.payToken } },
        overrideAccess: true,
      })
    ).docs[0]!
    createdOrders.push(order2.id)
    expect(order2.total).toBe(178000)

    // Đơn cũ đã bị hủy
    const refreshedOrder1 = await payload.findByID({
      collection: 'orders',
      id: order1.id,
      overrideAccess: true,
    })
    expect(refreshedOrder1.paymentStatus).toBe('cancelled')
  })

  it('10. hai yêu cầu tạo đơn song song (Promise.all) -> chỉ tạo đúng 1 đơn duy nhất', async () => {
    const customer = await createTestCustomer('concurrent-order')
    const product = await createTestProduct({ price: 250000, salePrice: 178000 })

    const [res1, res2] = await Promise.all([
      createDigitalToolOrder(
        customer.id,
        product.slug,
        { termsAccepted: true, ip: nextIp() },
        { payload },
      ),
      createDigitalToolOrder(
        customer.id,
        product.slug,
        { termsAccepted: true, ip: nextIp() },
        { payload },
      ),
    ])

    expect(res1.success).toBe(true)
    expect(res2.success).toBe(true)
    expect(res1.payToken).toBe(res2.payToken) // Cùng 1 payToken

    // Chỉ có đúng 1 đơn hàng trong database
    const ordersRes = await payload.find({
      collection: 'orders',
      where: {
        and: [{ customer: { equals: customer.id } }, { paymentStatus: { equals: 'pending' } }],
      },
      overrideAccess: true,
    })
    expect(ordersRes.totalDocs).toBe(1)
    createdOrders.push(ordersRes.docs[0]!.id)
  })

  it('11. cấp quyền lỗi (grantEntitlementsForOrder throw) -> ghi auditLog và KHÔNG gửi email', async () => {
    const customer = await createTestCustomer('grant-error')
    const product = await createTestProduct()

    const orderRes = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )

    const orderDoc = (
      await payload.find({
        collection: 'orders',
        where: { payToken: { equals: orderRes.payToken } },
        overrideAccess: true,
      })
    ).docs[0]!
    createdOrders.push(orderDoc.id)

    mockEmailSender.sent = []

    // Giả lập grantEntitlementsForOrder ném lỗi bằng cách mock spy
    const entitlementsServer = await import('../../src/lib/payments/entitlements.server')
    const grantSpy = vi
      .spyOn(entitlementsServer, 'grantEntitlementsForOrder')
      .mockRejectedValueOnce(new Error('Simulated grant entitlements DB connection error'))

    try {
      await expect(
        confirmManualPayment(orderDoc.id, owner, {
          payload,
          emailSender: mockEmailSender,
        }),
      ).rejects.toThrow('Simulated grant entitlements DB connection error')

      // KHÔNG gửi email kích hoạt khi cấp quyền lỗi
      expect(mockEmailSender.sent.length).toBe(0)

      // Ghi nhận audit log grant_entitlements_failed
      const auditRes = await payload.find({
        collection: 'auditLogs',
        where: {
          and: [
            { target: { equals: `orders:${orderDoc.id}` } },
            { action: { equals: 'grant_entitlements_failed' } },
          ],
        },
        overrideAccess: true,
      })
      expect(auditRes.totalDocs).toBe(1)
    } finally {
      grantSpy.mockRestore()
    }
  })
})
