import { describe, expect, it } from 'vitest'
import { internalOrExternalUrl } from '@/fields/content'

describe('internalOrExternalUrl field validator (T1-18)', () => {
  const field = internalOrExternalUrl('externalUrl', 'Liên kết của nút')
  const validate = field.validate as (value: unknown) => true | string

  it('allows empty, null, or undefined values (optional field)', () => {
    expect(validate(null)).toBe(true)
    expect(validate(undefined)).toBe(true)
    expect(validate('')).toBe(true)
    expect(validate('   ')).toBe(true)
  })

  it('allows valid internal paths starting with a single /', () => {
    expect(validate('/habit/chan-doan')).toBe(true)
    expect(validate('/habit/5-phut')).toBe(true)
    expect(validate('/thu-vien?tab=noi-dung')).toBe(true)
    expect(validate('/coaching/growth-mirror#pricing')).toBe(true)
  })

  it('strictly rejects protocol-relative URLs starting with // or /\\', () => {
    expect(typeof validate('//evil.com')).toBe('string')
    expect(typeof validate('/\\evil.com')).toBe('string')
    expect(typeof validate('//phishing.test/login')).toBe('string')
  })

  it('allows valid absolute external URLs starting with https:// or http://', () => {
    expect(validate('https://shopee.vn/bo-the-eq-buddy')).toBe(true)
    expect(validate('https://cal.com/hana-luong')).toBe(true)
    expect(validate('http://localhost:3000')).toBe(true)
  })

  it('rejects dangerous schemes and invalid strings', () => {
    expect(typeof validate('javascript:alert(1)')).toBe('string')
    expect(typeof validate('data:text/html,evil')).toBe('string')
    expect(typeof validate('not-a-valid-url')).toBe('string')
    expect(typeof validate('ftp://example.com')).toBe('string')
  })
})
