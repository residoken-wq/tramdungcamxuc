// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '@/payload.config'
import type { CourseModule, Customer, Lesson, Product } from '@/payload-types'
import { getLessonPlayback } from '@/lib/courses/service.server'
import { HABIT_TRACKER_PRODUCT_SLUG } from '@/lib/habit/config'

describe('Lesson Access Control & Playback Authorization Matrix (T2-05a)', () => {
  let payload: Payload
  let customerWithTrial: Customer
  let customerWithExpiredTrial: Customer
  let customerWithPurchased: Customer
  let customerWithoutAccess: Customer

  let habitTrackerProduct: Product
  let moduleDoc: CourseModule
  let freePreviewLesson: Lesson
  let paidLesson: Lesson
  let draftLesson: Lesson
  let lessonInDraftModule: Lesson

  const created: { collection: CollectionSlug; id: number }[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    // 1. Tạo hoặc lấy sản phẩm Habit Tracker số
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
            name: 'Habit Tracker Số (Test T2-05a)',
            slug: HABIT_TRACKER_PRODUCT_SLUG,
            web: 'habit',
            type: 'digital_tool',
            saleStatus: 'on_sale',
            isSample: true,
            price: 250000,
            salePrice: 178000,
            trialDays: 21,
            _status: 'published',
          },
          overrideAccess: true,
        }),
      )
    }

    // 2. Tạo 4 khách hàng test
    customerWithTrial = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `trial-valid-${randomUUID()}@example.test`,
          name: 'Khách Trial Còn Hạn',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    customerWithExpiredTrial = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `trial-expired-${randomUUID()}@example.test`,
          name: 'Khách Trial Hết Hạn',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    customerWithPurchased = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `purchased-${randomUUID()}@example.test`,
          name: 'Khách Đã Mua Trọn Đời',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    customerWithoutAccess = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `no-access-${randomUUID()}@example.test`,
          name: 'Khách Không Có Quyền',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    // 3. Cấp quyền truy cập cho khách hàng
    const now = Date.now()

    // Khách có trial còn hạn (còn 15 ngày)
    track(
      'entitlements',
      await payload.create({
        collection: 'entitlements',
        data: {
          customer: customerWithTrial.id,
          product: habitTrackerProduct.id,
          source: 'trial',
          status: 'trial',
          grantedAt: new Date(now - 6 * 86400000).toISOString(),
          expiresAt: new Date(now + 15 * 86400000).toISOString(),
          trialKey: `${customerWithTrial.id}:${habitTrackerProduct.id}`,
        },
        overrideAccess: true,
      }),
    )

    // Khách có trial hết hạn (hết hạn từ 2 ngày trước)
    track(
      'entitlements',
      await payload.create({
        collection: 'entitlements',
        data: {
          customer: customerWithExpiredTrial.id,
          product: habitTrackerProduct.id,
          source: 'trial',
          status: 'trial',
          grantedAt: new Date(now - 23 * 86400000).toISOString(),
          expiresAt: new Date(now - 2 * 86400000).toISOString(),
          trialKey: `${customerWithExpiredTrial.id}:${habitTrackerProduct.id}`,
        },
        overrideAccess: true,
      }),
    )

    // Khách đã mua trọn gói (active vĩnh viễn)
    track(
      'entitlements',
      await payload.create({
        collection: 'entitlements',
        data: {
          customer: customerWithPurchased.id,
          product: habitTrackerProduct.id,
          source: 'order',
          status: 'active',
          grantedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    // 4. Tạo module khóa học
    moduleDoc = track(
      'courseModules',
      await payload.create({
        collection: 'courseModules',
        data: {
          title: 'Nhóm bài học Test T2-05a',
          group: 'insight',
          order: 1,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    // 5. Tạo bài học: xem thử, bài thường, bài nháp (đều có videoId bí mật)
    freePreviewLesson = track(
      'lessons',
      await payload.create({
        collection: 'lessons',
        data: {
          title: 'Bài học xem thử miễn phí',
          module: moduleDoc.id,
          videoId: 'secret_bunny_video_free_preview_999',
          isFreePreview: true,
          durationSec: 300,
          order: 1,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    paidLesson = track(
      'lessons',
      await payload.create({
        collection: 'lessons',
        data: {
          title: 'Bài học trả phí chính thức',
          module: moduleDoc.id,
          videoId: 'secret_bunny_video_paid_888',
          isFreePreview: false,
          durationSec: 600,
          order: 2,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    draftLesson = track(
      'lessons',
      await payload.create({
        collection: 'lessons',
        data: {
          title: 'Bài học nháp chưa công bố',
          module: moduleDoc.id,
          videoId: 'secret_bunny_video_draft_777',
          isFreePreview: true,
          durationSec: 400,
          order: 3,
          _status: 'draft',
        },
        overrideAccess: true,
      }),
    )

    const draftModuleDoc = track(
      'courseModules',
      await payload.create({
        collection: 'courseModules',
        data: {
          title: 'Module Nháp (Test T2-05a)',
          group: 'technique',
          order: 99,
          _status: 'draft',
        },
        overrideAccess: true,
      }),
    )

    lessonInDraftModule = track(
      'lessons',
      await payload.create({
        collection: 'lessons',
        data: {
          title: 'Bài học đã xuất bản nhưng nằm trong module nháp',
          module: draftModuleDoc.id,
          videoId: 'secret_bunny_video_in_draft_mod',
          isFreePreview: true,
          durationSec: 300,
          order: 1,
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )
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
      } catch {}
    }
  })

  it('1. Khách chưa đăng nhập + bài xem thử -> xem được (allowed = true, có playback sandbox)', async () => {
    const result = await getLessonPlayback(freePreviewLesson.id, null, new Date(), payload)

    expect(result.allowed).toBe(true)
    expect(result.reason).toBeNull()
    expect(result.lesson).not.toBeNull()
    expect(result.lesson?.id).toBe(freePreviewLesson.id)
    expect(result.lesson?.isFreePreview).toBe(true)
    expect(result.playback).not.toBeNull()
    expect(result.playback?.kind).toBe('sandbox')
  })

  it('2. Khách chưa đăng nhập + bài thường -> bị từ chối (allowed = false, reason = unauthenticated, playback = null)', async () => {
    const result = await getLessonPlayback(paidLesson.id, null, new Date(), payload)

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('unauthenticated')
    expect(result.playback).toBeNull()
    expect(result.lesson).not.toBeNull()
    expect(result.lesson?.id).toBe(paidLesson.id)
  })

  it('3. Khách có dùng thử còn hạn + bài thường -> xem được (allowed = true)', async () => {
    const result = await getLessonPlayback(paidLesson.id, customerWithTrial.id, new Date(), payload)

    expect(result.allowed).toBe(true)
    expect(result.reason).toBeNull()
    expect(result.playback).not.toBeNull()
    expect(result.playback?.kind).toBe('sandbox')
  })

  it('4. Khách có dùng thử hết hạn + bài thường -> bị từ chối (allowed = false, reason = entitlement_required)', async () => {
    const result = await getLessonPlayback(
      paidLesson.id,
      customerWithExpiredTrial.id,
      new Date(),
      payload,
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('entitlement_required')
    expect(result.playback).toBeNull()
  })

  it('5. Khách chưa từng có quyền + bài thường -> bị từ chối (allowed = false, reason = entitlement_required)', async () => {
    const result = await getLessonPlayback(
      paidLesson.id,
      customerWithoutAccess.id,
      new Date(),
      payload,
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('entitlement_required')
    expect(result.playback).toBeNull()
  })

  it('6. Khách đã mua trọn đời + bài thường -> xem được (allowed = true)', async () => {
    const result = await getLessonPlayback(
      paidLesson.id,
      customerWithPurchased.id,
      new Date(),
      payload,
    )

    expect(result.allowed).toBe(true)
    expect(result.reason).toBeNull()
    expect(result.playback).not.toBeNull()
  })

  it('7. Bài nháp -> bị từ chối với mọi đối tượng (allowed = false, reason = not_published)', async () => {
    const resultUnauth = await getLessonPlayback(draftLesson.id, null, new Date(), payload)
    expect(resultUnauth.allowed).toBe(false)
    expect(resultUnauth.reason).toBe('not_published')
    expect(resultUnauth.lesson).toBeNull()
    expect(resultUnauth.playback).toBeNull()

    const resultPurchased = await getLessonPlayback(
      draftLesson.id,
      customerWithPurchased.id,
      new Date(),
      payload,
    )
    expect(resultPurchased.allowed).toBe(false)
    expect(resultPurchased.reason).toBe('not_published')
    expect(resultPurchased.lesson).toBeNull()
    expect(resultPurchased.playback).toBeNull()
  })

  it('8. Bài không tồn tại -> trả not_found an toàn', async () => {
    const result = await getLessonPlayback(99999999, customerWithPurchased.id, new Date(), payload)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('not_found')
    expect(result.lesson).toBeNull()
    expect(result.playback).toBeNull()
  })

  it('9. BẢO MẬT: Kết quả trả về TUYỆT ĐỐI KHÔNG CHỨA videoId dưới bất kỳ hình thức nào', async () => {
    const result = await getLessonPlayback(
      paidLesson.id,
      customerWithPurchased.id,
      new Date(),
      payload,
    )
    expect(result.allowed).toBe(true)

    // Kiểm tra trực tiếp trên root object
    expect('videoId' in result).toBe(false)

    // Kiểm tra trên lesson summary
    expect('videoId' in (result.lesson || {})).toBe(false)

    // Kiểm tra trên playback object
    expect('videoId' in (result.playback || {})).toBe(false)

    // Kiểm tra toàn bộ JSON stringify không xuất hiện mã video bí mật
    const serialized = JSON.stringify(result)
    expect(serialized).not.toContain('secret_bunny_video')
    expect(serialized).not.toContain('secret_bunny_video_paid_888')
    expect(serialized).not.toContain('secret_bunny_video_free_preview_999')
  })

  it('10. Bài đã xuất bản nhưng nằm trong nhóm bài học nháp (draft module) -> bị từ chối (allowed = false, reason = not_published)', async () => {
    const result = await getLessonPlayback(
      lessonInDraftModule.id,
      customerWithPurchased.id,
      new Date(),
      payload,
    )
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('not_published')
    expect(result.lesson).toBeNull()
    expect(result.playback).toBeNull()
  })
})
