/**
 * BX-08: paths that are application screens (learning, tracker, card draw, checkout, account…).
 * AGENTS.md 5B: these are never edited with the builder, so a `pages` doc may not take their slug.
 * Product landing pages (`habit/1-percent-better`, `tai-nguyen/<slug>`, `eq-buddy`) are NOT here:
 * a published builder page with that slug replaces the coded page (BX-08 option A).
 */
export const RESERVED_APP_SLUG_PREFIXES = [
  'habit/5-phut',
  'habit/tracker',
  'habit/hoc',
  'habit/chan-doan',
  'eq-buddy/rut-the',
  'eq-buddy/the',
  'tai-khoan',
  'thanh-toan',
  'dat-phien-trai-nghiem',
  'dung-thu',
  'chung-nhan',
  'nhac-lich',
  'xem-truoc',
  'admin',
  'api',
] as const

/** True when `slug` (no leading slash) is an application screen or lives under one. */
export function isReservedAppSlug(slug: string | null | undefined): boolean {
  if (typeof slug !== 'string') return false
  const clean = slug
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
  if (!clean) return false
  return RESERVED_APP_SLUG_PREFIXES.some((p) => clean === p || clean.startsWith(`${p}/`))
}
