// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '../../src/payload.config'
import type { Customer, HabitPlan, Product, User } from '../../src/payload-types'
import { vi as viStrings } from '../../src/lib/i18n/vi'
import { CHECKIN_STATUS_VALUES } from '../../src/collections/HabitCheckins'
import { checkInDay } from '../../src/lib/habit/tracker-actions'
import * as sessionServer from '../../src/lib/auth/session.server'
import * as trackerServer from '../../src/lib/habit/tracker.server'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import { computeOutcome, countCompletedVotingDays } from '../../src/lib/habit/journey'
import {
  BACKFILL_CHECKIN_STATUS_MISSED_SQL,
  BACKFILL_CHECKIN_STATUS_VOTED_SQL,
} from '../../src/migrations/20261024_072228_hb04_checkin_status'

describe('HB-04: Check-in 4 trạng thái (habitCheckins.status) và đồng bộ done', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []

  let customerA: Customer
  let customerB: Customer
  let habitProduct: Product
  let planA: HabitPlan

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const suffix = randomUUID().slice(0, 8)

    // Đảm bảo có sản phẩm Habit Tracker
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
            name: 'Habit Tracker Số',
            slug: HABIT_TRACKER_PRODUCT_SLUG,
            isSample: true,
            web: 'habit',
            type: 'digital_tool',
            price: 250000,
            salePrice: 178000,
            saleStatus: 'on_sale',
            _status: 'published',
          },
          overrideAccess: true,
        })) as Product,
      )
    }

    // Tạo Customer A
    customerA = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `cust-hb04-a-${suffix}@example.test`,
          name: 'Học viên HB04 A',
        },
        overrideAccess: true,
      }),
    )

    // Cấp quyền truy cập cho Customer A
    track(
      'entitlements',
      await payload.create({
        collection: 'entitlements',
        data: {
          customer: customerA.id,
          product: habitProduct.id,
          status: 'trial',
          source: 'trial',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        overrideAccess: true,
      }),
    )

    // Tạo Customer B
    customerB = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `cust-hb04-b-${suffix}@example.test`,
          name: 'Học viên HB04 B',
        },
        overrideAccess: true,
      }),
    )

    // Cấp quyền truy cập cho Customer B
    track(
      'entitlements',
      await payload.create({
        collection: 'entitlements',
        data: {
          customer: customerB.id,
          product: habitProduct.id,
          status: 'trial',
          source: 'trial',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        overrideAccess: true,
      }),
    )

    // Kế hoạch cho Customer A bắt đầu từ 15 ngày trước để ngày 1-15 không bị FUTURE_DAY
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    planA = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customerA.id,
          identityStatement: 'Tập thở mỗi sáng để thấu hiểu bản thân',
          startDate: fifteenDaysAgo.toISOString().split('T')[0],
        },
        overrideAccess: true,
      }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    for (const item of created.reverse()) {
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      } catch {
        // Bỏ qua lỗi dọn dẹp
      }
    }
  })

  describe('1. Hook syncDoneFromStatus & Ánh xạ 4 trạng thái', () => {
    it('tạo check-in với từng status -> done đúng bảng quy định', async () => {
      // 1. voted -> done = true
      const cVoted = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: planA.id,
            day: 1,
            status: 'voted',
          },
          overrideAccess: true,
        }),
      )
      expect(cVoted.status).toBe('voted')
      expect(cVoted.done).toBe(true)

      // 2. minimal -> done = true
      const cMinimal = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: planA.id,
            day: 2,
            status: 'minimal',
          },
          overrideAccess: true,
        }),
      )
      expect(cMinimal.status).toBe('minimal')
      expect(cMinimal.done).toBe(true)

      // 3. missed -> done = false
      const cMissed = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: planA.id,
            day: 3,
            status: 'missed',
          },
          overrideAccess: true,
        }),
      )
      expect(cMissed.status).toBe('missed')
      expect(cMissed.done).toBe(false)

      // 4. rest -> done = false
      const cRest = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: planA.id,
            day: 4,
            status: 'rest',
          },
          overrideAccess: true,
        }),
      )
      expect(cRest.status).toBe('rest')
      expect(cRest.done).toBe(false)
    })

    it('chỉ gửi done: true/false (API cũ) -> suy ra status = voted / missed', async () => {
      // API cũ gửi done: true
      const cOldTrue = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: planA.id,
            day: 5,
            done: true,
          } as any,
          overrideAccess: true,
        }),
      )
      expect(cOldTrue.status).toBe('voted')
      expect(cOldTrue.done).toBe(true)

      // API cũ gửi done: false
      const cOldFalse = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: planA.id,
            day: 6,
            done: false,
          } as any,
          overrideAccess: true,
        }),
      )
      expect(cOldFalse.status).toBe('missed')
      expect(cOldFalse.done).toBe(false)
    })

    it('gửi status: minimal, done: false -> status giữ minimal, done = true (status thắng)', async () => {
      const cConflict = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: planA.id,
            day: 7,
            status: 'minimal',
            done: false,
          },
          overrideAccess: true,
        }),
      )
      expect(cConflict.status).toBe('minimal')
      expect(cConflict.done).toBe(true)
    })

    it('gửi status: rest, done: true -> status giữ rest, done = false (status thắng)', async () => {
      const cRestConflict = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: planA.id,
            day: 8,
            status: 'rest',
            done: true,
          },
          overrideAccess: true,
        }),
      )
      expect(cRestConflict.status).toBe('rest')
      expect(cRestConflict.done).toBe(false)
    })
  })

  describe('2. Server Action checkInDay', () => {
    it('gửi status -> ghi nhận thành công và trả về status + done', async () => {
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customerA)
      vi.spyOn(trackerServer, 'getOrCreateTrackerPlan').mockResolvedValue(planA)

      const res = await checkInDay(9, undefined, 'joyful', 'Thực hành tối giản', 'minimal')
      expect(res.success).toBe(true)
      expect(res.status).toBe('minimal')
      expect(res.done).toBe(true)
      expect(res.day).toBe(9)

      // Kiểm tra DB
      const inDb = await payload.find({
        collection: 'habitCheckins',
        where: {
          and: [{ plan: { equals: planA.id } }, { day: { equals: 9 } }],
        },
        overrideAccess: true,
        limit: 1,
      })
      expect(inDb.docs.length).toBe(1)
      expect(inDb.docs[0].status).toBe('minimal')
      expect(inDb.docs[0].done).toBe(true)
      track('habitCheckins', inDb.docs[0])
    })

    it('gửi done (giao diện hiện tại) -> suy ra status = voted/missed', async () => {
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customerA)
      vi.spyOn(trackerServer, 'getOrCreateTrackerPlan').mockResolvedValue(planA)

      const res = await checkInDay(10, true, 'peaceful', 'Làm đủ cam kết')
      expect(res.success).toBe(true)
      expect(res.status).toBe('voted')
      expect(res.done).toBe(true)

      const inDb = await payload.find({
        collection: 'habitCheckins',
        where: {
          and: [{ plan: { equals: planA.id } }, { day: { equals: 10 } }],
        },
        overrideAccess: true,
        limit: 1,
      })
      expect(inDb.docs[0].status).toBe('voted')
      expect(inDb.docs[0].done).toBe(true)
      track('habitCheckins', inDb.docs[0])
    })

    it('không gửi cả status lẫn done -> báo lỗi tiếng Việt INVALID_INPUT', async () => {
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customerA)
      vi.spyOn(trackerServer, 'getOrCreateTrackerPlan').mockResolvedValue(planA)

      const res = await checkInDay(11, undefined, null, null, null)
      expect(res.success).toBe(false)
      expect(res.error).toBe('INVALID_INPUT')
      expect(res.message).toBe(viStrings.hb04.errors.statusOrDoneRequired)
    })

    it('khách khác cố tình check-in vào kế hoạch -> bị chặn FORBIDDEN', async () => {
      // Customer B đăng nhập, cố thao tác trên planA của Customer A
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customerB)
      vi.spyOn(trackerServer, 'getOrCreateTrackerPlan').mockResolvedValue(planA)

      const res = await checkInDay(12, true)
      expect(res.success).toBe(false)
      expect(res.error).toBe('FORBIDDEN')
    })
  })

  describe('3. Luật 90% chứng nhận: Bản tối giản (minimal) tính vào ngày hoàn thành', () => {
    it('kế hoạch 10 ngày, 9 ngày minimal, 1 ngày missed -> đủ điều kiện chứng nhận (90%)', async () => {
      // 12 ngày trước -> hôm nay là ngày 13 (> 10 ngày hành trình)
      const twelveDaysAgo = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
      const tenDayPlan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Kế hoạch 10 ngày thử nghiệm bản tối giản',
            startDate: twelveDaysAgo.toISOString().split('T')[0],
            journeyDays: 10,
          },
          overrideAccess: true,
        }),
      )

      // Tạo 9 ngày minimal và 1 ngày missed
      const checkinDocs: Array<{ day: number; done: boolean; status: string }> = []
      for (let day = 1; day <= 9; day++) {
        const c = track(
          'habitCheckins',
          await payload.create({
            collection: 'habitCheckins',
            data: {
              plan: tenDayPlan.id,
              day,
              status: 'minimal',
            },
            overrideAccess: true,
          }),
        )
        checkinDocs.push(c as { day: number; done: boolean; status: string })
      }

      const cMissed = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: tenDayPlan.id,
            day: 10,
            status: 'missed',
          },
          overrideAccess: true,
        }),
      )
      checkinDocs.push(cMissed as { day: number; done: boolean; status: string })

      // countCompletedVotingDays phải đếm cả 9 ngày minimal vì done = true
      const completedVotingDays = countCompletedVotingDays(tenDayPlan, checkinDocs)
      expect(completedVotingDays).toBe(9)

      // Kết quả tính outcome qua ngày cuối: 9/10 = 90% -> 'completed'
      const outcome = computeOutcome({
        plan: tenDayPlan,
        checkins: checkinDocs,
        today: new Date(),
        percent: 90,
      })
      expect(outcome).toBe('completed')
    })
  })

  describe('4. Migration Backfill từ SQL', () => {
    it('chạy câu UPDATE của migration: done=true -> voted, NULL -> missed', async () => {
      const suffix = randomUUID().slice(0, 6)
      const tempPlan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: `Kế hoạch test backfill ${suffix}`,
            startDate: new Date().toISOString().split('T')[0],
          },
          overrideAccess: true,
        }),
      )

      // Tạo 2 check-in
      const c1 = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: { plan: tempPlan.id, day: 1, status: 'voted' },
          overrideAccess: true,
        }),
      )
      const c2 = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: { plan: tempPlan.id, day: 2, status: 'voted' },
          overrideAccess: true,
        }),
      )

      // Dùng SQL đặt done=false cho c2, và đặt status = NULL cho cả hai để mô phỏng dữ liệu cũ trước migration
      await (payload.db as any).drizzle.execute(
        sql.raw(`
          ALTER TABLE "habit_checkins" ALTER COLUMN "status" DROP NOT NULL;
          UPDATE "habit_checkins" SET "status" = NULL, "done" = true WHERE "id" = ${c1.id};
          UPDATE "habit_checkins" SET "status" = NULL, "done" = false WHERE "id" = ${c2.id};
        `),
      )

      // Kiểm tra trạng thái đã thành NULL trong DB
      const nullCheck = await (payload.db as any).drizzle.execute(
        sql.raw(
          `SELECT "id", "status", "done" FROM "habit_checkins" WHERE "id" IN (${c1.id}, ${c2.id})`,
        ),
      )
      const nullRows = (nullCheck.rows || nullCheck) as Array<{
        id: number
        status: string | null
        done: boolean
      }>
      expect(nullRows.find((r) => r.id === c1.id)?.status).toBeNull()
      expect(nullRows.find((r) => r.id === c2.id)?.status).toBeNull()

      // Chạy câu UPDATE của migration
      await (payload.db as any).drizzle.execute(sql.raw(BACKFILL_CHECKIN_STATUS_VOTED_SQL))
      await (payload.db as any).drizzle.execute(sql.raw(BACKFILL_CHECKIN_STATUS_MISSED_SQL))

      // Khôi phục NOT NULL
      await (payload.db as any).drizzle.execute(
        sql.raw(`ALTER TABLE "habit_checkins" ALTER COLUMN "status" SET NOT NULL;`),
      )

      // Kiểm tra kết quả: c1 (done=true) -> 'voted', c2 (done=false) -> 'missed'
      const backfilledCheck = await (payload.db as any).drizzle.execute(
        sql.raw(
          `SELECT "id", "status", "done" FROM "habit_checkins" WHERE "id" IN (${c1.id}, ${c2.id})`,
        ),
      )
      const rows = (backfilledCheck.rows || backfilledCheck) as Array<{
        id: number
        status: string
        done: boolean
      }>

      const row1 = rows.find((r) => r.id === c1.id)
      const row2 = rows.find((r) => r.id === c2.id)

      expect(row1?.status).toBe('voted')
      expect(row1?.done).toBe(true)

      expect(row2?.status).toBe('missed')
      expect(row2?.done).toBe(false)
    })
  })
})
