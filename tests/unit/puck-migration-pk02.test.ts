/* eslint-disable @typescript-eslint/no-explicit-any -- fixtures read loose Puck JSON and resolveFields params */
import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Data } from '@puckeditor/core'
import { migrateIconCardGridV1ToV2 } from '@/puck/migrations/v2-icon-card-grid'
import { normalizePuckData } from '@/puck/migrations'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { IconCard } from '@/components/site/IconCard'

describe('PK-02: IconCardGrid migration v1 -> v2', () => {
  const legacyGridData: Data = {
    root: { props: { title: 'Test Migration' } },
    content: [
      {
        type: 'IconCardGrid',
        props: {
          id: 'test-grid',
          version: 1,
          seriesLabel: 'SERIES 01',
          titleLine1: 'TIÊU ĐỀ 1',
          titleLine2: 'TIÊU ĐỀ 2',
          emotionLine: 'Dòng cảm xúc',
          marker: 'icon',
          columns: 3,
          cardStyle: 'white',
          bgColor: 'warm-ivory',
          padding: 'md',
          items: [
            {
              icon: 'target',
              title: 'Thẻ 1 - Nhận diện',
              text: 'Nội dung chi tiết thẻ 1',
            },
            {
              icon: 'heart',
              title: 'Thẻ 2 - Thấu cảm',
              text: 'Nội dung chi tiết thẻ 2',
            },
            {
              icon: 'spark',
              title: 'Thẻ 3 - Chuyển hóa',
              text: 'Nội dung chi tiết thẻ 3',
            },
          ],
        },
      },
    ],
  }

  it('chuyển đổi đúng cấu trúc: items thành cards slot và xoá items', () => {
    const migrated = migrateIconCardGridV1ToV2(legacyGridData)
    const block = migrated.content[0] as any

    expect(block.type).toBe('IconCardGrid')
    expect(block.props.version).toBe(2)
    expect(block.props.items).toBeUndefined()
    expect(Array.isArray(block.props.cards)).toBe(true)
    expect(block.props.cards.length).toBe(3)

    // Check each card structure
    const [c0, c1, c2] = block.props.cards
    expect(c0.type).toBe('Card')
    expect(c0.props.id).toBe('test-grid-card-0')
    expect(c0.props.icon).toBe('target')
    expect(c0.props.title).toBe('Thẻ 1 - Nhận diện')
    expect(c0.props.text).toBe('Nội dung chi tiết thẻ 1')
    expect(c0.props.titleColor).toBe('deep-navy')
    expect(c0.props.textColor).toBe('deep-navy')
    expect(c0.props.titleSize).toBe('md')
    expect(c0.props.textSize).toBe('md')
    expect(c0.props.align).toBe('left')

    expect(c1.props.id).toBe('test-grid-card-1')
    expect(c1.props.icon).toBe('heart')
    expect(c1.props.title).toBe('Thẻ 2 - Thấu cảm')

    expect(c2.props.id).toBe('test-grid-card-2')
    expect(c2.props.icon).toBe('spark')
    expect(c2.props.title).toBe('Thẻ 3 - Chuyển hóa')
  })

  it('bảo toàn tất cả thuộc tính cấp lưới: seriesLabel, titles, emotionLine, columns, cardStyle, bgColor, padding', () => {
    const migrated = migrateIconCardGridV1ToV2(legacyGridData)
    const props = (migrated.content[0] as any).props

    expect(props.seriesLabel).toBe('SERIES 01')
    expect(props.titleLine1).toBe('TIÊU ĐỀ 1')
    expect(props.titleLine2).toBe('TIÊU ĐỀ 2')
    expect(props.emotionLine).toBe('Dòng cảm xúc')
    expect(props.columns).toBe(3)
    expect(props.cardStyle).toBe('white')
    expect(props.bgColor).toBe('warm-ivory')
    expect(props.padding).toBe('md')
  })

  it('tính idempotent: chạy lần 2 trên dữ liệu đã v2 thì không làm thay đổi', () => {
    const migratedOnce = migrateIconCardGridV1ToV2(legacyGridData)
    const migratedTwice = migrateIconCardGridV1ToV2(migratedOnce)

    expect(migratedTwice).toEqual(migratedOnce)
  })

  it('xử lý đệ quy: IconCardGrid nằm trong slot của block khác (Columns.col1) vẫn được migrate', () => {
    const nestedData: Data = {
      root: { props: { title: 'Nested' } },
      content: [
        {
          type: 'Columns',
          props: {
            id: 'cols-1',
            version: 1,
            numColumns: '2',
            col1: [
              {
                type: 'IconCardGrid',
                props: {
                  id: 'nested-grid',
                  version: 1,
                  marker: 'number',
                  items: [
                    {
                      icon: 'star',
                      title: 'Thẻ lồng',
                      text: 'Mô tả thẻ lồng trong cột 1',
                    },
                  ],
                },
              },
            ],
            col2: [],
          },
        },
      ],
    }

    const migrated = migrateIconCardGridV1ToV2(nestedData)
    const col1Blocks = (migrated.content[0] as any).props.col1
    const nestedGrid = col1Blocks[0]

    expect(nestedGrid.type).toBe('IconCardGrid')
    expect(nestedGrid.props.version).toBe(2)
    expect(nestedGrid.props.items).toBeUndefined()
    expect(nestedGrid.props.cards.length).toBe(1)
    expect(nestedGrid.props.cards[0].props.title).toBe('Thẻ lồng')
    expect(nestedGrid.props.cards[0].props.id).toBe('nested-grid-card-0')
  })

  it('normalizePuckData xử lý an toàn cả chuỗi JSON và object thô', () => {
    // Pass raw JSON string
    const jsonStr = JSON.stringify(legacyGridData)
    const fromJson = normalizePuckData(jsonStr)
    expect((fromJson.content[0] as any).props.version).toBe(2)
    expect((fromJson.content[0] as any).props.cards.length).toBe(3)

    // Pass invalid inputs
    expect(normalizePuckData(null)).toEqual({
      content: [],
      root: { props: { title: '' } },
      zones: {},
    })
    expect(normalizePuckData('')).toEqual({
      content: [],
      root: { props: { title: '' } },
      zones: {},
    })
    expect(normalizePuckData('invalid json')).toEqual({
      content: [],
      root: { props: { title: '' } },
      zones: {},
    })
  })

  it('HTML output: render dữ liệu v1 (sau normalizePuckData) có giao diện và cấu trúc tương đương', () => {
    const normalized = normalizePuckData(legacyGridData)
    const gridProps = (normalized.content[0] as any).props

    // Render cards via the slot
    const slotCards = React.createElement(
      React.Fragment,
      null,
      gridProps.cards.map((c: any) =>
        React.createElement(IconCard, { key: c.props.id, ...c.props }),
      ),
    )

    const htmlV2 = renderToStaticMarkup(
      React.createElement(IconCardGrid, { ...gridProps, cards: slotCards }),
    )

    // Must contain titles and texts from original items
    expect(htmlV2).toContain('Thẻ 1 - Nhận diện')
    expect(htmlV2).toContain('Nội dung chi tiết thẻ 1')
    expect(htmlV2).toContain('Thẻ 2 - Thấu cảm')
    expect(htmlV2).toContain('Nội dung chi tiết thẻ 2')
    expect(htmlV2).toContain('Thẻ 3 - Chuyển hóa')
    expect(htmlV2).toContain('Nội dung chi tiết thẻ 3')

    // Must have the data attributes on container
    expect(htmlV2).toContain('data-card-style="white"')
    expect(htmlV2).toContain('data-marker="icon"')
    expect(htmlV2).toContain('data-grid-bg="warm-ivory"')
  })
  it('bỏ item rỗng (không tiêu đề, không nội dung) như component v1, không sinh thẻ trắng', () => {
    const data: Data = {
      root: { props: {} },
      content: [
        {
          type: 'IconCardGrid',
          props: {
            id: 'grid-empty',
            items: [
              { icon: 'star', title: '', text: '' },
              { icon: 'heart', title: 'Thẻ còn chữ', text: '' },
              null,
            ],
          },
        } as any,
      ],
    }
    const out = migrateIconCardGridV1ToV2(data)
    const cards = (out.content[0] as any).props.cards
    expect(cards).toHaveLength(1)
    expect(cards[0].props.title).toBe('Thẻ còn chữ')
    expect(migrateIconCardGridV1ToV2(out)).toEqual(out)
  })
})
