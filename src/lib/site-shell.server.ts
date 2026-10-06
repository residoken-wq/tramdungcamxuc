import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Navigation, SiteSetting, LegalPage, Page } from '@/payload-types'
import { safeHref } from '@/lib/safe-href'
import { vi } from '@/lib/i18n/vi'
import type { NavItem, NavbarCta } from '@/components/site/Navbar'
import type { LegalLink, SellerInfo, SocialLink } from '@/components/site/Footer'

export interface SiteShellData {
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
}

function resolveMenuHref(item: {
  linkType: 'page' | 'url'
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

  return '/'
}

export function buildSiteShellFromPayloadData(args: {
  navigation?: Navigation | null
  siteSettings?: SiteSetting | null
  legalPages?: LegalPage[]
}): SiteShellData {
  const { navigation, siteSettings, legalPages = [] } = args

  // 1. Navbar Items & CTA mapping
  let cta: NavbarCta = { label: '', href: '' }
  const rawItems = navigation?.mainMenu || []

  // Tìm mục có highlight: true để làm CTA nổi bật bên phải Navbar
  let highlightIndex = -1
  for (let i = rawItems.length - 1; i >= 0; i--) {
    if (rawItems[i]?.highlight) {
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

  const items: NavItem[] = itemsToProcess.map((item) => {
    const href = resolveMenuHref(item)
    // Tự động nhận diện Quiz chẩn đoán (lead magnet chính) chỉ khi href === '/habit/chan-doan'
    const isQuiz = href === '/habit/chan-doan'

    return {
      label: item.label,
      href,
      ...(isQuiz ? { featured: true, shortLabel: vi.site.quizShortLabel } : {}),
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

  // 3. FloatingChat mapping
  const floatingChat = {
    showFloatingChat: Boolean(siteSettings?.showFloatingChat),
    zaloChatUrl: siteSettings?.zaloChatUrl?.trim() || null,
  }

  return {
    navbar: { items, cta },
    footer: {
      legalLinks,
      sellerInfo,
      socialLinks,
      tagline,
    },
    floatingChat,
  }
}

/**
 * Đọc dữ liệu khung site phía server (Navbar, Footer, FloatingChat).
 * Khi DB lỗi hoặc Payload ném lỗi -> trả về dữ liệu an toàn rỗng, không 500 trang.
 */
export async function getSiteShellData(): Promise<SiteShellData> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const [navigation, siteSettings, legalPagesResult] = await Promise.all([
      payload.findGlobal({ slug: 'navigation', depth: 1 }).catch(() => null),
      payload.findGlobal({ slug: 'siteSettings', depth: 0 }).catch(() => null),
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

    return buildSiteShellFromPayloadData({
      navigation: navigation as Navigation | null,
      siteSettings: siteSettings as SiteSetting | null,
      legalPages: (legalPagesResult?.docs || []) as LegalPage[],
    })
  } catch {
    // Lỗi DB -> trả giá trị an toàn rỗng, không gây lỗi 500 cho trang
    return DEFAULT_SITE_SHELL_DATA
  }
}

/**
 * Lấy nội dung chi tiết của một trang pháp lý theo slug (bọc cache React để tái dùng truy vấn trong cùng request).
 */
export const getLegalPageData = cache(
  async (
    slug: string,
  ): Promise<{
    page: LegalPage
    sellerInfo?: SellerInfo | null
  } | null> => {
    try {
      const payloadConfig = await config
      const payload = await getPayload({ config: payloadConfig })

      const result = await payload.find({
        collection: 'legalPages',
        where: {
          and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
        },
        limit: 1,
        draft: false,
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
