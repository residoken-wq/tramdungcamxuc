// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitPlan, Product } from '../../src/payload-types'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import { sendTrackerNudges } from '../../src/lib/habit/tracker.server'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('HB-06: Cron nhắc lỡ nhịp theo luật nhịp tuần (sendTrackerNudges)', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []
  let habitProduct: Product

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  const isSentTo = (params: SendEmailParams, email: string) =>
    Array.isArray(params.to) ? params.to.includes(email) : params.to === email

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      habitProduct = existing.docs[0] as Product
    } else {
      habitProduct = track(
        'products',
        (await payload.create({
          collection: 'products',
          data: {
            name: 'Habit Tracker Số Test HB-06',
            slug: HABIT_TRACKER_PRODUCT_SLUG,
            type: 'digital_tool',
            web: 'habit',
            price: 250000,
            salePrice: 178000,
            saleStatus: 'coming_soon',
            _status: 'published',
          },
          overrideAccess: true,
        })) as Product,
      )
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    // 0. Xóa trackerNudges và habitCheckins của các kế hoạch do test tạo
    const planIds = created.filter((c) => c.collection === 'habitPlans').map((c) => c.id)
    for (const planId of planIds) {
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
              context: { accountDeletion: true },
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
              context: { accountDeletion: true },
            })
            .catch(() => {})
        }
      } catch (_e) {}
    }

    // 1. Dọn dẹp các tài liệu do test tạo theo thứ tự ngược lại
    for (let i = created.length - 1; i >= 0; i--) {
      const item = created[i]
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      } catch (_err) {}
    }
  })

  async function createTestCustomer(optOut = false): Promise<Customer> {
    const suffix = randomUUID().slice(0, 8)
    const customer = track(
      'customers',
      (await payload.create({
        collection: 'customers',
        data: {
          email: `hb06-nudge-${suffix}@example.test`,
          name: `Học viên HB06 ${suffix}`,
          reminderEmailsOptOut: optOut,
        },
        overrideAccess: true,
      })) as Customer,
    )

    // Cấp quyền truy cập trial
    track(
      'entitlements',
      await payload.create({
        collection: 'entitlements',
        data: {
          customer: customer.id,
          product: habitProduct.id,
          status: 'trial',
          source: 'trial',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        overrideAccess: true,
      }),
    )

    return customer
  }

  it('nhịp T2-T6: lỡ T5 + T6, T7/CN là ngày nghỉ -> sáng T2 tuần sau vẫn gửi email nhắc (bỏ qua T7/CN)', async () => {
    const customer = await createTestCustomer()
    // Kế hoạch bắt đầu Thứ 2 ngày 2026-10-12 (giờ VN)
    // Ngày 1: T2 (12/10), Ngày 2: T3 (13/10), Ngày 3: T4 (14/10), Ngày 4: T5 (15/10), Ngày 5: T6 (16/10)
    // Ngày 6: T7 (17/10 - nghỉ), Ngày 7: CN (18/10 - nghỉ), Ngày 8: T2 (19/10)
    const plan = track(
      'habitPlans',
      (await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          identityStatement: 'Tập thể dục mỗi sáng',
          startDate: '2026-10-12',
          journeyDays: 28,
          rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        },
        overrideAccess: true,
      })) as HabitPlan,
    )

    // Ngày 1, 2, 3 hoàn thành. Ngày 4 (T5) và Ngày 5 (T6) không check-in (lỡ).
    for (const d of [1, 2, 3]) {
      track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: d,
            status: 'voted',
            done: true,
          },
          overrideAccess: true,
        }),
      )
    }

    const emailSender = new MockEmailSender()
    // Sáng Thứ 2 tuần sau (2026-10-19T08:00:00+07:00 -> Ngày 8)
    const nowMon = new Date('2026-10-19T08:00:00+07:00')

    await sendTrackerNudges(nowMon, { payload, emailSender })

    // Kiểm tra chỉ riêng email gửi tới customer này
    const customerEmails = emailSender.sent.filter((s) => isSentTo(s, customer.email))
    expect(customerEmails.length).toBe(1)

    // Bản ghi trackerNudges được tạo với missedStartDay = 4 (ngày Thứ 5)
    const nudges = await payload.find({
      collection: 'trackerNudges',
      where: { plan: { equals: plan.id } },
      overrideAccess: true,
    })
    expect(nudges.docs.length).toBe(1)
    expect(nudges.docs[0].missedStartDay).toBe(4)
  })

  it('lỡ T6 + nghỉ T7/CN -> sáng T2 KHÔNG nhắc vì mới lỡ 1 ngày bỏ phiếu', async () => {
    const customer = await createTestCustomer()
    const plan = track(
      'habitPlans',
      (await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          identityStatement: 'Đọc sách mỗi ngày',
          startDate: '2026-10-12',
          journeyDays: 28,
          rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        },
        overrideAccess: true,
      })) as HabitPlan,
    )

    // Ngày 1, 2, 3, 4 đều check-in voted. Chỉ lỡ Ngày 5 (T6).
    for (const d of [1, 2, 3, 4]) {
      track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: d,
            status: 'voted',
            done: true,
          },
          overrideAccess: true,
        }),
      )
    }

    const emailSender = new MockEmailSender()
    const nowMon = new Date('2026-10-19T08:00:00+07:00') // Ngày 8

    await sendTrackerNudges(nowMon, { payload, emailSender })

    const customerEmails = emailSender.sent.filter((s) => isSentTo(s, customer.email))
    expect(customerEmails.length).toBe(0)

    const nudges = await payload.find({
      collection: 'trackerNudges',
      where: { plan: { equals: plan.id } },
      overrideAccess: true,
    })
    expect(nudges.docs.length).toBe(0)
  })

  it('check-in minimal hôm qua (T6) -> KHÔNG nhắc', async () => {
    const customer = await createTestCustomer()
    const plan = track(
      'habitPlans',
      (await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          identityStatement: 'Viết nhật ký',
          startDate: '2026-10-12',
          journeyDays: 28,
          rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        },
        overrideAccess: true,
      })) as HabitPlan,
    )

    // Ngày 4 (T5) lỡ, nhưng Ngày 5 (T6) hoàn thành bản tối giản (minimal)
    track(
      'habitCheckins',
      await payload.create({
        collection: 'habitCheckins',
        data: {
          plan: plan.id,
          day: 5,
          status: 'minimal',
          done: true,
        },
        overrideAccess: true,
      }),
    )

    const emailSender = new MockEmailSender()
    const nowMon = new Date('2026-10-19T08:00:00+07:00')

    await sendTrackerNudges(nowMon, { payload, emailSender })

    const customerEmails = emailSender.sent.filter((s) => isSentTo(s, customer.email))
    expect(customerEmails.length).toBe(0)
  })

  it('đã nhắc chuỗi này -> lượt cron sau không gửi lại (idempotency, skippedDuplicate)', async () => {
    const customer = await createTestCustomer()
    track(
      'habitPlans',
      (await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          identityStatement: 'Thiền định',
          startDate: '2026-10-12',
          journeyDays: 28,
          rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        },
        overrideAccess: true,
      })) as HabitPlan,
    )

    // Lỡ ngày 4 và 5
    const emailSender = new MockEmailSender()
    const nowMon = new Date('2026-10-19T08:00:00+07:00')

    // Lần 1: gửi thành công
    await sendTrackerNudges(nowMon, { payload, emailSender })
    const sent1 = emailSender.sent.filter((s) => isSentTo(s, customer.email))
    expect(sent1.length).toBe(1)

    // Lần 2 (ngay sau đó): ghi nhận trùng lặp, không gửi email mới
    const res2 = await sendTrackerNudges(nowMon, { payload, emailSender })
    expect(res2.skippedDuplicate).toBeGreaterThanOrEqual(1)
    const sent2 = emailSender.sent.filter((s) => isSentTo(s, customer.email))
    expect(sent2.length).toBe(1)
  })

  it('chuỗi lỡ mới sau khi đã check-in lại -> gửi nhắc lần nữa với missedStartDay mới', async () => {
    const customer = await createTestCustomer()
    const plan = track(
      'habitPlans',
      (await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          identityStatement: 'Uống đủ 2L nước',
          startDate: '2026-10-12',
          journeyDays: 28,
          rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        },
        overrideAccess: true,
      })) as HabitPlan,
    )

    const emailSender = new MockEmailSender()
    const nowMon = new Date('2026-10-19T08:00:00+07:00')

    // Ngày 1, 2, 3 hoàn thành. Ngày 4, 5 lỡ nhịp.
    for (const d of [1, 2, 3]) {
      track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: d,
            status: 'voted',
            done: true,
          },
          overrideAccess: true,
        }),
      )
    }

    // 1. Chuỗi lỡ thứ nhất (Ngày 4, 5): đã gửi nhắc vào sáng T2 (Ngày 8)
    await sendTrackerNudges(nowMon, { payload, emailSender })
    expect(emailSender.sent.filter((s) => isSentTo(s, customer.email)).length).toBe(1)

    // 2. Học viên quay lại check-in Ngày 8 (T2)
    track(
      'habitCheckins',
      await payload.create({
        collection: 'habitCheckins',
        data: {
          plan: plan.id,
          day: 8,
          status: 'voted',
          done: true,
        },
        overrideAccess: true,
      }),
    )

    // 3. Sau đó lại lỡ Ngày 9 (T3) và Ngày 10 (T4)
    // Sáng Thứ 5 (2026-10-22T08:00:00+07:00 -> Ngày 11)
    const nowThu = new Date('2026-10-22T08:00:00+07:00')
    await sendTrackerNudges(nowThu, { payload, emailSender })

    // Đã gửi thêm 1 email nhắc cho chuỗi lỡ mới
    const totalEmails = emailSender.sent.filter((s) => isSentTo(s, customer.email))
    expect(totalEmails.length).toBe(2)

    // Database có 2 bản ghi trackerNudges với missedStartDay = 4 và missedStartDay = 9
    const nudges = await payload.find({
      collection: 'trackerNudges',
      where: { plan: { equals: plan.id } },
      sort: 'missedStartDay',
      overrideAccess: true,
    })
    expect(nudges.docs.length).toBe(2)
    expect(nudges.docs[0].missedStartDay).toBe(4)
    expect(nudges.docs[1].missedStartDay).toBe(9)
  })

  it('qua ngày cuối hành trình -> KHÔNG gửi nhắc', async () => {
    const customer = await createTestCustomer()
    track(
      'habitPlans',
      (await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          identityStatement: 'Ngủ trước 23h',
          startDate: '2026-10-12',
          journeyDays: 28,
          rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        },
        overrideAccess: true,
      })) as HabitPlan,
    )

    const emailSender = new MockEmailSender()
    // Ngày thứ 29 (2026-11-09T08:00:00+07:00): đã kết thúc hành trình 28 ngày
    const nowPast = new Date('2026-11-09T08:00:00+07:00')

    await sendTrackerNudges(nowPast, { payload, emailSender })

    const customerEmails = emailSender.sent.filter((s) => isSentTo(s, customer.email))
    expect(customerEmails.length).toBe(0)
  })

  it('học viên đã opt-out nhận nhắc -> tạo trackerNudges nhưng KHÔNG gửi email', async () => {
    const customer = await createTestCustomer(true) // optOut = true
    const plan = track(
      'habitPlans',
      (await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          identityStatement: 'Đi bộ 10.000 bước',
          startDate: '2026-10-12',
          journeyDays: 28,
          rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        },
        overrideAccess: true,
      })) as HabitPlan,
    )

    const emailSender = new MockEmailSender()
    const nowMon = new Date('2026-10-19T08:00:00+07:00')

    await sendTrackerNudges(nowMon, { payload, emailSender })

    // Không gửi email
    const customerEmails = emailSender.sent.filter((s) => isSentTo(s, customer.email))
    expect(customerEmails.length).toBe(0)

    // Nhưng vẫn tạo bản ghi trackerNudges để tránh quét lại nhiều lần
    const nudges = await payload.find({
      collection: 'trackerNudges',
      where: { plan: { equals: plan.id } },
      overrideAccess: true,
    })
    expect(nudges.docs.length).toBe(1)
    expect(nudges.docs[0].missedStartDay).toBe(1) // vì từ ngày 1 chưa check-in
  })
})
