import React from 'react'
import { describe, expect, it } from 'vitest'
import type { Data } from '@puckeditor/core'
import { render } from '@testing-library/react'
import { applyPuckMigrations, migrateFAQV2ToV3 } from '@/puck/migrations'
import { FAQ as FAQComponent } from '@/components/site/FAQ'
import * as seedData from '../../seed/data'

function wrapBlock(type: string, props: Record<string, unknown>): Data {
  return {
    root: {},
    content: [{ type, props: props as never }],
  }
}

describe('SM-06: Puck Migrations for FAQ v3', () => {
  it('migrates v1 FAQ props to v3 with source manual, default group, and limit', () => {
    const v1Data = wrapBlock('FAQ', {
      id: 'faq-v1',
      titleLine1: 'CÂU HỎI THƯỜNG GẶP',
      items: [{ question: '[MẪU] Câu hỏi 1', answer: '[MẪU] Trả lời 1' }],
    })

    const migrated = applyPuckMigrations(v1Data)
    const block = migrated.content[0]
    expect(block.props).toMatchObject({
      version: 4,
      source: 'manual',
      group: 'general',
      limit: 5,
      titleLine1: 'CÂU HỎI THƯỜNG GẶP',
    })
  })

  it('migrates v2 FAQ props to v3 preserving existing v2 properties', () => {
    const v2Data = wrapBlock('FAQ', {
      id: 'faq-v2',
      version: 2,
      numbered: true,
      aside: 'booking',
      bookingAsideTitle: 'Cần hỗ trợ riêng?',
      seeAllLink: '/lien-he',
      items: [
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ],
    })

    const migrated = migrateFAQV2ToV3(v2Data)
    const block = migrated.content[0]
    expect(block.props).toMatchObject({
      version: 3,
      numbered: true,
      aside: 'booking',
      bookingAsideTitle: 'Cần hỗ trợ riêng?',
      seeAllLink: '/lien-he',
      source: 'manual',
      group: 'general',
      limit: 5,
    })
  })

  it('preserves custom source and group when already specified', () => {
    const customData = wrapBlock('FAQ', {
      id: 'faq-custom',
      version: 2,
      source: 'group',
      group: 'coaching',
      limit: 8,
    })

    const migrated = migrateFAQV2ToV3(customData)
    const block = migrated.content[0]
    expect(block.props).toMatchObject({
      version: 3,
      source: 'group',
      group: 'coaching',
      limit: 8,
    })
  })

  it('recursively migrates FAQ blocks inside zones and slots', () => {
    const zoneData: Data = {
      root: {},
      content: [
        {
          type: 'Columns',
          props: {
            id: 'col-1',
          },
        },
      ],
      zones: {
        'col-1:col-left': [
          {
            type: 'FAQ',
            props: {
              id: 'nested-faq',
              version: 2,
              titleLine1: 'FAQ TRONG CỘT',
              items: [{ question: 'Nested Q', answer: 'Nested A' }],
            },
          },
        ],
      },
    }

    const migrated = applyPuckMigrations(zoneData)
    const nested = migrated.zones?.['col-1:col-left']?.[0]
    expect(nested).toBeDefined()
    expect(nested?.props).toMatchObject({
      version: 4,
      source: 'manual',
      group: 'general',
      limit: 5,
    })
  })

  it('is idempotent: running migrations twice produces the identical output', () => {
    const syntheticData: Data = {
      root: { props: { title: 'Trang Test FAQ' } },
      content: [
        {
          type: 'FAQ',
          props: {
            id: 'faq-synthetic',
            items: [{ question: 'Q', answer: 'A' }],
          },
        },
      ],
    }

    const run1 = applyPuckMigrations(syntheticData)
    const run2 = applyPuckMigrations(run1)
    expect(run2).toEqual(run1)

    // Also verify on all seed pages
    for (const page of seedData.pages) {
      const puckData: Data = {
        root: { props: { title: page.title } },
        content: page.blocks as unknown as Data['content'],
      }
      if (!puckData.content || puckData.content.length === 0) continue

      const pageRun1 = applyPuckMigrations(puckData)
      const pageRun2 = applyPuckMigrations(pageRun1)
      expect(pageRun2).toEqual(pageRun1)
    }
  })

  it('renders identical HTML output before and after migration for manual FAQs', () => {
    const v2Props = {
      id: 'faq-html-check',
      version: 2,
      titleLine1: 'CÂU HỎI THƯỜNG GẶP',
      titleLine2: 'Giải đáp thắc mắc',
      items: [
        { question: 'Làm sao để đăng ký?', answer: 'Điền form liên hệ.' },
        { question: 'Có khóa học online không?', answer: 'Có, học qua Zoom.' },
      ],
    }

    const v3Props = {
      ...v2Props,
      version: 3,
      source: 'manual' as const,
      group: 'general' as const,
      limit: 5,
    }

    const { container: containerV2 } = render(React.createElement(FAQComponent, v2Props as never))
    const { container: containerV3 } = render(React.createElement(FAQComponent, v3Props as never))

    expect(containerV3.innerHTML).toBe(containerV2.innerHTML)
  })

  it('migrates all FAQ blocks in seedData.pages to version 3', () => {
    for (const page of seedData.pages) {
      const puckData: Data = {
        root: { props: { title: page.title } },
        content: page.blocks as unknown as Data['content'],
      }
      if (!puckData.content || puckData.content.length === 0) continue

      const migrated = applyPuckMigrations(puckData)
      for (const block of migrated.content) {
        if (block.type === 'FAQ') {
          expect((block.props as { version?: number }).version).toBe(4)
          expect((block.props as { source?: string }).source).toBeDefined()
        }
      }
    }
  })
})
