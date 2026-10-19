import { describe, it, expect } from 'vitest'
import {
  parseLibraryParams,
  productTopic,
  buildProductsWhere,
  buildPostsWhere,
  buildLibraryUrl,
  getLibraryEmptyKind,
  splitAtPostsSlot,
  estimateReadingMinutes,
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

  describe('estimateReadingMinutes', () => {
    it('returns 1 for empty or null content (minimum 1 minute)', () => {
      expect(estimateReadingMinutes(null)).toBe(1)
      expect(estimateReadingMinutes(undefined)).toBe(1)
      expect(estimateReadingMinutes('')).toBe(1)
      expect(estimateReadingMinutes('   ')).toBe(1)
      expect(estimateReadingMinutes({})).toBe(1)
    })

    it('returns 1 for 1 word', () => {
      expect(estimateReadingMinutes('Xin chào')).toBe(1)
      expect(estimateReadingMinutes({ root: { children: [{ text: 'Đơn' }] } })).toBe(1)
    })

    it('returns 3 for 401 words (ceil(401 / 200) = 3)', () => {
      const words = Array.from({ length: 401 }, (_, i) => `từ${i}`).join(' ')
      expect(estimateReadingMinutes(words)).toBe(3)
      expect(
        estimateReadingMinutes({
          root: { children: [{ text: words }] },
        }),
      ).toBe(3)
    })

    it('correctly traverses nested Lexical AST trees', () => {
      const nestedLexical = {
        root: {
          children: [
            {
              type: 'paragraph',
              children: [
                { text: 'Đây là đoạn văn thứ nhất với một số từ ngữ.' },
                { text: 'Và thêm một số từ nữa ở node anh em.' },
              ],
            },
            {
              type: 'block',
              children: [
                {
                  children: [{ text: 'Đoạn văn nằm sâu trong cấp lồng nhau.' }],
                },
              ],
            },
          ],
        },
      }
      // Total words is ~21 words -> Math.ceil(21 / 200) = 1
      expect(estimateReadingMinutes(nestedLexical)).toBe(1)
    })
  })

  describe('parseLibraryParams', () => {
    it('defaults trang to 1 when empty, invalid, or <= 0', () => {
      expect(parseLibraryParams({}).trang).toBe(1)
      expect(parseLibraryParams({ trang: '0' }).trang).toBe(1)
      expect(parseLibraryParams({ trang: '-5' }).trang).toBe(1)
      expect(parseLibraryParams({ trang: 'abc' }).trang).toBe(1)
      expect(parseLibraryParams({ trang: '1.5' }).trang).toBe(1)
    })

    it('parses valid integer trang >= 1', () => {
      expect(parseLibraryParams({ trang: '1' }).trang).toBe(1)
      expect(parseLibraryParams({ trang: '2' }).trang).toBe(2)
      expect(parseLibraryParams({ trang: '10' }).trang).toBe(10)
    })

    it('accepts valid topics ("tai-lieu", "eq", "habit", "career") and ignores invalid topics', () => {
      expect(parseLibraryParams({ topic: 'tai-lieu' }).topic).toBe('tai-lieu')
      expect(parseLibraryParams({ topic: 'eq' }).topic).toBe('eq')
      expect(parseLibraryParams({ topic: 'habit' }).topic).toBe('habit')
      expect(parseLibraryParams({ topic: 'career' }).topic).toBe('career')

      // Topic lạ bị bỏ qua (undefined -> "Tất cả")
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
          trang: ['3', '1'],
        }),
      ).toEqual({
        tab: 'noi-dung',
        topic: 'eq',
        q: 'cảm xúc',
        trang: 3,
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
    it('constructs correct query strings without tab (sitemap v2)', () => {
      expect(buildLibraryUrl({})).toBe('/tai-nguyen')
      expect(buildLibraryUrl({ tab: 'khoa-hoc' })).toBe('/tai-nguyen')
      expect(buildLibraryUrl({ topic: 'eq' })).toBe('/tai-nguyen?topic=eq')
      expect(buildLibraryUrl({ topic: 'habit', q: 'sách' })).toBe(
        '/tai-nguyen?topic=habit&q=s%C3%A1ch',
      )
      expect(buildLibraryUrl({ topic: 'habit', q: 'sách', trang: 2 })).toBe(
        '/tai-nguyen?topic=habit&q=s%C3%A1ch&trang=2',
      )
      // trang = 1 is omitted from URL to keep URLs clean
      expect(buildLibraryUrl({ topic: 'eq', trang: 1 })).toBe('/tai-nguyen?topic=eq')
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

  describe('splitAtPostsSlot', () => {
    it('returns null for before and after when data is null, undefined, or has no content array', () => {
      expect(splitAtPostsSlot(null)).toEqual({ before: null, after: null })
      expect(splitAtPostsSlot(undefined)).toEqual({ before: null, after: null })
      expect(splitAtPostsSlot({} as never)).toEqual({ before: null, after: null })
      expect(splitAtPostsSlot({ content: [] } as never)).toEqual({ before: null, after: null })
    })

    it('returns before = data and after = null when there is no ResourcePostsSlot', () => {
      const data = {
        content: [
          { type: 'SectionHeader', props: { id: 'header-1' } },
          { type: 'QuoteBlock', props: { id: 'quote-1' } },
        ],
        root: { props: { title: 'Tài nguyên' } },
      }
      expect(splitAtPostsSlot(data as never)).toEqual({
        before: data,
        after: null,
      })
    })

    it('splits data into before and after when exactly 1 ResourcePostsSlot is present', () => {
      const data = {
        content: [
          { type: 'SectionHeader', props: { id: 'header-1' } },
          { type: 'ResourcePostsSlot', props: { id: 'slot-1' } },
          { type: 'NewsletterForm', props: { id: 'newsletter-1' } },
          { type: 'CTASection', props: { id: 'cta-1' } },
        ],
        root: { props: { title: 'Tài nguyên' } },
      }

      const res = splitAtPostsSlot(data as never)
      expect(res.before?.content).toHaveLength(1)
      expect(res.before?.content[0].type).toBe('SectionHeader')
      expect(res.after?.content).toHaveLength(2)
      expect(res.after?.content[0].type).toBe('NewsletterForm')
      expect(res.after?.content[1].type).toBe('CTASection')
    })

    it('uses the first slot and filters out subsequent ResourcePostsSlot when >= 2 slots exist', () => {
      const data = {
        content: [
          { type: 'SectionHeader', props: { id: 'header-1' } },
          { type: 'ResourcePostsSlot', props: { id: 'slot-1' } },
          { type: 'NewsletterForm', props: { id: 'newsletter-1' } },
          { type: 'ResourcePostsSlot', props: { id: 'slot-2' } },
          { type: 'CTASection', props: { id: 'cta-1' } },
        ],
        root: { props: { title: 'Tài nguyên' } },
      }

      const res = splitAtPostsSlot(data as never)
      expect(res.before?.content).toHaveLength(1)
      expect(res.before?.content[0].type).toBe('SectionHeader')
      expect(res.after?.content).toHaveLength(2)
      expect(res.after?.content[0].type).toBe('NewsletterForm')
      expect(res.after?.content[1].type).toBe('CTASection')
    })

    it('ignores ResourcePostsSlot when nested inside Columns (only top-level content counts)', () => {
      const data = {
        content: [
          {
            type: 'Columns',
            props: { id: 'col-1' },
          },
          { type: 'SectionHeader', props: { id: 'header-1' } },
        ],
        zones: {
          'col-1:col1': [{ type: 'ResourcePostsSlot', props: { id: 'nested-slot' } }],
        },
        root: { props: { title: 'Tài nguyên' } },
      }

      const res = splitAtPostsSlot(data as never)
      expect(res.before).toEqual(data)
      expect(res.after).toBeNull()
    })

    it('returns before = null when ResourcePostsSlot is the first item', () => {
      const data = {
        content: [
          { type: 'ResourcePostsSlot', props: { id: 'slot-1' } },
          { type: 'NewsletterForm', props: { id: 'newsletter-1' } },
        ],
        root: { props: { title: 'Tài nguyên' } },
      }

      const res = splitAtPostsSlot(data as never)
      expect(res.before).toBeNull()
      expect(res.after?.content).toHaveLength(1)
      expect(res.after?.content[0].type).toBe('NewsletterForm')
    })
  })
})
