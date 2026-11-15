import { describe, expect, it } from 'vitest'
import type { ComponentConfig } from '@puckeditor/core'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { puckConfig as config } from '../../src/puck/config'
import { withTitleHighlight } from '../../src/puck/title-highlight-field'
import { PackageCards } from '../../src/components/site/PackageCards'

const BLOCKS = [
  'Columns',
  'ContactInfo',
  'FAQ',
  'HanaStory',
  'IconCardGrid',
  'JourneySteps',
  'LeadMagnetCarousel',
  'LibraryPreview',
  'LoopDiagram',
  'MatrixTable',
  'PackageCards',
  'PhotoGallery',
  'QuizCTA',
  'ServiceCards',
  'SolutionEcosystem',
  'TeamGrid',
  'TestimonialGrid',
  'TrialCTA',
  'TwoPathCards',
  'VisionMission',
] as const

type Fields = Record<string, { type: string; label?: string }>
const blockOf = (name: string) =>
  (config.components as unknown as Record<string, ComponentConfig>)[name] as ComponentConfig

describe('Title highlight tools on every two-tone title block', () => {
  it.each(BLOCKS)('%s: title fields are chip fields, followed by style + animation', (name) => {
    const fields = blockOf(name).fields as unknown as Fields
    expect(fields.titleLine1.type).toBe('custom')
    const keys = Object.keys(fields)
    const last = fields.titleLine2 ? 'titleLine2' : 'titleLine1'
    if (fields.titleLine2) expect(fields.titleLine2.type).toBe('custom')
    expect(keys.indexOf('titleHighlightStyle')).toBe(keys.indexOf(last) + 1)
    expect(keys.indexOf('titleHighlightAnimation')).toBe(keys.indexOf(last) + 2)
  })

  it('keeps the original field label so tests and the "Aa" button still match', () => {
    const fields = blockOf('FAQ').fields as unknown as Fields
    expect(fields.titleLine1.label).toBe('Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)')
  })

  it('shows style + animation only when a title has *…* or ~…~, after the block resolveFields', async () => {
    const block = blockOf('PackageCards')
    const params = {
      fields: block.fields,
      changed: {},
      lastData: null,
      lastFields: block.fields,
      appState: {},
      parent: null,
    } as never
    const plain = (await block.resolveFields!(
      { props: { titleLine1: 'CHUYỂN MÌNH' } } as never,
      params,
    )) as Fields
    expect(plain.titleHighlightStyle).toBeUndefined()
    expect(plain.titleHighlightAnimation).toBeUndefined()
    const marked = (await block.resolveFields!(
      { props: { titleLine1: '*CHUYỂN* MÌNH ~CHÊNH~' } } as never,
      params,
    )) as Fields
    expect(marked.titleHighlightStyle).toBeDefined()
    expect(marked.titleHighlightAnimation).toBeDefined()
  })

  it('wraps an existing resolveFields instead of replacing it', async () => {
    const block = withTitleHighlight({
      fields: { titleLine1: { type: 'text', label: 'T' }, extra: { type: 'text' } },
      resolveFields: (_data, { fields }) => {
        const next = { ...fields } as Record<string, unknown>
        delete next.extra
        return next as never
      },
      render: () => <div />,
    } as ComponentConfig)
    const out = (await block.resolveFields!(
      { props: { titleLine1: 'x' } } as never,
      { fields: block.fields } as never,
    )) as Fields
    expect(out.extra).toBeUndefined()
    expect(out.titleHighlightStyle).toBeUndefined()
  })

  it('is a no-op for blocks without a title or already wired', () => {
    const noTitle = { fields: { text: { type: 'text' } }, render: () => <div /> } as ComponentConfig
    expect(withTitleHighlight(noTitle)).toBe(noTitle)
    const hero = blockOf('HeroTwoEntries')
    expect(withTitleHighlight(hero)).toBe(hero)
  })

  it('PackageCards renders the pill style and a <s> strike on the public page', () => {
    const html = renderToStaticMarkup(
      <PackageCards
        titleLine1="*CHUYỂN* MÌNH KHÔNG ~CHÊNH~ VÊNH"
        titleHighlightStyle="pill"
        cards={(() => null) as never}
      />,
    )
    expect(html).toContain('bg-bright-magenta text-white')
    expect(html).toMatch(/<s[^>]*>CHÊNH<\/s>/)
  })

  it('PackageCards without highlight props renders exactly as before', () => {
    const before = renderToStaticMarkup(
      <PackageCards titleLine1="*CHUYỂN* MÌNH" cards={(() => null) as never} />,
    )
    const explicit = renderToStaticMarkup(
      <PackageCards
        titleLine1="*CHUYỂN* MÌNH"
        titleHighlightStyle="color"
        titleHighlightAnimation="none"
        cards={(() => null) as never}
      />,
    )
    expect(before).toBe(explicit)
  })
})
