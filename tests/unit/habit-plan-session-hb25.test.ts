// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitPlan } from '../../src/payload-types'
import { submitHabitPlan } from '../../src/lib/habit.server'
import { submitHabitPlanAction } from '../../src/lib/habit/actions'
import { getOrCreateTrackerPlan } from '../../src/lib/habit/tracker.server'
import * as sessionServer from '../../src/lib/auth/session.server'
import { vietnamTodayIso } from '../../src/lib/habit/tracker-stats'

describe('HB-25: Lưu kế hoạch theo tài khoản khi khách đã đăng nhập', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []
  const trackedEmails: string[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  const createCustomer = async (emailPrefix: string): Promise<Customer> => {
    const email = `hb25-${emailPrefix}-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(email)
    const doc = await payload.create({
      collection: 'customers',
      data: {
        email,
        name: `Test ${emailPrefix}`,
      },
      overrideAccess: true,
    })
    return track('customers', doc as Customer)
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    for (const item of created.reverse()) {
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
        })
      } catch {
        // noop
      }
    }
    for (const email of trackedEmails) {
      try {
        await payload.delete({
          collection: 'leads',
          where: { email: { equals: email } },
          overrideAccess: true,
        })
      } catch {
        // noop
      }
    }
  })

  const basePlanInput = {
    scorecard: [{ habit: 'Uống nước ấm', rating: 'good' as const }],
    identityStatement: 'Tôi sẽ uống nước ấm mỗi sáng để cơ thể khỏe mạnh',
    chosenTechniques: [],
    consent: true,
  }

  it('1. Khách đăng nhập gõ email KHÁC email tài khoản -> kế hoạch có customer = khách đăng nhập; tracker hiện kế hoạch này', async () => {
    const customer = await createCustomer('diff-email')
    const differentEmail = `hb25-typed-diff-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(differentEmail)

    // Mock session trả về customer
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

    const res = await submitHabitPlanAction({
      ...basePlanInput,
      email: differentEmail,
      identityStatement: 'Tuyên ngôn gõ email khác',
    })

    expect(res.success).toBe(true)
    expect(res.planId).toBeDefined()
    track('habitPlans', { id: res.planId! })

    // Kiểm tra bản ghi trong DB
    const planDoc = (await payload.findByID({
      collection: 'habitPlans',
      id: res.planId!,
      depth: 0,
      overrideAccess: true,
    })) as HabitPlan

    // customer phải là customer.id của phiên. DP-03 §1.3: leadEmail lấy từ phiên, bỏ email trình duyệt gửi.
    const customerIdInPlan =
      typeof planDoc.customer === 'object' && planDoc.customer !== null
        ? (planDoc.customer as { id: number }).id
        : planDoc.customer
    expect(customerIdInPlan).toBe(customer.id)
    expect(planDoc.leadEmail).toBe(customer.email.toLowerCase())

    // Tracker trả về đúng kế hoạch này
    const trackerPlan = await getOrCreateTrackerPlan(customer.id, { payload })
    expect(trackerPlan?.id).toBe(res.planId)
    expect(trackerPlan?.identityStatement).toBe('Tuyên ngôn gõ email khác')
  })

  it('2. Khách đã có kế hoạch, lưu kế hoạch mới khi đăng nhập -> kế hoạch mới là kế hoạch hiện tại; kế hoạch cũ còn', async () => {
    const customer = await createCustomer('restart')

    // Tạo kế hoạch cũ đã gắn customer
    const oldPlan = track(
      'habitPlans',
      (await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          leadEmail: customer.email,
          identityStatement: 'Kế hoạch số 1 (cũ)',
          startDate: vietnamTodayIso(),
          journeyDays: 28,
        },
        overrideAccess: true,
      })) as HabitPlan,
    )

    // Khách đăng nhập gửi kế hoạch mới qua submitHabitPlan với options.customerId
    const res = await submitHabitPlan(
      {
        ...basePlanInput,
        email: customer.email,
        identityStatement: 'Kế hoạch số 2 (mới khi bắt đầu lại)',
      },
      {},
      { customerId: customer.id },
    )

    expect(res.success).toBe(true)
    expect(res.planId).toBeDefined()
    expect(res.planId).not.toBe(oldPlan.id)
    track('habitPlans', { id: res.planId! })

    // Kế hoạch hiện tại trên tracker là kế hoạch mới
    const currentPlan = await getOrCreateTrackerPlan(customer.id, { payload })
    expect(currentPlan?.id).toBe(res.planId)
    expect(currentPlan?.identityStatement).toBe('Kế hoạch số 2 (mới khi bắt đầu lại)')

    // Kế hoạch cũ vẫn còn nguyên trong DB
    const allPlans = await payload.find({
      collection: 'habitPlans',
      where: { customer: { equals: customer.id } },
      overrideAccess: true,
    })
    expect(allPlans.totalDocs).toBe(2)
  })

  it('3. Khách vãng lai (không phiên) -> lưu theo leadEmail; đăng nhập OTP lần đầu thì được gắn', async () => {
    const anonEmail = `hb25-anon-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(anonEmail)

    // submitHabitPlan không có customerId
    const res = await submitHabitPlan(
      {
        ...basePlanInput,
        email: anonEmail,
        identityStatement: 'Kế hoạch của khách vãng lai',
      },
      {},
      {},
    )

    expect(res.success).toBe(true)
    expect(res.planId).toBeDefined()
    track('habitPlans', { id: res.planId! })

    const planBeforeAuth = (await payload.findByID({
      collection: 'habitPlans',
      id: res.planId!,
      depth: 0,
      overrideAccess: true,
    })) as HabitPlan

    expect(planBeforeAuth.customer).toBeFalsy()
    expect(planBeforeAuth.leadEmail).toBe(anonEmail)

    // Khách đăng nhập tài khoản lần đầu qua OTP với cùng email đó
    const newCustomer = track(
      'customers',
      (await payload.create({
        collection: 'customers',
        data: {
          email: anonEmail,
          name: 'Khách vừa tạo OTP',
        },
        overrideAccess: true,
      })) as Customer,
    )

    // Vào tracker lần đầu -> kế hoạch mồ côi được gắn vào tài khoản
    const attachedPlan = await getOrCreateTrackerPlan(newCustomer.id, { payload })
    expect(attachedPlan?.id).toBe(res.planId)

    const customerIdInPlan =
      typeof attachedPlan?.customer === 'object' && attachedPlan?.customer !== null
        ? (attachedPlan.customer as { id: number }).id
        : attachedPlan?.customer
    expect(customerIdInPlan).toBe(newCustomer.id)
  })

  it('4. Khách đã có kế hoạch + có kế hoạch leadEmail mới hơn cùng email (người khác gõ) -> KHÔNG bị gắn', async () => {
    const customer = await createCustomer('victim')

    // Kế hoạch hiện có của khách
    const existingPlan = track(
      'habitPlans',
      (await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customer.id,
          leadEmail: customer.email,
          identityStatement: 'Kế hoạch thật của chính tôi',
          startDate: vietnamTodayIso(),
          journeyDays: 28,
        },
        overrideAccess: true,
      })) as HabitPlan,
    )

    // Người lạ vào /habit/5-phut gõ email của khách (không đăng nhập)
    const strangerPlanRes = await submitHabitPlan(
      {
        ...basePlanInput,
        email: customer.email,
        identityStatement: 'Kế hoạch giả do người lạ gõ email',
      },
      {},
      {},
    )
    expect(strangerPlanRes.success).toBe(true)
    track('habitPlans', { id: strangerPlanRes.planId! })

    // Khách vào tracker: KHÔNG bị gắn kế hoạch của người lạ, vẫn giữ nguyên kế hoạch của mình
    const currentPlan = await getOrCreateTrackerPlan(customer.id, { payload })
    expect(currentPlan?.id).toBe(existingPlan.id)
    expect(currentPlan?.identityStatement).toBe('Kế hoạch thật của chính tôi')

    // Kế hoạch người lạ vẫn là mồ côi
    const strangerPlanDoc = (await payload.findByID({
      collection: 'habitPlans',
      id: strangerPlanRes.planId!,
      depth: 0,
      overrideAccess: true,
    })) as HabitPlan
    expect(strangerPlanDoc.customer).toBeFalsy()
  })

  it('5. Client gửi kèm customer / customerId trong dữ liệu form -> bị bỏ qua', async () => {
    const maliciousEmail = `hb25-tamper-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(maliciousEmail)

    // Giả lập client cố ý nhét customer: 9999 hoặc customerId: 9999 vào form input (khách vãng lai)
    const resAnon = await submitHabitPlan(
      {
        ...basePlanInput,
        email: maliciousEmail,
        identityStatement: 'Thử tấn công chèn customer',
        customer: 9999,
        customerId: 9999,
      } as Record<string, unknown>,
      {},
      {},
    )
    expect(resAnon.success).toBe(true)
    track('habitPlans', { id: resAnon.planId! })

    const planAnonDoc = (await payload.findByID({
      collection: 'habitPlans',
      id: resAnon.planId!,
      depth: 0,
      overrideAccess: true,
    })) as HabitPlan
    expect(planAnonDoc.customer).toBeFalsy()

    // Trường hợp khách đã đăng nhập: client cố ý gửi customer ID của người khác (ví dụ 8888)
    const realCustomer = await createCustomer('real-customer')
    const resAuth = await submitHabitPlan(
      {
        ...basePlanInput,
        email: realCustomer.email,
        identityStatement: 'Thử mạo danh customer khác khi đã login',
        customer: 8888,
        customerId: 8888,
      } as Record<string, unknown>,
      {},
      { customerId: realCustomer.id },
    )
    expect(resAuth.success).toBe(true)
    track('habitPlans', { id: resAuth.planId! })

    const planAuthDoc = (await payload.findByID({
      collection: 'habitPlans',
      id: resAuth.planId!,
      depth: 0,
      overrideAccess: true,
    })) as HabitPlan

    const savedCustomerId =
      typeof planAuthDoc.customer === 'object' && planAuthDoc.customer !== null
        ? (planAuthDoc.customer as { id: number }).id
        : planAuthDoc.customer
    expect(savedCustomerId).toBe(realCustomer.id)
    expect(savedCustomerId).not.toBe(8888)
  })

  it('6. Luật chống trùng 10 phút: so theo customer + identityStatement khi có customerId', async () => {
    const customer = await createCustomer('dedup')
    const typedEmail1 = `hb25-dedup-1-${randomUUID().slice(0, 8)}@example.test`
    const typedEmail2 = `hb25-dedup-2-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(typedEmail1, typedEmail2)

    const statement = 'Tuyên ngôn chống trùng 10 phút HB-25'

    // Lần 1
    const res1 = await submitHabitPlan(
      {
        ...basePlanInput,
        email: typedEmail1,
        identityStatement: statement,
      },
      {},
      { customerId: customer.id },
    )
    expect(res1.success).toBe(true)
    track('habitPlans', { id: res1.planId! })

    // Lần 2 (trong 10 phút, cùng customerId, cùng identityStatement, gõ email khác)
    const res2 = await submitHabitPlan(
      {
        ...basePlanInput,
        email: typedEmail2,
        identityStatement: statement,
      },
      {},
      { customerId: customer.id },
    )
    expect(res2.success).toBe(true)
    // Trả về chính kế hoạch đã tạo ở lần 1, không tạo mới
    expect(res2.planId).toBe(res1.planId)

    // Xác nhận DB chỉ có duy nhất 1 kế hoạch
    const plans = await payload.find({
      collection: 'habitPlans',
      where: {
        customer: { equals: customer.id },
      },
      overrideAccess: true,
    })
    expect(plans.totalDocs).toBe(1)
  })
})
