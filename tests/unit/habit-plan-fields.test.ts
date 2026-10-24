// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitPlan, User } from '../../src/payload-types'
import { vi as viStrings } from '../../src/lib/i18n/vi'

describe('HB-03: Kế hoạch thói quen – field bước Mentor, Gọi tên & Quyền đọc riêng tư', () => {
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
          email: `cust-a-${suffix}@example.test`,
          name: 'Học viên Test HB03 A',
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
          email: `cust-b-${suffix}@example.test`,
          name: 'Học viên Test HB03 B',
        },
        overrideAccess: true,
      }),
    )
    asCustomerB = { ...customerB, collection: 'customers' }

    // 2. Tạo User Owner và Editor
    ownerUser = track(
      'users',
      await payload.create({
        collection: 'users',
        data: {
          email: `owner-${suffix}@example.test`,
          password: `OwnerPass-${suffix}-123`,
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
          email: `editor-${suffix}@example.test`,
          password: `EditorPass-${suffix}-123`,
          role: 'editor',
        },
        overrideAccess: true,
      }),
    )
    asEditor = { ...editorUser, collection: 'users' }
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

  it('1. Khách A tạo kế hoạch có đủ field mới -> đọc lại thấy đủ', async () => {
    const plan = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customerA.id,
          identityStatement: 'Tôi sẽ uống nước mỗi sáng để trở thành người khỏe mạnh',
          startDate: new Date().toISOString().split('T')[0],
          scorecard: [
            {
              habit: 'Uống nước ấm',
              rating: 'good',
              time: '07:30',
            },
          ],
          anchorHabit: 'Sau khi thức dậy, tôi sẽ uống 1 cốc nước ấm',
          rhythmDays: ['mon', 'wed', 'fri'],
          twoMinuteAction: 'Rót một cốc nước sẵn trên bàn',
          privateReason: 'Bảo vệ sức khỏe cho bản thân và gia đình',
          companionName: '[MẪU] Bạn đồng hành Test 01',
        },
        user: asCustomerA as never,
        overrideAccess: false,
      }),
    )

    expect(plan.id).toBeDefined()

    // Khách A đọc lại kế hoạch với overrideAccess: false
    const readPlan = (await payload.findByID({
      collection: 'habitPlans',
      id: plan.id,
      user: asCustomerA as never,
      overrideAccess: false,
    })) as unknown as HabitPlan

    expect(readPlan).toBeDefined()
    expect(readPlan.scorecard?.[0]?.time).toBe('07:30')
    expect(readPlan.anchorHabit).toBe('Sau khi thức dậy, tôi sẽ uống 1 cốc nước ấm')
    expect(readPlan.rhythmDays).toEqual(['mon', 'wed', 'fri'])
    expect(readPlan.twoMinuteAction).toBe('Rót một cốc nước sẵn trên bàn')
    expect(readPlan.privateReason).toBe('Bảo vệ sức khỏe cho bản thân và gia đình')
    expect(readPlan.companionName).toBe('[MẪU] Bạn đồng hành Test 01')
  })

  it('2. Khách B đọc kế hoạch của A -> không thấy kế hoạch (bị từ chối bởi quyền collection)', async () => {
    const planA = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customerA.id,
          identityStatement: 'Kế hoạch riêng của A',
          startDate: new Date().toISOString().split('T')[0],
        },
        user: asCustomerA as never,
        overrideAccess: false,
      }),
    )

    // Khách B tìm theo ID hoặc query -> không thấy kế hoạch của A
    await expect(
      payload.findByID({
        collection: 'habitPlans',
        id: planA.id,
        user: asCustomerB as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const searchResult = await payload.find({
      collection: 'habitPlans',
      where: { id: { equals: planA.id } },
      user: asCustomerB as never,
      overrideAccess: false,
    })
    expect(searchResult.docs).toHaveLength(0)
  })

  it('3. Owner và Editor đọc kế hoạch của A -> thấy kế hoạch nhưng KHÔNG có privateReason, companionName', async () => {
    const planA = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customerA.id,
          identityStatement: 'Kế hoạch A có dữ liệu riêng tư',
          startDate: new Date().toISOString().split('T')[0],
          anchorHabit: 'Neo thói quen của A',
          rhythmDays: ['mon', 'tue', 'wed'],
          twoMinuteAction: 'Hành động 2 phút của A',
          privateReason: 'Lý do thầm kín của học viên A',
          companionName: '[MẪU] Người đồng hành A',
        },
        user: asCustomerA as never,
        overrideAccess: false,
      }),
    )

    // 3a. Owner đọc kế hoạch với overrideAccess: false
    const ownerView = (await payload.findByID({
      collection: 'habitPlans',
      id: planA.id,
      user: asOwner as never,
      overrideAccess: false,
    })) as unknown as HabitPlan

    expect(ownerView).toBeDefined()
    expect(ownerView.identityStatement).toBe('Kế hoạch A có dữ liệu riêng tư')
    expect(ownerView.anchorHabit).toBe('Neo thói quen của A')
    expect(ownerView.rhythmDays).toEqual(['mon', 'tue', 'wed'])
    expect(ownerView.twoMinuteAction).toBe('Hành động 2 phút của A')
    // Hai trường riêng tư bị ẩn đối với Owner
    expect(ownerView.privateReason).toBeUndefined()
    expect(ownerView.companionName).toBeUndefined()

    // 3b. Editor đọc kế hoạch với overrideAccess: false
    const editorView = (await payload.findByID({
      collection: 'habitPlans',
      id: planA.id,
      user: asEditor as never,
      overrideAccess: false,
    })) as unknown as HabitPlan

    expect(editorView).toBeDefined()
    expect(editorView.identityStatement).toBe('Kế hoạch A có dữ liệu riêng tư')
    // Hai trường riêng tư bị ẩn đối với Editor
    expect(editorView.privateReason).toBeUndefined()
    expect(editorView.companionName).toBeUndefined()
  })

  it('4. Owner sửa anchorHabit của kế hoạch A -> privateReason và companionName của A vẫn còn nguyên', async () => {
    const planA = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customerA.id,
          identityStatement: 'Kế hoạch kiểm tra sửa bởi admin',
          startDate: new Date().toISOString().split('T')[0],
          anchorHabit: 'Thói quen neo ban đầu',
          privateReason: 'Lý do riêng cần bảo tồn',
          companionName: '[MẪU] Bạn đồng hành cần bảo tồn',
        },
        user: asCustomerA as never,
        overrideAccess: false,
      }),
    )

    // Owner sửa anchorHabit
    await payload.update({
      collection: 'habitPlans',
      id: planA.id,
      data: {
        anchorHabit: 'Thói quen neo đã được admin hỗ trợ sửa',
      },
      user: asOwner as never,
      overrideAccess: false,
    })

    // Đọc lại bằng overrideAccess: true trong DB
    const stored = (await payload.findByID({
      collection: 'habitPlans',
      id: planA.id,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(stored.anchorHabit).toBe('Thói quen neo đã được admin hỗ trợ sửa')
    expect(stored.privateReason).toBe('Lý do riêng cần bảo tồn')
    expect(stored.companionName).toBe('[MẪU] Bạn đồng hành cần bảo tồn')
  })

  it('5. Owner cố ghi privateReason -> bị bỏ qua quyền cập nhật, giá trị cũ giữ nguyên', async () => {
    const planA = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customerA.id,
          identityStatement: 'Kế hoạch chống ghi đè bởi admin',
          startDate: new Date().toISOString().split('T')[0],
          privateReason: 'Giá trị gốc của học viên',
          companionName: '[MẪU] Bạn gốc',
        },
        user: asCustomerA as never,
        overrideAccess: false,
      }),
    )

    // Owner cố ghi đè privateReason và companionName
    await payload.update({
      collection: 'habitPlans',
      id: planA.id,
      data: {
        privateReason: 'Admin cố tình ghi đè lý do riêng',
        companionName: 'Admin cố tình ghi đè bạn đồng hành',
      },
      user: asOwner as never,
      overrideAccess: false,
    })

    // Kiểm tra trong DB: giá trị cũ của học viên vẫn còn nguyên
    const stored = (await payload.findByID({
      collection: 'habitPlans',
      id: planA.id,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(stored.privateReason).toBe('Giá trị gốc của học viên')
    expect(stored.companionName).toBe('[MẪU] Bạn gốc')
  })

  it('6. Khách A sửa rhythmDays khi chưa check-in -> đổi được; có check-in -> giữ giá trị cũ; Owner sửa -> đổi được', async () => {
    const planA = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customerA.id,
          identityStatement: 'Kế hoạch kiểm tra khóa nhịp tuần',
          startDate: new Date().toISOString().split('T')[0],
          rhythmDays: ['mon', 'wed', 'fri'],
        },
        user: asCustomerA as never,
        overrideAccess: false,
      }),
    )

    expect(planA.rhythmDays).toEqual(['mon', 'wed', 'fri'])

    // 6a. Khách A sửa khi chưa có check-in -> đổi thành công
    await payload.update({
      collection: 'habitPlans',
      id: planA.id,
      data: {
        rhythmDays: ['tue', 'thu', 'sat'],
      },
      user: asCustomerA as never,
      overrideAccess: false,
    })

    const afterFirstChange = (await payload.findByID({
      collection: 'habitPlans',
      id: planA.id,
      overrideAccess: true,
    })) as unknown as HabitPlan
    expect(afterFirstChange.rhythmDays).toEqual(['tue', 'thu', 'sat'])

    // 6b. Tạo 1 check-in
    track(
      'habitCheckins',
      await payload.create({
        collection: 'habitCheckins',
        data: {
          plan: planA.id,
          day: 1,
          done: true,
        },
        overrideAccess: true,
      }),
    )

    // Khách A cố sửa lại rhythmDays sau khi đã có check-in -> giữ giá trị cũ
    await payload.update({
      collection: 'habitPlans',
      id: planA.id,
      data: {
        rhythmDays: ['sun'],
      },
      user: asCustomerA as never,
      overrideAccess: false,
    })

    const afterCheckinAttempt = (await payload.findByID({
      collection: 'habitPlans',
      id: planA.id,
      overrideAccess: true,
    })) as unknown as HabitPlan
    expect(afterCheckinAttempt.rhythmDays).toEqual(['tue', 'thu', 'sat'])

    // 6c. Owner sửa -> đổi được thành công
    await payload.update({
      collection: 'habitPlans',
      id: planA.id,
      data: {
        rhythmDays: ['sat', 'sun'],
      },
      user: asOwner as never,
      overrideAccess: false,
    })

    const afterOwnerUpdate = (await payload.findByID({
      collection: 'habitPlans',
      id: planA.id,
      overrideAccess: true,
    })) as unknown as HabitPlan
    expect(afterOwnerUpdate.rhythmDays).toEqual(['sat', 'sun'])
  })

  describe('7. Validation rules', () => {
    it('time sai dạng (25:00, 9h) -> báo lỗi validate tiếng Việt', async () => {
      try {
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Test time 25:00',
            startDate: new Date().toISOString().split('T')[0],
            scorecard: [{ habit: 'Tập thể dục', rating: 'good', time: '25:00' }],
          },
          overrideAccess: true,
        })
        expect.unreachable('Should have thrown')
      } catch (err: unknown) {
        const error = err as { data?: { errors?: Array<{ message?: string }> }; message?: string }
        const msg = error.data?.errors?.[0]?.message || error.message || ''
        expect(msg).toContain(viStrings.hb03.errors.timeInvalidFormat)
      }

      try {
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Test time 9h',
            startDate: new Date().toISOString().split('T')[0],
            scorecard: [{ habit: 'Tập thể dục', rating: 'good', time: '9h' }],
          },
          overrideAccess: true,
        })
        expect.unreachable('Should have thrown')
      } catch (err: unknown) {
        const error = err as { data?: { errors?: Array<{ message?: string }> }; message?: string }
        const msg = error.data?.errors?.[0]?.message || error.message || ''
        expect(msg).toContain(viStrings.hb03.errors.timeInvalidFormat)
      }
    })

    it('vượt quá độ dài tối đa -> báo lỗi validate', async () => {
      // anchorHabit > 120 ký tự
      try {
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Test anchorHabit dài',
            startDate: new Date().toISOString().split('T')[0],
            anchorHabit: 'a'.repeat(121),
          },
          overrideAccess: true,
        })
        expect.unreachable('Should have thrown')
      } catch (err: unknown) {
        const error = err as { data?: { errors?: Array<{ message?: string }> }; message?: string }
        const msg = error.data?.errors?.[0]?.message || error.message || ''
        expect(msg).toContain(viStrings.hb03.errors.anchorHabitTooLong)
      }

      // twoMinuteAction > 200 ký tự
      try {
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Test twoMinuteAction dài',
            startDate: new Date().toISOString().split('T')[0],
            twoMinuteAction: 'b'.repeat(201),
          },
          overrideAccess: true,
        })
        expect.unreachable('Should have thrown')
      } catch (err: unknown) {
        const error = err as { data?: { errors?: Array<{ message?: string }> }; message?: string }
        const msg = error.data?.errors?.[0]?.message || error.message || ''
        expect(msg).toContain(viStrings.hb03.errors.twoMinuteActionTooLong)
      }

      // privateReason > 1000 ký tự
      try {
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Test privateReason dài',
            startDate: new Date().toISOString().split('T')[0],
            privateReason: 'c'.repeat(1001),
          },
          overrideAccess: true,
        })
        expect.unreachable('Should have thrown')
      } catch (err: unknown) {
        const error = err as { data?: { errors?: Array<{ message?: string }> }; message?: string }
        const msg = error.data?.errors?.[0]?.message || error.message || ''
        expect(msg).toContain(viStrings.hb03.errors.privateReasonTooLong)
      }

      // companionName > 100 ký tự
      try {
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Test companionName dài',
            startDate: new Date().toISOString().split('T')[0],
            companionName: 'd'.repeat(101),
          },
          overrideAccess: true,
        })
        expect.unreachable('Should have thrown')
      } catch (err: unknown) {
        const error = err as { data?: { errors?: Array<{ message?: string }> }; message?: string }
        const msg = error.data?.errors?.[0]?.message || error.message || ''
        expect(msg).toContain(viStrings.hb03.errors.companionNameTooLong)
      }
    })

    it('rhythmDays trùng lặp -> báo lỗi rhythmDaysDuplicate', async () => {
      try {
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Test rhythmDays trùng',
            startDate: new Date().toISOString().split('T')[0],
            rhythmDays: ['mon', 'mon'] as never,
          },
          overrideAccess: true,
        })
        expect.unreachable('Should have thrown')
      } catch (err: unknown) {
        const error = err as { data?: { errors?: Array<{ message?: string }> }; message?: string }
        const msg = error.data?.errors?.[0]?.message || error.message || ''
        expect(msg).toContain(viStrings.hb03.errors.rhythmDaysDuplicate)
      }
    })

    it('rhythmDays rỗng hoặc null -> hợp lệ (mọi ngày là ngày bỏ phiếu)', async () => {
      const planEmpty = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Test rhythmDays rỗng',
            startDate: new Date().toISOString().split('T')[0],
            rhythmDays: [],
          },
          overrideAccess: true,
        }),
      )
      expect(planEmpty.id).toBeDefined()

      const planNull = track(
        'habitPlans',
        await payload.create({
          collection: 'habitPlans',
          data: {
            customer: customerA.id,
            identityStatement: 'Test rhythmDays null',
            startDate: new Date().toISOString().split('T')[0],
            rhythmDays: null,
          },
          overrideAccess: true,
        }),
      )
      expect(planNull.id).toBeDefined()
    })
  })
})
