import { puckConfig } from '@/puck/config'
import React from 'react'
import { describe, it, expect, beforeEach, vi as vitestVi } from 'vitest'
import {
  copyBlock,
  readClipboard,
  clearClipboard,
  prepareForPaste,
  isAllowedInZone,
  MAX_CLIPBOARD_BYTES,
} from '@/puck/editor/context-menu/clipboard'
import type { Config, ComponentData } from '@puckeditor/core'

const dummyRender = () => React.createElement('div')

const mockConfig: Config = {
  components: {
    HeadingWidget: { render: dummyRender },
    Container: { render: dummyRender },
    TabsWidget: { render: dummyRender },
    Card: { render: dummyRender },
    IconCardGrid: { render: dummyRender },
    ButtonWidget: { render: dummyRender },
  },
}

describe('EB-07: clipboard operations', () => {
  beforeEach(() => {
    clearClipboard()
  })

  it('copies and reads block from localStorage', () => {
    const item: ComponentData = {
      type: 'HeadingWidget',
      props: { id: 'orig-1', text: 'Hello World' },
    }
    copyBlock(item)
    const read = readClipboard()
    expect(read).not.toBeNull()
    expect(read?.v).toBe(1)
    expect(read?.item.type).toBe('HeadingWidget')
    expect(read?.item.props.text).toBe('Hello World')
  })

  it('falls back to memory clipboard if localStorage throws', () => {
    const originalSetItem = window.localStorage.setItem
    window.localStorage.setItem = vitestVi.fn(() => {
      throw new Error('QuotaExceededError')
    })

    const item: ComponentData = {
      type: 'ButtonWidget',
      props: { id: 'btn-1', text: 'Click me' },
    }
    copyBlock(item)

    // Reading should still return the memory copy
    const read = readClipboard()
    expect(read).not.toBeNull()
    expect(read?.item.type).toBe('ButtonWidget')

    window.localStorage.setItem = originalSetItem
  })
})

describe('EB-07: isAllowedInZone follows the slot rules of the real config', () => {
  const config = puckConfig as unknown as Config

  it('page root refuses child cards and free-section elements', () => {
    expect(isAllowedInZone('Card', 'root:default-zone')).toBe(false)
    expect(isAllowedInZone('HeadingEl', 'root:default-zone')).toBe(false)
    expect(isAllowedInZone('HeadingWidget', 'root:default-zone')).toBe(true)
    expect(isAllowedInZone('Container', 'root:default-zone')).toBe(true)
  })

  it('Container slot accepts blocks and nested Containers, not child cards', () => {
    expect(isAllowedInZone('HeadingWidget', 'cnt-1:items', 'Container', config)).toBe(true)
    expect(isAllowedInZone('Container', 'cnt-1:items', 'Container', config)).toBe(true)
    expect(isAllowedInZone('Card', 'cnt-1:items', 'Container', config)).toBe(false)
  })

  it('slot inside an array item (Tabs) uses that field', () => {
    expect(isAllowedInZone('TextWidget', 'tabs-1:items[1].content', 'TabsWidget', config)).toBe(
      true,
    )
    expect(isAllowedInZone('Card', 'tabs-1:items[1].content', 'TabsWidget', config)).toBe(false)
  })

  it('a parent with an allow list only takes those blocks', () => {
    expect(isAllowedInZone('Card', 'grid-1:cards', 'IconCardGrid', config)).toBe(true)
    expect(isAllowedInZone('HeroTwoEntries', 'grid-1:cards', 'IconCardGrid', config)).toBe(false)
  })

  it('unknown slot or parent refuses (no guessing)', () => {
    expect(isAllowedInZone('HeadingWidget', 'x:nope', 'Container', config)).toBe(false)
    expect(isAllowedInZone('HeadingWidget', 'x:items', 'NoSuchBlock', config)).toBe(false)
    expect(isAllowedInZone('HeadingWidget', 'x:items', 'Container')).toBe(false)
  })
})

