import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

import { LeadMagnetCarousel, type LeadMagnetItem } from '@/components/site/LeadMagnetCarousel'
import { resolveServerData } from '@/puck/resolve.server'
import { showForTypesOrFree } from '@/lib/cms/product-form'
import * as trackModule from '@/lib/analytics/track'
import type { Product } from '@/payload-types'

// Mock track function
vi.spyOn(trackModule, 'track').mockImplementation(() => {})

const mockProductsList: Product[] = [
  // 1. Có file đính kèm
  {
    id: 101,
    name: '[MẪU] Cẩm nang Có File',
    slug: 'cam-nang-co-file',
    web: 'site',
    type: 'ebook',
    saleStatus: 'free',
    shortDescription: 'Tài liệu hướng dẫn tải về',
    files: [{ id: 1, file: { id: 11, filename: 'cam-nang.pdf' } }],
    coverImage: null,
    _status: 'published',
  } as unknown as Product,
  // 2. Không file + có link trong web (/habit/chan-doan) + ctaLabel riêng
  {
    id: 102,
    name: '[MẪU] Chẩn đoán Thói quen',
    slug: 'chan-doan-thoi-quen',
    web: 'habit',
    type: 'digital_tool',
    saleStatus: 'free',
    shortDescription: 'Công cụ chẩn đoán trực tuyến',
    files: [],
    externalUrl: '/habit/chan-doan',
    ctaLabel: 'Làm bài test ngay',
    coverImage: null,
    _status: 'published',
  } as unknown as Product,
  // 3. Không file + link ngoài https://
  {
    id: 103,
    name: '[MẪU] Công cụ Shopee Ngoài',
    slug: 'cong-cu-ngoai',
    web: 'site',
    type: 'digital_tool',
    saleStatus: 'free',
    shortDescription: 'Liên kết tới trang đối tác',
    files: [],
    externalUrl: 'https://shopee.vn/product-sample',
    coverImage: null,
    _status: 'published',
  } as unknown as Product,
  // 4. Không file + không link -> bị loại
  {
    id: 104,
    name: '[MẪU] Không file không link',
    slug: 'khong-file-khong-link',
    web: 'site',
    type: 'digital_tool',
    saleStatus: 'free',
    files: [],
    coverImage: null,
    _status: 'published',
  } as unknown as Product,
  // 5. Không file + link nguy hiểm javascript: -> bị loại bởi safeHref
  {
    id: 105,
    name: '[MẪU] Link nguy hiểm',
    slug: 'link-nguy-hiem',
    web: 'site',
    type: 'digital_tool',
    saleStatus: 'free',
    files: [],
    externalUrl: 'javascript:alert(1)',
    coverImage: null,
    _status: 'published',
  } as unknown as Product,
  // 6. Có cả file và link -> ưu tiên file (giữ luồng thu lead)
  {
    id: 106,
    name: '[MẪU] Vừa có file vừa có link',
    slug: 'vua-file-vua-link',
    web: 'site',
    type: 'toolkit',
    saleStatus: 'free',
    files: [{ id: 2, file: { id: 12, filename: 'toolkit.pdf' } }],
    externalUrl: 'https://example.test/tool',
    coverImage: null,
    _status: 'published',
  } as unknown as Product,
]

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    find: vi.fn(async ({ collection, where }) => {
      if (collection === 'products') {
        let docs = [...mockProductsList]
        const andClauses = Array.isArray(where?.and) ? where.and : [where]
        for (const clause of andClauses) {
          if (!clause) continue
          if (Array.isArray(clause?.id?.in)) {
            docs = docs.filter((p) => clause.id.in.includes(p.id))
          }
          if (clause?.saleStatus?.equals) {
            docs = docs.filter((p) => p.saleStatus === clause.saleStatus.equals)
          }
          if (clause?._status?.equals) {
            docs = docs.filter((p) => p._status === clause._status.equals)
          }
        }
        return { docs }
      }
      return { docs: [] }
    }),
  })),
}))

vi.mock('@/payload.config', () => ({
  default: Promise.resolve({}),
}))

