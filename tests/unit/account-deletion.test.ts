// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitPlan, Order, Product } from '../../src/payload-types'
import {
  requestAccountDeletionAction,
  deleteCustomerAdminAction,
} from '../../src/lib/account/actions'
import { deleteCustomerData } from '../../src/lib/account/delete-customer.server'
import * as sessionServer from '../../src/lib/auth/session.server'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'
import { ValidationError } from 'payload'
import { hashRateLimitKey } from '../../src/lib/forms/ratelimit.server'
import { hashTrialEmail } from '../../src/lib/auth/token'
import { startTrial } from '../../src/lib/entitlements/service.server'
import { vi as viStrings } from '../../src/lib/i18n/vi'

class MockEmailSender implements EmailSender {
  public sentEmails: SendEmailParams[] = []

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sentEmails.push(params)
    return {
      success: true,
      id: `mock-email-${Date.now()}-${Math.random()}`,
    }
  }
}

describe('Account Deletion & Data Privacy (T2-16)', () => {
  let payload: Payload
  let emailSender: MockEmailSender
  const created: { collection: CollectionSlug; id: number }[] = []
  let testProduct: Product
  let ownerUser: any
  let testStartedAt: string
  let settingsBefore: any
  const trackedEmails: string[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    emailSender = new MockEmailSender()
    testStartedAt = new Date().toISOString()

    // B4: Lưu cấu hình siteSettings hiện tại và đặt giá trị test để chạy xanh trên DB sạch
    settingsBefore = await payload.findGlobal({
      slug: 'siteSettings',
      overrideAccess: true,
    })

    await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        email: 'admin@example.test',
      },
      overrideAccess: true,
    })

    // B4: Luôn tạo owner test riêng thay vì tìm owner có sẵn trong DB
    ownerUser = track(
      'users',
      (await payload.create({
        collection: 'users',
        data: {
          email: `owner-${randomUUID().slice(0, 8)}@example.test`,
          password: 'Password123!',
          role: 'owner',
        },
        overrideAccess: true,
      })) as any,
    )

    const existingProduct = await payload.find({
      collection: 'products',
      where: { slug: { equals: 'habit-tracker-so' } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingProduct.docs.length > 0) {
      testProduct = existingProduct.docs[0] as Product
    } else {
      testProduct = track(
        'products',
        (await payload.create({
          collection: 'products',
          data: {
            name: 'Habit Tracker Số',
            slug: 'habit-tracker-so',
            web: 'habit',
            type: 'digital_tool',
            trialDays: 21,
            price: 250000,
            salePrice: 178000,
            saleStatus: 'on_sale',
            _status: 'published',
          },
          overrideAccess: true,
        })) as Product,
      )
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    emailSender.sentEmails = []
  })

  afterAll(async () => {
    // B4: Khôi phục cấu hình siteSettings ban đầu
    if (settingsBefore) {
      try {
        await payload.updateGlobal({
          slug: 'siteSettings',
          data: {
            email: settingsBefore.email ?? '',
          },
          overrideAccess: true,
        })
      } catch {
        // Bỏ qua nếu lỗi
      }
    }

    // Dọn dẹp toàn bộ dữ liệu do test tạo
    for (const item of created.reverse()) {
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
        })
      } catch {
        // Bỏ qua nếu bản ghi đã được xóa trong luồng test
      }
    }

    // B4: Dọn dẹp auditLogs do test tạo
    try {
      await payload.delete({
        collection: 'auditLogs',
        where: {
          and: [
            { createdAt: { greater_than_equal: testStartedAt } },
            { action: { in: ['customer_data_deleted', 'order_cancelled_for_deletion'] } },
          ],
        },
        overrideAccess: true,
      })
    } catch {
      // Bỏ qua nếu lỗi
    }

    // B4: Dọn dẹp rateLimitHits do test tạo
    for (const em of trackedEmails) {
      try {
        const key = hashRateLimitKey('email', 'account_deletion', em)
        await payload.delete({
          collection: 'rateLimitHits',
          where: { key: { equals: key } },
          overrideAccess: true,
        })
      } catch {
        // Bỏ qua nếu lỗi
      }
    }
  })

  describe('1. Khách gửi yêu cầu xóa tài khoản (requestAccountDeletionAction)', () => {
    it('khách gửi yêu cầu 2 lần -> đúng 1 email cho Hana; khách khác không gửi hộ được', async () => {
      const email = `hoc-vien-test-01-${randomUUID().slice(0, 8)}@example.test`
      trackedEmails.push(email)
      const customer = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: {
            email,
            name: 'Học viên Test 01',
          },
          overrideAccess: true,
        })) as Customer,
      )

      // Mock session trả về khách hàng hiện tại
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      // Lần 1: gửi yêu cầu thành công, ghi deletionRequestedAt và gửi email cho admin
      const res1 = await requestAccountDeletionAction({ payload, emailSender })
      expect(res1.success).toBe(true)
      expect(res1.alreadyRequested).toBe(false)
      expect(res1.requestedAt).toBeTruthy()
      expect(emailSender.sentEmails).toHaveLength(1)

      const emailSent = emailSender.sentEmails[0]
      // Tiêu đề email chỉ ghi ID khách và thời điểm, không lộ email hoặc tên
      expect(emailSent.subject).toContain(`Khách hàng #${customer.id}`)
      expect(emailSent.subject).not.toContain(customer.email)
      expect(emailSent.subject).not.toContain('Học viên Test 01')

      // Kiểm tra DB đã cập nhật deletionRequestedAt
      const updatedCustomer = await payload.findByID({
        collection: 'customers',
        id: customer.id,
        overrideAccess: true,
      })
      expect(updatedCustomer?.deletionRequestedAt).toBeTruthy()

      // Lần 2: gọi lại -> thành công, alreadyRequested = true, KHÔNG gửi thêm email
      const res2 = await requestAccountDeletionAction({ payload, emailSender })
      expect(res2.success).toBe(true)
      expect(res2.alreadyRequested).toBe(true)
      expect(emailSender.sentEmails).toHaveLength(1) // Vẫn chỉ là 1 email

      // Khách khác không gửi hộ được: action lấy từ phiên, nếu không có phiên -> từ chối
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(null)
      const resUnauth = await requestAccountDeletionAction({ payload, emailSender })
      expect(resUnauth.success).toBe(false)
    })
  })

  describe('2. Hana xóa dữ liệu khách (deleteCustomerAdminAction & deleteCustomerData)', () => {
    it('editor gọi action xóa -> bị từ chối vì thiếu quyền owner', async () => {
      const email = `hoc-vien-test-02-${randomUUID().slice(0, 8)}@example.test`
      const customer = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: {
            email,
            name: 'Học viên Test 02',
          },
          overrideAccess: true,
        })) as Customer,
      )

      // Giả lập tài khoản admin vai trò editor
      vi.spyOn(payload, 'auth').mockResolvedValue({
        user: {
          id: 888,
          email: 'editor@example.test',
          role: 'editor',
          collection: 'users',
        } as any,
      } as any)

      const res = await deleteCustomerAdminAction(customer.id, email, { payload })
      expect(res.success).toBe(false)
      expect(res.message).toContain('Chỉ chủ sở hữu')
    })

    it('owner xóa khách có đủ dữ liệu -> mọi bảng con 0 bản ghi, đơn được ẩn danh giữ số tiền/paymentRef, khách khác không bị đụng', async () => {
      const emailA = `hoc-vien-test-03a-${randomUUID().slice(0, 8)}@example.test`
      const emailB = `hoc-vien-test-03b-${randomUUID().slice(0, 8)}@example.test`

      // 1. Tạo khách hàng A (đối tượng bị xóa)
      const customerA = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: { email: emailA, name: 'Học viên Test 03A' },
          overrideAccess: true,
        })) as Customer,
      )

      // 2. Tạo khách hàng B (đối tượng khác)
      const customerB = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: { email: emailB, name: 'Học viên Test 03B' },
          overrideAccess: true,
        })) as Customer,
      )

      // Tạo đầy đủ dữ liệu con cho khách A
      const planA = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            leadEmail: emailA,
            identityStatement: 'Tôi chọn bình an',
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      const checkinA = track(
        'habitCheckins',
        (await payload.create({
          collection: 'habitCheckins',
          data: { plan: planA.id, day: 1, emotion: 'joyful' },
          overrideAccess: true,
        })) as any,
      )

      const nudgeA = track(
        'trackerNudges',
        (await payload.create({
          collection: 'trackerNudges',
          data: { plan: planA.id, missedStartDay: 2, sentAt: new Date().toISOString() },
          overrideAccess: true,
        })) as any,
      )

      const certA = track(
        'certificates',
        (await payload.create({
          collection: 'certificates',
          data: { customer: customerA.id, plan: planA.id, daysCompleted: 21 },
          overrideAccess: true,
        })) as any,
      )

      const entA = track(
        'entitlements',
        (await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerA.id,
            product: testProduct.id,
            source: 'manual',
            status: 'active',
          },
          overrideAccess: true,
        })) as any,
      )

      const trialRemA = track(
        'trialReminders',
        (await payload.create({
          collection: 'trialReminders',
          data: {
            entitlement: entA.id,
            milestone: 'day_18',
            sentAt: new Date().toISOString(),
          },
          overrideAccess: true,
        })) as any,
      )

      const lessonDoc = track(
        'lessons',
        (await payload.create({
          collection: 'lessons',
          data: { title: 'Bài học test xóa tài khoản', _status: 'published' },
          overrideAccess: true,
        })) as any,
      )

      const lessonA = track(
        'lessonProgress',
        (await payload.create({
          collection: 'lessonProgress',
          data: { customer: customerA.id, lesson: lessonDoc.id, watchedPercent: 100 },
          overrideAccess: true,
        })) as any,
      )

      const eqCard = track(
        'eqCards',
        await payload.create({
          collection: 'eqCards',
          data: {
            code: `c-${randomUUID().slice(0, 6)}`,
            qrSlug: `qr-${randomUUID().slice(0, 6)}`,
          },
          overrideAccess: true,
        }),
      )

      const cardA = track(
        'savedCards',
        (await payload.create({
          collection: 'savedCards',
          data: { customer: customerA.id, card: eqCard.id, reflection: 'Suy ngẫm' },
          overrideAccess: true,
        })) as any,
      )

      const workshopRemA = track(
        'workshopReminders',
        (await payload.create({
          collection: 'workshopReminders',
          data: { customer: customerA.id, sentAt: new Date().toISOString() },
          overrideAccess: true,
        })) as any,
      )

      const leadA = track(
        'leads',
        (await payload.create({
          collection: 'leads',
          data: { email: emailA, name: 'Học viên Test 03A' },
          overrideAccess: true,
        })) as any,
      )

      const otpA = track(
        'otpCodes',
        (await payload.create({
          collection: 'otpCodes',
          data: {
            email: emailA,
            codeHash: 'hash123',
            expiresAt: new Date(Date.now() + 600000).toISOString(),
          },
          overrideAccess: true,
        })) as any,
      )

      const diagA = track(
        'diagnosticResults',
        (await payload.create({
          collection: 'diagnosticResults',
          data: { email: emailA },
          overrideAccess: true,
        })) as any,
      )

      // 2 đơn hàng cho khách A: 1 paid, 1 pending
      const orderPaidA = track(
        'orders',
        (await payload.create({
          collection: 'orders',
          data: {
            customer: customerA.id,
            items: [{ product: testProduct.id, price: 178000 }],
            subtotal: 178000,
            total: 178000,
            paymentStatus: 'pending',
            notes: 'Ghi chú đơn hàng nhạy cảm của khách A',
            customerNeed: 'Cần cải thiện thói quen',
            termsAcceptedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        })) as Order,
      )
      // Cập nhật paymentStatus paid cho đơn paid
      await payload.update({
        collection: 'orders',
        id: orderPaidA.id,
        data: { paymentStatus: 'paid', paidAt: new Date().toISOString() },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      const orderFailedA = track(
        'orders',
        (await payload.create({
          collection: 'orders',
          data: {
            customer: customerA.id,
            items: [{ product: testProduct.id, price: 178000 }],
            subtotal: 178000,
            total: 178000,
            paymentStatus: 'pending',
            notes: 'Ghi chú đơn failed',
            customerNeed: 'Đặt hẹn',
            termsAcceptedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        })) as Order,
      )
      // Cập nhật paymentStatus failed cho orderFailedA
      await payload.update({
        collection: 'orders',
        id: orderFailedA.id,
        data: { paymentStatus: 'failed' },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      // Dữ liệu cho khách B
      const planB = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: { customer: customerB.id, leadEmail: emailB, identityStatement: 'Khách B' },
          overrideAccess: true,
        })) as HabitPlan,
      )

      const orderB = track(
        'orders',
        (await payload.create({
          collection: 'orders',
          data: {
            customer: customerB.id,
            items: [{ product: testProduct.id, price: 178000 }],
            subtotal: 178000,
            total: 178000,
            paymentStatus: 'pending',
            termsAcceptedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        })) as Order,
      )

      // Giả lập tài khoản owner gọi server action
      vi.spyOn(payload, 'auth').mockResolvedValue({
        user: ownerUser as any,
      } as any)

      const res = await deleteCustomerAdminAction(customerA.id, emailA, { payload })
      expect(res.success).toBe(true)

      // Xác minh khách A đã bị xóa hoàn toàn khỏi DB
      const findCustomerA = await payload.find({
        collection: 'customers',
        where: { id: { equals: customerA.id } },
        overrideAccess: true,
      })
      expect(findCustomerA.totalDocs).toBe(0)

      // Xác minh mọi bảng con của khách A có 0 bản ghi
      const certsA = await payload.find({
        collection: 'certificates',
        where: { or: [{ customer: { equals: customerA.id } }, { plan: { equals: planA.id } }] },
        overrideAccess: true,
      })
      expect(certsA.totalDocs).toBe(0)

      const checkinsA = await payload.find({
        collection: 'habitCheckins',
        where: { plan: { equals: planA.id } },
        overrideAccess: true,
      })
      expect(checkinsA.totalDocs).toBe(0)

      const nudgesA = await payload.find({
        collection: 'trackerNudges',
        where: { plan: { equals: planA.id } },
        overrideAccess: true,
      })
      expect(nudgesA.totalDocs).toBe(0)

      const plansA = await payload.find({
        collection: 'habitPlans',
        where: {
          or: [{ customer: { equals: customerA.id } }, { leadEmail: { equals: emailA } }],
        },
        overrideAccess: true,
      })
      expect(plansA.totalDocs).toBe(0)

      const entsA = await payload.find({
        collection: 'entitlements',
        where: { customer: { equals: customerA.id } },
        overrideAccess: true,
      })
      expect(entsA.totalDocs).toBe(0)

      const trialRemCountA = await payload.find({
        collection: 'trialReminders',
        where: { entitlement: { equals: entA.id } },
        overrideAccess: true,
      })
      expect(trialRemCountA.totalDocs).toBe(0)

      const lessonsA = await payload.find({
        collection: 'lessonProgress',
        where: { customer: { equals: customerA.id } },
        overrideAccess: true,
      })
      expect(lessonsA.totalDocs).toBe(0)

      const cardsA = await payload.find({
        collection: 'savedCards',
        where: { customer: { equals: customerA.id } },
        overrideAccess: true,
      })
      expect(cardsA.totalDocs).toBe(0)

      const workshopRemsA = await payload.find({
        collection: 'workshopReminders',
        where: { customer: { equals: customerA.id } },
        overrideAccess: true,
      })
      expect(workshopRemsA.totalDocs).toBe(0)

      const leadsA = await payload.find({
        collection: 'leads',
        where: { email: { equals: emailA } },
        overrideAccess: true,
      })
      expect(leadsA.totalDocs).toBe(0)

      const otpsA = await payload.find({
        collection: 'otpCodes',
        where: { email: { equals: emailA } },
        overrideAccess: true,
      })
      expect(otpsA.totalDocs).toBe(0)

      const diagsA = await payload.find({
        collection: 'diagnosticResults',
        where: { email: { equals: emailA } },
        overrideAccess: true,
      })
      expect(diagsA.totalDocs).toBe(0)

      // Xác minh đơn hàng của khách A: vẫn còn đủ số tiền/paymentRef, nhưng customer = null, anonymizedAt có, notes & customerNeed bị xóa
      const updatedOrderPaid = await payload.findByID({
        collection: 'orders',
        id: orderPaidA.id,
        overrideAccess: true,
      })
      expect(updatedOrderPaid?.customer).toBeNull()
      expect(updatedOrderPaid?.anonymizedAt).toBeTruthy()
      expect(updatedOrderPaid?.total).toBe(178000)
      expect(updatedOrderPaid?.paymentRef).toBe(orderPaidA.paymentRef)
      expect(updatedOrderPaid?.paymentStatus).toBe('paid')
      expect(updatedOrderPaid?.notes).toBeNull()
      expect(updatedOrderPaid?.customerNeed).toBeNull()

      const updatedOrderFailed = await payload.findByID({
        collection: 'orders',
        id: orderFailedA.id,
        overrideAccess: true,
      })
      expect(updatedOrderFailed?.customer).toBeNull()
      expect(updatedOrderFailed?.anonymizedAt).toBeTruthy()
      expect(updatedOrderFailed?.paymentStatus).toBe('cancelled')
      expect(updatedOrderFailed?.total).toBe(178000)
      expect(updatedOrderFailed?.paymentRef).toBe(orderFailedA.paymentRef)
      expect(updatedOrderFailed?.notes).toBeNull()
      expect(updatedOrderFailed?.customerNeed).toBeNull()

      // Xác minh khách B không bị đụng chạm
      const findCustomerB = await payload.findByID({
        collection: 'customers',
        id: customerB.id,
        overrideAccess: true,
      })
      expect(findCustomerB).not.toBeNull()
      expect(findCustomerB?.email).toBe(emailB)

      const findPlanB = await payload.findByID({
        collection: 'habitPlans',
        id: planB.id,
        overrideAccess: true,
      })
      expect(findPlanB).not.toBeNull()

      const findOrderB = await payload.findByID({
        collection: 'orders',
        id: orderB.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(findOrderB?.customer).toBe(customerB.id)
      expect(findOrderB?.anonymizedAt).toBeNull()

      // Xác minh auditLogs được tạo, không chứa tên/email
      const auditLog = await payload.find({
        collection: 'auditLogs',
        where: { target: { equals: `customers:${customerA.id}` } },
        overrideAccess: true,
      })
      expect(auditLog.totalDocs).toBe(1)
      expect(auditLog.docs[0].action).toBe('customer_data_deleted')
      const afterJson = JSON.stringify(auditLog.docs[0].after)
      expect(afterJson).not.toContain(emailA)
      expect(afterJson).not.toContain('Học viên Test 03A')
    })

    it('giả lỗi ở giữa (spy ném lỗi) -> rollback toàn bộ, không mất bản ghi nào', async () => {
      const emailC = `hoc-vien-test-04-${randomUUID().slice(0, 8)}@example.test`
      const customerC = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: { email: emailC, name: 'Học viên Test 04' },
          overrideAccess: true,
        })) as Customer,
      )

      const planC = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: { customer: customerC.id, leadEmail: emailC, identityStatement: 'Bảo toàn' },
          overrideAccess: true,
        })) as HabitPlan,
      )

      const orderC = track(
        'orders',
        (await payload.create({
          collection: 'orders',
          data: {
            customer: customerC.id,
            items: [{ product: testProduct.id, price: 178000 }],
            subtotal: 178000,
            total: 178000,
            paymentStatus: 'pending',
            notes: 'Đơn của khách C',
            termsAcceptedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        })) as Order,
      )

      await payload.update({
        collection: 'orders',
        id: orderC.id,
        data: { paymentStatus: 'paid', paidAt: new Date().toISOString() },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      const entC = track(
        'entitlements',
        (await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerC.id,
            product: testProduct.id,
            source: 'order',
            status: 'active',
          },
          overrideAccess: true,
        })) as any,
      )

      const certC = track(
        'certificates',
        (await payload.create({
          collection: 'certificates',
          data: {
            customer: customerC.id,
            plan: planC.id,
            daysCompleted: 21,
          },
          overrideAccess: true,
        })) as any,
      )

      // B1: Giả lập lỗi ở bước CUỐI CÙNG (ghi audit log) sau khi đơn đã ẩn danh và customer đã xóa trong transaction
      const originalCreate = payload.create.bind(payload)
      const createSpy = vi.spyOn(payload, 'create').mockImplementation((async (args: any) => {
        if (args.collection === 'auditLogs' && args.data?.action === 'customer_data_deleted') {
          throw new Error('Cố tình giả lập lỗi mạng DB tại bước ghi audit log cuối cùng')
        }
        return originalCreate(args)
      }) as any)

      await expect(
        deleteCustomerData(payload, {
          customerId: customerC.id,
          confirmationEmail: emailC,
          actorUserId: ownerUser.id,
        }),
      ).rejects.toThrow()

      createSpy.mockRestore()

      // B1: Xác minh do rollback: customer, habitPlan, certificates, entitlements và order vẫn nguyên vẹn
      const checkCustomer = await payload.findByID({
        collection: 'customers',
        id: customerC.id,
        overrideAccess: true,
      })
      expect(checkCustomer).not.toBeNull()

      const checkPlan = await payload.findByID({
        collection: 'habitPlans',
        id: planC.id,
        overrideAccess: true,
      })
      expect(checkPlan).not.toBeNull()

      const checkEnt = await payload.findByID({
        collection: 'entitlements',
        id: entC.id,
        overrideAccess: true,
      })
      expect(checkEnt).not.toBeNull()

      const checkCert = await payload.findByID({
        collection: 'certificates',
        id: certC.id,
        overrideAccess: true,
      })
      expect(checkCert).not.toBeNull()

      const checkOrder = await payload.findByID({
        collection: 'orders',
        id: orderC.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(checkOrder?.customer).toBe(customerC.id)
      expect(checkOrder?.anonymizedAt).toBeNull()
      expect(checkOrder?.notes).toBe('Đơn của khách C')
    })

    it('A1: owner gọi payload.delete trực tiếp trên customers -> bị từ chối với 403', async () => {
      const email = `direct-del-${randomUUID().slice(0, 8)}@example.test`
      const customer = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: { email, name: 'Khách Xóa Trực Tiếp' },
          overrideAccess: true,
        })) as Customer,
      )

      // Gọi payload.delete trực tiếp mà không có req.context.accountDeletion -> ném lỗi 403
      await expect(
        payload.delete({
          collection: 'customers',
          id: customer.id,
          overrideAccess: true,
        }),
      ).rejects.toThrow("Dùng nút 'Xóa dữ liệu khách' để xóa đúng quy trình.")
    })

    it('A2: khách còn đơn hàng pending -> từ chối xóa, không có bản ghi nào bị thay đổi', async () => {
      const email = `pending-del-${randomUUID().slice(0, 8)}@example.test`
      const customer = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: { email, name: 'Khách Đơn Pending' },
          overrideAccess: true,
        })) as Customer,
      )

      const pendingOrder = track(
        'orders',
        (await payload.create({
          collection: 'orders',
          data: {
            customer: customer.id,
            items: [{ product: testProduct.id, price: 178000 }],
            subtotal: 178000,
            total: 178000,
            paymentStatus: 'pending',
            notes: 'Đơn pending chờ xử lý',
            termsAcceptedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        })) as Order,
      )

      const res = await deleteCustomerData(payload, {
        customerId: customer.id,
        confirmationEmail: email,
        actorUserId: ownerUser.id,
      })

      expect(res.success).toBe(false)
      expect(res.message).toContain('Khách còn 1 đơn chờ thanh toán – hủy đơn trước khi xóa')

      // Đảm bảo khách và đơn không bị đổi
      const stillCustomer = await payload.findByID({
        collection: 'customers',
        id: customer.id,
        overrideAccess: true,
      })
      expect(stillCustomer).not.toBeNull()

      const stillOrder = await payload.findByID({
        collection: 'orders',
        id: pendingOrder.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(stillOrder?.customer).toBe(customer.id)
      expect(stillOrder?.anonymizedAt).toBeNull()
      expect(stillOrder?.paymentStatus).toBe('pending')
    })

    it('A2: khách có đơn failed -> chuyển sang cancelled, ghi audit order_cancelled_for_deletion và ẩn danh', async () => {
      const email = `failed-del-${randomUUID().slice(0, 8)}@example.test`
      const customer = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: { email, name: 'Khách Đơn Failed' },
          overrideAccess: true,
        })) as Customer,
      )

      const failedOrder = track(
        'orders',
        (await payload.create({
          collection: 'orders',
          data: {
            customer: customer.id,
            items: [{ product: testProduct.id, price: 178000 }],
            subtotal: 178000,
            total: 178000,
            paymentStatus: 'pending',
            notes: 'Đơn failed',
            termsAcceptedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        })) as Order,
      )

      await payload.update({
        collection: 'orders',
        id: failedOrder.id,
        data: { paymentStatus: 'failed' },
        context: { paymentAction: true },
        overrideAccess: true,
      })

      const res = await deleteCustomerData(payload, {
        customerId: customer.id,
        confirmationEmail: email,
        actorUserId: ownerUser.id,
      })

      expect(res.success).toBe(true)

      // Đơn được chuyển sang cancelled và ẩn danh
      const updatedOrder = await payload.findByID({
        collection: 'orders',
        id: failedOrder.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(updatedOrder?.paymentStatus).toBe('cancelled')
      expect(updatedOrder?.customer).toBeNull()
      expect(updatedOrder?.anonymizedAt).toBeTruthy()
      expect(updatedOrder?.notes).toBeNull()

      // Nhật ký thao tác order_cancelled_for_deletion được ghi
      const cancelAudit = await payload.find({
        collection: 'auditLogs',
        where: {
          and: [
            { action: { equals: 'order_cancelled_for_deletion' } },
            { target: { equals: `orders:${failedOrder.id}` } },
          ],
        },
        overrideAccess: true,
      })
      expect(cancelAudit.totalDocs).toBe(1)
    })

    it('B6: khách có trial -> xóa tài khoản -> đăng ký lại cùng email (khác hoa thường) -> bị từ chối dùng thử lần 2', async () => {
      const emailOriginal = `trial-user-${randomUUID().slice(0, 8)}@example.test`
      const customer = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: { email: emailOriginal, name: 'Khách Thử Nghiệm' },
          overrideAccess: true,
        })) as Customer,
      )

      // Kích hoạt trial lần đầu -> thành công
      const trialRes1 = await startTrial(customer.id, testProduct.id, { payload })
      expect(trialRes1.success).toBe(true)

      // Xóa tài khoản khách qua deleteCustomerData
      const delRes = await deleteCustomerData(payload, {
        customerId: customer.id,
        confirmationEmail: emailOriginal,
        actorUserId: ownerUser.id,
      })
      expect(delRes.success).toBe(true)

      // Kiểm tra trialUsage đã được ghi nhận với hash
      const emailHash = hashTrialEmail(emailOriginal)
      const usageCheck = await payload.find({
        collection: 'trialUsage',
        where: {
          and: [{ emailHash: { equals: emailHash } }, { product: { equals: testProduct.id } }],
        },
        overrideAccess: true,
      })
      expect(usageCheck.totalDocs).toBe(1)
      track('trialUsage', usageCheck.docs[0] as any)

      // Tạo lại khách hàng mới cùng email nhưng KHÁC HOA THƯỜNG
      const emailRecreated = emailOriginal.toUpperCase()
      const newCustomer = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: { email: emailRecreated, name: 'Khách Đăng Ký Lại' },
          overrideAccess: true,
        })) as Customer,
      )

      // Bắt đầu dùng thử lại -> bị từ chối vì đã có trialUsage
      const trialRes2 = await startTrial(newCustomer.id, testProduct.id, { payload })
      expect(trialRes2.success).toBe(false)
      expect(trialRes2.code).toBe('TRIAL_ALREADY_USED')
      expect(trialRes2.message).toBe(viStrings.entitlement.trialAlreadyUsed)

      // Đảm bảo không có entitlement nào được tạo cho khách mới
      const entCheck = await payload.find({
        collection: 'entitlements',
        where: { customer: { equals: newCustomer.id } },
        overrideAccess: true,
      })
      expect(entCheck.totalDocs).toBe(0)
    })
  })

  describe('3. certificates.plan unique & customers.name validation', () => {
    it('certificates.plan unique: tạo 2 chứng nhận cùng kế hoạch -> ném ValidationError', async () => {
      const email = `hoc-vien-test-05-${randomUUID().slice(0, 8)}@example.test`
      const customer = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: { email, name: 'Học viên Test 05' },
          overrideAccess: true,
        })) as Customer,
      )

      const plan = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: { customer: customer.id, identityStatement: 'Định danh 1' },
          overrideAccess: true,
        })) as HabitPlan,
      )

      // Chứng nhận 1 thành công
      track(
        'certificates',
        (await payload.create({
          collection: 'certificates',
          data: { customer: customer.id, plan: plan.id, daysCompleted: 21 },
          overrideAccess: true,
        })) as any,
      )

      // Chứng nhận 2 cùng plan -> phải bị từ chối
      await expect(
        payload.create({
          collection: 'certificates',
          data: { customer: customer.id, plan: plan.id, daysCompleted: 21 },
          overrideAccess: true,
        }),
      ).rejects.toThrow(ValidationError)
    })

    it('customers.name có <script> / > 100 ký tự -> bị từ chối', async () => {
      const emailXss = `hoc-vien-test-xss-${randomUUID().slice(0, 8)}@example.test`
      await expect(
        payload.create({
          collection: 'customers',
          data: {
            email: emailXss,
            name: 'Học viên <script>alert(1)</script>',
          },
          overrideAccess: true,
        }),
      ).rejects.toThrow(ValidationError)

      const emailBraces = `hoc-vien-test-braces-${randomUUID().slice(0, 8)}@example.test`
      await expect(
        payload.create({
          collection: 'customers',
          data: {
            email: emailBraces,
            name: 'Học viên {test}',
          },
          overrideAccess: true,
        }),
      ).rejects.toThrow(ValidationError)

      const emailLong = `hoc-vien-test-long-${randomUUID().slice(0, 8)}@example.test`
      await expect(
        payload.create({
          collection: 'customers',
          data: {
            email: emailLong,
            name: 'A'.repeat(105),
          },
          overrideAccess: true,
        }),
      ).rejects.toThrow(ValidationError)

      // Tên hợp lệ -> thành công
      const emailValid = `hoc-vien-test-valid-${randomUUID().slice(0, 8)}@example.test`
      const validCustomer = track(
        'customers',
        (await payload.create({
          collection: 'customers',
          data: {
            email: emailValid,
            name: 'Học viên Test Hợp Lệ 06',
          },
          overrideAccess: true,
        })) as Customer,
      )
      expect(validCustomer.id).toBeTruthy()
    })
  })
})
