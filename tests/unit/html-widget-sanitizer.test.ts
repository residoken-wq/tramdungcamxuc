import { describe, expect, it } from 'vitest'
import { sanitizeCustomHtml, isSafeUrl } from '@/lib/html/sanitize-rich-text'
import { sanitizePageRichText } from '@/puck/rich-text-data'
import { cleanDesignSystem } from '@/lib/design/design-system'

const lockedDs = cleanDesignSystem(null)
const openDs = {
  ...lockedDs,
  lock: { ...lockedDs.lock, customCss: 'open' as const },
}

describe('EB-09: sanitizeCustomHtml (REVIEW-REQUIRED)', () => {
  describe('Dangerous tag rejection and removal', () => {
    it('completely removes <script> tags and their contents', () => {
      const input = '<p>An toàn</p><script>window.__eb09=2; alert("hacked")</script>'
      const output = sanitizeCustomHtml(input)
      expect(output).toBe('<p>An toàn</p>')
      expect(output).not.toContain('script')
      expect(output).not.toContain('__eb09')
    })

    it('removes <style>, <iframe>, <object>, <embed>, <form>, <input>', () => {
      const input = `
        <style>body { display: none; }</style>
        <iframe src="https://evil.com"></iframe>
        <form action="/login"><input type="password" name="pw" /></form>
        <object data="exploit.swf"></object>
        <embed src="exploit.swf" />
        <div>Nội dung hợp lệ</div>
      `
      const output = sanitizeCustomHtml(input)
      expect(output).toContain('<div>Nội dung hợp lệ</div>')
      expect(output).not.toContain('<style')
      expect(output).not.toContain('<iframe')
      expect(output).not.toContain('<form')
      expect(output).not.toContain('<input')
      expect(output).not.toContain('<object')
      expect(output).not.toContain('<embed')
    })

    it('removes <svg> and <math> including inline event handlers', () => {
      const input =
        '<p>Bắt đầu</p><svg onload="window.__eb09=1"><circle r="10"/></svg><math></math>'
      const output = sanitizeCustomHtml(input)
      expect(output).toBe('<p>Bắt đầu</p>')
      expect(output).not.toContain('svg')
      expect(output).not.toContain('onload')
      expect(output).not.toContain('math')
    })
  })

  describe('Event handlers and style attributes removal', () => {
    it('drops onerror and drops img with invalid src', () => {
      const input = '<img src=x onerror="window.__eb09=1">'
      const output = sanitizeCustomHtml(input)
      // Because src="x" is not a valid /api/media/file/... URL, <img> is dropped
      expect(output).toBe('')
      expect(output).not.toContain('onerror')
      expect(output).not.toContain('__eb09')
    })

    it('retains valid img with safe /api/media/file/... src and strips onerror', () => {
      const input =
        '<img src="/api/media/file/banner.webp" alt="Banner" width="800" height="400" onerror="alert(1)">'
      const output = sanitizeCustomHtml(input)
      expect(output).toBe(
        '<img src="/api/media/file/banner.webp" alt="Banner" width="800" height="400" />',
      )
      expect(output).not.toContain('onerror')
    })

    it('strips all style attributes and onclick on div/span/p', () => {
      const input =
        '<div class="box" style="background: url(javascript:alert(1))" onclick="alert(2)"><p style="color:red">Text</p></div>'
      const output = sanitizeCustomHtml(input)
      expect(output).toBe('<div class="box"><p>Text</p></div>')
      expect(output).not.toContain('style')
      expect(output).not.toContain('onclick')
    })
  })

  describe('Link and URL safety (href)', () => {
    it('blocks javascript: obfuscated with HTML numeric or hex entities', () => {
      expect(isSafeUrl('jav&#x61;script:alert(1)')).toBe(false)
      expect(isSafeUrl('&#106;avascript:alert(1)')).toBe(false)

      const input = '<a href="jav&#x61;script:alert(1)">Bấm vào đây</a>'
      const output = sanitizeCustomHtml(input)
      expect(output).toBe('<a href="#">Bấm vào đây</a>')
      expect(output).not.toContain('javascript')
    })

    it('allows valid safe URLs on <a> and enforces rel="noopener noreferrer" on target="_blank"', () => {
      const input = '<a href="https://example.com/page" target="_blank">Link</a>'
      const output = sanitizeCustomHtml(input)
      expect(output).toBe(
        '<a href="https://example.com/page" target="_blank" rel="noopener noreferrer">Link</a>',
      )
    })
  })

  describe('Attribute validation (class, id, dimensions)', () => {
    it('allows valid id matching cleanAnchorId and safe class names', () => {
      const input = '<div id="section-intro" class="card primary-card">Nội dung</div>'
      const output = sanitizeCustomHtml(input)
      expect(output).toBe('<div id="section-intro" class="card primary-card">Nội dung</div>')
    })

    it('drops invalid id or class with injection characters', () => {
      const input = '<div id="invalid id" class="box special@class!">Nội dung</div>'
      const output = sanitizeCustomHtml(input)
      expect(output).toBe('<div class="box specialclass">Nội dung</div>')
      expect(output).not.toContain('id=')
    })
  })

  describe('Integration with sanitizePageRichText', () => {
    it('sanitizes HtmlWidget.html when customCss is open', () => {
      const pageData = {
        content: [
          {
            type: 'HtmlWidget',
            props: {
              id: 'html-1',
              html: '<p class="safe">Hello</p><script>alert(1)</script>',
            },
          },
        ],
      }
      const cleaned = sanitizePageRichText(pageData, openDs)
      const item = (cleaned.content as Array<{ props: { html: string } }>)[0]
      expect(item.props.html).toBe('<p class="safe">Hello</p>')
    })

    it('blanks HtmlWidget.html to empty string when customCss is locked', () => {
      const pageData = {
        content: [
          {
            type: 'HtmlWidget',
            props: {
              id: 'html-1',
              html: '<p class="safe">Hello</p>',
            },
          },
        ],
      }
      const cleaned = sanitizePageRichText(pageData, lockedDs)
      const item = (cleaned.content as Array<{ props: { html: string } }>)[0]
      expect(item.props.html).toBe('')
    })
  })
})
