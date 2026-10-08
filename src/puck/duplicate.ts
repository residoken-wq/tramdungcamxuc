/**
 * Tạo slug mới cho bản sao của trang, đảm bảo không trùng lặp với các slug hiện có.
 *
 * Quy tắc:
 * 1. Nếu slug hiện tại là trang chủ ('/' hoặc rỗng) -> tiền tố 'trang-chu-ban-sao'
 * 2. Các slug khác -> `${currentSlug}-ban-sao`
 * 3. Nếu slug tạo ra đã có trong danh sách -> tự động thêm hậu tố -2, -3, ...
 */
export function generateDuplicateSlug(currentSlug: string, existingSlugs: string[] = []): string {
  const trimmed = (currentSlug || '').trim()
  const cleanSlug = trimmed.replace(/^\/+|\/+$/g, '')
  const base =
    cleanSlug === '' || cleanSlug === 'trang-chu' ? 'trang-chu-ban-sao' : `${cleanSlug}-ban-sao`

  const slugSet = new Set(existingSlugs.map((s) => (s || '').trim().replace(/^\/+|\/+$/g, '')))

  if (!slugSet.has(base)) {
    return base
  }

  let counter = 2
  while (slugSet.has(`${base}-${counter}`)) {
    counter++
  }

  return `${base}-${counter}`
}
