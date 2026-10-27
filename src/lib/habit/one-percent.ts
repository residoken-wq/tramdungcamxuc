import { vi } from '@/lib/i18n/vi'

export interface CompoundGrowthResult {
  better: number
  worse: number
}

/**
 * Tính toán hiệu ứng tăng trưởng hoặc suy giảm lãi kép theo nguyên lý 1% tốt hơn mỗi ngày.
 *
 * Công thức:
 * - better = (1 + p / 100) ^ days
 * - worse = (1 - p / 100) ^ days
 *
 * @param dailyPercent Tỷ lệ phần trăm thay đổi mỗi ngày (0.1 - 10, ngoài khoảng lấy 1)
 * @param days Số ngày thực hành (làm tròn, kẹp trong [0, maxDays])
 * @param maxDays Số ngày tối đa cho phép (mặc định 365, lấy từ cấu hình CMS)
 */
/** Tỷ lệ % mỗi ngày dùng thật: ngoài khoảng 0.1–10 (hoặc không phải số) thì lấy 1. */
export function normalizeDailyPercent(dailyPercent: unknown): number {
  return typeof dailyPercent === 'number' &&
    Number.isFinite(dailyPercent) &&
    dailyPercent >= 0.1 &&
    dailyPercent <= 10
    ? dailyPercent
    : 1
}

/** Hiển thị tỷ lệ % theo kiểu Việt Nam (0,5 thay vì 0.5). */
export function formatPercent(dailyPercent: unknown): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(
    normalizeDailyPercent(dailyPercent),
  )
}

export function compoundGrowth(
  dailyPercent: number,
  days: number,
  maxDays: number = 365,
): CompoundGrowthResult {
  const p = normalizeDailyPercent(dailyPercent)

  const limit =
    typeof maxDays === 'number' && Number.isFinite(maxDays) && maxDays > 0 ? maxDays : 365

  const rawDays = typeof days === 'number' && Number.isFinite(days) ? Math.round(days) : 0
  const clampedDays = Math.max(0, Math.min(rawDays, limit))

  const better = Math.pow(1 + p / 100, clampedDays)
  const worse = Math.pow(1 - p / 100, clampedDays)

  return { better, worse }
}

/**
 * Định dạng giá trị tăng trưởng thành chuỗi tiếng Việt.
 * - Không trả về Infinity / NaN.
 * - Giá trị < 0.01: hiển thị "≈ 0".
 * - Giá trị >= 1.000.000: hiển thị nhãn "hơn 1 triệu" (vi.hb08.overMillion).
 * - Các giá trị khác: định dạng theo chuẩn vi-VN tối đa 2 chữ số thập phân.
 */
export function formatGrowth(value: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) {
    return '0'
  }

  if (value < 0.01) {
    return '≈ 0'
  }

  if (value >= 1_000_000) {
    return vi.hb08.overMillion
  }

  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)
}
