import 'server-only'
import { cache } from 'react'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'
import type { Navigation, SiteSetting, LegalPage, Page } from '@/payload-types'
import { safeHref } from '@/lib/safe-href'
import { vi } from '@/lib/i18n/vi'
import type { NavGroup, NavItem, NavbarCta } from '@/components/site/Navbar'
import { PATHS } from '@/lib/paths'
import type { LegalLink, SellerInfo, SocialLink } from '@/components/site/Footer'
import type { SiteLogo } from '@/components/brand/Logo'
import type { Data } from '@puckeditor/core'
import { walkPuckItems } from '@/puck/walk'
import { resolveServerData } from '@/puck/resolve.server'

export interface FloatingCoffeeData {
  qrSrc: string
  qrAlt: string
  qrWidth?: number
  qrHeight?: number
  title?: string | null
  message?: string | null
  momoUrl?: string | null
}

export interface SiteShellData {
  logo?: SiteLogo
  navbar: {
    items: NavItem[]
    cta: NavbarCta
  }
  footer: {
    legalLinks: LegalLink[]
    sellerInfo?: SellerInfo
    socialLinks?: SocialLink[]
    tagline?: string
  }
  floatingChat: {
    showFloatingChat: boolean
    zaloChatUrl?: string | null
  }
  floatingCoffee: FloatingCoffeeData | null
  headerSource: 'code' | 'builder'
  headerData: Data | null
  headerSticky?: boolean
  footerSource: 'code' | 'builder'
  footerData: Data | null
  footerHasLegal: boolean
}

export const DEFAULT_SITE_SHELL_DATA: SiteShellData = {
  navbar: {
    items: [],
    cta: { label: '', href: '' },
  },
  footer: {
    legalLinks: [],
    sellerInfo: undefined,
    socialLinks: [],
    tagline: undefined,
  },
  floatingChat: {
    showFloatingChat: false,
    zaloChatUrl: null,
  },
  floatingCoffee: null,
  headerSource: 'code',
  headerData: null,
  headerSticky: false,
  footerSource: 'code',
  footerData: null,
  footerHasLegal: false,
}

function resolveMenuHref(item: {
  linkType: 'page' | 'url' | 'none'
  page?: (number | null) | Page
  url?: string | null
}): string {
  if (item.linkType === 'page') {
    if (
      item.page &&
      typeof item.page === 'object' &&
      'slug' in item.page &&
      typeof item.page.slug === 'string'
    ) {
      const slug = item.page.slug.trim()
      if (slug === '/' || slug === '') return '/'
      return slug.startsWith('/') ? slug : `/${slug}`
    }
    return '/'
  }

  if (item.linkType === 'url') {
    const raw = item.url?.trim() || '/'
    return safeHref(raw) || '/'
  }

  // `none`: a parent that only opens its submenu has no link of its own.
  if (item.linkType === 'none') return ''

  return '/'
}

type RawMenuItem = NonNullable<Navigation['mainMenu']>[number]

function mapSubmenu(item: RawMenuItem): NavGroup[] | undefined {
  const groups = (item.children ?? [])
    .map((group) => ({
      label: group.groupLabel?.trim() || undefined,
      items: (group.items ?? []).map((child) => ({
        label: child.label,
        href: resolveMenuHref(child),
        description: child.description?.trim() || undefined,
      })),
    }))
    .filter((group) => group.items.length > 0)
  return groups.length > 0 ? groups : undefined
}

