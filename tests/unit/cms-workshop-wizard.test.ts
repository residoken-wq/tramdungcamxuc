// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

let mockHeadersValue: Headers = new Headers()
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => mockHeadersValue),
}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import {
  vietnamTimeToUtcIso,
  utcIsoToVietnamDateTime,
  formatVietnamDateTime,
  validateWorkshopWizardData,
  type WorkshopWizardInput,
} from '@/lib/cms/workshop-wizard-schema'
import {
  createWorkshopFromWizard,
  renderWorkshopEmailPreviewAction,
} from '@/lib/cms/workshop-wizard.server'

describe('Workshop Wizard (CM-06) Unit Tests', () => {
  describe('Timezone Math & 0h–7h Boundary (src/lib/cms/workshop-wizard-schema.ts)', () => {
    it('correctly converts normal daytime/evening ICT to UTC ISO', () => {
      // 20:00 in ICT (UTC+7) is 13:00 UTC of same day
      const utcIso = vietnamTimeToUtcIso('2026-10-25', '20:00')
      expect(utcIso).toBe('2026-10-25T13:00:00.000Z')
    })

    it('handles the crucial 0h–7h boundary (crosses midnight into previous day in UTC)', () => {
      // 02:00 in Vietnam on Oct 25 is 19:00 on Oct 24 in UTC
      const earlyMorning = vietnamTimeToUtcIso('2026-10-25', '02:00')
      expect(earlyMorning).toBe('2026-10-24T19:00:00.000Z')

      // Exactly 00:00 in Vietnam on Oct 25 is 17:00 on Oct 24 in UTC
      const midnight = vietnamTimeToUtcIso('2026-10-25', '00:00')
      expect(midnight).toBe('2026-10-24T17:00:00.000Z')

      // Exactly 07:00 in Vietnam on Oct 25 is 00:00 on Oct 25 in UTC
      const morning7 = vietnamTimeToUtcIso('2026-10-25', '07:00')
      expect(morning7).toBe('2026-10-25T00:00:00.000Z')
    })

    it('returns null on invalid date or time', () => {
      expect(vietnamTimeToUtcIso('', '20:00')).toBeNull()
      expect(vietnamTimeToUtcIso('2026-10-25', '')).toBeNull()
      expect(vietnamTimeToUtcIso('invalid-date', '20:00')).toBeNull()
      expect(vietnamTimeToUtcIso('2026-10-25', 'invalid-time')).toBeNull()
      expect(vietnamTimeToUtcIso(null, '20:00')).toBeNull()
    })

    it('converts UTC ISO back to Vietnam date and time correctly', () => {
      const conv = utcIsoToVietnamDateTime('2026-10-24T19:00:00.000Z')
      expect(conv).not.toBeNull()
      expect(conv?.date).toBe('2026-10-25')
      expect(conv?.time).toBe('02:00')
      expect(conv?.formatted).toContain('02:00 ngày 25/10/2026')
      expect(conv?.formatted).toContain('UTC+7')
    })

    it('formats display date time nicely', () => {
      const formatted = formatVietnamDateTime('2026-10-25', '20:00')
      expect(formatted).toBe('20:00 ngày 25/10/2026 (Giờ Việt Nam - ICT UTC+7)')
    })
  })

  describe('Workshop Wizard Validation Schema', () => {
    it('validates a complete workshop payload', () => {
      const input: WorkshopWizardInput = {
        audienceProductIds: [1, 2],
        title: 'Workshop Tập thương cảm xúc - Buổi 1',
        vnDate: '2026-10-25',
        vnTime: '20:00',
        joinUrl: 'https://meet.google.com/abc-defg-hij',
      }

      const res = validateWorkshopWizardData(input)
      expect(res.success).toBe(true)
      expect(res.data?.startsAtUtcIso).toBe('2026-10-25T13:00:00.000Z')
      expect(res.data?.audienceProductIds).toEqual([1, 2])
    })

    it('rejects empty audienceProductIds', () => {
      const input = {
        audienceProductIds: [],
        title: 'Workshop 1',
        vnDate: '2026-10-25',
        vnTime: '20:00',
        joinUrl: 'https://meet.google.com/abc-defg-hij',
      }
      const res = validateWorkshopWizardData(input)
      expect(res.success).toBe(false)
      expect(res.errors?.audienceProductIds).toBeDefined()
    })

    it('rejects empty title', () => {
      const input = {
        audienceProductIds: [1],
        title: '   ',
        vnDate: '2026-10-25',
        vnTime: '20:00',
        joinUrl: 'https://meet.google.com/abc-defg-hij',
      }
      const res = validateWorkshopWizardData(input)
      expect(res.success).toBe(false)
      expect(res.errors?.title).toBeDefined()
    })

    it('rejects invalid join URL', () => {
      const input = {
        audienceProductIds: [1],
        title: 'Workshop 1',
        vnDate: '2026-10-25',
        vnTime: '20:00',
        joinUrl: 'not-a-valid-url',
      }
      const res = validateWorkshopWizardData(input)
      expect(res.success).toBe(false)
      expect(res.errors?.joinUrl).toBeDefined()
    })
  })

  describe('Server Actions Integration (Auth & Enforcement)', () => {
    let payload: Payload
    let ownerToken: string
    const cleanupDocs: { collection: CollectionSlug; id: string | number }[] = []

    beforeAll(async () => {
      const payloadConfig = await config
      payload = await getPayload({ config: payloadConfig })

      await payload.db.migrate({
        migrations: migrations.map((migration) => ({
          name: migration.name,
          up: (args: unknown) => migration.up(args as MigrateUpArgs),
          down: (args: unknown) => migration.down(args as MigrateDownArgs),
        })),
      })

      // Create owner user
      const ownerEmail = `test-workshop-wizard-owner-${randomUUID()}@tdcx.test`
      const owner = await payload.create({
        collection: 'users',
        data: {
          email: ownerEmail,
          password: 'Password123!',
          role: 'owner',
        },
      })
      cleanupDocs.push({ collection: 'users', id: owner.id })

      const ownerLogin = await payload.login({
        collection: 'users',
        data: { email: ownerEmail, password: 'Password123!' },
      })
      ownerToken = ownerLogin.token!
    })

    afterAll(async () => {
      for (const item of cleanupDocs.reverse()) {
        try {
          await payload.delete({
            collection: item.collection,
            id: item.id,
            overrideAccess: true,
          })
        } catch {
          // ignore cleanup errors
        }
      }
    })

    it('email preview: refuses callers without an admin session', async () => {
      mockHeadersValue = new Headers()
      const res = await renderWorkshopEmailPreviewAction({
        title: 'Không đăng nhập',
        vnDate: '2026-10-25',
        vnTime: '20:00',
      })
      expect(res.success).toBe(false)
      expect(res.html).toBeUndefined()
    })

    it('email preview: renders WorkshopReminderEmail HTML for an admin without sending email', async () => {
      mockHeadersValue = new Headers()
      mockHeadersValue.set('Authorization', `JWT ${ownerToken}`)
      const res = await renderWorkshopEmailPreviewAction({
        title: 'Workshop Thử Nghiệm Xem Trước',
        vnDate: '2026-10-25',
        vnTime: '20:00',
        joinUrl: 'https://meet.google.com/test-meet',
      })

      expect(res.success).toBe(true)
      expect(res.html).toContain('Workshop Thử Nghiệm Xem Trước')
      expect(res.html).toContain('20:00 ngày 25/10/2026')
    })

    it('rejects unauthorized user from scheduling a workshop', async () => {
      // No auth header provided
      mockHeadersValue = new Headers()

      const res = await createWorkshopFromWizard({
        audienceProductIds: [1],
        title: 'Workshop không hợp lệ',
        vnDate: '2026-10-25',
        vnTime: '20:00',
        joinUrl: 'https://meet.google.com/xyz',
      })
      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })

    it('allows owner to schedule workshop and strictly enforces isSample: false', async () => {
      mockHeadersValue = new Headers()
      mockHeadersValue.set('Authorization', `JWT ${ownerToken}`)

      // Create dummy package product for audience
      const product = await payload.create({
        collection: 'products',
        data: {
          name: 'Gói CLEAR Test',
          slug: `goi-clear-test-${randomUUID().slice(0, 8)}`,
          type: 'package',
          web: 'site',
          price: 1750000,
          isSample: false,
        },
        draft: true,
      })
      cleanupDocs.push({ collection: 'products', id: product.id })

      const res = await createWorkshopFromWizard({
        audienceProductIds: [product.id],
        title: 'Workshop Tập thương cảm xúc - Kỳ 1',
        vnDate: '2026-10-25',
        vnTime: '02:00', // early morning boundary test
        joinUrl: 'https://meet.google.com/abc-test-meet',
      })

      expect(res.success).toBe(true)
      expect(res.docId).toBeDefined()
      if (res.docId) {
        cleanupDocs.push({ collection: 'workshops', id: res.docId })

        const workshopInDb = await payload.findByID({
          collection: 'workshops',
          id: res.docId,
          draft: true,
        })

        expect(workshopInDb).toBeDefined()
        expect(workshopInDb.isSample).toBe(false)
        expect(workshopInDb.title).toBe('Workshop Tập thương cảm xúc - Kỳ 1')
        // Starts at 02:00 on Oct 25 ICT -> 19:00 on Oct 24 UTC
        expect(new Date(workshopInDb.startsAt!).toISOString()).toBe('2026-10-24T19:00:00.000Z')
        expect(workshopInDb.joinUrl).toBe('https://meet.google.com/abc-test-meet')
      }
    })
  })
})
