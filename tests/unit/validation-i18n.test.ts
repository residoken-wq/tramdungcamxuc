import { describe, it, expect } from 'vitest'
import { ValidationError } from 'payload'
import { requireConsent } from '@/collections/Testimonials'
import { normalizePageSlug } from '@/collections/Pages'
import { viTranslations } from '@payloadcms/translations/languages/vi'

describe('Admin Validation i18n (T1-17c)', () => {
  const createMockReqVi = () => {
    return {
      t: (key: string, options?: { count?: number }) => {
        if (key === 'error:followingFieldsInvalid') {
          return options?.count === 1
            ? viTranslations.error.followingFieldsInvalid_one
            : viTranslations.error.followingFieldsInvalid_other
        }
        return key
      },
      i18n: {
        language: 'vi',
        t: (key: string) => key,
      },
    }
  }

  describe('requireConsent hook (Testimonials)', () => {
    it('throws ValidationError with Vietnamese message when req.t is provided and consent is missing on published', () => {
      const mockReq = createMockReqVi()

      let thrownError: unknown = null
      try {
        requireConsent({
          data: { _status: 'published', consent: false },
          originalDoc: {},
          req: mockReq as never,
          operation: 'update',
          context: {},
          collection: {} as never,
        })
      } catch (err) {
        thrownError = err
      }

      expect(thrownError).toBeInstanceOf(ValidationError)
      const valError = thrownError as ValidationError

      // Phải có thông điệp tiếng Việt từ viTranslations
      expect(valError.message).toContain('Lỗi - Field sau không hợp lệ:')
      expect(valError.message).not.toContain('The following field is invalid:')
      expect(valError.message).toContain('consent')

      // Chi tiết lỗi
      expect(valError.data.errors).toHaveLength(1)
      expect(valError.data.errors[0]).toEqual({
        path: 'consent',
        message: 'Cần có sự đồng ý trước khi xuất bản lời chia sẻ.',
      })
    })

    it('allows publishing when consent is true', () => {
      const mockReq = createMockReqVi()

      const data = { _status: 'published', consent: true }
      const result = requireConsent({
        data,
        originalDoc: {},
        req: mockReq as never,
        operation: 'update',
        context: {},
        collection: {} as never,
      })

      expect(result).toBe(data)
    })

    it('allows draft status even without consent', () => {
      const mockReq = createMockReqVi()

      const data = { _status: 'draft', consent: false }
      const result = requireConsent({
        data,
        originalDoc: {},
        req: mockReq as never,
        operation: 'update',
        context: {},
        collection: {} as never,
      })

      expect(result).toBe(data)
    })
  })

  describe('normalizePageSlug (Pages)', () => {
    it('throws ValidationError with Vietnamese message on double slashes when req is provided', () => {
      const mockReq = createMockReqVi()

      let thrownError: unknown = null
      try {
        normalizePageSlug('blog//post', mockReq as never)
      } catch (err) {
        thrownError = err
      }

      expect(thrownError).toBeInstanceOf(ValidationError)
      const valError = thrownError as ValidationError

      expect(valError.message).toContain('Lỗi - Field sau không hợp lệ:')
      expect(valError.message).not.toContain('The following field is invalid:')
      expect(valError.data.errors[0]?.message).toBe(
        'Đường dẫn không được chứa hai dấu / liên tiếp.',
      )
    })

    it('normalizes valid slug cleanly', () => {
      expect(normalizePageSlug('/gioi-thieu/')).toBe('gioi-thieu')
      expect(normalizePageSlug('/')).toBe('/')
    })
  })
})
