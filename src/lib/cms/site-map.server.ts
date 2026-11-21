import 'server-only'
import type { Payload, PayloadRequest } from 'payload'
import {
  BUILDER_GUIDE,
  BUILDER_PAGE_NOTES,
  OVERRIDE_PAGE_SLUGS,
  SITE_MAP_SECTIONS,
  guideHref,
  type SiteMapEditTarget,
  type SiteMapEntry,
  type SiteMapKind,
} from './site-map-data'

export interface SiteMapLink {
  label: string
  href: string
  /** builder = opens the drag & drop editor; form = a CMS form or list. */
  tone: 'builder' | 'form'
}

export interface SiteMapCard {
  id: string
  title: string
  path: string
  openHref: string | null
  kind: SiteMapKind
  summary: string
  links: SiteMapLink[]
  tips: string[]
  guides: { label: string; href: string }[]
  badges: { label: string; tone: 'ok' | 'warn' | 'info' }[]
}

export interface SiteMapGroup {
  id: string
  title: string
  description: string
  cards: SiteMapCard[]
}

export interface SiteMapMenuNode {
  label: string
  path: string | null
  external: boolean
  edit: SiteMapLink | null
  groups: { label: string; items: SiteMapMenuNode[] }[]
}

export interface SiteMapData {
  menu: SiteMapMenuNode[]
  footerMenu: SiteMapMenuNode[]
  groups: SiteMapGroup[]
}

interface PageRow {
  id: number | string
  title: string
  slug: string
  published: boolean
}

type User = PayloadRequest['user']

const builderHref = (id: number | string) => `/builder/${id}`
const pageFormHref = (id: number | string) => `/admin/collections/pages/${id}`

/** `/` for the home page, otherwise `/<slug>`. */
export function pagePath(slug: string): string {
  const clean = slug.replace(/^\/+|\/+$/g, '')
  return clean ? `/${clean}` : '/'
}

function guideLinks(headings: readonly string[] | undefined) {
  return (headings ?? []).map((heading) => ({ label: heading, href: guideHref(heading) }))
}

async function loadPages(payload: Payload, user: User): Promise<PageRow[]> {
  const common = {
    collection: 'pages' as const,
    where: { kind: { equals: 'page' } },
    limit: 300,
    depth: 0,
    user,
    overrideAccess: false,
    select: { title: true as const, slug: true as const },
  }
  const [latest, published] = await Promise.all([
    payload.find({ ...common, draft: true }).catch(() => null),
    payload
      .find({
        ...common,
        where: { and: [{ kind: { equals: 'page' } }, { _status: { equals: 'published' } }] },
        draft: false,
      })
      .catch(() => null),
  ])
  const publishedIds = new Set((published?.docs ?? []).map((d) => String(d.id)))
  return (latest?.docs ?? []).map((doc) => {
    const d = doc as { id: number | string; title?: string | null; slug?: string | null }
    return {
      id: d.id,
      title: d.title || '',
      slug: (d.slug || '').replace(/^\/+|\/+$/g, '') || '/',
      published: publishedIds.has(String(d.id)),
    }
  })
}

async function loadProducts(payload: Payload, user: User, slugs: string[]) {
  if (slugs.length === 0) return new Map<string, number | string>()
  const res = await payload
    .find({
      collection: 'products',
      where: { slug: { in: slugs } },
      limit: slugs.length,
      depth: 0,
      draft: true,
      user,
      overrideAccess: false,
      select: { slug: true as const },
    })
    .catch(() => null)
  return new Map(
    (res?.docs ?? []).map((d) => [String((d as { slug?: string }).slug), (d as { id: number }).id]),
  )
}

