// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { submitHabitPlan, getHabitProduct } from '../../src/lib/habit.server'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import { vi as viStrings } from '../../src/lib/i18n/vi'
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
  const createdCustomers: number[] = []

  let validCueTechId: number
  let validCravingTechId: number
  let draftTechId: number

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

    const draftTech = await payload.create({
      collection: 'techniques',
      data: {
        name: `[TEST] Kỹ thuật Nháp ${randomUUID().slice(0, 8)}`,
        stage: 'cue',
        _status: 'draft',
      },
      overrideAccess: true,
    })
    draftTechId = draftTech.id
    createdTechniques.push(draftTech.id)
  }, 60000)

  // Leads created indirectly (by submitHabitPlan) for these emails are removed in afterAll.
  const trackedEmails: string[] = []

  afterAll(async () => {
    if (trackedEmails.length > 0) {
      await payload.delete({
        collection: 'leads',
        where: { email: { in: trackedEmails } },
        overrideAccess: true,
      })
    }
    if (!payload) return
    try {
      for (const id of createdPlans) {
        await payload.delete({ collection: 'habitPlans', id, overrideAccess: true })
      }
      for (const id of createdLeads) {
        await payload.delete({ collection: 'leads', id, overrideAccess: true })
      }
      for (const id of createdCustomers) {
        await payload.delete({
          collection: 'customers',
          id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
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
      { ip: `192.168.1.${Math.floor(Math.random() * 200) + 10}` },
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
    expect(emailSender.sent[emailSender.sent.length - 1].subject).toBe(viStrings.habit.emailSubject)
  })

  it('từ chối khi technique không tồn tại', async () => {
    const invalidTechId = 99999999
    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Tập thể dục', rating: 'good' }],
          identityStatement: 'Tôi sẽ tập thể dục để trở thành người năng động',
          chosenTechniques: [
            { techniqueId: invalidTechId, stage: 'cue', action: 'Chạy bộ 15 phút' },
          ],
          email: `habit-${randomUUID().slice(0, 8)}@example.test`,
          consent: true,
        },
        {},
        { payload, emailSender },
      ),
    ).rejects.toThrow(/không còn trong danh sách/)
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
          email: `habit-${randomUUID().slice(0, 8)}@example.test`,
          consent: true,
        },
        {},
        { payload, emailSender },
      ),
    ).rejects.toThrow(/không còn trong danh sách/)
  })

  it('A1: từ chối khi trùng techniqueId trong chosenTechniques', async () => {
    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Uống nước', rating: 'good' }],
          identityStatement: 'Tôi sẽ uống nước để khỏe mạnh',
          chosenTechniques: [
            { techniqueId: validCueTechId, stage: 'cue', action: 'Để cốc nước gần máy tính' },
            { techniqueId: validCueTechId, stage: 'cue', action: 'Rót nước đầy bình' },
          ],
          email: `habit-${randomUUID().slice(0, 8)}@example.test`,
          consent: true,
        },
        {},
        { payload, emailSender },
      ),
    ).rejects.toThrow(/trùng/i)
  })

  it('A1: từ chối khi kỹ thuật chưa xuất bản (_status là draft)', async () => {
    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Uống nước', rating: 'good' }],
          identityStatement: 'Tôi sẽ uống nước để khỏe mạnh',
          chosenTechniques: [
            { techniqueId: draftTechId, stage: 'cue', action: 'Hành động với kỹ thuật nháp' },
          ],
          email: `habit-${randomUUID().slice(0, 8)}@example.test`,
          consent: true,
        },
        {},
        { payload, emailSender },
      ),
    ).rejects.toThrow(/không còn trong danh sách/)
  })

  it('A1: từ chối khi một giai đoạn có nhiều hơn 2 kỹ thuật', async () => {
    // Tạo thêm 2 kỹ thuật cue nữa để có tổng cộng 3 kỹ thuật cue
    const cue2 = await payload.create({
      collection: 'techniques',
      data: { name: `Cue 2 ${randomUUID().slice(0, 6)}`, stage: 'cue', _status: 'published' },
      overrideAccess: true,
    })
    const cue3 = await payload.create({
      collection: 'techniques',
      data: { name: `Cue 3 ${randomUUID().slice(0, 6)}`, stage: 'cue', _status: 'published' },
      overrideAccess: true,
    })
    createdTechniques.push(cue2.id, cue3.id)

    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Uống nước', rating: 'good' }],
          identityStatement: 'Tôi sẽ uống nước để khỏe mạnh',
          chosenTechniques: [
            { techniqueId: validCueTechId, stage: 'cue', action: 'Hành động 1' },
            { techniqueId: cue2.id, stage: 'cue', action: 'Hành động 2' },
            { techniqueId: cue3.id, stage: 'cue', action: 'Hành động 3' },
          ],
          email: `habit-${randomUUID().slice(0, 8)}@example.test`,
          consent: true,
        },
        {},
        { payload, emailSender },
      ),
    ).rejects.toThrow(/tối đa 2/i)
  })

  it('A1: từ chối khi thiếu stage trong chosenTechniques', async () => {
    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Uống nước', rating: 'good' }],
          identityStatement: 'Tôi sẽ uống nước để khỏe mạnh',
          chosenTechniques: [{ techniqueId: validCueTechId, action: 'Hành động thiếu stage' }],
          email: `habit-${randomUUID().slice(0, 8)}@example.test`,
          consent: true,
        },
        {},
        { payload, emailSender },
      ),
    ).rejects.toThrow()
  })

  it('A2: không tự ý gán customer khi nhập email của khách hàng đã có trong DB', async () => {
    const existingCustEmail = `cust-existing-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(existingCustEmail)
    const cust = await payload.create({
      collection: 'customers',
      data: {
        email: existingCustEmail,
        name: 'Học viên Test 01',
      },
      overrideAccess: true,
    })
    createdCustomers.push(cust.id)

    const result = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Tập yoga', rating: 'good' }],
        identityStatement: 'Tôi sẽ tập yoga để cơ thể dẻo dai',
        chosenTechniques: [{ techniqueId: validCueTechId, stage: 'cue', action: 'Trải thảm tập' }],
        email: existingCustEmail,
        consent: true,
      },
      { ip: `192.168.2.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )

    expect(result.success).toBe(true)
    expect(result.planId).toBeDefined()
    if (result.planId) createdPlans.push(result.planId)

    const planDoc = await payload.findByID({
      collection: 'habitPlans',
      id: result.planId!,
      overrideAccess: true,
    })
    expect(planDoc).toBeDefined()
    expect(planDoc.customer).toBeFalsy()
    expect(planDoc.leadEmail).toBe(existingCustEmail)
  })

  it('A3: không lưu habitPlans vào DB khi không để lại email, luôn áp dụng rate limit và turnstile', async () => {
    const countBefore = await payload.count({ collection: 'habitPlans' })

    const result = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Đi ngủ sớm', rating: 'good' }],
        identityStatement: 'Tôi sẽ đi ngủ sớm để có nhiều năng lượng',
        chosenTechniques: [
          { techniqueId: validCueTechId, stage: 'cue', action: 'Tắt đèn lúc 10h' },
        ],
        email: '',
        consent: false,
      },
      { ip: `192.168.3.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )

    const countAfter = await payload.count({ collection: 'habitPlans' })
    expect(countAfter.totalDocs).toBe(countBefore.totalDocs)
    expect(result.planId).toBeUndefined()
    expect(result.success).toBe(true)
  })

  it('từ chối khi có email nhưng thiếu consent (Nghị định 13/2023)', async () => {
    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Đọc sách', rating: 'good' }],
          identityStatement: 'Tôi sẽ đọc sách để trở thành người hiểu biết',
          chosenTechniques: [
            { techniqueId: validCueTechId, stage: 'cue', action: 'Để sách cạnh gối' },
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
        chosenTechniques: [{ techniqueId: validCueTechId, stage: 'cue', action: 'Spam action' }],
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
          chosenTechniques: [{ techniqueId: validCueTechId, stage: 'cue', action: 'Đọc 5 trang' }],
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
      { ip: `192.168.1.${Math.floor(Math.random() * 200) + 10}` },
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

  it('A6: getHabitProduct không trả về sản phẩm khi ở trạng thái draft', async () => {
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      limit: 1,
    })

    let prodId: number
    let origStatus: 'draft' | 'published' = 'published'

    if (existing.docs.length > 0) {
      prodId = existing.docs[0].id as number
      origStatus = (existing.docs[0]._status as 'draft' | 'published') || 'published'
      await payload.update({
        collection: 'products',
        id: prodId,
        data: { _status: 'draft' },
        overrideAccess: true,
      })
    } else {
      const created = await payload.create({
        collection: 'products',
        draft: true,
        data: {
          name: 'Habit Tracker Số Test',
          slug: HABIT_TRACKER_PRODUCT_SLUG,
          web: 'habit',
          journeyStep: 'practice',
          _status: 'draft',
          type: 'digital_tool',
          price: 250000,
        },
        overrideAccess: true,
      })
      prodId = created.id as number
    }

    try {
      const res = await getHabitProduct(payload)
      expect(res).toBeNull()
    } finally {
      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'products',
          id: prodId,
          data: { _status: origStatus },
          overrideAccess: true,
        })
      } else {
        await payload.delete({
          collection: 'products',
          id: prodId,
          overrideAccess: true,
        })
      }
    }
  })

  it('A6: getHabitProduct rethrow lỗi khi DB gặp sự cố (không nuốt thành null)', async () => {
    const brokenPayload = {
      ...payload,
      find: vi.fn().mockRejectedValue(new Error('PostgreSQL connection terminated')),
      count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
    } as unknown as Payload

    await expect(getHabitProduct(brokenPayload)).rejects.toThrow('PostgreSQL connection terminated')
  })

  it('B9: server luôn tự đặt startDate là ngày hôm nay, không nhận startDate từ client', async () => {
    const email = `test-b9-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(email)
    const fakeClientStartDate = '2020-01-01T00:00:00.000Z'

    const result = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Đi bộ', rating: 'good' }],
        identityStatement: 'Tôi sẽ đi bộ để trở thành người năng động',
        chosenTechniques: [{ techniqueId: validCueTechId, stage: 'cue', action: 'Chuẩn bị giày' }],
        email,
        consent: true,
        startDate: fakeClientStartDate,
      },
      { ip: `192.168.2.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )

    expect(result.success).toBe(true)
    expect(result.planId).toBeDefined()
    if (result.planId) createdPlans.push(result.planId)

    const doc = await payload.findByID({
      collection: 'habitPlans',
      id: result.planId!,
      overrideAccess: true,
    })
    expect(doc).toBeDefined()
    expect(doc.startDate).toBeDefined()

    const savedDate = new Date(doc.startDate!)
    const today = new Date()
    // Ngày bắt đầu tính theo giờ Việt Nam
    const vnDay = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d)
    expect(vnDay(savedDate)).toBe(vnDay(today))
  })

  it('B10: cho phép gửi họ và tên tùy chọn và lưu chính xác vào lead', async () => {
    const email = `test-b10-${randomUUID().slice(0, 8)}@example.com`
    const fullName = 'Nguyễn Thị Minh An'

    const result = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Tập yoga', rating: 'good' }],
        identityStatement: 'Tôi sẽ tập yoga để cơ thể dẻo dai',
        chosenTechniques: [{ techniqueId: validCueTechId, stage: 'cue', action: 'Trải thảm yoga' }],
        name: fullName,
        email,
        consent: true,
      },
      { ip: `192.168.3.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )

    expect(result.success).toBe(true)
    if (result.planId) createdPlans.push(result.planId)

    const leads = await payload.find({
      collection: 'leads',
      where: { email: { equals: email } },
      overrideAccess: true,
    })
    expect(leads.docs.length).toBe(1)
    const lead = leads.docs[0]
    createdLeads.push(lead.id)
    expect(lead.name).toBe(fullName)
  })

  it('B12: nếu lưu habitPlans gặp lỗi thì không tạo lead mồ côi', async () => {
    const email = `test-b12-${randomUUID().slice(0, 8)}@example.com`

    const failingPayload = Object.assign(Object.create(payload), {
      create: vi
        .fn()
        .mockImplementation(
          ({ collection, data }: { collection: any; data: Record<string, unknown> }) => {
            if (collection === 'habitPlans') {
              return Promise.reject(new Error('Simulated habitPlans DB error'))
            }
            return (payload.create as any)({ collection, data, overrideAccess: true })
          },
        ),
    }) as Payload

    await expect(
      submitHabitPlan(
        {
          scorecard: [{ habit: 'Tập thở', rating: 'good' }],
          identityStatement: 'Tôi sẽ tập thở để giải tỏa căng thẳng',
          chosenTechniques: [
            { techniqueId: validCueTechId, stage: 'cue', action: 'Hít sâu 4 giây' },
          ],
          email,
          consent: true,
        },
        { ip: `192.168.4.${Math.floor(Math.random() * 200) + 10}` },
        { payload: failingPayload, emailSender },
      ),
    ).rejects.toThrow('Simulated habitPlans DB error')

    // Kiểm tra trong DB thật không có lead nào được tạo cho email này
    const leads = await payload.find({
      collection: 'leads',
      where: { email: { equals: email } },
      overrideAccess: true,
    })
    expect(leads.docs.length).toBe(0)
  })

  it('T2-17: tạo lead lỗi trong transaction -> không còn kế hoạch thừa; gửi lại tạo đúng 1 kế hoạch', async () => {
    const email = `hoc-vien-test-${randomUUID().slice(0, 8)}@example.test`

    let failLeadCreation = true
    const originalCreate = payload.create.bind(payload)
    const createSpy = vi
      .spyOn(payload, 'create')
      .mockImplementation(async (args: Parameters<typeof payload.create>[0]) => {
        if (args.collection === 'leads' && failLeadCreation) {
          throw new Error('Simulated leads DB creation error (T2-17)')
        }
        return originalCreate(args)
      })

    const inputData = {
      scorecard: [{ habit: 'Tập thở sâu', rating: 'good' as const }],
      identityStatement: 'Tôi sẽ tập thở 5 phút mỗi sáng để sống an yên hơn',
      chosenTechniques: [
        {
          techniqueId: validCueTechId,
          stage: 'cue' as const,
          action: 'Ngồi thiền sau khi thức dậy',
        },
      ],
      email,
      name: 'Học viên Test 01',
      consent: true,
    }

    try {
      // Lần 1: Giả lập tạo lead lỗi -> ném lỗi và rollback transaction
      await expect(
        submitHabitPlan(
          inputData,
          { ip: `192.168.5.${Math.floor(Math.random() * 200) + 10}` },
          { payload, emailSender },
        ),
      ).rejects.toThrow('Simulated leads DB creation error (T2-17)')

      // Kiểm tra trong DB thật: 0 kế hoạch thừa nào của email này được lưu (đã rollback)
      const plansAfterFail = await payload.find({
        collection: 'habitPlans',
        where: { leadEmail: { equals: email } },
        overrideAccess: true,
      })
      expect(plansAfterFail.totalDocs).toBe(0)

      // Lần 2: Người dùng gửi lại (không còn lỗi) -> thành công, chỉ tạo đúng 1 kế hoạch
      failLeadCreation = false
      const successResult = await submitHabitPlan(
        inputData,
        { ip: `192.168.5.${Math.floor(Math.random() * 200) + 10}` },
        { payload, emailSender },
      )

      expect(successResult.success).toBe(true)
      expect(successResult.planId).toBeDefined()
      if (successResult.planId) createdPlans.push(successResult.planId)

      const plansAfterSuccess = await payload.find({
        collection: 'habitPlans',
        where: { leadEmail: { equals: email } },
        overrideAccess: true,
      })
      expect(plansAfterSuccess.totalDocs).toBe(1)
      expect(plansAfterSuccess.docs[0].id).toBe(successResult.planId)

      const leadsAfterSuccess = await payload.find({
        collection: 'leads',
        where: { email: { equals: email } },
        overrideAccess: true,
      })
      expect(leadsAfterSuccess.totalDocs).toBe(1)
      if (leadsAfterSuccess.docs[0]) createdLeads.push(leadsAfterSuccess.docs[0].id)
    } finally {
      createSpy.mockRestore()
    }
  })

  it('chống gửi trùng trong 10 phút: cùng email (không phân biệt hoa thường) + cùng câu định danh trả về kế hoạch cũ, khác câu định danh tạo kế hoạch mới (T2-17/T2-18)', async () => {
    const baseEmail = `dedup-${randomUUID().slice(0, 8)}@example.com`
    const identity1 = 'Tôi sẽ thiền định 10 phút để trở thành người an yên'
    const identity2 = 'Tôi sẽ đọc sách 15 phút để trở thành người hiểu biết'

    const emailSentCountBefore = emailSender.sent.length

    // 1. Gửi lần 1: email chữ thường
    const res1 = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Ngồi tĩnh lặng', rating: 'good' }],
        identityStatement: identity1,
        chosenTechniques: [
          { techniqueId: validCueTechId, stage: 'cue', action: 'Đặt chuông lúc 6h sáng' },
        ],
        name: 'Học viên Test Dedup',
        email: baseEmail,
        consent: true,
      },
      { ip: `192.168.10.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )

    expect(res1.success).toBe(true)
    expect(res1.planId).toBeDefined()
    if (res1.planId) createdPlans.push(res1.planId)
    expect(emailSender.sent.length).toBe(emailSentCountBefore + 1)

    // 2. Gửi lần 2: email CHỮ HOA + cùng câu định danh trong 10 phút
    const res2 = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Ngồi tĩnh lặng', rating: 'good' }],
        identityStatement: identity1,
        chosenTechniques: [
          { techniqueId: validCueTechId, stage: 'cue', action: 'Đặt chuông lúc 6h sáng' },
        ],
        name: 'Học viên Test Dedup HOA',
        email: baseEmail.toUpperCase(),
        consent: true,
      },
      { ip: `192.168.10.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )

    // Trả về kế hoạch đã có, cùng planId
    expect(res2.success).toBe(true)
    expect(res2.planId).toBe(res1.planId)

    // Kiểm tra trong DB: chỉ đúng 1 kế hoạch, 1 lead, 1 email gửi đi
    const plansAfterSecond = await payload.find({
      collection: 'habitPlans',
      where: { leadEmail: { equals: baseEmail } },
      overrideAccess: true,
    })
    expect(plansAfterSecond.totalDocs).toBe(1)

    const leadsAfterSecond = await payload.find({
      collection: 'leads',
      where: { email: { equals: baseEmail } },
      overrideAccess: true,
    })
    expect(leadsAfterSecond.totalDocs).toBe(1)
    if (leadsAfterSecond.docs[0]) createdLeads.push(leadsAfterSecond.docs[0].id)

    expect(emailSender.sent.length).toBe(emailSentCountBefore + 1) // Không gửi thêm email

    // 3. Gửi lần 3: cùng email nhưng KHÁC câu định danh
    const res3 = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Đọc sách', rating: 'good' }],
        identityStatement: identity2,
        chosenTechniques: [
          { techniqueId: validCueTechId, stage: 'cue', action: 'Đặt sách cạnh giường' },
        ],
        name: 'Học viên Test Dedup Khác Câu',
        email: baseEmail,
        consent: true,
      },
      { ip: `192.168.10.${Math.floor(Math.random() * 200) + 10}` },
      { payload, emailSender },
    )

    expect(res3.success).toBe(true)
    expect(res3.planId).toBeDefined()
    expect(res3.planId).not.toBe(res1.planId)
    if (res3.planId) createdPlans.push(res3.planId)

    // Kiểm tra trong DB: có 2 kế hoạch
    const plansAfterThird = await payload.find({
      collection: 'habitPlans',
      where: { leadEmail: { equals: baseEmail } },
      overrideAccess: true,
    })
    expect(plansAfterThird.totalDocs).toBe(2)

    // Email gửi đi thêm 1 cái
    expect(emailSender.sent.length).toBe(emailSentCountBefore + 2)

    const allLeads = await payload.find({
      collection: 'leads',
      where: { email: { equals: baseEmail } },
      overrideAccess: true,
    })
    for (const lead of allLeads.docs) {
      if (!createdLeads.includes(lead.id)) createdLeads.push(lead.id)
    }
  })

  it('2 lần gửi đồng thời cùng email + câu định danh -> chỉ 1 kế hoạch', async () => {
    const email = `hoc-vien-test-race-${Math.random().toString(36).slice(2, 8)}@example.test`
    const input = {
      scorecard: [{ habit: 'Đọc sách', rating: 'good' as const }],
      identityStatement: 'Tôi sẽ đọc sách để trở thành người học suốt đời',
      chosenTechniques: [
        { techniqueId: validCueTechId, stage: 'cue' as const, action: 'Đặt sách cạnh giường' },
      ],
      name: 'Học viên Test Race',
      email,
      consent: true,
    }
    const [a, b] = await Promise.all([
      submitHabitPlan(input, { ip: '192.168.20.11' }, { payload, emailSender }),
      submitHabitPlan(input, { ip: '192.168.20.12' }, { payload, emailSender }),
    ])
    expect(a.success && b.success).toBe(true)
    const plans = await payload.find({
      collection: 'habitPlans',
      where: { leadEmail: { equals: email } },
      overrideAccess: true,
    })
    for (const p of plans.docs) createdPlans.push(p.id)
    const leads = await payload.find({
      collection: 'leads',
      where: { email: { equals: email } },
      overrideAccess: true,
    })
    for (const l of leads.docs) createdLeads.push(l.id)
    expect(plans.totalDocs).toBe(1)
    expect(a.planId).toBe(b.planId)
  })
})
