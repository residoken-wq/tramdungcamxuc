import React from 'react'
import { describe, expect, it, vi as vitest } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vitest.mock('next/navigation', () => ({
  useRouter: () => ({ push() {} }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

import { puckConfig } from '../../src/puck/config'
import { TEXT_TARGETS } from '../../src/puck/style/text-targets'
import { HEADER_TEXT_TARGETS } from '../../src/puck/style/text-targets/headers'

const sample = {
  useDefaultCopy: true,
  seriesLabel: '[MẪU] Nhãn',
  titleLine1: '[MẪU] Dòng 1',
  titleLine2: '[MẪU] Dòng 2',
  emotionLine: '[MẪU] Cảm xúc',
  description: '[MẪU] Mô tả',
  title: '[MẪU] Tiêu đề',
  content: '[MẪU] Nội dung',
  bottomQuote: '[MẪU] Câu trích cuối',
  bottomQuoteLeft: '[MẪU] Câu trích cuối',
  italicQuoteLeft: '[MẪU] Câu trích',
  sourceNote: '[MẪU] Nguồn',
  topQuote: '[MẪU] Câu đầu',
  calloutTitle: '[MẪU] Khung',
  calloutText: '[MẪU] Nội dung khung',
}

/** Data some blocks need before they draw anything (all clearly sample data). */
const EXTRA: Record<string, Record<string, unknown>> = {
  TeamGrid: {
    _resolved: { members: [{ id: 1, name: '[MẪU] Thành viên', role: 'Coach', consent: true }] },
  },
  LeadMagnetCarousel: {
    _resolved: {
      items: [{ id: 1, name: '[MẪU] Ebook', slug: 'ebook-mau', href: '/tai-nguyen/mau' }],
    },
  },
  TrialCTA: {
    _resolved: {
      product: { id: 1, name: '[MẪU] Công cụ', slug: 'mau', saleStatus: 'on_sale', trialDays: 28 },
    },
  },
  ContactInfo: { _resolved: { contact: { email: 'mau@example.com', hotline: '0900000000' } } },
}

type Comp = {
  render: (p: Record<string, unknown>) => React.ReactElement
  defaultProps?: Record<string, unknown>
}

describe('Per-text colour / size on section headers (EB-15a extension)', () => {
  it('every block with text targets is a real block', () => {
    for (const name of Object.keys(TEXT_TARGETS)) {
      expect(puckConfig.components, name).toHaveProperty(name)
    }
  })

  for (const [name, defs] of Object.entries(HEADER_TEXT_TARGETS)) {
    it(`${name} marks every listed text so the style panel can reach it`, () => {
      const comp = puckConfig.components[name as keyof typeof puckConfig.components] as Comp
      const El = () =>
        comp.render({
          ...(comp.defaultProps ?? {}),
          ...sample,
          ...(EXTRA[name] ?? {}),
          id: 'B1',
          puck: { isEditing: true, renderDropZone: () => null },
        })
      const html = renderToStaticMarkup(<El />)
      const emitted = new Set([...html.matchAll(/data-eb-text="B1:([^"]+)"/g)].map((m) => m[1]))
      for (const def of defs) expect(emitted.has(def.key), `${name}.${def.key}`).toBe(true)
    })
  }
})
