// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitPlan, Product, User } from '../../src/payload-types'
import * as trackerServer from '../../src/lib/habit/tracker.server'
import {
  calculateTrackerStats,
  getCurrentDayOfPlan,
  getOrCreateTrackerPlan,
  getVietnamCalendarDayDiff,
  getVietnamYmd,
  sendTrackerNudges,
  vietnamTodayIso,
} from '../../src/lib/habit/tracker.server'
import { checkInDay, createTrackerPlanAction } from '../../src/lib/habit/tracker-actions'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import * as sessionServer from '../../src/lib/auth/session.server'
import { POST as trackerNudgesCronRoute } from '../../src/app/(site)/api/cron/tracker-nudges/route'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []
  public shouldFail = false

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    if (this.shouldFail) {
      throw new Error('Simulated network error sending email')
    }
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('21-Day Habit Tracker & Reminders (T2-06)', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []
  const testPlanIds = new Set<number>()
  const testCronSecret = 'test-tracker-cron-secret-t2-06'
  let habitProduct: Product
  let ownerUser: User
  let editorUser: User

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    if (collection === 'habitPlans') {
      testPlanIds.add(doc.id)
    }
    return doc
  }

  beforeAll(async () => {
    process.env.CRON_SECRET = testCronSecret
    payload = await getPayload({ config: await config })

    // Đảm bảo có sản phẩm HABIT_TRACKER_PRODUCT_SLUG
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      overrideAccess: true,
      limit: 1,
    })

    if (existing.docs.length > 0) {
      habitProduct = existing.docs[0] as Product
    } else {
      habitProduct = track(
        'products',
        (await payload.create({
          collection: 'products',
          data: {
            name: 'Habit Tracker Số',
            slug: HABIT_TRACKER_PRODUCT_SLUG,
            web: 'habit',
            type: 'digital_tool',
            price: 250000,
            salePrice: 178000,
            trialDays: 21,
            saleStatus: 'on_sale',
            _status: 'published',
          },
          overrideAccess: true,
        })) as Product,
      )
    }

    // Tạo owner và editor user để test phân quyền đọc trường nhạy cảm
    ownerUser = track(
      'users',
      (await payload.create({
        collection: 'users',
        data: {
          email: `owner-tracker-${randomUUID()}@example.test`,
          password: 'Password123!',
          role: 'owner',
        },
        overrideAccess: true,
      })) as User,
    )

    editorUser = track(
      'users',
      (await payload.create({
        collection: 'users',
        data: {
          email: `editor-tracker-${randomUUID()}@example.test`,
          password: 'Password123!',
          role: 'editor',
        },
        overrideAccess: true,
      })) as User,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    vi.restoreAllMocks()

    // Xóa habitCheckins và trackerNudges của các kế hoạch test trước
    for (const planId of testPlanIds) {
      try {
        const checkins = await payload.find({
          collection: 'habitCheckins',
          where: { plan: { equals: planId } },
          depth: 0,
          limit: 100,
          overrideAccess: true,
        })
        for (const c of checkins.docs) {
          await payload
            .delete({
              collection: 'habitCheckins',
              id: c.id,
              overrideAccess: true,
            })
            .catch(() => {})
        }
      } catch (_e) {}

      try {
        const nudges = await payload.find({
          collection: 'trackerNudges',
          where: { plan: { equals: planId } },
          depth: 0,
          limit: 100,
          overrideAccess: true,
        })
        for (const n of nudges.docs) {
          await payload
            .delete({
              collection: 'trackerNudges',
              id: n.id,
              overrideAccess: true,
            })
            .catch(() => {})
        }
      } catch (_e) {}
    }

    // Xóa các bản ghi đã tạo theo thứ tự ngược lại
    for (let i = created.length - 1; i >= 0; i--) {
      const item = created[i]
      try {
        await payload
          .delete({
            collection: item.collection,
            id: item.id,
            overrideAccess: true,
          })
          .catch(() => {})
      } catch (_e) {}
    }
  })

  async function createCustomer(name = 'Khách Tracker'): Promise<Customer> {
    const cust = await payload.create({
      collection: 'customers',
      data: {
        name,
        email: `customer-${randomUUID()}@example.test`,
      },
      overrideAccess: true,
    })
    return track('customers', cust as Customer)
  }

  describe('1. Ngày thứ N theo giờ Việt Nam (biên 0h–7h sáng)', () => {
    it('tính đúng ngày lịch Việt Nam kể cả lúc 01:00 AM (tương ứng 18:00 UTC hôm trước)', () => {
      // 01:00 AM ngày 13/10/2026 tại Việt Nam (+07:00) -> 18:00 UTC ngày 12/10/2026
      const morning1AmVn = new Date('2026-10-12T18:00:00.000Z')
      const afternoon3PmVn = new Date('2026-10-13T08:00:00.000Z')

      expect(getVietnamYmd(morning1AmVn)).toBe('2026-10-13')
      expect(getVietnamYmd(afternoon3PmVn)).toBe('2026-10-13')
      expect(getVietnamCalendarDayDiff(morning1AmVn, afternoon3PmVn)).toBe(0)
    })

    it('tính đúng Ngày 1 khi startDate là hôm nay, và Ngày 2 vào sáng hôm sau lúc 06:00', () => {
      const startDate = '2026-10-13T00:00:00+07:00'
      const sameDayMorning = new Date('2026-10-12T19:30:00.000Z') // 02:30 AM ngày 13/10 VN
      const nextDayMorning = new Date('2026-10-13T23:00:00.000Z') // 06:00 AM ngày 14/10 VN

      expect(getCurrentDayOfPlan(startDate, sameDayMorning)).toBe(1)
      expect(getCurrentDayOfPlan(startDate, nextDayMorning)).toBe(2)
    })
  })

  describe('2. Gắn kế hoạch Habit Loop theo email đã xác minh', () => {
    it('gắn kế hoạch có leadEmail trùng khớp cho khách hàng khi customer còn trống', async () => {
      const customer = await createCustomer('Khách Có Kế Hoạch Loop')
      const plan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            leadEmail: customer.email,
            identityStatement: 'Tôi sẽ đọc sách 10 phút mỗi tối để mở rộng tư duy',
            startDate: vietnamTodayIso(),
          },
          overrideAccess: true,
        }),
      )

      expect(plan.customer).toBeNull()

      const resultPlan = await getOrCreateTrackerPlan(customer.id, { payload })
      expect(resultPlan).not.toBeNull()
      expect(resultPlan?.id).toBe(plan.id)

      // Kiểm tra trong DB rằng customer đã được gán
      const updatedInDb = await payload.findByID({
        collection: 'habitPlans',
        id: plan.id,
        overrideAccess: true,
      })
      const attachedCustId =
        typeof updatedInDb.customer === 'object' && updatedInDb.customer !== null
          ? updatedInDb.customer.id
          : updatedInDb.customer
      expect(attachedCustId).toBe(customer.id)
    })

    it('không gắn khi kế hoạch đã có customer khác sở hữu', async () => {
      const ownerCust = await createCustomer('Chủ Kế Hoạch Cũ')
      const newCust = await createCustomer('Khách Mới Cùng Email')

      const existingPlan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: ownerCust.id,
            leadEmail: newCust.email, // cùng email nhưng đã gắn ownerCust
            identityStatement: 'Kế hoạch đã có chủ',
            startDate: vietnamTodayIso(),
          },
          overrideAccess: true,
        }),
      )

      const resultPlan = await getOrCreateTrackerPlan(newCust.id, { payload })
      // Không được lấy kế hoạch của ownerCust
      if (resultPlan) {
        expect(resultPlan.id).not.toBe(existingPlan.id)
      } else {
        expect(resultPlan).toBeNull()
      }
    })

    it('đặt startDate = hôm nay khi gắn kế hoạch Habit Loop cũ (30 ngày trước), để học viên bắt đầu từ Ngày 1', async () => {
      const customer = await createCustomer('Khách Loop Cũ 30 Ngày')
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const oldPlan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            leadEmail: customer.email,
            identityStatement: 'Tôi sẽ chạy bộ mỗi sáng',
            startDate: vietnamTodayIso(thirtyDaysAgo),
          },
          overrideAccess: true,
        }),
      )

      const resultPlan = await getOrCreateTrackerPlan(customer.id, { payload })
      expect(resultPlan).not.toBeNull()
      expect(resultPlan?.id).toBe(oldPlan.id)

      // Kiểm tra startDate đã được đặt lại thành hôm nay theo giờ VN
      const todayYmd = getVietnamYmd(new Date())
      expect(getVietnamYmd(new Date(resultPlan!.startDate!))).toBe(todayYmd)

      // Và ngày hiện tại là Ngày 1
      expect(getCurrentDayOfPlan(resultPlan!.startDate!, new Date())).toBe(1)
    })
  })

  describe('3. Check-in hợp lệ, kiểm tra tương lai và quyền truy cập', () => {
    it('từ chối check-in ngày trong tương lai (day > currentDay)', async () => {
      const customer = await createCustomer('Khách Tick Tương Lai')
      // Cấp quyền dùng thử còn hạn
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )

      // Tạo plan bắt đầu từ hôm nay (hôm nay là Ngày 1)
      track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Tôi sẽ uống nước đầy đủ',
            startDate: vietnamTodayIso(),
          },
          overrideAccess: true,
        }),
      )

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      // Tick ngày 1: hợp lệ
      const resDay1 = await checkInDay(1, true, 'joyful', 'Ngày đầu tiên tốt lành')
      expect(resDay1.success).toBe(true)

      // Tick ngày 2 (chưa tới): bị từ chối
      const resDay2 = await checkInDay(2, true, 'peaceful')
      expect(resDay2.success).toBe(false)
      expect(resDay2.error).toBe('FUTURE_DAY')
    })

    it('từ chối check-in khi hết hạn dùng thử (status expired)', async () => {
      const customer = await createCustomer('Khách Hết Hạn')
      // Cấp quyền dùng thử ĐÃ HẾT HẠN
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: habitProduct.id,
            status: 'expired',
            source: 'trial',
            expiresAt: new Date(Date.now() - 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )

      track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Kế hoạch hết hạn',
            startDate: vietnamTodayIso(),
          },
          overrideAccess: true,
        }),
      )

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      const res = await checkInDay(1, true)
      expect(res.success).toBe(false)
      expect(res.error).toBe('ACCESS_DENIED')
    })

    it('từ chối khi khách thao tác trên kế hoạch của người khác qua API collection', async () => {
      const customerA = await createCustomer('Khách A')
      const customerB = await createCustomer('Khách B')

      // Cấp quyền cho khách B
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerB.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )

      // Tạo kế hoạch của khách A
      const planA = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Kế hoạch của khách A',
            startDate: vietnamTodayIso(),
          },
          overrideAccess: true,
        }),
      )

      // Khách B cố tình gọi checkIn vào plan của khách A qua API
      await expect(
        payload.create({
          collection: 'habitCheckins',
          data: {
            plan: planA.id,
            day: 1,
            done: true,
          },
          user: {
            id: customerB.id,
            collection: 'customers',
            email: customerB.email,
          } as unknown as Parameters<typeof payload.create>[0]['user'],
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })

    it('checkInDay từ chối FORBIDDEN khi kế hoạch không thuộc về khách hàng đang đăng nhập', async () => {
      const customerA = await createCustomer('Khách A Đăng Nhập')
      const customerB = await createCustomer('Khách B Sở Hữu')

      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerA.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const planB = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerB.id,
            identityStatement: 'Kế hoạch của khách B',
            startDate: vietnamTodayIso(),
          },
          overrideAccess: true,
        }),
      )

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customerA)
      vi.spyOn(trackerServer, 'getOrCreateTrackerPlan').mockResolvedValue(planB as HabitPlan)

      const res = await checkInDay(1, true)
      expect(res.success).toBe(false)
      expect(res.error).toBe('FORBIDDEN')
    })
  })

  describe('4. Check-in đồng thời (Concurrency) -> 1 dòng', () => {
    it('2 lần gọi checkInDay song song cho cùng (plan, day) chỉ tạo 1 bản ghi và không ném lỗi', async () => {
      const customer = await createCustomer('Khách Concurrency')
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const plan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Tập yoga mỗi sáng',
            startDate: vietnamTodayIso(),
          },
          overrideAccess: true,
        }),
      )

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      // Gọi đồng thời 2 lần
      const [res1, res2] = await Promise.all([
        checkInDay(1, true, 'fresh', 'Lần 1'),
        checkInDay(1, true, 'peaceful', 'Lần 2'),
      ])

      expect(res1.success).toBe(true)
      expect(res2.success).toBe(true)

      const checkins = await payload.find({
        collection: 'habitCheckins',
        where: {
          and: [{ plan: { equals: plan.id } }, { day: { equals: 1 } }],
        },
        overrideAccess: true,
      })

      // Đúng 1 dòng trong DB
      expect(checkins.docs.length).toBe(1)
      expect(checkins.docs[0].done).toBe(true)
    })

    it('gọi createTrackerPlanAction song song (Promise.all 2 lần) chỉ tạo đúng 1 kế hoạch duy nhất', async () => {
      const customer = await createCustomer('Khách Song Song Create Plan')
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      const results = await Promise.all([
        createTrackerPlanAction('Tôi sẽ đi bộ 10 phút mỗi ngày'),
        createTrackerPlanAction('Tôi sẽ đi bộ 10 phút mỗi ngày'),
      ])

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(results[0].planId).toBe(results[1].planId)
      if (results[0].planId) testPlanIds.add(results[0].planId)

      const dbPlans = await payload.find({
        collection: 'habitPlans',
        where: { customer: { equals: customer.id } },
        overrideAccess: true,
      })
      expect(dbPlans.docs.length).toBe(1)
    })

    it('createTrackerPlanAction từ chối khi câu định danh quá dài (> 300 ký tự) hoặc rỗng', async () => {
      const customer = await createCustomer('Khách Validate Statement')
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      const resEmpty = await createTrackerPlanAction('   ')
      expect(resEmpty.success).toBe(false)
      expect(resEmpty.error).toBe('INVALID_INPUT')

      const resLong = await createTrackerPlanAction('a'.repeat(301))
      expect(resLong.success).toBe(false)
      expect(resLong.error).toBe('INVALID_INPUT')
    })

    it('createTrackerPlanAction từ chối khi khách chưa có quyền truy cập', async () => {
      const customer = await createCustomer('Khách Chưa Quyền')
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      const res = await createTrackerPlanAction('Tôi sẽ thiền 5 phút')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ACCESS_DENIED')
    })
  })

  describe('5. Thống kê tổng kết (số ngày, cảm xúc nhiều nhất)', () => {
    it('tính chính xác completedDays và mostFrequentEmotion', () => {
      const sampleCheckins = [
        { done: true, emotion: 'joyful' },
        { done: true, emotion: 'joyful' },
        { done: true, emotion: 'peaceful' },
        { done: false, emotion: 'tired' }, // chưa hoàn thành
        { done: true, emotion: null },
      ]

      const stats = calculateTrackerStats(sampleCheckins)
      expect(stats.completedDays).toBe(4)
      expect(stats.mostFrequentEmotion).not.toBeNull()
      expect(stats.mostFrequentEmotion?.key).toBe('joyful')
      expect(stats.mostFrequentEmotion?.count).toBe(2)
      expect(stats.mostFrequentEmotion?.label).toBe('Vui vẻ')
    })
  })

  describe('6. Phân quyền bảo mật: Editor không đọc được emotion / note', () => {
    it('người dùng vai trò editor bị ẩn các trường emotion và note', async () => {
      const customer = await createCustomer('Khách Riêng Tư')
      const plan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Riêng tư cá nhân',
            startDate: vietnamTodayIso(),
          },
          overrideAccess: true,
        }),
      )

      const checkin = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: 1,
            done: true,
            emotion: 'confident',
            note: 'Ghi chú tuyệt mật chỉ học viên và owner xem được',
          },
          overrideAccess: true,
        }),
      )

      // Đọc với quyền editor: không thấy emotion và note
      const asEditor = await payload.findByID({
        collection: 'habitCheckins',
        id: checkin.id,
        user: editorUser,
        overrideAccess: false,
      })
      expect(asEditor.emotion).toBeUndefined()
      expect(asEditor.note).toBeUndefined()

      // Đọc với quyền owner: thấy đầy đủ
      const asOwner = await payload.findByID({
        collection: 'habitCheckins',
        id: checkin.id,
        user: ownerUser,
        overrideAccess: false,
      })
      expect(asOwner.emotion).toBe('confident')
      expect(asOwner.note).toBe('Ghi chú tuyệt mật chỉ học viên và owner xem được')
    })
  })

  describe('7. Nudge Cron & Idempotency', () => {
    it('gửi email khi lỡ 2 ngày liên tiếp, không gửi trùng lặp, và thử lại khi gửi lỗi', async () => {
      const customer = await createCustomer('Khách Lỡ Nhịp')
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )

      // startDate 3 ngày trước -> hôm nay là Ngày 4
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      const plan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Tập thiền mỗi tối',
            startDate: vietnamTodayIso(threeDaysAgo),
          },
          overrideAccess: true,
        }),
      )

      // Ngày 1 xong. Ngày 2 và Ngày 3 lỡ. Hôm nay là Ngày 4.
      track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: 1,
            done: true,
            emotion: 'peaceful',
          },
          overrideAccess: true,
        }),
      )

      const emailSender = new MockEmailSender()

      const isSentTo = (params: SendEmailParams, email: string) =>
        Array.isArray(params.to) ? params.to.includes(email) : params.to === email

      // 1. Lần 1: gửi thành công 1 email cho khách hàng
      await sendTrackerNudges(new Date(), {
        payload,
        emailSender,
      })
      const sentForCustomer = emailSender.sent.filter((s) => isSentTo(s, customer.email))
      expect(sentForCustomer.length).toBe(1)

      const nudgesInDb = await payload.find({
        collection: 'trackerNudges',
        where: { plan: { equals: plan.id } },
        overrideAccess: true,
      })
      expect(nudgesInDb.docs.length).toBe(1)

      // 2. Lần 2 (ngay sau đó): không gửi trùng (idempotency)
      await sendTrackerNudges(new Date(), {
        payload,
        emailSender,
      })
      const sentForCustomerAgain = emailSender.sent.filter((s) => isSentTo(s, customer.email))
      expect(sentForCustomerAgain.length).toBe(1) // không tăng thêm

      // 3. Xử lý lỗi gửi: xóa bản ghi và cho phép gửi lại
      // Tạo một plan lỡ nhịp khác
      const customerError = await createCustomer('Khách Lỗi Email')
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerError.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )
      const planError = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerError.id,
            identityStatement: 'Tập chạy',
            startDate: vietnamTodayIso(threeDaysAgo),
          },
          overrideAccess: true,
        }),
      )

      const failingSender = new MockEmailSender()
      failingSender.shouldFail = true

      const failRes = await sendTrackerNudges(new Date(), {
        payload,
        emailSender: failingSender,
      })
      expect(failRes.errors).toBeGreaterThanOrEqual(1)
      const sentForErrorCustomer = failingSender.sent.filter((s) => isSentTo(s, customerError.email))
      expect(sentForErrorCustomer.length).toBe(0)

      // Bản ghi giữ chỗ của planError phải bị xóa để cho phép thử lại
      const errorNudgesInDb = await payload.find({
        collection: 'trackerNudges',
        where: { plan: { equals: planError.id } },
        overrideAccess: true,
      })
      expect(errorNudgesInDb.docs.length).toBe(0)

      // Lần sau sửa lỗi gửi -> gửi thành công
      failingSender.shouldFail = false
      await sendTrackerNudges(new Date(), {
        payload,
        emailSender: failingSender,
      })
      const retriedForErrorCustomer = failingSender.sent.filter((s) =>
        isSentTo(s, customerError.email),
      )
      expect(retriedForErrorCustomer.length).toBe(1)
    })

    it('chạy sendTrackerNudges song song (Promise.all 2 lần) chỉ gửi 1 email cho 1 chuỗi lỡ nhịp', async () => {
      const customer = await createCustomer('Khách Song Song Nudge')
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: habitProduct.id,
            status: 'trial',
            source: 'trial',
            expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      const plan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Tập yoga mỗi sáng',
            startDate: vietnamTodayIso(threeDaysAgo),
          },
          overrideAccess: true,
        }),
      )

      // Ngày 1 done, Ngày 2 và 3 lỡ
      track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: 1,
            done: true,
            emotion: 'joyful',
          },
          overrideAccess: true,
        }),
      )

      const emailSender = new MockEmailSender()
      await Promise.all([
        sendTrackerNudges(new Date(), { payload, emailSender }),
        sendTrackerNudges(new Date(), { payload, emailSender }),
      ])

      const isSentTo = (params: SendEmailParams, email: string) =>
        Array.isArray(params.to) ? params.to.includes(email) : params.to === email
      const sentForCustomer = emailSender.sent.filter((s) => isSentTo(s, customer.email))
      expect(sentForCustomer.length).toBe(1)

      const nudgesInDb = await payload.find({
        collection: 'trackerNudges',
        where: { plan: { equals: plan.id } },
        overrideAccess: true,
      })
      expect(nudgesInDb.docs.length).toBe(1)
    })

    it('từ chối 401 khi gọi cron route với secret sai hoặc thiếu', async () => {
      // Thiếu header
      const reqNoHeader = new Request('http://localhost/api/cron/tracker-nudges', {
        method: 'POST',
      })
      const resNoHeader = await trackerNudgesCronRoute(reqNoHeader)
      expect(resNoHeader.status).toBe(401)

      // Header sai secret
      const reqWrong = new Request('http://localhost/api/cron/tracker-nudges', {
        method: 'POST',
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      })
      const resWrong = await trackerNudgesCronRoute(reqWrong)
      expect(resWrong.status).toBe(401)
    })
  })
})
