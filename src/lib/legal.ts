/**
 * Danh sách 6 slug của các trang pháp lý theo spec mục 8.1 AGENTS.md.
 * Khai báo duy nhất tại một chỗ trong repo.
 */
export const LEGAL_SLUGS = [
  'thong-tin-phap-ly',
  'dieu-khoan-su-dung',
  'chinh-sach-bao-mat',
  'chinh-sach-cung-cap-dich-vu',
  'gia-thanh-toan',
  'phan-anh-khieu-nai',
] as const

export type LegalSlug = (typeof LEGAL_SLUGS)[number]

/**
 * Kiểm tra xem một chuỗi có phải là slug trang pháp lý hợp lệ không.
 */
export function isLegalSlug(slug: string): slug is LegalSlug {
  return LEGAL_SLUGS.includes(slug as LegalSlug)
}

/**
 * Trả về đường dẫn tuyệt đối cho slug pháp lý.
 */
export function getLegalPath(slug: LegalSlug): string {
  return `/${slug}`
}

/**
 * Định dạng ngày theo chuẩn hiển thị tiếng Việt (DD/MM/YYYY theo múi giờ Việt Nam).
 */
export function formatVietnameseDate(value?: string | Date | null): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date)
}

/**
 * Kiểm tra xem dữ liệu Lexical rich text có rỗng hoặc chỉ chứa đoạn văn trống không.
 */
export function isRichTextEmpty(content: unknown): boolean {
  if (!content || typeof content !== 'object') return true
  const root = (content as { root?: { children?: unknown[] } }).root
  if (!root || !Array.isArray(root.children) || root.children.length === 0) return true

  const hasAnyText = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false
    const n = node as { text?: string; children?: unknown[] }
    if (typeof n.text === 'string' && n.text.trim().length > 0) return true
    if (Array.isArray(n.children)) {
      return n.children.some(hasAnyText)
    }
    return false
  }

  return !root.children.some(hasAnyText)
}
