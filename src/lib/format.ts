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
