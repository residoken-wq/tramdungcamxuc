import { randomUUID } from 'node:crypto'

/**
 * Helper tạo dữ liệu sản phẩm mẫu (isSample: true) cho môi trường kiểm thử.
 * Đảm bảo các sản phẩm on_sale trong test có isSample: true và price hợp lệ
 * để thỏa mãn quy tắc kiểm tra xuất bản (CM-03).
 */
export function sampleProductData(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {
    name: '[MẪU] Sản phẩm kiểm thử',
    slug: `test-prod-${randomUUID().slice(0, 8)}`,
    web: 'habit',
    type: 'digital_tool',
    saleStatus: 'on_sale',
    price: 250000,
    isSample: true,
    _status: 'published',
  }

  return {
    ...defaults,
    ...overrides,
    isSample: overrides.isSample !== undefined ? overrides.isSample : true,
  }
}
