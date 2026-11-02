import React from 'react'
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { ComponentData, Config, Data } from '@puckeditor/core'
import {
  MAX_TEMPLATE_BYTES,
  MAX_TEMPLATE_BLOCKS,
  validateTemplatePuckData,
  remapBlockIds,
  remapPageBlockIds,
} from '../../src/puck/template-validation'

const mockConfig: Config = {
  components: {
    Container: {
      render: () => React.createElement(React.Fragment),
    },
    HeadingWidget: {
      render: () => React.createElement(React.Fragment),
    },
    TextWidget: {
      render: () => React.createElement(React.Fragment),
    },
    TabsWidget: {
      render: () => React.createElement(React.Fragment),
    },
  },
}

describe('EB-08: validateTemplatePuckData', () => {
  it('validates a correct section block with valid type and id', () => {
    const validSection: ComponentData = {
      type: 'Container',
      props: {
        id: 'container-1',
        title: 'Section title',
      },
    }
    const result = validateTemplatePuckData(validSection, 'section', mockConfig)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.blockCount).toBe(1)
    }
  })

  it('validates a nested section block structure counting all children', () => {
    const nestedSection: ComponentData = {
      type: 'Container',
      props: {
        id: 'container-1',
        items: [
          {
            type: 'HeadingWidget',
            props: { id: 'heading-1', text: 'Hello' },
          },
          {
            type: 'TextWidget',
            props: { id: 'text-1', text: 'World' },
          },
        ],
      },
    }
    const result = validateTemplatePuckData(nestedSection, 'section', mockConfig)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.blockCount).toBe(3)
    }
  })

  it('validates array-item slots like TabsWidget items[].content', () => {
    const tabsBlock: ComponentData = {
      type: 'TabsWidget',
      props: {
        id: 'tabs-1',
        items: [
          {
            label: 'Tab 1',
            content: [
              {
                type: 'TextWidget',
                props: { id: 'tab1-text', text: 'Tab 1 content' },
              },
            ],
          },
        ],
      },
    }
    const result = validateTemplatePuckData(tabsBlock, 'section', mockConfig)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.blockCount).toBe(2)
    }
  })

  it('validates a correct page data structure', () => {
    const pageData: Data = {
      content: [
        {
          type: 'Container',
          props: {
            id: 'c1',
            items: [{ type: 'HeadingWidget', props: { id: 'h1' } }],
          },
        },
        {
          type: 'TextWidget',
          props: { id: 't1' },
        },
      ],
      root: { props: { title: 'Test Page' } },
    }
    const result = validateTemplatePuckData(pageData, 'page', mockConfig)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.blockCount).toBe(3)
    }
  })

  it('rejects payloads exceeding 200 KB', () => {
    const hugeString = 'a'.repeat(MAX_TEMPLATE_BYTES + 500)
    const largeBlock: ComponentData = {
      type: 'TextWidget',
      props: {
        id: 'huge-1',
        text: hugeString,
      },
    }
    const result = validateTemplatePuckData(largeBlock, 'section', mockConfig)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('TOO_LARGE')
    }
  })

  it('rejects payloads exceeding 200 blocks', () => {
    const items: ComponentData[] = []
    for (let i = 0; i < MAX_TEMPLATE_BLOCKS + 5; i++) {
      items.push({
        type: 'TextWidget',
        props: { id: `text-${i}`, text: `Item ${i}` },
      })
    }
    const container: ComponentData = {
      type: 'Container',
      props: {
        id: 'container-overflow',
        items,
      },
    }
    const result = validateTemplatePuckData(container, 'section', mockConfig)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('TOO_MANY_BLOCKS')
    }
  })

  it('rejects unknown component types', () => {
    const rogueBlock: ComponentData = {
      type: 'MaliciousWidget',
      props: { id: 'bad-1' },
    }
    const result = validateTemplatePuckData(rogueBlock, 'section', mockConfig)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('UNKNOWN_TYPE')
    }
  })

  it('rejects invalid payload format', () => {
    expect(validateTemplatePuckData(null, 'section', mockConfig).success).toBe(false)
    expect(validateTemplatePuckData('not an object', 'section', mockConfig).success).toBe(false)
    expect(validateTemplatePuckData({ type: 'Container' }, 'section', mockConfig).success).toBe(
      false,
    )
    expect(validateTemplatePuckData({ notContent: [] }, 'page', mockConfig).success).toBe(false)
  })
})

describe('EB-08: remapBlockIds and remapPageBlockIds', () => {
  it('remaps IDs for a block and all nested child blocks at every slot depth', () => {
    const original: ComponentData = {
      type: 'Container',
      props: {
        id: 'orig-container',
        customText: 'Keep this property',
        items: [
          {
            type: 'HeadingWidget',
            props: { id: 'orig-heading', text: 'Title' },
          },
        ],
      },
    }

    const remapped = remapBlockIds(original)

    expect(remapped.props.id).not.toBe('orig-container')
    expect(remapped.props.id).toBeTruthy()
    expect(remapped.props.customText).toBe('Keep this property')

    const childItems = remapped.props.items as ComponentData[]
    expect(childItems[0].props.id).not.toBe('orig-heading')
    expect(childItems[0].props.id).toBeTruthy()
    expect(childItems[0].props.id).not.toBe(remapped.props.id)
    expect(childItems[0].props.text).toBe('Title')
  })

  it('remaps IDs for all blocks in a page Data object', () => {
    const pageData: Data = {
      content: [
        {
          type: 'Container',
          props: {
            id: 'page-c1',
            items: [{ type: 'HeadingWidget', props: { id: 'page-h1' } }],
          },
        },
        {
          type: 'TextWidget',
          props: { id: 'page-t1' },
        },
      ],
      root: { props: { title: 'My Page' } },
    }

    const remappedPage = remapPageBlockIds(pageData)

    expect(remappedPage.content[0].props.id).not.toBe('page-c1')
    const c1Items = remappedPage.content[0].props.items as ComponentData[]
    expect(c1Items[0].props.id).not.toBe('page-h1')
    expect(remappedPage.content[1].props.id).not.toBe('page-t1')

    // All remapped IDs should be unique
    const allIds = [
      remappedPage.content[0].props.id,
      c1Items[0].props.id,
      remappedPage.content[1].props.id,
    ]
    const uniqueIds = new Set(allIds)
    expect(uniqueIds.size).toBe(3)
  })
})
