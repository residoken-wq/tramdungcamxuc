/**
 * EB-09c (Planning QA): bypasses found in the EB-09 filters and the save guard.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PayloadRequest } from 'payload'
import { sanitizeCustomHtml, sanitizeRichText } from '@/lib/html/sanitize-rich-text'
import { sanitizeBlockCustomCss, sanitizePageCustomCss } from '@/puck/style/custom-css'
import {
  extractCustomCode,
  guardCustomCodeHook,
  hasCustomCodeChanged,
} from '@/puck/custom-code-guard'
import { cleanDesignSystem, type CleanDesignSystem } from '@/lib/design/design-system'
import { getPuckConfig } from '@/puck/config'
import { vi } from '@/lib/i18n/vi'

const BLOCK = '[data-eb-id="HeadingWidget-1"]'

describe('EB-09c HTML sanitizers', () => {
  it('escapes an unterminated tag instead of copying it (it would close on the page markup)', () => {
    for (const clean of [sanitizeCustomHtml, sanitizeRichText]) {
      const out = clean('<p>ok</p><img src=x onerror=alert(1) ')
      expect(out).toBe('<p>ok</p>&lt;img src=x onerror=alert(1) ')
      // Rendered inside a wrapper, nothing becomes an <img>.
      document.body.innerHTML = `<div>${out}</div>`
      expect(document.querySelector('img')).toBeNull()
    }
  })

  it('removes comments, including an unclosed one', () => {
    expect(sanitizeCustomHtml('<p>a</p><!-- <img src=x onerror=alert(1)> -->')).toBe('<p>a</p>')
    expect(sanitizeCustomHtml('<p>a</p><!-- open')).toBe('<p>a</p>')
  })

  it('keeps text with < and > readable but inert', () => {
    expect(sanitizeCustomHtml('<p>1 < 2 > 0</p>')).toBe('<p>1 &lt; 2 &gt; 0</p>')
  })
})

describe('EB-09c block CSS', () => {
  it('rejects quoted strings holding braces (splitter / browser disagree on rule ends)', () => {
    expect(
      sanitizeBlockCustomCss('selector[x="{"] , footer { color:red } }', 'HeadingWidget-1'),
    ).toBe('')
    expect(sanitizeBlockCustomCss("selector { content: '}' }", 'HeadingWidget-1')).toBe('')
    expect(sanitizeBlockCustomCss('selector { content: "a', 'HeadingWidget-1')).toBe('')
  })

  it('splits selector lists outside parentheses and keeps valid :is()', () => {
    expect(sanitizeBlockCustomCss('selector :is(h2, h3) { color: red }', 'HeadingWidget-1')).toBe(
      `${BLOCK} :is(h2, h3){color: red}`,
    )
    expect(
      sanitizeBlockCustomCss(
        'selector :is(a, b { color:red } selector { color: blue }',
        'HeadingWidget-1',
      ),
    ).toBe(`${BLOCK}{color: blue}`)
  })

  it('drops selectors that reach sibling blocks with + or ~', () => {
    for (const css of [
      'selector ~ * { display:none }',
      'selector+div{display:none}',
      'selector:hover ~ p{x:y}',
    ]) {
      expect(sanitizeBlockCustomCss(css, 'HeadingWidget-1')).toBe('')
    }
    expect(sanitizeBlockCustomCss('selector li + li { margin-top: 4px }', 'HeadingWidget-1')).toBe(
      `${BLOCK} li + li{margin-top: 4px}`,
    )
  })

  it('drops nested rules (CSS nesting) inside a plain rule', () => {
    expect(
      sanitizeBlockCustomCss('selector { & ~ footer { color: red } }', 'HeadingWidget-1'),
    ).toBe('')
  })

  it('drops declarations loading bare-string URLs', () => {
    for (const fn of ['image-set', '-webkit-image-set', 'image', 'cross-fade']) {
      expect(
        sanitizeBlockCustomCss(
          `selector { background: ${fn}("https://evil.example/x.png" 1x); color: red }`,
          'HeadingWidget-1',
        ),
      ).toBe(`${BLOCK}{color: red}`)
    }
  })

  it('still allows scroll-behavior (only the IE behavior property is refused)', () => {
    expect(sanitizeBlockCustomCss('scroll-behavior: smooth', 'HeadingWidget-1')).toBe(
      `${BLOCK}{scroll-behavior: smooth}`,
    )
    expect(sanitizeBlockCustomCss('behavior: url(/api/media/file/x.htc)', 'HeadingWidget-1')).toBe(
      '',
    )
  })
})

describe('EB-09c page CSS', () => {
  it('cannot reach the header / footer next to the page wrapper', () => {
    for (const css of [
      '~ footer { display:none }',
      'selector ~ footer { display:none }',
      '[data-eb-page] + * { display:none }',
      'a[x="{"], footer { color:red } }',
    ]) {
      expect(sanitizePageCustomCss(css)).toBe('')
    }
    expect(sanitizePageCustomCss('h2 ~ p { color: red }')).toBe('[data-eb-page] h2 ~ p{color: red}')
  })
})

const tabsWithHtml = (html: string) => ({
  root: { props: {} },
  content: [
    {
      type: 'TabsWidget',
      props: {
        id: 'tabs-1',
        items: [{ title: 'A', content: [{ type: 'HtmlWidget', props: { id: 'hw-1', html } }] }],
      },
    },
  ],
})

describe('EB-09c save guard', () => {
  it('sees HtmlWidget inside Tabs / Accordion items', () => {
    expect(extractCustomCode(tabsWithHtml('<p>x</p>')).widgetHtml.get('hw-1')).toBe('<p>x</p>')
    expect(hasCustomCodeChanged(tabsWithHtml('<p>x</p>'), tabsWithHtml('<p>evil</p>'))).toBe(true)
  })

  it('catches a second block reusing an existing id', () => {
    const saved = { content: [{ type: 'HtmlWidget', props: { id: 'hw-1', html: '<p>owner</p>' } }] }
    const incoming = {
      content: [
        { type: 'HtmlWidget', props: { id: 'hw-1', html: '<p>evil</p>' } },
        { type: 'HtmlWidget', props: { id: 'hw-1', html: '<p>owner</p>' } },
      ],
    }
    expect(hasCustomCodeChanged(saved, incoming)).toBe(true)
    expect(hasCustomCodeChanged(saved, structuredClone(saved))).toBe(false)
  })

  const run = (user: unknown, saved: unknown, incoming: unknown) =>
    guardCustomCodeHook({
      data: { puckData: incoming },
      originalDoc: saved ? { puckData: saved } : undefined,
      req: { user } as unknown as PayloadRequest,
      operation: 'update',
    } as unknown as Parameters<typeof guardCustomCodeHook>[0])

  const editor = { collection: 'users', role: 'editor' }
  const owner = { collection: 'users', role: 'owner' }

  it('collection hook refuses an editor changing custom code (REST, admin, restore)', () => {
    expect(() => run(editor, tabsWithHtml('<p>x</p>'), tabsWithHtml('<p>evil</p>'))).toThrow(
      vi.eb09.onlyOwnerAllowed,
    )
    expect(() => run(editor, undefined, tabsWithHtml('<p>new</p>'))).toThrow(
      vi.eb09.onlyOwnerAllowed,
    )
  })

  it('collection hook lets owners, system calls and unchanged code through', () => {
    expect(() => run(owner, tabsWithHtml('<p>x</p>'), tabsWithHtml('<p>evil</p>'))).not.toThrow()
    expect(() => run(null, undefined, tabsWithHtml('<p>seed</p>'))).not.toThrow()
    expect(() => run(editor, tabsWithHtml('<p>x</p>'), tabsWithHtml('<p>x</p>'))).not.toThrow()
  })
})

describe('EB-09c editor canvas', () => {
  const locked = cleanDesignSystem(null)
  const open: CleanDesignSystem = { ...locked, lock: { ...locked.lock, customCss: 'open' } }
  const renderHtmlBlock = (ds: CleanDesignSystem) => {
    const block = getPuckConfig({ pageSlug: 'thu', isOwner: true, designSystem: ds }).components
      .HtmlWidget
    return renderToStaticMarkup(
      <>
        {block.render({
          id: 'HtmlWidget-1',
          html: '<p>Owner HTML</p>',
          puck: { isEditing: true },
        } as unknown as Parameters<typeof block.render>[0])}
      </>,
    )
  }

  it('shows the locked notice instead of the stored HTML while custom code is locked', () => {
    expect(renderHtmlBlock(locked)).toContain(vi.eb09.htmlLockedNotice)
    expect(renderHtmlBlock(locked)).not.toContain('Owner HTML')
    expect(renderHtmlBlock(open)).toContain('Owner HTML')
  })
})
