/* eslint-disable @typescript-eslint/no-explicit-any -- fixtures read loose Puck JSON */
import { describe, expect, it } from 'vitest'
import type { Data } from '@puckeditor/core'
import { sanitizeChildColors } from '@/puck/migrations/sanitize-child-colors'
import { normalizePuckData } from '@/puck/migrations'

describe('PK-05: Sanitize Child Colors (Auto Fallback for Mismatched Backgrounds)', () => {
  it('IconCardGrid: chữ trắng trên lưới navy khi đổi lưới sang nền sáng tự về deep-navy', () => {
    // Ban đầu người dùng chọn chữ trắng khi lưới có nền navy, sau đó đổi sang warm-ivory
    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: 'IconCardGrid',
          props: {
            id: 'grid-light',
            bgColor: 'warm-ivory',
            cardStyle: 'white',
            cards: [
              {
                type: 'Card',
                props: {
                  id: 'card-1',
                  titleColor: 'white', // Không hợp lệ trên nền trắng
                  textColor: 'soft-pink', // Không hợp lệ trên nền trắng
                },
              },
            ],
          },
        },
      ],
    }

    const sanitized = sanitizeChildColors(data)
    const card = (sanitized.content[0] as any).props.cards[0]

    expect(card.props.titleColor).toBe('deep-navy')
    expect(card.props.textColor).toBe('deep-navy')
  })

  it('IconCardGrid: giữ nguyên màu hợp lệ (bright-magenta, deep-navy) trên nền sáng', () => {
    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: 'IconCardGrid',
          props: {
            id: 'grid-valid',
            bgColor: 'warm-ivory',
            cards: [
              {
                type: 'Card',
                props: {
                  id: 'card-valid',
                  titleColor: 'bright-magenta',
                  textColor: 'deep-navy',
                },
              },
            ],
          },
        },
      ],
    }

    const sanitized = sanitizeChildColors(data)
    const card = (sanitized.content[0] as any).props.cards[0]

    expect(card.props.titleColor).toBe('bright-magenta')
    expect(card.props.textColor).toBe('deep-navy')
  })

  it('StatsBar: ô số liệu khi đổi sang nền sáng hoặc nền navy tự sửa màu lệch', () => {
    // 1. StatsBar trên nền sáng mà valueColor là white -> tự về bright-magenta
    const dataLight: Data = {
      root: { props: {} },
      content: [
        {
          type: 'StatsBar',
          props: {
            id: 'stats-light',
            bgColor: 'warm-ivory',
            stats: [
              {
                type: 'Stat',
                props: {
                  id: 'stat-1',
                  valueColor: 'white', // Lệch
                  labelColor: 'soft-pink', // Lệch
                },
              },
            ],
          },
        },
      ],
    }

    const sanitizedLight = sanitizeChildColors(dataLight)
    const statLight = (sanitizedLight.content[0] as any).props.stats[0]
    expect(statLight.props.valueColor).toBe('bright-magenta')
    expect(statLight.props.labelColor).toBe('deep-navy')

    // 2. StatsBar trên nền deep-navy mà valueColor là bright-magenta (không đủ tương phản) -> tự về soft-pink
    const dataNavy: Data = {
      root: { props: {} },
      content: [
        {
          type: 'StatsBar',
          props: {
            id: 'stats-navy',
            bgColor: 'deep-navy',
            stats: [
              {
                type: 'Stat',
                props: {
                  id: 'stat-2',
                  valueColor: 'bright-magenta', // Lệch trên navy
                  labelColor: 'deep-navy', // Lệch trên navy
                },
              },
            ],
          },
        },
      ],
    }

    const sanitizedNavy = sanitizeChildColors(dataNavy)
    const statNavy = (sanitizedNavy.content[0] as any).props.stats[0]
    expect(statNavy.props.valueColor).toBe('soft-pink')
    expect(statNavy.props.labelColor).toBe('white')
  })

  it('FAQ: FaqItem tự sửa màu lệch nền khi đổi giữa nền sáng và deep-navy', () => {
    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: 'FAQ',
          props: {
            id: 'faq-sanitize',
            bgColor: 'warm-ivory',
            items: [
              {
                type: 'FaqItem',
                props: {
                  id: 'faq-1',
                  questionColor: 'white', // Lệch trên nền trắng
                  answerColor: 'soft-pink', // Lệch trên nền trắng
                },
              },
            ],
          },
        },
      ],
    }

    const sanitized = sanitizeChildColors(data)
    const item = (sanitized.content[0] as any).props.items[0]
    expect(item.props.questionColor).toBe('deep-navy')
    expect(item.props.answerColor).toBe('deep-navy')
  })

  it('Columns: khối con đặt trong cột (Card, Stat) được sanitize theo bgColor của Columns', () => {
    const dataColumns: Data = {
      root: { props: {} },
      content: [
        {
          type: 'Columns',
          props: {
            id: 'col-test',
            bgColor: 'deep-navy',
            col1: [
              {
                type: 'Card',
                props: {
                  id: 'card-in-col',
                  titleColor: 'deep-navy', // Lệch trên Columns navy
                  textColor: 'deep-navy', // Lệch trên Columns navy
                },
              },
            ],
            col2: [
              {
                type: 'Stat',
                props: {
                  id: 'stat-in-col',
                  valueColor: 'bright-magenta', // Lệch trên Columns navy
                  labelColor: 'deep-navy', // Lệch trên Columns navy
                },
              },
            ],
          },
        },
      ],
    }

    const sanitized = sanitizeChildColors(dataColumns)
    const colBlock = sanitized.content[0] as any

    const card = colBlock.props.col1[0]
    expect(card.props.titleColor).toBe('white')
    expect(card.props.textColor).toBe('white')

    const stat = colBlock.props.col2[0]
    expect(stat.props.valueColor).toBe('soft-pink')
    expect(stat.props.labelColor).toBe('white')
  })

  it('idempotent: chạy 2 lần cho kết quả toEqual giống hệt nhau', () => {
    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: 'IconCardGrid',
          props: {
            id: 'idem-grid',
            bgColor: 'warm-ivory',
            cards: [
              {
                type: 'Card',
                props: {
                  id: 'c1',
                  titleColor: 'white',
                  textColor: 'white',
                },
              },
            ],
          },
        },
      ],
    }

    const once = sanitizeChildColors(data)
    const twice = sanitizeChildColors(once)
    expect(twice).toEqual(once)
  })

  it('normalizePuckData tự động thực thi sanitizeChildColors sau migrations', () => {
    const raw = {
      content: [
        {
          type: 'IconCardGrid',
          props: {
            id: 'raw-grid',
            version: 2,
            bgColor: 'warm-ivory',
            cards: [
              {
                type: 'Card',
                props: {
                  id: 'raw-card',
                  titleColor: 'white',
                },
              },
            ],
          },
        },
      ],
    }

    const normalized = normalizePuckData(raw)
    const card = (normalized.content[0] as any).props.cards[0]
    expect(card.props.titleColor).toBe('deep-navy')
  })
})
