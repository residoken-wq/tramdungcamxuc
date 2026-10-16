import type { Condition } from 'payload'

export const PRODUCT_TYPES = [
  'ebook',
  'toolkit',
  'digital_tool',
  'physical_external',
  'workshop',
  'community',
  'coaching_trial',
  'package',
  'b2b',
] as const

export type ProductType = (typeof PRODUCT_TYPES)[number]

export type ProductCondition = (
  data?: Partial<{ type?: ProductType | null }>,
  siblingData?: Partial<{ type?: ProductType | null }>,
  context?: unknown,
) => boolean

/**
 * Helper tạo `admin.condition` theo loại sản phẩm (`type`).
 *
 * Quy tắc:
 * - Trong Payload, `admin.condition` điều khiển hiển thị trên giao diện quản trị (admin UI).
 * - Trường bị ẩn vẫn giữ nguyên giá trị trong database khi lưu hoặc khi chuyển đổi loại sản phẩm.
 * - Trả về `true` nếu `data.type` hoặc `siblingData.type` thuộc danh sách `allowedTypes`.
 * - Khi chưa chọn loại (`type` undefined / null), trả về `false` để ẩn các trường đặc thù.
 */
export function showFor(
  allowedTypes: readonly ProductType[] | ProductType[],
): Condition & ProductCondition {
  const conditionFn: ProductCondition = (data, siblingData) => {
    const currentType = (data?.type ?? siblingData?.type) as ProductType | undefined
    if (!currentType) return false
    return allowedTypes.includes(currentType)
  }
  return conditionFn as Condition & ProductCondition
}
