// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import config from '../../src/payload.config'
import type { SiteSetting } from '../../src/payload-types'
import { vi as viStrings } from '../../src/lib/i18n/vi'
import {
  cancelOrder,
  confirmManualPayment,
  createExperienceOrder,
  expirePendingOrders,
  getPublicOrderView,
} from '../../src/lib/payments/orders.server'
import { POST as expireOrdersCronRoute } from '../../src/app/(site)/api/cron/expire-orders/route'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

type AdminUser = NonNullable<PayloadRequest['user']>

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('Payment Backend & Order Flow (T1-12a)', () => {
  let payload: Payload
  let owner: AdminUser
  let editor: AdminUser
  let experienceProductId: number
  let mockEmailSender: MockEmailSender
  let ipCounter = 1
  const nextIp = () => `192.168.1.${ipCounter++}`

  // Quản lý bản ghi do kiểm thử tạo để dọn dẹp triệt để trong afterAll theo thứ tự FK:
  // orders -> auditLogs -> customers -> products -> users
  const createdOrders: number[] = []
  const createdCustomers: number[] = []
  const createdProducts: number[] = []
  const createdUsers: number[] = []
  let settingsBefore: SiteSetting | null = null

  const asUser = (doc: { id: number; role?: string; email?: string }) =>
    ({ ...doc, collection: 'users' }) as unknown as AdminUser

  const trackOrderAndCustomer = async (payToken?: string) => {
    if (!payToken) return null
    const res = await payload.find({
      collection: 'orders',
      where: { payToken: { equals: payToken } },
      overrideAccess: true,
    })
    if (res.totalDocs > 0) {
      const order = res.docs[0]
      if (!createdOrders.includes(order.id)) {
        createdOrders.push(order.id)
      }
      const custId =
        typeof order.customer === 'object' && order.customer !== null
          ? order.customer.id
          : Number(order.customer)
      if (custId && !createdCustomers.includes(custId)) {
        createdCustomers.push(custId)
      }
      return order
    }
    return null
  }

  const originalCronSecret = process.env.CRON_SECRET
  const originalSandbox = process.env.PAYMENT_SANDBOX
  const testCronSecret = 'test-secret-t1-12a-32bytes-padding-ok'

  beforeAll(async () => {
    payload = await getPayload({ config })
    mockEmailSender = new MockEmailSender()

    process.env.CRON_SECRET = testCronSecret
    process.env.PAYMENT_SANDBOX = 'true'

    settingsBefore = await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })

    // 1. Tạo owner và editor
    const makeUser = async (role: 'owner' | 'editor') => {
      const u = await payload.create({
        collection: 'users',
        data: {
          email: `t1-12a-${role}-${randomUUID()}@example.test`,
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

    // 2. Tạo sản phẩm coaching_trial riêng của test (isSample: false)
    const productDoc = await payload.create({
      collection: 'products',
      data: {
        name: 'Phiên trải nghiệm Growth Mirror (Test T1-12a)',
        slug: `growth-mirror-trial-test-${randomUUID()}`,
        web: 'site',
        type: 'coaching_trial',
        _status: 'published',
        price: 149000,
        saleStatus: 'on_sale',
        isSample: false,
      },
    })
    experienceProductId = productDoc.id
    createdProducts.push(productDoc.id)

    // 3. Cấu hình siteSettings với thông tin ngân hàng đầy đủ
    await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        bankBin: '970422',
        bankName: 'Ngân hàng Quân Đội (MB)',
        accountNumber: '0123456789',
        accountName: 'LUONG THI THU HUYEN',
        transferPrefix: 'TDCX',
        experienceBookingUrl: 'https://cal.com/hana-luong/growth-mirror-149k',
      },
    })
  }, 60000)

  afterAll(async () => {
    process.env.CRON_SECRET = originalCronSecret
    if (originalSandbox !== undefined) {
      process.env.PAYMENT_SANDBOX = originalSandbox
    } else {
      delete process.env.PAYMENT_SANDBOX
    }

    if (!payload) return

    // Dọn dẹp theo thứ tự khóa ngoại an toàn:
    // 1. Xóa đơn hàng do test tạo
    for (const orderId of createdOrders) {
      try {
        await payload.delete({ collection: 'orders', id: orderId, overrideAccess: true })
      } catch {}
    }
    for (const productId of createdProducts) {
      try {
        await payload.delete({
          collection: 'orders',
          where: { 'items.product': { equals: productId } },
          overrideAccess: true,
        })
      } catch {}
    }

    // 2. Xóa auditLogs do test tạo
    for (const orderId of createdOrders) {
      try {
        await payload.delete({
          collection: 'auditLogs',
          where: { target: { equals: `orders:${orderId}` } },
          overrideAccess: true,
        })
      } catch {}
    }

    // 3. Xóa customers do test tạo
    for (const custId of createdCustomers) {
      try {
        await payload.delete({ collection: 'customers', id: custId, overrideAccess: true })
      } catch {}
    }

    // 4. Xóa products do test tạo
    for (const prodId of createdProducts) {
      try {
        await payload.delete({ collection: 'products', id: prodId, overrideAccess: true })
      } catch {}
    }

    // 5. Xóa users do test tạo
    for (const userId of createdUsers) {
      try {
        await payload.delete({ collection: 'users', id: userId, overrideAccess: true })
      } catch {}
    }

    // 6. Khôi phục siteSettings
    if (settingsBefore) {
      try {
        await payload.updateGlobal({
          slug: 'siteSettings',
          data: {
            bankBin: settingsBefore.bankBin ?? null,
            bankName: settingsBefore.bankName ?? null,
            accountNumber: settingsBefore.accountNumber ?? null,
            accountName: settingsBefore.accountName ?? null,
            transferPrefix: settingsBefore.transferPrefix ?? null,
            experienceBookingUrl: settingsBefore.experienceBookingUrl ?? null,
          },
        })
      } catch {}
    }
  })

  describe('Tạo đơn hàng (createExperienceOrder)', () => {
    it('client gửi price: 1 thì đơn hàng vẫn lấy giá DB (149.000đ)', async () => {
      const email = `client-price-test-${randomUUID()}@example.test`
      const result = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Nguyễn Văn Test',
          email,
          phone: '0901234567',
          need: 'Cần định hướng bước chuyển sự nghiệp',
          termsAccepted: true,
          // CLIENT CỐ TÌNH GỬI GIÁ 1 ĐỒNG
          price: 1,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )

      expect(result.success).toBe(true)
      expect(result.payToken).toBeDefined()

      const order = await trackOrderAndCustomer(result.payToken)
      expect(order).not.toBeNull()

      // REVIEW-REQUIRED: Giá đơn hàng lấy từ DB qua getEffectivePrice (149.000đ), không lấy giá client gửi
      expect(order!.total).toBe(149000)
      expect(order!.subtotal).toBe(149000)
      expect(order!.paymentStatus).toBe('pending')
      expect(order!.termsAcceptedAt).toBeDefined()
      expect(order!.customerNeed).toBe('Cần định hướng bước chuyển sự nghiệp')
    })

    it('có 2 sản phẩm coaching_trial giá khác nhau -> đơn lấy đúng giá của productId; productId của loại khác -> lỗi', async () => {
      // 1. Tạo sản phẩm coaching_trial thứ 2 với giá 199.000đ
      const product2 = await payload.create({
        collection: 'products',
        data: {
          name: 'Phiên trải nghiệm Growth Mirror VIP',
          slug: `trial-vip-${randomUUID()}`,
          web: 'site',
          type: 'coaching_trial',
          _status: 'published',
          price: 199000,
          saleStatus: 'on_sale',
          isSample: false,
        },
      })
      createdProducts.push(product2.id)

      // 2. Tạo sản phẩm loại khác (ebook)
      const ebookProduct = await payload.create({
        collection: 'products',
        data: {
          name: 'Sách điện tử cảm xúc',
          slug: `ebook-test-${randomUUID()}`,
          web: 'site',
          type: 'ebook',
          _status: 'published',
          price: 50000,
          saleStatus: 'on_sale',
          isSample: false,
        },
      })
      createdProducts.push(ebookProduct.id)

      // Đơn 1: chọn experienceProductId (149.000đ)
      const res1 = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Gói 1',
          email: `choose-p1-${randomUUID()}@example.test`,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order1 = await trackOrderAndCustomer(res1.payToken)
      expect(order1?.total).toBe(149000)
      const item1 = order1?.items?.[0]
      const item1ProdId = typeof item1?.product === 'object' ? item1.product.id : item1?.product
      expect(item1ProdId).toBe(experienceProductId)

      // Đơn 2: chọn product2.id (199.000đ)
      const res2 = await createExperienceOrder(
        {
          productId: product2.id,
          name: 'Khách Gói 2',
          email: `choose-p2-${randomUUID()}@example.test`,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order2 = await trackOrderAndCustomer(res2.payToken)
      expect(order2?.total).toBe(199000)
      const item2 = order2?.items?.[0]
      const item2ProdId = typeof item2?.product === 'object' ? item2.product.id : item2?.product
      expect(item2ProdId).toBe(product2.id)

      // Đặt đơn với productId là ebook (loại khác) -> báo lỗi productNotFound
      await expect(
        createExperienceOrder(
          {
            productId: ebookProduct.id,
            name: 'Khách Chọn Ebook',
            email: `wrong-type-${randomUUID()}@example.test`,
            termsAccepted: true,
          },
          { ip: nextIp() },
          { payload, emailSender: mockEmailSender },
        ),
      ).rejects.toThrow(viStrings.payment.errors.productNotFound)

      // Đặt đơn với productId không tồn tại -> báo lỗi productNotFound
      await expect(
        createExperienceOrder(
          {
            productId: 99999999,
            name: 'Khách Sai ID',
            email: `not-exist-${randomUUID()}@example.test`,
            termsAccepted: true,
          },
          { ip: nextIp() },
          { payload, emailSender: mockEmailSender },
        ),
      ).rejects.toThrow(viStrings.payment.errors.productNotFound)
    })

    it('sản phẩm có saleStatus = consult / hidden / coming_soon -> từ chối với lỗi tiếng Việt', async () => {
      const consultProduct = await payload.create({
        collection: 'products',
        data: {
          name: 'Phiên tư vấn chuyên sâu',
          slug: `trial-consult-${randomUUID()}`,
          web: 'site',
          type: 'coaching_trial',
          _status: 'published',
          price: 250000,
          saleStatus: 'consult',
          isSample: false,
        },
      })
      createdProducts.push(consultProduct.id)

      await expect(
        createExperienceOrder(
          {
            productId: consultProduct.id,
            name: 'Khách Consult',
            email: `consult-${randomUUID()}@example.test`,
            termsAccepted: true,
          },
          { ip: nextIp() },
          { payload, emailSender: mockEmailSender },
        ),
      ).rejects.toThrow(viStrings.payment.errors.productNotForSale)
    })

    it('thiếu ô đồng ý điều khoản -> lỗi tiếng Việt, không tạo đơn', async () => {
      const email = `no-terms-${randomUUID()}@example.test`

      await expect(
        createExperienceOrder(
          {
            productId: experienceProductId,
            name: 'Trần Thị Thiếu',
            email,
            termsAccepted: false,
          },
          { ip: nextIp() },
          { payload, emailSender: mockEmailSender },
        ),
      ).rejects.toThrow(viStrings.payment.validation.termsAcceptedRequired)

      const customerQuery = await payload.find({
        collection: 'customers',
        where: { email: { equals: email } },
        overrideAccess: true,
      })
      expect(customerQuery.totalDocs).toBe(0)
    })

    it('thiếu thông tin ngân hàng trong SiteSettings -> lỗi cấu hình tiếng Việt, không tạo đơn', async () => {
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: {
          bankBin: '',
        },
      })

      try {
        await expect(
          createExperienceOrder(
            {
              productId: experienceProductId,
              name: 'Lê Văn Ngân Hàng',
              email: `no-bank-${randomUUID()}@example.test`,
              termsAccepted: true,
            },
            { ip: nextIp() },
            { payload, emailSender: mockEmailSender },
          ),
        ).rejects.toThrow(viStrings.payment.errors.bankConfigMissing)
      } finally {
        await payload.updateGlobal({
          slug: 'siteSettings',
          data: {
            bankBin: '970422',
          },
        })
      }
    })

    it('trường ẩn honeypot có giá trị -> trả về thành công giả lập, không tạo đơn trong DB', async () => {
      const email = `bot-honeypot-${randomUUID()}@example.test`
      const result = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Spam Bot',
          email,
          termsAccepted: true,
          honeypot: 'i-am-a-bot',
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )

      expect(result.success).toBe(true)
      expect(result.fake).toBe(true)

      const orderQuery = await payload.find({
        collection: 'orders',
        where: { payToken: { equals: result.payToken } },
        overrideAccess: true,
      })
      expect(orderQuery.totalDocs).toBe(0)
    })
  })

  describe('Xem đơn công khai (getPublicOrderView)', () => {
    it('payToken sai hoặc không tồn tại -> trả về null', async () => {
      const invalidView = await getPublicOrderView('non-existent-token-12345', { payload })
      expect(invalidView).toBeNull()

      const emptyView = await getPublicOrderView('', { payload })
      expect(emptyView).toBeNull()
    })

    it('payToken đúng -> trả về DTO an toàn, tuyệt đối không lộ email hay SĐT khách hàng', async () => {
      const email = `privacy-test-${randomUUID()}@example.test`
      const phone = '0988776655'

      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Nguyễn Bảo Mật',
          email,
          phone,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      await trackOrderAndCustomer(createdRes.payToken)

      const view = await getPublicOrderView(createdRes.payToken, { payload })
      expect(view).not.toBeNull()
      expect(view?.amount).toBe(149000)
      expect(view?.status).toBe('pending')
      expect(view?.bankInfo.bankBin).toBe('970422')
      expect(view?.bankInfo.accountNumber).toBe('0123456789')
      expect(view?.bankInfo.accountName).toBe('LUONG THI THU HUYEN')
      expect(view?.qrPayload).toContain('5406149000')
      expect(view?.qrSvg).toContain('<svg')
      expect(view?.sandbox).toBe(true)
      expect(view?.sandboxNotice).toBe(viStrings.payment.sandboxNotice)

      // REVIEW-REQUIRED: DTO công khai không được chứa email hoặc số điện thoại của khách hàng
      const viewAny = view as unknown as Record<string, unknown>
      expect(viewAny.email).toBeUndefined()
      expect(viewAny.phone).toBeUndefined()
      expect(viewAny.customer).toBeUndefined()
      expect(viewAny.id).toBeUndefined()
    })
  })

  describe('Xác nhận thủ công & Hủy đơn (confirmManualPayment & cancelOrder)', () => {
    it('tài khoản editor gọi confirmManualPayment -> bị từ chối với lỗi quyền', async () => {
      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Chờ Duyệt',
          email: `editor-reject-${randomUUID()}@example.test`,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()

      await expect(
        confirmManualPayment(order!.id, editor, { payload, emailSender: mockEmailSender }),
      ).rejects.toThrow(viStrings.payment.errors.unauthorized)
    })

    it('tài khoản editor gọi cancelOrder -> bị từ chối với lỗi quyền', async () => {
      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Hủy Editor',
          email: `editor-cancel-${randomUUID()}@example.test`,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()

      await expect(cancelOrder(order!.id, editor, 'Lý do hủy', { payload })).rejects.toThrow(
        viStrings.payment.errors.unauthorized,
      )
    })

    it('owner xác nhận 2 lần tuần tự -> idempotent: 1 email gửi, paidAt không đổi, 2 dòng audit log', async () => {
      mockEmailSender.sent = []
      const customerEmail = `owner-confirm-${randomUUID()}@example.test`

      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Hàng Thật',
          email: customerEmail,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()

      // Lần 1: Owner xác nhận
      const confirmed1 = (await confirmManualPayment(order!.id, owner, {
        payload,
        emailSender: mockEmailSender,
      })) as { id: number; paymentStatus: string; paidAt: string; deliveryStatus: string }

      expect(confirmed1.paymentStatus).toBe('paid')
      expect(confirmed1.paidAt).toBeDefined()
      const firstPaidAt = confirmed1.paidAt

      expect(mockEmailSender.sent.length).toBe(1)
      expect(mockEmailSender.sent[0].to).toBe(customerEmail)
      expect(mockEmailSender.sent[0].subject).toContain('Xác nhận thanh toán')

      const orderAfter1 = await payload.findByID({
        collection: 'orders',
        id: order!.id,
        overrideAccess: true,
      })
      expect(orderAfter1.deliveryStatus).toBe('email_sent')

      // Lần 2: Owner xác nhận lại (trùng lặp)
      const confirmed2 = (await confirmManualPayment(order!.id, owner, {
        payload,
        emailSender: mockEmailSender,
      })) as { id: number; paymentStatus: string; paidAt: string }

      expect(confirmed2.paymentStatus).toBe('paid')
      // REVIEW-REQUIRED: paidAt không đổi và không gửi email lần 2
      expect(confirmed2.paidAt).toBe(firstPaidAt)
      expect(mockEmailSender.sent.length).toBe(1)

      // Kiểm tra auditLogs: 2 dòng log (dòng 2 ghi "đã xác nhận trước đó")
      const auditQuery = await payload.find({
        collection: 'auditLogs',
        where: { target: { equals: `orders:${order!.id}` } },
        sort: 'createdAt',
        overrideAccess: true,
      })

      expect(auditQuery.totalDocs).toBe(2)
      expect(auditQuery.docs[0].action).toBe('confirm_manual_payment')
      expect(auditQuery.docs[1].action).toBe('confirm_manual_payment_duplicate')
      const afterJson = auditQuery.docs[1].after as Record<string, unknown>
      expect(afterJson.note).toBe('đã xác nhận trước đó')
    })

    it('gọi confirmManualPayment 2 lần đồng thời (Promise.all) -> đúng 1 email được gửi (chống race condition)', async () => {
      mockEmailSender.sent = []
      const customerEmail = `race-confirm-${randomUUID()}@example.test`

      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Race Condition',
          email: customerEmail,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()

      // Gọi 2 lần đồng thời bằng Promise.all
      const [res1, res2] = await Promise.all([
        confirmManualPayment(order!.id, owner, { payload, emailSender: mockEmailSender }),
        confirmManualPayment(order!.id, owner, { payload, emailSender: mockEmailSender }),
      ])

      expect(res1).toBeDefined()
      expect(res2).toBeDefined()
      const paidOrder1 = res1 as { paidAt?: string }
      const paidOrder2 = res2 as { paidAt?: string }
      expect(paidOrder1.paidAt).toBeTruthy()
      expect(paidOrder2.paidAt).toBeTruthy()
      expect(paidOrder1.paidAt).toBe(paidOrder2.paidAt)

      // REVIEW-REQUIRED: Race-safe conditional update bảo đảm đúng 1 email được gửi đi
      expect(mockEmailSender.sent.length).toBe(1)
      expect(mockEmailSender.sent[0].to).toBe(customerEmail)

      const orderAfter = await payload.findByID({
        collection: 'orders',
        id: order!.id,
        overrideAccess: true,
      })
      expect(orderAfter.paymentStatus).toBe('paid')

      // Kiểm tra auditLogs: 1 confirm_manual_payment và 1 duplicate
      const auditQuery = await payload.find({
        collection: 'auditLogs',
        where: { target: { equals: `orders:${order!.id}` } },
        sort: 'createdAt',
        overrideAccess: true,
      })
      expect(auditQuery.totalDocs).toBe(2)
      expect(auditQuery.docs[0].action).toBe('confirm_manual_payment')
      expect(auditQuery.docs[1].action).toBe('confirm_manual_payment_duplicate')
    })

    it('owner PATCH qua Local API không có context -> trạng thái không đổi; qua confirmManualPayment -> đổi', async () => {
      const customerEmail = `lock-status-${randomUUID()}@example.test`
      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Thử Đổi Trạng Thái',
          email: customerEmail,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()
      expect(order!.paymentStatus).toBe('pending')

      // Owner cố tình sửa trực tiếp paymentStatus thành 'paid' qua Local API (không truyền context paymentAction)
      const updatedWithoutContext = await payload.update({
        collection: 'orders',
        id: order!.id,
        data: {
          paymentStatus: 'paid',
        },
        user: owner,
        overrideAccess: false,
      })

      // REVIEW-REQUIRED: Trạng thái không đổi vì thiếu context.paymentAction
      expect(updatedWithoutContext.paymentStatus).toBe('pending')

      const orderInDb = await payload.findByID({
        collection: 'orders',
        id: order!.id,
        overrideAccess: true,
      })
      expect(orderInDb.paymentStatus).toBe('pending')

      // Gọi qua hàm nghiệp vụ confirmManualPayment (có context paymentAction = true)
      const confirmed = (await confirmManualPayment(order!.id, owner, {
        payload,
        emailSender: mockEmailSender,
      })) as { paymentStatus: string }

      expect(confirmed.paymentStatus).toBe('paid')

      const finalOrderInDb = await payload.findByID({
        collection: 'orders',
        id: order!.id,
        overrideAccess: true,
      })
      expect(finalOrderInDb.paymentStatus).toBe('paid')
    })

    it('tạo đơn qua REST/API không có context paymentAction -> deliveryStatus bị ép về none và payToken luôn sinh ngẫu nhiên', async () => {
      const customerDoc = await payload.create({
        collection: 'customers',
        data: {
          email: `rest-lock-${randomUUID()}@example.test`,
          name: 'Khách REST Lock',
        },
      })
      createdCustomers.push(customerDoc.id)

      // Cố tình gửi deliveryStatus = 'access_granted' và payToken tự đặt
      const customPayToken = 'predictable-client-pay-token-123'
      const createdOrder = await payload.create({
        collection: 'orders',
        data: {
          customer: customerDoc.id,
          items: [{ product: experienceProductId, price: 149000 }],
          subtotal: 149000,
          total: 149000,
          paymentStatus: 'pending',
          deliveryStatus: 'access_granted',
          payToken: customPayToken,
          termsAcceptedAt: new Date().toISOString(),
        },
        user: editor,
        overrideAccess: false,
      })
      createdOrders.push(createdOrder.id)

      // REVIEW-REQUIRED: deliveryStatus bị ép về 'none', payToken bị ghi đè thành token ngẫu nhiên
      expect(createdOrder.deliveryStatus).toBe('none')
      expect(createdOrder.payToken).not.toBe(customPayToken)
      expect(createdOrder.payToken).toBeDefined()
      expect(createdOrder.payToken!.length).toBeGreaterThan(10)
    })

    it('editor không sửa được số tiền đơn; owner chỉ sửa được khi đơn còn pending', async () => {
      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Khóa Số Tiền',
          email: `lock-amount-${randomUUID()}@example.test`,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()
      const originalTotal = order!.total

      // REVIEW-REQUIRED: editor đổi total / items -> bị giữ nguyên
      const byEditor = await payload.update({
        collection: 'orders',
        id: order!.id,
        data: {
          total: 1000,
          subtotal: 1000,
          items: [{ product: experienceProductId, price: 1000 }],
        },
        user: editor,
        overrideAccess: false,
      })
      expect(byEditor.total).toBe(originalTotal)
      expect(byEditor.items?.[0]?.price).toBe(originalTotal)

      // Owner sửa khi đơn còn pending -> được
      const byOwner = await payload.update({
        collection: 'orders',
        id: order!.id,
        data: { total: 99000 },
        user: owner,
        overrideAccess: false,
      })
      expect(byOwner.total).toBe(99000)

      // Sau khi paid -> owner cũng không sửa được nữa
      await confirmManualPayment(order!.id, owner, { payload, emailSender: mockEmailSender })
      const afterPaid = await payload.update({
        collection: 'orders',
        id: order!.id,
        data: { total: 5000 },
        user: owner,
        overrideAccess: false,
      })
      expect(afterPaid.total).toBe(99000)
      expect(afterPaid.paymentStatus).toBe('paid')
    })

    it('không thể hủy đơn hàng đã thanh toán (tuân thủ chính sách không hoàn tiền AGENTS 14)', async () => {
      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Đã Trả Tiền',
          email: `no-refund-${randomUUID()}@example.test`,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()

      await confirmManualPayment(order!.id, owner, { payload, emailSender: mockEmailSender })

      // REVIEW-REQUIRED: Chặn không cho hủy đơn đã paid (không có hoàn tiền)
      await expect(cancelOrder(order!.id, owner, 'Khách đòi hủy', { payload })).rejects.toThrow(
        viStrings.payment.errors.cannotCancelPaidOrder,
      )
    })

    it('xác nhận và hủy chạy đồng thời -> đúng một thao tác thành công, thao tác kia báo lỗi', async () => {
      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Race',
          email: `race-${randomUUID()}@example.test`,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()

      const [confirmRes, cancelRes] = await Promise.allSettled([
        confirmManualPayment(order!.id, owner, { payload, emailSender: mockEmailSender }),
        cancelOrder(order!.id, owner, 'Race', { payload }),
      ])

      // REVIEW-REQUIRED: không bao giờ cả hai cùng "thành công"
      expect([confirmRes.status, cancelRes.status].sort()).toEqual(['fulfilled', 'rejected'])
      const finalOrder = await payload.findByID({
        collection: 'orders',
        id: order!.id,
        overrideAccess: true,
      })
      expect(finalOrder.paymentStatus).toBe(
        confirmRes.status === 'fulfilled' ? 'paid' : 'cancelled',
      )
    })

    it('owner hủy đơn pending hợp lệ -> trạng thái chuyển sang cancelled và ghi audit log', async () => {
      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Muốn Hủy',
          email: `cancel-pending-${randomUUID()}@example.test`,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()

      const cancelled = (await cancelOrder(order!.id, owner, 'Khách đổi ý', {
        payload,
      })) as { paymentStatus: string; notes?: string }

      expect(cancelled.paymentStatus).toBe('cancelled')
      expect(cancelled.notes).toContain('Lý do hủy: Khách đổi ý')

      const auditQuery = await payload.find({
        collection: 'auditLogs',
        where: {
          and: [
            { target: { equals: `orders:${order!.id}` } },
            { action: { equals: 'cancel_order' } },
          ],
        },
        overrideAccess: true,
      })
      expect(auditQuery.totalDocs).toBe(1)
    })

    it('đơn hết hạn -> owner xác nhận -> paid, đúng 1 email, audit confirm_expired_order', async () => {
      mockEmailSender.sent = []
      const customerEmail = `expired-confirm-${randomUUID()}@example.test`

      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Chuyển Khoản Muộn',
          email: customerEmail,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()

      // Chuyển đơn sang failed (mô phỏng hết hạn 24 giờ)
      await payload.update({
        collection: 'orders',
        id: order!.id,
        data: { paymentStatus: 'failed' },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      // Owner xác nhận đơn đã hết hạn
      const confirmed = (await confirmManualPayment(order!.id, owner, {
        payload,
        emailSender: mockEmailSender,
      })) as { id: number; paymentStatus: string; paidAt: string; deliveryStatus: string }

      expect(confirmed.paymentStatus).toBe('paid')
      expect(confirmed.paidAt).toBeDefined()

      // Gửi đúng 1 email xác nhận kèm link đặt lịch
      expect(mockEmailSender.sent.length).toBe(1)
      expect(mockEmailSender.sent[0].to).toBe(customerEmail)
      expect(mockEmailSender.sent[0].subject).toContain('Xác nhận thanh toán')

      // Audit log phải ghi nhận action confirm_expired_order
      const auditQuery = await payload.find({
        collection: 'auditLogs',
        where: {
          and: [
            { target: { equals: `orders:${order!.id}` } },
            { action: { equals: 'confirm_expired_order' } },
          ],
        },
        overrideAccess: true,
      })
      expect(auditQuery.totalDocs).toBe(1)
      const beforeJson = auditQuery.docs[0].before as Record<string, unknown>
      expect(beforeJson.paymentStatus).toBe('failed')
    })

    it('editor xác nhận đơn failed -> bị từ chối với lỗi quyền; owner xác nhận đơn cancelled -> từ chối', async () => {
      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Editor Failed',
          email: `editor-failed-${randomUUID()}@example.test`,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()

      // Đưa đơn sang failed
      await payload.update({
        collection: 'orders',
        id: order!.id,
        data: { paymentStatus: 'failed' },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      // Editor không được quyền xác nhận đơn failed
      await expect(
        confirmManualPayment(order!.id, editor, { payload, emailSender: mockEmailSender }),
      ).rejects.toThrow(viStrings.payment.errors.unauthorized)

      // Hủy đơn (đưa về cancelled)
      await payload.update({
        collection: 'orders',
        id: order!.id,
        data: { paymentStatus: 'cancelled' },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      // Đơn cancelled vẫn bị từ chối dù là owner gọi
      await expect(
        confirmManualPayment(order!.id, owner, { payload, emailSender: mockEmailSender }),
      ).rejects.toThrow(viStrings.payment.errors.onlyPendingCanBeConfirmed)
    })

    it('xác nhận 2 lần đồng thời một đơn failed -> đúng 1 email (chống race condition)', async () => {
      mockEmailSender.sent = []
      const customerEmail = `race-failed-${randomUUID()}@example.test`

      const createdRes = await createExperienceOrder(
        {
          productId: experienceProductId,
          name: 'Khách Race Failed',
          email: customerEmail,
          termsAccepted: true,
        },
        { ip: nextIp() },
        { payload, emailSender: mockEmailSender },
      )
      const order = await trackOrderAndCustomer(createdRes.payToken)
      expect(order).not.toBeNull()

      // Đưa đơn sang failed
      await payload.update({
        collection: 'orders',
        id: order!.id,
        data: { paymentStatus: 'failed' },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      // Gọi 2 lần đồng thời bằng Promise.all
      const [res1, res2] = await Promise.all([
        confirmManualPayment(order!.id, owner, { payload, emailSender: mockEmailSender }),
        confirmManualPayment(order!.id, owner, { payload, emailSender: mockEmailSender }),
      ])

      expect(res1).toBeDefined()
      expect(res2).toBeDefined()
      const paidOrder1 = res1 as { paidAt?: string }
      const paidOrder2 = res2 as { paidAt?: string }
      expect(paidOrder1.paidAt).toBeTruthy()
      expect(paidOrder2.paidAt).toBe(paidOrder1.paidAt)

      // Đúng 1 email duy nhất được gửi đi
      expect(mockEmailSender.sent.length).toBe(1)
      expect(mockEmailSender.sent[0].to).toBe(customerEmail)

      // Audit logs: 1 confirm_expired_order và 1 duplicate
      const auditQuery = await payload.find({
        collection: 'auditLogs',
        where: { target: { equals: `orders:${order!.id}` } },
        sort: 'createdAt',
        overrideAccess: true,
      })
      expect(auditQuery.totalDocs).toBe(2)
      expect(auditQuery.docs[0].action).toBe('confirm_expired_order')
      expect(auditQuery.docs[1].action).toBe('confirm_manual_payment_duplicate')
    })

    it('expirePendingOrders chạy cùng lúc với confirmManualPayment trên một đơn pending -> kết quả cuối luôn là paid, không lỗi, đúng 1 email', async () => {
      mockEmailSender.sent = []
      const customerEmail = `race-expire-confirm-${randomUUID()}@example.test`
      const pastTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

      const customerDoc = await payload.create({
        collection: 'customers',
        data: {
          email: customerEmail,
          name: 'Khách Đua Lệnh Hết Hạn',
        },
      })
      createdCustomers.push(customerDoc.id)

      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: customerDoc.id,
          items: [{ product: experienceProductId, price: 149000 }],
          subtotal: 149000,
          total: 149000,
          paymentStatus: 'pending',
          termsAcceptedAt: pastTime,
          createdAt: pastTime,
        },
      })
      createdOrders.push(order.id)

      // Chạy đồng thời expirePendingOrders và confirmManualPayment
      const now = new Date()
      const [expireRes, confirmRes] = await Promise.all([
        expirePendingOrders(now, { payload, emailSender: mockEmailSender }),
        confirmManualPayment(order.id, owner, { payload, emailSender: mockEmailSender, now }),
      ])

      expect(expireRes).toBeDefined()
      expect(confirmRes).toBeDefined()

      // Trạng thái cuối cùng của đơn trong cơ sở dữ liệu LUÔN là 'paid'
      const finalOrder = await payload.findByID({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
      })
      expect(finalOrder.paymentStatus).toBe('paid')
      expect(finalOrder.paidAt).toBeTruthy()

      // Email xác nhận thanh toán chỉ gửi đúng 1 lần
      const paidEmails = mockEmailSender.sent.filter((e) =>
        e.subject.includes('Xác nhận thanh toán'),
      )
      expect(paidEmails.length).toBe(1)
      expect(paidEmails[0].to).toBe(customerEmail)
    })
  })

  describe('Đóng đơn quá hạn 24 giờ & Cron Route', () => {
    it('expirePendingOrders chỉ đóng đơn quá 24h và gửi email nếu bật consentMarketing', async () => {
      mockEmailSender.sent = []
      const customerEmailMarketing = `marketing-consent-${randomUUID()}@example.test`

      // 1. Tạo customer có consentMarketing = true
      const customerDoc = await payload.create({
        collection: 'customers',
        data: {
          email: customerEmailMarketing,
          name: 'Khách Đồng Ý Nhận Tin',
          consentMarketing: true,
        },
      })
      createdCustomers.push(customerDoc.id)

      // 2. Tạo đơn A: mới tạo -> không bị expire
      const orderA = await payload.create({
        collection: 'orders',
        data: {
          customer: customerDoc.id,
          items: [{ product: experienceProductId, price: 149000 }],
          subtotal: 149000,
          total: 149000,
          paymentStatus: 'pending',
          termsAcceptedAt: new Date().toISOString(),
        },
      })
      createdOrders.push(orderA.id)

      // 3. Tạo đơn B: tạo cách đây 25 giờ -> bị expire
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      const orderB = await payload.create({
        collection: 'orders',
        data: {
          customer: customerDoc.id,
          items: [{ product: experienceProductId, price: 149000 }],
          subtotal: 149000,
          total: 149000,
          paymentStatus: 'pending',
          termsAcceptedAt: twentyFiveHoursAgo,
          createdAt: twentyFiveHoursAgo,
        },
      })
      createdOrders.push(orderB.id)

      // 4. Tạo đơn C: đã thanh toán (paid) cách đây 25 giờ -> KHÔNG bị expire
      const orderC = await payload.create({
        collection: 'orders',
        data: {
          customer: customerDoc.id,
          items: [{ product: experienceProductId, price: 149000 }],
          subtotal: 149000,
          total: 149000,
          paymentStatus: 'paid',
          paidAt: twentyFiveHoursAgo,
          termsAcceptedAt: twentyFiveHoursAgo,
          createdAt: twentyFiveHoursAgo,
        },
        context: { paymentAction: true },
      })
      createdOrders.push(orderC.id)

      // Chạy expirePendingOrders
      const result = await expirePendingOrders(new Date(), {
        payload,
        emailSender: mockEmailSender,
      })

      expect(result.expiredCount).toBeGreaterThanOrEqual(1)

      // Kiểm tra đơn A: vẫn pending (chưa đủ 24h)
      const checkA = await payload.findByID({
        collection: 'orders',
        id: orderA.id,
        overrideAccess: true,
      })
      expect(checkA.paymentStatus).toBe('pending')

      // Kiểm tra đơn B: đã thành failed (pending và > 24h)
      const checkB = await payload.findByID({
        collection: 'orders',
        id: orderB.id,
        overrideAccess: true,
      })
      expect(checkB.paymentStatus).toBe('failed')

      // Kiểm tra đơn C: vẫn giữ nguyên trạng thái paid (dù > 24h)
      const checkC = await payload.findByID({
        collection: 'orders',
        id: orderC.id,
        overrideAccess: true,
      })
      expect(checkC.paymentStatus).toBe('paid')

      // Đã gửi email nhắc hẹn vì khách có consentMarketing
      const reminderEmail = mockEmailSender.sent.find(
        (m) => m.to === customerEmailMarketing && m.subject.includes('Nhắc hẹn phiên trải nghiệm'),
      )
      expect(reminderEmail).toBeDefined()
    })

    it('route cron: thiếu hoặc sai Authorization header -> 401; đúng header -> 200', async () => {
      // 1. Không có header
      const reqNoAuth = new Request('http://localhost:3000/api/cron/expire-orders', {
        method: 'POST',
      })
      const resNoAuth = await expireOrdersCronRoute(reqNoAuth)
      expect(resNoAuth.status).toBe(401)

      // 2. Sai Bearer token
      const reqWrongAuth = new Request('http://localhost:3000/api/cron/expire-orders', {
        method: 'POST',
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      })
      const resWrongAuth = await expireOrdersCronRoute(reqWrongAuth)
      expect(resWrongAuth.status).toBe(401)

      // 3. Đúng Bearer token
      const reqValidAuth = new Request('http://localhost:3000/api/cron/expire-orders', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${testCronSecret}`,
        },
      })
      const resValidAuth = await expireOrdersCronRoute(reqValidAuth)
      expect(resValidAuth.status).toBe(200)
      const data = (await resValidAuth.json()) as { success: boolean; expiredCount: number }
      expect(data.success).toBe(true)
    })
  })
})