describe('EB-07: prepareForPaste (// REVIEW-REQUIRED)', () => {
  it('rejects empty or invalid payload', () => {
    expect(prepareForPaste(null, mockConfig, 'root:default-zone')).toEqual({
      success: false,
      reason: 'empty-clipboard',
    })
    expect(prepareForPaste({ foo: 'bar' }, mockConfig, 'root:default-zone')).toEqual({
      success: false,
      reason: 'invalid-payload',
    })
  })

  it('rejects unknown component types', () => {
    const item = {
      type: 'MaliciousUnknownComponent',
      props: { id: 'x-1' },
    }
    const res = prepareForPaste(item, mockConfig, 'root:default-zone')
    expect(res).toEqual({ success: false, reason: 'unknown-type' })
  })

  it('rejects blocks not allowed in the target zone', () => {
    const item = {
      type: 'Card',
      props: { id: 'card-1' },
    }
    const res = prepareForPaste(item, mockConfig, 'root:default-zone')
    expect(res).toEqual({ success: false, reason: 'not-allowed-here' })
  })

  it('rejects payloads exceeding size limit (> 200 KB)', () => {
    const bigText = 'A'.repeat(MAX_CLIPBOARD_BYTES + 100)
    const item = {
      type: 'HeadingWidget',
      props: { id: 'h-1', text: bigText },
    }
    const res = prepareForPaste(item, mockConfig, 'root:default-zone')
    expect(res).toEqual({ success: false, reason: 'too-large' })
  })

  it('regenerates brand new UUIDs for top-level and nested slot blocks (including Tabs items)', () => {
    const item: ComponentData = {
      type: 'Container',
      props: {
        id: 'orig-container',
        content: [
          {
            type: 'TabsWidget',
            props: {
              id: 'orig-tabs',
              items: [
                {
                  title: 'Tab 1',
                  content: [
                    {
                      type: 'HeadingWidget',
                      props: { id: 'orig-heading-in-tab', text: 'Hello in tab' },
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    }

    const res = prepareForPaste(item, mockConfig, 'root:default-zone')
    expect(res.success).toBe(true)
    if (!res.success) return

    const pasted = res.item
    expect(pasted.type).toBe('Container')
    expect(pasted.props.id).not.toBe('orig-container')
    expect(typeof pasted.props.id).toBe('string')

    const childSlots = pasted.props.content as ComponentData[]
    expect(childSlots).toHaveLength(1)
    const pastedTabs = childSlots[0]
    expect(pastedTabs.type).toBe('TabsWidget')
    expect(pastedTabs.props.id).not.toBe('orig-tabs')

    const items = pastedTabs.props.items as Array<{ title: string; content: ComponentData[] }>
    expect(items).toHaveLength(1)
    const nestedHeading = items[0].content[0]
    expect(nestedHeading.type).toBe('HeadingWidget')
    expect(nestedHeading.props.id).not.toBe('orig-heading-in-tab')
    expect(nestedHeading.props.text).toBe('Hello in tab')

    // Verify all generated IDs are unique
    const allIds = [pasted.props.id, pastedTabs.props.id, nestedHeading.props.id]
    expect(new Set(allIds).size).toBe(3)
  })

  it('rejects payloads exceeding max block count (> 200 blocks)', () => {
    // Construct a deeply nested structure or wide array with > 200 blocks
    const nestedChildren: ComponentData[] = []
    for (let i = 0; i < 205; i++) {
      nestedChildren.push({
        type: 'HeadingWidget',
        props: { id: `child-${i}`, text: `Heading ${i}` },
      })
    }
    const item: ComponentData = {
      type: 'Container',
      props: {
        id: 'big-container',
        content: nestedChildren,
      },
    }

    const res = prepareForPaste(item, mockConfig, 'root:default-zone')
    expect(res).toEqual({ success: false, reason: 'too-many-blocks' })
  })
})
