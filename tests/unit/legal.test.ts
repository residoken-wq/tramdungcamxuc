import { describe, expect, it } from 'vitest'
import { LEGAL_SLUGS, isLegalSlug, getLegalPath } from '@/lib/legal'

describe('Legal slugs specification (AGENTS.md §8.1)', () => {
  it('chứa chính xác 6 slug trang pháp lý và khớp mục 8.1', () => {
    const expectedSlugs = [
      'thong-tin-phap-ly',
      'dieu-khoan-su-dung',
      'chinh-sach-bao-mat',
      'chinh-sach-cung-cap-dich-vu',
      'gia-thanh-toan',
      'phan-anh-khieu-nai',
    ]

    expect(LEGAL_SLUGS).toHaveLength(6)
    expect([...LEGAL_SLUGS]).toEqual(expectedSlugs)
  })

  it('hàm isLegalSlug phân biệt chính xác slug hợp lệ và không hợp lệ', () => {
    expect(isLegalSlug('thong-tin-phap-ly')).toBe(true)
    expect(isLegalSlug('dieu-khoan-su-dung')).toBe(true)
    expect(isLegalSlug('chinh-sach-bao-mat')).toBe(true)
    expect(isLegalSlug('chinh-sach-cung-cap-dich-vu')).toBe(true)
    expect(isLegalSlug('gia-thanh-toan')).toBe(true)
    expect(isLegalSlug('phan-anh-khieu-nai')).toBe(true)

    expect(isLegalSlug('trang-chu')).toBe(false)
    expect(isLegalSlug('')).toBe(false)
    expect(isLegalSlug('/dieu-khoan-su-dung')).toBe(false)
    expect(isLegalSlug('hoan-tien')).toBe(false)
  })

  it('hàm getLegalPath trả về đường dẫn có dấu gạch chéo đầu', () => {
    expect(getLegalPath('thong-tin-phap-ly')).toBe('/thong-tin-phap-ly')
    expect(getLegalPath('dieu-khoan-su-dung')).toBe('/dieu-khoan-su-dung')
  })
})
