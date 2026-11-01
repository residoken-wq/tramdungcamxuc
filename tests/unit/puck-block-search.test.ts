import { describe, it, expect } from 'vitest'
import { normalizeVi, filterBlockCategories } from '@/puck/editor/block-search'

describe('normalizeVi', () => {
  it('converts uppercase to lowercase and strips accents', () => {
    expect(normalizeVi('Hình ảnh')).toBe('hinh anh')
    expect(normalizeVi('Đường kẻ')).toBe('duong ke')
    expect(normalizeVi('ĐẶC BIỆT')).toBe('dac biet')
  })

  it('handles "đ" and "Đ" properly', () => {
    expect(normalizeVi('đường dẫn')).toBe('duong dan')
    expect(normalizeVi('Đầu trang')).toBe('dau trang')
  })

  it('collapses multiple whitespace characters and trims', () => {
    expect(normalizeVi('   Khối    Trích   dẫn   ')).toBe('khoi trich dan')
  })

  it('handles empty and nullish strings', () => {
    expect(normalizeVi('')).toBe('')
    // @ts-expect-error test resilience
    expect(normalizeVi(null)).toBe('')
    // @ts-expect-error test resilience
    expect(normalizeVi(undefined)).toBe('')
  })
})

describe('filterBlockCategories', () => {
  const sampleCategories = {
    intro: {
      title: 'Mở đầu',
      components: ['HeroTwoEntries', 'HeroImage', 'SectionHeader'],
    },
    content: {
      title: 'Nội dung',
      components: ['RichText', 'ImageText', 'QuoteBlock'],
    },
    emptyGroup: {
      title: 'Nhóm trống',
      components: [],
    },
  }

  const sampleLabels: Record<string, string> = {
    HeroTwoEntries: 'Hero Hai lối vào',
    HeroImage: 'Hero Ảnh biểu tượng (Hero Image)',
    SectionHeader: 'Tiêu đề mục (Section Header)',
    RichText: 'Văn bản đa dạng (Rich Text)',
    ImageText: 'Hình ảnh kèm chữ (Image Text)',
    QuoteBlock: 'Khối trích dẫn cảm xúc (Quote Block)',
    UnassignedBlock: 'Khối chưa phân loại',
  }

  it('returns categories with components intact when query is empty', () => {
    const result = filterBlockCategories(sampleCategories, sampleLabels, '')
    expect(result).toHaveLength(2) // emptyGroup dropped
    expect(result[0].id).toBe('intro')
    expect(result[0].components).toEqual(['HeroTwoEntries', 'HeroImage', 'SectionHeader'])
    expect(result[1].id).toBe('content')
  })

  it('matches by technical name', () => {
    const result = filterBlockCategories(sampleCategories, sampleLabels, 'Quote')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('content')
    expect(result[0].components).toEqual(['QuoteBlock'])
  })

  it('matches by localized display label with Vietnamese diacritics', () => {
    // "anh bieu tuong" should match "Hero Ảnh biểu tượng (Hero Image)"
    const result = filterBlockCategories(sampleCategories, sampleLabels, 'anh bieu tuong')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('intro')
    expect(result[0].components).toEqual(['HeroImage'])
  })

  it('matches without diacritics against diacritic label', () => {
    // "hinh anh" should match "Hình ảnh kèm chữ"
    const result = filterBlockCategories(sampleCategories, sampleLabels, 'hinh anh')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('content')
    expect(result[0].components).toEqual(['ImageText'])
  })

  it('drops categories that have no matching blocks', () => {
    const result = filterBlockCategories(sampleCategories, sampleLabels, 'da dang')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('content')
    expect(result[0].components).toEqual(['RichText'])
  })

  it('returns empty array when no blocks match', () => {
    const result = filterBlockCategories(sampleCategories, sampleLabels, 'xyz123nonexistent')
    expect(result).toHaveLength(0)
  })

  it('puts unassigned components into category "Khác"', () => {
    const allKeys = [
      'HeroTwoEntries',
      'HeroImage',
      'SectionHeader',
      'RichText',
      'ImageText',
      'QuoteBlock',
      'UnassignedBlock',
    ]

    const result = filterBlockCategories(sampleCategories, sampleLabels, '', allKeys)
    const otherCat = result.find((c) => c.id === 'other')
    expect(otherCat).toBeDefined()
    expect(otherCat?.title).toBe('Khác')
    expect(otherCat?.components).toContain('UnassignedBlock')
  })

  it('filters unassigned components in category "Khác" when searching', () => {
    const allKeys = [
      'HeroTwoEntries',
      'HeroImage',
      'SectionHeader',
      'RichText',
      'ImageText',
      'QuoteBlock',
      'UnassignedBlock',
    ]

    const result = filterBlockCategories(sampleCategories, sampleLabels, 'chua phan loai', allKeys)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('other')
    expect(result[0].components).toEqual(['UnassignedBlock'])
  })
})
