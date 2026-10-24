// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type DateField, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitPlan, User } from '../../src/payload-types'
import { getVietnamYmd } from '../../src/lib/habit/tracker-stats'
import { getOrCreateTrackerPlan } from '../../src/lib/habit/tracker.server'
import { submitHabitPlan } from '../../src/lib/habit.server'
import { HabitPlans } from '../../src/collections/HabitPlans'

describe('HB-05: Khóa startDate của HabitPlans và kiểm soát quyền', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []

  let customer: Customer
  let asCustomer: unknown

  let ownerUser: User
  let asOwner: unknown

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const suffix = randomUUID().slice(0, 8)

    // Tạo Customer
    customer = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `hb05-cust-${suffix}@example.test`,
          name: 'Học viên Test HB05',
        },
        overrideAccess: true,
      }),
    )
    asCustomer = { ...customer, collection: 'customers' }

    // Tạo Owner
    ownerUser = track(
      'users',
      await payload.create({
        collection: 'users',
        data: {
          email: `hb05-owner-${suffix}@example.test`,
          password: `OwnerPass-${suffix}-123`,
          role: 'owner',
        },
        overrideAccess: true,
      }),
    )
    asOwner = { ...ownerUser, collection: 'users' }
  })

  afterAll(async () => {
    // Dọn dẹp bản ghi theo thứ tự ngược lại
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

  it('1. Khách tạo kế hoạch gửi startDate quá khứ -> bị bỏ qua, startDate = hôm nay VN', async () => {
    const forgedPastDate = '2020-01-01T00:00:00+07:00'
    const todayYmd = getVietnamYmd(new Date())

    const plan = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          identityStatement: 'Học viên cố tình lùi ngày bắt đầu về 2020',
          startDate: forgedPastDate,
        },
        user: asCustomer as never,
        overrideAccess: false,
      }),
    )

    const stored = (await payload.findByID({
      collection: 'habitPlans',
      id: plan.id,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(stored.startDate).toBeDefined()
    // Ngày bắt đầu phải là hôm nay theo giờ VN, không phải ngày 2020 do khách gửi
    const storedYmd = getVietnamYmd(new Date(stored.startDate!))
    expect(storedYmd).toBe(todayYmd)
  })

  it('2. Khách sửa startDate qua API -> giữ nguyên giá trị cũ (không đổi được)', async () => {
    const todayYmd = getVietnamYmd(new Date())

    const plan = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          identityStatement: 'Kế hoạch kiểm tra khách không sửa được startDate',
        },
        user: asCustomer as never,
        overrideAccess: false,
      }),
    )

    const initialPlan = (await payload.findByID({
      collection: 'habitPlans',
      id: plan.id,
      overrideAccess: true,
    })) as unknown as HabitPlan
    const initialYmd = getVietnamYmd(new Date(initialPlan.startDate!))
    expect(initialYmd).toBe(todayYmd)

    // Khách cố cập nhật startDate lùi về 1 tháng trước
    await payload.update({
      collection: 'habitPlans',
      id: plan.id,
      data: {
        startDate: '2026-09-01T00:00:00+07:00',
        identityStatement: 'Cập nhật định danh',
      },
      user: asCustomer as never,
      overrideAccess: false,
    })

    const afterUpdate = (await payload.findByID({
      collection: 'habitPlans',
      id: plan.id,
      overrideAccess: true,
    })) as unknown as HabitPlan

    // identityStatement được cập nhật
    expect(afterUpdate.identityStatement).toBe('Cập nhật định danh')
    // startDate vẫn giữ nguyên giá trị ban đầu, không bị đổi thành 2026-09-01
    const afterYmd = getVietnamYmd(new Date(afterUpdate.startDate!))
    expect(afterYmd).toBe(initialYmd)
  })

  it('3. Owner sửa startDate -> đổi được thành công', async () => {
    const plan = track(
      'habitPlans',
      await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          identityStatement: 'Kế hoạch kiểm tra owner sửa startDate',
        },
        user: asCustomer as never,
        overrideAccess: false,
      }),
    )

    const newDateIso = '2026-10-01T00:00:00.000Z'
    await payload.update({
      collection: 'habitPlans',
      id: plan.id,
      data: {
        startDate: newDateIso,
      },
      user: asOwner as never,
      overrideAccess: false,
    })

    const stored = (await payload.findByID({
      collection: 'habitPlans',
      id: plan.id,
      overrideAccess: true,
    })) as unknown as HabitPlan

    const storedYmd = getVietnamYmd(new Date(stored.startDate!))
    const expectedYmd = getVietnamYmd(new Date(newDateIso))
    expect(storedYmd).toBe(expectedYmd)
  })

  it('4. getOrCreateTrackerPlan vẫn tạo và cập nhật được kế hoạch có startDate', async () => {
    const suffix = randomUUID().slice(0, 8)
    const newCustomer = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `hb05-tracker-plan-${suffix}@example.test`,
          name: 'Khách hàng Tracker Plan',
        },
        overrideAccess: true,
      }),
    )

    const plan = await getOrCreateTrackerPlan(newCustomer.id, {
      identityStatement: 'Tôi sẽ luyện tập thể thao mỗi ngày',
      payload,
    })

    expect(plan).toBeDefined()
    expect(plan?.id).toBeDefined()
    track('habitPlans', plan!)

    const stored = (await payload.findByID({
      collection: 'habitPlans',
      id: plan!.id,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(stored.startDate).toBeDefined()
    const storedYmd = getVietnamYmd(new Date(stored.startDate!))
    expect(storedYmd).toBe(getVietnamYmd(new Date()))
  })

  it('5. submitHabitPlan vẫn tạo được kế hoạch có startDate', async () => {
    const suffix = randomUUID().slice(0, 8)
    const email = `hb05-submit-${suffix}@example.test`

    const res = await submitHabitPlan(
      {
        email,
        name: 'Người nộp kế hoạch',
        scorecard: [{ habit: 'Uống nước', rating: 'good' }],
        identityStatement: 'Tôi sẽ sống tích cực hơn',
        chosenTechniques: [],
        consent: true,
        turnstileToken: 'TEST_BYPASS_TOKEN',
      },
      { ip: '127.0.0.1' },
      { payload },
    )

    expect(res.success).toBe(true)
    expect(res.planId).toBeDefined()
    track('habitPlans', { id: res.planId! })

    // Dọn dẹp lead được tạo
    const leads = await payload.find({
      collection: 'leads',
      where: { email: { equals: email } },
      overrideAccess: true,
      limit: 1,
    })
    if (leads.docs.length > 0) {
      track('leads', leads.docs[0])
    }

    const stored = (await payload.findByID({
      collection: 'habitPlans',
      id: res.planId!,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(stored.startDate).toBeDefined()
    const storedYmd = getVietnamYmd(new Date(stored.startDate!))
    expect(storedYmd).toBe(getVietnamYmd(new Date()))
  })
  it('6. Admin CMS không khóa readOnly để owner/editor chỉnh được ngày bắt đầu', () => {
    const field = HabitPlans.fields.find(
      (f): f is DateField => f.type === 'date' && f.name === 'startDate',
    )
    expect(field).toBeDefined()
    expect(field?.admin?.readOnly).toBeFalsy()
    expect(field?.access?.update).toBeDefined()
  })
})
