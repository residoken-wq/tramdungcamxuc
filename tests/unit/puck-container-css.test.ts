import { describe, expect, it } from 'vitest'
import { cleanDesignSystem } from '@/lib/design/design-system'
import { containerCss, containerItemsClass } from '@/puck/style/container-css'
import { collectPageStyles } from '@/puck/style/style-css'

const locked = cleanDesignSystem(null)

describe('EB-05: containerCss', () => {
  it('puts the flex layout on the slot element of the container', () => {
    const css = containerCss('con-1', {
      direction: { desktop: 'row' },
      justify: { desktop: 'center' },
      align: { desktop: 'stretch' },
      gap: { desktop: 'md' },
      wrap: { desktop: 'wrap' },
    })
    expect(containerItemsClass('con-1')).toBe('eb-c-con-1')
    expect(css).toBe(
      '.eb-c-con-1{flex-direction:row;justify-content:center;align-items:stretch;gap:var(--space-breath-md, 24px);flex-wrap:wrap}',
    )
  })

  it('defaults to a column and emits media queries only for values that change', () => {
    const identical = containerCss('con-same', {
      direction: { desktop: 'column', tablet: 'column', mobile: 'column' },
      gap: { desktop: 'md', tablet: 'md' },
    })
    expect(identical).toBe('.eb-c-con-same{flex-direction:column;gap:var(--space-breath-md, 24px)}')
    expect(containerCss('con-empty')).toBe('.eb-c-con-empty{flex-direction:column}')

    const differing = containerCss('con-diff', {
      direction: { desktop: 'row', tablet: 'column', mobile: 'column-reverse' },
      gap: { desktop: 'lg', mobile: 'sm' },
    })
    expect(differing).toBe(
      '.eb-c-con-diff{flex-direction:row;gap:var(--space-breath-lg, 32px)}' +
        '@media (max-width: 1023px){.eb-c-con-diff{flex-direction:column}}' +
        '@media (max-width: 767px){.eb-c-con-diff{flex-direction:column-reverse;gap:var(--space-breath-sm, 16px)}}',
    )
  })

  it('puts a gradient on the outer element with palette tokens', () => {
    const css = containerCss('con-grad', undefined, {
      type: 'gradient',
      from: 'bright-magenta',
      to: '#123456',
      angle: 90,
    })
    expect(css).toContain(
      '[data-eb-id="con-grad"]{background-image:linear-gradient(90deg,rgb(var(--color-bright-magenta-rgb)),#123456)}',
    )
  })

  it('puts a background image on the outer element and encodes the URL', () => {
    const css = containerCss('con-img', undefined, {
      type: 'image',
      imageUrl: '/api/media/file/banner hero.png',
      size: 'contain',
      position: 'top left',
    })
    expect(css).toContain(
      '[data-eb-id="con-img"]{background-image:url("/api/media/file/banner%20hero.png");background-size:contain;background-position:top left;background-repeat:no-repeat}',
    )
    // Defence in depth: characters that could leave url("…") are encoded even if they slip through.
    const forced = containerCss('con-x', undefined, { type: 'image', imageUrl: '/a")(\\' })
    expect(forced).toContain('url("/a%22%29%28%5C")')
  })

  it('skips an image background without URL and a gradient missing a colour', () => {
    expect(containerCss('a', undefined, { type: 'image' })).not.toContain('data-eb-id')
    expect(containerCss('a', undefined, { type: 'gradient', from: 'deep-navy' })).not.toContain(
      'data-eb-id',
    )
  })

  it('rejects unsafe block ids', () => {
    expect(containerCss('"><script>alert(1)</script>')).toBe('')
  })
})

describe('EB-05: collectPageStyles with Container', () => {
  it('emits the Container rules before the _style rules of the same block', () => {
    const data = {
      content: [
        {
          type: 'Container',
          props: {
            id: 'Container-hero',
            layout: { direction: { desktop: 'row' } },
            background: { type: 'gradient', from: 'soft-pink', to: 'lavender-mist' },
            _style: { background: 'mint-haze', padding: { desktop: { top: 'lg' } } },
          },
        },
      ],
    }
    const { css } = collectPageStyles(data, locked)
    const layoutIndex = css.indexOf('.eb-c-Container-hero{flex-direction:row')
    const gradientIndex = css.indexOf('linear-gradient')
    const styleIndex = css.indexOf('background-color:rgb(var(--color-mint-haze-rgb))')
    expect(layoutIndex).toBeGreaterThan(-1)
    expect(gradientIndex).toBeGreaterThan(-1)
    expect(styleIndex).toBeGreaterThan(Math.max(layoutIndex, gradientIndex))
  })

  it('drops a free hex gradient colour while colours are locked', () => {
    const data = {
      content: [
        {
          type: 'Container',
          props: {
            id: 'c-hex',
            background: { type: 'gradient', from: '#ff0000', to: 'deep-navy' },
          },
        },
      ],
    }
    expect(collectPageStyles(data, locked).css).not.toContain('linear-gradient')
  })

  it('walks three levels of nested Containers in slots', () => {
    const level3 = {
      type: 'Container',
      props: {
        id: 'Container-level-3',
        layout: { direction: { desktop: 'row-reverse' } },
        items: [],
      },
    }
    const level2 = {
      type: 'Container',
      props: {
        id: 'Container-level-2',
        layout: { direction: { desktop: 'row' } },
        items: [level3],
      },
    }
    const data = {
      content: [
        {
          type: 'Container',
          props: { id: 'Container-level-1', items: [level2] },
        },
      ],
    }
    const { css } = collectPageStyles(data, locked)
    expect(css).toContain('.eb-c-Container-level-1{flex-direction:column}')
    expect(css).toContain('.eb-c-Container-level-2{flex-direction:row}')
    expect(css).toContain('.eb-c-Container-level-3{flex-direction:row-reverse}')
  })
})
