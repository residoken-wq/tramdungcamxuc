import { describe, expect, it } from 'vitest'
import {
  checkPuckPage,
  collectPuckBlocks,
  hasText,
  PUCK_BLOCK_FIELDS,
} from '../../scripts/report-empty-copy'

describe('BX-05 report-empty-copy (read-only pre-deploy report)', () => {
  it('hasText: blank strings and empty lists count as empty', () => {
    expect(hasText('  ')).toBe(false)
    expect(hasText([])).toBe(false)
    expect(hasText(null)).toBe(false)
    expect(hasText('Chữ')).toBe(true)
    expect(hasText([{ q: 1 }])).toBe(true)
  })

  it('collects blocks nested in slots and zones, not only top-level content', () => {
    const blocks = collectPuckBlocks({
      content: [
        {
          type: 'Columns',
          props: { id: 'c', column1: [{ type: 'HeroTwoEntries', props: { id: 'h' } }] },
        },
      ],
      zones: { 'c:extra': [{ type: 'QuoteBlock', props: { id: 'q' } }] },
    })
    expect(blocks.map((b) => b.type)).toEqual(['Columns', 'HeroTwoEntries', 'QuoteBlock'])
  })

  it('reports only blocks that have the "Dùng chữ mặc định" field, with the right status', () => {
    const report: Parameters<typeof checkPuckPage>[0] = []
    checkPuckPage(report, 'Trang: Test', {
      content: [
        { type: 'Columns', props: { id: 'c', titleLine1: '' } },
        { type: 'QuoteBlock', props: { id: 'q1', quote: '' } },
        { type: 'QuoteBlock', props: { id: 'q2', quote: '', useDefaultCopy: true } },
        {
          type: 'HeroTwoEntries',
          props: {
            id: 'h',
            seriesLabel: 'a',
            titleLine1: 'b',
            titleLine2: 'c',
            emotionLine: 'd',
            description: 'e',
          },
        },
      ],
    })
    expect(report).toHaveLength(2)
    expect(report[0]).toMatchObject({
      group: 'Khối 2: QuoteBlock',
      status: 'Sẽ ẩn khi deploy (Tắt)',
    })
    expect(report[0].emptyFields).toEqual(['quote', 'cite', 'roleOrContext'])
    expect(report[1]).toMatchObject({ status: 'Hiện chữ mặc định (Bật)' })
  })

  it('covers every Puck block that got the useDefaultCopy field', () => {
    expect(Object.keys(PUCK_BLOCK_FIELDS).sort()).toEqual([
      'Callout',
      'FAQ',
      'HanaStory',
      'HeroImage',
      'HeroTwoEntries',
      'QuoteBlock',
      'SolutionEcosystem',
    ])
  })
})
