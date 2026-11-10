import { describe, expect, it } from 'vitest'
import {
  addVietnamDays,
  formatVietnamDate,
  formatVietnamShortDate,
} from '@/lib/habit/tracker-stats'

describe('AU-01 Mục 1: Định dạng ngày về đích theo giờ Việt Nam', () => {
  it('định dạng ngày có giờ, không bị vỡ chuỗi T00:00', () => {
    const isoString = '2026-12-07T00:00:00+07:00'
    expect(formatVietnamDate(isoString)).toBe('07/12/2026')
    expect(formatVietnamShortDate(isoString)).toBe('07/12')
  })

  it('định dạng ngày có giờ phút bất kỳ theo đúng múi giờ VN (UTC+7)', () => {
    // 2026-10-28 23:30 UTC = 2026-10-29 06:30 VN
    const utcDate = new Date('2026-10-28T23:30:00Z')
    expect(formatVietnamDate(utcDate)).toBe('29/10/2026')
  })

  it('định dạng ngày nhảy qua tháng', () => {
    const endOfMonth = addVietnamDays('2026-01-20', 15) // 2026-02-04
    expect(formatVietnamDate(endOfMonth)).toBe('04/02/2026')
    expect(formatVietnamShortDate(endOfMonth)).toBe('04/02')
  })

  it('định dạng ngày nhảy qua năm mới', () => {
    // 28 ngày bắt đầu từ 15/12/2026 -> về đích 11/01/2027
    const nextYear = addVietnamDays('2026-12-15', 27)
    expect(formatVietnamDate(nextYear)).toBe('11/01/2027')
    expect(formatVietnamShortDate(nextYear)).toBe('11/01')
  })

  it('trả về chuỗi rỗng khi ngày thiếu, null, undefined hoặc không hợp lệ', () => {
    expect(formatVietnamDate(null)).toBe('')
    expect(formatVietnamDate(undefined)).toBe('')
    expect(formatVietnamDate('')).toBe('')
    expect(formatVietnamDate('invalid-date')).toBe('')
    expect(formatVietnamShortDate(null)).toBe('')
    expect(formatVietnamShortDate(undefined)).toBe('')
    expect(formatVietnamShortDate('')).toBe('')
  })
})

