import React from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { ExternalField } from '@puckeditor/core'
import { RecordSummary, clearRecordSummaryCache } from '@/puck/record-summary'
import { createServiceExternalField } from '@/puck/service-field'
import { createProductExternalField } from '@/puck/product-field'
import { createPageExternalField } from '@/puck/page-field'
import { createProgramExternalField } from '@/puck/program-field'
import { createTestimonialExternalField } from '@/puck/testimonial-field'
import { createMediaExternalField } from '@/puck/media-field'

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

const fetchMock = vi.fn()

beforeEach(() => {
  clearRecordSummaryCache()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('RecordSummary (PK-06)', () => {
  test('hiện "Đang tải…" rồi hiện tên bản ghi', async () => {
    let resolve: (r: Response) => void = () => {}
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)))
    render(<RecordSummary collection="products" id="7" />)
    expect(screen.getByText('Đang tải…')).toBeTruthy()
    resolve(jsonResponse({ id: 7, name: '[MẪU] Gói CLEAR' }))
    expect(await screen.findByText('[MẪU] Gói CLEAR')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith('/api/products/7?depth=0', { credentials: 'include' })
  })

  test('dùng title / alt khi bản ghi không có name', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.startsWith('/api/pages/')
        ? jsonResponse({ title: '[MẪU] Trang dịch vụ' })
        : jsonResponse({ alt: '[MẪU] Ảnh chân dung', thumbnailURL: '/media/thumb.webp' }),
    )
    render(
      <>
        <RecordSummary collection="pages" id="3" />
        <RecordSummary collection="media" id="4" />
      </>,
    )
    expect(await screen.findByText('[MẪU] Trang dịch vụ')).toBeTruthy()
    expect(await screen.findByText('[MẪU] Ảnh chân dung')).toBeTruthy()
    expect(document.querySelector('img')?.getAttribute('src')).toBe('/media/thumb.webp')
  })

  test('không tìm thấy hoặc lỗi mạng → "Không tìm thấy (ID: …)"', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/9?')) return jsonResponse({}, false)
      throw new Error('offline')
    })
    render(
      <>
        <RecordSummary collection="services" id="9" />
        <RecordSummary collection="services" id="10" />
      </>,
    )
    expect(await screen.findByText('Không tìm thấy (ID: 9)')).toBeTruthy()
    expect(await screen.findByText('Không tìm thấy (ID: 10)')).toBeTruthy()
  })

  test('cache: nhiều thẻ cùng một bản ghi chỉ gọi API một lần', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ name: '[MẪU] Gói BUILD' }))
    render(
      <>
        <RecordSummary collection="products" id="2" />
        <RecordSummary collection="products" id="2" />
        <RecordSummary collection="products" id={2} />
      </>,
    )
    expect(await screen.findAllByText('[MẪU] Gói BUILD')).toHaveLength(3)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('6 ô chọn đều hiện tên qua RecordSummary, ô trống giữ chữ "Chưa chọn"', () => {
    const fields: Array<[ExternalField<string | number | undefined>, string]> = [
      [createServiceExternalField(), 'services'],
      [createProductExternalField(), 'products'],
      [createPageExternalField(), 'pages'],
      [createProgramExternalField(), 'programs'],
      [createTestimonialExternalField(), 'testimonials'],
      [createMediaExternalField(), 'media'],
    ]
    for (const [field, collection] of fields) {
      const summary = field.getItemSummary?.('5') as React.ReactElement<{
        collection: string
        id: string
      }>
      expect(summary.type).toBe(RecordSummary)
      expect(summary.props).toEqual({ collection, id: '5' })
      expect(String(field.getItemSummary?.('' as never))).toMatch(/^Chưa chọn/)
    }
  })
})
