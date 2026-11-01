// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { HabitPlan } from '../../src/payload-types'
import { vi as viStrings } from '../../src/lib/i18n/vi'
import { submitHabitPlan } from '../../src/lib/habit.server'
import { getOrCreateTrackerPlan } from '../../src/lib/habit/tracker.server'
import { getVietnamYmd, addVietnamDays, vietnamTodayIso } from '../../src/lib/habit/tracker-stats'

describe('HB-20: submitHabitPlan Server Action Validation & Persistence', () => {
  let payload: Payload
  const createdPlans: number[] = []
  const trackedEmails: string[] = []

  const mockEmailSender = {
    send: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    for (const id of createdPlans) {
      try {
        await payload.delete({ collection: 'habitPlans', id, overrideAccess: true })
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

  const baseInput = {
    scorecard: [{ habit: 'Thức dậy 6h', rating: 'good' as const }],
    identityStatement: 'Tôi sẽ thức dậy sớm để có nhiều năng lượng',
    chosenTechniques: [],
    consent: true,
  }

  it('1. startDate ngoài khoảng hôm nay -> +14 ngày bị từ chối: +15 ngày -> lỗi tiếng Việt', async () => {
    const todayYmd = getVietnamYmd()
    const plus15 = getVietnamYmd(new Date(addVietnamDays(todayYmd, 15)))
    const testEmail = `hb20-plus15-${randomUUID().slice(0, 8)}@example.test`

    await expect(
      submitHabitPlan(
        {
          ...baseInput,
          email: testEmail,
          startDate: plus15,
        },
        { ip: '127.0.0.1' },
        { payload, emailSender: mockEmailSender },
      ),
    ).rejects.toThrow(viStrings.hb20.errors.startDateOutOfRange)
  })

  it('2. startDate hôm qua (quá khứ) bị từ chối với lỗi tiếng Việt', async () => {
    const yesterday = getVietnamYmd(new Date(Date.now() - 86400000 * 2))
    const testEmail = `hb20-past-${randomUUID().slice(0, 8)}@example.test`

    await expect(
      submitHabitPlan(
        {
          ...baseInput,
          email: testEmail,
          startDate: yesterday,
        },
        { ip: '127.0.0.1' },
        { payload, emailSender: mockEmailSender },
      ),
    ).rejects.toThrow(viStrings.hb20.errors.startDateOutOfRange)
  })

  it('3. startDate đúng mốc +14 ngày -> lưu thành công dạng 00:00:00+07:00', async () => {
    const todayYmd = getVietnamYmd()
    const plus14 = getVietnamYmd(new Date(addVietnamDays(todayYmd, 14)))
    const testEmail = `hb20-plus14-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(testEmail)

    const res = await submitHabitPlan(
      {
        ...baseInput,
        email: testEmail,
        startDate: plus14,
      },
      { ip: `192.168.10.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender: mockEmailSender },
    )

    expect(res.success).toBe(true)
    expect(res.planId).toBeDefined()
    if (res.planId) createdPlans.push(res.planId)

    const doc = (await payload.findByID({
      collection: 'habitPlans',
      id: res.planId!,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(doc).toBeDefined()
    const expectedIso = new Date(`${plus14}T00:00:00+07:00`).toISOString()
    expect(doc.startDate).toBe(expectedIso)
  })

  it('4. startDate không truyền -> mặc định là hôm nay theo giờ Việt Nam', async () => {
    const testEmail = `hb20-default-date-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(testEmail)

    const res = await submitHabitPlan(
      {
        ...baseInput,
        email: testEmail,
      },
      { ip: `192.168.11.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender: mockEmailSender },
    )

    expect(res.success).toBe(true)
    if (res.planId) createdPlans.push(res.planId)

    const doc = (await payload.findByID({
      collection: 'habitPlans',
      id: res.planId!,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(doc.startDate).toBe(vietnamTodayIso())
  })

  it('5. privateReason > 500 ký tự bị từ chối với lỗi Zod tiếng Việt', async () => {
    const testEmail = `hb20-toolong-reason-${randomUUID().slice(0, 8)}@example.test`

    await expect(
      submitHabitPlan(
        {
          ...baseInput,
          email: testEmail,
          privateReason: 'a'.repeat(501),
        },
        { ip: '127.0.0.1' },
        { payload, emailSender: mockEmailSender },
      ),
    ).rejects.toThrow(viStrings.hb20.errors.privateReasonTooLong)
  })

  it('6. companionName > 100 ký tự bị từ chối với lỗi Zod tiếng Việt', async () => {
    const testEmail = `hb20-toolong-companion-${randomUUID().slice(0, 8)}@example.test`

    await expect(
      submitHabitPlan(
        {
          ...baseInput,
          email: testEmail,
          companionName: 'b'.repeat(101),
        },
        { ip: '127.0.0.1' },
        { payload, emailSender: mockEmailSender },
      ),
    ).rejects.toThrow(viStrings.hb20.errors.companionNameTooLong)
  })

  it('7. privateReason và companionName hợp lệ được lưu đầy đủ vào habitPlans', async () => {
    const testEmail = `hb20-valid-fields-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(testEmail)

    const res = await submitHabitPlan(
      {
        ...baseInput,
        email: testEmail,
        privateReason: 'Lý do tôi muốn thay đổi bản thân',
        companionName: 'Người bạn thân nhất',
      },
      { ip: `192.168.12.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender: mockEmailSender },
    )

    expect(res.success).toBe(true)
    if (res.planId) createdPlans.push(res.planId)

    const doc = (await payload.findByID({
      collection: 'habitPlans',
      id: res.planId!,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(doc.privateReason).toBe('Lý do tôi muốn thay đổi bản thân')
    expect(doc.companionName).toBe('Người bạn thân nhất')
  })

  it('8. HB-20c: khách đăng nhập OTP sau khi lưu -> kế hoạch giữ ngày đã chọn; kế hoạch cũ đã qua ngày -> hôm nay', async () => {
    const todayYmd = getVietnamYmd()
    const plus10 = getVietnamYmd(new Date(addVietnamDays(todayYmd, 10)))
    const testEmail = `hb20-adopt-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(testEmail)

    const res = await submitHabitPlan(
      { ...baseInput, email: testEmail, startDate: plus10 },
      { ip: `192.168.20.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender: mockEmailSender },
    )
    expect(res.success).toBe(true)
    if (res.planId) createdPlans.push(res.planId)

    const customer = await payload.create({
      collection: 'customers',
      data: { email: testEmail },
      overrideAccess: true,
    })
    try {
      const attached = await getOrCreateTrackerPlan(customer.id, { payload })
      expect(attached?.id).toBe(res.planId)
      expect(attached?.startDate).toBe(new Date(`${plus10}T00:00:00+07:00`).toISOString())

      // Kế hoạch mồ côi có ngày bắt đầu đã qua -> gắn vào thì bắt đầu lại từ hôm nay
      const oldEmail = `hb20-old-${randomUUID().slice(0, 8)}@example.test`
      trackedEmails.push(oldEmail)
      const oldPlan = (await payload.create({
        collection: 'habitPlans',
        data: {
          leadEmail: oldEmail,
          identityStatement: 'Kế hoạch [MẪU] cũ',
          startDate: addVietnamDays(todayYmd, -3),
        },
        overrideAccess: true,
      })) as HabitPlan
      createdPlans.push(oldPlan.id)
      const oldCustomer = await payload.create({
        collection: 'customers',
        data: { email: oldEmail },
        overrideAccess: true,
      })
      try {
        const reattached = await getOrCreateTrackerPlan(oldCustomer.id, { payload })
        expect(reattached?.id).toBe(oldPlan.id)
        expect(reattached?.startDate).toBe(vietnamTodayIso())
      } finally {
        await payload.update({
          collection: 'habitPlans',
          id: oldPlan.id,
          data: { customer: null },
          overrideAccess: true,
        })
        await payload.delete({
          collection: 'customers',
          id: oldCustomer.id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      }
    } finally {
      if (res.planId) {
        await payload.update({
          collection: 'habitPlans',
          id: res.planId,
          data: { customer: null },
          overrideAccess: true,
        })
      }
      await payload.delete({
        collection: 'customers',
        id: customer.id,
        overrideAccess: true,
        context: { accountDeletion: true },
      })
    }
  })
})