export function buildSiteShellFromPayloadData(args: {
  navigation?: Navigation | null
  siteSettings?: SiteSetting | null
  legalPages?: LegalPage[]
  headerSource?: 'code' | 'builder'
  headerData?: Data | null
  headerSticky?: boolean
  footerSource?: 'code' | 'builder'
  footerData?: Data | null
  footerHasLegal?: boolean
}): SiteShellData {
  const {
    navigation,
    siteSettings,
    legalPages = [],
    headerSource = 'code',
    headerData = null,
    headerSticky = false,
    footerSource = 'code',
    footerData = null,
    footerHasLegal = false,
  } = args

  // 1. Navbar Items & CTA mapping
  let cta: NavbarCta = { label: '', href: '' }
  const rawItems = navigation?.mainMenu || []

  // Tìm mục có highlight: true để làm CTA nổi bật bên phải Navbar
  let highlightIndex = -1
  for (let i = rawItems.length - 1; i >= 0; i--) {
    // A "submenu only" parent cannot be the CTA button: it has no destination.
    if (rawItems[i]?.highlight && rawItems[i]?.linkType !== 'none') {
      highlightIndex = i
      break
    }
  }
  let itemsToProcess = rawItems

  if (highlightIndex !== -1) {
    const highlightItem = rawItems[highlightIndex]
    const href = resolveMenuHref(highlightItem)
    cta = { label: highlightItem.label, href }
    // Loại mục CTA khỏi thanh link để tránh trùng lặp
    itemsToProcess = rawItems.filter((_, idx) => idx !== highlightIndex)
  }

  // Tự động nhận diện Quiz chẩn đoán (lead magnet chính) khi đích là /habit/chan-doan – ở menu
  // chính hoặc trong menu con (sitemap v2 đặt quiz đầu menu con "Tài nguyên").
  const quizMark = (href: string) =>
    href === PATHS.quiz ? { featured: true, shortLabel: vi.site.quizShortLabel } : {}

  const items: NavItem[] = itemsToProcess.map((item) => {
    const href = resolveMenuHref(item)
    const groups = mapSubmenu(item)
    return {
      label: item.label,
      href,
      ...quizMark(href),
      ...(groups
        ? {
            groups: groups.map((group) => ({
              ...group,
              items: group.items.map((child) => ({ ...child, ...quizMark(child.href) })),
            })),
          }
        : {}),
    }
  })

  // 2. Footer mapping
  const legalLinks: LegalLink[] = legalPages.map((doc) => ({
    title: doc.title,
    slug: doc.slug.startsWith('/') ? doc.slug : `/${doc.slug}`,
    order: doc.order ?? undefined,
  }))

  const s = siteSettings?.sellerInfo
  const sellerInfo: SellerInfo | undefined =
    s &&
    (s.name?.trim() || s.taxCode?.trim() || s.address?.trim() || s.phone?.trim() || s.email?.trim())
      ? {
          name: s.name?.trim() || undefined,
          taxCode: s.taxCode?.trim() || undefined,
          address: s.address?.trim() || undefined,
          phone: s.phone?.trim() || undefined,
          email: s.email?.trim() || undefined,
        }
      : undefined

  const socialLinks: SocialLink[] = []
  if (siteSettings?.linkedInUrl?.trim()) {
    socialLinks.push({ label: 'LinkedIn', href: siteSettings.linkedInUrl.trim() })
  }
  if (siteSettings?.zaloGroupUrl?.trim()) {
    socialLinks.push({ label: 'Zalo Group', href: siteSettings.zaloGroupUrl.trim() })
  }
  if (siteSettings?.shopeeStoreUrl?.trim()) {
    socialLinks.push({ label: 'Shopee', href: siteSettings.shopeeStoreUrl.trim() })
  }

  const tagline = siteSettings?.tagline?.trim() || undefined

  // Logo: needs siteSettings read with depth >= 1 so the upload is populated.
  const logoDoc = siteSettings?.logo
  const logo: SiteLogo | undefined =
    logoDoc && typeof logoDoc === 'object' && typeof logoDoc.url === 'string' && logoDoc.url
      ? { src: logoDoc.url, alt: logoDoc.alt?.trim() || 'Trạm Dừng Cảm Xúc' }
      : undefined

  // 3. FloatingChat mapping
  const floatingChat = {
    showFloatingChat: Boolean(siteSettings?.showFloatingChat),
    zaloChatUrl: siteSettings?.zaloChatUrl?.trim() || null,
  }

  // 4. FloatingCoffee mapping
  let floatingCoffee: FloatingCoffeeData | null = null
  const coffee = siteSettings?.coffeeDonation
  if (coffee?.enabled) {
    const qrDoc = coffee.qrImage
    if (qrDoc && typeof qrDoc === 'object' && typeof qrDoc.url === 'string' && qrDoc.url) {
      const rawMomo = coffee.momoUrl?.trim()
      const safeMomo = rawMomo ? safeHref(rawMomo) : null
      floatingCoffee = {
        qrSrc: qrDoc.url,
        qrAlt: qrDoc.alt?.trim() || '',
        qrWidth: typeof qrDoc.width === 'number' ? qrDoc.width : undefined,
        qrHeight: typeof qrDoc.height === 'number' ? qrDoc.height : undefined,
        title: coffee.title?.trim() || null,
        message: coffee.message?.trim() || null,
        momoUrl: safeMomo && safeMomo.startsWith('https://') ? safeMomo : null,
      }
    }
  }

  return {
    logo,
    navbar: { items, cta },
    footer: {
      legalLinks,
      sellerInfo,
      socialLinks,
      tagline,
    },
    floatingChat,
    floatingCoffee,
    headerSource,
    headerData,
    headerSticky,
    footerSource,
    footerData,
    footerHasLegal,
  }
}