describe('PK-27: LeadMagnetCarousel free link card & resource resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Server Data Resolution (resolveServerData)', () => {
    it('resolves products in auto mode according to file and externalUrl rules', async () => {
      const puckData = {
        content: [
          {
            type: 'LeadMagnetCarousel',
            props: {
              id: 'test-carousel-auto',
              mode: 'auto',
            },
          },
        ],
        root: { props: { title: 'Test' } },
        zones: {},
      }

      const resolved = await resolveServerData(puckData)
      const block = resolved.content.find((b) => b.type === 'LeadMagnetCarousel')
      expect(block).toBeDefined()

      const items = (block?.props as { _resolved?: { items?: LeadMagnetItem[] } })?._resolved?.items
      expect(items).toBeDefined()
      expect(Array.isArray(items)).toBe(true)

      // 1. Có file: href = /tai-nguyen/slug, isExternal = false
      const itemFile = items?.find((i) => i.id === 101)
      expect(itemFile).toBeDefined()
      expect(itemFile?.href).toBe('/tai-nguyen/cam-nang-co-file')
      expect(itemFile?.isExternal).toBe(false)
      expect(itemFile?.ctaLabel).toBeNull()

      // 2. Không file + link trong web (/habit/chan-doan): href đúng, isExternal = false, có ctaLabel
      const itemInternal = items?.find((i) => i.id === 102)
      expect(itemInternal).toBeDefined()
      expect(itemInternal?.href).toBe('/habit/chan-doan')
      expect(itemInternal?.isExternal).toBe(false)
      expect(itemInternal?.ctaLabel).toBe('Làm bài test ngay')

      // 3. Không file + link ngoài https://: isExternal = true
      const itemExternal = items?.find((i) => i.id === 103)
      expect(itemExternal).toBeDefined()
      expect(itemExternal?.href).toBe('https://shopee.vn/product-sample')
      expect(itemExternal?.isExternal).toBe(true)

      // 4. Không file + không link: bị loại
      expect(items?.some((i) => i.id === 104)).toBe(false)

      // 5. Link nguy hiểm (javascript:): bị loại
      expect(items?.some((i) => i.id === 105)).toBe(false)

      // 6. Có cả file và link: file được ưu tiên
      const itemBoth = items?.find((i) => i.id === 106)
      expect(itemBoth).toBeDefined()
      expect(itemBoth?.href).toBe('/tai-nguyen/vua-file-vua-link')
      expect(itemBoth?.isExternal).toBe(false)
    })

    it('resolves products in manual mode, preserving order and filtering invalid ones', async () => {
      const puckData = {
        content: [
          {
            type: 'LeadMagnetCarousel',
            props: {
              id: 'test-carousel-manual',
              mode: 'manual',
              manualProducts: [
                { productId: 103 }, // external link
                { productId: 104 }, // no file no link -> filtered
                { productId: 102 }, // internal link
                { productId: 105 }, // unsafe link -> filtered
                { productId: 101 }, // file
              ],
            },
          },
        ],
        root: { props: { title: 'Test' } },
        zones: {},
      }

      const resolved = await resolveServerData(puckData)
      const block = resolved.content.find((b) => b.type === 'LeadMagnetCarousel')
      const items = (block?.props as { _resolved?: { items?: LeadMagnetItem[] } })?._resolved?.items

      expect(items).toBeDefined()
      expect(items?.length).toBe(3)
      expect(items?.map((i) => i.id)).toEqual([103, 102, 101])
    })
  })

  describe('LeadMagnetCarousel Component Rendering', () => {
    it('renders default button label "Nhận tài liệu" for file-based resource in list mode', () => {
      const items: LeadMagnetItem[] = [
        {
          id: 1,
          name: 'Cẩm nang Ebook',
          slug: 'cam-nang-ebook',
          href: '/tai-nguyen/cam-nang-ebook',
          isExternal: false,
        },
      ]

      render(<LeadMagnetCarousel display="list" items={items} />)
      const link = screen.getByRole('link', { name: /Nhận tài liệu/i })
      expect(link).toBeTruthy()
      expect(link.getAttribute('href')).toBe('/tai-nguyen/cam-nang-ebook')
      expect(link.getAttribute('target')).toBeNull()
    })

    it('renders default button label "Dùng miễn phí" for link-only resource in list mode', () => {
      const items: LeadMagnetItem[] = [
        {
          id: 2,
          name: 'Bài test thói quen',
          slug: 'test-thoi-quen',
          href: '/habit/chan-doan',
          isExternal: false,
        },
      ]

      render(<LeadMagnetCarousel display="list" items={items} />)
      const link = screen.getByRole('link', { name: /Dùng miễn phí/i })
      expect(link).toBeTruthy()
      expect(link.getAttribute('href')).toBe('/habit/chan-doan')
      expect(link.getAttribute('target')).toBeNull()
    })

    it('renders custom ctaLabel when provided', () => {
      const items: LeadMagnetItem[] = [
        {
          id: 2,
          name: 'Bài test thói quen',
          slug: 'test-thoi-quen',
          href: '/habit/chan-doan',
          ctaLabel: 'Khám phá ngay',
        },
      ]

      render(<LeadMagnetCarousel display="list" items={items} />)
      const link = screen.getByRole('link', { name: /Khám phá ngay/i })
      expect(link).toBeTruthy()
      expect(link.getAttribute('href')).toBe('/habit/chan-doan')
    })

    it('external links render target="_blank" + rel and trigger external_clicked event on click', () => {
      const items: LeadMagnetItem[] = [
        {
          id: 3,
          name: 'Công cụ ngoài',
          slug: 'cong-cu-ngoai',
          href: 'https://shopee.vn/partner',
          isExternal: true,
          ctaLabel: 'Mở Shopee',
        },
      ]

      render(<LeadMagnetCarousel display="list" items={items} />)
      const link = screen.getByRole('link', { name: /Mở Shopee/i })
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')

      fireEvent.click(link)
      expect(trackModule.track).toHaveBeenCalledWith('external_clicked', {
        url: 'https://shopee.vn/partner',
        productSlug: 'cong-cu-ngoai',
      })
    })

    it('internal links open in same tab and do not trigger external_clicked on click', () => {
      const items: LeadMagnetItem[] = [
        {
          id: 2,
          name: 'Chẩn đoán nội bộ',
          slug: 'chan-doan-noi-bo',
          href: '/habit/chan-doan',
          isExternal: false,
        },
      ]

      render(<LeadMagnetCarousel display="list" items={items} />)
      const link = screen.getByRole('link', { name: /Dùng miễn phí/i })
      expect(link.getAttribute('target')).toBeNull()

      fireEvent.click(link)
      expect(trackModule.track).not.toHaveBeenCalled()
    })

    it('renders action link button in carousel mode for link-only tools', () => {
      const items: LeadMagnetItem[] = [
        {
          id: 2,
          name: 'Chẩn đoán điểm kẹt',
          slug: 'chan-doan-diem-ket',
          href: '/habit/chan-doan',
          isExternal: false,
          ctaLabel: 'Làm bài chẩn đoán',
        },
      ]

      render(<LeadMagnetCarousel display="carousel" items={items} />)
      const button = screen.getByRole('link', { name: /Làm bài chẩn đoán/i })
      expect(button).toBeTruthy()
      expect(button.getAttribute('href')).toBe('/habit/chan-doan')
    })
  })

  describe('CMS condition showForTypesOrFree', () => {
    const condition = showForTypesOrFree([
      'physical_external',
      'coaching_trial',
      'workshop',
      'community',
      'b2b',
    ])

    it('returns true when saleStatus is free regardless of product type', () => {
      expect(condition({ type: 'digital_tool', saleStatus: 'free' })).toBe(true)
      expect(condition({ type: 'ebook', saleStatus: 'free' })).toBe(true)
      expect(condition({ type: 'toolkit', saleStatus: 'free' })).toBe(true)
      expect(condition(undefined, { type: 'digital_tool', saleStatus: 'free' })).toBe(true)
    })

    it('returns false when digital_tool or ebook is on_sale', () => {
      expect(condition({ type: 'digital_tool', saleStatus: 'on_sale' })).toBe(false)
      expect(condition({ type: 'ebook', saleStatus: 'on_sale' })).toBe(false)
      expect(condition({ type: 'toolkit', saleStatus: 'on_sale' })).toBe(false)
    })

    it('returns true when product type is in allowedTypes even if on_sale', () => {
      expect(condition({ type: 'physical_external', saleStatus: 'on_sale' })).toBe(true)
      expect(condition({ type: 'workshop', saleStatus: 'on_sale' })).toBe(true)
      expect(condition({ type: 'coaching_trial', saleStatus: 'on_sale' })).toBe(true)
    })

    it('returns false when neither condition is met', () => {
      expect(condition({})).toBe(false)
      expect(condition({ type: null, saleStatus: null })).toBe(false)
    })
  })
})
