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
    expect(css).toContain('[data-eb-id="Hero-1"]{background-color:rgb(var(--color-soft-pink-rgb))}')
    expect(css).toContain(
      '[data-eb-id="Hero-1"][data-eb-id="Hero-1"] > *{padding-top:var(--space-breath-lg, 32px)}',
    )
    expect(css).toContain(
      '@media (max-width: 1023px){[data-eb-id="Hero-1"][data-eb-id="Hero-1"] > *{padding-top:var(--space-breath-md, 24px)}}',
    )
    expect(css).toContain(
      '@media (max-width: 767px){[data-eb-id="Hero-1"]{text-align:center}[data-eb-id="Hero-1"][data-eb-id="Hero-1"] > *{padding-top:8px}[data-eb-id="Hero-1"] [data-eb-card]{text-align:center;align-items:center}[data-eb-id="Hero-1"] [data-eb-card-row]{justify-content:center;gap:0.5rem}}',
    )
    expect(css).toContain('@media (min-width: 1024px){[data-eb-id="Hero-1"]{display:none}}')

    // Container block keeps padding on the wrapper itself
    const containerCss = blockStyleCss(
      'Container-1',
      {
        background: 'soft-pink',
        padding: { desktop: { top: 'lg' } },
      },
      true,
    )
    expect(containerCss).toContain(
      '[data-eb-id="Container-1"]{background-color:rgb(var(--color-soft-pink-rgb));padding-top:var(--space-breath-lg, 32px)}',
    )
  })

  it('refuses unsafe block ids', () => {
    expect(blockStyleCss('a"]{x}', { background: 'soft-pink' })).toBe('')
  })

  it('PK-13: emits title spacing variables on block selector, ignores unknown values', () => {
    const css = blockStyleCss('Hero-1', {
      titleLineHeight: 'airy',
      eyebrowGap: 'tight',
      emotionGap: 'airy',
    })
    expect(css).toContain(
      '[data-eb-id="Hero-1"]{--tdcx-title-lh:1.45;--tdcx-eyebrow-gap:8px;--tdcx-emotion-gap:24px}',
    )

    // Invalid/unrecognized values are not emitted
    const raw = { titleLineHeight: 'invalid-val' } as any
    const sanitized = cleanDesignSystem(null)
    const { css: pageCss } = collectPageStyles(
      { content: [{ type: 'HeroImage', props: { id: 'Hero-2', _style: raw } }] },
      sanitized,
    )
    expect(pageCss).not.toContain('--tdcx-title-lh')
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

describe('Mobile cap for inherited horizontal padding', () => {
  it('caps a desktop-only left/right padding at the 24px brand gutter on phones', () => {
    const css = blockStyleCss('Entry-1', { padding: { desktop: { right: '12rem' } } })
    expect(css).toContain('[data-eb-id="Entry-1"]{padding-right:12rem}')
    expect(css).toContain(
      '@media (max-width: 767px){[data-eb-id="Entry-1"]{padding-right:min(12rem, 1.5rem)}}',
    )
  })

  it('uses the tablet value as the inherited one when set', () => {
    const css = blockStyleCss('Entry-2', {
      padding: { desktop: { left: '12rem' }, tablet: { left: '4rem' } },
    })
    expect(css).toContain('padding-left:min(4rem, 1.5rem)')
  })

  it('keeps a padding set explicitly for mobile as-is', () => {
    const css = blockStyleCss('Entry-3', {
      padding: { desktop: { right: '12rem' }, mobile: { right: '3rem' } },
    })
    expect(css).not.toContain('min(')
    expect(css).toContain('@media (max-width: 767px){[data-eb-id="Entry-3"]{padding-right:3rem}}')
  })

  it('adds nothing for top/bottom or when no horizontal padding is set', () => {
    const css = blockStyleCss('Entry-4', { padding: { desktop: { top: 'lg' } } })
    expect(css).not.toContain('min(')
  })
})

describe('Mobile cap leaves small paddings untouched', () => {
  it('does not add a cap for paddings within the 24px gutter', () => {
    const css = blockStyleCss('Entry-5', {
      padding: { desktop: { left: 'sm', right: 'md' } },
    })
    expect(css).not.toContain('min(')
    const px = blockStyleCss('Entry-6', { padding: { desktop: { right: '20px' } } })
    expect(px).not.toContain('min(')
  })

  it('caps the large presets', () => {
    const css = blockStyleCss('Entry-7', { padding: { desktop: { right: 'xl' } } })
    expect(css).toContain('padding-right:min(calc(var(--space-breath-lg, 32px) * 2), 1.5rem)')
  })
})
