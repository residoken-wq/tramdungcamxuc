import { describe, expect, it } from 'vitest'
import { PRODUCT_TYPES, showFor, type ProductType } from '@/lib/cms/product-form'

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
})
