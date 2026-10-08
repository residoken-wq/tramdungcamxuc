import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

import type { Data } from '@puckeditor/core'
import type { Product, Page, Post } from '@/payload-types'
import { puckConfig } from '@/puck/config'
import { resolveServerData, normalizePageSlug } from '@/puck/resolve.server'
import { BookingCTA } from '@/components/site/BookingCTA'
import { ShopeeButton } from '@/components/site/ShopeeButton'
import { ZaloButton } from '@/components/site/ZaloButton'
import { QuizCTA, HABIT_QUIZ_PATH } from '@/components/site/QuizCTA'
import { B2BBriefForm } from '@/components/site/B2BBriefForm'
import { LeadForm } from '@/components/site/LeadForm'
import { LibraryPreview } from '@/components/site/LibraryPreview'
import { BOOKING_PATH, type PublicProduct } from '@/lib/products'
import { vi as i18nVi } from '@/lib/i18n/vi'

const mockProducts: Product[] = [
  {
    id: 301,
    name: '[MẪU] Phiên trải nghiệm Growth Mirror',
    slug: 'growth-mirror-trial',
    web: 'site',
    type: 'coaching_trial',
    price: 250000,
    salePrice: 149000,
    saleEndsAt: '2027-01-01T00:00:00.000Z',
    saleStatus: 'on_sale',
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  } as unknown as Product,
  {
    id: 302,
    name: '[MẪU] Bộ Thẻ Cảm Xúc EQ Buddy Vật Lý',
    slug: 'bo-the-eq-buddy',
    web: 'eq',
    type: 'physical_external',
    price: 199000,
    externalUrl: 'https://shopee.vn/product/sample-card',
    saleStatus: 'on_sale',
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  } as unknown as Product,
  {
    id: 303,
    name: '[MẪU] Ebook Chuyển Hóa Cảm Xúc',
    slug: 'ebook-chuyen-hoa',
    web: 'site',
    type: 'ebook',
    price: 0,
    saleStatus: 'free',
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  } as unknown as Product,
]

const mockPages: Page[] = [
  {
    id: 11,
    title: 'Về Hana',
    slug: 've-hana',
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  } as unknown as Page,
]

const mockPosts: Post[] = [
  {
    id: 401,
    title: 'Bài viết chuyển hóa cảm xúc',
    slug: 'bai-viet-cam-xuc',
    format: 'article',
    topic: 'eq',
    summary: 'Mô tả bài viết',
    updatedAt: '',
    createdAt: '',
    _status: 'published',
  } as unknown as Post,
]

vi.mock('payload', () => ({
  buildConfig: vi.fn(() => ({})),
  getPayload: vi.fn(async () => ({
    find: vi.fn(async ({ collection, where }) => {
      if (collection === 'pages') {
        return { docs: mockPages }
      }
      if (collection === 'posts') {
        return { docs: mockPosts }
      }
      if (collection === 'products') {
        const idsClause = where?.and?.find(
          (c: Record<string, Record<string, unknown>>) => c?.id?.in,
        )
        const allowedIds: unknown[] = (idsClause?.id?.in as unknown[]) || []
        if (allowedIds.length > 0) {
          const docs = mockProducts.filter(
            (p) => allowedIds.includes(p.id) || allowedIds.includes(String(p.id)),
          )
          return { docs }
        }
        return { docs: mockProducts }
      }
      return { docs: [] }
    }),
    findByID: vi.fn(async ({ id }) => {
      return mockProducts.find((p) => p.id === Number(id)) || null
    }),
    findGlobal: vi.fn(async ({ slug }) => {
      if (slug === 'siteSettings') {
        return {
          shopeeStoreUrl: 'https://shopee.vn/tramdungcamxuc-official',
          zaloChatUrl: 'https://zalo.me/0901234567',
          zaloGroupUrl: 'https://zalo.me/g/community-sample',
          // SENSITIVE BANK FIELDS THAT MUST BE STRIPPED
          bankAccount: '123456789',
          bankBin: '970422',
        }
      }
      return {}
    }),
  })),
}))

vi.mock('@/payload.config', () => ({
  default: Promise.resolve({}),
}))

