// @vitest-environment node
import './setup-jsdom'

import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { render, fireEvent, waitFor, cleanup } from '@testing-library/react'

import { Buffer } from 'node:buffer'
import { vi as i18n } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'

vi.mock('server-only', () => ({}))

// Mock module track
vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
  EVENT_ALLOWED_PROPS: {
    card_shared: ['cardCode', 'format', 'platform'],
    external_clicked: ['url', 'type', 'platform', 'productSlug', 'targetUrl'],
  },
  SENSITIVE_FORBIDDEN_KEYS: new Set(),
}))

// Mock cards data
const mockCards = [
  {
    id: 1,
    code: 'B-01',
    qrSlug: 'b-01-binh-an',
    keywordEn: '[TEST] Keyword',
    message: 'Bình an là khi bạn nhận ra mọi cảm xúc đều đến để dạy bạn điều gì đó.',
    _status: 'published',
    shareImage45: null,
    shareImage916: null,
  },
  {
    id: 2,
    code: 'B-02',
    qrSlug: 'b-02-co-anh-45',
    message: 'Thông điệp thẻ B-02 có ảnh 4:5 đã tải lên.',
    _status: 'published',
    shareImage45: { url: 'https://cdn.example.com/cards/b-02-45.png' },
    shareImage916: null,
  },
  {
    id: 3,
    code: 'B-03',
    qrSlug: 'b-03-co-anh-916',
    message: 'Thông điệp thẻ B-03 có ảnh 9:16 đã tải lên.',
    _status: 'published',
    shareImage45: null,
    shareImage916: { url: '/api/media/file/b-03-916.png' },
  },
  {
    id: 4,
    code: 'B-04',
    qrSlug: 'b-04-thong-diep-dai',
    // 220 ký tự tiếng Việt có dấu chuẩn
    message:
      'Khi ta học cách chấp nhận và thương yêu những tổn thương nhỏ bé nhất trong tâm hồn mình, ta sẽ tìm thấy một nguồn sức mạnh tĩnh lặng vô biên để vững vàng bước qua mọi phong ba bão táp của cuộc đời mà lòng vẫn luôn an yên sáng tỏ.',
    _status: 'published',
    shareImage45: null,
    shareImage916: null,
  },
  {
    id: 5,
    code: 'B-05',
    qrSlug: 'b-05-ban-nhap',
    message: 'Thẻ bản nháp chưa xuất bản.',
    _status: 'draft',
    shareImage45: null,
    shareImage916: null,
  },
]

// Mock Payload Local API
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    find: vi.fn(async ({ collection, where }) => {
      if (collection === 'eqCards') {
        const qrSlugClause = where?.and?.find(
          (c: Record<string, Record<string, unknown>>) => c?.qrSlug?.equals !== undefined,
        )
        const statusClause = where?.and?.find(
          (c: Record<string, Record<string, unknown>>) => c?._status?.equals !== undefined,
        )

        const targetSlug = qrSlugClause?.qrSlug?.equals as string | undefined
        const targetStatus = statusClause?._status?.equals as string | undefined

        const docs = mockCards.filter((card) => {
          if (targetSlug && card.qrSlug !== targetSlug) return false
          if (targetStatus && card._status !== targetStatus) return false
          return true
        })

        return { docs }
      }
      return { docs: [] }
    }),
  })),
}))

vi.mock('@/payload.config', () => ({
  default: Promise.resolve({}),
}))

import { GET as cardImageRouteHandler } from '@/app/(site)/eq-buddy/the/[qrSlug]/anh/[format]/route'
import { CardShareButtons } from '@/components/eq/CardShareButtons'
import { RelatedOffer } from '@/components/eq/RelatedOffer'
import { PhysicalDeckButton } from '@/components/eq/PhysicalDeckButton'

