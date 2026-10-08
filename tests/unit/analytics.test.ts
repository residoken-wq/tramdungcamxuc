import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EVENT_ALLOWED_PROPS,
  SENSITIVE_FORBIDDEN_KEYS,
  sanitizeAnalyticsProps,
  track,
} from '@/lib/analytics/track'

describe('Analytics (Plausible & track)', () => {
  describe('EVENT_ALLOWED_PROPS & SENSITIVE_FORBIDDEN_KEYS definitions', () => {
    it('defines allowed props for all 23 events', () => {
      expect(EVENT_ALLOWED_PROPS.lead_submitted).toContain('need')
      expect(EVENT_ALLOWED_PROPS.lead_submitted).toContain('resource')
      expect(EVENT_ALLOWED_PROPS.library_filtered).toContain('tab')
      expect(EVENT_ALLOWED_PROPS.library_filtered).toContain('topic')
      expect(EVENT_ALLOWED_PROPS.checkout_started).toContain('kind')
      expect(EVENT_ALLOWED_PROPS.card_drawn).toContain('cardCode')
    })

    it('contains PII, emotional and reflection forbidden keys', () => {
      expect(SENSITIVE_FORBIDDEN_KEYS.has('email')).toBe(true)
      expect(SENSITIVE_FORBIDDEN_KEYS.has('name')).toBe(true)
      expect(SENSITIVE_FORBIDDEN_KEYS.has('phone')).toBe(true)
      expect(SENSITIVE_FORBIDDEN_KEYS.has('feeling')).toBe(true)
      expect(SENSITIVE_FORBIDDEN_KEYS.has('reflection')).toBe(true)
      expect(SENSITIVE_FORBIDDEN_KEYS.has('note')).toBe(true)
    })
  })

  describe('sanitizeAnalyticsProps', () => {
    it('returns undefined when rawProps is undefined or empty', () => {
      expect(sanitizeAnalyticsProps('library_filtered')).toBeUndefined()
      expect(sanitizeAnalyticsProps('library_filtered', {})).toBeUndefined()
    })

    it('retains whitelisted props and removes unknown keys', () => {
      const sanitized = sanitizeAnalyticsProps('library_filtered', {
        tab: 'all',
        topic: 'stress',
        page: 2,
        unknownField: 'malicious',
        anotherBadKey: 999,
      })

      expect(sanitized).toEqual({
        tab: 'all',
        topic: 'stress',
        page: 2,
      })
    })

    it('strips PII (email, phone, name) and sensitive fields even if passed', () => {
      const sanitized = sanitizeAnalyticsProps('lead_submitted', {
        need: 'coaching',
        resource: 'ebook-habit',
        email: 'user@example.com',
        name: 'Nguyen Van A',
        phone: '0901234567',
        feeling: 'anxious',
        reflection: 'my private journal entry',
      })

      expect(sanitized).toEqual({
        need: 'coaching',
        resource: 'ebook-habit',
      })
      expect(sanitized).not.toHaveProperty('email')
      expect(sanitized).not.toHaveProperty('name')
      expect(sanitized).not.toHaveProperty('phone')
      expect(sanitized).not.toHaveProperty('feeling')
      expect(sanitized).not.toHaveProperty('reflection')
    })

    it('returns undefined if all submitted props are filtered out', () => {
      const sanitized = sanitizeAnalyticsProps('lead_submitted', {
        email: 'test@example.com',
        arbitraryKey: 'hello',
      })
      expect(sanitized).toBeUndefined()
    })

    it('formats arrays of strings or numbers into clean comma-separated strings', () => {
      const sanitized = sanitizeAnalyticsProps('package_viewed', {
        packages: ['clear', 'build', 'shine'],
      })
      expect(sanitized).toEqual({
        packages: 'clear, build, shine',
      })
    })
  })

  describe('track() function', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
      delete (window as unknown as { plausible?: unknown }).plausible
    })

    afterEach(() => {
      delete (window as unknown as { plausible?: unknown }).plausible
    })

    it('safely no-ops when window.plausible is not defined', () => {
      expect(() => {
        track('library_filtered', { tab: 'all' })
      }).not.toThrow()
    })

    it('calls window.plausible with sanitized props when available', () => {
      const plausibleMock = vi.fn()
      window.plausible = plausibleMock

      track('library_filtered', {
        tab: 'all',
        topic: 'habit',
        email: 'secret@domain.com', // must be stripped
        hack: 'exploit', // must be stripped
      })

      expect(plausibleMock).toHaveBeenCalledTimes(1)
      expect(plausibleMock).toHaveBeenCalledWith('library_filtered', {
        props: {
          tab: 'all',
          topic: 'habit',
        },
      })
    })

    it('calls window.plausible without props when props are empty or fully stripped', () => {
      const plausibleMock = vi.fn()
      window.plausible = plausibleMock

      track('habit_loop_completed')
      expect(plausibleMock).toHaveBeenCalledWith('habit_loop_completed')

      plausibleMock.mockClear()
      track('habit_loop_completed', { email: 'forbidden@secret.com' })
      expect(plausibleMock).toHaveBeenCalledWith('habit_loop_completed')
    })

    it('catches errors gracefully if window.plausible throws', () => {
      window.plausible = vi.fn().mockImplementation(() => {
        throw new Error('Plausible script blocked by adblock')
      })

      expect(() => {
        track('zalo_chat_clicked', { target: 'navbar' })
      }).not.toThrow()
    })
  })
})
