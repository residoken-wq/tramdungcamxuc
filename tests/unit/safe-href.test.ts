import { describe, expect, it } from 'vitest'
import { safeHref } from '@/lib/safe-href'

describe('safeHref link sanitizer (B4)', () => {
  it('filters out malicious and invalid schemes', () => {
    // Specific test cases required by T0-09b spec
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref(' JavaScript:x')).toBeNull()
    expect(safeHref('data:x')).toBeNull()
    expect(safeHref('//evil.com')).toBeNull()
    expect(safeHref('/\\evil.com')).toBeNull()
    expect(safeHref('  /\\evil.com  ')).toBeNull()
    expect(safeHref('/\\')).toBeNull()

    // Additional malicious and invalid schemes
    expect(safeHref('vbscript:msgbox(1)')).toBeNull()
    expect(safeHref('///evil.com')).toBeNull()
    expect(safeHref('//google.com')).toBeNull()
    expect(safeHref('')).toBeNull()
    expect(safeHref('   ')).toBeNull()
    expect(safeHref(null)).toBeNull()
    expect(safeHref(undefined)).toBeNull()
  })

  it('preserves valid and safe URLs, relative paths, hashes, mailto, and tel', () => {
    // Specific test cases required by T0-09b spec
    expect(safeHref('/ve-hana')).toBe('/ve-hana')
    expect(safeHref('https://a.vn')).toBe('https://a.vn')
    expect(safeHref('tel:0900')).toBe('tel:0900')

    // Additional allowed paths and schemes
    expect(safeHref('/coaching')).toBe('/coaching')
    expect(safeHref('/habit/tracker?day=1')).toBe('/habit/tracker?day=1')
    expect(safeHref('http://example.com')).toBe('http://example.com')
    expect(safeHref('mailto:hana@tramdungcamxuc.com')).toBe('mailto:hana@tramdungcamxuc.com')
    expect(safeHref('#')).toBe('#')
    expect(safeHref('#faq-section')).toBe('#faq-section')
    expect(safeHref('  https://a.vn  ')).toBe('https://a.vn')
  })
})
