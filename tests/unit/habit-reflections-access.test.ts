// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitPlan, User } from '../../src/payload-types'
import { isHiddenFromEditor } from '../../src/lib/auth/access'
import { deleteCustomerData } from '../../src/lib/account/delete-customer.server'

describe('HB-12: HabitReflections – Collection Access Control & Privacy Protection', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []

  let customerA: Customer
  let customerB: Customer
  let asCustomerA: unknown
  let asCustomerB: unknown

  let ownerUser: User
  let editorUser: User
  let asOwner: unknown
  let asEditor: unknown

  let planA: HabitPlan
  let planB: HabitPlan

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const suffix = randomUUID().slice(0, 8)

    // 1. Tạo Customer A và Customer B
    customerA = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `hb12-cust-a-${suffix}@example.test`,
          name: 'Học viên Test HB12 A',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )
    asCustomerA = { ...customerA, collection: 'customers' }

    customerB = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `hb12-cust-b-${suffix}@example.test`,
          name: 'Học viên Test HB12 B',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )
    asCustomerB = { ...customerB, collection: 'customers' }

    // 2. Tạo Kế hoạch cho Customer A và Customer B
    planA = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customerA.id,
          journeyDays: 28,
          startDate: '2026-10-12T00:00:00.000Z',
          identityStatement: 'Kế hoạch học viên A',
        },
        overrideAccess: true,
      }),
    )

    planB = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customerB.id,
          journeyDays: 28,
          startDate: '2026-10-12T00:00:00.000Z',
          identityStatement: 'Kế hoạch học viên B',
        },
        overrideAccess: true,
      }),
    )

    // 3. Tạo Admin Owner và Editor
    ownerUser = track(
      'users',
      await payload.create({
        collection: 'users',
        data: {
          email: `hb12-owner-${suffix}@example.test`,
          password: 'Password123!',
          role: 'owner',
        },
        overrideAccess: true,
      }),
    )
    asOwner = { ...ownerUser, collection: 'users' }

    editorUser = track(
      'users',
      await payload.create({
        collection: 'users',
        data: {
          email: `hb12-editor-${suffix}@example.test`,
          password: 'Password123!',
          role: 'editor',
        },
        overrideAccess: true,
      }),
    )
    asEditor = { ...editorUser, collection: 'users' }
  })

  afterAll(async () => {
    // Dọn dẹp theo thứ tự ngược lại (con trước, cha sau)
    for (let i = created.length - 1; i >= 0; i--) {
      const item = created[i]
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
          context: item.collection === 'customers' ? { accountDeletion: true } : undefined,
        })
      } catch {
        // Bỏ qua lỗi dọn dẹp
      }
    }
  })

  it('1. Editor bị ẩn collection habitReflections trong menu admin', () => {
    expect(isHiddenFromEditor({ user: asEditor as never })).toBe(true)
    expect(isHiddenFromEditor({ user: asOwner as never })).toBe(false)
  })

  it('2. Khách A tạo bài suy ngẫm cho kế hoạch của mình -> đọc lại thấy đủ answers', async () => {
    const reflection = track(
      'habitReflections',
      await payload.create({
        collection: 'habitReflections',
        data: {
          customer: customerA.id,
          plan: planA.id,
          stationIndex: 0,
          answers: [
            {
              question: 'Điều gì đã giúp bạn duy trì thói quen trong 7 ngày qua?',
              answer: 'Tôi đặt chuông báo và nhờ bạn đồng hành nhắc nhở.',
            },
          ],
        },
        user: asCustomerA as never,
        overrideAccess: false,
      }),
    )

    expect(reflection.id).toBeDefined()
    expect(reflection.stationIndex).toBe(0)

    // Khách A đọc lại với overrideAccess: false
    const readDoc = await payload.findByID({
      collection: 'habitReflections',
      id: reflection.id,
      user: asCustomerA as never,
      overrideAccess: false,
    })

    expect(readDoc).toBeDefined()
    expect(readDoc.answers).toBeDefined()
    expect(readDoc.answers).toHaveLength(1)
    expect(readDoc.answers![0].answer).toBe('Tôi đặt chuông báo và nhờ bạn đồng hành nhắc nhở.')
  })

  it('3. Khách B tìm kiếm hoặc đọc bài suy ngẫm của Khách A -> bị từ chối / không thấy', async () => {
    // 3a. Tìm kiếm find: Khách B không thấy bài của A trong danh sách
    const searchRes = await payload.find({
      collection: 'habitReflections',
      where: { plan: { equals: planA.id } },
      user: asCustomerB as never,
      overrideAccess: false,
    })
    expect(searchRes.docs).toHaveLength(0)

    // 3b. Đọc trực tiếp findByID: Khách B bị ném lỗi không tìm thấy / không có quyền
    const reflectionA = (
      await payload.find({
        collection: 'habitReflections',
        where: { plan: { equals: planA.id } },
        overrideAccess: true,
      })
    ).docs[0]

    await expect(
      payload.findByID({
        collection: 'habitReflections',
        id: reflectionA.id,
        user: asCustomerB as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('4. Owner và Editor đọc bản ghi habitReflections -> answers bị ẩn hoàn toàn (selfCustomerOnlyField)', async () => {
    const reflectionA = (
      await payload.find({
        collection: 'habitReflections',
        where: { plan: { equals: planA.id } },
        overrideAccess: true,
      })
    ).docs[0]

    // 4a. Owner đọc với overrideAccess: false
    const ownerDoc = await payload.findByID({
      collection: 'habitReflections',
      id: reflectionA.id,
      user: asOwner as never,
      overrideAccess: false,
    })

    expect(ownerDoc).toBeDefined()
    expect(ownerDoc.id).toBe(reflectionA.id)
    // answers bị ẩn hoàn toàn đối với Owner (mảng rỗng hoặc undefined)
    expect(ownerDoc.answers?.length ?? 0).toBe(0)

    // 4b. Editor đọc với overrideAccess: false
    const editorDoc = await payload.findByID({
      collection: 'habitReflections',
      id: reflectionA.id,
      user: asEditor as never,
      overrideAccess: false,
    })

    expect(editorDoc).toBeDefined()
    expect(editorDoc.answers?.length ?? 0).toBe(0)
  })

  it('5. Trùng plan + stationIndex -> bị từ chối bởi uniqueKeyHook', async () => {
    try {
      await payload.create({
        collection: 'habitReflections',
        data: {
          customer: customerA.id,
          plan: planA.id,
          stationIndex: 0,
          answers: [
            {
              question: 'Câu hỏi trùng trạm',
              answer: 'Nội dung trùng',
            },
          ],
        },
        user: asCustomerA as never,
        overrideAccess: false,
      })
      expect.fail('Should have thrown ValidationError')
    } catch (err: unknown) {
      const valErr = err as { data?: { errors?: { message: string }[] }; message: string }
      const messages = valErr.data?.errors?.map((e) => e.message) || []
      expect(messages.some((m) => /Bạn đã lưu bài suy ngẫm cho trạm này/i.test(m))).toBe(true)
    }
  })

  it('6. Khách A cố gắng lưu bài suy ngẫm vào kế hoạch của Khách B -> bị chặn (403)', async () => {
    await expect(
      payload.create({
        collection: 'habitReflections',
        data: {
          customer: customerA.id,
          plan: planB.id,
          stationIndex: 1,
          answers: [
            {
              question: 'Câu hỏi gian lận',
              answer: 'Trả lời trộm vào kế hoạch B',
            },
          ],
        },
        user: asCustomerA as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/Bạn không có quyền thực hiện suy ngẫm cho kế hoạch này/i)
  })

  it('7. deleteCustomerData xóa vĩnh viễn cả bài suy ngẫm habitReflections của khách hàng', async () => {
    const suffix = randomUUID().slice(0, 8)
    const custToDelete = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `hb12-del-${suffix}@example.test`,
          name: 'Khách hàng Sắp Xóa HB12',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    const planToDelete = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: custToDelete.id,
          journeyDays: 28,
          startDate: '2026-10-12T00:00:00.000Z',
          identityStatement: 'Kế hoạch sẽ xóa',
        },
        overrideAccess: true,
      }),
    )

    track(
      'habitReflections',
      await payload.create({
        collection: 'habitReflections',
        data: {
          customer: custToDelete.id,
          plan: planToDelete.id,
          stationIndex: 0,
          answers: [{ question: 'Sắp xóa', answer: 'Sắp xóa' }],
        },
        overrideAccess: true,
      }),
    )

    // Thực hiện xóa qua deleteCustomerData
    const res = await deleteCustomerData(payload, {
      customerId: custToDelete.id,
      confirmationEmail: custToDelete.email,
    })

    expect(res.success).toBe(true)
    expect(res.tally?.habitReflections).toBe(1)

    // Khẳng định không còn bản ghi nào trong DB
    const remaining = await payload.find({
      collection: 'habitReflections',
      where: { customer: { equals: custToDelete.id } },
      overrideAccess: true,
    })
    expect(remaining.docs).toHaveLength(0)
  })
})
