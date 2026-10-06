import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('server-only', () => ({}))

import type { Data } from '@puckeditor/core'
import type { Product } from '@/payload-types'
import { puckConfig } from '@/puck/config'
import { resolveServerData } from '@/puck/resolve.server'
import { useClientProducts, useClientProduct, clearClientPreviewCache } from '@/puck/client-preview'
import { ProductGrid } from '@/components/site/ProductGrid'
import type { PublicProduct } from '@/lib/products'

// Mock payload for resolveServerData unit testing
const mockProducts: Product[] = [
  {
    id: 101,
    name: '[MẪU] Habit Tracker Số 21 Ngày',
    slug: 'habit-tracker-so',
    web: 'habit',
    type: 'digital_tool',
    journeyStep: 'practice',
    shortDescription: 'Công cụ rèn luyện thói quen bền bỉ',
    price: 250000,
    salePrice: 178000,
    trialDays: 21,
    saleStatus: 'on_sale',
    includes: [{ item: 'Tracker 21 ngày' }, { item: '20 Video hướng dẫn' }],
    files: [
      {
        id: 1,
        file: {
          id: 99,
          filename: 'secret-paid-tracker.pdf',
          url: '/media/secret-paid-tracker.pdf',
        },
      },
    ],
    coverImage: {
      id: 1,
      alt: 'Habit Tracker',
      url: '/brand/sample-cover.svg',
      updatedAt: '',
      createdAt: '',
    },
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  } as unknown as Product,
  {
    id: 102,
    name: '[MẪU] EQ Buddy Số 26 Thẻ',
    slug: 'eq-buddy-so',
    web: 'eq',
    type: 'digital_tool',
    journeyStep: 'feel',
    shortDescription: 'Bộ thẻ đồng hành nhận diện cảm xúc',
    price: 250000,
    salePrice: 178000,
    trialDays: 21,
    saleStatus: 'on_sale',
    includes: [{ item: '26 Thẻ cảm xúc' }],
    coverImage: {
      id: 2,
      alt: 'EQ Buddy',
      url: '/brand/sample-cover.svg',
      updatedAt: '',
      createdAt: '',
    },
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  } as unknown as Product,
  {
    id: 103,
    name: '[MẪU] Sản phẩm bí mật (Ẩn)',
    slug: 'san-pham-an',
    web: 'site',
    type: 'ebook',
    saleStatus: 'hidden',
    price: 500000,
    salePrice: null,
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  } as unknown as Product,
  {
    id: 201,
    name: 'CLEAR',
    slug: 'growth-mirror-clear',
    web: 'site',
    type: 'package',
    price: 1750000,
    salePrice: null,
    saleStatus: 'consult',
    components: [
      { label: 'Bộ công cụ số Habit Tracker + EQ Buddy', quantity: 1, unitValue: 500000 },
      { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
      { label: 'Coaching 1:1 "Vững vàng chuyển mình"', quantity: 1, unitValue: 1000000 },
    ],
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  } as unknown as Product,
  {
    id: 202,
    name: 'BUILD',
    slug: 'growth-mirror-build',
    web: 'site',
    type: 'package',
    price: 2900000,
    salePrice: null,
    saleStatus: 'consult',
    components: [
      { label: 'Bộ công cụ số Habit Tracker + EQ Buddy', quantity: 1, unitValue: 500000 },
      { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
      { label: 'Coaching 1:1 "Vững vàng chuyển mình"', quantity: 3, unitValue: 1000000 },
      { label: 'Tư vấn hướng nghiệp', quantity: 1, unitValue: 1000000 },
      { label: 'Cộng đồng private', quantity: 1, unitValue: 300000 },
    ],
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  } as unknown as Product,
]

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    find: vi.fn(async ({ where }) => {
      // Find matching products
      const idsClause = where?.and?.find((c: Record<string, Record<string, unknown>>) => c?.id?.in)
      const allowedIds: unknown[] = (idsClause?.id?.in as unknown[]) || []
      const docs = mockProducts.filter(
        (p) => allowedIds.includes(p.id) || allowedIds.includes(String(p.id)),
      )
      return { docs }
    }),
    findByID: vi.fn(async ({ id }) => {
      return mockProducts.find((p) => p.id === Number(id)) || null
    }),
  })),
}))

vi.mock('@/payload.config', () => ({
  default: Promise.resolve({}),
}))

