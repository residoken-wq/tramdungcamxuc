// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { submitHabitPlan } from '../../src/lib/habit.server'
import { getOrCreateTrackerPlan } from '../../src/lib/habit/tracker.server'
import type { Customer, HabitPlan } from '../../src/payload-types'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []
  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('HB-09: DB integration tests for Habit Plan Submission with B3-B4 fields', () => {
  let payload: Payload
  let emailSender: MockEmailSender
  const createdPlans: number[] = []
  const createdLeads: number[] = []
  const createdCustomers: number[] = []
  const trackedEmails: string[] = []

  beforeAll(async () => {
    payload = await getPayload({ config })
    emailSender = new MockEmailSender()
  }, 60000)

  afterAll(async () => {
    if (trackedEmails.length > 0) {
      await payload.delete({
        collection: 'leads',
        where: { email: { in: trackedEmails } },
        overrideAccess: true,
      })
    }
    for (const id of createdPlans) {
      try {
        await payload.delete({ collection: 'habitPlans', id, overrideAccess: true })
      } catch {
        // noop
      }
    }
    for (const id of createdLeads) {
      try {
        await payload.delete({ collection: 'leads', id, overrideAccess: true })
      } catch {
        // noop
      }
    }
    for (const id of createdCustomers) {
      try {
        await payload.delete({
          collection: 'customers',
          id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      } catch {
        // noop
      }
    }
  })

  it('submitHabitPlan lưu đúng 4 nhóm field mới (time, anchorHabit, rhythmDays, twoMinuteAction)', async () => {
    const testEmail = `hb09-full-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(testEmail)

    const result = await submitHabitPlan(
      {
        scorecard: [
          { habit: 'Thức dậy 6h', rating: 'good', time: '06:00' },
          { habit: 'Uống 1 cốc nước ấm', rating: 'good', time: '06:15' },
          { habit: 'Ăn sáng vội', rating: 'neutral' },
        ],
        identityStatement: 'Tôi sẽ uống 1 cốc nước ấm để trở thành người khỏe mạnh',
        anchorHabit: 'Thức dậy 6h',
        rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        twoMinuteAction: 'Rót sẵn nước vào bình tối hôm trước',
        chosenTechniques: [],
        email: testEmail,
        consent: true,
      },
      { ip: `192.168.99.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )

    expect(result.success).toBe(true)
    expect(result.planId).toBeDefined()
    if (result.planId) createdPlans.push(result.planId)

    const storedPlan = (await payload.findByID({
      collection: 'habitPlans',
      id: result.planId!,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(storedPlan).toBeDefined()
    expect(storedPlan.leadEmail).toBe(testEmail)
    expect(storedPlan.anchorHabit).toBe('Thức dậy 6h')
    expect(storedPlan.rhythmDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
    expect(storedPlan.twoMinuteAction).toBe('Rót sẵn nước vào bình tối hôm trước')
    expect(storedPlan.scorecard?.[0]?.time).toBe('06:00')
    expect(storedPlan.scorecard?.[1]?.time).toBe('06:15')
    expect(storedPlan.scorecard?.[2]?.time).toBeFalsy()
  })

  it('submitHabitPlan khi các field tùy chọn rỗng -> không ghi chuỗi rỗng vào DB', async () => {
    const testEmail = `hb09-empty-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(testEmail)

    const result = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Đọc sách 10 trang', rating: 'good' }],
        identityStatement: 'Tôi sẽ đọc sách để mở mang tri thức',
        anchorHabit: '',
        twoMinuteAction: '',
        chosenTechniques: [],
        email: testEmail,
        consent: true,
      },
      { ip: `192.168.99.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )

    expect(result.success).toBe(true)
    if (result.planId) createdPlans.push(result.planId)

    const storedPlan = (await payload.findByID({
      collection: 'habitPlans',
      id: result.planId!,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(storedPlan).toBeDefined()
    expect(storedPlan.anchorHabit).toBeFalsy()
    expect(storedPlan.twoMinuteAction).toBeFalsy()
    expect(storedPlan.rhythmDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
    expect(storedPlan.scorecard?.[0]?.time).toBeFalsy()
  })

  it('privateReason, companionName, startDate gửi kèm trong input không được lưu', async () => {
    const testEmail = `hb09-strip-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(testEmail)

    const result = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Chạy bộ 15 phút', rating: 'good' }],
        identityStatement: 'Tôi sẽ chạy bộ để rèn luyện sức bền',
        chosenTechniques: [],
        email: testEmail,
        consent: true,
        privateReason: 'Lý do bí mật không được lưu khi chưa đăng nhập',
        companionName: 'Bạn đồng hành bí mật',
        startDate: '2099-01-01T00:00:00.000Z',
      },
      { ip: `192.168.99.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )

    expect(result.success).toBe(true)
    if (result.planId) createdPlans.push(result.planId)

    const storedPlan = (await payload.findByID({
      collection: 'habitPlans',
      id: result.planId!,
      overrideAccess: true,
    })) as unknown as HabitPlan

    expect(storedPlan).toBeDefined()
    expect(storedPlan.privateReason).toBeFalsy()
    expect(storedPlan.companionName).toBeFalsy()
    // startDate phải là ngày hôm nay do server tự gán, không phải ngày 2099
    expect(storedPlan.startDate).not.toContain('2099')
  })

  it('getOrCreateTrackerPlan gắn kế hoạch leadEmail vào customer vẫn giữ nguyên các field mới', async () => {
    const testEmail = `hb09-attach-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(testEmail)

    // 1. Tạo kế hoạch bằng submitHabitPlan
    const result = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Viết nhật ký biết ơn', rating: 'good', time: '21:30' }],
        identityStatement: 'Tôi sẽ viết nhật ký để trở thành người biết ơn',
        anchorHabit: 'Viết nhật ký biết ơn',
        rhythmDays: ['mon', 'wed', 'fri', 'sun'],
        twoMinuteAction: 'Viết 1 dòng cảm xúc duy nhất',
        chosenTechniques: [],
        email: testEmail,
        consent: true,
      },
      { ip: `192.168.99.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )
    expect(result.success).toBe(true)
    if (result.planId) createdPlans.push(result.planId)

    // 2. Tạo customer với cùng email
    const customer = (await payload.create({
      collection: 'customers',
      data: {
        email: testEmail,
        name: 'Học viên Test Gắn Kế Hoạch',
      },
      overrideAccess: true,
    })) as Customer
    createdCustomers.push(customer.id)

    // 3. Gọi getOrCreateTrackerPlan để gắn kế hoạch vào customer
    const attachedPlan = await getOrCreateTrackerPlan(customer.id, {
      payload,
    })

    expect(attachedPlan).not.toBeNull()
    expect(attachedPlan?.id).toBe(result.planId)
    const attachedCustId =
      typeof attachedPlan?.customer === 'object' && attachedPlan.customer !== null
        ? attachedPlan.customer.id
        : attachedPlan?.customer
    expect(attachedCustId).toBe(customer.id)
    expect(attachedPlan?.anchorHabit).toBe('Viết nhật ký biết ơn')
    expect(attachedPlan?.rhythmDays).toEqual(['mon', 'wed', 'fri', 'sun'])
    expect(attachedPlan?.twoMinuteAction).toBe('Viết 1 dòng cảm xúc duy nhất')
    expect(attachedPlan?.scorecard?.[0]?.time).toBe('21:30')
  })
})
