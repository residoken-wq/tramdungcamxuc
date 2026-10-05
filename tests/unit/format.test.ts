import { describe, expect, it } from 'vitest'
import { formatVnd } from '@/lib/format'

describe('formatVnd currency formatter (T0-04)', () => {
  it('định dạng số 0 thành "0đ"', () => {
    expect(formatVnd(0)).toBe('0đ')
  })

  it('định dạng 149000 thành "149.000đ"', () => {
    expect(formatVnd(149000)).toBe('149.000đ')
  })

  it('định dạng 1750000 thành "1.750.000đ"', () => {
    expect(formatVnd(1750000)).toBe('1.750.000đ')
  })

  it('trả về chuỗi rỗng khi giá trị là null hoặc undefined', () => {
    expect(formatVnd(null)).toBe('')
    expect(formatVnd(undefined)).toBe('')
  })

  it('trả về chuỗi rỗng khi số âm hoặc NaN (theo spec ghi rõ)', () => {
    expect(formatVnd(-1)).toBe('')
    expect(formatVnd(-149000)).toBe('')
    expect(formatVnd(Number.NaN)).toBe('')
  })

  it('làm tròn số thập phân trước khi định dạng', () => {
    expect(formatVnd(149000.4)).toBe('149.000đ')
    expect(formatVnd(149000.6)).toBe('149.001đ')
  })
})
