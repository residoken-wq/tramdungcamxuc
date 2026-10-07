import { describe, expect, it } from 'vitest'
import { toPublicTestimonial, type PublicTestimonial } from '@/lib/testimonials'

describe('T1-02b: Testimonials DTO & Consent-only Policy', () => {
  const samplePublishedTestimonial = {
    id: 10,
    name: 'Nguyễn Văn A',
    role: 'Học viên khóa EQ',
    quote: 'Khóa học đã giúp tôi hiểu rõ cảm xúc bản thân và tìm lại sự bình an.',
    language: 'vi',
    consent: true,
    relatedOffer: 101, // internal relation
    _status: 'published',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    photo: {
      id: 5,
      url: '/media/avatar.png',
      alt: 'Ảnh chân dung Nguyễn Văn A',
      filename: 'avatar.png',
      mimeType: 'image/png',
      filesize: 10240,
    },
  }

  describe('Strict Consent-only Policy (Chính sách đồng ý hiển thị)', () => {
    it('returns null when consent is false', () => {
      const doc = { ...samplePublishedTestimonial, consent: false }
      expect(toPublicTestimonial(doc)).toBeNull()
    })

    it('returns null when consent is undefined or missing', () => {
      const doc = { ...samplePublishedTestimonial, consent: undefined }
      expect(toPublicTestimonial(doc)).toBeNull()
    })

    it('returns null when consent is not explicitly boolean true', () => {
      expect(toPublicTestimonial({ ...samplePublishedTestimonial, consent: 'true' })).toBeNull()
      expect(toPublicTestimonial({ ...samplePublishedTestimonial, consent: 1 })).toBeNull()
      expect(toPublicTestimonial({ ...samplePublishedTestimonial, consent: null })).toBeNull()
    })

    it('returns null when _status is draft or not published', () => {
      const draftDoc = { ...samplePublishedTestimonial, consent: true, _status: 'draft' }
      expect(toPublicTestimonial(draftDoc)).toBeNull()
    })

    it('returns null for non-object inputs', () => {
      expect(toPublicTestimonial(null)).toBeNull()
      expect(toPublicTestimonial(undefined)).toBeNull()
      expect(toPublicTestimonial('string')).toBeNull()
      expect(toPublicTestimonial(123)).toBeNull()
    })
  })

  describe('Anti-data-leak protection (Không rò rỉ trường hệ thống / nội bộ)', () => {
    const ALLOWED_KEYS = new Set(['id', 'name', 'quote', 'role', 'language', 'photo'])

    it('returns only allowed public fields and strictly excludes internal fields', () => {
      const result = toPublicTestimonial(samplePublishedTestimonial)
      expect(result).not.toBeNull()

      const nonNullResult = result as PublicTestimonial
      expect(nonNullResult.id).toBe(10)
      expect(nonNullResult.name).toBe('Nguyễn Văn A')
      expect(nonNullResult.role).toBe('Học viên khóa EQ')
      expect(nonNullResult.quote).toBe(
        'Khóa học đã giúp tôi hiểu rõ cảm xúc bản thân và tìm lại sự bình an.',
      )
      expect(nonNullResult.language).toBe('vi')
      expect(nonNullResult.photo).toEqual({
        url: '/media/avatar.png',
        alt: 'Ảnh chân dung Nguyễn Văn A',
      })

      // Verify no forbidden keys exist in returned object
      for (const key of Object.keys(nonNullResult)) {
        expect(
          ALLOWED_KEYS.has(key),
          `Key "${key}" is not in ALLOWED_KEYS. Internal or sensitive data must not be leaked!`,
        ).toBe(true)
      }

      // Verify photo does not leak file metadata
      if (nonNullResult.photo) {
        const photoRecord = nonNullResult.photo as unknown as Record<string, unknown>
        expect(photoRecord.filename).toBeUndefined()
        expect(photoRecord.filesize).toBeUndefined()
        expect(photoRecord.mimeType).toBeUndefined()
      }
    })

    it('omits role when role is missing or empty whitespace', () => {
      const docWithoutRole = { ...samplePublishedTestimonial, role: '   ' }
      const result = toPublicTestimonial(docWithoutRole)
      expect(result).not.toBeNull()
      expect(result?.role).toBeUndefined()
      expect('role' in (result || {})).toBe(false)
    })

    it('omits photo when photo is missing or invalid', () => {
      const docWithoutPhoto = { ...samplePublishedTestimonial, photo: null }
      const result = toPublicTestimonial(docWithoutPhoto)
      expect(result).not.toBeNull()
      expect(result?.photo).toBeUndefined()
      expect('photo' in (result || {})).toBe(false)
    })
  })
})