/**
 * Đọc dữ liệu khung site phía server (Navbar, Footer, FloatingChat).
 * Khi DB lỗi hoặc Payload ném lỗi -> trả về dữ liệu an toàn rỗng, không 500 trang.
 * Đã bọc React cache() để dùng lại trong cùng request giữa layout và metadata.
 */
export const getSiteShellData = cache(async (): Promise<SiteShellData> => {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const [navigation, siteSettings, legalPagesResult] = await Promise.all([
      payload.findGlobal({ slug: 'navigation', depth: 1 }).catch(() => null),
      payload.findGlobal({ slug: 'siteSettings', depth: 1 }).catch(() => null),
      payload
        .find({
          collection: 'legalPages',
          where: {
            _status: { equals: 'published' },
          },
          sort: 'order',
          limit: 100,
          draft: false,
        })
        .catch(() => ({ docs: [] })),
    ])

    const nav = navigation as
      | (Navigation & {
          headerSource?: 'code' | 'builder'
          headerPage?: (number | string | null) | Page
          footerSource?: 'code' | 'builder'
          footerPage?: (number | string | null) | Page
        })
      | null

    // Check themeBuilder header
    let headerSource: 'code' | 'builder' = 'code'
    let headerData: Data | null = null
    let headerSticky = false

    if (nav?.headerSource === 'builder' && nav.headerPage) {
      try {
        const headerPageId =
          typeof nav.headerPage === 'object' && nav.headerPage !== null && 'id' in nav.headerPage
            ? nav.headerPage.id
            : nav.headerPage

        const headerPageDoc = await payload.findByID({
          collection: 'pages',
          id: String(headerPageId),
          draft: false,
        })

        if (
          headerPageDoc &&
          headerPageDoc._status === 'published' &&
          headerPageDoc.kind === 'header' &&
          headerPageDoc.puckData &&
          typeof headerPageDoc.puckData === 'object'
        ) {
          const resolvedHeader = await resolveServerData(headerPageDoc.puckData as Data, {
            pageSlug: headerPageDoc.slug ?? undefined,
          })
          headerSource = 'builder'
          headerData = resolvedHeader
          headerSticky =
            (headerPageDoc.puckData as { root?: { props?: { sticky?: string } } })?.root?.props
              ?.sticky === 'sticky'
        } else {
          console.warn(
            '[SiteShell] Header builder page is missing, not published, or invalid. Falling back to code Navbar.',
          )
        }
      } catch (err) {
        console.error(
          '[SiteShell] Error loading header builder page, falling back to code Navbar:',
          err,
        )
      }
    }

    // Check themeBuilder footer
    let footerSource: 'code' | 'builder' = 'code'
    let footerData: Data | null = null
    let footerHasLegal = false

    if (nav?.footerSource === 'builder' && nav.footerPage) {
      try {
        const footerPageId =
          typeof nav.footerPage === 'object' && nav.footerPage !== null && 'id' in nav.footerPage
            ? nav.footerPage.id
            : nav.footerPage

        const footerPageDoc = await payload.findByID({
          collection: 'pages',
          id: String(footerPageId),
          draft: false,
        })

        if (
          footerPageDoc &&
          footerPageDoc._status === 'published' &&
          footerPageDoc.kind === 'footer' &&
          footerPageDoc.puckData &&
          typeof footerPageDoc.puckData === 'object'
        ) {
          const resolvedFooter = await resolveServerData(footerPageDoc.puckData as Data, {
            pageSlug: footerPageDoc.slug ?? undefined,
          })
          footerSource = 'builder'
          footerData = resolvedFooter

          // Verify if footer has LegalFooter
          let hasLegal = false
          await walkPuckItems(resolvedFooter, (item) => {
            if (item.type === 'LegalFooter') hasLegal = true
          })
          footerHasLegal = hasLegal
        } else {
          console.warn(
            '[SiteShell] Footer builder page is missing, not published, or invalid. Falling back to code Footer.',
          )
        }
      } catch (err) {
        console.error(
          '[SiteShell] Error loading footer builder page, falling back to code Footer:',
          err,
        )
      }
    }

    return buildSiteShellFromPayloadData({
      navigation: nav,
      siteSettings: siteSettings as SiteSetting | null,
      legalPages: (legalPagesResult?.docs || []) as LegalPage[],
      headerSource,
      headerData,
      headerSticky,
      footerSource,
      footerData,
      footerHasLegal,
    })
  } catch {
    // Lỗi DB -> trả giá trị an toàn rỗng, không gây lỗi 500 cho trang
    return DEFAULT_SITE_SHELL_DATA
  }
})

