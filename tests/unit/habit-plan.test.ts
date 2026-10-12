// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { submitHabitPlan } from '../../src/lib/habit.server'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []
  public shouldFail = false

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    if (this.shouldFail) {
      throw new Error('Simulated email provider network failure')
    }
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

describe('Habit Plan Submission Flow (T2-03)', () => {
  let payload: Payload
  let emailSender: MockEmailSender
  const createdTechniques: number[] = []
  const createdPlans: number[] = []
  const createdLeads: number[] = []

  let validCueTechId: number
  let validCravingTechId: number

  beforeAll(async () => {
    payload = await getPayload({ config })
    emailSender = new MockEmailSender()

    // Tạo 2 kỹ thuật hợp lệ để test
    const cueTech = await payload.create({
      collection: 'techniques',
      data: {
        name: `[TEST] Kỹ thuật Tín hiệu ${randomUUID().slice(0, 8)}`,
        stage: 'cue',
        _status: 'published',
      },
      overrideAccess: true,
    })
    validCueTechId = cueTech.id
    createdTechniques.push(cueTech.id)

    const cravingTech = await payload.create({
      collection: 'techniques',
      data: {
        name: `[TEST] Kỹ thuật Khao khát ${randomUUID().slice(0, 8)}`,
        stage: 'craving',
        _status: 'published',
      },
      overrideAccess: true,
    })
    validCravingTechId = cravingTech.id
    createdTechniques.push(cravingTech.id)
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const id of createdPlans) {
        await payload.delete({ collection: 'habitPlans', id, overrideAccess: true })
      }
      for (const id of createdLeads) {
        await payload.delete({ collection: 'leads', id, overrideAccess: true })
      }
      for (const id of createdTechniques) {
        await payload.delete({ collection: 'techniques', id, overrideAccess: true })
      }
    } catch {
      // Ignore cleanup errors
    }
  })

  it('lưu đúng habitPlans + lead (tag habit-loop, need resource) và gửi email', async () => {
    const testEmail = `habit-user-${randomUUID().slice(0, 8)}@example.com`
    const result = await submitHabitPlan(
      {
        scorecard: [
          { habit: 'Uống nước ấm', rating: 'good' },
          { habit: 'Lướt TikTok khuya', rating: 'bad' },
        ],
        identityStatement: 'Tôi sẽ uống nước ấm để trở thành người khỏe mạnh',
        chosenTechniques: [
          { techniqueId: validCueTechId, stage: 'cue', action: 'Để cốc nước ngay bàn làm việc' },
          { techniqueId: validCravingTechId, stage: 'craving', action: 'Uống từng ngụm chậm rãi' },
        ],
        email: testEmail,
        consent: true,
      },
      { ip: '127.0.0.1' },
      { payload, emailSender },
    )

    expect(result.success).toBe(true)
    expect(result.planId).toBeDefined()
    if (result.planId) createdPlans.push(result.planId)

    // Kiểm tra habitPlans đã lưu trong DB
    const planDoc = await payload.findByID({
      collection: 'habitPlans',
      id: result.planId!,
      overrideAccess: true,
    })
    expect(planDoc).toBeDefined()
    expect(planDoc.leadEmail).toBe(testEmail)
    expect(planDoc.identityStatement).toBe('Tôi sẽ uống nước ấm để trở thành người khỏe mạnh')
    expect(planDoc.scorecard).toHaveLength(2)

    // Kiểm tra lead đã tạo với tag habit-loop và need resource
    const leadsRes = await payload.find({
      collection: 'leads',
      where: { email: { equals: testEmail } },
      overrideAccess: true,
    })
    expect(leadsRes.docs.length).toBeGreaterThan(0)
    const lead = leadsRes.docs[0]
    createdLeads.push(lead.id)
    expect(lead.need).toBe('resource')
    expect(lead.interestTags?.some((t) => t.text === 'habit-loop')).toBe(true)

    // Kiểm tra email gửi đi
    expect(emailSender.sent.length).toBeGreaterThan(0)
    expect(emailSender.sent[emailSender.sent.length - 1].to).toBe(testEmail)
  })

  it('từ chối khi technique không tồn tại', async () => {
    const invalidTechId = 99999999
    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Tập thể dục', rating: 'good' }],
          identityStatement: 'Tôi sẽ tập thể dục để trở thành người năng động',
          chosenTechniques: [
            { techniqueId: invalidTechId, action: 'Chạy bộ 15 phút' },
          ],
          email: 'test@example.com',
          consent: true,
        },
        {},
        { payload, emailSender },
      ),
    ).rejects.toThrow(/không tồn tại/)
  })

  it('từ chối khi technique sai stage (không đúng giai đoạn)', async () => {
    // validCueTechId có stage là 'cue', nhưng client gửi stage 'reward'
    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Tập thể dục', rating: 'good' }],
          identityStatement: 'Tôi sẽ tập thể dục để trở thành người năng động',
          chosenTechniques: [
            { techniqueId: validCueTechId, stage: 'reward', action: 'Ăn một que kem' },
          ],
          email: 'test@example.com',
          consent: true,
        },
        {},
        { payload, emailSender },
      ),
    ).rejects.toThrow(/thuộc giai đoạn/)
  })

  it('từ chối khi có email nhưng thiếu consent (Nghị định 13/2023)', async () => {
    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Đọc sách', rating: 'good' }],
          identityStatement: 'Tôi sẽ đọc sách để trở thành người hiểu biết',
          chosenTechniques: [
            { techniqueId: validCueTechId, action: 'Để sách cạnh gối' },
          ],
          email: 'no-consent@example.com',
          consent: false,
        },
        {},
        { payload, emailSender },
      ),
    ).rejects.toThrow()
  })

  it('chống bot: honeypot có giá trị thì trả về fake success và không ghi vào DB', async () => {
    const spamEmail = `spam-bot-${randomUUID().slice(0, 8)}@example.com`
    const result = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Spam habit', rating: 'bad' }],
        identityStatement: 'Spam identity',
        chosenTechniques: [{ techniqueId: validCueTechId, action: 'Spam action' }],
        email: spamEmail,
        consent: true,
        honeypot: 'Bot Corp Spam Field',
      },
      {},
      { payload, emailSender },
    )

    expect(result.success).toBe(true)
    expect(result.fake).toBe(true)

    // Đảm bảo không tạo lead hay plan trong DB
    const checkLeads = await payload.find({
      collection: 'leads',
      where: { email: { equals: spamEmail } },
      overrideAccess: true,
    })
    expect(checkLeads.docs.length).toBe(0)
  })

  it('từ chối khi chuỗi quá dài (identityStatement > 500 ký tự)', async () => {
    const longStatement = 'a'.repeat(501)
    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Đọc sách', rating: 'good' }],
          identityStatement: longStatement,
          chosenTechniques: [{ techniqueId: validCueTechId, action: 'Đọc 5 trang' }],
        },
        {},
        { payload, emailSender },
      ),
    ).rejects.toThrow()
  })

  it('khi nhà cung cấp email gặp sự cố, việc lưu kế hoạch vào DB vẫn thành công', async () => {
    const failingSender = new MockEmailSender()
    failingSender.shouldFail = true

    const email = `fault-tolerant-${randomUUID().slice(0, 8)}@example.com`
    const result = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Thiền 5 phút', rating: 'good' }],
        identityStatement: 'Tôi sẽ thiền để trở thành người bình an',
        chosenTechniques: [
          { techniqueId: validCueTechId, stage: 'cue', action: 'Bật nhạc thiền mỗi sáng' },
        ],
        email,
        consent: true,
      },
      { ip: '127.0.0.1' },
      { payload, emailSender: failingSender },
    )

    expect(result.success).toBe(true)
    expect(result.planId).toBeDefined()
    if (result.planId) createdPlans.push(result.planId)

    // Xác nhận plan vẫn được ghi nhận trong DB
    const doc = await payload.findByID({
      collection: 'habitPlans',
      id: result.planId!,
      overrideAccess: true,
    })
    expect(doc).toBeDefined()
    expect(doc.leadEmail).toBe(email)

    const leads = await payload.find({
      collection: 'leads',
      where: { email: { equals: email } },
      overrideAccess: true,
    })
    if (leads.docs[0]) createdLeads.push(leads.docs[0].id)
  })
})
