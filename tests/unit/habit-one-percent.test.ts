import { describe, expect, it } from 'vitest'
import {
  compoundGrowth,
  formatGrowth,
  formatPercent,
  normalizeDailyPercent,
} from '@/lib/habit/one-percent'
import { vi } from '@/lib/i18n/vi'

describe('HB-08: One Percent Principle pure calculations (one-percent.ts)', () => {
  describe('compoundGrowth', () => {
    it('calculates 1% better and worse for 365 days correctly (≈ 37.78 and 0.03)', () => {
      const res = compoundGrowth(1, 365)
      expect(res.better).toBeCloseTo(37.7834, 3)
      expect(res.worse).toBeCloseTo(0.0255, 3)

      expect(formatGrowth(res.better)).toBe('37,78')
      expect(formatGrowth(res.worse)).toBe('0,03')
    })

    it('returns 1 and 1 when days is 0', () => {
      const res = compoundGrowth(1, 0)
      expect(res.better).toBe(1)
      expect(res.worse).toBe(1)
      expect(formatGrowth(res.better)).toBe('1')
      expect(formatGrowth(res.worse)).toBe('1')
    })

    it('clamps negative days to 0', () => {
      const res = compoundGrowth(1, -15)
      expect(res.better).toBe(1)
      expect(res.worse).toBe(1)
    })

    it('clamps days exceeding maxDays to maxDays', () => {
      const clamped = compoundGrowth(1, 500, 365)
      const normal = compoundGrowth(1, 365, 365)
      expect(clamped.better).toBe(normal.better)
      expect(clamped.worse).toBe(normal.worse)
    })

    it('falls back to 1% when dailyPercent is outside 0.1–10 or invalid', () => {
      const normal = compoundGrowth(1, 100)

      expect(compoundGrowth(0, 100)).toEqual(normal)
      expect(compoundGrowth(-2, 100)).toEqual(normal)
      expect(compoundGrowth(15, 100)).toEqual(normal)
      expect(compoundGrowth(Number.NaN, 100)).toEqual(normal)
      expect(compoundGrowth(Number.POSITIVE_INFINITY, 100)).toEqual(normal)
    })

    it('accepts valid custom dailyPercent between 0.1 and 10', () => {
      const res2 = compoundGrowth(2, 30)
      // (1 + 0.02)^30 = 1.811361...
      expect(res2.better).toBeCloseTo(1.8114, 3)
      // (1 - 0.02)^30 = 0.545484...
      expect(res2.worse).toBeCloseTo(0.5455, 3)
    })
  })

  describe('formatGrowth', () => {
    it('returns "0" for invalid numbers (NaN, Infinity)', () => {
      expect(formatGrowth(Number.NaN)).toBe('0')
      expect(formatGrowth(Number.POSITIVE_INFINITY)).toBe('0')
      expect(formatGrowth(Number.NEGATIVE_INFINITY)).toBe('0')
    })

    it('returns "≈ 0" for values strictly less than 0.01', () => {
      expect(formatGrowth(0)).toBe('≈ 0')
      expect(formatGrowth(0.009)).toBe('≈ 0')
      expect(formatGrowth(0.0001)).toBe('≈ 0')
    })

    it('returns vi.hb08.overMillion ("hơn 1 triệu") for values >= 1,000,000', () => {
      expect(formatGrowth(1_000_000)).toBe(vi.hb08.overMillion)
      expect(formatGrowth(5_000_000)).toBe(vi.hb08.overMillion)

      // 10% daily over 1000 days is astronomically large
      const astronomical = compoundGrowth(10, 1000, 1000)
      expect(formatGrowth(astronomical.better)).toBe(vi.hb08.overMillion)
    })

    it('formats normal values with Vietnamese number format (comma as decimal separator)', () => {
      expect(formatGrowth(1)).toBe('1')
      expect(formatGrowth(2.5)).toBe('2,5')
      expect(formatGrowth(37.7834)).toBe('37,78')
      expect(formatGrowth(0.03)).toBe('0,03')
      expect(formatGrowth(1234.56)).toBe('1.234,56')
    })
  })

  describe('normalizeDailyPercent / formatPercent (HB-08c)', () => {
    it('nhãn % dùng đúng tỷ lệ mà phép tính dùng', () => {
      expect(normalizeDailyPercent(0.5)).toBe(0.5)
      expect(normalizeDailyPercent(20)).toBe(1)
      expect(normalizeDailyPercent(undefined)).toBe(1)
      expect(formatPercent(0.5)).toBe('0,5')
      expect(formatPercent(20)).toBe('1')
    })
  })
})
