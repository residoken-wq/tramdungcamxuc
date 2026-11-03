import { describe, it, expect } from 'vitest'
import type { Data } from '@puckeditor/core'
import {
  isRootZone,
  resolvePropPath,
  getZoneItems,
  getMoveStatus,
  getMoveUpIndex,
  getMoveDownIndex,
  shouldHandleBlockShortcut,
} from '@/puck/editor/action-bar/actions-pure'

describe('EB-13a: Pure actions & zone calculations', () => {
  describe('isRootZone', () => {
    it('recognizes various representations of root zone', () => {
      expect(isRootZone()).toBe(true)
      expect(isRootZone(null)).toBe(true)
      expect(isRootZone('')).toBe(true)
      expect(isRootZone('root')).toBe(true)
      expect(isRootZone('default-zone')).toBe(true)
      expect(isRootZone('root:default-zone')).toBe(true)
      expect(isRootZone('container-1:items')).toBe(false)
      expect(isRootZone('tabs-1:items[0].content')).toBe(false)
    })
  })

  describe('resolvePropPath', () => {
    it('resolves direct array property', () => {
      const props = {
        items: [{ props: { id: 'item-1' } }, { props: { id: 'item-2' } }],
      }
      const res = resolvePropPath(props, 'items')
      expect(res).toHaveLength(2)
      expect(res[0].props.id).toBe('item-1')
    })

    it('resolves array slots like items[0].content', () => {
      const props = {
        items: [
          {
            title: 'Tab 1',
            content: [{ props: { id: 'sub-1' } }, { props: { id: 'sub-2' } }],
          },
          {
            title: 'Tab 2',
            content: [],
          },
        ],
      }
      const res = resolvePropPath(props, 'items[0].content')
      expect(res).toHaveLength(2)
      expect(res[0].props.id).toBe('sub-1')

      const emptyRes = resolvePropPath(props, 'items[1].content')
      expect(emptyRes).toHaveLength(0)

      const outOfBounds = resolvePropPath(props, 'items[5].content')
      expect(outOfBounds).toHaveLength(0)
    })

    it('returns empty array when property is missing or invalid', () => {
      expect(resolvePropPath({}, 'nonexistent')).toEqual([])
      expect(resolvePropPath(null, 'items')).toEqual([])
      expect(
        resolvePropPath({ items: 'not-an-array' } as unknown as Record<string, unknown>, 'items'),
      ).toEqual([])
    })
  })

  describe('getZoneItems & getMoveStatus', () => {
    const mockData: Data = {
      content: [
        { type: 'HeroTwoEntries', props: { id: 'hero-1' } },
        {
          type: 'Container',
          props: {
            id: 'con-1',
            items: [
              { type: 'HeadingWidget', props: { id: 'h-1' } },
              { type: 'TextWidget', props: { id: 't-1' } },
            ],
          },
        },
        {
          type: 'TabsWidget',
          props: {
            id: 'tabs-1',
            items: [
              {
                title: 'Tab 1',
                content: [
                  { type: 'HeadingWidget', props: { id: 'th-1' } },
                  { type: 'TextWidget', props: { id: 'tt-1' } },
                  { type: 'ButtonWidget', props: { id: 'tb-1' } },
                ],
              },
            ],
          },
        },
      ],
      root: { props: { title: 'Test' } },
      zones: {
        'custom-zone': [
          { type: 'HeadingWidget', props: { id: 'cz-1' } },
          { type: 'HeadingWidget', props: { id: 'cz-2' } },
        ],
      },
    }

    describe('Root zone calculation', () => {
      it('calculates status for start of root zone (index 0)', () => {
        const status = getMoveStatus(mockData, { index: 0, zone: 'root:default-zone' })
        expect(status.totalItems).toBe(3)
        expect(status.canMoveUp).toBe(false)
        expect(status.canMoveDown).toBe(true)
        expect(getMoveUpIndex(0)).toBeNull()
        expect(getMoveDownIndex(0, status.totalItems)).toBe(1)
      })

      it('calculates status for middle of root zone (index 1)', () => {
        const status = getMoveStatus(mockData, { index: 1, zone: 'root:default-zone' })
        expect(status.totalItems).toBe(3)
        expect(status.canMoveUp).toBe(true)
        expect(status.canMoveDown).toBe(true)
        expect(getMoveUpIndex(1)).toBe(0)
        expect(getMoveDownIndex(1, status.totalItems)).toBe(2)
      })

      it('calculates status for end of root zone (index 2)', () => {
        const status = getMoveStatus(mockData, { index: 2, zone: 'root:default-zone' })
        expect(status.totalItems).toBe(3)
        expect(status.canMoveUp).toBe(true)
        expect(status.canMoveDown).toBe(false)
        expect(getMoveUpIndex(2)).toBe(1)
        expect(getMoveDownIndex(2, status.totalItems)).toBeNull()
      })
    })

    describe('Nested slot (Container items)', () => {
      it('resolves container items and calculates start/end correctly', () => {
        const items = getZoneItems(mockData, 'con-1:items')
        expect(items).toHaveLength(2)
        expect(items[0].props.id).toBe('h-1')
        expect(items[1].props.id).toBe('t-1')

        // Index 0 of 2
        const status0 = getMoveStatus(mockData, { index: 0, zone: 'con-1:items' })
        expect(status0.totalItems).toBe(2)
        expect(status0.canMoveUp).toBe(false)
        expect(status0.canMoveDown).toBe(true)

        // Index 1 of 2
        const status1 = getMoveStatus(mockData, { index: 1, zone: 'con-1:items' })
        expect(status1.totalItems).toBe(2)
        expect(status1.canMoveUp).toBe(true)
        expect(status1.canMoveDown).toBe(false)
      })
    })

    describe('Array-item slot (Tabs items[0].content)', () => {
      it('resolves items in tab content slot and calculates start/middle/end', () => {
        const items = getZoneItems(mockData, 'tabs-1:items[0].content')
        expect(items).toHaveLength(3)
        expect(items[0].props.id).toBe('th-1')
        expect(items[2].props.id).toBe('tb-1')

        // Index 0
        const status0 = getMoveStatus(mockData, { index: 0, zone: 'tabs-1:items[0].content' })
        expect(status0.totalItems).toBe(3)
        expect(status0.canMoveUp).toBe(false)
        expect(status0.canMoveDown).toBe(true)

        // Index 1
        const status1 = getMoveStatus(mockData, { index: 1, zone: 'tabs-1:items[0].content' })
        expect(status1.totalItems).toBe(3)
        expect(status1.canMoveUp).toBe(true)
        expect(status1.canMoveDown).toBe(true)

        // Index 2
        const status2 = getMoveStatus(mockData, { index: 2, zone: 'tabs-1:items[0].content' })
        expect(status2.totalItems).toBe(3)
        expect(status2.canMoveUp).toBe(true)
        expect(status2.canMoveDown).toBe(false)
      })
    })

    describe('Data.zones dictionary', () => {
      it('resolves items stored in data.zones directly', () => {
        const items = getZoneItems(mockData, 'custom-zone')
        expect(items).toHaveLength(2)
        expect(items[0].props.id).toBe('cz-1')

        const status = getMoveStatus(mockData, { index: 0, zone: 'custom-zone' })
        expect(status.totalItems).toBe(2)
        expect(status.canMoveUp).toBe(false)
        expect(status.canMoveDown).toBe(true)
      })
    })

    describe('Single-item and empty zones', () => {
      it('disallows both move up and move down for single item zone', () => {
        const singleData: Data = {
          content: [{ type: 'HeadingWidget', props: { id: 'only-1' } }],
          root: { props: { title: 'Single' } },
        }
        const status = getMoveStatus(singleData, { index: 0, zone: 'root:default-zone' })
        expect(status.totalItems).toBe(1)
        expect(status.canMoveUp).toBe(false)
        expect(status.canMoveDown).toBe(false)
      })

      it('disallows both move up and move down for empty zone', () => {
        const emptyData: Data = {
          content: [],
          root: { props: { title: 'Empty' } },
        }
        const status = getMoveStatus(emptyData, { index: 0, zone: 'root:default-zone' })
        expect(status.totalItems).toBe(0)
        expect(status.canMoveUp).toBe(false)
        expect(status.canMoveDown).toBe(false)
      })

      it('safely handles null selector', () => {
        const status = getMoveStatus(mockData, null)
        expect(status.canMoveUp).toBe(false)
        expect(status.canMoveDown).toBe(false)
        expect(status.currentIndex).toBe(-1)
      })
    })
  })

  describe('shouldHandleBlockShortcut (focus detection)', () => {
    it('returns false when focus is inside an input element', () => {
      const input = document.createElement('input')
      input.type = 'text'
      document.body.appendChild(input)

      expect(shouldHandleBlockShortcut(input, input)).toBe(false)
      document.body.removeChild(input)
    })

    it('returns false when focus is inside a textarea element', () => {
      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)

      expect(shouldHandleBlockShortcut(textarea, textarea)).toBe(false)
      document.body.removeChild(textarea)
    })

    it('returns false when focus is inside a select element', () => {
      const select = document.createElement('select')
      document.body.appendChild(select)

      expect(shouldHandleBlockShortcut(select, select)).toBe(false)
      document.body.removeChild(select)
    })

    it('returns false when focus is inside a contenteditable container', () => {
      const editableDiv = document.createElement('div')
      editableDiv.setAttribute('contenteditable', 'true')
      const span = document.createElement('span')
      span.textContent = 'Editing text...'
      editableDiv.appendChild(span)
      document.body.appendChild(editableDiv)

      expect(shouldHandleBlockShortcut(editableDiv, editableDiv)).toBe(false)
      expect(shouldHandleBlockShortcut(span, span)).toBe(false)
      document.body.removeChild(editableDiv)
    })

    it('returns false when focus is inside a ProseMirror editor', () => {
      const editorDiv = document.createElement('div')
      editorDiv.className = 'ProseMirror'
      const p = document.createElement('p')
      editorDiv.appendChild(p)
      document.body.appendChild(editorDiv)

      expect(shouldHandleBlockShortcut(p, p)).toBe(false)
      document.body.removeChild(editorDiv)
    })

    it('returns true when target is a button, generic div, or canvas element', () => {
      const button = document.createElement('button')
      const div = document.createElement('div')
      document.body.appendChild(button)
      document.body.appendChild(div)

      expect(shouldHandleBlockShortcut(button, button)).toBe(true)
      expect(shouldHandleBlockShortcut(div, div)).toBe(true)
      expect(shouldHandleBlockShortcut(null, null)).toBe(true)

      document.body.removeChild(button)
      document.body.removeChild(div)
    })
  })
})
