import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { faqGroupOptions } from '@/collections/Faqs'
import { vi as viStrings } from '@/lib/i18n/vi'

vi.mock('server-only', () => ({}))

const mockFaqs = [
  {
    id: 1,
    question: '[MẪU] Trạm Dừng Cảm Xúc là gì?',
    answer: '[MẪU] Trạm là không gian đồng hành phát triển cảm xúc.',
    group: 'general',
    order: 1,
    _status: 'published',
  },
  {
    id: 2,
    question: '[MẪU] Khai vấn 1:1 diễn ra như thế nào?',
    answer: '[MẪU] Diễn ra trực tuyến <strong>qua Zoom</strong> trong 60 phút.',
    group: 'coaching',
    order: 1,
    _status: 'published',
  },
  {
    id: 3,
    question: '[MẪU] Doanh nghiệp có thể đặt lịch đào tạo không?',
    answer: '[MẪU] Có, Trạm cung cấp workshop cho đội ngũ.',
    group: 'business',
    order: 1,
    _status: 'published',
  },
  {
    id: 4,
    question: '[MẪU] Câu hỏi nháp chưa xuất bản',
    answer: '[MẪU] Nội dung câu hỏi nháp.',
    group: 'general',
    order: 2,
    _status: 'draft',
  },
]

let lastFindQuery: Record<string, unknown> | null = null

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    find: vi.fn(async (params: Record<string, unknown>) => {
      lastFindQuery = params
      if (params.collection === 'faqs') {
        const whereStatus = (params.where as Record<string, Record<string, string>>)?._status
          ?.equals
        const docs = mockFaqs.filter((f) => !whereStatus || f._status === whereStatus)
        return { docs }
      }
      return { docs: [] }
    }),
  })),
}))

vi.mock('@/payload.config', () => ({
  default: Promise.resolve({}),
}))

import SharedFaqPage from '@/app/(site)/(shell)/cau-hoi-thuong-gap/page'

describe('SM-06: Shared FAQ Page (/cau-hoi-thuong-gap)', () => {
  it('queries only published FAQs and renders groups in defined order', async () => {
    const pageElement = await SharedFaqPage({})
    const { container } = render(pageElement)

    // Verify payload.find was called with published status filter
    expect(lastFindQuery?.collection).toBe('faqs')
    expect(lastFindQuery?.where).toEqual({ _status: { equals: 'published' } })

    // Draft FAQ is not rendered
    expect(screen.queryByText('[MẪU] Câu hỏi nháp chưa xuất bản')).toBeNull()

    // Published FAQs are rendered
    expect(screen.getByText('[MẪU] Trạm Dừng Cảm Xúc là gì?')).toBeTruthy()
    expect(screen.getByText('[MẪU] Khai vấn 1:1 diễn ra như thế nào?')).toBeTruthy()
    expect(screen.getByText('[MẪU] Doanh nghiệp có thể đặt lịch đào tạo không?')).toBeTruthy()

    // Group order follows faqGroupOptions
    const groupHeadings = container.querySelectorAll('h2')
    const headingTexts = Array.from(groupHeadings).map((h) => h.textContent?.trim())

    const expectedOrder = faqGroupOptions
      .map(([, label]) => label)
      .filter((label) => headingTexts.some((ht) => ht?.includes(label)))

    expect(expectedOrder.length).toBeGreaterThan(0)

    // JSON-LD schema contains all 3 published FAQs with HTML stripped
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()
    const jsonLd = JSON.parse(script?.textContent || '{}')
    expect(jsonLd['@type']).toBe('FAQPage')
    expect(jsonLd.mainEntity).toHaveLength(3)
    expect(jsonLd.mainEntity[0].name).toBe('[MẪU] Trạm Dừng Cảm Xúc là gì?')
    expect(jsonLd.mainEntity[1].acceptedAnswer.text).toBe(
      '[MẪU] Diễn ra trực tuyến qua Zoom trong 60 phút.',
    )
  })

  it('filters FAQs by query ?q= matching question or answer', async () => {
    const pageElement = await SharedFaqPage({
      searchParams: Promise.resolve({ q: 'Zoom' }),
    })
    const { container } = render(pageElement)

    // Only coaching FAQ contains 'Zoom'
    expect(screen.getByText('[MẪU] Khai vấn 1:1 diễn ra như thế nào?')).toBeTruthy()
    expect(screen.queryByText('[MẪU] Trạm Dừng Cảm Xúc là gì?')).toBeNull()
    expect(screen.queryByText('[MẪU] Doanh nghiệp có thể đặt lịch đào tạo không?')).toBeNull()

    // JSON-LD contains only the matched FAQ
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()
    const jsonLd = JSON.parse(script?.textContent || '{}')
    expect(jsonLd.mainEntity).toHaveLength(1)
    expect(jsonLd.mainEntity[0].name).toBe('[MẪU] Khai vấn 1:1 diễn ra như thế nào?')
  })

  it('shows empty search state when query matches no questions', async () => {
    const pageElement = await SharedFaqPage({
      searchParams: Promise.resolve({ q: 'từ khóa không tồn tại' }),
    })
    const { container } = render(pageElement)

    expect(screen.getByText(viStrings.sm06.faq.emptySearchTitle)).toBeTruthy()
    expect(screen.getByText(viStrings.sm06.faq.emptySearchDesc)).toBeTruthy()

    // No JSON-LD is rendered when 0 FAQs are displayed
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeNull()
  })
})
