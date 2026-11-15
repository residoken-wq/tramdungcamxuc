import React from 'react'
import { describe, it, expect, vi as vitest } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactForms } from '@/components/site/ContactForms'
import { ContactFormsBlock } from '@/puck/blocks/ContactForms'
import { coachingFormSchema } from '@/lib/forms/schemas'
import { submitRegistrationLead } from '@/lib/forms/submit.server'
import { vi } from '@/lib/i18n/vi'
import type { Payload } from 'payload'

vitest.mock('server-only', () => ({}))
vitest.mock('@/lib/email/service.server', () => ({
  notifyAdmin: vitest.fn().mockResolvedValue(undefined),
  sendLeadEmails: vitest.fn().mockResolvedValue(undefined),
}))
vitest.mock('@/lib/forms/turnstile.server', () => ({
  verifyTurnstile: vitest.fn().mockResolvedValue({ success: true }),
}))
vitest.mock('@/lib/forms/ratelimit.server', () => ({
  checkAndRecordRateLimit: vitest.fn().mockResolvedValue(undefined),
}))

describe('BX-02: Contact Form Fields Toggle & Brochure Mode', () => {
  const mockResolved = {
    services: [{ id: 1, name: 'Coaching 1:1 Vững vàng' }],
    leadStatusOptions: [{ label: 'Đang bế tắc' }],
  }

  describe('1. Default Rendering & Snapshots', () => {
    it('renders all default fields in consult mode', () => {
      const { container } = render(
        <ContactForms layout="personal" _resolved={mockResolved} isDemo={true} />,
      )

      // Name, Email, Phone, Pathway, Status, Message are present
      expect(container.querySelector('input[type="text"][placeholder*="Họ và tên"]')).not.toBeNull()
      expect(container.querySelector('input[type="email"]')).not.toBeNull()
      expect(container.querySelector('input[type="tel"]')).not.toBeNull()
      expect(container.querySelector('select[id$="-b2c-service"]')).not.toBeNull()
      expect(container.querySelector('select[id$="-b2c-status"]')).not.toBeNull()
      expect(container.querySelector('textarea[id$="-b2c-message"]')).not.toBeNull()

      // Phone is optional by default
      const phoneLabel = container.querySelector('label[for$="-b2c-phone"]')
      expect(phoneLabel?.textContent).toContain('Số điện thoại (tùy chọn)')
      expect(phoneLabel?.textContent).not.toContain('*')
    })
  })

  describe('2. Toggle Fields (Hide Individual Fields)', () => {
    it('hides pathway select when b2cShowPathway is false', () => {
      const { container } = render(
        <ContactForms
          layout="personal"
          b2cShowPathway={false}
          _resolved={mockResolved}
          isDemo={true}
        />,
      )

      expect(container.querySelector('select[id$="-b2c-service"]')).toBeNull()
      // Status is still rendered
      expect(container.querySelector('select[id$="-b2c-status"]')).not.toBeNull()
    })

    it('hides status select when b2cShowStatus is false', () => {
      const { container } = render(
        <ContactForms
          layout="personal"
          b2cShowStatus={false}
          _resolved={mockResolved}
          isDemo={true}
        />,
      )

      expect(container.querySelector('select[id$="-b2c-status"]')).toBeNull()
      // Pathway is still rendered
      expect(container.querySelector('select[id$="-b2c-service"]')).not.toBeNull()
    })

    it('hides message textarea when b2cShowMessage is false', () => {
      const { container } = render(
        <ContactForms
          layout="personal"
          b2cShowMessage={false}
          _resolved={mockResolved}
          isDemo={true}
        />,
      )

      expect(container.querySelector('textarea[id$="-b2c-message"]')).toBeNull()
    })

    it('requires phone when b2cPhoneRequired is true', () => {
      const { container } = render(
        <ContactForms
          layout="personal"
          b2cPhoneRequired={true}
          _resolved={mockResolved}
          isDemo={true}
        />,
      )

      const phoneLabel = container.querySelector('label[for$="-b2c-phone"]')
      expect(phoneLabel?.textContent).toContain('*')
      const phoneInput = container.querySelector('input[id$="-b2c-phone"]')
      expect(phoneInput?.hasAttribute('required')).toBe(true)
    })

    it('in brochure mode: automatically hides pathway, status, and message', () => {
      const { container } = render(
        <ContactForms
          layout="personal"
          b2cPurpose="brochure"
          _resolved={mockResolved}
          isDemo={true}
        />,
      )

      // Pathway, Status, Message hidden
      expect(container.querySelector('select[id$="-b2c-service"]')).toBeNull()
      expect(container.querySelector('select[id$="-b2c-status"]')).toBeNull()
      expect(container.querySelector('textarea[id$="-b2c-message"]')).toBeNull()

      // Phone is required with *
      const phoneLabel = container.querySelector('label[for$="-b2c-phone"]')
      expect(phoneLabel?.textContent).toContain('*')
      expect(container.querySelector('input[id$="-b2c-phone"]')?.hasAttribute('required')).toBe(true)

      // Default submit label for brochure
      const submitBtn = container.querySelector('button[type="submit"]')
      expect(submitBtn?.textContent).toContain('Đăng ký nhận brochure')
    })

    it('in brochure mode: hides name when b2cShowName is false', () => {
      const { container } = render(
        <ContactForms
          layout="personal"
          b2cPurpose="brochure"
          b2cShowName={false}
          _resolved={mockResolved}
          isDemo={true}
        />,
      )

      expect(container.querySelector('input[placeholder*="Họ và tên"]')).toBeNull()
      expect(container.querySelector('input[type="email"]')).not.toBeNull()
      expect(container.querySelector('input[type="tel"]')).not.toBeNull()
    })
  })

  describe('3. resolveFields (Puck Builder Field Visibility)', () => {
    const allFields = { ...ContactFormsBlock.fields }
    const baseParams = {
      fields: allFields,
      lastFields: allFields,
      lastData: null,
      changed: {},
      metadata: {},
      appState: {} as any,
      parent: null,
    }

    it('hides B2C fields when layout is business', () => {
      const resolved = (ContactFormsBlock as any).resolveFields(
        { props: { layout: 'business' } },
        baseParams,
      )

      expect(resolved).toBeDefined()
      expect(resolved.b2cPurpose).toBeUndefined()
      expect(resolved.b2cShowPathway).toBeUndefined()
      expect(resolved.b2cShowStatus).toBeUndefined()
      expect(resolved.b2cShowMessage).toBeUndefined()
      expect(resolved.b2cPhoneRequired).toBeUndefined()
      expect(resolved.b2cShowName).toBeUndefined()
      expect(resolved.titleB2C).toBeUndefined()

      // B2B fields are retained
      expect(resolved.titleB2B).toBeDefined()
      expect(resolved.descriptionB2B).toBeDefined()
    })

    it('hides B2B fields when layout is personal', () => {
      const resolved = (ContactFormsBlock as any).resolveFields(
        { props: { layout: 'personal', b2cPurpose: 'consult' } },
        baseParams,
      )

      expect(resolved).toBeDefined()
      expect(resolved.titleB2B).toBeUndefined()
      expect(resolved.descriptionB2B).toBeUndefined()
      expect(resolved.submitLabelB2B).toBeUndefined()

      // B2C fields are present
      expect(resolved.b2cPurpose).toBeDefined()
      expect(resolved.b2cShowPathway).toBeDefined()
      expect(resolved.b2cShowStatus).toBeDefined()
      expect(resolved.b2cShowMessage).toBeDefined()
      expect(resolved.b2cPhoneRequired).toBeDefined()
      // b2cShowName is hidden in consult mode
      expect(resolved.b2cShowName).toBeUndefined()
    })

    it('in brochure mode: hides pathway, status, message, phoneRequired and shows b2cShowName', () => {
      const resolved = (ContactFormsBlock as any).resolveFields(
        { props: { layout: 'personal', b2cPurpose: 'brochure' } },
        baseParams,
      )

      expect(resolved).toBeDefined()
      expect(resolved.b2cShowPathway).toBeUndefined()
      expect(resolved.b2cShowStatus).toBeUndefined()
      expect(resolved.b2cShowMessage).toBeUndefined()
      expect(resolved.b2cPhoneRequired).toBeUndefined()
      expect(resolved.b2cShowName).toBeDefined()
    })
  })

  describe('4. Zod Validation (coachingFormSchema)', () => {
    it('accepts empty message string', () => {
      const res = coachingFormSchema.safeParse({
        name: 'Học viên Test',
        email: 'test@example.com',
        message: '',
        consent: true,
      })

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.message).toBeUndefined()
      }
    })

    it('accepts omitted message', () => {
      const res = coachingFormSchema.safeParse({
        name: 'Học viên Test',
        email: 'test@example.com',
        consent: true,
      })

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.message).toBeUndefined()
      }
    })

    it('rejects message exceeding 2000 characters', () => {
      const res = coachingFormSchema.safeParse({
        name: 'Học viên Test',
        email: 'test@example.com',
        message: 'A'.repeat(2001),
        consent: true,
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const msgErr = res.error.issues.find((i) => i.path.includes('message'))
        expect(msgErr?.message).toBe(vi.forms.validation.messageMax)
      }
    })

    it('requires phone when phoneRequired flag is true', () => {
      const resMissing = coachingFormSchema.safeParse({
        name: 'Học viên Test',
        email: 'test@example.com',
        phoneRequired: true,
        phone: '',
        consent: true,
      })

      expect(resMissing.success).toBe(false)
      if (!resMissing.success) {
        const phoneErr = resMissing.error.issues.find((i) => i.path.includes('phone'))
        expect(phoneErr?.message).toBe(vi.forms.validation.phoneRequired)
      }

      const resInvalid = coachingFormSchema.safeParse({
        name: 'Học viên Test',
        email: 'test@example.com',
        phoneRequired: true,
        phone: '12345',
        consent: true,
      })

      expect(resInvalid.success).toBe(false)
      if (!resInvalid.success) {
        const phoneErr = resInvalid.error.issues.find((i) => i.path.includes('phone'))
        expect(phoneErr?.message).toBe(vi.forms.validation.phoneInvalid)
      }

      const resValid = coachingFormSchema.safeParse({
        name: 'Học viên Test',
        email: 'test@example.com',
        phoneRequired: true,
        phone: '0912345678',
        consent: true,
      })

      expect(resValid.success).toBe(true)
    })

    it('does not require phone when phoneRequired flag is false or omitted', () => {
      const res = coachingFormSchema.safeParse({
        name: 'Học viên Test',
        email: 'test@example.com',
        phoneRequired: false,
        phone: '',
        consent: true,
      })

      expect(res.success).toBe(true)
    })
  })

  describe('5. Brochure Mode Submission Creates Lead', () => {
    it('creates lead with source.form = brochure-chuyen-minh and correct interest tags', async () => {
      const mockCreate = vitest.fn().mockResolvedValue({ id: 999 })
      const mockPayload = {
        create: mockCreate,
        findGlobal: vitest.fn().mockResolvedValue({ email: 'hana@tramdungcamxuc.com' }),
      } as unknown as Payload

      const res = await submitRegistrationLead(
        {
          name: 'Học viên Brochure',
          email: 'brochure@example.com',
          phone: '0987654321',
          formType: 'brochure-chuyen-minh',
          consent: true,
          page: '/chuyen-minh',
        },
        { page: '/chuyen-minh' },
        { payload: mockPayload },
      )

      expect(res.success).toBe(true)
      expect(mockCreate).toHaveBeenCalledTimes(1)
      const callData = mockCreate.mock.calls[0][0]
      expect(callData.collection).toBe('leads')
      expect(callData.data.source.form).toBe('brochure-chuyen-minh')
      expect(callData.data.need).toBe('personal')
      expect(callData.data.name).toBe('Học viên Brochure')
      expect(callData.data.email).toBe('brochure@example.com')
      expect(callData.data.phone).toBe('0987654321')
      expect(callData.data.interestTags).toEqual([
        { text: 'coaching' },
        { text: 'brochure' },
        { text: 'chuyen-minh' },
      ])
    })

    it('creates lead without name when name is omitted (b2cShowName = false)', async () => {
      const mockCreate = vitest.fn().mockResolvedValue({ id: 1000 })
      const mockPayload = {
        create: mockCreate,
        findGlobal: vitest.fn().mockResolvedValue({ email: 'hana@tramdungcamxuc.com' }),
      } as unknown as Payload

      const res = await submitRegistrationLead(
        {
          email: 'noname@example.com',
          phone: '0987654321',
          formType: 'brochure-chuyen-minh',
          consent: true,
        },
        {},
        { payload: mockPayload },
      )

      expect(res.success).toBe(true)
      expect(mockCreate).toHaveBeenCalledTimes(1)
      const callData = mockCreate.mock.calls[0][0]
      expect(callData.data.name).toBeUndefined()
      expect(callData.data.email).toBe('noname@example.com')
      expect(callData.data.source.form).toBe('brochure-chuyen-minh')
    })
  })
})
