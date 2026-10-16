import { describe, expect, it } from 'vitest'
import {
  PRODUCT_TYPES,
  showFor,
  type ProductType,
  validateCoverImageOnSale,
  validatePriceOnSale,
  validateSlugOnSale,
} from '@/lib/cms/product-form'

describe('Product Form CMS UX Conditions (CM-03)', () => {
  describe('showFor helper', () => {
    it('returns true when data.type is in allowedTypes', () => {
      const condition = showFor(['digital_tool'])
      expect(condition({ type: 'digital_tool' }, {})).toBe(true)
    })

    it('returns false when data.type is not in allowedTypes', () => {
      const condition = showFor(['digital_tool'])
      expect(condition({ type: 'ebook' }, {})).toBe(false)
      expect(condition({ type: 'package' }, {})).toBe(false)
    })

    it('returns false when data.type is undefined or empty', () => {
      const condition = showFor(['digital_tool', 'package'])
      expect(condition({}, {})).toBe(false)
      expect(condition({ type: null as unknown as ProductType }, {})).toBe(false)
    })

    it('supports checking siblingData.type as fallback', () => {
      const condition = showFor(['package'])
      expect(condition({}, { type: 'package' })).toBe(true)
      expect(condition({}, { type: 'ebook' })).toBe(false)
    })

    it('covers all 9 defined product types', () => {
      expect(PRODUCT_TYPES).toHaveLength(9)
      expect(PRODUCT_TYPES).toEqual([
        'ebook',
        'toolkit',
        'digital_tool',
        'physical_external',
        'workshop',
        'community',
        'coaching_trial',
        'package',
        'b2b',
      ])
    })
  })

  describe('CMS_UX.md section 5 matrix rules', () => {
    const isDigitalTool = showFor(['digital_tool'])
    const isPackage = showFor(['package'])
    const isEbookOrToolkit = showFor(['ebook', 'toolkit'])
    const isExternalOrConsult = showFor([
      'physical_external',
      'coaching_trial',
      'workshop',
      'community',
      'b2b',
    ])
    const hasPrice = showFor([
      'digital_tool',
      'ebook',
      'toolkit',
      'package',
      'coaching_trial',
      'workshop',
      'community',
      'b2b',
    ])

    it('digital_tool: shows price, trial, access; hides package components, files, externalUrl', () => {
      const data = { type: 'digital_tool' as const }
      expect(hasPrice(data, {})).toBe(true)
      expect(isDigitalTool(data, {})).toBe(true)
      expect(isPackage(data, {})).toBe(false)
      expect(isEbookOrToolkit(data, {})).toBe(false)
      expect(isExternalOrConsult(data, {})).toBe(false)
    })

    it('ebook / toolkit: shows price, files; hides trial, components, externalUrl', () => {
      const ebookData = { type: 'ebook' as const }
      const toolkitData = { type: 'toolkit' as const }

      expect(hasPrice(ebookData, {})).toBe(true)
      expect(isEbookOrToolkit(ebookData, {})).toBe(true)
      expect(isDigitalTool(ebookData, {})).toBe(false)
      expect(isPackage(ebookData, {})).toBe(false)
      expect(isExternalOrConsult(ebookData, {})).toBe(false)

      expect(hasPrice(toolkitData, {})).toBe(true)
      expect(isEbookOrToolkit(toolkitData, {})).toBe(true)
    })

    it('package: shows price, components; hides trial, files, externalUrl', () => {
      const data = { type: 'package' as const }
      expect(hasPrice(data, {})).toBe(true)
      expect(isPackage(data, {})).toBe(true)
      expect(isDigitalTool(data, {})).toBe(false)
      expect(isEbookOrToolkit(data, {})).toBe(false)
      expect(isExternalOrConsult(data, {})).toBe(false)
    })

    it('physical_external: shows external link; hides web price, trial, components, files', () => {
      const data = { type: 'physical_external' as const }
      expect(isExternalOrConsult(data, {})).toBe(true)
      expect(hasPrice(data, {})).toBe(false)
      expect(isDigitalTool(data, {})).toBe(false)
      expect(isPackage(data, {})).toBe(false)
      expect(isEbookOrToolkit(data, {})).toBe(false)
    })

    it('coaching_trial / workshop / community / b2b: shows price & booking links; hides components, files', () => {
      const types: ProductType[] = ['coaching_trial', 'workshop', 'community', 'b2b']
      for (const t of types) {
        const data = { type: t }
        expect(hasPrice(data, {})).toBe(true)
        expect(isExternalOrConsult(data, {})).toBe(true)
        expect(isPackage(data, {})).toBe(false)
        expect(isEbookOrToolkit(data, {})).toBe(false)
        expect(isDigitalTool(data, {})).toBe(false)
      }
    })
  })

  describe('on_sale publication validation (Item 4)', () => {
    // REVIEW-REQUIRED: Tests for publication validation on on_sale products
    it('validatePriceOnSale: allows drafts without price', () => {
      const result = validatePriceOnSale(null, {
        data: { _status: 'draft', saleStatus: 'on_sale', type: 'digital_tool' },
      } as any)
      expect(result).toBe(true)
    })

    it('validatePriceOnSale: allows physical_external on_sale without price', () => {
      const result = validatePriceOnSale(null, {
        data: { _status: 'published', saleStatus: 'on_sale', type: 'physical_external' },
      } as any)
      expect(result).toBe(true)
    })

    it('validatePriceOnSale: blocks published on_sale digital_tool without price', () => {
      const result = validatePriceOnSale(null, {
        data: { _status: 'published', saleStatus: 'on_sale', type: 'digital_tool' },
      } as any)
      expect(typeof result).toBe('string')
      expect(result).toContain('bắt buộc phải có giá bán')
    })

    it('validatePriceOnSale: allows published on_sale digital_tool with valid price', () => {
      const result = validatePriceOnSale(250000, {
        data: { _status: 'published', saleStatus: 'on_sale', type: 'digital_tool' },
      } as any)
      expect(result).toBe(true)
    })

    it('validatePriceOnSale: allows coming_soon / free / consult / hidden without price', () => {
      for (const s of ['coming_soon', 'free', 'consult', 'hidden'] as const) {
        const result = validatePriceOnSale(null, {
          data: { _status: 'published', saleStatus: s, type: 'digital_tool' },
        } as any)
        expect(result).toBe(true)
      }
    })

    it('validateCoverImageOnSale: allows drafts without cover image', () => {
      const result = validateCoverImageOnSale(null, {
        data: { _status: 'draft', saleStatus: 'on_sale' },
      } as any)
      expect(result).toBe(true)
    })

    it('validateCoverImageOnSale: blocks published on_sale without cover image', () => {
      const result = validateCoverImageOnSale(null, {
        data: { _status: 'published', saleStatus: 'on_sale' },
      } as any)
      expect(typeof result).toBe('string')
      expect(result).toContain('bắt buộc phải có ảnh bìa')
    })

    it('validateCoverImageOnSale: allows published on_sale with cover image', () => {
      const result = validateCoverImageOnSale(123, {
        data: { _status: 'published', saleStatus: 'on_sale' },
      } as any)
      expect(result).toBe(true)
    })

    it('validateSlugOnSale: allows drafts without slug', () => {
      const validator = validateSlugOnSale(false)
      const result = validator('', {
        data: { _status: 'draft', saleStatus: 'on_sale' },
      } as any)
      expect(result).toBe(true)
    })

    it('validateSlugOnSale: blocks published on_sale without slug', () => {
      const validator = validateSlugOnSale(false)
      const result = validator('', {
        data: { _status: 'published', saleStatus: 'on_sale' },
      } as any)
      expect(typeof result).toBe('string')
      expect(result).toContain('bắt buộc phải có đường dẫn')
    })

    it('validateSlugOnSale: validates slug characters format', () => {
      const validator = validateSlugOnSale(false)
      const invalid = validator('Invalid Slug With Spaces!', {
        data: { _status: 'published', saleStatus: 'on_sale' },
      } as any)
      expect(typeof invalid).toBe('string')
      expect(invalid).toContain('chỉ dùng chữ thường không dấu')

      const valid = validator('habit-tracker-so-2026', {
        data: { _status: 'published', saleStatus: 'on_sale' },
      } as any)
      expect(valid).toBe(true)
    })
  })
})
