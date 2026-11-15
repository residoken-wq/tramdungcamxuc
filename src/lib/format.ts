/**
 * Hàm định dạng tiền tệ Việt Nam Đồng (VND) theo chuẩn hiển thị Trạm Dừng Cảm Xúc.
 *
 * Quy tắc:
 * - null hoặc undefined -> chuỗi rỗng ''
 * - Số âm (< 0), NaN hoặc không phải số -> chuỗi rỗng ''
 * - 0 -> '0đ'
 * - Số nguyên dương -> định dạng phân cách hàng nghìn bằng dấu chấm và hậu tố 'đ' (ví dụ 149000 -> '149.000đ')
 *
 * @param amount - Giá trị số tiền cần định dạng
 * @returns Chuỗi tiền tệ đã định dạng hoặc chuỗi rỗng
 */
export function formatVnd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return ''
  }

  if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
    return ''
  }

  const rounded = Math.round(amount)
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'
}

/** Max money value accepted by the VND inputs (100 tỷ đồng) – keeps numbers well inside safe range. */
export const VND_INPUT_MAX = 100_000_000_000

/**
 * Digits of a VND amount grouped by dots, without the currency suffix: 1750000 -> '1.750.000'.
 * Empty string for null / undefined / negative / NaN.
 */
export function formatVndDigits(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) return ''
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Parses what a person typed in a VND input ('1.750.000', '1750000', '1,750,000 đ') back to a
 * whole number of đồng. Every non-digit is ignored (đồng has no decimals). Empty -> null.
 */
export function parseVndInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  if (!digits) return null
  return Math.min(Number(digits), VND_INPUT_MAX)
}
