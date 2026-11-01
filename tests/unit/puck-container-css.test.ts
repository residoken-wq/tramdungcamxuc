import { describe, expect, it } from 'vitest'
import { cleanDesignSystem, type CleanDesignSystem } from '@/lib/design/design-system'
import { containerCss } from '@/puck/style/container-css'
import { collectPageStyles } from '@/puck/style/style-css'

const locked = cleanDesignSystem(null)
const open: CleanDesignSystem = {
  ...locked,
  lock: { ...locked.lock, colors: 'open', fonts: 'open', sizes: 'open' },
}

describe('EB-05: containerCss', () => {
  it('generates base flex rules on desktop', () => {
    const css = containerCss(
      'con-1',
      {
        direction: { desktop: 'row' },
        justify: { desktop: 'center' },
        align: { desktop: 'stretch' },
        gap: { desktop: 'md' },
        wrap: { desktop: 'wrap' },
      },
      undefined,
    )
    expect(css).toBe(
      '[data-eb-id="con-1"]{display:flex;flex-direction:row;justify-content:center;align-items:stretch;gap:var(--space-breath-md, 24px);flex-wrap:wrap}',
    )
  })

  it('only emits media query when device values differ from parent device', () => {
    // When tablet and mobile are identical to desktop, NO media queries are emitted
    const identical = containerCss('con-same', {
      direction: { desktop: 'column', tablet: 'column', mobile: 'column' },
      gap: { desktop: 'md', tablet: 'md' },
    })
    expect(identical).toContain('[data-eb-id="con-same"]{display:flex;flex-direction:column;gap:var(--space-breath-md, 24px)}')
    expect(identical).not.toContain('@media')

    // When tablet is different, emit tablet media query. When mobile is different from tablet, emit mobile.
    const differing = containerCss('con-diff', {
      direction: { desktop: 'row', tablet: 'column', mobile: 'column-reverse' },
      gap: { desktop: 'lg', mobile: 'sm' },
    })
    expect(differing).toContain(
      '[data-eb-id="con-diff"]{display:flex;flex-direction:row;gap:var(--space-breath-lg, 32px)}',
    )
    expect(differing).toContain(
      '@media (max-width: 1023px){[data-eb-id="con-diff"]{flex-direction:column}}',
    )
    expect(differing).toContain(
      '@media (max-width: 767px){[data-eb-id="con-diff"]{flex-direction:column-reverse;gap:var(--space-breath-sm, 16px)}}',
    )
  })

  it('formats gradient colors with token rgb variables', () => {
    const css = containerCss('con-grad', undefined, {
      type: 'gradient',
      from: 'bright-magenta',
      to: 'deep-navy',
      angle: 90,
    })
    expect(css).toContain(
      'background-image:linear-gradient(90deg, rgb(var(--color-bright-magenta-rgb)), rgb(var(--color-deep-navy-rgb)))',
    )
  })

  it('formats background image with clean url, size and position', () => {
    const css = containerCss('con-img', undefined, {
      type: 'image',
      imageUrl: '/api/media/file/banner.png',
      size: 'cover',
      position: 'center',
    })
    expect(css).toContain('background-image:url("/api/media/file/banner.png")')
    expect(css).toContain('background-size:cover')
    expect(css).toContain('background-position:center')
    expect(css).toContain('background-repeat:no-repeat')
  })

  it('rejects unsafe block IDs', () => {
    expect(containerCss('"><script>alert(1)</script>')).toBe('')
  })
})

describe('EB-05: collectPageStyles with Container', () => {
  it('places Container layout rules BEFORE _style rules of the same block', () => {
    const data = {
      content: [
        {
          type: 'Container',
          props: {
            id: 'Container-hero',
            layout: { direction: { desktop: 'row' } },
            _style: { background: 'mint-haze', padding: { desktop: { top: 'lg' } } },
          },
        },
      ],
    }

    const { css } = collectPageStyles(data, locked)
    const layoutIndex = css.indexOf('display:flex;flex-direction:row')
    const styleIndex = css.indexOf('background-color:rgb(var(--color-mint-haze-rgb))')

    expect(layoutIndex).toBeGreaterThan(-1)
    expect(styleIndex).toBeGreaterThan(-1)
    expect(layoutIndex).toBeLessThan(styleIndex) // layout rule comes first!
  })

  it('traverses 3 levels of nested Containers inside slots and generates rules for all 3', () => {
    const data = {
      content: [
        {
          type: 'Container',
          props: {
            id: 'Container-level-1',
            layout: { direction: { desktop: 'column' } },
            items: [
              {
                type: 'Container',
                props: {
                  id: 'Container-level-2',
                  layout: { direction: { desktop: 'row' } },
                  items: [
                    {
                      type: 'Container',
                      props: {
                        id: 'Container-level-3',
                        layout: { direction: { desktop: 'row-reverse' } },
                        items: [],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    }

    const { css } = collectPageStyles(data, locked)
    expect(css).toContain('[data-eb-id="Container-level-1"]')
    expect(css).toContain('[data-eb-id="Container-level-2"]')
    expect(css).toContain('[data-eb-id="Container-level-3"]')
    expect(css).toContain('flex-direction:column')
    expect(css).toContain('flex-direction:row')
    expect(css).toContain('flex-direction:row-reverse')
  })
})
