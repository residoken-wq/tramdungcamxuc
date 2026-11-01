import { describe, expect, it } from 'vitest'
import { isSafeUrl, sanitizeRichText } from '@/lib/html/sanitize-rich-text'

describe('EB-06a: sanitizeRichText', () => {
  it('preserves basic formatting tags and paragraphs', () => {
    const input =
      '<p>Đoạn văn <strong>in đậm</strong> và <em>in nghiêng</em> và <u>gạch chân</u>.</p>'
    const output = sanitizeRichText(input)
    expect(output).toBe(
      '<p>Đoạn văn <strong>in đậm</strong> và <em>in nghiêng</em> và <u>gạch chân</u>.</p>',
    )
  })

  it('preserves lists and headings', () => {
    const input = '<h2>Tiêu đề mục</h2><ul><li>Mục 1</li><li>Mục 2</li></ul>'
    const output = sanitizeRichText(input)
    expect(output).toBe('<h2>Tiêu đề mục</h2><ul><li>Mục 1</li><li>Mục 2</li></ul>')
  })

  it('allows safe http/https links and relative links', () => {
    const input =
      '<p><a href="https://example.com" target="_blank">Link ngoài</a> và <a href="/ve-hana">Trang nội bộ</a></p>'
    const output = sanitizeRichText(input)
    expect(output).toContain('href="https://example.com"')
    expect(output).toContain('target="_blank"')
    expect(output).toContain('rel="noopener noreferrer"')
    expect(output).toContain('href="/ve-hana"')
  })

  it('neutralizes javascript: URIs', () => {
    const input = '<a href="javascript:alert(1)">Bấm vào</a>'
    const output = sanitizeRichText(input)
    expect(output).not.toContain('javascript:')
    expect(output).toContain('href="#"')
  })

  it('neutralizes data: URIs and vbscript:', () => {
    const input = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Bấm</a>'
    const output = sanitizeRichText(input)
    expect(output).not.toContain('data:')
    expect(output).toContain('href="#"')
  })

  it('strips <script> tags and their contents completely', () => {
    const input = '<p>Văn bản<script>alert("xss")</script> kết thúc.</p>'
    const output = sanitizeRichText(input)
    expect(output).toBe('<p>Văn bản kết thúc.</p>')
    expect(output).not.toContain('alert')
  })

  it('strips <iframe>, <style>, and <form> tags', () => {
    const input =
      '<div><iframe src="https://attacker.com"></iframe><style>body{display:none}</style><form><input /></form>Nội dung</div>'
    const output = sanitizeRichText(input)
    expect(output).toBe('Nội dung')
    expect(output).not.toContain('iframe')
    expect(output).not.toContain('style')
    expect(output).not.toContain('form')
  })

  it('strips inline on* event handlers', () => {
    const input = '<p onclick="alert(1)" onmouseover="stealCookie()">Đoạn văn</p>'
    const output = sanitizeRichText(input)
    expect(output).toBe('<p>Đoạn văn</p>')
    expect(output).not.toContain('onclick')
    expect(output).not.toContain('onmouseover')
  })

  it('handles null, undefined, and empty string safely', () => {
    expect(sanitizeRichText(null)).toBe('')
    expect(sanitizeRichText(undefined)).toBe('')
    expect(sanitizeRichText('')).toBe('')
  })
})

describe('EB-06a: isSafeUrl', () => {
  it('validates safe and unsafe URLs', () => {
    expect(isSafeUrl('https://example.com')).toBe(true)
    expect(isSafeUrl('http://example.com')).toBe(true)
    expect(isSafeUrl('/coaching/1-1')).toBe(true)
    expect(isSafeUrl('#section')).toBe(true)
    expect(isSafeUrl('mailto:hello@example.com')).toBe(true)
    expect(isSafeUrl('tel:+84901234567')).toBe(true)

    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeUrl('  JAVASCRIPT:alert(1)')).toBe(false)
    expect(isSafeUrl('data:text/html,test')).toBe(false)
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false)
  })
})