function resolveTarget(
  target: SiteMapEditTarget,
  pagesBySlug: Map<string, PageRow>,
  productIds: Map<string, number | string>,
): SiteMapLink | null {
  switch (target.type) {
    case 'collection':
      return { label: target.label, href: `/admin/collections/${target.slug}`, tone: 'form' }
    case 'global':
      return { label: target.label, href: `/admin/globals/${target.slug}`, tone: 'form' }
    case 'admin':
      return { label: target.label, href: target.href, tone: 'form' }
    case 'product': {
      const id = productIds.get(target.productSlug)
      return {
        label: target.label,
        href: id
          ? `/admin/collections/products/${id}`
          : `/admin/collections/products?where[slug][equals]=${encodeURIComponent(target.productSlug)}`,
        tone: 'form',
      }
    }
    case 'builderPage': {
      const page = pagesBySlug.get(target.pageSlug)
      return page ? { label: target.label, href: builderHref(page.id), tone: 'builder' } : null
    }
  }
}

function entryCard(
  entry: SiteMapEntry,
  pagesBySlug: Map<string, PageRow>,
  productIds: Map<string, number | string>,
): SiteMapCard {
  const links = entry.edits
    .map((t) => resolveTarget(t, pagesBySlug, productIds))
    .filter((l): l is SiteMapLink => Boolean(l))
  const badges: SiteMapCard['badges'] = []
  if (entry.builderOverrideSlug) {
    const page = pagesBySlug.get(entry.builderOverrideSlug)
    if (page?.published) {
      badges.push({ label: 'Đang hiện trang builder', tone: 'info' })
      links.unshift({
        label: 'Chỉnh bố cục (builder)',
        href: builderHref(page.id),
        tone: 'builder',
      })
    } else if (page) {
      badges.push({ label: 'Có bản builder nháp', tone: 'warn' })
      links.unshift({
        label: 'Chỉnh bố cục (builder, nháp)',
        href: builderHref(page.id),
        tone: 'builder',
      })
    } else {
      badges.push({ label: 'Đổi bố cục được', tone: 'info' })
    }
  }
  return {
    id: entry.id,
    title: entry.title,
    path: entry.path,
    openHref: entry.openPath ?? null,
    kind: entry.kind,
    summary: entry.summary,
    links,
    tips: entry.tips ?? [],
    guides: guideLinks(entry.guides),
    badges,
  }
}

type RawMenuItem = {
  label?: string | null
  linkType?: string | null
  page?: { slug?: string | null } | number | string | null
  url?: string | null
  children?: { groupLabel?: string | null; items?: RawMenuItem[] | null }[] | null
}

/** Edit link for an address on the site: the builder page with that slug, else a known page. */
export function findEditForPath(
  path: string,
  pagesBySlug: Map<string, PageRow>,
  cards: SiteMapCard[],
): SiteMapLink | null {
  const slug = path === '/' ? '/' : path.replace(/^\/+|\/+$/g, '')
  const page = pagesBySlug.get(slug)
  if (page) return { label: 'Chỉnh trực quan', href: builderHref(page.id), tone: 'builder' }
  const card =
    cards.find((c) => c.openHref === path) ??
    // Detail pages such as /doanh-nghiep/[tên chương trình]: match on the part before "["
    cards.find((c) => {
      const i = c.path.indexOf('[')
      return i > 1 && path.startsWith(c.path.slice(0, i)) && path.length > i
    })
  return card?.links[0] ?? null
}

