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
  parseDurationToSeconds,
  formatSecondsToMmSs,
  validateLessonWizardData,
  type LessonWizardInput,
} from '@/lib/cms/lesson-wizard-schema'
import {
  createLessonFromWizard,
  createCourseModuleQuickAction,
  getNextLessonOrderByModule,
} from '@/lib/cms/lesson-wizard.server'
import { BUNNY_VIDEO_ID_REGEX } from '@/lib/video/bunny'

describe('Lesson Wizard (CM-06) Unit Tests', () => {
  describe('Duration Parsing & Formatting (src/lib/cms/lesson-wizard-schema.ts)', () => {
    it('parses mm:ss format correctly', () => {
      expect(parseDurationToSeconds('05:30')).toBe(330)
      expect(parseDurationToSeconds('1:05')).toBe(65)
      expect(parseDurationToSeconds('00:45')).toBe(45)
      expect(parseDurationToSeconds('59:59')).toBe(3599)
    })

    it('parses h:mm:ss format correctly', () => {
      expect(parseDurationToSeconds('1:00:00')).toBe(3600)
      expect(parseDurationToSeconds('1:05:30')).toBe(3930)
    })

    it('parses raw integer seconds', () => {
      expect(parseDurationToSeconds('750')).toBe(750)
      expect(parseDurationToSeconds('0')).toBe(0)
      expect(parseDurationToSeconds(420)).toBe(420)
    })

    it('returns null on invalid duration inputs', () => {
      expect(parseDurationToSeconds('')).toBeNull()
      expect(parseDurationToSeconds('   ')).toBeNull()
      expect(parseDurationToSeconds('invalid')).toBeNull()
      expect(parseDurationToSeconds('12:60')).toBeNull() // seconds >= 60 invalid
      expect(parseDurationToSeconds('12:75')).toBeNull()
      expect(parseDurationToSeconds('-100')).toBeNull()
      expect(parseDurationToSeconds(null)).toBeNull()
      expect(parseDurationToSeconds(undefined)).toBeNull()
    })

    it('formats seconds to mm:ss correctly', () => {
      expect(formatSecondsToMmSs(330)).toBe('05:30')
      expect(formatSecondsToMmSs(65)).toBe('01:05')
      expect(formatSecondsToMmSs(0)).toBe('00:00')
      expect(formatSecondsToMmSs(null)).toBe('')
      expect(formatSecondsToMmSs(-1)).toBe('')
    })
  })

  describe('Bunny Video GUID Regex', () => {
    it('accepts valid 36-character lowercase UUIDs', () => {
      const validGuid = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
      expect(BUNNY_VIDEO_ID_REGEX.test(validGuid)).toBe(true)
    })

    it('rejects malformed strings', () => {
      expect(BUNNY_VIDEO_ID_REGEX.test('not-a-guid')).toBe(false)
      expect(BUNNY_VIDEO_ID_REGEX.test('12345')).toBe(false)
      expect(BUNNY_VIDEO_ID_REGEX.test('https://iframe.mediadelivery.net/play/123')).toBe(false)
      expect(BUNNY_VIDEO_ID_REGEX.test('A1B2C3D4-E5F6-7A8B-9C0D-1E2F3A4B5C6D')).toBe(false) // must be lowercase
    })
  })

  describe('Lesson Wizard Validation Schema', () => {
    it('validates a valid lesson draft', () => {
      const input: LessonWizardInput = {
        moduleId: '123',
        title: 'Bài 1: Nhận diện kích hoạt cảm xúc',
        summary: 'Tổng quan bài học nhận diện',
        stage: 'cue',
        order: 1,
        videoId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        durationInput: '08:45',
        isFreePreview: true,
      }

      const res = validateLessonWizardData(input, { publish: false })
      expect(res.success).toBe(true)
      expect(res.data?.durationSec).toBe(525)
      expect(res.data?.stage).toBe('cue')
      expect(res.data?.isFreePreview).toBe(true)
    })

    it('rejects payload missing moduleId', () => {
      const input = {
        moduleId: '',
        title: 'Bài học',
      }
      const res = validateLessonWizardData(input)
      expect(res.success).toBe(false)
      expect(res.errors?.moduleId).toBeDefined()
    })

    it('rejects payload missing title', () => {
      const input = {
        moduleId: '123',
        title: '   ',
      }
      const res = validateLessonWizardData(input)
      expect(res.success).toBe(false)
      expect(res.errors?.title).toBeDefined()
    })

    it('rejects title longer than 200 characters', () => {
      const input = {
        moduleId: '123',
        title: 'A'.repeat(201),
      }
      const res = validateLessonWizardData(input)
      expect(res.success).toBe(false)
      expect(res.errors?.title).toBeDefined()
    })

    it('rejects invalid video GUID', () => {
      const input: LessonWizardInput = {
        moduleId: '123',
        title: 'Bài 1',
        videoId: 'invalid-guid',
      }
      const res = validateLessonWizardData(input)
      expect(res.success).toBe(false)
      expect(res.errors?.videoId).toBeDefined()
    })

    it('rejects invalid duration input', () => {
      const input: LessonWizardInput = {
        moduleId: '123',
        title: 'Bài 1',
        durationInput: '12:88',
      }
      const res = validateLessonWizardData(input)
      expect(res.success).toBe(false)
      expect(res.errors?.durationInput).toBeDefined()
    })
  })

  describe('Server Actions Integration (Auth & Enforcement)', () => {
    let payload: Payload
    let ownerToken: string
    let customerToken: string
    const cleanupDocs: { collection: CollectionSlug; id: string | number }[] = []

    beforeAll(async () => {
      const payloadConfig = await config
      payload = await getPayload({ config: payloadConfig })

      const migrationContext = { payload } as unknown as MigrateUpArgs & MigrateDownArgs
      for (const migration of migrations) {
        await migration.up(migrationContext)
      }

      // Create owner user
      const ownerEmail = `test-lesson-wizard-owner-${randomUUID()}@tdcx.test`
      const owner = await payload.create({
        collection: 'users',
        data: {
          email: ownerEmail,
          password: 'Password123!',
          name: 'Owner Tester',
          role: 'owner',
        },
      })
      cleanupDocs.push({ collection: 'users', id: owner.id })

      const ownerLogin = await payload.login({
        collection: 'users',
        data: { email: ownerEmail, password: 'Password123!' },
      })
      ownerToken = ownerLogin.token!

      // Create customer user (not admin)
      const customerEmail = `test-lesson-wizard-cust-${randomUUID()}@tdcx.test`
      const customer = await payload.create({
        collection: 'users',
        data: {
          email: customerEmail,
          password: 'Password123!',
          name: 'Customer Tester',
          role: 'customer',
        },
      })
      cleanupDocs.push({ collection: 'users', id: customer.id })

      const customerLogin = await payload.login({
        collection: 'users',
        data: { email: customerEmail, password: 'Password123!' },
      })
      customerToken = customerLogin.token!
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

    it('rejects unauthorized user from creating a module or lesson', async () => {
      mockHeadersValue = new Headers()
      mockHeadersValue.set('Authorization', `JWT ${customerToken}`)

      const moduleRes = await createCourseModuleQuickAction({
        title: 'Nhóm test trái phép',
      })
      expect(moduleRes.success).toBe(false)
      expect(moduleRes.error).toBeDefined()

      const lessonRes = await createLessonFromWizard({
        moduleId: '123',
        title: 'Bài test trái phép',
      })
      expect(lessonRes.success).toBe(false)
      expect(lessonRes.error).toBeDefined()
    })

    it('allows owner to quick-create course module and create lesson with isSample: false strictly enforced', async () => {
      mockHeadersValue = new Headers()
      mockHeadersValue.set('Authorization', `JWT ${ownerToken}`)

      // 1. Quick create course module
      const moduleRes = await createCourseModuleQuickAction({
        title: `Chương thực hành kiểm thử ${randomUUID().slice(0, 8)}`,
        group: 'technique',
        order: 5,
      })
      expect(moduleRes.success).toBe(true)
      expect(moduleRes.docId).toBeDefined()
      if (moduleRes.docId) {
        cleanupDocs.push({ collection: 'courseModules', id: moduleRes.docId })
      }

      // 2. Query next order
      const nextOrder = await getNextLessonOrderByModule(moduleRes.docId!)
      expect(nextOrder).toBeGreaterThanOrEqual(1)

      // 3. Create lesson from wizard
      const lessonRes = await createLessonFromWizard({
        moduleId: moduleRes.docId!,
        title: 'Bài 1: Thử nghiệm kỹ thuật',
        summary: 'Tóm tắt bài học thử nghiệm',
        stage: 'response',
        order: nextOrder,
        videoId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        durationInput: '12:30',
        isFreePreview: true,
      })

      expect(lessonRes.success).toBe(true)
      expect(lessonRes.docId).toBeDefined()
      if (lessonRes.docId) {
        cleanupDocs.push({ collection: 'lessons', id: lessonRes.docId })

        // 4. Verify in DB: check isSample is false and durationSec is 750
        const lessonInDb = await payload.findByID({
          collection: 'lessons',
          id: lessonRes.docId,
          draft: true,
        })
        expect(lessonInDb).toBeDefined()
        expect(lessonInDb.isSample).toBe(false)
        expect(lessonInDb.durationSec).toBe(750)
        expect(lessonInDb.isFreePreview).toBe(true)
        expect(lessonInDb.stage).toBe('response')
      }
    })
  })
})
