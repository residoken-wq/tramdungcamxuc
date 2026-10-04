import { describe, expect, it } from 'vitest'
import { vi } from '@/lib/i18n/vi'

describe('Vietnamese i18n dictionary (vi.ts)', () => {
  it('should define all expected common action labels', () => {
    expect(vi.common.send).toBe('Gửi')
    expect(vi.common.login).toBe('Đăng nhập')
    expect(vi.common.logout).toBe('Đăng xuất')
    expect(vi.common.save).toBe('Lưu')
    expect(vi.common.cancel).toBe('Hủy')
    expect(vi.common.submit).toBe('Xác nhận')
    expect(vi.common.loading).toBe('Đang tải...')
  })

  it('all common labels should be non-empty strings', () => {
    for (const [key, value] of Object.entries(vi.common)) {
      expect(typeof value).toBe('string')
      expect(value.trim().length, `Expected ${key} to not be empty`).toBeGreaterThan(0)
    }
  })
})
