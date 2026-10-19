import type { Data } from '@puckeditor/core'
import { PATHS } from './paths'
export type LibraryTab = 'khoa-hoc' | 'noi-dung'
export type LibraryTopic = 'eq' | 'habit' | 'career'

export interface LibraryQueryParams {
  tab: LibraryTab
  topic?: LibraryTopic
  q?: string
}

export interface SplitPuckData {
  before: Data | null
  after: Data | null
}

/**
 * Tách dữ liệu Puck tại khối ResourcePostsSlot:
 * - Phần trước -> khu bài viết -> phần sau
 * - Không có khối này -> before = data, after = null
 * - Có >= 2 khối -> dùng khối đầu, bỏ qua khối sau
 * - Chỉ khối ở cấp content (không lồng trong Columns) mới tính
 */
export function splitAtPostsSlot(data: Data | null | undefined): SplitPuckData {
  if (!data || !Array.isArray(data.content) || data.content.length === 0) {
    return { before: null, after: null }
  }

  const slotIndex = data.content.findIndex((item) => item?.type === 'ResourcePostsSlot')

  if (slotIndex === -1) {
    return { before: data, after: null }
  }

  const beforeItems = data.content.slice(0, slotIndex)
  const afterItems = data.content
    .slice(slotIndex + 1)
    .filter((item) => item?.type !== 'ResourcePostsSlot')

  return {
    before: beforeItems.length > 0 ? { ...data, content: beforeItems } : null,
    after: afterItems.length > 0 ? { ...data, content: afterItems } : null,
  }
}

export const DEFAULT_LIBRARY_TAB: LibraryTab = 'khoa-hoc'
export const VALID_TOPICS: readonly LibraryTopic[] = ['eq', 'habit', 'career'] as const

/**
 * Phân tích và chuẩn hóa tham số tìm kiếm từ URL/searchParams:
 * - tab lạ -> 'khoa-hoc' (mặc định)
 * - topic lạ -> undefined (nghĩa là "Tất cả")
 * - q: cắt khoảng trắng đầu/cuối, giới hạn tối đa 100 ký tự. Nếu chuỗi rỗng -> undefined.
 */
export function parseLibraryParams(raw: {
  tab?: string | string[] | undefined
  topic?: string | string[] | undefined
  q?: string | string[] | undefined
}): LibraryQueryParams {
  const rawTab = Array.isArray(raw.tab) ? raw.tab[0] : raw.tab
  const tab: LibraryTab = rawTab === 'noi-dung' ? 'noi-dung' : 'khoa-hoc'

  const rawTopic = Array.isArray(raw.topic) ? raw.topic[0] : raw.topic
  const topic: LibraryTopic | undefined =
    rawTopic && (VALID_TOPICS as readonly string[]).includes(rawTopic)
      ? (rawTopic as LibraryTopic)
      : undefined

  const rawQ = Array.isArray(raw.q) ? raw.q[0] : raw.q
  let q: string | undefined
  if (typeof rawQ === 'string') {
    const trimmed = rawQ.trim()
    if (trimmed.length > 0) {
      q = trimmed.slice(0, 100)
    }
  }

  return { tab, topic, q }
}

/**
 * Chủ đề của sản phẩm: ưu tiên trường `topic` Hana chọn trong CMS (SM-01); để trống thì suy ra:
 * - web = habit -> 'habit'
 * - web = eq -> 'eq'
 * - type = package -> 'career'
 * - còn lại -> null (không thuộc chủ đề cụ thể, chỉ hiển thị khi chọn Tất cả)
 */
export function productTopic(product: {
  topic?: string | null
  web?: string | null
  type?: string | null
}): LibraryTopic | null {
  if (product.topic === 'habit' || product.topic === 'eq' || product.topic === 'career') {
    return product.topic
  }
  if (product.web === 'habit') return 'habit'
  if (product.web === 'eq') return 'eq'
  if (product.type === 'package') return 'career'
  return null
}

// Fallback rule for products without an explicit `topic` (mirrors productTopic).
const inferredTopicWhere: Record<LibraryTopic, Record<string, unknown>> = {
  habit: { web: { equals: 'habit' } },
  eq: { web: { equals: 'eq' } },
  career: { type: { equals: 'package' } },
}

/**
 * Dựng điều kiện `where` cho truy vấn products theo searchParams.
 * Luôn bảo đảm loại trừ sản phẩm có `saleStatus = 'hidden'`.
 */
export function buildProductsWhere(params: LibraryQueryParams): {
  and: Record<string, unknown>[]
} {
  const and: Record<string, unknown>[] = [
    { _status: { equals: 'published' } },
    { saleStatus: { not_equals: 'hidden' } },
  ]

  if (params.tab === 'khoa-hoc') {
    and.push({ type: { in: ['digital_tool', 'package'] } })
  } else {
    and.push({ type: { in: ['ebook', 'toolkit'] } })
  }

  if (params.q) {
    and.push({ name: { like: params.q } })
  }

  if (params.topic) {
    and.push({
      or: [
        { topic: { equals: params.topic } },
        { and: [{ topic: { exists: false } }, inferredTopicWhere[params.topic]] },
      ],
    })
  }

  return { and }
}

/**
 * Dựng điều kiện `where` cho truy vấn posts theo searchParams.
 */
export function buildPostsWhere(params: LibraryQueryParams): {
  and: Record<string, unknown>[]
} {
  const and: Record<string, unknown>[] = [{ _status: { equals: 'published' } }]

  if (params.topic) {
    and.push({ topic: { equals: params.topic } })
  }

  if (params.q) {
    and.push({ title: { like: params.q } })
  }

  return { and }
}

/**
 * Tạo URL liên kết bộ lọc trong thư viện để duy trì trạng thái trên URL.
 */
export function buildLibraryUrl(params: {
  tab: LibraryTab
  topic?: LibraryTopic
  q?: string
}): string {
  const searchParams = new URLSearchParams()
  searchParams.set('tab', params.tab)
  if (params.topic) {
    searchParams.set('topic', params.topic)
  }
  if (params.q) {
    searchParams.set('q', params.q)
  }
  const queryString = searchParams.toString()
  return queryString ? `${PATHS.resources}?${queryString}` : PATHS.resources
}

export type LibraryEmptyKind = 'updating' | 'filtered'

/**
 * Xác định kiểu trạng thái rỗng trong thư viện:
 * - Khi không có bộ lọc topic hoặc q: thư viện chưa có nội dung ('updating' -> "Thư viện đang được cập nhật.", không có nút xóa bộ lọc).
 * - Khi người dùng có chọn topic hoặc nhập q: lọc không ra kết quả ('filtered' -> hiện thông điệp lọc và nút "Xóa bộ lọc").
 */
export function getLibraryEmptyKind(params: {
  topic?: string | undefined
  q?: string | undefined
}): LibraryEmptyKind {
  const hasFilter = Boolean(params.topic || (params.q && params.q.trim().length > 0))
  return hasFilter ? 'filtered' : 'updating'
}
