// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, SiteSetting } from '../../src/payload-types'
import {
  computeOutcome,
  countCompletedVotingDays,
  getJourneyDays,
  getVotingDays,
  requiredDays,
} from '../../src/lib/habit/journey'
import { checkInDay } from '../../src/lib/habit/tracker-actions'
import { getCertificateEligibility, issueCertificate } from '../../src/lib/habit/certificate.server'
import * as sessionServer from '../../src/lib/auth/session.server'
import { addVietnamDays, getVietnamYmd } from '../../src/lib/habit/tracker-stats'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'

describe('HB-02: Luật hành trình 28 ngày & Luật 90% cấp chứng nhận (habit/journey)', () => {
  describe('Pure functions (journey.ts)', () => {
    it('getJourneyDays: trả về số ngày của kế hoạch hoặc 21 nếu không có', () => {
      expect(getJourneyDays({ journeyDays: 28 })).toBe(28)
      expect(getJourneyDays({ journeyDays: 21 })).toBe(21)
      expect(getJourneyDays({ journeyDays: 14 })).toBe(14)
      expect(getJourneyDays({ journeyDays: null })).toBe(21)
      expect(getJourneyDays(null)).toBe(21)
      expect(getJourneyDays({})).toBe(21)
    })

    it('getVotingDays: trả về mảng 1..journeyDays khi không có rhythmDays', () => {
      const days28 = getVotingDays({ journeyDays: 28 })
      expect(days28).toHaveLength(28)
      expect(days28[0]).toBe(1)
      expect(days28[27]).toBe(28)

      const days21 = getVotingDays({ journeyDays: 21 })
      expect(days21).toHaveLength(21)
      expect(days21[20]).toBe(21)
    })

    it('getVotingDays với rhythmDays (HB-05): 28 ngày nhịp 5/7 ra đúng 20 ngày; 30 ngày phụ thuộc ngày bắt đầu', () => {
      const weekdays5 = ['mon', 'tue', 'wed', 'thu', 'fri']

      // 28 ngày (đúng 4 tuần): bắt đầu vào bất kỳ thứ nào đều có đúng 20 ngày bỏ phiếu
      const startMon = {
        journeyDays: 28,
        startDate: '2026-10-26', // Thứ 2
        rhythmDays: weekdays5,
      }
      const daysFromMon = getVotingDays(startMon)
      expect(daysFromMon).toHaveLength(20)
      expect(requiredDays(daysFromMon, 90)).toBe(18) // ceil(20 * 0.9) = 18

      const startSat = {
        journeyDays: 28,
        startDate: '2026-10-24', // Thứ 7
        rhythmDays: weekdays5,
      }
      const daysFromSat = getVotingDays(startSat)
      expect(daysFromSat).toHaveLength(20)
      expect(requiredDays(daysFromSat, 90)).toBe(18)

      // 30 ngày (4 tuần + 2 ngày): số ngày bỏ phiếu phụ thuộc thứ của ngày bắt đầu
      // Bắt đầu Thứ 2: 2 ngày dư là Thứ 2, Thứ 3 (nằm trong nhịp) -> 20 + 2 = 22 ngày
      const plan30Mon = {
        journeyDays: 30,
        startDate: '2026-10-26',
        rhythmDays: weekdays5,
      }
      expect(getVotingDays(plan30Mon)).toHaveLength(22)

      // Bắt đầu Thứ 7: 2 ngày dư là Thứ 7, Chủ Nhật (không nằm trong nhịp) -> 20 + 0 = 20 ngày
      const plan30Sat = {
        journeyDays: 30,
        startDate: '2026-10-24',
        rhythmDays: weekdays5,
      }
      expect(getVotingDays(plan30Sat)).toHaveLength(20)
    })

    it('requiredDays: tính chuẩn trần Math.ceil(votingDays.length * percent / 100)', () => {
      // 28 ngày, 90% -> 25.2 -> làm tròn lên 26
      expect(requiredDays(28, 90)).toBe(26)
      expect(
        requiredDays(
          Array.from({ length: 28 }, (_, i) => i + 1),
          90,
        ),
      ).toBe(26)

      // 21 ngày, 90% -> 18.9 -> làm tròn lên 19
      expect(requiredDays(21, 90)).toBe(19)

      // 28 ngày, 100% -> 28
      expect(requiredDays(28, 100)).toBe(28)

      // 28 ngày, 50% -> 14
      expect(requiredDays(28, 50)).toBe(14)

      // Không có ngày bỏ phiếu
      expect(requiredDays(0, 90)).toBe(0)
    })

    it('countCompletedVotingDays: đếm số ngày bỏ phiếu có done = true, không trùng lặp', () => {
      const plan = { journeyDays: 28 }
      const checkins = [
        { day: 1, done: true },
        { day: 2, done: true },
        { day: 2, done: true }, // trùng
        { day: 3, done: false },
        { day: 29, done: true }, // ngoài votingDays
      ]
      expect(countCompletedVotingDays(plan, checkins)).toBe(2)
    })

    it('countCompletedVotingDays với nhịp tuần: chỉ đếm voted/minimal trên ngày bỏ phiếu, ngày nghỉ bị bỏ qua', () => {
      const plan = {
        journeyDays: 28,
        startDate: '2026-10-26', // Thứ 2 (Day 1)
        rhythmDays: ['mon', 'wed', 'fri'], // Day 1 (Mon), Day 2 (Tue-rest), Day 3 (Wed), Day 4 (Thu-rest)
      }

      const checkins = [
        { day: 1, status: 'voted' as const },
        { day: 2, status: 'voted' as const, done: true }, // Ngày nghỉ dù check-in cũng không tính
        { day: 3, status: 'minimal' as const }, // Bản tối giản tính vào hoàn thành
        { day: 4, status: 'rest' as const, done: false },
        { day: 5, status: 'missed' as const, done: false },
      ]
      // Chỉ Day 1 và Day 3 được tính điểm hoàn thành
      expect(countCompletedVotingDays(plan, checkins)).toBe(2)
    })

    describe('computeOutcome', () => {
      const baseToday = new Date('2026-10-30T10:00:00+07:00')

      it('chưa qua ngày cuối (currentDay <= journeyDays) -> in_progress', () => {
        // startDate là 10 ngày trước -> currentDay = 11 <= 28
        const plan = {
          journeyDays: 28,
          startDate: '2026-10-20',
        }
        const outcome = computeOutcome({
          plan,
          checkins: Array.from({ length: 10 }, (_, i) => ({ day: i + 1, done: true })),
          today: baseToday,
          percent: 90,
        })
        expect(outcome).toBe('in_progress')
      })

      it('đúng ngày cuối cùng (currentDay = 28) -> vẫn in_progress (chưa qua ngày cuối)', () => {
        // startDate là 27 ngày trước -> currentDay = 28
        const startDate = addVietnamDays(getVietnamYmd(baseToday), -27)
        const plan = {
          journeyDays: 28,
          startDate,
        }
        const outcome = computeOutcome({
          plan,
          checkins: Array.from({ length: 28 }, (_, i) => ({ day: i + 1, done: true })),
          today: baseToday,
          percent: 90,
        })
        expect(outcome).toBe('in_progress')
      })

      it('đã qua ngày cuối (currentDay = 29) và đạt đúng 26/28 ngày -> completed', () => {
        const startDate = addVietnamDays(getVietnamYmd(baseToday), -28) // currentDay = 29 > 28
        const plan = {
          journeyDays: 28,
          startDate,
        }
        const checkins = Array.from({ length: 26 }, (_, i) => ({ day: i + 1, done: true }))
        const outcome = computeOutcome({
          plan,
          checkins,
          today: baseToday,
          percent: 90,
        })
        expect(outcome).toBe('completed')
      })

      it('đã qua ngày cuối (currentDay = 29) nhưng chỉ đạt 25/28 ngày -> experienced', () => {
        const startDate = addVietnamDays(getVietnamYmd(baseToday), -28) // currentDay = 29 > 28
        const plan = {
          journeyDays: 28,
          startDate,
        }
        const checkins = Array.from({ length: 25 }, (_, i) => ({ day: i + 1, done: true }))
        const outcome = computeOutcome({
          plan,
          checkins,
          today: baseToday,
          percent: 90,
        })
        expect(outcome).toBe('experienced')
      })

      it('kế hoạch 21 ngày cũ: đạt 19/21 -> completed, 18/21 -> experienced', () => {
        const startDate = addVietnamDays(getVietnamYmd(baseToday), -22) // currentDay = 23 > 21
        const plan = {
          journeyDays: 21,
          startDate,
        }

        const pass = computeOutcome({
          plan,
          checkins: Array.from({ length: 19 }, (_, i) => ({ day: i + 1, done: true })),
          today: baseToday,
          percent: 90,
        })
        expect(pass).toBe('completed')

        const fail = computeOutcome({
          plan,
          checkins: Array.from({ length: 18 }, (_, i) => ({ day: i + 1, done: true })),
          today: baseToday,
          percent: 90,
        })
        expect(fail).toBe('experienced')
      })
    })
  })

  describe('DB Integration Tests (Payload DB)', () => {
    let payload: Payload
    const created: { collection: CollectionSlug; id: number }[] = []
    let originalJourneyDays: number | null | undefined
    let originalMinPercent: number | null | undefined

    const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
      created.push({ collection, id: doc.id })
      return doc
    }

    beforeAll(async () => {
      payload = await getPayload({ config: await config })

      const siteSettings = (await payload.findGlobal({
        slug: 'siteSettings',
        depth: 0,
      })) as SiteSetting | null

      originalJourneyDays = siteSettings?.habitJourneyDays
      originalMinPercent = siteSettings?.certificateMinPercent

      // Đặt giá trị chuẩn HB-02
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: {
          habitJourneyDays: 28,
          certificateMinPercent: 90,
        },
      })
    })

    afterAll(async () => {
      // Khôi phục siteSettings
      await payload
        .updateGlobal({
          slug: 'siteSettings',
          data: {
            habitJourneyDays: originalJourneyDays ?? 28,
            certificateMinPercent: originalMinPercent ?? 90,
          },
        })
        .catch(() => {})

      // Dọn dẹp bản ghi test
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

    it('kế hoạch mới tự động nhận journeyDays = siteSettings.habitJourneyDays (28)', async () => {
      const customer = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `hb02-plan-days-${Date.now()}@example.test`,
            name: 'Học viên Test HB02',
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
            startDate: new Date().toISOString().split('T')[0],
            identityStatement: 'Tôi sẽ luyện tập thói quen 28 ngày',
          },
          overrideAccess: true,
        }),
      )

      expect(plan.journeyDays).toBe(28)
      expect(plan.outcome).toBe('in_progress')
    })

    it('khách tự tạo / sửa kế hoạch qua API không đặt được journeyDays hay outcome', async () => {
      const customer = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `hb02-plan-forge-${Date.now()}@example.test`,
            name: 'Học viên Test Giả Mạo',
          },
          overrideAccess: true,
        }),
      )
      const asCustomer = { ...customer, collection: 'customers' } as never

      const plan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            startDate: new Date().toISOString().split('T')[0],
            identityStatement: 'Thử đặt hành trình 1 ngày',
            journeyDays: 1,
            outcome: 'completed',
          },
          user: asCustomer,
          overrideAccess: false,
        }),
      )
      const stored = await payload.findByID({
        collection: 'habitPlans',
        id: plan.id,
        overrideAccess: true,
      })
      expect(stored.journeyDays).toBe(28)
      expect(stored.outcome).toBe('in_progress')

      await payload.update({
        collection: 'habitPlans',
        id: plan.id,
        data: { outcome: 'completed', journeyDays: 1 },
        user: asCustomer,
        overrideAccess: false,
      })
      const afterUpdate = await payload.findByID({
        collection: 'habitPlans',
        id: plan.id,
        overrideAccess: true,
      })
      expect(afterUpdate.journeyDays).toBe(28)
      expect(afterUpdate.outcome).toBe('in_progress')
    })

    it('đổi cài đặt siteSettings sau đó không làm đổi journeyDays của kế hoạch đã tạo', async () => {
      const customer = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `hb02-plan-immutable-${Date.now()}@example.test`,
            name: 'Học viên Test Cố Định',
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
            startDate: new Date().toISOString().split('T')[0],
            identityStatement: 'Kế hoạch tạo trước khi đổi cài đặt',
          },
          overrideAccess: true,
        }),
      )
      expect(plan.journeyDays).toBe(28)

      // Đổi siteSettings thành 14 ngày
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: { habitJourneyDays: 14 },
      })

      // Cập nhật câu định danh của kế hoạch cũ
      const updatedPlan = await payload.update({
        collection: 'habitPlans',
        id: plan.id,
        data: {
          identityStatement: 'Cập nhật định danh nhưng số ngày không đổi',
        },
        overrideAccess: true,
      })
      expect(updatedPlan.journeyDays).toBe(28)

      // Khôi phục lại 28
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: { habitJourneyDays: 28 },
      })
    })

    it('check-in ngày 29 của kế hoạch 28 ngày bị từ chối', async () => {
      const customer = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `hb02-checkin-reject-${Date.now()}@example.test`,
            name: 'Học viên Checkin Reject',
          },
          overrideAccess: true,
        }),
      )

      // Cấp entitlement để customer có quyền check-in
      const products = await payload.find({
        collection: 'products',
        where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
        overrideAccess: true,
        limit: 1,
      })
      // Empty DB (CI runs unit tests unseeded): create the product and delete it afterwards.
      const product =
        products.docs[0] ??
        track(
          'products',
          await payload.create({
            collection: 'products',
            data: {
              name: '[MẪU] Habit Tracker test HB-02',
              slug: HABIT_TRACKER_PRODUCT_SLUG,
              isSample: true,
              web: 'habit',
              type: 'digital_tool',
              price: 250000,
              trialDays: 28,
              saleStatus: 'on_sale',
              _status: 'published',
            },
            overrideAccess: true,
          }),
        )
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: product.id,
            source: 'trial',
            status: 'trial',
            expiresAt: new Date(Date.now() + 28 * 86400000).toISOString(),
          },
          overrideAccess: true,
        }),
      )

      // startDate 30 ngày trước để ngày 29 không bị lỗi ngày tương lai
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 30)
      const startDate = pastDate.toISOString().split('T')[0]

      const plan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            startDate,
            identityStatement: 'Kế hoạch kiểm tra check-in quá ngày',
          },
          overrideAccess: true,
        }),
      )
      expect(plan.journeyDays).toBe(28)

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer as Customer)

      const res = await checkInDay(29, true)
      expect(res.success).toBe(false)
      expect(res.message).toContain('vượt quá số ngày')
    })

    it('chứng nhận: 26/28 ngày được cấp + outcome = completed; 25/28 ngày không cấp + outcome = experienced', async () => {
      const todayYmd = getVietnamYmd(new Date())

      // 1. Học viên Pass (26/28)
      const passCustomer = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `hb02-cert-pass-${Date.now()}@example.test`,
            name: 'Học viên HB02 Đạt',
          },
          overrideAccess: true,
        }),
      )

      const passPlan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: passCustomer.id,
            startDate: addVietnamDays(todayYmd, -29), // currentDay = 30 > 28
            identityStatement: 'Tôi sẽ kiên trì 26 ngày',
          },
          overrideAccess: true,
        }),
      )

      for (let day = 1; day <= 26; day++) {
        track(
          'habitCheckins',
          await payload.create({
            collection: 'habitCheckins',
            data: {
              plan: passPlan.id,
              day,
              status: 'voted',
              done: true,
            },
            overrideAccess: true,
          }),
        )
      }

      const passCert = await issueCertificate(passCustomer.id, { payload })
      track('certificates', passCert)
      expect(passCert).toBeDefined()
      expect(passCert.daysCompleted).toBe(26)

      const passPlanAfter = await payload.findByID({
        collection: 'habitPlans',
        id: passPlan.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(passPlanAfter?.outcome).toBe('completed')

      // 2. Học viên Fail (25/28) -> Bị từ chối và ghi outcome = experienced
      const failCustomer = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `hb02-cert-fail-${Date.now()}@example.test`,
            name: 'Học viên HB02 Trải Nghiệm',
          },
          overrideAccess: true,
        }),
      )

      const failPlan = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: failCustomer.id,
            startDate: addVietnamDays(todayYmd, -29), // currentDay = 30 > 28
            identityStatement: 'Tôi trải nghiệm 25 ngày',
          },
          overrideAccess: true,
        }),
      )

      for (let day = 1; day <= 25; day++) {
        track(
          'habitCheckins',
          await payload.create({
            collection: 'habitCheckins',
            data: {
              plan: failPlan.id,
              day,
              status: 'voted',
              done: true,
            },
            overrideAccess: true,
          }),
        )
      }

      await expect(issueCertificate(failCustomer.id, { payload })).rejects.toThrow()

      const failEligibility = await getCertificateEligibility(failCustomer.id, { payload })
      expect(failEligibility.eligible).toBe(false)
      expect(failEligibility.outcome).toBe('experienced')

      const failPlanAfter = await payload.findByID({
        collection: 'habitPlans',
        id: failPlan.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(failPlanAfter?.outcome).toBe('experienced')
    })
  })
})
