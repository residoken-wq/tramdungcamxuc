// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitPlan, Product } from '../../src/payload-types'
import * as sessionServer from '../../src/lib/auth/session.server'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import { vietnamTodayIso } from '../../src/lib/habit/tracker-stats'
import { findOwnTrackerPlan, getOrCreateTrackerPlan } from '../../src/lib/habit/tracker.server'
import {
  buildCoachSummary,
  buildHabitBackup,
  buildHabitCsv,
  escapeCsvCell,
  HABIT_BACKUP_FORMAT,
  HABIT_BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  parseHabitBackup,
  serializeHabitBackup,
} from '../../src/lib/habit/backup'
import {
  copyForCoach,
  exportBackup,
  exportCsv,
  restartJourney,
  restoreBackup,
} from '../../src/lib/habit/my-data-actions'

describe('HB-13: Dữ liệu của bạn – Bản sao lưu, CSV, Khôi phục, Gửi Coach, Bắt đầu lại', () => {
  // ============================================================================
  // 1. UNIT TESTS (Hàm thuần & Schema Zod trong src/lib/habit/backup.ts)
  // ============================================================================
  describe('1. Unit: Định dạng sao lưu JSON, Zod validation, CSV 28 ngày & Gửi Coach', () => {
    const samplePlan = {
      id: 999,
      customer: 888,
      leadEmail: 'secret-user@example.test',
      identityStatement: 'Tôi sẽ đọc sách 15 phút mỗi tối để trở thành người sâu sắc',
      rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'] as const,
      anchorHabit: 'Uống trà hoa cúc lúc 21:00',
      twoMinuteAction: 'Mở sách đọc 1 trang',
      privateReason: 'Lý do thầm kín chỉ riêng mình tôi biết',
      companionName: 'Bạn Minh Anh',
      chosenTechniques: [
        {
          id: 'row-internal-1',
          technique: {
            id: 77,
            name: 'Thiết kế môi trường',
            stage: 'cue',
          },
          action: 'Đặt sách ngay trên gối từ buổi sáng',
        },
      ],
      startDate: '2026-10-26T00:00:00.000+07:00',
      journeyDays: 28,
    }

    const sampleCheckins = [
      {
        id: 501,
        plan: 999,
        planDay: '999:1',
        day: 1,
        status: 'voted' as const,
        done: true,
        emotion: 'peaceful',
        note: 'Đọc được 10 trang rất tập trung',
      },
      {
        id: 502,
        plan: 999,
        planDay: '999:2',
        day: 2,
        status: 'minimal' as const,
        done: true,
        emotion: 'peaceful',
        note: '=SUM(1,2) ghi chú có dấu bằng đầu câu',
      },
      {
        id: 503,
        plan: 999,
        planDay: '999:6',
        day: 6,
        status: 'rest' as const,
        done: false,
        emotion: 'relaxed',
        note: '+Nghỉ thứ bảy theo nhịp tuần',
      },
    ]

    it('export → import ra cùng dữ liệu (round-trip) và không chứa id nội bộ, email, customer, token', () => {
      const exportedAt = '2026-10-31T08:00:00.000Z'
      const backupObj = buildHabitBackup(samplePlan, sampleCheckins, { exportedAt })
      const jsonString = serializeHabitBackup(samplePlan, sampleCheckins, { exportedAt })

      // Không được lộ id nội bộ, email, customer, token
      expect(jsonString).not.toContain('secret-user@example.test')
      expect(jsonString).not.toContain('"id"')
      expect(jsonString).not.toContain('"customer"')
      expect(jsonString).not.toContain('"leadEmail"')
      expect(jsonString).not.toContain('"planDay"')
      expect(jsonString).not.toContain('999')
      expect(jsonString).not.toContain('888')

      // Cấu trúc đúng chuẩn
      expect(backupObj.format).toBe(HABIT_BACKUP_FORMAT)
      expect(backupObj.version).toBe(HABIT_BACKUP_VERSION)
      expect(backupObj.reflections).toEqual([])
      expect(backupObj.checkins).toHaveLength(3)

      // Đọc lại (import) -> ra cùng dữ liệu (round-trip)
      const parsed = parseHabitBackup(jsonString)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data).toEqual(backupObj)
      }
    })

    it('Zod chặn file sai format, sai version, vượt quá 200 KB hoặc có field quá dài / quá 366 check-in', () => {
      // 1. Quá 200 KB
      const hugeNote = 'a'.repeat(MAX_BACKUP_BYTES + 100)
      const resTooLarge = parseHabitBackup(hugeNote)
      expect(resTooLarge.success).toBe(false)
      if (!resTooLarge.success) {
        expect(resTooLarge.error).toBe('FILE_TOO_LARGE')
      }

      // 2. JSON lỗi cú pháp
      const resBadJson = parseHabitBackup('{ not valid json')
      expect(resBadJson.success).toBe(false)
      if (!resBadJson.success) {
        expect(resBadJson.error).toBe('INVALID_JSON')
      }

      // 3. Sai format
      const resBadFormat = parseHabitBackup(
        JSON.stringify({
          format: 'other-app-backup',
          version: 1,
          exportedAt: '2026-10-31T00:00:00Z',
          plan: {},
          checkins: [],
        }),
      )
      expect(resBadFormat.success).toBe(false)
      if (!resBadFormat.success) {
        expect(resBadFormat.error).toBe('INVALID_FORMAT')
      }

      // 4. Sai version
      const resBadVersion = parseHabitBackup(
        JSON.stringify({
          format: HABIT_BACKUP_FORMAT,
          version: 99,
          exportedAt: '2026-10-31T00:00:00Z',
          plan: {},
          checkins: [],
        }),
      )
      expect(resBadVersion.success).toBe(false)
      if (!resBadVersion.success) {
        expect(resBadVersion.error).toBe('UNSUPPORTED_VERSION')
      }

      // 5. Field quá dài (anchorHabit > 120 ký tự)
      const baseValid = buildHabitBackup(samplePlan, sampleCheckins)
      const tooLongAnchor = {
        ...baseValid,
        plan: {
          ...baseValid.plan,
          anchorHabit: 'x'.repeat(125),
        },
      }
      const resTooLongField = parseHabitBackup(JSON.stringify(tooLongAnchor))
      expect(resTooLongField.success).toBe(false)
      if (!resTooLongField.success) {
        expect(resTooLongField.error).toBe('INVALID_SCHEMA')
      }

      // 6. Quá 366 dòng check-in
      const tooManyCheckins = {
        ...baseValid,
        checkins: Array.from({ length: 367 }, (_, i) => ({
          day: (i % 366) + 1,
          status: 'voted',
          emotion: null,
          note: null,
        })),
      }
      const resTooMany = parseHabitBackup(JSON.stringify(tooManyCheckins))
      expect(resTooMany.success).toBe(false)
      if (!resTooMany.success) {
        expect(resTooMany.error).toBe('INVALID_SCHEMA')
      }
    })

    it('CSV 28 ngày có BOM UTF-8, chống CSV injection (= + - @) và tính ngày lịch đúng', () => {
      // Chống injection cho đủ 4 ký tự đầu = + - @
      expect(escapeCsvCell('=CMD()')).toBe("'=CMD()")
      expect(escapeCsvCell('+10 điểm, tốt')).toBe('"\'+10 điểm, tốt"')
      expect(escapeCsvCell('-20%')).toBe("'-20%")
      expect(escapeCsvCell('@coach')).toBe("'@coach")
      expect(escapeCsvCell('Bình thường')).toBe('Bình thường')

      // Tạo CSV 28 ngày từ samplePlan (startDate: 26/10/2026)
      const csv = buildHabitCsv(samplePlan, sampleCheckins, {
        today: new Date('2026-10-28T05:00:00.000Z'), // Ngày 3 (28/10/2026)
      })

      // 1. Có BOM UTF-8 ở đầu
      expect(csv.charCodeAt(0)).toBe(0xfeff)

      const lines = csv.slice(1).split('\r\n')
      // Header + 28 dòng
      expect(lines).toHaveLength(29)
      expect(lines[0]).toBe('Ngày,Ngày lịch,Trạng thái,Cảm xúc,Ghi chú')

      // Ngày 1: 26/10/2026, Bỏ phiếu, Bình an
      expect(lines[1]).toBe('1,26/10/2026,Bỏ phiếu,Bình an,Đọc được 10 trang rất tập trung')

      // Ngày 2: 27/10/2026, Bản tối giản, Bình an, ghi chú bắt đầu bằng '=' đã được thêm dấu nháy đơn '
      expect(lines[2]).toBe(
        '2,27/10/2026,Bản tối giản,Bình an,"\'=SUM(1,2) ghi chú có dấu bằng đầu câu"',
      )

      // Ngày 6 (31/10/2026): Nghỉ, Thư thái, ghi chú bắt đầu bằng '+' đã được thêm '
      expect(lines[6]).toBe("6,31/10/2026,Nghỉ,Thư thái,'+Nghỉ thứ bảy theo nhịp tuần")

      // Ngày 7 (qua tháng mới: 01/11/2026)
      expect(lines[7].startsWith('7,01/11/2026,')).toBe(true)

      // Ngày 28 (22/11/2026)
      expect(lines[28].startsWith('28,22/11/2026,')).toBe(true)
    })

    it('copyForCoach không lộ privateReason; chỉ kèm ghi chú khi khách tick includeNotes', () => {
      const summaryWithoutNotes = buildCoachSummary(samplePlan, sampleCheckins, {
        includeNotes: false,
        today: new Date('2026-10-28T05:00:00.000Z'),
      })

      // Có đủ thông tin cơ bản cho Coach
      expect(summaryWithoutNotes).toContain(
        'Tôi sẽ đọc sách 15 phút mỗi tối để trở thành người sâu sắc',
      )
      expect(summaryWithoutNotes).toContain('T2, T3, T4, T5, T6 (5/7 ngày)')
      expect(summaryWithoutNotes).toContain('26/10/2026 – 22/11/2026')
      expect(summaryWithoutNotes).toContain('2/20 ngày (hành trình 28 ngày)')
      expect(summaryWithoutNotes).toContain('Chuỗi hiện tại: 2 ngày')
      expect(summaryWithoutNotes).toContain('Bình an (2 ngày)')

      // Tuyệt đối không lộ lý do riêng và không lộ ghi chú khi chưa tick
      expect(summaryWithoutNotes).not.toContain('Lý do thầm kín chỉ riêng mình tôi biết')
      expect(summaryWithoutNotes).not.toContain('Đọc được 10 trang rất tập trung')
      expect(summaryWithoutNotes).not.toContain('Bạn Minh Anh')

      // Khi khách tự tick "Kèm ghi chú của tôi": có ghi chú nhưng VẪN KHÔNG lộ lý do riêng
      const summaryWithNotes = buildCoachSummary(samplePlan, sampleCheckins, {
        includeNotes: true,
        today: new Date('2026-10-28T05:00:00.000Z'),
      })
      expect(summaryWithNotes).toContain('Đọc được 10 trang rất tập trung')
      expect(summaryWithNotes).not.toContain('Lý do thầm kín chỉ riêng mình tôi biết')
      expect(summaryWithNotes).not.toContain('Bạn Minh Anh')
    })
  })

  // ============================================================================
  // 2. DB INTEGRATION TESTS (Server actions trong src/lib/habit/my-data-actions.ts)
  // ============================================================================
  describe('2. DB: Phân quyền khôi phục, giữ nguyên startDate, chặn rest vào ngày bỏ phiếu & Bắt đầu lại', () => {
    let payload: Payload
    let habitProduct: Product
    let createdProductByTest = false

    const createdIds: {
      customers: number[]
      entitlements: number[]
      habitPlans: number[]
      habitCheckins: number[]
    } = {
      customers: [],
      entitlements: [],
      habitPlans: [],
      habitCheckins: [],
    }

    function track<T extends { id: number }>(collection: keyof typeof createdIds, doc: T): T {
      if (!createdIds[collection].includes(doc.id)) {
        createdIds[collection].push(doc.id)
      }
      return doc
    }

    async function createTestCustomer(prefix: string): Promise<Customer> {
      const rand = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const cust = await payload.create({
        collection: 'customers',
        data: {
          email: `hb13-${prefix}-${rand}@example.test`,
          name: `Học viên HB13 ${prefix}`,
        },
        overrideAccess: true,
      })
      return track('customers', cust as Customer)
    }

    async function grantTrialAccess(customerId: number, expired = false) {
      const offsetMs = expired ? -2 * 24 * 60 * 60 * 1000 : 28 * 24 * 60 * 60 * 1000
      const ent = await payload.create({
        collection: 'entitlements',
        data: {
          customer: customerId,
          product: habitProduct.id,
          status: expired ? 'expired' : 'trial',
          source: 'trial',
          expiresAt: new Date(Date.now() + offsetMs).toISOString(),
        },
        overrideAccess: true,
      })
      return track('entitlements', ent)
    }

    beforeAll(async () => {
      payload = await getPayload({ config: await config })

      const existing = await payload.find({
        collection: 'products',
        where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
        overrideAccess: true,
        limit: 1,
      })

      if (existing.docs.length > 0) {
        habitProduct = existing.docs[0] as Product
      } else {
        habitProduct = (await payload.create({
          collection: 'products',
          data: {
            name: '[MẪU] Habit Tracker Số HB-13',
            slug: HABIT_TRACKER_PRODUCT_SLUG,
            web: 'habit',
            type: 'digital_tool',
            price: 250000,
            salePrice: 178000,
            trialDays: 28,
            saleStatus: 'on_sale',
            isSample: true,
            _status: 'published',
          },
          overrideAccess: true,
        })) as Product
        createdProductByTest = true
      }
    }, 60000)

    beforeEach(() => {
      vi.restoreAllMocks()
    })

    afterAll(async () => {
      vi.restoreAllMocks()
      if (!payload) return

      for (const planId of createdIds.habitPlans) {
        try {
          const checkins = await payload.find({
            collection: 'habitCheckins',
            where: { plan: { equals: planId } },
            limit: 400,
            overrideAccess: true,
          })
          for (const ch of checkins.docs) {
            await payload.delete({
              collection: 'habitCheckins',
              id: ch.id,
              overrideAccess: true,
            })
          }
        } catch {
          // ignore cleanup errors
        }
      }

      for (const id of createdIds.habitCheckins) {
        try {
          await payload.delete({ collection: 'habitCheckins', id, overrideAccess: true })
        } catch {
          // ignore
        }
      }
      for (const id of createdIds.habitPlans) {
        try {
          await payload.delete({ collection: 'habitPlans', id, overrideAccess: true })
        } catch {
          // ignore
        }
      }
      for (const id of createdIds.entitlements) {
        try {
          await payload.delete({ collection: 'entitlements', id, overrideAccess: true })
        } catch {
          // ignore
        }
      }
      for (const id of createdIds.customers) {
        try {
          await payload.delete({
            collection: 'customers',
            id,
            overrideAccess: true,
            context: { accountDeletion: true },
          })
        } catch {
          // ignore
        }
      }
      if (createdProductByTest && habitProduct?.id) {
        try {
          await payload.delete({
            collection: 'products',
            id: habitProduct.id,
            overrideAccess: true,
          })
        } catch {
          // ignore
        }
      }
    }, 60000)

    it('khách B không khôi phục được vào kế hoạch của khách A', async () => {
      const customerA = await createTestCustomer('custA')
      const customerB = await createTestCustomer('custB')
      await grantTrialAccess(customerA.id)
      await grantTrialAccess(customerB.id)

      const planA = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Kế hoạch gốc của khách A',
            startDate: '2026-10-20T00:00:00.000+07:00',
            journeyDays: 28,
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      const planB = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerB.id,
            identityStatement: 'Kế hoạch gốc của khách B',
            startDate: '2026-10-25T00:00:00.000+07:00',
            journeyDays: 28,
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      const maliciousBackup = serializeHabitBackup(
        {
          identityStatement: 'Bị ghi đè bởi B',
          startDate: '2026-10-20T00:00:00.000+07:00',
          journeyDays: 28,
        },
        [{ day: 1, status: 'voted', emotion: 'joyful', note: 'Ghi chú từ B' }],
      )

      // Giả lập phiên đăng nhập là khách B
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customerB)

      // 1. Khách B cố tình truyền planId của khách A -> bị chặn FORBIDDEN
      const attemptCrossPlan = await restoreBackup(maliciousBackup, { planId: planA.id })
      expect(attemptCrossPlan.success).toBe(false)
      expect(attemptCrossPlan.error).toBe('FORBIDDEN')

      // Kiểm tra kế hoạch của A hoàn toàn nguyên vẹn, không có check-in nào bị ghi vào
      const planAAfterCross = await payload.findByID({
        collection: 'habitPlans',
        id: planA.id,
        overrideAccess: true,
      })
      expect(planAAfterCross.identityStatement).toBe('Kế hoạch gốc của khách A')

      const checkinsA = await payload.find({
        collection: 'habitCheckins',
        where: { plan: { equals: planA.id } },
        overrideAccess: true,
      })
      expect(checkinsA.totalDocs).toBe(0)

      // 2. Khách B gọi restoreBackup bình thường -> chỉ ghi vào kế hoạch của chính B (planB)
      const normalRestoreB = await restoreBackup(maliciousBackup)
      expect(normalRestoreB.success).toBe(true)
      expect(normalRestoreB.restored).toBe(1)

      const checkinsAAfter = await payload.find({
        collection: 'habitCheckins',
        where: { plan: { equals: planA.id } },
        overrideAccess: true,
      })
      expect(checkinsAAfter.totalDocs).toBe(0)

      const checkinsBAfter = await payload.find({
        collection: 'habitCheckins',
        where: { plan: { equals: planB.id } },
        overrideAccess: true,
      })
      expect(checkinsBAfter.totalDocs).toBe(1)
    })

    it('khôi phục không đổi startDate và journeyDays của kế hoạch; chặn check-in ngoài phạm vi và chặn rest vào ngày bỏ phiếu', async () => {
      const customer = await createTestCustomer('restore-rules')
      await grantTrialAccess(customer.id)

      // Ngày bắt đầu: Thứ Hai 26/10/2026, nhịp tuần: T2..T6 (T7 = ngày 6 là ngày nghỉ)
      const originalStartDate = new Date('2026-10-26T00:00:00.000+07:00').toISOString()
      const plan = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Tuyên ngôn ban đầu',
            rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
            startDate: originalStartDate,
            journeyDays: 28,
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      // File sao lưu có startDate khác (01/01/2026), journeyDays khác (30),
      // gồm:
      // - Ngày 1 (T2 - ngày bỏ phiếu): voted -> hợp lệ (restored)
      // - Ngày 2 (T3 - ngày bỏ phiếu): rest -> bị chặn bởi validateStatusForRhythm (skipped)
      // - Ngày 6 (T7 - ngày nghỉ theo nhịp): rest -> hợp lệ (restored)
      // - Ngày 30 (vượt quá journeyDays=28): voted -> bị chặn ngoài phạm vi (skipped)
      const backupJson = serializeHabitBackup(
        {
          identityStatement: 'Tuyên ngôn mới từ bản sao lưu',
          anchorHabit: 'Sau khi đánh răng buổi sáng',
          twoMinuteAction: 'Viết 1 dòng nhật ký',
          privateReason: 'Lý do riêng được khôi phục',
          companionName: 'Lan Hương',
          rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          startDate: '2026-01-01T00:00:00.000+07:00',
          journeyDays: 30,
        },
        [
          { day: 1, status: 'voted', emotion: 'confident', note: 'Ngày 1 tốt' },
          { day: 2, status: 'rest', emotion: 'tired', note: 'Thử ghi nghỉ vào Thứ Ba' },
          { day: 6, status: 'rest', emotion: 'relaxed', note: 'Nghỉ Thứ Bảy hợp lệ' },
          { day: 30, status: 'voted', emotion: 'joyful', note: 'Ngoài 28 ngày' },
        ],
      )

      const result = await restoreBackup(backupJson)
      expect(result.success).toBe(true)
      expect(result.restored).toBe(2) // Ngày 1 và Ngày 6
      expect(result.skipped).toBe(2) // Ngày 2 (rest vào ngày bỏ phiếu) và Ngày 30 (ngoài 28 ngày)
      expect(result.reasons.some((r) => r.includes('Ngày 2'))).toBe(true)
      expect(result.reasons.some((r) => r.includes('Ngày 30'))).toBe(true)
      expect(result.reasons.some((r) => r.includes('26/10/2026'))).toBe(true)

      // Kiểm tra DB: startDate và journeyDays KHÔNG ĐỔI, các field khách sửa đã cập nhật
      const updatedPlan = (await payload.findByID({
        collection: 'habitPlans',
        id: plan.id,
        overrideAccess: true,
      })) as HabitPlan

      expect(new Date(updatedPlan.startDate!).toISOString()).toBe(originalStartDate)
      expect(updatedPlan.journeyDays).toBe(28)
      expect(updatedPlan.identityStatement).toBe('Tuyên ngôn mới từ bản sao lưu')
      expect(updatedPlan.anchorHabit).toBe('Sau khi đánh răng buổi sáng')
      expect(updatedPlan.twoMinuteAction).toBe('Viết 1 dòng nhật ký')
      expect(updatedPlan.privateReason).toBe('Lý do riêng được khôi phục')
      expect(updatedPlan.companionName).toBe('Lan Hương')

      // Kiểm tra exportBackup và copyForCoach sau khi khôi phục
      const exportedAfter = await exportBackup()
      expect(exportedAfter.success).toBe(true)
      expect(exportedAfter.data?.checkins).toHaveLength(2)

      const coachCopy = await copyForCoach({ includeNotes: false })
      expect(coachCopy.success).toBe(true)
      expect(coachCopy.text).toContain('Tuyên ngôn mới từ bản sao lưu')
      expect(coachCopy.text).not.toContain('Lý do riêng được khôi phục')
      expect(coachCopy.text).not.toContain('Ngày 1 tốt')

      const csvAfter = await exportCsv()
      expect(csvAfter.success).toBe(true)
      expect(csvAfter.csv?.startsWith('\uFEFF')).toBe(true)
      expect(csvAfter.csv).toContain('1,26/10/2026,Bỏ phiếu,Tự tin,Ngày 1 tốt')
    })

    it('bắt đầu lại (restartJourney) giữ nguyên kế hoạch cũ và chọn kế hoạch mới làm kế hoạch hiện tại sau khi lưu', async () => {
      const customer = await createTestCustomer('restart')
      await grantTrialAccess(customer.id)

      const oldPlan = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customer.id,
            identityStatement: 'Kế hoạch số 1 (cũ)',
            startDate: '2026-10-01T00:00:00.000+07:00',
            journeyDays: 28,
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      const oldCheckin = await payload.create({
        collection: 'habitCheckins',
        data: {
          plan: oldPlan.id,
          day: 1,
          status: 'voted',
          done: true,
          emotion: 'peaceful',
        },
        overrideAccess: true,
      })
      track('habitCheckins', oldCheckin)

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      // 1. Gọi restartJourney()
      const restartRes = await restartJourney()
      expect(restartRes.success).toBe(true)
      expect(restartRes.redirectTo).toBe('/habit/5-phut')
      expect(restartRes.previousPlanId).toBe(oldPlan.id)

      // 2. Kế hoạch cũ và check-in cũ VẪN CÒN trong DB
      const verifyOldPlan = await payload.findByID({
        collection: 'habitPlans',
        id: oldPlan.id,
        overrideAccess: true,
      })
      expect(verifyOldPlan.id).toBe(oldPlan.id)
      expect(verifyOldPlan.identityStatement).toBe('Kế hoạch số 1 (cũ)')

      // 3. Khách tạo kế hoạch mới từ /habit/5-phut (lưu theo leadEmail, chưa gắn customer)
      const newWizardPlan = track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            leadEmail: customer.email,
            identityStatement: 'Kế hoạch số 2 (mới sau khi bắt đầu lại)',
            startDate: vietnamTodayIso(),
            journeyDays: 28,
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      // 4. Khi khách quay lại /habit/tracker, getOrCreateTrackerPlan tự gắn kế hoạch mới và chọn làm kế hoạch hiện tại
      const currentPlan = await getOrCreateTrackerPlan(customer.id, { payload })
      expect(currentPlan?.id).toBe(newWizardPlan.id)
      expect(currentPlan?.identityStatement).toBe('Kế hoạch số 2 (mới sau khi bắt đầu lại)')

      const ownPlanNow = await findOwnTrackerPlan(customer.id, payload)
      expect(ownPlanNow?.id).toBe(newWizardPlan.id)

      // 5. Và kế hoạch cũ vẫn còn nguyên trong DB (tổng cộng 2 kế hoạch của khách)
      const allCustomerPlans = await payload.find({
        collection: 'habitPlans',
        where: { customer: { equals: customer.id } },
        overrideAccess: true,
      })
      expect(allCustomerPlans.totalDocs).toBe(2)
    })

    it('khi hết hạn dùng thử: vẫn tải được JSON/CSV và sao chép Coach, nhưng chặn khôi phục và bắt đầu lại', async () => {
      const expiredCustomer = await createTestCustomer('expired')
      await grantTrialAccess(expiredCustomer.id, true)

      track(
        'habitPlans',
        (await payload.create({
          collection: 'habitPlans',
          data: {
            customer: expiredCustomer.id,
            identityStatement: 'Kế hoạch đã hết hạn dùng thử',
            startDate: '2026-10-01T00:00:00.000+07:00',
            journeyDays: 28,
          },
          overrideAccess: true,
        })) as HabitPlan,
      )

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(expiredCustomer)

      // Tải về và sao chép vẫn hoạt động
      expect((await exportBackup()).success).toBe(true)
      expect((await exportCsv()).success).toBe(true)
      expect((await copyForCoach()).success).toBe(true)

      // Khôi phục và bắt đầu lại bị chặn ACCESS_DENIED
      const validBackup = serializeHabitBackup(
        { identityStatement: 'Thử khôi phục khi hết hạn', journeyDays: 28 },
        [{ day: 1, status: 'voted', emotion: null, note: null }],
      )
      const restoreRes = await restoreBackup(validBackup)
      expect(restoreRes.success).toBe(false)
      expect(restoreRes.error).toBe('ACCESS_DENIED')

      const restartRes = await restartJourney()
      expect(restartRes.success).toBe(false)
      expect(restartRes.error).toBe('ACCESS_DENIED')
    })
  })
})