describe('T1-02a: Puck Sales Blocks – Bán hàng', () => {
  const salesBlockKeys = [
    'ProductGrid',
    'ProductFeature',
    'PackageComparison',
    'PriceTag',
    'TrialCTA',
  ] as const

  describe('Anti-data-leak protection (Test chống lưu dữ liệu)', () => {
    const forbiddenDataKeys = ['name', 'price', 'salePrice', 'components']

    it('ensures defaultProps of all 5 sales blocks never contain static product data', () => {
      for (const key of salesBlockKeys) {
        const block = puckConfig.components[key]
        expect(block, `Block ${key} must exist in puckConfig`).toBeDefined()
        const defaultProps = block.defaultProps || {}

        for (const forbidden of forbiddenDataKeys) {
          expect(
            forbidden in defaultProps,
            `Block ${key}.defaultProps MUST NOT have key "${forbidden}". Puck data should only store IDs and display options!`,
          ).toBe(false)
        }
      }
    })

    it('ensures fields configuration of all 5 sales blocks has no fields for name, price, salePrice, or components', () => {
      const inspectFields = (fields: Record<string, unknown>, blockName: string) => {
        for (const fieldName of Object.keys(fields)) {
          for (const forbidden of forbiddenDataKeys) {
            expect(
              fieldName.toLowerCase() === forbidden.toLowerCase(),
              `Block ${blockName} field "${fieldName}" matches forbidden key "${forbidden}".`,
            ).toBe(false)
          }

          const fieldConfig = fields[fieldName] as {
            type?: string
            objectFields?: Record<string, unknown>
            arrayFields?: Record<string, unknown>
          }
          if (fieldConfig?.type === 'object' && fieldConfig.objectFields) {
            inspectFields(fieldConfig.objectFields, blockName)
          }
          if (fieldConfig?.type === 'array' && fieldConfig.arrayFields) {
            inspectFields(fieldConfig.arrayFields, blockName)
          }
        }
      }

      for (const key of salesBlockKeys) {
        const block = puckConfig.components[key]
        if (block.fields) {
          inspectFields(block.fields as Record<string, unknown>, key)
        }
      }
    })

    it('ensures none of the 5 sales blocks have resolveData injecting product data', () => {
      for (const key of salesBlockKeys) {
        const block = puckConfig.components[key]
        expect(
          block.resolveData,
          `Block ${key} MUST NOT use resolveData to copy product data into props. Product data is resolved on server during render.`,
        ).toBeUndefined()
      }
    })
  })

  describe('Snapshot rendering of all 5 sales blocks with mock _resolved data', () => {
    it('renders ProductGrid matching snapshot with resolved products', () => {
      const block = puckConfig.components.ProductGrid
      const markup = renderToStaticMarkup(
        block.render({
          ...block.defaultProps,
          _resolved: {
            products: [mockProducts[0], mockProducts[1]],
          },
          puck: { isEditing: false, renderDropZone: () => null },
          editMode: false,
        } as never),
      )
      expect(markup).toMatchSnapshot()
    })

    it('renders ProductFeature matching snapshot with resolved product', () => {
      const block = puckConfig.components.ProductFeature
      const markup = renderToStaticMarkup(
        block.render({
          ...block.defaultProps,
          productId: 101,
          _resolved: {
            product: mockProducts[0],
          },
          puck: { isEditing: false, renderDropZone: () => null },
          editMode: false,
        } as never),
      )
      expect(markup).toMatchSnapshot()
    })

    it('renders PackageComparison matching snapshot with resolved packages', () => {
      const block = puckConfig.components.PackageComparison
      const markup = renderToStaticMarkup(
        block.render({
          ...block.defaultProps,
          _resolved: {
            packages: [mockProducts[3], mockProducts[4]],
          },
          puck: { isEditing: false, renderDropZone: () => null },
          editMode: false,
        } as never),
      )
      expect(markup).toMatchSnapshot()
    })

    it('renders PriceTag matching snapshot with resolved product', () => {
      const block = puckConfig.components.PriceTag
      const markup = renderToStaticMarkup(
        block.render({
          ...block.defaultProps,
          productId: 101,
          _resolved: {
            product: mockProducts[0],
          },
          puck: { isEditing: false, renderDropZone: () => null },
          editMode: false,
        } as never),
      )
      expect(markup).toMatchSnapshot()
    })

    it('renders TrialCTA matching snapshot with resolved product', () => {
      const block = puckConfig.components.TrialCTA
      const markup = renderToStaticMarkup(
        block.render({
          ...block.defaultProps,
          productId: 101,
          _resolved: {
            product: mockProducts[0],
          },
          puck: { isEditing: false, renderDropZone: () => null },
          editMode: false,
        } as never),
      )
      expect(markup).toMatchSnapshot()
    })
  })

  describe('resolveServerData integration with nested Columns and hidden filtering', () => {
    it('resolves product in nested Columns slot and ignores hidden product', async () => {
      const inputData: Data = {
        root: {},
        content: [
          {
            type: 'Columns',
            props: {
              id: 'col-1',
              col1: [
                {
                  type: 'ProductFeature',
                  props: {
                    id: 'pf-1',
                    productId: 101, // Published active product
                  },
                },
              ],
              col2: [
                {
                  type: 'PriceTag',
                  props: {
                    id: 'pt-1',
                    productId: 103, // Hidden product
                  },
                },
              ],
            },
          },
        ],
      }

      const resolved = await resolveServerData(inputData)

      // Column 1 ProductFeature should have _resolved.product with ID 101
      const rootItem = resolved.content[0] as {
        props: {
          col1: Array<{ props: { _resolved?: { product?: Product | null } } }>
          col2: Array<{ props: { _resolved?: { product?: Product | null } } }>
        }
      }
      const col1Item = rootItem.props.col1[0]
      expect(col1Item.props._resolved).toBeDefined()
      expect(col1Item.props._resolved?.product).toBeDefined()
      expect(col1Item.props._resolved?.product?.id).toBe(101)
      expect(col1Item.props._resolved?.product?.name).toBe('[MẪU] Habit Tracker Số 21 Ngày')

      // Column 2 PriceTag should have _resolved.product as null because ID 103 is hidden
      const col2Item = rootItem.props.col2[0]
      expect(col2Item.props._resolved).toBeDefined()
      expect(col2Item.props._resolved?.product).toBeNull()

      // Security Anti-data-leak: resolvedData stringified must NOT contain paid files or filenames
      const serialized = JSON.stringify(resolved)
      expect(serialized).not.toContain('secret-paid-tracker.pdf')
      expect(serialized).not.toContain('"files"')
    })
  })

  describe('Client preview fetch deduplication (single fetch per key, no infinite loop)', () => {
    beforeEach(() => {
      clearClientPreviewCache()
      vi.restoreAllMocks()
    })

    it('invokes fetch exactly once when useClientProducts is rendered 5 times with fresh array references of the same ID', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            docs: [
              {
                id: 101,
                name: '[MẪU] Habit Tracker Số 21 Ngày',
                slug: 'habit-tracker-so',
                price: 250000,
                salePrice: 178000,
                saleStatus: 'on_sale',
              },
            ],
          }),
        }),
      )
      globalThis.fetch = mockFetch

      // Initial render with fresh array instance [101]
      const { rerender } = renderHook(
        ({ ids }) => useClientProducts({ productIds: ids, mode: 'manual' }),
        { initialProps: { ids: [101] } },
      )

      // Re-render 4 more times with brand new array references containing the same ID
      rerender({ ids: [101] })
      rerender({ ids: [101] })
      rerender({ ids: [101] })
      rerender({ ids: [101] })

      // Must be called exactly 1 time across all 5 renders!
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('invokes fetch exactly once when useClientProduct is rendered 5 times with the same productId', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            id: 101,
            name: '[MẪU] Habit Tracker Số 21 Ngày',
            slug: 'habit-tracker-so',
            price: 250000,
            salePrice: 178000,
            saleStatus: 'on_sale',
          }),
        }),
      )
      globalThis.fetch = mockFetch

      const { rerender } = renderHook(({ id }) => useClientProduct(id), {
        initialProps: { id: 101 },
      })

      rerender({ id: 101 })
      rerender({ id: 101 })
      rerender({ id: 101 })
      rerender({ id: 101 })

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Server-side rendering (SSR) with _resolved data', () => {
    it('renders ProductGrid with sample _resolved via renderToString containing product name and price without loading text', () => {
      const sampleProduct: PublicProduct = {
        id: 101,
        name: 'Khóa học EQ Chữa Lành Mẫu',
        slug: 'khoa-hoc-eq-chua-lanh',
        price: 250000,
        salePrice: 178000,
        saleStatus: 'on_sale',
      }

      const html = renderToString(
        <ProductGrid
          _resolved={{
            products: [sampleProduct],
          }}
        />,
      )

      // HTML on server must directly contain product name and price
      expect(html).toContain('Khóa học EQ Chữa Lành Mẫu')
      expect(html).toContain('178.000')
      expect(html).toContain('250.000')

      // Must not render loading text on initial server render
      expect(html).not.toContain('Đang tải dữ liệu sản phẩm...')
    })
  })
})
