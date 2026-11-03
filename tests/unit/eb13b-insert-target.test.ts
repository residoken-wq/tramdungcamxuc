import React from 'react'
import { describe, it, expect } from 'vitest'
import type { Config, Data, ComponentData } from '@puckeditor/core'
import {
  getInsertTarget,
  getBlockPrimarySlot,
  getZoneItemCount,
  createTwoColumnContainerPattern,
} from '@/puck/editor/insert/insert-target'
import { ROOT_DISALLOW } from '@/puck/constants'

describe('EB-13b: Insert target determination', () => {
  const dummyRender = () => React.createElement('div')

  const mockConfig: Config = {
    components: {
      Container: {
        fields: {
          items: {
            type: 'slot',
            disallow: ['HeroTwoEntries', 'ChildCard'],
          },
        },
        defaultProps: { items: [] },
        render: dummyRender,
      },
      Columns: {
        fields: {
          col1: { type: 'slot' },
          col2: { type: 'slot' },
        },
        defaultProps: { col1: [], col2: [] },
        render: dummyRender,
      },
      TabsWidget: {
        fields: {
          items: {
            type: 'array',
            arrayFields: {
              content: {
                type: 'slot',
                disallow: ['HeroTwoEntries'],
              },
            },
          },
        },
        defaultProps: { items: [{ title: 'Tab 1', content: [] }] },
        render: dummyRender,
      },
      HeadingWidget: {
        fields: {
          text: { type: 'text' },
        },
        render: dummyRender,
      },
      TextWidget: {
        fields: {
          content: { type: 'richtext' },
        },
        render: dummyRender,
      },
      ImageWidget: {
        fields: {
          imageUrl: { type: 'text' },
        },
        render: dummyRender,
      },
      HeroTwoEntries: {
        fields: {},
        render: dummyRender,
      },
      ChildCard: {
        fields: {},
        render: dummyRender,
      },
    },
  }

  const sampleData: Data = {
    root: { props: { title: 'Test Page' } },
    content: [
      {
        type: 'HeadingWidget',
        props: { id: 'heading-1', text: 'Tiêu đề trang' },
      },
      {
        type: 'Container',
        props: {
          id: 'container-1',
          items: [
            {
              type: 'TextWidget',
              props: { id: 'text-1', content: 'Nội dung trong container' },
            },
          ],
        },
      },
    ],
    zones: {
      'container-1:items': [
        {
          type: 'TextWidget',
          props: { id: 'text-1', content: 'Nội dung trong container' },
        },
      ],
      'tabs-1:items[0].content': [
        {
          type: 'TextWidget',
          props: { id: 'tab-text-1', content: 'Nội dung tab 1' },
        },
      ],
    },
  }

  describe('getBlockPrimarySlot', () => {
    it('detects direct slot on Container ("items")', () => {
      expect(getBlockPrimarySlot(mockConfig, 'Container')).toBe('items')
    })

    it('detects first direct slot on Columns ("col1")', () => {
      expect(getBlockPrimarySlot(mockConfig, 'Columns')).toBe('col1')
    })

    it('detects array item slot on TabsWidget ("items[0].content")', () => {
      expect(getBlockPrimarySlot(mockConfig, 'TabsWidget')).toBe('items[0].content')
    })

    it('returns null for normal blocks without slots', () => {
      expect(getBlockPrimarySlot(mockConfig, 'HeadingWidget')).toBeNull()
      expect(getBlockPrimarySlot(mockConfig, 'TextWidget')).toBeNull()
      expect(getBlockPrimarySlot(mockConfig, 'ImageWidget')).toBeNull()
    })
  })

  describe('getZoneItemCount', () => {
    it('returns root content length for root zones', () => {
      expect(getZoneItemCount(sampleData, 'root:default-zone')).toBe(2)
      expect(getZoneItemCount(sampleData, 'default-zone')).toBe(2)
      expect(getZoneItemCount({ root: { props: {} }, content: [] }, 'root:default-zone')).toBe(0)
    })

    it('returns length from data.zones if present', () => {
      expect(getZoneItemCount(sampleData, 'container-1:items')).toBe(1)
      expect(getZoneItemCount(sampleData, 'tabs-1:items[0].content')).toBe(1)
    })

    it('falls back to parentItem props when not in data.zones', () => {
      const parentWithItems: ComponentData = {
        type: 'Container',
        props: {
          id: 'fresh-c',
          items: [{ type: 'TextWidget', props: { id: 't1' } }, { type: 'TextWidget', props: { id: 't2' } }],
        },
      }
      expect(
        getZoneItemCount({ root: { props: {} }, content: [] }, 'fresh-c:items', parentWithItems),
      ).toBe(2)
    })
  })

  describe('Case 3: Nothing selected -> inserts at end of page', () => {
    it('inserts at the end of root content when itemSelector is null', () => {
      const res = getInsertTarget({
        blockType: 'TextWidget',
        data: sampleData,
        config: mockConfig,
        itemSelector: null,
        selectedItem: null,
      })

      expect(res.allowed).toBe(true)
      if (res.allowed) {
        expect(res.destinationZone).toBe('root:default-zone')
        expect(res.destinationIndex).toBe(2) // sampleData has 2 root items
      }
    })

    it('inserts at index 0 when page content is empty', () => {
      const res = getInsertTarget({
        blockType: 'HeadingWidget',
        data: { root: { props: {} }, content: [] },
        config: mockConfig,
        itemSelector: undefined,
        selectedItem: undefined,
      })

      expect(res.allowed).toBe(true)
      if (res.allowed) {
        expect(res.destinationZone).toBe('root:default-zone')
        expect(res.destinationIndex).toBe(0)
      }
    })
  })

  describe('Case 1: Container with slot selected -> inserts at end of slot', () => {
    it('inserts at the end of Container slot ("items")', () => {
      const containerItem = sampleData.content[1]
      const res = getInsertTarget({
        blockType: 'ImageWidget',
        data: sampleData,
        config: mockConfig,
        itemSelector: { index: 1, zone: 'root:default-zone' },
        selectedItem: containerItem,
      })

      expect(res.allowed).toBe(true)
      if (res.allowed) {
        expect(res.destinationZone).toBe('container-1:items')
        expect(res.destinationIndex).toBe(1) // container-1 already has 1 item
        expect(res.parentType).toBe('Container')
      }
    })

    it('inserts into an empty container at index 0', () => {
      const emptyContainer: ComponentData = {
        type: 'Container',
        props: { id: 'empty-c', items: [] },
      }
      const res = getInsertTarget({
        blockType: 'HeadingWidget',
        data: { root: { props: {} }, content: [emptyContainer] },
        config: mockConfig,
        itemSelector: { index: 0, zone: 'root:default-zone' },
        selectedItem: emptyContainer,
      })

      expect(res.allowed).toBe(true)
      if (res.allowed) {
        expect(res.destinationZone).toBe('empty-c:items')
        expect(res.destinationIndex).toBe(0)
      }
    })

    it('inserts into TabsWidget array slot ("items[0].content")', () => {
      const tabsItem: ComponentData = {
        type: 'TabsWidget',
        props: { id: 'tabs-1', items: [{ title: 'Tab 1', content: [] }] },
      }
      const res = getInsertTarget({
        blockType: 'HeadingWidget',
        data: sampleData,
        config: mockConfig,
        itemSelector: { index: 0, zone: 'root:default-zone' },
        selectedItem: tabsItem,
      })

      expect(res.allowed).toBe(true)
      if (res.allowed) {
        expect(res.destinationZone).toBe('tabs-1:items[0].content')
        expect(res.destinationIndex).toBe(1) // sampleData has 1 item in tabs-1:items[0].content
        expect(res.parentType).toBe('TabsWidget')
      }
    })
  })

  describe('Case 2: Normal block selected -> inserts right after it in the same zone', () => {
    it('inserts right after normal block at root', () => {
      const headingItem = sampleData.content[0]
      const res = getInsertTarget({
        blockType: 'TextWidget',
        data: sampleData,
        config: mockConfig,
        itemSelector: { index: 0, zone: 'root:default-zone' },
        selectedItem: headingItem,
      })

      expect(res.allowed).toBe(true)
      if (res.allowed) {
        expect(res.destinationZone).toBe('root:default-zone')
        expect(res.destinationIndex).toBe(1) // index + 1
      }
    })

    it('inserts right after normal block inside a slot (slot lồng)', () => {
      const textItem = sampleData.zones!['container-1:items'][0]
      const res = getInsertTarget({
        blockType: 'ImageWidget',
        data: sampleData,
        config: mockConfig,
        itemSelector: { index: 0, zone: 'container-1:items' },
        selectedItem: textItem,
        getItemById: (id) => (id === 'container-1' ? sampleData.content[1] : null),
      })

      expect(res.allowed).toBe(true)
      if (res.allowed) {
        expect(res.destinationZone).toBe('container-1:items')
        expect(res.destinationIndex).toBe(1)
        expect(res.parentType).toBe('Container')
      }
    })

    it('inserts right after normal block inside items[0].content of TabsWidget', () => {
      const tabTextItem = sampleData.zones!['tabs-1:items[0].content'][0]
      const res = getInsertTarget({
        blockType: 'ImageWidget',
        data: sampleData,
        config: mockConfig,
        itemSelector: { index: 0, zone: 'tabs-1:items[0].content' },
        selectedItem: tabTextItem,
        getItemById: (id) =>
          id === 'tabs-1'
            ? ({
                type: 'TabsWidget',
                props: { id: 'tabs-1' },
              } as ComponentData)
            : null,
      })

      expect(res.allowed).toBe(true)
      if (res.allowed) {
        expect(res.destinationZone).toBe('tabs-1:items[0].content')
        expect(res.destinationIndex).toBe(1)
        expect(res.parentType).toBe('TabsWidget')
      }
    })
  })

  describe('Case 4: Disallowed block -> returns allowed: false', () => {
    it('rejects inserting ROOT_DISALLOW blocks at page root', () => {
      // Pick first element of ROOT_DISALLOW
      const disallowedType = ROOT_DISALLOW[0]
      const res = getInsertTarget({
        blockType: disallowedType,
        data: sampleData,
        config: {
          ...mockConfig,
          components: {
            ...mockConfig.components,
            [disallowedType]: { fields: {}, render: dummyRender },
          } as unknown as Config['components'],
        },
        itemSelector: null,
        selectedItem: null,
      })

      expect(res.allowed).toBe(false)
      if (!res.allowed) {
        expect(res.reason).toBe('disallowed')
      }
    })

    it('rejects blocks disallowed by slot disallow rule (HeroTwoEntries in Container)', () => {
      const containerItem = sampleData.content[1]
      const res = getInsertTarget({
        blockType: 'HeroTwoEntries',
        data: sampleData,
        config: mockConfig,
        itemSelector: { index: 1, zone: 'root:default-zone' },
        selectedItem: containerItem,
      })

      expect(res.allowed).toBe(false)
      if (!res.allowed) {
        expect(res.reason).toBe('disallowed')
      }
    })

    it('rejects unknown component types', () => {
      const res = getInsertTarget({
        blockType: 'NonExistentBlock',
        data: sampleData,
        config: mockConfig,
        itemSelector: null,
        selectedItem: null,
      })

      expect(res.allowed).toBe(false)
      if (!res.allowed) {
        expect(res.reason).toBe('unknown-type')
      }
    })
  })

  describe('EB-13b item 4: createTwoColumnContainerPattern', () => {
    it('creates a Container with row layout on desktop and column on mobile', () => {
      const pattern = createTwoColumnContainerPattern()
      expect(pattern.type).toBe('Container')
      expect((pattern.props as Record<string, unknown>).layout).toEqual({
        direction: { desktop: 'row', mobile: 'column' },
        gap: { desktop: 'md', mobile: 'md' },
        alignItems: { desktop: 'center' },
      })
    })

    it('contains ImageWidget and TextWidget with [MẪU]', () => {
      const pattern = createTwoColumnContainerPattern()
      const items = (pattern.props as unknown as { items: ComponentData[] }).items
      expect(Array.isArray(items)).toBe(true)
      expect(items).toHaveLength(2)

      const imageItem = items[0]
      const textItem = items[1]

      expect(imageItem.type).toBe('ImageWidget')
      expect(imageItem.props.caption).toContain('[MẪU]')

      expect(textItem.type).toBe('TextWidget')
      expect(String(textItem.props.content)).toContain('[MẪU]')
    })

    it('generates brand new, unique UUIDs on every invocation without duplicates', () => {
      const p1 = createTwoColumnContainerPattern()
      const p2 = createTwoColumnContainerPattern()

      const p1Items = (p1.props as unknown as { items: ComponentData[] }).items
      const p2Items = (p2.props as unknown as { items: ComponentData[] }).items

      // All IDs within p1 must be unique
      expect(p1.props.id).not.toBe(p1Items[0].props.id)
      expect(p1.props.id).not.toBe(p1Items[1].props.id)
      expect(p1Items[0].props.id).not.toBe(p1Items[1].props.id)

      // IDs between p1 and p2 must be different
      expect(p1.props.id).not.toBe(p2.props.id)
      expect(p1Items[0].props.id).not.toBe(p2Items[0].props.id)
      expect(p1Items[1].props.id).not.toBe(p2Items[1].props.id)
    })
  })
})
