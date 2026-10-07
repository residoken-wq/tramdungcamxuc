import React from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('server-only', () => ({}))

import type { Data } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'
import { resolveServerData } from '@/puck/resolve.server'
import {
  useClientTestimonials,
  useClientTestimonial,
  clearClientPreviewCache,
} from '@/puck/client-preview'
import { TestimonialGrid } from '@/components/site/TestimonialGrid'
import type { PublicTestimonial } from '@/lib/testimonials'

// Mock database records
const mockTestimonialDocs = [
  {
    id: 101,
    name: 'Chị Mai Lan',
    role: 'Học viên K03',
    quote: 'Trạm Dừng Cảm Xúc đã giúp tôi vượt qua khủng hoảng tuổi 30.',
    consent: true,
    _status: 'published',
    language: 'vi',
    photo: {
      id: 11,
      url: '/brand/mai-lan.jpg',
      alt: 'Chị Mai Lan',
    },
  },
  {
    id: 102,
    name: 'Anh Tuấn Anh',
    role: 'Quản lý dự án',
    quote: 'Bộ thẻ EQ Buddy rất hữu ích trong công việc và cuộc sống gia đình.',
    consent: false, // NO CONSENT - must never be resolved or displayed
    _status: 'published',
    language: 'vi',
    photo: null,
  },
  {
    id: 103,
    name: 'Bạn Thu Hà',
    role: 'Thành viên cộng đồng',
    quote: 'Những buổi workshop giúp tôi kết nối lại với chính mình.',
    consent: true,
    _status: 'draft', // DRAFT - must not be resolved
    language: 'vi',
    photo: null,
  },
  {
    id: 104,
    name: 'Chị Bích Phương',
    role: 'Thân chủ Coaching',
    quote: 'Phiên Growth Mirror khai mở nhiều góc nhìn mà trước đây tôi chưa nhận ra.',
    consent: true,
    _status: 'published',
    language: 'vi',
    photo: null,
  },
]

const mockMediaDocs: Record<string, { id: number; url: string; alt: string }> = {
  '501': { id: 501, url: '/media/hana-portrait.jpg', alt: 'Chân dung Hana Lương' },
  '601': { id: 601, url: '/media/partner-logo-1.svg', alt: 'Doanh nghiệp Đối tác Alpha' },
  '602': { id: 602, url: '/media/partner-logo-2.svg', alt: 'Tập đoàn Beta' },
}

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    find: vi.fn(async ({ collection, where }) => {
      if (collection === 'testimonials') {
        const idsClause = where?.and?.find(
          (c: Record<string, Record<string, unknown>>) => c?.id?.in,
        )
        const allowedIds: unknown[] = (idsClause?.id?.in as unknown[]) || []

        let docs = mockTestimonialDocs
        if (allowedIds.length > 0) {
          docs = docs.filter((t) => allowedIds.includes(t.id) || allowedIds.includes(String(t.id)))
        }
        // Filter consent = true and _status = published
        docs = docs.filter((t) => t.consent === true && t._status === 'published')
        return { docs }
      }
      return { docs: [] }
    }),
    findByID: vi.fn(async ({ collection, id }) => {
      if (collection === 'media') {
        return mockMediaDocs[String(id)] || null
      }
      return null
    }),
  })),
}))

vi.mock('@/payload.config', () => ({
  default: Promise.resolve({}),
}))