describe('Conversion Blocks Unit Tests (T1-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('BookingCTA', () => {
    it('displays active sale price and strikethrough original price when now < saleEndsAt', () => {
      const activeProduct: PublicProduct = {
        id: '301',
        name: 'Phiên trải nghiệm Growth Mirror',
        slug: 'growth-mirror-trial',
        price: 250000,
        salePrice: 149000,
        saleEndsAt: new Date(Date.now() + 86400000).toISOString(),
        saleStatus: 'on_sale',
      }

      const markup = renderToStaticMarkup(
        <BookingCTA
          title="Đặt phiên trải nghiệm"
          buttonLabel="Đặt phiên ngay"
          product={activeProduct}
        />,
      )

      expect(markup).toContain('149.000đ')
      expect(markup).toContain('250.000đ')
      expect(markup).toContain(BOOKING_PATH)
    })

    it('falls back to regular price when saleEndsAt has expired', () => {
      const expiredProduct: PublicProduct = {
        id: '301',
        name: 'Phiên trải nghiệm Growth Mirror',
        slug: 'growth-mirror-trial',
        price: 250000,
        salePrice: 149000,
        saleEndsAt: new Date(Date.now() - 86400000).toISOString(),
        saleStatus: 'on_sale',
      }

      const markup = renderToStaticMarkup(
        <BookingCTA
          title="Đặt phiên trải nghiệm"
          buttonLabel="Đặt phiên ngay"
          product={expiredProduct}
        />,
      )

      expect(markup).toContain('250.000đ')
      expect(markup).not.toContain('149.000đ')
    })
  })

  describe('ShopeeButton', () => {
    it('appends UTM parameters and opens in new tab with noopener', () => {
      const markup = renderToStaticMarkup(
        <ShopeeButton
          mode="product"
          externalUrl="https://shopee.vn/product/123"
          pageSlug="bo-the-eq"
        />,
      )

      expect(markup).toContain('utm_source=tramdungcamxuc')
      expect(markup).toContain('utm_medium=website')
      expect(markup).toContain('utm_campaign=bo-the-eq')
      expect(markup).toContain('target="_blank"')
      expect(markup).toContain('rel="noopener noreferrer"')
    })

    it('defaults utm_campaign to "website" (never "shopee") when pageSlug is missing', () => {
      const markup = renderToStaticMarkup(
        <ShopeeButton mode="product" externalUrl="https://shopee.vn/product/123" />,
      )

      expect(markup).toContain('utm_source=tramdungcamxuc')
      expect(markup).toContain('utm_medium=website')
      expect(markup).toContain('utm_campaign=website')
      expect(markup).not.toContain('utm_campaign=shopee')
    })

    it('hides cleanly on public page when URL is not configured', () => {
      const markup = renderToStaticMarkup(
        <ShopeeButton mode="product" externalUrl="" puck={{ isEditing: false }} />,
      )
      expect(markup).toBe('')
    })

    it('shows warning indicator in editor when URL is not configured', () => {
      const markup = renderToStaticMarkup(
        <ShopeeButton mode="product" externalUrl="" puck={{ isEditing: true }} />,
      )
      expect(markup).toContain('Sản phẩm chưa có liên kết Shopee ngoài')
    })
  })

  describe('ZaloButton', () => {
    it('renders chat link with target=_blank and rel=noopener', () => {
      const markup = renderToStaticMarkup(
        <ZaloButton target="chat" zaloChatUrl="https://zalo.me/0901234567" label="Chat với Hana" />,
      )

      expect(markup).toContain('https://zalo.me/0901234567')
      expect(markup).toContain('target="_blank"')
      expect(markup).toContain('rel="noopener noreferrer"')
      expect(markup).toContain('Chat với Hana')
    })

    it('hides cleanly on public page when URL is not configured', () => {
      const markup = renderToStaticMarkup(
        <ZaloButton target="chat" zaloChatUrl="" puck={{ isEditing: false }} />,
      )
      expect(markup).toBe('')
    })

    it('shows warning indicator in editor when URL is not configured', () => {
      const markup = renderToStaticMarkup(
        <ZaloButton target="chat" zaloChatUrl="" puck={{ isEditing: true }} />,
      )
      expect(markup).toContain('Chưa cấu hình Liên kết trò chuyện Zalo')
    })
  })

  describe('QuizCTA', () => {
    it('renders with link pointing to HABIT_QUIZ_PATH (/habit/chan-doan)', () => {
      const markup = renderToStaticMarkup(
        <QuizCTA
          titleLine1="5 PHÚT CHẨN ĐOÁN"
          titleLine2="THÓI QUEN CỦA BẠN"
          buttonText="Bắt đầu ngay"
        />,
      )

      expect(markup).toContain(HABIT_QUIZ_PATH)
      expect(markup).toContain('5 PHÚT CHẨN ĐOÁN')
      expect(markup).toContain('Bắt đầu ngay')
    })
  })

  describe('B2BBriefForm', () => {
    it('has root element with id="gui-brief" for anchor routing from program detail pages', () => {
      const markup = renderToStaticMarkup(<B2BBriefForm title="Gửi brief doanh nghiệp" />)
      expect(markup).toContain('id="gui-brief"')
    })

    it('displays client validation errors in Vietnamese when required fields are missing', async () => {
      render(<B2BBriefForm title="Gửi brief doanh nghiệp" />)

      const submitBtn = screen.getByRole('button', { name: /Gửi brief yêu cầu/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText(i18nVi.forms.validation.nameRequired)).toBeDefined()
        expect(screen.getByText(i18nVi.forms.validation.emailRequired)).toBeDefined()
        expect(screen.getByText(i18nVi.forms.validation.companyRequired)).toBeDefined()
        expect(screen.getByText(i18nVi.forms.validation.consentRequired)).toBeDefined()
      })
    })
  })

  describe('LeadForm Client Validation & Field Errors', () => {
    it('displays Vietnamese field errors when submitted with empty fields', async () => {
      render(<LeadForm title="Nhận tài nguyên miễn phí" />)

      const submitBtn = screen.getByRole('button', { name: /Gửi thông tin/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText(i18nVi.leadForm.errors.nameRequired)).toBeDefined()
        expect(screen.getByText(i18nVi.leadForm.errors.emailRequired)).toBeDefined()
        expect(screen.getByText(i18nVi.leadForm.errors.consentRequired)).toBeDefined()
      })
    })
  })

  describe('LibraryPreview', () => {
    it('renders "Xem tất cả" button pointing to /thu-vien?tab=khoa-hoc', () => {
      const markup = renderToStaticMarkup(<LibraryPreview tab="khoa-hoc" items={[]} />)
      expect(markup).toContain('/thu-vien?tab=khoa-hoc')
      expect(markup).toContain('Xem tất cả')
    })

    it('renders "Xem tất cả" button pointing to /thu-vien?tab=noi-dung', () => {
      const markup = renderToStaticMarkup(<LibraryPreview tab="noi-dung" items={[]} />)
      expect(markup).toContain('/thu-vien?tab=noi-dung')
    })
  })

  describe('resolveServerData for Conversion Blocks', () => {
    it('resolves pageSlug for CTAButton, product for BookingCTA, and siteSettings for Shopee and Zalo', async () => {
      const inputData: Data = {
        root: {},
        content: [
          {
            type: 'CTAButton',
            props: {
              id: 'cta-1',
              version: 2,
              linkType: 'page',
              pageId: 11,
              label: 'Về Hana',
              href: '#',
            },
          },
          {
            type: 'BookingCTA',
            props: {
              id: 'booking-1',
              productId: 301,
              title: 'Phiên trải nghiệm',
            },
          },
          {
            type: 'LeadForm',
            props: {
              id: 'lead-1',
              resourceProductId: 303,
              title: 'Tải ebook',
            },
          },
          {
            type: 'ShopeeButton',
            props: {
              id: 'shopee-1',
              mode: 'product',
              productId: 302,
            },
          },
          {
            type: 'ZaloButton',
            props: {
              id: 'zalo-1',
              target: 'chat',
            },
          },
          {
            type: 'LibraryPreview',
            props: {
              id: 'lib-1',
              tab: 'khoa-hoc',
              limit: 3,
            },
          },
        ],
      }

      const resolved = await resolveServerData(inputData)

      // CTAButton resolved pageSlug
      const ctaItem = resolved.content[0] as { props: { _resolved?: { pageSlug?: string } } }
      expect(ctaItem.props._resolved?.pageSlug).toBe('ve-hana')

      // BookingCTA resolved product
      const bookingItem = resolved.content[1] as {
        props: { _resolved?: { product?: { id: number; name: string } } }
      }
      expect(bookingItem.props._resolved?.product?.id).toBe(301)

      // LeadForm resolved resource
      const leadItem = resolved.content[2] as {
        props: { _resolved?: { resource?: { slug: string } } }
      }
      expect(leadItem.props._resolved?.resource?.slug).toBe('ebook-chuyen-hoa')

      // ShopeeButton resolved externalUrl and shopeeStoreUrl
      const shopeeItem = resolved.content[3] as {
        props: { _resolved?: { externalUrl?: string; shopeeStoreUrl?: string } }
      }
      expect(shopeeItem.props._resolved?.externalUrl).toBe('https://shopee.vn/product/sample-card')
      expect(shopeeItem.props._resolved?.shopeeStoreUrl).toBe(
        'https://shopee.vn/tramdungcamxuc-official',
      )

      // ZaloButton resolved zaloChatUrl
      const zaloItem = resolved.content[4] as {
        props: { _resolved?: { zaloChatUrl?: string } }
      }
      expect(zaloItem.props._resolved?.zaloChatUrl).toBe('https://zalo.me/0901234567')

      // LibraryPreview resolved items
      const libItem = resolved.content[5] as {
        props: { _resolved?: { items?: unknown[] } }
      }
      expect(Array.isArray(libItem.props._resolved?.items)).toBe(true)
    })
  })

  describe('Puck block render stripping puck prop', () => {
    it('strips puck function references in BookingCTA block render', () => {
      const block = puckConfig.components.BookingCTA
      const markup = renderToStaticMarkup(
        block.render({
          ...block.defaultProps,
          title: 'Khối Booking CTA',
          puck: { isEditing: false, renderDropZone: () => null },
        } as never),
      )
      expect(markup).toContain('Khối Booking CTA')
    })

    it('strips puck function references in ShopeeButton block render', () => {
      const block = puckConfig.components.ShopeeButton
      const markup = renderToStaticMarkup(
        block.render({
          ...block.defaultProps,
          label: 'Mua ngay Shopee',
          _resolved: { externalUrl: 'https://shopee.vn/product/123' },
          puck: { isEditing: false, renderDropZone: () => null },
        } as never),
      )
      expect(markup).toContain('Mua ngay Shopee')
    })
  })

  describe('normalizePageSlug (T1-03b)', () => {
    it('normalizes "/" and empty string to "trang-chu"', () => {
      expect(normalizePageSlug('/')).toBe('trang-chu')
      expect(normalizePageSlug('')).toBe('trang-chu')
      expect(normalizePageSlug('   ')).toBe('trang-chu')
      expect(normalizePageSlug('///')).toBe('trang-chu')
      expect(normalizePageSlug(undefined)).toBe('trang-chu')
    })

    it('replaces slashes with dashes and trims outer slashes', () => {
      expect(normalizePageSlug('a/b')).toBe('a-b')
      expect(normalizePageSlug('coaching/growth-mirror')).toBe('coaching-growth-mirror')
      expect(normalizePageSlug('/coaching/growth-mirror/')).toBe('coaching-growth-mirror')
      expect(normalizePageSlug('thu-vien')).toBe('thu-vien')
      expect(normalizePageSlug('trang-chu')).toBe('trang-chu')
    })
  })

  describe('resolveServerData with pageSlug options (T1-03b)', () => {
    it('attaches normalized pageSlug to root conversion blocks', async () => {
      const data: Data = {
        content: [
          { type: 'ShopeeButton', props: { id: 'shopee-root' } },
          { type: 'B2BBriefForm', props: { id: 'brief-root' } },
          { type: 'LeadForm', props: { id: 'lead-root' } },
          { type: 'BookingCTA', props: { id: 'booking-root', title: 'Booking' } },
        ],
        root: { props: { title: 'Test Root' } },
      }

      const resolved = await resolveServerData(data, { pageSlug: '/coaching/growth-mirror' })

      expect((resolved.content[0] as { props: { pageSlug?: string } }).props.pageSlug).toBe(
        'coaching-growth-mirror',
      )
      expect((resolved.content[1] as { props: { pageSlug?: string } }).props.pageSlug).toBe(
        'coaching-growth-mirror',
      )
      expect((resolved.content[2] as { props: { pageSlug?: string } }).props.pageSlug).toBe(
        'coaching-growth-mirror',
      )
      expect((resolved.content[3] as { props: { pageSlug?: string } }).props.pageSlug).toBe(
        'coaching-growth-mirror',
      )
    })

    it('attaches normalized pageSlug to conversion blocks nested inside Columns slot props', async () => {
      const data: Data = {
        content: [
          {
            type: 'Columns',
            props: {
              id: 'col-1',
              col1: [
                { type: 'ShopeeButton', props: { id: 'shopee-col' } },
                { type: 'BookingCTA', props: { id: 'booking-col', title: 'Booking' } },
              ],
              col2: [
                { type: 'LeadForm', props: { id: 'lead-col' } },
                { type: 'B2BBriefForm', props: { id: 'brief-col' } },
              ],
            },
          },
        ],
        root: { props: { title: 'Test Root' } },
      }

      const resolved = await resolveServerData(data, { pageSlug: '/' })

      const colBlock = resolved.content[0] as {
        props: {
          col1?: Array<{ props: { pageSlug?: string } }>
          col2?: Array<{ props: { pageSlug?: string } }>
        }
      }

      expect(colBlock.props.col1?.[0]?.props.pageSlug).toBe('trang-chu')
      expect(colBlock.props.col1?.[1]?.props.pageSlug).toBe('trang-chu')
      expect(colBlock.props.col2?.[0]?.props.pageSlug).toBe('trang-chu')
      expect(colBlock.props.col2?.[1]?.props.pageSlug).toBe('trang-chu')
    })
  })
})
