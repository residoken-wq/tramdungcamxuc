import { describe, expect, it } from 'vitest'
import { cleanDesignSystem, type CleanDesignSystem } from '../../src/lib/design/design-system'
import { blockStyleCss, collectPageStyles } from '../../src/puck/style/style-css'

const locked = cleanDesignSystem(null)
const open: CleanDesignSystem = {
  ...locked,
  lock: { ...locked.lock, colors: 'open', fonts: 'open', sizes: 'open' },
}

describe('EB-04: blockStyleCss', () => {
  it('writes base rules, per-device media queries and hide rules', () => {
    const css = blockStyleCss('Hero-1', {
      background: 'soft-pink',
      padding: { desktop: { top: 'lg' }, tablet: { top: 'md' }, mobile: { top: '8px' } },
      textAlign: { mobile: 'center' },
      hideOn: ['desktop'],
    })
    expect(css).toContain(
      '[data-eb-id="Hero-1"]{background-color:rgb(var(--color-soft-pink-rgb));padding-top:var(--space-breath-lg, 32px)}',
    )
    expect(css).toContain(
      '@media (max-width: 1023px){[data-eb-id="Hero-1"]{padding-top:var(--space-breath-md, 24px)}}',
    )
    expect(css).toContain(
      '@media (max-width: 767px){[data-eb-id="Hero-1"]{padding-top:8px;text-align:center}}',
    )
    expect(css).toContain('@media (min-width: 1024px){[data-eb-id="Hero-1"]{display:none}}')
  })

  it('refuses unsafe block ids', () => {
    expect(blockStyleCss('a"]{x}', { background: 'soft-pink' })).toBe('')
  })
})

const injection = ';}body{display:none'

describe('EB-04: collectPageStyles', () => {
  it('walks content, zones and nested slots', () => {
    const data = {
      content: [
        {
          type: 'Columns',
          props: {
            id: 'Columns-1',
            _style: { background: 'lavender-mist' },
            column1: [
              { type: 'RichText', props: { id: 'Rich-1', _style: { textColor: 'deep-navy' } } },
            ],
          },
        },
        { type: 'Spacer', props: { id: 'Spacer-1' } },
      ],
      zones: {
        'Hero-9:zone': [{ type: 'CTAButton', props: { id: 'Cta-1', _style: { shadow: 'soft' } } }],
      },
    }
    const { css } = collectPageStyles(data, locked)
    expect(css).toContain('[data-eb-id="Columns-1"]')
    expect(css).toContain('[data-eb-id="Rich-1"]')
    expect(css).toContain('[data-eb-id="Cta-1"]')
    expect(css).not.toContain('Spacer-1')
  })

  it('returns nothing for a page without _style', () => {
    expect(
      collectPageStyles({ content: [{ type: 'Spacer', props: { id: 'S-1' } }] }, locked),
    ).toEqual({
      css: '',
      fonts: [],
    })
    expect(collectPageStyles(null, locked)).toEqual({ css: '', fonts: [] })
  })

  it('never lets an injected string reach the CSS', () => {
    const style: Record<string, unknown> = {
      background: injection,
      textColor: injection,
      fontFamily: injection,
      fontSize: { desktop: injection },
      lineHeight: injection,
      textAlign: { desktop: injection },
      radius: injection,
      borderColor: injection,
      shadow: injection,
      padding: { desktop: { top: injection } },
      margin: { desktop: { top: injection } },
      anchorId: injection,
      hideOn: [injection],
    }
    const { css } = collectPageStyles(
      { content: [{ type: 'X', props: { id: 'X-1', _style: style } }] },
      open,
    )
    expect(css).not.toContain('body')
    expect(css).toBe('')
  })

  it('lists fonts used by blocks (only when fonts are open)', () => {
    const data = { content: [{ type: 'X', props: { id: 'X-1', _style: { fontFamily: 'Lora' } } }] }
    expect(collectPageStyles(data, open).fonts).toEqual(['Lora'])
    expect(collectPageStyles(data, open).css).toContain("font-family:'Lora',serif")
    expect(collectPageStyles(data, locked)).toEqual({ css: '', fonts: [] })
  })
})
