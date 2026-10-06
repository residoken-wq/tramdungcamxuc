export type LibraryTab = 'khoa-hoc' | 'noi-dung'
export type LibraryTopic = 'eq' | 'habit' | 'career'

export interface LibraryQueryParams {
  tab: LibraryTab
  topic?: LibraryTopic
  q?: string
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
 * Suy ra chủ đề cho sản phẩm (products chưa có trường topic trong schema):
 * - web = habit -> 'habit'
 * - web = eq -> 'eq'
 * - type = package -> 'career'
 * - còn lại -> null (không thuộc chủ đề cụ thể, chỉ hiển thị khi chọn Tất cả)
 */
export function productTopic(product: {
  web?: string | null
  type?: string | null
}): LibraryTopic | null {
  if (product.web === 'habit') return 'habit'
  if (product.web === 'eq') return 'eq'
  if (product.type === 'package') return 'career'
  return null
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

  if (params.topic === 'habit') {
    and.push({ web: { equals: 'habit' } })
  } else if (params.topic === 'eq') {
    and.push({ web: { equals: 'eq' } })
  } else if (params.topic === 'career') {
    and.push({ type: { equals: 'package' } })
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
  return queryString ? `/thu-vien?${queryString}` : '/thu-vien'
}
