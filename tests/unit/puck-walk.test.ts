import { describe, expect, it } from 'vitest'
import { walkPuckItems, type PuckItem } from '@/puck/walk'

describe('T1-01b: walkPuckItems recursive traversal', () => {
  it('visits ImageText located inside Columns.col2 slot', async () => {
    const visited: string[] = []

    const testData = {
      content: [
        {
          type: 'Columns',
          props: {
            numColumns: '2',
            col1: [
              {
                type: 'QuoteBlock',
                props: { quote: 'Sample quote in col1' },
              },
            ],
            col2: [
              {
                type: 'ImageText',
                props: {
                  mediaId: 'media-456',
                  titleLine1: 'Image in col2',
                },
              },
            ],
          },
        },
      ],
      root: { props: { title: 'Trang test' } },
    }

    await walkPuckItems(testData, (item: PuckItem) => {
      visited.push(
        `${item.type}:${(item.props.titleLine1 || item.props.quote || item.type) as string}`,
      )
    })

    expect(visited).toContain('Columns:Columns')
    expect(visited).toContain('QuoteBlock:Sample quote in col1')
    expect(visited).toContain('ImageText:Image in col2')
  })

  it('visits Columns nested inside a zone and all its slot children', async () => {
    const visitedTypes: string[] = []

    const testData = {
      content: [
        {
          type: 'HeroTwoEntries',
          props: { titleLine1: 'Hero' },
        },
      ],
      zones: {
        'sidebar-zone': [
          {
            type: 'Columns',
            props: {
              col1: [
                {
                  type: 'HeroImage',
                  props: { mediaId: 'media-789' },
                },
              ],
            },
          },
        ],
      },
      root: { props: { title: 'Zone test' } },
    }

    await walkPuckItems(testData, (item: PuckItem) => {
      visitedTypes.push(item.type)
    })

    expect(visitedTypes).toContain('HeroTwoEntries')
    expect(visitedTypes).toContain('Columns')
    expect(visitedTypes).toContain('HeroImage')
  })

  it('runs smoothly when data has no slots or only flat content', async () => {
    const visitedTypes: string[] = []

    const flatData = {
      content: [
        { type: 'RichText', props: { content: 'Đoạn 1' } },
        { type: 'Spacer', props: { height: 32 } },
      ],
      root: { props: { title: 'Flat test' } },
    }

    await walkPuckItems(flatData, (item: PuckItem) => {
      visitedTypes.push(item.type)
    })

    expect(visitedTypes).toEqual(['RichText', 'Spacer'])
  })

  it('handles empty, null, or undefined data safely without throwing', async () => {
    let count = 0
    await walkPuckItems(null, () => {
      count++
    })
    await walkPuckItems(undefined, () => {
      count++
    })
    await walkPuckItems({}, () => {
      count++
    })
    await walkPuckItems({ content: [] }, () => {
      count++
    })

    expect(count).toBe(0)
  })
})
