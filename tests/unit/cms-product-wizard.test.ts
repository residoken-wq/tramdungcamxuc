// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

let mockHeadersValue: Headers = new Headers()
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => mockHeadersValue),
}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { PRODUCT_TYPES, type ProductType } from '@/lib/cms/product-form'
import { getProductTemplate, PRODUCT_TYPE_TEMPLATES } from '@/lib/cms/product-templates'
import { validateProductWizardData, type ProductWizardInput } from '@/lib/cms/product-wizard-schema'
import { createProductFromWizard } from '@/lib/cms/product-wizard.server'
import { vi as i18nVi } from '@/lib/i18n/vi'

describe('Product Wizard (CM-04) Unit Tests', () => {
  describe('Product Templates (src/lib/cms/product-templates.ts)', () => {
    it('covers all 9 product types', () => {
      expect(Object.keys(PRODUCT_TYPE_TEMPLATES)).toHaveLength(9)
      for (const type of PRODUCT_TYPES) {
        expect(PRODUCT_TYPE_TEMPLATES[type]).toBeDefined()
        expect(PRODUCT_TYPE_TEMPLATES[type].type).toBe(type)
      }
    })

    it('digital_tool defaults to 21 trialDays, web habit, cta buy', () => {
      const template = getProductTemplate('digital_tool')
      expect(template.trialDays).toBe(21)
      expect(template.web).toBe('habit')
      expect(template.ctaType).toBe('buy')
      expect(template.ctaLabel).toBe('Mua ngay')
      expect(template.saleStatus).toBe('on_sale')
      expect(template.accessDurationDays).toBeNull() // Vĩnh viễn sau 21 ngày
    })

    it('ebook and toolkit default to free with download cta', () => {
      const ebook = getProductTemplate('ebook')
      expect(ebook.saleStatus).toBe('free')
      expect(ebook.web).toBe('site')
      expect(ebook.ctaType).toBe('download')
      expect(ebook.trialDays).toBeNull()

      const toolkit = getProductTemplate('toolkit')
      expect(toolkit.saleStatus).toBe('free')
      expect(toolkit.web).toBe('site')
      expect(toolkit.ctaType).toBe('download')
      expect(toolkit.trialDays).toBeNull()
    })

    it('physical_external defaults to Shopee external cta', () => {
      const shopee = getProductTemplate('physical_external')
      expect(shopee.web).toBe('eq')
      expect(shopee.saleStatus).toBe('on_sale')
      expect(shopee.ctaType).toBe('external')
      expect(shopee.externalLabel).toBe('Mua trên Shopee')
    })

    it('b2b defaults to consult', () => {
      const b2b = getProductTemplate('b2b')
      expect(b2b.web).toBe('site')
      expect(b2b.saleStatus).toBe('consult')
      expect(b2b.ctaType).toBe('external')
    })

    it('package defaults to on_sale and buy cta', () => {
      const pkg = getProductTemplate('package')
      expect(pkg.web).toBe('site')
      expect(pkg.saleStatus).toBe('on_sale')
      expect(pkg.ctaType).toBe('buy')
    })

    it('NEVER prepopulates prices for any product type (AGENTS.md 2.3)', () => {
      for (const type of PRODUCT_TYPES) {
        const template = getProductTemplate(type)
        expect(template.price).toBeUndefined()
        expect(template.salePrice).toBeUndefined()
      }
    })

    it('throws error when requesting an invalid product type', () => {
      expect(() => getProductTemplate('unknown_type' as unknown as ProductType)).toThrow()
    })
  })

  describe('Product Wizard Zod Schema (src/lib/cms/product-wizard-schema.ts)', () => {
    it('validates a valid draft payload', () => {
      const draftData: ProductWizardInput = {
        type: 'digital_tool',
        name: 'Habit Tracker Số',
        slug: 'habit-tracker-so',
        web: 'habit',
        saleStatus: 'on_sale',
        trialDays: 21,
      }
      const result = validateProductWizardData(draftData, { publish: false })
      expect(result.success).toBe(true)
    })

    it('rejects missing name or missing type', () => {
      const missingName = {
        type: 'digital_tool',
        name: '',
        slug: 'habit-tracker',
        web: 'habit',
      }
      const r1 = validateProductWizardData(missingName, { publish: false })
      expect(r1.success).toBe(false)
      if (!r1.success) {
        expect(r1.error).toBe(i18nVi.cms.wizard.errors.missingName)
      }

      const missingType = {
        type: 'invalid-type',
        name: 'Tên hợp lệ',
        slug: 'ten-hop-le',
        web: 'site',
      }
      const r2 = validateProductWizardData(missingType, { publish: false })
      expect(r2.success).toBe(false)
    })

    it('rejects invalid slug formats', () => {
      const invalidSlugs = ['Slug Co Hoa', 'slug với dấu', 'slug_under_score', 'slug/slash']
      for (const s of invalidSlugs) {
        const data = {
          type: 'digital_tool',
          name: 'Tên sản phẩm',
          slug: s,
          web: 'habit',
        }
        const res = validateProductWizardData(data, { publish: false })
        expect(res.success).toBe(false)
      }
    })

    it('publish mode: blocks on_sale product without price', () => {
      const dataWithoutPrice: ProductWizardInput = {
        type: 'digital_tool',
        name: 'Habit Tracker Số',
        slug: 'habit-tracker-so-test',
        web: 'habit',
        saleStatus: 'on_sale',
        coverImage: 1,
        // price missing
      }
      const res = validateProductWizardData(dataWithoutPrice, { publish: true })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toBe(i18nVi.cms.productForm.validation.missingPriceOnSale)
      }
    })

    it('publish mode: blocks on_sale product without cover image ', () => {
      const dataWithoutCover: ProductWizardInput = {
        type: 'digital_tool',
        name: 'Habit Tracker Số',
        slug: 'habit-tracker-so-cover-test',
        web: 'habit',
        saleStatus: 'on_sale',
        price: 250000,
        coverImage: null,
      }
      const res = validateProductWizardData(dataWithoutCover, { publish: true })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toBe(i18nVi.cms.productForm.validation.missingCoverImageOnSale)
      }
    })

    it('publish mode: allows physical_external without price if externalUrl is present', () => {
      const shopeeData: ProductWizardInput = {
        type: 'physical_external',
        name: 'Bộ Thẻ EQ Buddy Vật Lý',
        slug: 'bo-the-eq-buddy-vat-ly',
        web: 'eq',
        saleStatus: 'on_sale',
        externalUrl: 'https://shopee.vn/eq-buddy',
        externalLabel: 'Mua trên Shopee',
        coverImage: 1,
      }
      const res = validateProductWizardData(shopeeData, { publish: true })
      expect(res.success).toBe(true)
    })
  })

  describe('Server Action Integration (src/lib/cms/product-wizard.server.ts)', () => {
    let payload: Payload
    const createdDocs: { collection: CollectionSlug; id: number | string }[] = []
    const unique = () => `test-${randomUUID()}`

    let editorUser: { id: number; email: string; token?: string }
    let _customerUser: { id: number; email: string; token?: string }
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

      // Create test media for cover image tests
      const mediaDoc = await payload.create({
        collection: 'media',
        data: {
          alt: 'Ảnh minh họa test wizard',
        },
        file: {
          data: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64',
          ),
          mimetype: 'image/png',
          name: 'test-wizard.png',
          size: 68,
        },
      })
      testMediaId = mediaDoc.id
      createdDocs.push({ collection: 'media', id: testMediaId })

      // Create editor admin user
      const editorEmail = `editor-${unique()}@tramdungcamxuc.com`
      const editor = await payload.create({
        collection: 'users',
        data: {
          email: editorEmail,
          password: 'TestPassword123!',
          role: 'editor',
        },
      })
      createdDocs.push({ collection: 'users', id: editor.id })

      // Login to get token
      const editorLogin = await payload.login({
        collection: 'users',
        data: { email: editorEmail, password: 'TestPassword123!' },
      })
      editorUser = { id: editor.id, email: editorEmail, token: editorLogin.token }

      // Create non-admin customer user
      const customerEmail = `customer-${unique()}@tramdungcamxuc.com`
      const customer = await payload.create({
        collection: 'customers',
        data: {
          email: customerEmail,
          name: 'Customer Test',
        },
      })
      createdDocs.push({ collection: 'customers', id: customer.id })
      _customerUser = { id: customer.id, email: customerEmail }
    })

    afterAll(async () => {
      for (const item of createdDocs.reverse()) {
        try {
          await payload.delete({
            collection: item.collection,
            id: item.id,
            overrideAccess: true,
          })
        } catch {
          // ignore
        }
      }
    })

    it('rejects unauthenticated request or invalid session', async () => {
      // Empty headers -> no auth
      mockHeadersValue = new Headers()
      const data: ProductWizardInput = {
        type: 'digital_tool',
        name: 'Test Unauth',
        slug: `test-unauth-${unique()}`,
        web: 'habit',
        saleStatus: 'on_sale',
      }
      const res = await createProductFromWizard(data, { publish: false })
      expect(res.success).toBe(false)
      expect(res.error).toBe(i18nVi.cms.wizard.errors.unauthorized)
    })

    it('allows editor to create draft digital tool product', async () => {
      mockHeadersValue = new Headers({
        Authorization: `users JWT ${editorUser.token}`,
        cookie: `payload-token=${editorUser.token}`,
      })

      const slug = `habit-draft-${unique()}`
      const data: ProductWizardInput = {
        type: 'digital_tool',
        name: 'Habit Tracker Số Bản Nháp',
        slug,
        web: 'habit',
        saleStatus: 'on_sale',
        trialDays: 21,
        price: 250000,
        salePrice: 178000,
        shortDescription: 'Mô tả ngắn gọn',
        journeyStep: 'pause',
        includes: [{ text: 'Bảng theo dõi 21 ngày' }, { text: '10 cảm xúc' }],
        painPoint: 'Dễ nản lòng',
        outcome: 'Tạo đà vững chắc',
        faq: [{ question: 'Có cần cài app không?', answer: 'Không cần.' }],
      }

      const res = await createProductFromWizard(data, { publish: false })
      expect(res.success).toBe(true)
      expect(res.docId).toBeDefined()

      if (res.docId) {
        createdDocs.push({ collection: 'products', id: res.docId })

        // Fetch back doc from Payload
        const doc = await payload.findByID({
          collection: 'products',
          id: res.docId,
          draft: true,
          overrideAccess: true,
        })
        expect(doc).toBeDefined()
        expect(doc._status).toBe('draft')
        expect(doc.name).toBe(data.name)
        expect(doc.slug).toBe(data.slug)
        expect(doc.trialDays).toBe(21)
        expect(doc.price).toBe(250000)
        expect(doc.salePrice).toBe(178000)
        expect(doc.includes).toHaveLength(2)
        expect(doc.faq).toHaveLength(1)
      }
    })

    it('publishing without price when on_sale is blocked by validation', async () => {
      mockHeadersValue = new Headers({
        Authorization: `users JWT ${editorUser.token}`,
        cookie: `payload-token=${editorUser.token}`,
      })

      const slug = `no-price-${unique()}`
      const data: ProductWizardInput = {
        type: 'digital_tool',
        name: 'Sản Phẩm Thiếu Giá',
        slug,
        web: 'habit',
        saleStatus: 'on_sale',
        coverImage: testMediaId,
        // no price
      }

      const res = await createProductFromWizard(data, { publish: true })
      expect(res.success).toBe(false)
      expect(res.error).toBe(i18nVi.cms.productForm.validation.missingPriceOnSale)
    })

    it('ignores a client-sent isSample flag: publishing on_sale without cover stays blocked', async () => {
      mockHeadersValue = new Headers({
        Authorization: `users JWT ${editorUser.token}`,
        cookie: `payload-token=${editorUser.token}`,
      })

      const data = {
        type: 'digital_tool',
        name: 'Sản Phẩm Giả Mẫu',
        slug: `fake-sample-${unique()}`,
        web: 'habit',
        saleStatus: 'on_sale',
        price: 250000,
        isSample: true,
      } as unknown as ProductWizardInput

      const res = await createProductFromWizard(data, { publish: true })
      expect(res.success).toBe(false)
      expect(res.error).toBe(i18nVi.cms.productForm.validation.missingCoverImageOnSale)
    })

    it('creates package and automatically calculates totalValue and discountPercent', async () => {
      mockHeadersValue = new Headers({
        Authorization: `users JWT ${editorUser.token}`,
        cookie: `payload-token=${editorUser.token}`,
      })

      const slug = `pkg-test-${unique()}`
      const data: ProductWizardInput = {
        type: 'package',
        name: 'Gói Đồng Hành Test',
        slug,
        web: 'site',
        saleStatus: 'on_sale',
        price: 2900000,
        components: [
          {
            label: 'Coaching 1:1',
            quantity: 3,
            unitValue: 1000000,
            retailPrice: 1500000,
          },
          {
            label: 'Workshop Tập thương cảm xúc',
            quantity: 2,
            unitValue: 500000,
          },
        ],
      }

      // Total expected value = (3 * 1,000,000) + (2 * 500,000) = 4,000,000
      // Price = 2,900,000 -> Discount = round((4,000,000 - 2,900,000) / 4,000,000 * 100) = 28%
      const res = await createProductFromWizard(data, { publish: false })
      expect(res.success).toBe(true)
      expect(res.docId).toBeDefined()

      if (res.docId) {
        createdDocs.push({ collection: 'products', id: res.docId })

        const doc = await payload.findByID({
          collection: 'products',
          id: res.docId,
          draft: true,
          overrideAccess: true,
        })
        expect(doc.totalValue).toBe(4000000)
        expect(doc.discountPercent).toBe(28)
      }
    })

    it('updates existing draft when docId is provided', async () => {
      mockHeadersValue = new Headers({
        Authorization: `users JWT ${editorUser.token}`,
        cookie: `payload-token=${editorUser.token}`,
      })

      const slug = `update-draft-${unique()}`
      const initialData: ProductWizardInput = {
        type: 'digital_tool',
        name: 'Ban Dau',
        slug,
        web: 'habit',
        saleStatus: 'on_sale',
        trialDays: 21,
      }

      const createRes = await createProductFromWizard(initialData, { publish: false })
      expect(createRes.success).toBe(true)
      const docId = createRes.docId!
      createdDocs.push({ collection: 'products', id: docId })

      // Now update the draft
      const updateData: ProductWizardInput = {
        ...initialData,
        name: 'Sau Khi Doi Ten',
        shortDescription: 'Da cap nhat mo ta',
      }

      const updateRes = await createProductFromWizard(updateData, {
        publish: false,
        docId,
      })
      expect(updateRes.success).toBe(true)
      expect(updateRes.docId).toBe(docId)

      const updatedDoc = await payload.findByID({
        collection: 'products',
        id: docId,
        draft: true,
        overrideAccess: true,
      })
      expect(updatedDoc.name).toBe('Sau Khi Doi Ten')
      expect(updatedDoc.shortDescription).toBe('Da cap nhat mo ta')
    })
  })
})
