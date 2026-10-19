import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { ResourcePostsSlot } from '@/components/site/ResourcePostsSlot'
import { LeadMagnetCarousel, type LeadMagnetItem } from '@/components/site/LeadMagnetCarousel'
import { NewsletterForm } from '@/components/site/NewsletterForm'
import { puckConfig } from '@/puck/config'
import { resolveServerData } from '@/puck/resolve.server'
import type { Product } from '@/payload-types'

// Mock products for resolveServerData testing
const mockProducts: Product[] = [
  {
    id: 1,
    name: '[MẪU] Cẩm nang Cảm xúc Miễn phí',
    slug: 'cam-nang-cam-xuc-free',
    web: 'site',
    type: 'ebook',
    saleStatus: 'free',
    shortDescription: 'Cẩm nang hướng dẫn nhận diện cảm xúc',
    files: [
      {
        id: 11,
        file: {
          id: 111,
          filename: 'cam-nang.pdf',
        },
      },
    ],
    coverImage: null,
    _status: 'published',
    updatedAt: '2026-10-19T00:00:00Z',
    createdAt: '2026-10-19T00:00:00Z',
  } as unknown as Product,
  {
    id: 2,
    name: '[MẪU] Toolkit Thói quen Miễn phí',
    slug: 'toolkit-thoi-quen-free',
    web: 'habit',
    type: 'toolkit',
    saleStatus: 'free',
    shortDescription: 'Bộ công cụ rèn luyện thói quen',
    files: [
      {
        id: 12,
        file: {
          id: 112,
          filename: 'toolkit.pdf',
        },
      },
    ],
    coverImage: null,
    _status: 'published',
    updatedAt: '2026-10-19T00:00:00Z',
    createdAt: '2026-10-19T00:00:00Z',
  } as unknown as Product,
  {
    id: 3,
    name: '[MẪU] Sản phẩm Trả phí (Paid)',
    slug: 'san-pham-tra-phi',
    web: 'site',
    type: 'ebook',
    price: 250000,
    saleStatus: 'on_sale',
    files: [{ id: 13, file: { id: 113, filename: 'paid.pdf' } }],
    _status: 'published',
    updatedAt: '2026-10-19T00:00:00Z',
    createdAt: '2026-10-19T00:00:00Z',
  } as unknown as Product,
  {
    id: 4,
    name: '[MẪU] Sản phẩm Ẩn (Hidden)',
    slug: 'san-pham-an',
    web: 'site',
    type: 'ebook',
    saleStatus: 'hidden',
    files: [{ id: 14, file: { id: 114, filename: 'hidden.pdf' } }],
    _status: 'published',
    updatedAt: '2026-10-19T00:00:00Z',
    createdAt: '2026-10-19T00:00:00Z',
  } as unknown as Product,
  {
    id: 5,
    name: '[MẪU] Sản phẩm Miễn phí nhưng Bản nháp (Draft)',
    slug: 'san-pham-draft',
    web: 'site',
    type: 'ebook',
    saleStatus: 'free',
    files: [{ id: 15, file: { id: 115, filename: 'draft.pdf' } }],
    _status: 'draft',
    updatedAt: '2026-10-19T00:00:00Z',
    createdAt: '2026-10-19T00:00:00Z',
  } as unknown as Product,
  {
    id: 6,
    name: '[MẪU] Sản phẩm Miễn phí nhưng không có file đính kèm',
    slug: 'san-pham-khong-file',
    web: 'site',
    type: 'ebook',
    saleStatus: 'free',
    files: [],
    _status: 'published',
    updatedAt: '2026-10-19T00:00:00Z',
    createdAt: '2026-10-19T00:00:00Z',
  } as unknown as Product,
]

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    find: vi.fn(async ({ collection, where }) => {
      if (collection === 'products') {
        let docs = [...mockProducts]

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
          if (clause?.saleStatus?.not_equals === 'hidden') {
            docs = docs.filter((p) => p.saleStatus !== 'hidden')
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

describe('SM-05: Puck Blocks Unit & Snapshot Tests', () => {
  describe('ResourcePostsSlot Block', () => {
    it('renders null when not in editing mode', () => {
      const { container } = render(<ResourcePostsSlot puck={{ isEditing: false }} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders editor dashed hint placeholder when in editing mode', () => {
      render(<ResourcePostsSlot puck={{ isEditing: true }} />)
      expect(screen.getByRole('region')).toBeTruthy()
      expect(screen.getByText(/Vị trí danh sách bài viết/i)).toBeTruthy()
    })

    it('matches snapshot in editing mode', () => {
      const { asFragment } = render(<ResourcePostsSlot puck={{ isEditing: true }} />)
      expect(asFragment()).toMatchSnapshot()
    })
  })

  describe('LeadMagnetCarousel Block', () => {
    const mockItems: LeadMagnetItem[] = [
      {
        id: 1,
        name: '[MẪU] Cẩm nang Cảm xúc Miễn phí',
        slug: 'cam-nang-cam-xuc-free',
        shortDescription: 'Tài liệu hướng dẫn 26 sắc thái cảm xúc',
        topic: 'eq',
        coverImage: null,
      },
      {
        id: 2,
        name: '[MẪU] Toolkit Thói quen Miễn phí',
        slug: 'toolkit-thoi-quen-free',
        shortDescription: 'Bộ công cụ rèn luyện thói quen 21 ngày',
        topic: 'habit',
        coverImage: null,
      },
    ]

    it('renders null on public site when items array is empty', () => {
      const { container } = render(
        <LeadMagnetCarousel puck={{ isEditing: false }} _resolved={{ items: [] }} />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders editor empty placeholder when items array is empty and isEditing is true', () => {
      render(<LeadMagnetCarousel puck={{ isEditing: true }} _resolved={{ items: [] }} />)
      expect(screen.getByText(/Chưa có tài nguyên miễn phí/i)).toBeTruthy()
    })

    it('renders carousel with resolved items and matches snapshot', () => {
      const { asFragment } = render(
        <LeadMagnetCarousel
          seriesLabel="Tài nguyên nhận ngay"
          titleLine1="CÔNG CỤ & TÀI LIỆU"
          titleLine2="ĐỒNG HÀNH MIỄN PHÍ"
          emotionLine="Những tài liệu đúc kết từ thực tế"
          _resolved={{ items: mockItems }}
          isDemo={true}
        />,
      )
      expect(asFragment()).toMatchSnapshot()
      expect(screen.getByText('[MẪU] Cẩm nang Cảm xúc Miễn phí')).toBeTruthy()
      expect(screen.getByText('[MẪU] Toolkit Thói quen Miễn phí')).toBeTruthy()
    })
  })

  describe('NewsletterForm Block', () => {
    it('renders newsletter form with default props and matches snapshot', () => {
      const { asFragment } = render(
        <NewsletterForm
          title="[MẪU] NHẬN BẢN TIN TỪ TRẠM DỪNG CẢM XÚC"
          description="Đăng ký nhận bài viết mới nhất"
          submitLabel="Đăng ký nhận tin"
          isDemo={true}
        />,
      )
      expect(asFragment()).toMatchSnapshot()
      expect(screen.getByText('[MẪU] NHẬN BẢN TIN TỪ TRẠM DỪNG CẢM XÚC')).toBeTruthy()
      expect(screen.getByText('Đăng ký nhận tin')).toBeTruthy()
    })
  })

  describe('Client Component Isolation (Lỗi SM-03/SM-04)', () => {
    it('ensures no function props are passed to client components from Puck config renderers', () => {
      const dummyPuck = {
        isEditing: true,
        renderDropZone: () => null,
        history: { back: () => null, forward: () => null },
      }

      function assertNoFunctionProps(obj: unknown, path = '') {
        if (!obj || typeof obj !== 'object' || React.isValidElement(obj)) {
          return
        }
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key
          expect(typeof value, `Prop at ${currentPath} must not be a function`).not.toBe('function')
          if (value && typeof value === 'object') {
            assertNoFunctionProps(value, currentPath)
          }
        }
      }

      const sm05Blocks = [
        'ResourcePostsSlot',
        'LeadMagnetCarousel',
        'NewsletterForm',
      ] as const

      for (const blockName of sm05Blocks) {
        const config = (
          puckConfig.components as unknown as Record<
            string,
            { defaultProps?: Record<string, unknown>; render: (props: unknown) => React.ReactNode }
          >
        )[blockName]

        expect(config, `Block ${blockName} must be registered in puckConfig`).toBeDefined()
        const rendered = config.render({
          ...config.defaultProps,
          puck: dummyPuck,
        })

        expect(React.isValidElement(rendered), `${blockName} render must return a valid React element`).toBe(true)
        if (React.isValidElement(rendered)) {
          assertNoFunctionProps(
            (rendered as React.ReactElement<Record<string, unknown>>).props,
            blockName,
          )
        }
      }
    })
  })

  describe('LeadMagnetCarousel Server Data Resolution (resolveServerData)', () => {
    it('filters products in auto mode: only published, free, and has files', async () => {
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
      const carouselBlock = resolved.content.find((b) => b.type === 'LeadMagnetCarousel')
      expect(carouselBlock).toBeDefined()

      const resolvedItems = (
        carouselBlock?.props as { _resolved?: { items?: LeadMagnetItem[] } }
      )._resolved?.items

      expect(resolvedItems).toBeDefined()
      expect(Array.isArray(resolvedItems)).toBe(true)

      // Products 1 and 2 are free + published + have files
      expect(resolvedItems?.some((i) => i.id === 1)).toBe(true)
      expect(resolvedItems?.some((i) => i.id === 2)).toBe(true)

      // Product 3 is paid -> must NOT be resolved
      expect(resolvedItems?.some((i) => i.id === 3)).toBe(false)

      // Product 4 is hidden -> must NOT be resolved
      expect(resolvedItems?.some((i) => i.id === 4)).toBe(false)

      // Product 5 is draft -> must NOT be resolved
      expect(resolvedItems?.some((i) => i.id === 5)).toBe(false)

      // Product 6 has no files -> must NOT be resolved
      expect(resolvedItems?.some((i) => i.id === 6)).toBe(false)
    })

    it('filters products in manual mode: skips draft, hidden, paid, or file-less products', async () => {
      const puckData = {
        content: [
          {
            type: 'LeadMagnetCarousel',
            props: {
              id: 'test-carousel-manual',
              mode: 'manual',
              manualProducts: [
                { productId: 1 }, // valid free + published + has files
                { productId: 3 }, // paid
                { productId: 4 }, // hidden
                { productId: 5 }, // draft
                { productId: 6 }, // no files
              ],
            },
          },
        ],
        root: { props: { title: 'Test' } },
        zones: {},
      }

      const resolved = await resolveServerData(puckData)
      const carouselBlock = resolved.content.find((b) => b.type === 'LeadMagnetCarousel')
      const resolvedItems = (
        carouselBlock?.props as { _resolved?: { items?: LeadMagnetItem[] } }
      )._resolved?.items

      expect(resolvedItems).toBeDefined()
      expect(resolvedItems?.length).toBe(1)
      expect(resolvedItems?.[0].id).toBe(1)
    })
  })
})
