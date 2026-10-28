// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import { saveStationReflection } from '../../src/lib/habit/reflection-actions'
import * as sessionServer from '../../src/lib/auth/session.server'
import * as journeyContentServer from '../../src/lib/habit/journey-content.server'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import type { Customer, HabitPlan, Product } from '../../src/payload-types'

describe('HB-12: saveStationReflection Server Action Guardrails', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []

  let customer: Customer
  let habitProduct: Product
  let plan: HabitPlan
  let entitlementId: number

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  const mockCmsContent = {
    stations: [
      {
        name: 'Trạm 1: Khởi động',
        reflectionQuestions: [
          { question: 'Bạn cảm thấy thế nào sau tuần đầu tiên?' },
          { question: 'Khó khăn lớn nhất bạn gặp phải là gì?' },
        ],
      },
      {
        name: 'Trạm 2: Vượt ỳ',
        reflectionQuestions: [{ question: 'Bạn đã áp dụng bản tối giản mấy lần?' }],
      },
      {
        name: 'Trạm 3: Tăng tốc',
        reflectionQuestions: [], // Không có câu hỏi
      },
      {
        name: 'Trạm 4: Về đích',
        reflectionQuestions: [{ question: 'Bạn đúc kết được gì sau 28 ngày?' }],
      },
    ],
    quotes: [],
    onePercent: { dailyPercent: 1, maxDays: 365, facts: [] },
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const suffix = randomUUID().slice(0, 8)

    // 1. Tạo customer
    customer = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `hb12-action-${suffix}@example.test`,
          name: 'Học viên Test Action HB12',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    // 2. Đảm bảo có sản phẩm habit tracker
    const prodRes = await payload.find({
      collection: 'products',
      where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      limit: 1,
      overrideAccess: true,
    })

    if (prodRes.docs[0]) {
      habitProduct = prodRes.docs[0]
    } else {
      habitProduct = track(
        'products',
        await payload.create({
          collection: 'products',
          data: {
            name: 'Habit Tracker Số',
            slug: HABIT_TRACKER_PRODUCT_SLUG,
            web: 'habit',
            type: 'digital_tool',
            saleStatus: 'on_sale',
            price: 250000,
          },
          overrideAccess: true,
        }),
      )
    }

    // 3. Cấp quyền truy cập active
    const ent = track(
      'entitlements',
      await payload.create({
        collection: 'entitlements',
        data: {
          customer: customer.id,
          product: habitProduct.id,
          source: 'manual',
          status: 'active',
        },
        overrideAccess: true,
      }),
    )
    entitlementId = ent.id

    // 4. Kế hoạch bắt đầu từ 14 ngày trước (trạm 1 & 2 đã mở; trạm 3 & 4 chưa mở)
    // 28 ngày chia 4 trạm = 7-7-7-7 ngày. Ngày 1–7 = trạm 0; ngày 8–14 = trạm 1; ngày 15–21 = trạm 2; ngày 22–28 = trạm 3.
    const twoWeeksAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
    plan = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          journeyDays: 28,
          startDate: twoWeeksAgo,
          identityStatement: 'Kế hoạch test action',
        },
        overrideAccess: true,
      }),
    )
  })

  afterAll(async () => {
    vi.restoreAllMocks()

    // Xóa reflections
    try {
      await payload.delete({
        collection: 'habitReflections',
        where: { customer: { equals: customer.id } },
        overrideAccess: true,
      })
    } catch {}

    for (let i = created.length - 1; i >= 0; i--) {
      const item = created[i]
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
          context: item.collection === 'customers' ? { accountDeletion: true } : undefined,
        })
      } catch {}
    }
  })

  it('1. Chưa đăng nhập -> trả lỗi UNAUTHORIZED', async () => {
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValueOnce(null)

    const result = await saveStationReflection(0, ['Trả lời câu 1'])
    expect(result.success).toBe(false)
    expect(result.error).toBe('UNAUTHORIZED')
  })

  it('2. Quyền truy cập hết hạn -> trả lỗi ACCESS_EXPIRED', async () => {
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer as never)
    // Tạm cập nhật entitlement sang expired
    await payload.update({
      collection: 'entitlements',
      id: entitlementId,
      data: { status: 'expired' },
      overrideAccess: true,
    })

    const result = await saveStationReflection(0, ['Trả lời'])
    expect(result.success).toBe(false)
    expect(result.error).toBe('ACCESS_EXPIRED')

    // Phục hồi entitlement
    await payload.update({
      collection: 'entitlements',
      id: entitlementId,
      data: { status: 'active' },
      overrideAccess: true,
    })
  })

  it('3. stationIndex ngoài phạm vi -> trả lỗi STATION_OUT_OF_RANGE', async () => {
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer as never)
    vi.spyOn(journeyContentServer, 'getHabitJourneyContent').mockResolvedValue(
      mockCmsContent as never,
    )

    const result = await saveStationReflection(10, ['Trả lời'])
    expect(result.success).toBe(false)
    expect(result.error).toBe('STATION_OUT_OF_RANGE')
  })

  it('4. Trạm chưa mở (hôm nay < toDay) -> trả lỗi STATION_NOT_OPEN', async () => {
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer as never)
    vi.spyOn(journeyContentServer, 'getHabitJourneyContent').mockResolvedValue(
      mockCmsContent as never,
    )

    // Trạm index 3 (Trạm 4: ngày 22-28) mở vào ngày 29, trong khi kế hoạch mới đến ngày ~14
    const result = await saveStationReflection(3, ['Trả lời'])
    expect(result.success).toBe(false)
    expect(result.error).toBe('STATION_NOT_OPEN')
    expect(result.message).toContain('29')
  })

  it('5. Trạm không có câu hỏi trong CMS -> trả lỗi NO_QUESTIONS', async () => {
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer as never)
    vi.spyOn(journeyContentServer, 'getHabitJourneyContent').mockResolvedValue(
      mockCmsContent as never,
    )

    // Tạo kế hoạch đã kết thúc để mọi trạm đều mở
    const oldStartDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
    await payload.update({
      collection: 'habitPlans',
      id: plan.id,
      data: { startDate: oldStartDate },
      overrideAccess: true,
    })

    // Trạm 2 (index 2) trong mockCmsContent có reflectionQuestions: []
    const result = await saveStationReflection(2, ['Trả lời'])
    expect(result.success).toBe(false)
    expect(result.error).toBe('NO_QUESTIONS')
  })

  it('6. Toàn bộ câu trả lời để trống -> trả lỗi ALL_EMPTY', async () => {
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer as never)
    vi.spyOn(journeyContentServer, 'getHabitJourneyContent').mockResolvedValue(
      mockCmsContent as never,
    )

    const result = await saveStationReflection(0, ['', '   '])
    expect(result.success).toBe(false)
    expect(result.error).toBe('ALL_EMPTY')
  })

  it('7. Câu trả lời vượt quá 1000 ký tự -> trả lỗi INVALID_INPUT', async () => {
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer as never)
    vi.spyOn(journeyContentServer, 'getHabitJourneyContent').mockResolvedValue(
      mockCmsContent as never,
    )

    const tooLong = 'A'.repeat(1001)
    const result = await saveStationReflection(0, [tooLong])
    expect(result.success).toBe(false)
    expect(result.error).toBe('INVALID_INPUT')
  })

  it('8. Lưu bài suy ngẫm thành công: câu hỏi lấy từ CMS chứ không phụ thuộc client', async () => {
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer as never)
    vi.spyOn(journeyContentServer, 'getHabitJourneyContent').mockResolvedValue(
      mockCmsContent as never,
    )

    const result = await saveStationReflection(0, [
      'Tuần đầu tiên cảm thấy rất hứng khởi',
      'Khó khăn là thức dậy sớm',
    ])

    expect(result.success).toBe(true)
    expect(result.reflectionId).toBeDefined()

    // Khẳng định bản ghi trong DB có câu hỏi từ CMS
    const saved = await payload.findByID({
      collection: 'habitReflections',
      id: result.reflectionId!,
      overrideAccess: true,
    })

    expect(saved.answers).toHaveLength(2)
    expect(saved.answers![0].question).toBe('Bạn cảm thấy thế nào sau tuần đầu tiên?')
    expect(saved.answers![0].answer).toBe('Tuần đầu tiên cảm thấy rất hứng khởi')
    expect(saved.answers![1].question).toBe('Khó khăn lớn nhất bạn gặp phải là gì?')
    expect(saved.answers![1].answer).toBe('Khó khăn là thức dậy sớm')
  })

  it('9. Lưu lần 2 cập nhật bản ghi cũ, không tạo bản ghi mới', async () => {
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer as never)
    vi.spyOn(journeyContentServer, 'getHabitJourneyContent').mockResolvedValue(
      mockCmsContent as never,
    )

    const initialRes = await saveStationReflection(0, ['Cập nhật câu 1', 'Cập nhật câu 2'])
    expect(initialRes.success).toBe(true)

    // Đếm tổng số bản ghi reflection của plan này
    const allReflections = await payload.find({
      collection: 'habitReflections',
      where: { plan: { equals: plan.id } },
      overrideAccess: true,
    })

    // Chỉ có đúng 1 bản ghi cho trạm 0
    const station0Reflections = allReflections.docs.filter((r) => r.stationIndex === 0)
    expect(station0Reflections).toHaveLength(1)
    expect(station0Reflections[0].answers![0].answer).toBe('Cập nhật câu 1')
  })
})
