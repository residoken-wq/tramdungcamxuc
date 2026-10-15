// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { SiteSetting, User } from '../../src/payload-types'
import { createDigitalToolOrder, markOrderPaid } from '../../src/lib/payments/orders.server'
import * as entitlementsServer from '../../src/lib/payments/entitlements.server'
import { resendPaymentConfirmationAction } from '../../src/lib/payments/actions'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'
import { vi as viStrings } from '../../src/lib/i18n/vi'

type AuthResult = Awaited<ReturnType<Payload['auth']>>

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('T2-19: Payment Transactions & Entitlement Atomicity', () => {
  let payload: Payload
  let payload2: Payload
  let ownerUser: User
  let editorUser: User
  let mockEmailSender: MockEmailSender
  let ipCounter = 200
  const nextIp = () => `192.168.19.${ipCounter++}`

  const createdCustomers: number[] = []
  const createdProducts: number[] = []
  const createdOrders: number[] = []
  const createdUsers: number[] = []
  let settingsBefore: SiteSetting | null = null

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    payload2 = await getPayload({ config: await config })
    mockEmailSender = new MockEmailSender()

    settingsBefore = await payload.findGlobal({
      slug: 'siteSettings',
      overrideAccess: true,
    })

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

    ownerUser = (await payload.create({
      collection: 'users',
      data: {
        email: `t2-19-owner-${randomUUID()}@example.test`,
        password: `TestP@ss!${randomUUID()}`,
        role: 'owner',
      },
      overrideAccess: true,
    })) as User
    createdUsers.push(ownerUser.id)

    editorUser = (await payload.create({
      collection: 'users',
      data: {
        email: `t2-19-editor-${randomUUID()}@example.test`,
        password: `TestP@ss!${randomUUID()}`,
        role: 'editor',
      },
      overrideAccess: true,
    })) as User
    createdUsers.push(editorUser.id)
  })

  afterAll(async () => {
    // 1. Xóa auditLogs cho các đơn hàng đã tạo
    for (const orderId of createdOrders) {
      try {
        await payload.delete({
          collection: 'auditLogs',
          where: { target: { equals: `orders:${orderId}` } },
          overrideAccess: true,
        })
      } catch {}
      try {
        await payload.delete({
          collection: 'paymentEvents',
          where: { order: { equals: orderId } },
          overrideAccess: true,
        })
      } catch {}
    }

    // 2. Dọn dẹp quan hệ của khách hàng theo thứ tự FK:
    // trialReminders -> entitlements -> orders -> customers
    for (const customerId of createdCustomers) {
      try {
        await payload.delete({
          collection: 'trialReminders',
          where: { 'entitlement.customer': { equals: customerId } },
          overrideAccess: true,
        })
      } catch {}
      try {
        await payload.delete({
          collection: 'entitlements',
          where: { customer: { equals: customerId } },
          overrideAccess: true,
        })
      } catch {}
      try {
        await payload.delete({
          collection: 'orders',
          where: { customer: { equals: customerId } },
          overrideAccess: true,
        })
      } catch {}
      try {
        await payload.delete({
          collection: 'customers',
          id: customerId,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      } catch {}
    }

    // 3. Xóa sản phẩm
    for (const productId of createdProducts) {
      try {
        await payload.delete({
          collection: 'orders',
          where: { 'items.product': { equals: productId } },
          overrideAccess: true,
        })
      } catch {}
      try {
        await payload.delete({
          collection: 'products',
          id: productId,
          overrideAccess: true,
        })
      } catch {}
    }

    // 4. Xóa users
    for (const userId of createdUsers) {
      try {
        await payload.delete({
          collection: 'users',
          id: userId,
          overrideAccess: true,
        })
      } catch {}
    }

    // 5. Khôi phục siteSettings
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
      } catch {}
    }
  })

  // Helper tạo khách hàng
  async function createTestCustomer(emailPrefix: string) {
    const customer = await payload.create({
      collection: 'customers',
      data: {
        email: `t2-19-${emailPrefix}-${randomUUID()}@example.test`,
        name: `[TEST] Khách hàng ${emailPrefix}`,
      },
      overrideAccess: true,
    })
    createdCustomers.push(customer.id)
    return customer
  }

  // Helper tạo sản phẩm công cụ số
  async function createTestDigitalToolProduct(nameSuffix: string) {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: `[TEST] Công cụ số ${nameSuffix}`,
        slug: `test-tool-${nameSuffix}-${randomUUID().slice(0, 8)}`,
        type: 'digital_tool',
        web: 'habit',
        price: 250000,
        salePrice: 178000,
        saleStatus: 'on_sale',
        _status: 'published',
      },
      overrideAccess: true,
    })
    createdProducts.push(product.id)
    return product
  }

  // 1. Hai lệnh createDigitalToolOrder song song cùng khách + sản phẩm (2 payload/kết nối) -> đúng 1 đơn pending
  it('1. hai lệnh createDigitalToolOrder song song cùng khách + sản phẩm (2 kết nối) -> đúng 1 đơn pending duy nhất', async () => {
    const customer = await createTestCustomer('parallel-order')
    const product = await createTestDigitalToolProduct('parallel-1')

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
        { payload: payload2 },
      ),
    ])

    expect(res1.payToken).toBe(res2.payToken)

    // Xác minh trên DB chỉ có đúng 1 đơn hàng cho khách này
    const allOrders = await payload.find({
      collection: 'orders',
      where: { customer: { equals: customer.id } },
      overrideAccess: true,
    })
    expect(allOrders.totalDocs).toBe(1)
    expect(allOrders.docs[0].paymentStatus).toBe('pending')
    createdOrders.push(allOrders.docs[0].id)
  })

  // 2. Cấp quyền ném lỗi -> rollback cả đơn, đơn vẫn pending, không có entitlement, có audit grant_entitlements_failed; gọi lại -> paid + 1 entitlement
  it('2. cấp quyền ném lỗi -> rollback cả đơn, đơn vẫn pending, 0 entitlement, audit grant_entitlements_failed; gọi lại -> paid + 1 entitlement', async () => {
    const customer = await createTestCustomer('grant-err')
    const product = await createTestDigitalToolProduct('grant-err-tool')

    const res = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )
    const orderDoc = await payload.find({
      collection: 'orders',
      where: { payToken: { equals: res.payToken } },
      overrideAccess: true,
    })
    const orderId = orderDoc.docs[0].id
    createdOrders.push(orderId)

    // Giả lập lỗi DB trong grantEntitlementsForOrder
    const grantSpy = vi
      .spyOn(entitlementsServer, 'grantEntitlementsForOrder')
      .mockRejectedValueOnce(new Error('Simulated grant entitlements DB crash'))

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      markOrderPaid(orderId, {
        payload,
        source: 'manual',
        actorId: ownerUser.id,
      }),
    ).rejects.toThrow('Simulated grant entitlements DB crash')

    grantSpy.mockRestore()
    errorSpy.mockRestore()

    // 1. Kiểm tra đơn hàng vẫn pending và paidAt vẫn null (đã rollback hoàn toàn)
    const orderAfterError = await payload.findByID({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
    })
    expect(orderAfterError.paymentStatus).toBe('pending')
    expect(orderAfterError.paidAt).toBeNull()

    // 2. Không có entitlement nào được cấp
    const entitlementsAfterError = await payload.find({
      collection: 'entitlements',
      where: { customer: { equals: customer.id } },
      overrideAccess: true,
    })
    expect(entitlementsAfterError.totalDocs).toBe(0)

    // 3. Có audit log grant_entitlements_failed
    const auditLogsAfterError = await payload.find({
      collection: 'auditLogs',
      where: {
        and: [
          { target: { equals: `orders:${orderId}` } },
          { action: { equals: 'grant_entitlements_failed' } },
        ],
      },
      overrideAccess: true,
    })
    expect(auditLogsAfterError.totalDocs).toBe(1)

    // 4. Gọi lại markOrderPaid sau khi hết lỗi -> thành công, paid + 1 entitlement
    const confirmed = await markOrderPaid(orderId, {
      payload,
      source: 'manual',
      actorId: ownerUser.id,
      emailSender: mockEmailSender,
    })
    expect(confirmed.paymentStatus).toBe('paid')

    const entitlementsAfterRetry = await payload.find({
      collection: 'entitlements',
      where: { customer: { equals: customer.id } },
      overrideAccess: true,
    })
    expect(entitlementsAfterRetry.totalDocs).toBe(1)
    expect(entitlementsAfterRetry.docs[0].status).toBe('active')
  })

  // 3. Email ném lỗi -> paid + có entitlement + audit confirmation_email_failed; resendPaymentConfirmationAction bởi owner -> email_sent; bởi editor / khách -> từ chối, không gửi
  it('3. email ném lỗi -> paid + có entitlement + audit confirmation_email_failed; resendPaymentConfirmationAction bởi owner -> email_sent; bởi editor/khách -> từ chối', async () => {
    const customer = await createTestCustomer('email-err')
    const product = await createTestDigitalToolProduct('email-err-tool')

    const res = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )
    const orderDoc = await payload.find({
      collection: 'orders',
      where: { payToken: { equals: res.payToken } },
      overrideAccess: true,
    })
    const orderId = orderDoc.docs[0].id
    createdOrders.push(orderId)

    const failingEmailSender: EmailSender = {
      async send() {
        throw new Error('Simulated SMTP timeout')
      },
    }

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Gọi markOrderPaid với emailSender bị lỗi
    const confirmed = await markOrderPaid(orderId, {
      payload,
      source: 'manual',
      actorId: ownerUser.id,
      emailSender: failingEmailSender,
    })

    errorSpy.mockRestore()

    // 1. Đơn vẫn paid và có entitlement
    expect(confirmed.paymentStatus).toBe('paid')
    expect(confirmed.deliveryStatus).toBe('access_granted')

    const entitlements = await payload.find({
      collection: 'entitlements',
      where: { customer: { equals: customer.id } },
      overrideAccess: true,
    })
    expect(entitlements.totalDocs).toBe(1)
    expect(entitlements.docs[0].status).toBe('active')

    // 2. Có audit log confirmation_email_failed
    const auditEmailFailed = await payload.find({
      collection: 'auditLogs',
      where: {
        and: [
          { target: { equals: `orders:${orderId}` } },
          { action: { equals: 'confirmation_email_failed' } },
        ],
      },
      overrideAccess: true,
    })
    expect(auditEmailFailed.totalDocs).toBe(1)

    // 3. Khách vãng lai (không đăng nhập) gọi resendPaymentConfirmationAction -> từ chối
    const guestAuthSpy = vi
      .spyOn(payload, 'auth')
      .mockResolvedValueOnce({ user: null } as unknown as AuthResult)
    const guestRes = await resendPaymentConfirmationAction(orderId, { payload })
    guestAuthSpy.mockRestore()
    expect(guestRes.success).toBe(false)
    expect(guestRes.message).toBe(viStrings.payment.errors.unauthorized)

    // 4. Editor (không phải owner) gọi resendPaymentConfirmationAction -> từ chối
    const editorAuthSpy = vi.spyOn(payload, 'auth').mockResolvedValueOnce({
      user: { ...editorUser, collection: 'users' },
    } as unknown as AuthResult)
    const editorRes = await resendPaymentConfirmationAction(orderId, { payload })
    editorAuthSpy.mockRestore()
    expect(editorRes.success).toBe(false)
    expect(editorRes.message).toBe(viStrings.payment.errors.unauthorized)

    // 5. Owner gọi resendPaymentConfirmationAction -> thành công
    const ownerAuthSpy = vi.spyOn(payload, 'auth').mockResolvedValueOnce({
      user: { ...ownerUser, collection: 'users' },
    } as unknown as AuthResult)
    const ownerRes = await resendPaymentConfirmationAction(orderId, { payload })
    ownerAuthSpy.mockRestore()
    expect(ownerRes.success).toBe(true)
    expect(ownerRes.message).toBe(viStrings.payment.success.resendConfirmation)

    // 6. Kiểm tra deliveryStatus chuyển thành email_sent và có audit log resend_payment_confirmation
    const orderAfterResend = await payload.findByID({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
    })
    expect(orderAfterResend.deliveryStatus).toBe('email_sent')

    const auditResend = await payload.find({
      collection: 'auditLogs',
      where: {
        and: [
          { target: { equals: `orders:${orderId}` } },
          { action: { equals: 'resend_payment_confirmation' } },
        ],
      },
      overrideAccess: true,
    })
    expect(auditResend.totalDocs).toBe(1)

    // 7. Gọi lại lần 2 khi đã email_sent -> bị chặn (không gửi lại)
    const ownerAuthSpy2 = vi.spyOn(payload, 'auth').mockResolvedValueOnce({
      user: { ...ownerUser, collection: 'users' },
    } as unknown as AuthResult)
    const ownerRes2 = await resendPaymentConfirmationAction(orderId, { payload })
    ownerAuthSpy2.mockRestore()
    expect(ownerRes2.success).toBe(false)
    expect(ownerRes2.message).toBe(viStrings.payment.errors.alreadyEmailSent)
  })

  // 4. markOrderPaid gọi 2 lần song song -> 1 entitlement, 1 email
  it('4. markOrderPaid gọi 2 lần song song -> đúng 1 entitlement và đúng 1 email', async () => {
    const customer = await createTestCustomer('parallel-pay')
    const product = await createTestDigitalToolProduct('parallel-pay-tool')

    const res = await createDigitalToolOrder(
      customer.id,
      product.slug,
      { termsAccepted: true, ip: nextIp() },
      { payload },
    )
    const orderDoc = await payload.find({
      collection: 'orders',
      where: { payToken: { equals: res.payToken } },
      overrideAccess: true,
    })
    const orderId = orderDoc.docs[0].id
    createdOrders.push(orderId)

    const parallelEmailSender = new MockEmailSender()

    const [res1, res2] = await Promise.all([
      markOrderPaid(orderId, {
        payload,
        source: 'manual',
        actorId: ownerUser.id,
        emailSender: parallelEmailSender,
      }),
      markOrderPaid(orderId, {
        payload: payload2,
        source: 'manual',
        actorId: ownerUser.id,
        emailSender: parallelEmailSender,
      }),
    ])

    expect(res1.paymentStatus).toBe('paid')
    expect(res2.paymentStatus).toBe('paid')

    // Đúng 1 entitlement active
    const entitlements = await payload.find({
      collection: 'entitlements',
      where: { customer: { equals: customer.id } },
      overrideAccess: true,
    })
    expect(entitlements.totalDocs).toBe(1)
    expect(entitlements.docs[0].status).toBe('active')

    // Đúng 1 email được gửi
    expect(parallelEmailSender.sent.length).toBe(1)
  })
})
