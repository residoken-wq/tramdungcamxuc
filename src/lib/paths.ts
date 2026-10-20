// Fixed site paths (sitemap v2, decided 17/10/2026 – docs/plan/SITEMAP_V2.md §6).
// Pages built in Puck keep their own slugs in the CMS; these are the paths code links to.
export const PATHS = {
  home: '/',
  about: '/ve-tram',
  journey: '/lo-trinh-chuyen-minh',
  coaching: '/coaching',
  business: '/doanh-nghiep',
  resources: '/tai-nguyen',
  contact: '/lien-he',
  faq: '/cau-hoi-thuong-gap',
  community: '/cong-dong',
  quiz: '/habit/chan-doan',
} as const

// Old public paths kept alive with permanent redirects (links already sent by email).
// `/coaching/growth-mirror` wins over the Growth Mirror service detail page that shares the
// path; the service is presented on /coaching instead (docs/decisions/SM-02.md).
export const LEGACY_REDIRECTS = [
  { from: '/thu-vien', to: PATHS.resources },
  { from: '/ve-hana', to: PATHS.about },
  { from: '/coaching/growth-mirror', to: PATHS.journey },
] as const

// Puck page slugs renamed with the paths above (no leading slash, as stored in `pages.slug`).
export const LEGACY_PAGE_SLUGS = [
  { from: 'thu-vien', to: 'tai-nguyen' },
  { from: 've-hana', to: 've-tram' },
  { from: 'coaching/growth-mirror', to: 'lo-trinh-chuyen-minh' },
] as const

type LinkMapping = ReadonlyArray<{ readonly from: string; readonly to: string }>

/**
 * Rewrites a link that is exactly one of `mapping`'s `from` paths (optionally followed by
 * `?query` or `#anchor`) to its `to` path. Any other string – including sentences that merely
 * mention a path, or deeper paths such as `/tai-nguyen/<slug>` – is returned unchanged.
 */
export function rewriteLink(value: string, mapping: LinkMapping = LEGACY_REDIRECTS): string {
  for (const { from, to } of mapping) {
    if (value === from) return to
    const rest = value.startsWith(from) ? value.slice(from.length) : null
    if (rest !== null && (rest.startsWith('?') || rest.startsWith('#'))) return to + rest
  }
  return value
}

/**
 * Returns a copy of any JSON value (Puck data, menu arrays…) with every string that is a mapped
 * link rewritten, plus the number of strings changed. Running it twice changes nothing more.
 */
export function rewriteLinks<T>(
  value: T,
  mapping: LinkMapping = LEGACY_REDIRECTS,
): { value: T; changed: number } {
  let changed = 0
  const walk = (node: unknown): unknown => {
    if (typeof node === 'string') {
      const next = rewriteLink(node, mapping)
      if (next !== node) changed++
      return next
    }
    if (Array.isArray(node)) return node.map(walk)
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, walk(child)]))
    }
    return node
  }
  const result = walk(value) as T
  return { value: result, changed }
}

/** New → old mapping, used to roll the sitemap v2 link change back. */
export function reverseMapping(mapping: LinkMapping): LinkMapping {
  return mapping.map(({ from, to }) => ({ from: to, to: from }))
}
