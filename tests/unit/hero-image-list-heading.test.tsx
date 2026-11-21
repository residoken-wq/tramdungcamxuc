import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { HeroImage } from '../../src/components/site/HeroImage'
import { HeroImageBlock } from '../../src/puck/blocks/HeroImage'
import { journeyTemplate } from '../../src/puck/templates/journey'

const props = {
  layout: 'side' as const,
  bgColor: 'deep-navy' as const,
  titleLine1: '[MẪU] Chuyển mình',
  titleLine2: '[MẪU] không chênh vênh',
  listTitle: 'PHASE 1',
  listItems: [
    { text: '[MẪU] 01 · Mục một' },
    { text: 'PHASE 2', heading: true },
    { text: '[MẪU] Khai vấn 1:1' },
  ],
}

describe('HeroImage list: group heading rows (PHASE 2)', () => {
  it('a heading row looks like the list title, without a dot; items keep their dot', () => {
    const html = renderToStaticMarkup(<HeroImage {...props} />)
    const titleTag = html.slice(
      html.lastIndexOf('<', html.indexOf('PHASE 1')),
      html.indexOf('PHASE 1'),
    )
    const headingTag = html.slice(
      html.lastIndexOf('<li', html.indexOf('PHASE 2')),
      html.indexOf('PHASE 2'),
    )
    for (const cls of ['font-bold', 'uppercase', 'tracking-widest', 'text-soft-pink']) {
      expect(titleTag).toContain(cls)
      expect(headingTag).toContain(cls)
    }
    expect(headingTag).toContain('mt-3')
    const itemLi = html.slice(
      html.lastIndexOf('<li', html.indexOf('[MẪU] Khai vấn')),
      html.indexOf('[MẪU] Khai vấn'),
    )
    expect(itemLi).toContain('rounded-full bg-accent-pink')
    expect(headingTag).not.toContain('rounded-full')
  })

  it('builder field defaults to a normal item; the journey template uses a PHASE 2 heading', () => {
    const arrayFields = (
      HeroImageBlock.fields?.listItems as { arrayFields: Record<string, unknown> }
    ).arrayFields
    expect(arrayFields).toHaveProperty('heading')
    expect(JSON.stringify(journeyTemplate)).toContain('"text":"PHASE 2","heading":true')
  })
})
