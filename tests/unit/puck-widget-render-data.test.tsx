import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { sanitizePageRichText } from '@/puck/rich-text-data'
import { typographyClasses, widgetColor } from '@/components/site/widgets/style-defaults'
import { HeadingWidget } from '@/components/site/widgets/HeadingWidget'
import { TextWidget } from '@/components/site/widgets/TextWidget'

const BAD = '<p>Xin chào</p><img src=x onerror="alert(1)"><a href="javascript:alert(1)">x</a>'

describe('EB-06a: rich text is sanitized in page data before Puck renders it', () => {
  it('cleans TextWidget content at the root, in zones and inside Container slots', () => {
    const data = {
      content: [
        { type: 'TextWidget', props: { id: 't1', content: BAD } },
        {
          type: 'Container',
          props: {
            id: 'c1',
            items: [{ type: 'TextWidget', props: { id: 't2', content: BAD } }],
          },
        },
        { type: 'RichText', props: { id: 'r1', content: '<img onerror=x>' } },
      ],
      zones: { 'c1:z': [{ type: 'TextWidget', props: { id: 't3', content: BAD } }] },
    }
    const out = sanitizePageRichText(data) as typeof data & {
      content: { props: { content?: string; items?: { props: { content: string } }[] } }[]
    }
    for (const html of [
      out.content[0].props.content,
      out.content[1].props.items?.[0].props.content,
      (out.zones['c1:z'][0] as { props: { content: string } }).props.content,
    ]) {
      expect(html).toContain('<p>Xin chào</p>')
      expect(html).not.toMatch(/onerror|<img|javascript:/i)
    }
    // Only declared rich text props are touched.
    expect(out.content[2].props.content).toBe('<img onerror=x>')
    // Input is not mutated.
    expect(data.content[0].props.content).toBe(BAD)
  })
})

describe('EB-06a: widget typography yields to the Style tab', () => {
  it('drops each default class the _style overrides', () => {
    const defaults = {
      textColor: 'text-deep-navy',
      fontSize: 'text-2xl',
      fontFamily: 'font-display',
    }
    expect(typographyClasses(defaults, undefined)).toBe('text-deep-navy text-2xl font-display')
    expect(
      typographyClasses(defaults, { textColor: 'bright-magenta', fontSize: { desktop: 'lg' } }),
    ).toBe('font-display')
  })

  it('heading has no colour class when the Style tab sets one, so it inherits it', () => {
    const { container, rerender } = render(<HeadingWidget text="A" level="h2" />)
    expect(container.querySelector('h2')?.className).toContain('text-deep-navy')
    rerender(<HeadingWidget text="A" level="h2" {...{ _style: { textColor: 'bright-magenta' } }} />)
    expect(container.querySelector('h2')?.className).not.toContain('text-deep-navy')
  })

  it('text widget renders a Puck node as is and sanitizes a plain string', () => {
    const { container, rerender } = render(<TextWidget content={<p>Nút Puck</p>} />)
    expect(container.textContent).toBe('Nút Puck')
    rerender(<TextWidget content={BAD} />)
    expect(container.innerHTML).not.toMatch(/onerror|javascript:/i)
  })

  it('icon colours follow the designSystem variables; junk falls back', () => {
    expect(widgetColor('accent-pink')).toBe('rgb(var(--color-accent-pink-rgb))')
    expect(widgetColor('#123abc')).toBe('#123abc')
    expect(widgetColor('red;background:url(x)')).toBe('rgb(var(--color-deep-navy-rgb))')
  })
})

describe('EB-06ac: sanitizer bypass attempts (REVIEW-REQUIRED)', () => {
  it.each([
    '<img/src=x/onerror=alert(1)>',
    '<a/href=javascript:alert(1)>x</a>',
    '<a href="java&#x73;cript:alert(1)">x</a>',
    '<a href=" javascript:alert(1)">x</a>',
    '<!--><img src=x onerror=alert(1)>-->',
    '<img src=">" onerror=alert(1)>',
    '<svg><animate onbegin=alert(1)></svg>',
    '<p onclick="alert(1)">x</p>',
    '<iframe src="javascript:alert(1)"></iframe>',
  ])('%s', async (html) => {
    const { sanitizeRichText } = await import('@/lib/html/sanitize-rich-text')
    const div = document.createElement('div')
    div.innerHTML = sanitizeRichText(html)
    for (const el of Array.from(div.querySelectorAll('*'))) {
      expect(['p', 'a', 'strong', 'em', 'b', 'i', 'u', 'br']).toContain(el.tagName.toLowerCase())
      for (const attr of Array.from(el.attributes)) {
        expect(attr.name).not.toMatch(/^on/i)
        expect(attr.value).not.toMatch(/javascript:/i)
      }
    }
  })
})
