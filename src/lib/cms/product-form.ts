import type { Condition, Validate } from 'payload'
import { vi } from '../i18n/vi'

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

// REVIEW-REQUIRED: Hàm validate kiểm tra giá bán khi xuất bản sản phẩm đang mở bán (on_sale).
// Cho phép lưu nháp tự do (_status === 'draft').
// Miễn trừ sản phẩm Shopee (physical_external) vì bán trên gian hàng ngoài.
export const validatePriceOnSale: Validate = (value, options) => {
  if (options?.data?._status === 'draft') return true

  const saleStatus = options?.data?.saleStatus
  const type = options?.data?.type

  if (saleStatus === 'on_sale') {
    if (type === 'physical_external') return true
    if (value == null || typeof value !== 'number' || Number.isNaN(value)) {
      return vi.cms.productForm.validation.missingPriceOnSale
    }
  }

  return true
}

// REVIEW-REQUIRED: Hàm validate kiểm tra ảnh bìa khi xuất bản sản phẩm đang mở bán (on_sale).
// Cho phép lưu nháp tự do (_status === 'draft').
export const validateCoverImageOnSale: Validate = (value, options) => {
  if (options?.data?._status === 'draft') return true

  if (options?.data?.saleStatus === 'on_sale') {
    if (!value) {
      return vi.cms.productForm.validation.missingCoverImageOnSale
    }
  }

  return true
}

// REVIEW-REQUIRED: Hàm validate kiểm tra đường dẫn (slug) khi xuất bản sản phẩm đang mở bán (on_sale).
// Cho phép lưu nháp tự do (_status === 'draft').
export const validateSlugOnSale =
  (allowSlash = false): Validate =>
  (value, options) => {
    if (options?.data?._status === 'draft') return true

    if (options?.data?.saleStatus === 'on_sale') {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return vi.cms.productForm.validation.missingSlugOnSale
      }
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const regex = allowSlash ? /^[a-z0-9/-]+$/ : /^[a-z0-9-]+$/
      if (!regex.test(value)) {
        return 'Đường dẫn chỉ dùng chữ thường không dấu, số và dấu được cho phép.'
      }
    }

    return true
  }
