// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { submitB2BBrief, submitCoachingForm } from '../../src/lib/forms/submit.server'
import type { EmailSender, SendEmailParams, SendEmailResult } from '../../src/lib/email/types'

class MockEmailSender implements EmailSender {
  public sent: SendEmailParams[] = []

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sent.push(params)
    return { success: true, id: `mock-${randomUUID()}` }
  }
}

const randomIp = () =>
  `10.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`

describe('SM-06: Forms Enhancements (Coaching B2C & Corporate B2B)', () => {
  let payload: Payload
  const createdLeads: number[] = []
  const createdServices: number[] = []
  const createdPrograms: number[] = []
  const createdHits: number[] = []

  beforeAll(async () => {
    payload = await getPayload({ config })

    // Set up siteSettings with leadStatusOptions and contact email
    await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        email: 'hana@tramdungcamxuc.com',
        leadStatusOptions: [
          { id: 'status-1', label: '[MẪU] Tình trạng 01 - Căng thẳng' },
          { id: 'status-2', label: '[MẪU] Tình trạng 02 - Quá tải' },
        ],
      },
    })
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const id of createdLeads) {
        await payload.delete({ collection: 'leads', id, overrideAccess: true })
      }
      for (const id of createdServices) {
        await payload.delete({ collection: 'services', id, overrideAccess: true })
      }
      for (const id of createdPrograms) {
        await payload.delete({ collection: 'programs', id, overrideAccess: true })
      }
      for (const id of createdHits) {
        await payload.delete({ collection: 'rateLimitHits', id, overrideAccess: true })
      }
    } catch {
      // Ignore cleanup errors
    } finally {
      await payload.destroy()
    }
  }, 30000)

  describe('submitCoachingForm (B2C)', () => {
    it('saves valid currentStatus matching leadStatusOptions', async () => {
      const sender = new MockEmailSender()
      const email = `b2c-status-${randomUUID()}@example.com`

      const res = await submitCoachingForm(
        {
          name: '[MẪU] Học viên Test 01',
          email,
          currentStatus: '[MẪU] Tình trạng 01 - Căng thẳng',
          message: 'Em đang gặp áp lực công việc muốn được lắng nghe.',
          consent: true,
        },
        { ip: randomIp(), form: 'contact-b2c', page: 'lien-he' },
        { payload, emailSender: sender },
      )

      expect(res.success).toBe(true)
      if (typeof res.id === 'number') createdLeads.push(res.id)

      const lead = await payload.findByID({
        collection: 'leads',
        id: res.id as number,
        depth: 0,
        overrideAccess: true,
      })

      expect(lead.currentStatus).toBe('[MẪU] Tình trạng 01 - Căng thẳng')
      expect(lead.source?.form).toBe('contact-b2c')
      expect(lead.source?.page).toBe('lien-he')

      // Admin email contains currentStatus
      const adminEmail = sender.sent.find((e) => e.to === 'hana@tramdungcamxuc.com')
      expect(adminEmail).toBeDefined()
      expect(adminEmail?.html).toContain('[MẪU] Tình trạng 01 - Căng thẳng')
    })

    it('omits currentStatus when not present in leadStatusOptions without failing lead creation', async () => {
      const sender = new MockEmailSender()
      const email = `b2c-invalid-status-${randomUUID()}@example.com`

      const res = await submitCoachingForm(
        {
          name: '[MẪU] Học viên Test 02',
          email,
          currentStatus: 'Tình trạng bịa đặt không có trong CMS',
          message: 'Tin nhắn hợp lệ.',
          consent: true,
        },
        { ip: randomIp() },
        { payload, emailSender: sender },
      )

      expect(res.success).toBe(true)
      if (typeof res.id === 'number') createdLeads.push(res.id)

      const lead = await payload.findByID({
        collection: 'leads',
        id: res.id as number,
        depth: 0,
        overrideAccess: true,
      })

      expect(lead.currentStatus).toBeFalsy()
    })

    it('associates published service, but discards draft, hidden or nonexistent services', async () => {
      const sender = new MockEmailSender()

      // 1. Published and on_sale service
      const pubService = await payload.create({
        collection: 'services',
        data: {
          name: '[MẪU] Khai vấn Xuất bản 1:1',
          slug: `service-pub-${randomUUID()}`,
          saleStatus: 'on_sale',
          _status: 'published',
        },
        overrideAccess: true,
      })
      createdServices.push(pubService.id)

      // 2. Draft service
      const draftService = await payload.create({
        collection: 'services',
        data: {
          name: '[MẪU] Dịch vụ Bản nháp',
          slug: `service-draft-${randomUUID()}`,
          saleStatus: 'on_sale',
          _status: 'draft',
        },
        overrideAccess: true,
      })
      createdServices.push(draftService.id)

      // 3. Hidden service
      const hiddenService = await payload.create({
        collection: 'services',
        data: {
          name: '[MẪU] Dịch vụ Ẩn',
          slug: `service-hidden-${randomUUID()}`,
          saleStatus: 'hidden',
          _status: 'published',
        },
        overrideAccess: true,
      })
      createdServices.push(hiddenService.id)

      // Submit with published service -> saved
      const resPub = await submitCoachingForm(
        {
          name: '[MẪU] Học viên Pub',
          email: `pub-${randomUUID()}@example.com`,
          service: pubService.id,
          message: 'Quan tâm dịch vụ xuất bản.',
          consent: true,
        },
        { ip: randomIp() },
        { payload, emailSender: sender },
      )
      expect(resPub.success).toBe(true)
      if (typeof resPub.id === 'number') createdLeads.push(resPub.id)
      const leadPub = await payload.findByID({
        collection: 'leads',
        id: resPub.id as number,
        depth: 0,
        overrideAccess: true,
      })
      expect(leadPub.service).toBe(pubService.id)

      // Submit with draft service -> discarded, lead still created
      const resDraft = await submitCoachingForm(
        {
          name: '[MẪU] Học viên Draft',
          email: `draft-${randomUUID()}@example.com`,
          service: draftService.id,
          message: 'Quan tâm dịch vụ nháp.',
          consent: true,
        },
        { ip: randomIp() },
        { payload, emailSender: sender },
      )
      expect(resDraft.success).toBe(true)
      if (typeof resDraft.id === 'number') createdLeads.push(resDraft.id)
      const leadDraft = await payload.findByID({
        collection: 'leads',
        id: resDraft.id as number,
        depth: 0,
        overrideAccess: true,
      })
      expect(leadDraft.service).toBeFalsy()

      // Submit with hidden service -> discarded, lead still created
      const resHidden = await submitCoachingForm(
        {
          name: '[MẪU] Học viên Hidden',
          email: `hidden-${randomUUID()}@example.com`,
          service: hiddenService.id,
          message: 'Quan tâm dịch vụ ẩn.',
          consent: true,
        },
        { ip: randomIp() },
        { payload, emailSender: sender },
      )
      expect(resHidden.success).toBe(true)
      if (typeof resHidden.id === 'number') createdLeads.push(resHidden.id)
      const leadHidden = await payload.findByID({
        collection: 'leads',
        id: resHidden.id as number,
        depth: 0,
        overrideAccess: true,
      })
      expect(leadHidden.service).toBeFalsy()

      // Submit with nonexistent service ID -> discarded, lead still created
      const resNonexistent = await submitCoachingForm(
        {
          name: '[MẪU] Học viên Nonexistent',
          email: `nonexistent-${randomUUID()}@example.com`,
          service: 999999,
          message: 'Quan tâm dịch vụ không tồn tại.',
          consent: true,
        },
        { ip: randomIp() },
        { payload, emailSender: sender },
      )
      expect(resNonexistent.success).toBe(true)
      if (typeof resNonexistent.id === 'number') createdLeads.push(resNonexistent.id)
      const leadNonexistent = await payload.findByID({
        collection: 'leads',
        id: resNonexistent.id as number,
        depth: 0,
        overrideAccess: true,
      })
      expect(leadNonexistent.service).toBeFalsy()
    })
  })

  describe('submitB2BBrief (B2B)', () => {
    it('saves contactRole and published interestedProgram', async () => {
      const sender = new MockEmailSender()

      const program = await payload.create({
        collection: 'programs',
        data: {
          name: '[MẪU] Chương trình Đào tạo Lãnh đạo Cảm xúc',
          slug: `prog-pub-${randomUUID()}`,
          saleStatus: 'on_sale',
          _status: 'published',
        },
        overrideAccess: true,
      })
      createdPrograms.push(program.id)

      const email = `b2b-brief-${randomUUID()}@example.com`
      const res = await submitB2BBrief(
        {
          name: '[MẪU] Đại diện Doanh nghiệp',
          email,
          company: '[MẪU] Công ty Test Corp',
          contactRole: 'Head of People & Culture',
          interestedProgram: program.id,
          teamSize: '50-100',
          targetBehaviors: 'Giao tiếp thấu cảm và giải tỏa áp lực công việc',
          timeline: 'Tháng 11/2026',
          consent: true,
        },
        { ip: randomIp(), form: 'contact-b2b', page: 'lien-he' },
        { payload, emailSender: sender },
      )

      expect(res.success).toBe(true)
      if (typeof res.id === 'number') createdLeads.push(res.id)

      const lead = await payload.findByID({
        collection: 'leads',
        id: res.id as number,
        depth: 0,
        overrideAccess: true,
      })

      expect(lead.need).toBe('business')
      expect(lead.brief?.contactRole).toBe('Head of People & Culture')
      expect(lead.interestedProgram).toBe(program.id)
      expect(lead.source?.form).toBe('contact-b2b')
      expect(lead.source?.page).toBe('lien-he')

      // Admin email contains contactRole and interestedProgram name
      const adminEmail = sender.sent.find((e) => e.to === 'hana@tramdungcamxuc.com')
      expect(adminEmail).toBeDefined()
      expect(adminEmail?.html).toContain('Head of People')
      expect(adminEmail?.html).toContain('[MẪU] Chương trình Đào tạo Lãnh đạo Cảm xúc')
    })

    it('discards draft program but creates lead successfully', async () => {
      const sender = new MockEmailSender()

      const draftProgram = await payload.create({
        collection: 'programs',
        data: {
          name: '[MẪU] Chương trình Nháp',
          slug: `prog-draft-${randomUUID()}`,
          saleStatus: 'on_sale',
          _status: 'draft',
        },
        overrideAccess: true,
      })
      createdPrograms.push(draftProgram.id)

      const email = `b2b-draft-prog-${randomUUID()}@example.com`
      const res = await submitB2BBrief(
        {
          name: '[MẪU] Đại diện 02',
          email,
          company: '[MẪU] Công ty Beta',
          interestedProgram: draftProgram.id,
          consent: true,
        },
        { ip: randomIp() },
        { payload, emailSender: sender },
      )

      expect(res.success).toBe(true)
      if (typeof res.id === 'number') createdLeads.push(res.id)

      const lead = await payload.findByID({
        collection: 'leads',
        id: res.id as number,
        depth: 0,
        overrideAccess: true,
      })

      expect(lead.interestedProgram).toBeFalsy()
    })

    it('handles legacy submission without contactRole or interestedProgram identically', async () => {
      const sender = new MockEmailSender()
      const email = `b2b-legacy-${randomUUID()}@example.com`

      const res = await submitB2BBrief(
        {
          name: '[MẪU] Đại diện Legacy',
          email,
          company: '[MẪU] Công ty Cổ phần Alpha',
          consent: true,
        },
        { ip: randomIp() },
        { payload, emailSender: sender },
      )

      expect(res.success).toBe(true)
      if (typeof res.id === 'number') createdLeads.push(res.id)

      const lead = await payload.findByID({
        collection: 'leads',
        id: res.id as number,
        depth: 0,
        overrideAccess: true,
      })

      expect(lead.brief?.company).toBe('[MẪU] Công ty Cổ phần Alpha')
      expect(lead.brief?.contactRole).toBeFalsy()
      expect(lead.interestedProgram).toBeFalsy()
      expect(lead.source?.form).toBe('b2b')
    })
  })
})
