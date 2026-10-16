// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { seed } from '../../seed/seed'
import {
  PRODUCT_TYPES,
  showFor,
  type ProductType,
  validateCoverImageOnSale,
  validatePriceOnSale,
  validateSlugOnSale,
} from '@/lib/cms/product-form'

describe('Product Form CMS UX Conditions & Validation (CM-03)', () => {
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

  describe('on_sale publication validation (Item 4 unit tests)', () => {
    // REVIEW-REQUIRED: Pure validation unit tests for on_sale products
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

    it('validateSlugOnSale: slug stays required and well-formed even for drafts', () => {
      const validator = validateSlugOnSale(false)
      expect(
        typeof validator('', { data: { _status: 'draft', saleStatus: 'coming_soon' } } as any),
      ).toBe('string')
      expect(
        typeof validator('Có Dấu', {
          data: { _status: 'draft', saleStatus: 'coming_soon' },
        } as any),
      ).toBe('string')
      expect(
        validator('ok-slug', { data: { _status: 'draft', saleStatus: 'coming_soon' } } as any),
      ).toBe(true)
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

  describe('Local API Product Validation & Seeded Products (Item 6)', () => {
    let payload: Payload
    const created: { collection: CollectionSlug; id: number }[] = []
    const unique = () => `test-${randomUUID()}`
    const track = (collection: CollectionSlug, doc: { id: number }) => {
      created.push({ collection, id: doc.id })
      return doc.id
    }
    let testMediaId: number

    beforeAll(async () => {
      payload = await getPayload({ config })
      await payload.db.migrate({
        migrations: migrations.map((migration) => ({
          name: migration.name,
          up: (args: unknown) => migration.up(args as MigrateUpArgs),
          down: (args: unknown) => migration.down(args as MigrateDownArgs),
        })),
      })

      // Ensure sample seed products exist for testing
      const clearCheck = await payload.find({
        collection: 'products',
        where: { slug: { equals: 'growth-mirror-clear' } },
        limit: 1,
      })
      if (clearCheck.docs.length === 0) {
        await seed(payload)
      }

      // Find or create test media for cover image tests
      const mediaList = await payload.find({ collection: 'media', limit: 1 })
      if (mediaList.docs.length > 0) {
        testMediaId = mediaList.docs[0].id
      } else {
        const png = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH9sAAAAASUVORK5CYII=',
          'base64',
        )
        const m = await payload.create({
          collection: 'media',
          data: { alt: 'Ảnh kiểm thử bìa', isSample: true },
          file: {
            data: png,
            mimetype: 'image/png',
            name: `test-${unique()}.png`,
            size: png.length,
          },
        })
        testMediaId = track('media', m)
      }
    }, 60000)

    afterAll(async () => {
      if (!payload) return
      try {
        for (const entry of created.reverse()) await payload.delete(entry)
      } finally {
        await payload.destroy()
      }
    }, 30000)

    // REVIEW-REQUIRED: Local API validation tests
    it('allows saving draft product without price, coverImage or slug', async () => {
      const draft = await payload.create({
        collection: 'products',
        draft: true,
        data: {
          name: '[MẪU] Bản nháp chưa có giá',
          web: 'habit',
          type: 'digital_tool',
          saleStatus: 'on_sale',
          _status: 'draft',
          isSample: true,
        },
      })
      track('products', draft)
      expect(draft.id).toBeDefined()
      expect(draft._status).toBe('draft')
    })

    it('blocks publishing on_sale product when price is missing', async () => {
      await expect(
        payload.create({
          collection: 'products',
          draft: false,
          data: {
            name: '[MẪU] Thiếu giá khi mở bán',
            slug: unique(),
            web: 'habit',
            type: 'digital_tool',
            saleStatus: 'on_sale',
            coverImage: testMediaId,
            _status: 'published',
            isSample: false,
          },
        }),
      ).rejects.toSatisfy((err: any) => {
        return (
          err.name === 'ValidationError' &&
          err.data?.errors?.some((e: any) => e.message?.includes('bắt buộc phải có giá bán'))
        )
      })
    })

    it('blocks publishing on_sale product when coverImage is missing', async () => {
      await expect(
        payload.create({
          collection: 'products',
          draft: false,
          data: {
            name: '[MẪU] Thiếu ảnh bìa khi mở bán',
            slug: unique(),
            web: 'habit',
            type: 'digital_tool',
            price: 250000,
            saleStatus: 'on_sale',
            _status: 'published',
            isSample: false,
          },
        }),
      ).rejects.toSatisfy((err: any) => {
        return (
          err.name === 'ValidationError' &&
          err.data?.errors?.some((e: any) => e.message?.includes('bắt buộc phải có ảnh bìa'))
        )
      })
    })

    it('allows publishing on_sale physical_external (Shopee) product without price', async () => {
      const shopee = await payload.create({
        collection: 'products',
        draft: false,
        data: {
          name: '[MẪU] Thẻ Shopee không cần giá web',
          slug: unique(),
          web: 'eq',
          type: 'physical_external',
          saleStatus: 'on_sale',
          coverImage: testMediaId,
          externalUrl: 'https://shopee.vn/test',
          externalLabel: 'Mua trên Shopee',
          _status: 'published',
          isSample: true,
        },
      })
      track('products', shopee)
      expect(shopee.id).toBeDefined()
      expect(shopee.price).toBeNull()
      expect(shopee.saleStatus).toBe('on_sale')
    })

    it('allows publishing on_sale product with all required fields', async () => {
      const validProd = await payload.create({
        collection: 'products',
        draft: false,
        data: {
          name: '[MẪU] Sản phẩm hợp lệ',
          slug: unique(),
          web: 'habit',
          type: 'digital_tool',
          price: 250000,
          saleStatus: 'on_sale',
          coverImage: testMediaId,
          _status: 'published',
          isSample: true,
        },
      })
      track('products', validProd)
      expect(validProd.id).toBeDefined()
      expect(validProd._status).toBe('published')
    })

    it('existing seeded products open and save without error (Local API update retains data)', async () => {
      const sampleSlugs = [
        'growth-mirror-clear',
        'growth-mirror-build',
        'growth-mirror-shine',
        'ebook-cong-cu-eq',
        'habit-tracker-so',
        'bo-the-vat-ly-2-0',
        'growth-mirror-phien-trai-nghiem',
      ]
      const { docs: seededDocs } = await payload.find({
        collection: 'products',
        where: {
          slug: { in: sampleSlugs },
        },
        limit: 20,
      })
      expect(seededDocs.length).toBeGreaterThan(0)
      const slugs = seededDocs.map((p) => p.slug)
      expect(slugs).toContain('growth-mirror-clear')
      expect(slugs).toContain('growth-mirror-build')
      expect(slugs).toContain('growth-mirror-shine')

      for (const prod of seededDocs) {
        const updated = await payload.update({
          collection: 'products',
          id: prod.id,
          data: {},
        })
        expect(updated.id).toBe(prod.id)
        expect(updated.slug).toBe(prod.slug)
        expect(updated.type).toBe(prod.type)

        // Ensure fields hidden by condition still retain original database values
        if (prod.externalUrl) {
          expect(updated.externalUrl).toBe(prod.externalUrl)
        }
        if (prod.components && prod.components.length > 0) {
          expect(updated.components?.length).toBe(prod.components.length)
        }
      }
    })
  })
})