describe('T1-02b: Puck Trust Blocks – Niềm tin', () => {
  const trustBlockKeys = ['TestimonialGrid', 'TestimonialSlider', 'LogoStrip', 'HanaStory'] as const

  beforeEach(() => {
    clearClientPreviewCache()
  })

  describe('Registration & Category Verification', () => {
    it('registers trust category with title "Niềm tin" and all 4 blocks in puckConfig', () => {
      expect(puckConfig.categories?.trust).toBeDefined()
      expect(puckConfig.categories?.trust?.title).toBe('Niềm tin')
      expect(puckConfig.categories?.trust?.components).toEqual([
        'TestimonialSlider',
        'TestimonialGrid',
        'LogoStrip',
        'HanaStory',
      ])
    })

    it('registers all 4 trust blocks in puckConfig.components', () => {
      for (const key of trustBlockKeys) {
        expect(puckConfig.components[key], `Block ${key} must exist`).toBeDefined()
      }
    })
  })

  describe('Anti-data-leak protection (Test chống lưu dữ liệu trong puckData)', () => {
    const forbiddenKeys = ['quote', 'name', 'role']

    it('ensures defaultProps of TestimonialGrid and TestimonialSlider never contain hardcoded testimonial copy', () => {
      for (const key of ['TestimonialGrid', 'TestimonialSlider'] as const) {
        const block = puckConfig.components[key]
        const defaultProps = block.defaultProps || {}
        for (const forbidden of forbiddenKeys) {
          expect(
            forbidden in defaultProps,
            `Block ${key}.defaultProps MUST NOT have key "${forbidden}". Puck data should only store IDs!`,
          ).toBe(false)
        }
      }
    })

    it('ensures fields configuration of TestimonialGrid and TestimonialSlider has no fields for quote, name, or role', () => {
      for (const key of ['TestimonialGrid', 'TestimonialSlider'] as const) {
        const block = puckConfig.components[key]
        const fields = block.fields || {}
        for (const forbidden of forbiddenKeys) {
          expect(
            forbidden in fields,
            `Block ${key}.fields MUST NOT allow entering static "${forbidden}".`,
          ).toBe(false)
        }
      }
    })

    it('ensures HanaStory defaultProps use neutral [MẪU] and do not hardcode Hana copy', () => {
      const hanaBlock = puckConfig.components.HanaStory
      const defaultProps = hanaBlock.defaultProps || {}
      expect(defaultProps.seriesLabel).toContain('[MẪU]')
      expect(defaultProps.titleLine1).toContain('[MẪU]')
      expect(defaultProps.titleLine2).toContain('[MẪU]')
      expect(defaultProps.storyContent).toContain('[MẪU]')
      expect(defaultProps.quoteLine).toContain('[MẪU]')
    })
  })

  describe('Snapshot Testing for 4 Trust Blocks', () => {
    it('renders TestimonialGrid defaultProps cleanly to static markup', () => {
      const html = renderToStaticMarkup(
        puckConfig.components.TestimonialGrid.render({
          id: 'test-grid',
          ...puckConfig.components.TestimonialGrid.defaultProps,
        } as never),
      )
      expect(html).toMatchSnapshot()
    })

    it('renders TestimonialSlider defaultProps cleanly to static markup', () => {
      const html = renderToStaticMarkup(
        puckConfig.components.TestimonialSlider.render({
          id: 'test-slider',
          ...puckConfig.components.TestimonialSlider.defaultProps,
        } as never),
      )
      expect(html).toMatchSnapshot()
    })

    it('renders LogoStrip defaultProps cleanly to static markup', () => {
      const html = renderToStaticMarkup(
        puckConfig.components.LogoStrip.render({
          id: 'test-logo',
          ...puckConfig.components.LogoStrip.defaultProps,
        } as never),
      )
      expect(html).toMatchSnapshot()
    })

    it('renders HanaStory defaultProps cleanly to static markup', () => {
      const html = renderToStaticMarkup(
        puckConfig.components.HanaStory.render({
          id: 'test-hana',
          ...puckConfig.components.HanaStory.defaultProps,
        } as never),
      )
      expect(html).toMatchSnapshot()
    })
  })

  describe('resolveServerData with Consent-only DTO & Media Resolution', () => {
    it('resolves TestimonialGrid with only consent=true and published testimonials', async () => {
      const puckData: Data = {
        content: [
          {
            type: 'TestimonialGrid',
            props: {
              id: 'grid-1',
              mode: 'manual',
              manualTestimonials: [
                { testimonialId: 101 }, // consent = true, published
                { testimonialId: 102 }, // consent = false (forbidden!)
                { testimonialId: 103 }, // consent = true, draft
              ],
            },
          },
        ],
        root: { props: { title: 'Test Page' } },
      }

      const resolved = await resolveServerData(puckData)
      const grid = resolved.content[0] as {
        props: { _resolved?: { testimonials?: PublicTestimonial[] } }
      }

      const resolvedList = grid.props._resolved?.testimonials || []
      // Only testimonial 101 should be resolved
      expect(resolvedList).toHaveLength(1)
      expect(resolvedList[0].id).toBe(101)
      expect(resolvedList[0].name).toBe('Chị Mai Lan')
      expect(resolvedList[0].role).toBe('Học viên K03')

      // Ensure testimonial 102 (no consent) and 103 (draft) are excluded
      expect(resolvedList.some((t) => t.id === 102)).toBe(false)
      expect(resolvedList.some((t) => t.id === 103)).toBe(false)
    })

    it('resolves TestimonialSlider and excludes unconsented testimonials', async () => {
      const puckData: Data = {
        content: [
          {
            type: 'TestimonialSlider',
            props: {
              id: 'slider-1',
              manualTestimonials: [
                { testimonialId: 101 },
                { testimonialId: 104 },
                { testimonialId: 102 }, // no consent
              ],
            },
          },
        ],
        root: { props: { title: 'Slider Page' } },
      }

      const resolved = await resolveServerData(puckData)
      const slider = resolved.content[0] as {
        props: { _resolved?: { testimonials?: PublicTestimonial[] } }
      }

      const resolvedList = slider.props._resolved?.testimonials || []
      expect(resolvedList).toHaveLength(2)
      expect(resolvedList.map((t) => t.id)).toEqual([101, 104])
    })

    it('resolves LogoStrip media items into imageUrl and alt', async () => {
      const puckData: Data = {
        content: [
          {
            type: 'LogoStrip',
            props: {
              id: 'logo-1',
              logos: [
                { mediaId: '601', alt: 'Alpha', link: 'https://alpha.example.com' },
                { mediaId: '602', alt: 'Beta' },
              ],
            },
          },
        ],
        root: { props: { title: 'Logo Page' } },
      }

      const resolved = await resolveServerData(puckData)
      const strip = resolved.content[0] as {
        props: {
          _resolved?: {
            logos?: Array<{ mediaId?: string | number; alt?: string; imageUrl?: string }>
          }
        }
      }

      const logos = strip.props._resolved?.logos || []
      expect(logos).toHaveLength(2)
      expect(logos[0].imageUrl).toBe('/media/partner-logo-1.svg')
      expect(logos[0].alt).toBe('Alpha')
      expect(logos[1].imageUrl).toBe('/media/partner-logo-2.svg')
      expect(logos[1].alt).toBe('Beta')
    })

    it('resolves HanaStory portrait media ID into imageUrl and imageAlt', async () => {
      const puckData: Data = {
        content: [
          {
            type: 'HanaStory',
            props: {
              id: 'hana-1',
              mediaId: '501',
              titleLine1: 'HÀNH TRÌNH',
              titleLine2: 'ĐỒNG HÀNH',
            },
          },
        ],
        root: { props: { title: 'Story Page' } },
      }

      const resolved = await resolveServerData(puckData)
      const story = resolved.content[0] as {
        props: { imageUrl?: string; imageAlt?: string }
      }

      expect(story.props.imageUrl).toBe('/media/hana-portrait.jpg')
      expect(story.props.imageAlt).toBe('Chân dung Hana Lương')
    })
  })

  describe('Server-side rendering (SSR) with _resolved data', () => {
    it('renders TestimonialGrid with _resolved via renderToString containing author name and quote without loading placeholder', () => {
      const sampleTestimonial: PublicTestimonial = {
        id: 101,
        name: 'Chị Mai Lan',
        role: 'Học viên K03',
        quote: 'Trạm Dừng Cảm Xúc đã giúp tôi vượt qua khủng hoảng tuổi 30.',
        language: 'vi',
      }

      const html = renderToString(
        <TestimonialGrid
          _resolved={{
            testimonials: [sampleTestimonial],
          }}
        />,
      )

      expect(html).toContain('Chị Mai Lan')
      expect(html).toContain('Học viên K03')
      expect(html).toContain('Trạm Dừng Cảm Xúc đã giúp tôi vượt qua khủng hoảng tuổi 30.')
      expect(html).not.toContain('Đang tải lời chia sẻ...')
    })
  })

  describe('Puck Prop Unwrapping (Không truyền hàm trong prop puck xuống client component)', () => {
    it('unwraps puck prop in TestimonialGridBlock.render and only passes serialisable isEditing', () => {
      const mockPuck = {
        isEditing: true,
        dispatch: vi.fn(),
        history: {},
      }

      const element = puckConfig.components.TestimonialGrid.render({
        id: 'test-grid-unwrapping',
        puck: mockPuck as unknown as Parameters<
          typeof puckConfig.components.TestimonialGrid.render
        >[0]['puck'],
        mode: 'manual',
        manualTestimonials: [],
      } as never)

      expect(element).toBeDefined()
      // Element props must NOT contain dispatch or history functions
      const passedPuck = element.props.puck
      expect(passedPuck).toEqual({ isEditing: true })
      expect(typeof passedPuck?.dispatch).toBe('undefined')
    })

    it('unwraps puck prop in TestimonialSliderBlock.render and only passes serialisable isEditing', () => {
      const mockPuck = {
        isEditing: true,
        dispatch: vi.fn(),
        history: {},
      }

      const element = puckConfig.components.TestimonialSlider.render({
        id: 'test-slider-unwrapping',
        puck: mockPuck as unknown as Parameters<
          typeof puckConfig.components.TestimonialSlider.render
        >[0]['puck'],
        manualTestimonials: [],
      } as never)

      expect(element).toBeDefined()
      const passedPuck = element.props.puck
      expect(passedPuck).toEqual({ isEditing: true })
      expect(typeof passedPuck?.dispatch).toBe('undefined')
    })
  })

  describe('Single Fetch per Key in Editor Preview (Chống vòng lặp fetch)', () => {
    it('invokes fetch exactly once when useClientTestimonials is rendered 5 times with the same IDs', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            docs: [
              {
                id: 101,
                name: 'Chị Mai Lan',
                role: 'Học viên K03',
                quote: 'Trạm Dừng Cảm Xúc đã giúp tôi.',
                consent: true,
                _status: 'published',
              },
            ],
          }),
        }),
      )
      globalThis.fetch = mockFetch

      const { rerender } = renderHook(
        ({ ids }) => useClientTestimonials({ testimonialIds: ids, mode: 'manual' }),
        { initialProps: { ids: [101] } },
      )

      rerender({ ids: [101] })
      rerender({ ids: [101] })
      rerender({ ids: [101] })
      rerender({ ids: [101] })

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('invokes fetch exactly once when useClientTestimonial is rendered 5 times with the same ID', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            id: 101,
            name: 'Chị Mai Lan',
            role: 'Học viên K03',
            quote: 'Trạm Dừng Cảm Xúc đã giúp tôi.',
            consent: true,
            _status: 'published',
          }),
        }),
      )
      globalThis.fetch = mockFetch

      const { rerender } = renderHook(({ id }) => useClientTestimonial(id), {
        initialProps: { id: 101 },
      })

      rerender({ id: 101 })
      rerender({ id: 101 })
      rerender({ id: 101 })
      rerender({ id: 101 })

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
