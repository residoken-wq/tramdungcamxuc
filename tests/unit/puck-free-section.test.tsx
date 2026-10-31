import { describe, expect, it } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import type { Data } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'
import { ELEMENT_BLOCK_TYPES, ROOT_DISALLOW } from '@/puck/constants'
import { normalizePuckData } from '@/puck/migrations'
import { FreeSection } from '@/components/site/free-section/FreeSection'
import { HeadingEl, ParagraphEl } from '@/components/site/free-section/elements'

type AnyBlock = {
  fields?: Record<
    string,
    { type?: string; allow?: string[]; contentEditable?: boolean; options?: unknown[] }
  >
  defaultProps?: Record<string, unknown>
  render: (props: never) => React.ReactElement
}
const components = puckConfig.components as unknown as Record<string, AnyBlock>

describe('PK-13: Section tự do', () => {
  it('elements drop only into the free section columns, never at the page root or in Columns', () => {
    const fields = components.FreeSection.fields!
    for (const slot of ['col1', 'col2']) {
      expect(fields[slot].type).toBe('slot')
      expect(fields[slot].allow).toEqual([...ELEMENT_BLOCK_TYPES, 'Spacer'])
    }
    for (const type of ELEMENT_BLOCK_TYPES) {
      expect(ROOT_DISALLOW).toContain(type)
      expect(components.Columns.fields!.col1.allow ?? []).not.toContain(type)
      expect((components.Columns.fields!.col1 as { disallow?: string[] }).disallow).toContain(type)
    }
  })

  it('text elements have 4 size presets and no free font input', () => {
    for (const type of ['SeriesLabelEl', 'HeadingEl', 'ParagraphEl', 'EmotionEl']) {
      const size = components[type].fields!.size
      expect(size.type, type).toBe('select')
      expect(size.options, type).toHaveLength(4)
    }
  })

  it('renders the default section, and sizes change the classes', () => {
    const block = components.FreeSection
    const { container } = render(
      <FreeSection
        {...(block.defaultProps as object)}
        col1={<HeadingEl line1="Dòng 1" line2="Dòng 2" size="xl" />}
      />,
    )
    const h2 = container.querySelector('h2')!
    expect(h2.className).toContain('text-5xl')
    expect(h2.className).toContain('leading-[1.3]')
    expect(container.querySelector('section')?.getAttribute('data-bg')).toBe('warm-ivory')
  })

  it('every element renders inline-edited (React element) props without string operations', () => {
    for (const type of ELEMENT_BLOCK_TYPES) {
      const block = components[type]
      const props: Record<string, unknown> = { ...block.defaultProps, puck: { isEditing: true } }
      for (const [key, field] of Object.entries(block.fields ?? {})) {
        if (field.contentEditable) props[key] = <span>{`${type}:${key}`}</span>
      }
      const { unmount } = render(<>{block.render(props as never)}</>)
      unmount()
    }
    const { getByText } = render(<ParagraphEl content={<span>Sửa trực tiếp</span>} />)
    expect(getByText('Sửa trực tiếp')).toBeDefined()
  })

  it('a colour that fails contrast on the section background is reset when the page is read', () => {
    const data = {
      root: { props: {} },
      zones: {},
      content: [
        {
          type: 'FreeSection',
          props: {
            id: 'fs',
            bgColor: 'deep-navy',
            col1: [
              { type: 'ParagraphEl', props: { id: 'p', content: 'x', color: 'bright-magenta' } },
              {
                type: 'HeadingEl',
                props: {
                  id: 'h',
                  line1: 'a',
                  line2: 'b',
                  line1Color: 'deep-navy',
                  line2Color: 'bright-magenta',
                },
              },
            ],
            col2: [],
          },
        },
      ],
    } as unknown as Data
    const out = normalizePuckData(data)
    const col1 = (out.content[0].props as { col1: Array<{ props: Record<string, unknown> }> }).col1
    expect(col1[0].props.color).not.toBe('bright-magenta')
    expect(col1[1].props.line2Color).toBe('soft-pink')
  })
})
