import { describe, it, expect } from 'vitest'
import {
  parseLibraryParams,
  productTopic,
  buildProductsWhere,
  buildPostsWhere,
  buildLibraryUrl,
  getLibraryEmptyKind,
} from '@/lib/library'

describe('Library Unit Tests (T1-09)', () => {
  describe('productTopic', () => {
    it('returns "habit" when web is habit', () => {
      expect(productTopic({ web: 'habit', type: 'digital_tool' })).toBe('habit')
      expect(productTopic({ web: 'habit', type: 'package' })).toBe('habit')
    })

    it('returns "eq" when web is eq', () => {
      expect(productTopic({ web: 'eq', type: 'digital_tool' })).toBe('eq')
      expect(productTopic({ web: 'eq', type: 'physical_external' })).toBe('eq')
    })

    it('returns "career" when type is package and web is not habit/eq', () => {
      expect(productTopic({ web: 'site', type: 'package' })).toBe('career')
      expect(productTopic({ web: null, type: 'package' })).toBe('career')
    })

    it('prefers the topic chosen in the CMS (SM-01/SM-02)', () => {
      expect(productTopic({ topic: 'career', web: 'habit', type: 'digital_tool' })).toBe('career')
      expect(productTopic({ topic: null, web: 'eq', type: 'digital_tool' })).toBe('eq')
    })

    it('returns null for any other product (not assigned to specific topic)', () => {
      expect(productTopic({ web: 'site', type: 'ebook' })).toBeNull()
      expect(productTopic({ web: 'site', type: 'toolkit' })).toBeNull()
      expect(productTopic({ web: 'site', type: 'coaching_trial' })).toBeNull()
      expect(productTopic({})).toBeNull()
      expect(productTopic({ web: null, type: null })).toBeNull()
    })
  })

  describe('parseLibraryParams', () => {
    it('defaults tab to "khoa-hoc" when empty or unknown', () => {
      expect(parseLibraryParams({})).toEqual({
        tab: 'khoa-hoc',
        topic: undefined,
        q: undefined,
      })
      expect(parseLibraryParams({ tab: 'unknown-tab' })).toEqual({
        tab: 'khoa-hoc',
        topic: undefined,
        q: undefined,
      })
      expect(parseLibraryParams({ tab: '' })).toEqual({
        tab: 'khoa-hoc',
        topic: undefined,
        q: undefined,
      })
    })

    it('recognizes "noi-dung" tab', () => {
      expect(parseLibraryParams({ tab: 'noi-dung' }).tab).toBe('noi-dung')
    })

    it('accepts valid topics ("eq", "habit", "career") and ignores invalid topics', () => {
      expect(parseLibraryParams({ topic: 'eq' }).topic).toBe('eq')
      expect(parseLibraryParams({ topic: 'habit' }).topic).toBe('habit')
      expect(parseLibraryParams({ topic: 'career' }).topic).toBe('career')

      // Topic lạ bị bỏ qua
      expect(parseLibraryParams({ topic: 'invalid-topic' }).topic).toBeUndefined()
      expect(parseLibraryParams({ topic: '' }).topic).toBeUndefined()
    })

    it('trims whitespace and truncates q to 100 characters max', () => {
      expect(parseLibraryParams({ q: '   ' }).q).toBeUndefined()
      expect(parseLibraryParams({ q: '  thói quen  ' }).q).toBe('thói quen')

      const longString = 'a'.repeat(150)
      const parsed = parseLibraryParams({ q: longString })
      expect(parsed.q).toBe('a'.repeat(100))
      expect(parsed.q?.length).toBe(100)
    })

    it('handles array inputs gracefully from Next.js searchParams', () => {
      expect(
        parseLibraryParams({
          tab: ['noi-dung', 'khoa-hoc'],
          topic: ['eq', 'habit'],
          q: ['  cảm xúc  '],
        }),
      ).toEqual({
        tab: 'noi-dung',
        topic: 'eq',
        q: 'cảm xúc',
      })
    })
  })

  describe('buildProductsWhere', () => {
    it('always excludes hidden products and requires published status', () => {
      const where = buildProductsWhere({ tab: 'khoa-hoc' })
      expect(where.and).toContainEqual({ _status: { equals: 'published' } })
      expect(where.and).toContainEqual({ saleStatus: { not_equals: 'hidden' } })
    })

    it('filters for digital_tool and package when tab is khoa-hoc', () => {
      const where = buildProductsWhere({ tab: 'khoa-hoc' })
      expect(where.and).toContainEqual({ type: { in: ['digital_tool', 'package'] } })
    })

    it('filters for ebook and toolkit when tab is noi-dung', () => {
      const where = buildProductsWhere({ tab: 'noi-dung' })
      expect(where.and).toContainEqual({ type: { in: ['ebook', 'toolkit'] } })
    })

    it('adds name like filter when q is provided', () => {
      const where = buildProductsWhere({ tab: 'khoa-hoc', q: 'Habit Tracker' })
      expect(where.and).toContainEqual({ name: { like: 'Habit Tracker' } })
    })

    it('filters by the CMS topic, falling back to the old rule when topic is empty (SM-02)', () => {
      const habitWhere = buildProductsWhere({ tab: 'khoa-hoc', topic: 'habit' })
      expect(habitWhere.and).toContainEqual({
        or: [
          { topic: { equals: 'habit' } },
          { and: [{ topic: { exists: false } }, { web: { equals: 'habit' } }] },
        ],
      })

      const careerWhere = buildProductsWhere({ tab: 'khoa-hoc', topic: 'career' })
      expect(careerWhere.and).toContainEqual({
        or: [
          { topic: { equals: 'career' } },
          { and: [{ topic: { exists: false } }, { type: { equals: 'package' } }] },
        ],
      })
    })
  })

  describe('buildPostsWhere', () => {
    it('requires published status', () => {
      const where = buildPostsWhere({ tab: 'noi-dung' })
      expect(where.and).toContainEqual({ _status: { equals: 'published' } })
    })

    it('adds topic filter when provided', () => {
      const where = buildPostsWhere({ tab: 'noi-dung', topic: 'eq' })
      expect(where.and).toContainEqual({ topic: { equals: 'eq' } })
    })

    it('adds title like filter when q is provided', () => {
      const where = buildPostsWhere({ tab: 'noi-dung', q: 'Đọc sách' })
      expect(where.and).toContainEqual({ title: { like: 'Đọc sách' } })
    })
  })

  describe('buildLibraryUrl', () => {
    it('constructs correct query strings', () => {
      expect(buildLibraryUrl({ tab: 'khoa-hoc' })).toBe('/tai-nguyen?tab=khoa-hoc')
      expect(buildLibraryUrl({ tab: 'noi-dung', topic: 'eq' })).toBe(
        '/tai-nguyen?tab=noi-dung&topic=eq',
      )
      expect(buildLibraryUrl({ tab: 'noi-dung', topic: 'habit', q: 'sách' })).toBe(
        '/tai-nguyen?tab=noi-dung&topic=habit&q=s%C3%A1ch',
      )
    })
  })

  describe('getLibraryEmptyKind', () => {
    it('returns "updating" when no topic and no q are provided', () => {
      expect(getLibraryEmptyKind({})).toBe('updating')
      expect(getLibraryEmptyKind({ topic: undefined, q: undefined })).toBe('updating')
      expect(getLibraryEmptyKind({ topic: undefined, q: '   ' })).toBe('updating')
    })

    it('returns "filtered" when a topic is selected', () => {
      expect(getLibraryEmptyKind({ topic: 'eq' })).toBe('filtered')
      expect(getLibraryEmptyKind({ topic: 'habit' })).toBe('filtered')
      expect(getLibraryEmptyKind({ topic: 'career' })).toBe('filtered')
    })

    it('returns "filtered" when a search query q is provided', () => {
      expect(getLibraryEmptyKind({ q: 'thói quen' })).toBe('filtered')
    })

    it('returns "filtered" when both topic and q are provided', () => {
      expect(getLibraryEmptyKind({ topic: 'eq', q: 'cảm xúc' })).toBe('filtered')
    })
  })
})
