import { describe, expect, it } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { puckConfig } from '@/puck/config'
import { RichText } from '@/components/site/RichText'
import { bodyColorClass } from '@/lib/brand/text-presets'

const PK10_BLOCKS = ['RichText', 'ImageText', 'Callout', 'CTASection', 'QuoteBlock'] as const

describe('PK-10: text format presets', () => {
  it('every PK-10 block exposes preset size fields (no free input)', () => {
    for (const name of PK10_BLOCKS) {
      const fields = puckConfig.components[name].fields as Record<string, { type: string }>
      const sizeKeys = Object.keys(fields).filter((k) => /Size$/.test(k))
      expect(sizeKeys.length, name).toBeGreaterThan(0)
      for (const key of sizeKeys) expect(fields[key].type, `${name}.${key}`).toBe('select')
    }
  })

  it('applies size, colour and alignment to RichText', () => {
    const { getByText } = render(
      <RichText content="Đoạn văn" textSize="lg" textColor="bright-magenta" align="center" />,
    )
    const p = getByText('Đoạn văn')
    expect(p.className).toContain('sm:text-lg')
    expect(p.className).toContain('text-bright-magenta')
    expect(p.parentElement?.className).toContain('text-center')
  })

  it('falls back to the automatic colour when the chosen one fails contrast', () => {
    // bright-magenta on deep navy fails WCAG AA for body text.
    expect(bodyColorClass('bright-magenta', 'deep-navy', 'AUTO')).toBe('AUTO')
    expect(bodyColorClass('deep-navy', 'warm-ivory', 'AUTO')).toBe('AUTO')
    expect(bodyColorClass('bright-magenta', 'warm-ivory', 'AUTO')).toBe('text-bright-magenta')
  })

  it('renders inline-edited (React element) props without string operations', () => {
    const el = (t: string) => <span>{t}</span>
    for (const name of PK10_BLOCKS) {
      const block = puckConfig.components[name]
      const fields = block.fields as Record<string, { contentEditable?: boolean }>
      const props: Record<string, unknown> = { ...block.defaultProps, puck: { isEditing: true } }
      for (const [key, field] of Object.entries(fields)) {
        if (field.contentEditable) props[key] = el(`${name}:${key}`)
      }
      const { unmount } = render(<>{block.render(props as never)}</>)
      unmount()
    }
  })
})
