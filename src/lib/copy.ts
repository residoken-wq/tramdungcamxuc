import React from 'react'

/**
 * BX-05: Quyết định của chủ dự án (15/11):
 * - Ô nội dung trong CMS để trống thì KHÔNG hiển thị gì (ẩn, trả về null).
 * - Muốn dùng chữ mặc định thì bật checkbox `useDefaultCopy` theo từng phần.
 * - Nếu `value` là React element (do inline editor truyền vào): trả nguyên.
 * - Nếu `value` là chuỗi có chữ (sau khi trim): trả về `value`.
 * - Nếu `value` để trống / null / undefined / chỉ có whitespace:
 *   - Nếu `useDefault` bật (true): trả về `fallback`.
 *   - Nếu `useDefault` tắt (false / undefined): trả về null.
 */
export function pickCopy(
  value: React.ReactNode | string | null | undefined,
  fallback: string,
  useDefault?: boolean,
): string | null
export function pickCopy<T>(
  value: React.ReactNode | string | null | undefined,
  fallback: T,
  useDefault?: boolean,
): T | React.ReactNode | null
export function pickCopy<T = string>(
  value: React.ReactNode | string | null | undefined,
  fallback: T,
  useDefault?: boolean,
): React.ReactNode | T | null {
  if (value === null || value === undefined) {
    return useDefault ? fallback : null
  }
  if (typeof value === 'string') {
    if (value.trim().length > 0) {
      return value
    }
    return useDefault ? fallback : null
  }
  // React element or other non-string nodes (e.g. JSX rendered inline)
  if (React.isValidElement(value)) {
    return value
  }
  return useDefault ? fallback : null
}

/**
 * Helper cho danh sách (module, FAQ, features...):
 * - Nếu `list` có phần tử: trả về `list`.
 * - Nếu `list` rỗng hoặc null/undefined:
 *   - Nếu `useDefault` bật (true): trả về `fallbackList`.
 *   - Nếu `useDefault` tắt (false / undefined): trả về mảng rỗng `[]`.
 */
export function pickCopyList<T>(
  list: readonly T[] | T[] | null | undefined,
  fallbackList: readonly T[],
  useDefault?: boolean,
): readonly T[] {
  if (Array.isArray(list) && list.length > 0) {
    return list
  }
  return useDefault ? fallbackList : []
}

/**
 * Kiểm tra xem một phần có bất kỳ chữ/nội dung nào cần hiển thị hay không:
 * - Dùng để ẩn cả phần nếu mọi ô chữ trong phần đều trống và không có dữ liệu khác.
 */
export function hasCopy(
  ...values: (React.ReactNode | string | null | undefined | unknown[])[]
): boolean {
  for (const v of values) {
    if (v === null || v === undefined) continue
    if (typeof v === 'string') {
      if (v.trim().length > 0) return true
      continue
    }
    if (Array.isArray(v)) {
      if (v.length > 0) return true
      continue
    }
    if (React.isValidElement(v)) {
      return true
    }
    return true
  }
  return false
}
