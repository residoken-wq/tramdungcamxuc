// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitPlan, Product, User } from '../../src/payload-types'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import { vi as viStrings } from '../../src/lib/i18n/vi'
import { countCompletedVotingDays } from '../../src/lib/habit/journey'
import { currentStreak, missedVotingRun } from '../../src/lib/habit/rhythm'
import { issueCertificate } from '../../src/lib/habit/certificate.server'

describe('HB-06: Chặn status rest trên ngày bỏ phiếu và luật nhịp tuần cho chứng nhận', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []
  let habitProduct: Product
  let editorUser: User

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const existingProduct = await payload.find({
      collection: 'products',
      where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingProduct.docs.length > 0) {
      habitProduct = existingProduct.docs[0] as Product
    } else {
      habitProduct = track(
        'products',
        (await payload.create({
          collection: 'products',
          data: {
            name: 'Habit Tracker Số Test Guard',
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

    // Tạo tài khoản admin editor để kiểm tra bypass
    editorUser = track(
      'users',
      (await payload.create({
        collection: 'users',
        data: {
          email: `hb06-editor-${randomUUID().slice(0, 8)}@example.test`,
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
    // 0. Xóa certificates, trackerNudges và habitCheckins của các kế hoạch do test tạo
    const planIds = created.filter((c) => c.collection === 'habitPlans').map((c) => c.id)
    const customerIds = created.filter((c) => c.collection === 'customers').map((c) => c.id)

    if (customerIds.length > 0) {
      await payload.delete({
        collection: 'certificates',
        where: { customer: { in: customerIds } },
        overrideAccess: true,
        context: { accountDeletion: true },
      })
    }

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
    }

    // 1. Dọn dẹp tài liệu theo thứ tự ngược lại
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

  async function createTestCustomer(name = 'Học viên Test Guard'): Promise<Customer> {
    const suffix = randomUUID().slice(0, 8)
    const customer = track(
      'customers',
      (await payload.create({
        collection: 'customers',
        data: {
          email: `hb06-guard-${suffix}@example.test`,
          name,
        },
        overrideAccess: true,
      })) as Customer,
    )

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

  describe('1. Hook validateStatusForRhythm trong HabitCheckins', () => {
    it('chặn status "rest" vào ngày bỏ phiếu của kế hoạch (ném lỗi tiếng Việt)', async () => {
      const customer = await createTestCustomer()
      // Kế hoạch bắt đầu Thứ 2: 2026-10-12
      // Ngày 1: Thứ 2 (ngày bỏ phiếu)
      const plan = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Tập yoga',
            startDate: '2026-10-12',
            journeyDays: 28,
            rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      const customerUser = { ...customer, collection: 'customers' as const }

      // Thử tạo check-in status: rest vào Ngày 1 (Thứ 2 là ngày bỏ phiếu)
      await expect(
        payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: 1,
            status: 'rest',
          },
          user: customerUser,
          overrideAccess: false,
        }),
      ).rejects.toThrow(viStrings.hb06.errors.restOnVotingDay)
    })

    it('chặn cập nhật sang status "rest" vào ngày bỏ phiếu', async () => {
      const customer = await createTestCustomer()
      const plan = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Tập chạy',
            startDate: '2026-10-12',
            journeyDays: 28,
            rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      const customerUser = { ...customer, collection: 'customers' as const }

      // Tạo check-in hợp lệ ban đầu: voted
      const checkin = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: 1,
            status: 'voted',
          },
          user: customerUser,
          overrideAccess: false,
        }),
      )

      // Cập nhật sang status: rest vào ngày bỏ phiếu -> bị chặn
      await expect(
        payload.update({
          collection: 'habitCheckins',
          id: checkin.id,
          data: {
            status: 'rest',
          },
          user: customerUser,
          overrideAccess: false,
        }),
      ).rejects.toThrow(viStrings.hb06.errors.restOnVotingDay)
    })

    it('quản trị viên (editor / owner) được phép ghi status "rest" vào ngày bỏ phiếu (bỏ qua hook)', async () => {
      const customer = await createTestCustomer()
      const plan = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Ngồi thiền',
            startDate: '2026-10-12',
            journeyDays: 28,
            rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      // Admin ghi rest vào Ngày 1 (Thứ 2) -> thành công, không bị lỗi
      const checkin = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: 1,
            status: 'rest',
          },
          user: editorUser,
          overrideAccess: false,
        }),
      )

      expect(checkin.status).toBe('rest')
      expect(checkin.done).toBe(false)
    })

    it('ngày nghỉ theo nhịp: học viên tự do ghi cả 4 trạng thái (voted, minimal, missed, rest) mà không bị chặn', async () => {
      const customer = await createTestCustomer()
      // Kế hoạch bắt đầu Thứ 2: 2026-10-12
      // Ngày 6 là Thứ 7 (ngày nghỉ theo nhịp)
      const plan = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Học tiếng Anh',
            startDate: '2026-10-12',
            journeyDays: 28,
            rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      const customerUser = { ...customer, collection: 'customers' as const }

      // 1. Ghi rest vào Ngày 6 (Thứ 7 - ngày nghỉ): thành công
      const checkinRest = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: 6,
            status: 'rest',
          },
          user: customerUser,
          overrideAccess: false,
        }),
      )
      expect(checkinRest.status).toBe('rest')
      expect(checkinRest.done).toBe(false)

      // 2. Cập nhật sang voted trên ngày nghỉ: thành công
      const checkinVoted = await payload.update({
        collection: 'habitCheckins',
        id: checkinRest.id,
        data: {
          status: 'voted',
        },
        user: customerUser,
        overrideAccess: false,
      })
      expect(checkinVoted.status).toBe('voted')
      expect(checkinVoted.done).toBe(true)

      // 3. Cập nhật sang minimal trên ngày nghỉ: thành công
      const checkinMinimal = await payload.update({
        collection: 'habitCheckins',
        id: checkinRest.id,
        data: {
          status: 'minimal',
        },
        user: customerUser,
        overrideAccess: false,
      })
      expect(checkinMinimal.status).toBe('minimal')
      expect(checkinMinimal.done).toBe(true)

      // 4. Cập nhật sang missed trên ngày nghỉ: thành công
      const checkinMissed = await payload.update({
        collection: 'habitCheckins',
        id: checkinRest.id,
        data: {
          status: 'missed',
        },
        user: customerUser,
        overrideAccess: false,
      })
      expect(checkinMissed.status).toBe('missed')
      expect(checkinMissed.done).toBe(false)
    })
  })

  describe('2. Check-in trên ngày nghỉ không ảnh hưởng tới thống kê, chuỗi và nhắc', () => {
    it('check-in voted trên ngày nghỉ KHÔNG cộng vào countCompletedVotingDays', async () => {
      const plan = {
        startDate: '2026-10-12',
        journeyDays: 28,
        rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      }

      // Check-in voted ở Ngày 1 (Thứ 2 - voting day) và Ngày 6 (Thứ 7 - rest day)
      const checkins = [
        { day: 1, status: 'voted', done: true },
        { day: 6, status: 'voted', done: true }, // Ngày nghỉ
      ]

      const completed = countCompletedVotingDays(plan, checkins)
      // Chỉ tính Ngày 1, bỏ qua Ngày 6
      expect(completed).toBe(1)
    })

    it('check-in trên ngày nghỉ KHÔNG làm đứt chuỗi currentStreak', async () => {
      const plan = {
        startDate: '2026-10-12',
        journeyDays: 28,
        rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      }

      // Tuần 1: Ngày 1..5 (T2..T6) đều voted
      // Ngày 6 (T7) có check-in rest
      // Ngày 7 (CN) không check-in
      // Ngày 8 (T2 tuần 2) là hôm nay, chưa check-in
      const checkins = [
        { day: 1, status: 'voted', done: true },
        { day: 2, status: 'voted', done: true },
        { day: 3, status: 'voted', done: true },
        { day: 4, status: 'voted', done: true },
        { day: 5, status: 'voted', done: true },
        { day: 6, status: 'rest', done: false }, // Khách ghi rest vào T7
      ]

      const today = new Date('2026-10-19T08:00:00+07:00') // Ngày 8 (Thứ 2)
      const streak = currentStreak(plan, checkins, today)

      // Chuỗi vẫn giữ 5 ngày (T2-T6 tuần trước), ngày nghỉ T7/CN không làm đứt chuỗi
      expect(streak).toBe(5)
    })

    it('check-in trên ngày nghỉ KHÔNG ảnh hưởng tới chuỗi lỡ missedVotingRun', async () => {
      const plan = {
        startDate: '2026-10-12',
        journeyDays: 28,
        rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      }

      // Ngày 4 (T5) và 5 (T6) lỡ nhịp.
      // Ngày 6 (T7 - ngày nghỉ) khách check-in 'voted'.
      // Ngày 7 (CN - ngày nghỉ) khách check-in 'rest'.
      const checkins = [
        { day: 1, status: 'voted', done: true },
        { day: 2, status: 'voted', done: true },
        { day: 3, status: 'voted', done: true },
        { day: 6, status: 'voted', done: true },
        { day: 7, status: 'rest', done: false },
      ]

      const today = new Date('2026-10-19T08:00:00+07:00') // Ngày 8 (Thứ 2)
      const run = missedVotingRun(plan, checkins, today)

      // Bỏ qua ngày 6 và 7; chuỗi lỡ vẫn là 2 ngày (ngày 4 và 5)
      expect(run.count).toBe(2)
      expect(run.startDay).toBe(4)
    })
  })

  describe('3. Luật cấp chứng nhận theo nhịp tuần', () => {
    it('kế hoạch 28 ngày nhịp 5/7 (20 ngày bỏ phiếu) -> đủ 18 ngày cấp chứng nhận; 17 ngày từ chối', async () => {
      const customer = await createTestCustomer('Học viên Đạt Chuẩn')
      // startDate cách đây 35 ngày (đã qua ngày cuối hành trình 28 ngày)
      const pastStart = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      // Tìm ngày Thứ 2 gần nhất trong quá khứ để startDate rơi vào Thứ 2
      while (pastStart.getDay() !== 1) {
        pastStart.setDate(pastStart.getDate() - 1)
      }
      const startIso = pastStart.toISOString().split('T')[0]

      const plan = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Dậy sớm đọc sách',
            startDate: startIso,
            journeyDays: 28,
            rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'], // 20 ngày bỏ phiếu
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      // Tạo 17 ngày voted trên các ngày bỏ phiếu (tuần 1-3: 15 ngày, tuần 4: 2 ngày)
      // 28 ngày xuất phát từ Thứ 2:
      // Tuần 1: ngày 1, 2, 3, 4, 5 (T2-T6)
      // Tuần 2: ngày 8, 9, 10, 11, 12 (T2-T6)
      // Tuần 3: ngày 15, 16, 17, 18, 19 (T2-T6)
      // Tuần 4: ngày 22, 23 (T2, T3) -> tổng cộng 17 ngày bỏ phiếu
      const votingDays = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23]
      for (const d of votingDays) {
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

      // Thêm 1 ngày voted vào Ngày 6 (Thứ 7 - ngày nghỉ theo nhịp)
      track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: 6,
            status: 'voted',
            done: true,
          },
          overrideAccess: true,
        }),
      )

      // Tổng số check-in done=true là 18, nhưng chỉ có 17 ngày thuộc votingDays!
      // Cần 90% của 20 ngày bỏ phiếu = 18 ngày. 17 < 18 -> từ chối cấp chứng nhận
      await expect(issueCertificate(customer.id, { payload })).rejects.toThrow()

      // Kế hoạch cập nhật outcome thành 'experienced' ("Đã trải nghiệm")
      const updatedPlan = await payload.findByID({
        collection: 'habitPlans',
        id: plan.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(updatedPlan.outcome).toBe('experienced')

      // Bây giờ thêm ngày thứ 18 hợp lệ vào voting day (Ngày 24 - Thứ 4 tuần 4)
      track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: plan.id,
            day: 24,
            status: 'minimal',
            done: true,
          },
          overrideAccess: true,
        }),
      )

      // Cấp chứng nhận thành công!
      const cert = await issueCertificate(customer.id, { payload })
      track('certificates', cert)
      expect(cert.daysCompleted).toBe(18)
      expect(cert.isNew).toBe(true)

      // Kế hoạch cập nhật outcome thành 'completed'
      const completedPlan = await payload.findByID({
        collection: 'habitPlans',
        id: plan.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(completedPlan.outcome).toBe('completed')
    })
  })
})
