// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '@/payload.config'
import type { Customer, Lesson, Product } from '@/payload-types'
import { recordLessonProgressInternal } from '@/lib/courses/service.server'
import { recordLessonProgress } from '@/lib/courses/actions'
import { HABIT_TRACKER_PRODUCT_SLUG } from '@/lib/habit/config'
import * as sessionServer from '@/lib/auth/session.server'

describe('Lesson Progress Recording & Validation Rules (T2-05a)', () => {
  let payload: Payload
  let customerA: Customer
  let customerB: Customer
  let authorizedLesson: Lesson
  let unauthorizedLesson: Lesson
  let habitTrackerProduct: Product

  const created: { collection: CollectionSlug; id: number }[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    // 1. Tạo sản phẩm Habit Tracker số
    const existingProduct = await payload.find({
      collection: 'products',
      where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingProduct.docs.length > 0) {
      habitTrackerProduct = existingProduct.docs[0] as Product
    } else {
      habitTrackerProduct = track(
        'products',
        await payload.create({
          collection: 'products',
          data: {
            name: 'Habit Tracker Số (Test Progress)',
            slug: HABIT_TRACKER_PRODUCT_SLUG,
            web: 'habit',
            type: 'digital_tool',
            saleStatus: 'on_sale',
            price: 250000,
            salePrice: 178000,
            trialDays: 21,
            _status: 'published',
          },
          overrideAccess: true,
        }),
      )
    }

    // 2. Tạo 2 khách hàng test
    customerA = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `progress-a-${randomUUID()}@example.test`,
          name: 'Khách Tiến Độ A',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    customerB = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `progress-b-${randomUUID()}@example.test`,
          name: 'Khách Tiến Độ B',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    // Cấp quyền cho customerA
    track(
      'entitlements',
      await payload.create({
        collection: 'entitlements',
        data: {
          customer: customerA.id,
          product: habitTrackerProduct.id,
          source: 'trial',
          status: 'trial',
          grantedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 21 * 86400000).toISOString(),
          trialKey: `${customerA.id}:${habitTrackerProduct.id}`,
        },
        overrideAccess: true,
      }),
    )

    // 3. Tạo module và bài học
    const moduleDoc = track(
      'courseModules',
      await payload.create({
        collection: 'courseModules',
        data: {
          title: 'Module Tiến Độ',
          group: 'principle',
          order: 1,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    authorizedLesson = track(
      'lessons',
      await payload.create({
        collection: 'lessons',
        data: {
          title: 'Bài học có quyền xem',
          module: moduleDoc.id,
          videoId: 'vid_auth_123',
          isFreePreview: false,
          durationSec: 600,
          order: 1,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    unauthorizedLesson = track(
      'lessons',
      await payload.create({
        collection: 'lessons',
        data: {
          title: 'Bài học chưa xuất bản',
          module: moduleDoc.id,
          videoId: 'vid_draft_456',
          isFreePreview: false,
          durationSec: 600,
          order: 2,
          _status: 'draft',
        },
        overrideAccess: true,
      }),
    )
  })

  afterAll(async () => {
    // Xóa tiến độ bài học đã tạo
    const progresses = await payload.find({
      collection: 'lessonProgress',
      where: {
        or: [{ customer: { equals: customerA.id } }, { customer: { equals: customerB.id } }],
      },
      limit: 100,
      overrideAccess: true,
    })
    for (const p of progresses.docs) {
      try {
        await payload.delete({
          collection: 'lessonProgress',
          id: p.id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      } catch {}
    }

    for (const item of created.reverse()) {
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      } catch {}
    }
  })

  it('1. Kẹp giá trị: <0 thành 0, >100 thành 100', async () => {
    const resUnder = await recordLessonProgressInternal(
      customerA.id,
      authorizedLesson.id,
      -35,
      new Date(),
      payload,
    )
    expect(resUnder.watchedPercent).toBe(0)

    const resOver = await recordLessonProgressInternal(
      customerA.id,
      authorizedLesson.id,
      142,
      new Date(),
      payload,
    )
    expect(resOver.watchedPercent).toBe(100)
    expect(resOver.completedAt).not.toBeNull()
  })

  it('2. Tiến độ CHỈ TĂNG, không giảm', async () => {
    // Tạo tiến độ khởi đầu 60%
    const testLesson = track(
      'lessons',
      await payload.create({
        collection: 'lessons',
        data: {
          title: 'Bài học kiểm tra tiến độ chỉ tăng',
          videoId: 'vid_test_inc',
          isFreePreview: false,
          durationSec: 300,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    const first = await recordLessonProgressInternal(
      customerA.id,
      testLesson.id,
      60,
      new Date(),
      payload,
    )
    expect(first.watchedPercent).toBe(60)
    expect(first.completedAt).toBeNull()

    // Gửi giá trị nhỏ hơn (25%) -> vẫn giữ 60%
    const lower = await recordLessonProgressInternal(
      customerA.id,
      testLesson.id,
      25,
      new Date(),
      payload,
    )
    expect(lower.watchedPercent).toBe(60)

    // Gửi giá trị lớn hơn (75%) -> tăng lên 75%
    const higher = await recordLessonProgressInternal(
      customerA.id,
      testLesson.id,
      75,
      new Date(),
      payload,
    )
    expect(higher.watchedPercent).toBe(75)
    expect(higher.completedAt).toBeNull()
  })

  it('3. Đạt >= 80% thì completedAt được ghi nhận đúng một lần', async () => {
    const testLesson = track(
      'lessons',
      await payload.create({
        collection: 'lessons',
        data: {
          title: 'Bài học kiểm tra 80% hoàn thành',
          videoId: 'vid_test_80',
          isFreePreview: false,
          durationSec: 400,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    const recordTime = new Date('2026-10-12T10:00:00.000Z')
    const res80 = await recordLessonProgressInternal(
      customerA.id,
      testLesson.id,
      82,
      recordTime,
      payload,
    )

    expect(res80.newlyCompleted).toBe(true)
    expect(res80.completedAt).not.toBeNull()
    expect(res80.completedAt?.toISOString()).toBe(recordTime.toISOString())

    // Ghi nhận tiếp ở 95% vào thời điểm muộn hơn
    const laterTime = new Date('2026-10-12T10:30:00.000Z')
    const res95 = await recordLessonProgressInternal(
      customerA.id,
      testLesson.id,
      95,
      laterTime,
      payload,
    )

    expect(res95.newlyCompleted).toBe(false)
    expect(res95.watchedPercent).toBe(95)
    // completedAt giữ nguyên thời điểm ban đầu lúc đạt 80%
    expect(res95.completedAt?.toISOString()).toBe(recordTime.toISOString())
  })

  it('4. Chạy song song nhiều request tạo đúng 1 dòng (khóa duy nhất customerLesson)', async () => {
    const testLesson = track(
      'lessons',
      await payload.create({
        collection: 'lessons',
        data: {
          title: 'Bài học chạy song song',
          videoId: 'vid_concurrent',
          isFreePreview: false,
          durationSec: 500,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    // Kích hoạt đồng thời 6 yêu cầu ghi nhận tiến độ với các giá trị khác nhau
    const testPercents = [15, 82, 35, 90, 85, 50]
    const promises = testPercents.map((val) =>
      recordLessonProgressInternal(customerA.id, testLesson.id, val, new Date(), payload),
    )

    const results = await Promise.all(promises)
    expect(results.every((r) => r.success)).toBe(true)

    // newlyCompleted phải xảy ra đúng 1 lần duy nhất trong toàn bộ các yêu cầu song song
    const newlyCompletedCount = results.filter((r) => r.newlyCompleted).length
    expect(newlyCompletedCount).toBe(1)

    // Kiểm tra DB có chính xác 1 bản ghi cho customerA và testLesson
    const dbDocs = await payload.find({
      collection: 'lessonProgress',
      where: {
        and: [{ customer: { equals: customerA.id } }, { lesson: { equals: testLesson.id } }],
      },
      overrideAccess: true,
    })

    expect(dbDocs.totalDocs).toBe(1)
    expect(dbDocs.docs[0].watchedPercent).toBe(90) // giá trị cao nhất là 90
    expect(dbDocs.docs[0].completedAt).not.toBeNull() // vì 90 >= 80
  })

  it('5. Server action: Từ chối khi khách không có quyền xem bài học (unauthorized hoặc draft)', async () => {
    // Giả lập customerB (không có entitlement)
    const spy = vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customerB)

    try {
      const res = await recordLessonProgress(authorizedLesson.id, 50)
      expect(res.success).toBe(false)
      expect(res.error).toBe('forbidden')

      // Bài học nháp (draft) cũng bị từ chối
      const resDraft = await recordLessonProgress(unauthorizedLesson.id, 50)
      expect(resDraft.success).toBe(false)
      expect(resDraft.error).toBe('forbidden')
    } finally {
      spy.mockRestore()
    }
  })

  it('6. Server action: Bảo vệ phiên - không thể ghi tiến độ khi chưa đăng nhập', async () => {
    const spy = vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(null)

    try {
      const res = await recordLessonProgress(authorizedLesson.id, 50)
      expect(res.success).toBe(false)
      expect(res.error).toBe('unauthenticated')
    } finally {
      spy.mockRestore()
    }
  })
})