function menuNode(
  item: RawMenuItem,
  pagesBySlug: Map<string, PageRow>,
  cards: SiteMapCard[],
): SiteMapMenuNode {
  let path: string | null = null
  let external = false
  if (item.linkType === 'page' && item.page && typeof item.page === 'object') {
    path = pagePath(item.page.slug || '')
  } else if (item.linkType === 'url' && item.url) {
    external = !item.url.startsWith('/')
    path = external ? item.url : item.url.split(/[?#]/)[0] || '/'
  }
  return {
    label: item.label || '',
    path,
    external,
    edit: path && !external ? findEditForPath(path, pagesBySlug, cards) : null,
    groups: (item.children ?? []).map((group) => ({
      label: group.groupLabel || '',
      items: (group.items ?? []).map((child) => menuNode(child, pagesBySlug, cards)),
    })),
  }
}

/**
 * Everything the "Sơ đồ website" admin view shows. Reads with the signed-in user's access, and
 * only page titles / slugs, product ids and the menu – no customer data.
 */
export async function loadSiteMap(payload: Payload, user: User): Promise<SiteMapData> {
  const productSlugs = SITE_MAP_SECTIONS.flatMap((s) =>
    s.entries.flatMap((e) => e.edits.flatMap((t) => (t.type === 'product' ? [t.productSlug] : []))),
  )
  const [pages, productIds, navigation] = await Promise.all([
    loadPages(payload, user),
    loadProducts(payload, user, [...new Set(productSlugs)]),
    payload
      .findGlobal({ slug: 'navigation', depth: 1, user, overrideAccess: false })
      .catch(() => null),
  ])
  const pagesBySlug = new Map(pages.map((p) => [p.slug, p]))

  const staticGroups: SiteMapGroup[] = SITE_MAP_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    cards: section.entries.map((e) => entryCard(e, pagesBySlug, productIds)),
  }))
  const staticCards = staticGroups.flatMap((g) => g.cards)

  const nav = (navigation ?? {}) as { mainMenu?: RawMenuItem[]; footerMenu?: RawMenuItem[] }
  const menu = (nav.mainMenu ?? []).map((i) => menuNode(i, pagesBySlug, staticCards))
  const footerMenu = (nav.footerMenu ?? []).map((i) => menuNode(i, pagesBySlug, staticCards))

  const menuPaths = new Set<string>()
  const collect = (nodes: SiteMapMenuNode[]) =>
    nodes.forEach((n) => {
      if (n.path && !n.external) menuPaths.add(n.path)
      n.groups.forEach((g) => collect(g.items))
    })
  collect(menu)
  collect(footerMenu)

  const builderCards: SiteMapCard[] = pages
    .filter((p) => !OVERRIDE_PAGE_SLUGS.includes(p.slug))
    .sort((a, b) => {
      if (a.slug === '/') return -1
      if (b.slug === '/') return 1
      const am = menuPaths.has(pagePath(a.slug)) ? 0 : 1
      const bm = menuPaths.has(pagePath(b.slug)) ? 0 : 1
      return am - bm || a.title.localeCompare(b.title, 'vi')
    })
    .map((p) => {
      const path = pagePath(p.slug)
      const badges: SiteMapCard['badges'] = [
        p.published
          ? { label: 'Đã xuất bản', tone: 'ok' }
          : { label: 'Bản nháp – khách chưa thấy', tone: 'warn' },
      ]
      if (menuPaths.has(path)) badges.push({ label: 'Có trên menu', tone: 'info' })
      return {
        id: `page-${p.id}`,
        title: p.title || path,
        path,
        openHref: p.published ? path : null,
        kind: 'builder',
        summary:
          BUILDER_PAGE_NOTES[p.slug] ??
          'Trang dựng bằng builder: kéo thả khối, sửa chữ ngay trên trang.',
        links: [
          { label: 'Chỉnh trực quan', href: builderHref(p.id), tone: 'builder' },
          { label: 'Tên trang & SEO', href: pageFormHref(p.id), tone: 'form' },
        ],
        tips: [],
        guides: guideLinks([BUILDER_GUIDE]),
        badges,
      } satisfies SiteMapCard
    })

  return {
    menu,
    footerMenu,
    groups: [
      {
        id: 'builder',
        title: 'Trang dựng bằng builder (kéo thả)',
        description:
          'Bố cục và chữ sửa trực tiếp trên trang. Tạo trang mới: Trang nội dung → Tạo mới (hoặc ô "Thiết kế trang" trên trang chủ CMS).',
        cards: builderCards,
      },
      ...staticGroups,
    ],
  }
}
