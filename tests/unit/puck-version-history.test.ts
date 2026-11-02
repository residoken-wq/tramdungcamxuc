import { describe, it, expect } from 'vitest'
import { formatVietnamDateTime, getVersionBadgeInfo } from '@/puck/version-history'
import { vi } from '@/lib/i18n/vi'

describe('puck version history utils', () => {
  describe('formatVietnamDateTime', () => {
    it('formats UTC ISO date to Vietnam Asia/Ho_Chi_Minh (UTC+7)', () => {
      // 2026-11-02T07:05:00.000Z is 14:05 in UTC+7
      const formatted = formatVietnamDateTime('2026-11-02T07:05:00.000Z')
      expect(formatted).toBe('02/11/2026 14:05')
    })

    it('formats midnight UTC correctly', () => {
      // 2026-05-10T00:00:00.000Z is 07:00 in UTC+7
      const formatted = formatVietnamDateTime('2026-05-10T00:00:00.000Z')
      expect(formatted).toBe('10/05/2026 07:00')
    })

    it('returns empty string for invalid date', () => {
      expect(formatVietnamDateTime('invalid-date')).toBe('')
    })
  })

  describe('getVersionBadgeInfo', () => {
    it('returns autosave badge when autosave is true regardless of status', () => {
      const badge = getVersionBadgeInfo({ status: 'draft', autosave: true })
      expect(badge.type).toBe('autosave')
      expect(badge.label).toBe(vi.eb08.statusAutosave)
      expect(badge.className).toContain('bg-butter-cream')
    })

    it('returns published badge when status is published and not autosave', () => {
      const badge = getVersionBadgeInfo({ status: 'published', autosave: false })
      expect(badge.type).toBe('published')
      expect(badge.label).toBe(vi.eb08.statusPublished)
      expect(badge.className).toContain('bg-mint-haze')
    })

    it('returns draft badge when status is draft and not autosave', () => {
      const badge = getVersionBadgeInfo({ status: 'draft' })
      expect(badge.type).toBe('draft')
      expect(badge.label).toBe(vi.eb08.statusDraft)
      expect(badge.className).toContain('bg-soft-pink')
    })
  })
})