/**
 * Lấy nội dung chi tiết của một trang pháp lý theo slug (bọc cache React để tái dùng truy vấn trong cùng request).
 */
export const getLegalPageData = cache(
  async (
    slug: string,
    options?: { draft?: boolean; previewId?: string | number; user?: unknown },
  ): Promise<{
    page: LegalPage
    sellerInfo?: SellerInfo | null
  } | null> => {
    try {
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })
      const isDraft = Boolean(options?.draft)

      const whereConditions = isDraft
        ? options?.previewId
          ? { id: { equals: options.previewId } }
          : { slug: { equals: slug } }
        : {
            and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
          }

      const result = await payload.find({
        collection: 'legalPages',
        where: whereConditions as unknown as Where,
        limit: 1,
        draft: isDraft,
        // Draft preview: enforce the admin's access. Public read keeps the previous behaviour
        // (field access such as products.files is admin-only and must not blank the public page).
        ...(isDraft ? { overrideAccess: false, user: options?.user as never } : {}),
      })

      const page = result.docs[0] as LegalPage | undefined
      if (!page) return null

      let sellerInfo: SellerInfo | null = null
      if (slug === 'thong-tin-phap-ly') {
        const settings = (await payload
          .findGlobal({ slug: 'siteSettings', depth: 0 })
          .catch(() => null)) as SiteSetting | null

        if (settings?.sellerInfo) {
          const s = settings.sellerInfo
          if (
            s.name?.trim() ||
            s.taxCode?.trim() ||
            s.address?.trim() ||
            s.phone?.trim() ||
            s.email?.trim()
          ) {
            sellerInfo = {
              name: s.name?.trim() || undefined,
              taxCode: s.taxCode?.trim() || undefined,
              address: s.address?.trim() || undefined,
              phone: s.phone?.trim() || undefined,
              email: s.email?.trim() || undefined,
            }
          }
        }
      }

      return { page, sellerInfo }
    } catch {
      return null
    }
  },
)

/**
 * Metadata cho trang pháp lý từ CMS.
 */
export async function getLegalPageMetadata(slug: string) {
  const data = await getLegalPageData(slug)
  if (!data?.page) {
    return {
      title: 'Trang không tồn tại',
    }
  }

  return {
    title: data.page.title,
  }
}
