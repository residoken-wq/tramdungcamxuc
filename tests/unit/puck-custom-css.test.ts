import { describe, expect, it } from 'vitest'
import {
  MAX_BLOCK_CUSTOM_CSS_LENGTH,
  MAX_PAGE_CUSTOM_CSS_LENGTH,
  sanitizeBlockCustomCss,
  sanitizePageCustomCss,
} from '@/puck/style/custom-css'

describe('EB-09: Pure CSS sanitizer (REVIEW-REQUIRED)', () => {
  const blockId = 'hero-block-1'

  describe('Dangerous pattern rejection', () => {
    it('rejects HTML tags and style tag closing', () => {
      expect(sanitizeBlockCustomCss('</style><script>alert(1)</script>', blockId)).toBe('')
      expect(sanitizeBlockCustomCss('<img src=x onerror=alert(1)>', blockId)).toBe('')
      expect(sanitizePageCustomCss('body { color: red; } </style>')).toBe('')
    })

    it('rejects backslash escapes', () => {
      expect(sanitizeBlockCustomCss('selector { content: "\\3cscript\\3e"; }', blockId)).toBe('')
      expect(sanitizeBlockCustomCss('\\import url("x.css");', blockId)).toBe('')
      expect(sanitizePageCustomCss('.cls { background: \\6a\\61\\76\\61; }')).toBe('')
    })

    it('rejects @import, @charset, @namespace, @font-face', () => {
      expect(sanitizeBlockCustomCss('@import url("https://evil.com/evil.css");', blockId)).toBe('')
      expect(sanitizeBlockCustomCss('@CHARSET "UTF-8";', blockId)).toBe('')
      expect(sanitizeBlockCustomCss('@namespace url(http://www.w3.org/1999/xhtml);', blockId)).toBe(
        '',
      )
      expect(sanitizeBlockCustomCss('@font-face { font-family: "hacked"; }', blockId)).toBe('')
      expect(sanitizePageCustomCss('@import "evil.css";')).toBe('')
    })

    it('rejects expression(), javascript:, vbscript:, behavior, -moz-binding', () => {
      expect(sanitizeBlockCustomCss('selector { width: expression(alert(1)); }', blockId)).toBe('')
      expect(
        sanitizeBlockCustomCss('selector { background: url("javascript:alert(1)"); }', blockId),
      ).toBe('')
      expect(
        sanitizeBlockCustomCss('selector { background: url(vbscript:alert(1)); }', blockId),
      ).toBe('')
      expect(sanitizeBlockCustomCss('selector { behavior: url(test.htc); }', blockId)).toBe('')
      expect(sanitizeBlockCustomCss('selector { -moz-binding: url(x.xml); }', blockId)).toBe('')
      expect(sanitizePageCustomCss('h1 { JAVASCRIPT: alert(1); }')).toBe('')
      expect(sanitizePageCustomCss('h1 { BEHAVIOR: none; }')).toBe('')
    })

    it('rejects comments that attempt to split forbidden keywords', () => {
      expect(sanitizeBlockCustomCss('@im/**/port url("leak.css");', blockId)).toBe('')
      expect(sanitizeBlockCustomCss('java/* */script:alert(1)', blockId)).toBe('')
      expect(sanitizeBlockCustomCss('expr/* */ession(1)', blockId)).toBe('')
    })

    it('rejects unclosed or orphaned comments', () => {
      expect(sanitizeBlockCustomCss('/* unclosed comment selector { color: red; }', blockId)).toBe(
        '',
      )
      expect(sanitizeBlockCustomCss('selector { color: red; } */', blockId)).toBe('')
      expect(sanitizePageCustomCss('/* unclosed comment')).toBe('')
    })

    it('rejects mismatched braces', () => {
      expect(sanitizeBlockCustomCss('selector { color: red;', blockId)).toBe('')
      expect(sanitizeBlockCustomCss('selector { color: red; }}', blockId)).toBe('')
      expect(sanitizeBlockCustomCss('} selector { color: red; }', blockId)).toBe('')
    })

    it('rejects payloads exceeding max length', () => {
      const longBlock = 'selector { color: ' + 'a'.repeat(MAX_BLOCK_CUSTOM_CSS_LENGTH) + '; }'
      expect(sanitizeBlockCustomCss(longBlock, blockId)).toBe('')

      const longPage = 'h1 { color: ' + 'a'.repeat(MAX_PAGE_CUSTOM_CSS_LENGTH) + '; }'
      expect(sanitizePageCustomCss(longPage)).toBe('')
    })

    it('rejects invalid or unsafe blockId', () => {
      expect(sanitizeBlockCustomCss('selector { color: red; }', 'invalid"id')).toBe('')
      expect(sanitizeBlockCustomCss('selector { color: red; }', 'id with spaces')).toBe('')
      expect(sanitizeBlockCustomCss('selector { color: red; }', '')).toBe('')
    })
  })

  describe('url(...) sanitization', () => {
    it('allows valid relative /api/media/file/... URLs', () => {
      const css = 'selector { background-image: url("/api/media/file/hero.png"); }'
      expect(sanitizeBlockCustomCss(css, blockId)).toBe(
        '[data-eb-id="hero-block-1"]{background-image: url("/api/media/file/hero.png")}',
      )
    })

    it('drops declarations containing external or dangerous URLs', () => {
      const css = `
        selector {
          color: red;
          background: url("https://evil.com/leak.png");
          border: 1px solid green;
          background-image: url("//evil.com/test.jpg");
          padding: 10px;
          list-style: url(data:image/svg+xml,...);
          margin: 5px;
          outline: url('/api/media/file/../../secret');
        }
      `
      const result = sanitizeBlockCustomCss(css, blockId)
      expect(result).toBe(
        '[data-eb-id="hero-block-1"]{color: red;border: 1px solid green;padding: 10px;margin: 5px}',
      )
    })
  })

  describe('Block custom CSS scoping rules', () => {
    it('wraps declarations without braces in selector { ... }', () => {
      const css = 'color: #ff0000; font-size: 18px;'
      expect(sanitizeBlockCustomCss(css, blockId)).toBe(
        '[data-eb-id="hero-block-1"]{color: #ff0000;font-size: 18px}',
      )
    })

    it('replaces selector keyword with [data-eb-id="..."]', () => {
      const css = `
        selector { color: red; }
        selector h2 { font-size: 24px; }
        selector:hover { opacity: 0.9; }
        selector.active { display: block; }
        selector > .child { margin: 8px; }
      `
      const result = sanitizeBlockCustomCss(css, blockId)
      expect(result).toBe(
        '[data-eb-id="hero-block-1"]{color: red}' +
          '[data-eb-id="hero-block-1"] h2{font-size: 24px}' +
          '[data-eb-id="hero-block-1"]:hover{opacity: 0.9}' +
          '[data-eb-id="hero-block-1"].active{display: block}' +
          '[data-eb-id="hero-block-1"] > .child{margin: 8px}',
      )
    })

    it('drops rules that do not start with selector keyword', () => {
      const css = `
        selector { color: red; }
        body { background: black; }
        h1 { font-size: 40px; }
        div selector { color: blue; }
        selector-fake { color: green; }
      `
      const result = sanitizeBlockCustomCss(css, blockId)
      expect(result).toBe('[data-eb-id="hero-block-1"]{color: red}')
    })

    it('drops non-selector parts in comma-separated selectors', () => {
      const css = 'selector h1, body, selector h2 { font-weight: bold; }'
      const result = sanitizeBlockCustomCss(css, blockId)
      expect(result).toBe(
        '[data-eb-id="hero-block-1"] h1, [data-eb-id="hero-block-1"] h2{font-weight: bold}',
      )
    })

    it('handles nested @media queries properly', () => {
      const css = `
        @media (max-width: 768px) {
          selector { font-size: 14px; }
          body { font-size: 10px; }
          selector p { line-height: 1.4; }
        }
      `
      const result = sanitizeBlockCustomCss(css, blockId)
      expect(result).toBe(
        '@media (max-width: 768px){[data-eb-id="hero-block-1"]{font-size: 14px}[data-eb-id="hero-block-1"] p{line-height: 1.4}}',
      )
    })

    it('drops empty @media queries when all nested rules are invalid', () => {
      const css = `
        @media (max-width: 768px) {
          body { font-size: 10px; }
          h1 { color: red; }
        }
      `
      expect(sanitizeBlockCustomCss(css, blockId)).toBe('')
    })
  })

  describe('Page custom CSS scoping rules', () => {
    it('scopes top-level rules under [data-eb-page]', () => {
      const css = `
        h1 { font-size: 32px; }
        .featured-card { padding: 24px; }
        a:hover { text-decoration: underline; }
      `
      const result = sanitizePageCustomCss(css)
      expect(result).toBe(
        '[data-eb-page] h1{font-size: 32px}' +
          '[data-eb-page] .featured-card{padding: 24px}' +
          '[data-eb-page] a:hover{text-decoration: underline}',
      )
    })

    it('replaces selector keyword with [data-eb-page]', () => {
      const css = `
        selector { background-color: #faf7f4; }
        selector:hover { opacity: 0.95; }
      `
      const result = sanitizePageCustomCss(css)
      expect(result).toBe(
        '[data-eb-page]{background-color: #faf7f4}' + '[data-eb-page]:hover{opacity: 0.95}',
      )
    })

    it('preserves selectors already starting with [data-eb-page]', () => {
      const css = '[data-eb-page] .content { max-width: 1200px; }'
      expect(sanitizePageCustomCss(css)).toBe('[data-eb-page] .content{max-width: 1200px}')
    })

    it('scopes comma-separated selectors under [data-eb-page]', () => {
      const css = 'h1, h2, h3 { font-family: Anton; }'
      expect(sanitizePageCustomCss(css)).toBe(
        '[data-eb-page] h1, [data-eb-page] h2, [data-eb-page] h3{font-family: Anton}',
      )
    })

    it('scopes rules nested inside @media under [data-eb-page]', () => {
      const css = `
        @media (min-width: 1024px) {
          .grid { display: grid; }
        }
      `
      expect(sanitizePageCustomCss(css)).toBe(
        '@media (min-width: 1024px){[data-eb-page] .grid{display: grid}}',
      )
    })
  })
})