describe('EQ Buddy Share & Offers Suite (T3-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('1. Card Share Image Route Handler', () => {
    it('throws 404 (notFound) when format is invalid', async () => {
      await expect(
        cardImageRouteHandler(new Request('http://localhost/eq-buddy/the/b-01-binh-an/anh/1x1'), {
          params: Promise.resolve({ qrSlug: 'b-01-binh-an', format: '1x1' }),
        }),
      ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK.*404/)
    })

    it('throws 404 (notFound) when card is not found', async () => {
      await expect(
        cardImageRouteHandler(
          new Request('http://localhost/eq-buddy/the/non-existent-card/anh/4x5'),
          {
            params: Promise.resolve({ qrSlug: 'non-existent-card', format: '4x5' }),
          },
        ),
      ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK.*404/)
    })

    it('throws 404 (notFound) when card status is draft', async () => {
      await expect(
        cardImageRouteHandler(new Request('http://localhost/eq-buddy/the/b-05-ban-nhap/anh/4x5'), {
          params: Promise.resolve({ qrSlug: 'b-05-ban-nhap', format: '4x5' }),
        }),
      ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK.*404/)
    })

    it('returns 302 redirect when card has shareImage45 uploaded', async () => {
      const res = await cardImageRouteHandler(
        new Request('http://localhost/eq-buddy/the/b-02-co-anh-45/anh/4x5'),
        {
          params: Promise.resolve({ qrSlug: 'b-02-co-anh-45', format: '4x5' }),
        },
      )
      expect(res.status).toBe(302)
      expect(res.headers.get('location')).toBe('https://cdn.example.com/cards/b-02-45.png')
    })

    it('returns 302 redirect when card has shareImage916 uploaded', async () => {
      const res = await cardImageRouteHandler(
        new Request('http://localhost/eq-buddy/the/b-03-co-anh-916/anh/9x16'),
        {
          params: Promise.resolve({ qrSlug: 'b-03-co-anh-916', format: '9x16' }),
        },
      )
      expect(res.status).toBe(302)
      // relative media URL stays relative (not resolved against the container host)
      expect(res.headers.get('location')).toBe('/api/media/file/b-03-916.png')
    })

    it('generates 4x5 PNG with correct IHDR dimensions (1080x1350) and public cache headers', async () => {
      const res = await cardImageRouteHandler(
        new Request('http://localhost/eq-buddy/the/b-01-binh-an/anh/4x5'),
        {
          params: Promise.resolve({ qrSlug: 'b-01-binh-an', format: '4x5' }),
        },
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('image/png')
      expect(res.headers.get('cache-control')).toContain('public, max-age=300')
      expect(res.headers.get('cache-control')).toContain('stale-while-revalidate=86400')

      const buf = Buffer.from(await res.arrayBuffer())
      expect(buf.byteLength).toBeGreaterThan(1000)

      // Kiểm tra IHDR width và height
      const width = buf.readUInt32BE(16)
      const height = buf.readUInt32BE(20)
      expect(width).toBe(1080)
      expect(height).toBe(1350)
    })

    it('generates 9x16 PNG with correct IHDR dimensions (1080x1920)', async () => {
      const res = await cardImageRouteHandler(
        new Request('http://localhost/eq-buddy/the/b-01-binh-an/anh/9x16'),
        {
          params: Promise.resolve({ qrSlug: 'b-01-binh-an', format: '9x16' }),
        },
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('image/png')

      const buf = Buffer.from(await res.arrayBuffer())
      const width = buf.readUInt32BE(16)
      const height = buf.readUInt32BE(20)
      expect(width).toBe(1080)
      expect(height).toBe(1920)
    })

    it('generates share image cleanly for long message (220 characters) without throwing error', async () => {
      const res = await cardImageRouteHandler(
        new Request('http://localhost/eq-buddy/the/b-04-thong-diep-dai/anh/4x5'),
        {
          params: Promise.resolve({ qrSlug: 'b-04-thong-diep-dai', format: '4x5' }),
        },
      )
      expect(res.status).toBe(200)
      const buf = Buffer.from(await res.arrayBuffer())
      const width = buf.readUInt32BE(16)
      const height = buf.readUInt32BE(20)
      expect(width).toBe(1080)
      expect(height).toBe(1350)
    })
  })

  describe('2. CardShareButtons Component', () => {
    it('renders all 3 share buttons', () => {
      const { getByRole } = render(
        React.createElement(CardShareButtons, { cardCode: 'B-01', qrSlug: 'b-01-binh-an' }),
      )

      expect(getByRole('button', { name: i18n.eqBuddy.share.ariaDownload45 })).toBeDefined()
      expect(getByRole('button', { name: i18n.eqBuddy.share.ariaDownload916 })).toBeDefined()
      expect(getByRole('button', { name: i18n.eqBuddy.share.ariaShare })).toBeDefined()
    })

    it('triggers track on downloading 4x5 format', () => {
      const { getByRole } = render(
        React.createElement(CardShareButtons, { cardCode: 'B-01', qrSlug: 'b-01-binh-an' }),
      )

      const btn45 = getByRole('button', { name: i18n.eqBuddy.share.ariaDownload45 })
      fireEvent.click(btn45)

      expect(track).toHaveBeenCalledWith('card_shared', {
        cardCode: 'B-01',
        format: '4x5',
        platform: 'download',
      })
    })

    it('triggers track on downloading 9x16 format', () => {
      const { getByRole } = render(
        React.createElement(CardShareButtons, { cardCode: 'B-01', qrSlug: 'b-01-binh-an' }),
      )

      const btn916 = getByRole('button', { name: i18n.eqBuddy.share.ariaDownload916 })
      fireEvent.click(btn916)

      expect(track).toHaveBeenCalledWith('card_shared', {
        cardCode: 'B-01',
        format: '9x16',
        platform: 'download',
      })
    })

    it('calls navigator.share and tracks with platform native when navigator.share is available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
        writable: true,
      })

      const { getByRole } = render(
        React.createElement(CardShareButtons, { cardCode: 'B-01', qrSlug: 'b-01-binh-an' }),
      )

      const shareBtn = getByRole('button', { name: i18n.eqBuddy.share.ariaShare })
      fireEvent.click(shareBtn)

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            title: i18n.eqBuddy.share.shareTitle('B-01'),
          }),
        )
      })

      expect(track).toHaveBeenCalledWith('card_shared', {
        cardCode: 'B-01',
        format: 'link',
        platform: 'native',
      })
    })

    it('falls back to clipboard and shows copied feedback when navigator.share is unavailable', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        configurable: true,
        writable: true,
      })

      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        configurable: true,
        writable: true,
      })

      const { getByRole, getByText } = render(
        React.createElement(CardShareButtons, { cardCode: 'B-01', qrSlug: 'b-01-binh-an' }),
      )

      const shareBtn = getByRole('button', { name: i18n.eqBuddy.share.ariaShare })
      fireEvent.click(shareBtn)

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalled()
      })

      expect(track).toHaveBeenCalledWith('card_shared', {
        cardCode: 'B-01',
        format: 'link',
        platform: 'copy',
      })

      expect(getByText(i18n.eqBuddy.share.copied)).toBeDefined()
    })
  })

  describe('3. RelatedOffer Component', () => {
    it('returns null and renders nothing when product is missing', () => {
      const { container } = render(React.createElement(RelatedOffer, { product: null }))
      expect(container.firstChild).toBeNull()
    })

    it('returns null and renders nothing when product saleStatus is hidden', () => {
      const { container } = render(
        React.createElement(RelatedOffer, {
          product: {
            name: 'Khóa học ẩn',
            slug: 'khoa-hoc-an',
            saleStatus: 'hidden',
          },
        }),
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders section title, product card, and proper CTA when product is valid', () => {
      const { getByText } = render(
        React.createElement(RelatedOffer, {
          product: {
            id: 10,
            name: 'Growth Mirror CLEAR',
            slug: 'growth-mirror-clear',
            saleStatus: 'on_sale',
            price: 2500000,
            salePrice: 1750000,
            shortDescription: 'Chương trình đồng hành cảm xúc chuyên sâu 1:1',
          },
        }),
      )

      expect(getByText(i18n.eqBuddy.offer.relatedHeading)).toBeDefined()
      expect(getByText('Growth Mirror CLEAR')).toBeDefined()
      expect(getByText('Chương trình đồng hành cảm xúc chuyên sâu 1:1')).toBeDefined()
    })
  })

  describe('4. PhysicalDeckButton Component', () => {
    it('returns null when product is not physical_external', () => {
      const { container } = render(
        React.createElement(PhysicalDeckButton, {
          product: {
            type: 'digital_tool',
            externalUrl: 'https://shopee.vn/deck-123',
          },
        }),
      )
      expect(container.firstChild).toBeNull()
    })

    it('returns null when externalUrl is missing or empty', () => {
      const { container } = render(
        React.createElement(PhysicalDeckButton, {
          product: {
            type: 'physical_external',
            externalUrl: '   ',
          },
        }),
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders button with Shopee label and UTM parameters, opened in new tab', () => {
      const { getByRole, getByText } = render(
        React.createElement(PhysicalDeckButton, {
          product: {
            type: 'physical_external',
            externalUrl: 'https://shopee.vn/bo-the-eq-buddy',
            slug: 'bo-the-eq-buddy',
          },
          campaign: 'eq_card_detail',
          showHint: true,
        }),
      )

      const link = getByRole('link', {
        name: new RegExp(i18n.eqBuddy.offer.buyPhysicalDeck),
      })
      expect(link).toBeDefined()
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
      expect(link.getAttribute('rel')).toContain('noreferrer')

      const href = link.getAttribute('href') || ''
      expect(href).toContain('https://shopee.vn/bo-the-eq-buddy')
      expect(href).toContain('utm_source=tramdungcamxuc')
      expect(href).toContain('utm_medium=website')
      expect(href).toContain('utm_campaign=eq_card_detail')

      expect(getByText(i18n.eqBuddy.offer.shopeeHint)).toBeDefined()
    })

    it('calls track on click with external_clicked event', () => {
      const { getByRole } = render(
        React.createElement(PhysicalDeckButton, {
          product: {
            type: 'physical_external',
            externalUrl: 'https://shopee.vn/bo-the-eq-buddy',
            slug: 'bo-the-eq-buddy',
          },
        }),
      )

      const link = getByRole('link', {
        name: new RegExp(i18n.eqBuddy.offer.buyPhysicalDeck),
      })
      fireEvent.click(link)

      expect(track).toHaveBeenCalledWith('external_clicked', {
        url: expect.stringContaining('https://shopee.vn/bo-the-eq-buddy'),
        type: 'shopee',
        platform: 'shopee',
        productSlug: 'bo-the-eq-buddy',
      })
    })
  })
})
