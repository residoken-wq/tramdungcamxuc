import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Data } from '@puckeditor/core'
import { toPublicProduct, type PublicProduct } from '@/lib/products'
import { toPublicTestimonial, type PublicTestimonial } from '@/lib/testimonials'
import { toPublicSiteSettings, type PublicSiteSettings } from '@/lib/site-public'

import { walkPuckItems } from './walk'

const PUBLIC_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  web: true,
  type: true,
  journeyStep: true,
  shortDescription: true,
  tagline: true,
  icon: true,
  includes: true,
  price: true,
  salePrice: true,
  saleEndsAt: true,
  saleStatus: true,
  trialDays: true,
  externalUrl: true,
  externalLabel: true,
  ctaLabel: true,
  components: true,
  coverImage: true,
} as const

const PUBLIC_TESTIMONIAL_SELECT = {
  id: true,
  name: true,
  role: true,
  quote: true,
  language: true,
  consent: true,
  photo: true,
} as const

export interface ResolveServerDataOptions {
  pageSlug?: string
  draft?: boolean
  previewId?: string | number
  user?: unknown
}

/**
 * Chuẩn hóa slug trang cho UTM campaign và nguồn lead:
 * - '/' hoặc rỗng -> 'trang-chu'
 * - Cắt bỏ dấu '/' ở đầu/cuối
 * - Thay thế '/' bên trong bằng '-' (ví dụ: 'coaching/thinking-mirror' -> 'coaching-thinking-mirror')
 */
export function normalizePageSlug(slug?: string): string {
  if (!slug) return 'trang-chu'
  const trimmed = slug.trim().replace(/^\/+|\/+$/g, '')
  if (!trimmed) return 'trang-chu'
  return trimmed.replace(/\//g, '-')
}

/**
 * Server-only helper to resolve server-side data (media URL/alt from Local API,
 * published products and consent-approved published testimonials by ID without storing in DB)
 * for Puck Data before passing to <Render>.
 * This ensures src/puck/config.tsx remains 100% pure isomorphic and prevents
 * Next.js server-only modules from leaking into client bundles.
 */
export async function resolveServerData(
  data: Data,
  options?: ResolveServerDataOptions,
): Promise<Data> {
  if (!data || !Array.isArray(data.content)) {
    return data
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Deep clone data to avoid mutating original
  const resolvedData: Data = JSON.parse(JSON.stringify(data))
  const normalizedSlug =
    options?.pageSlug !== undefined ? normalizePageSlug(options.pageSlug) : undefined

  // Phase 1: Collect media IDs, product IDs, testimonial IDs, and page IDs across all items (including nested inside Columns slots)
  const productIdsToFetch = new Set<string | number>()
  const testimonialIdsToFetch = new Set<string | number>()
  const logoMediaIdsToFetch = new Set<string | number>()
  const pageIdsToFetch = new Set<string | number>()
  let needsSiteSettings = false
  let hasSetHeroPriority = false

  await walkPuckItems(resolvedData, async (item) => {
    if (!item || !item.props) return

    // Priority flag for HeroImage & HeroTwoEntries (only first hero on page gets priority=true for LCP)
    if (item.type === 'HeroImage' || item.type === 'HeroTwoEntries') {
      if (!hasSetHeroPriority) {
        item.props.priority = true
        hasSetHeroPriority = true
      } else {
        item.props.priority = false
      }
    }

    // Media resolution for ImageText, HeroImage, HanaStory & HeroTwoEntries
    if (
      (item.type === 'ImageText' ||
        item.type === 'HeroImage' ||
        item.type === 'HanaStory' ||
        item.type === 'HeroTwoEntries') &&
      item.props.mediaId
    ) {
      try {
        const mediaDoc = await payload.findByID({
          collection: 'media',
          id: String(item.props.mediaId),
        })
        if (
          mediaDoc &&
          mediaDoc.alt &&
          typeof mediaDoc.alt === 'string' &&
          mediaDoc.alt.trim().length > 0
        ) {
          item.props.imageUrl = (mediaDoc.url as string) || ''
          item.props.imageAlt = mediaDoc.alt.trim()
        } else {
          item.props.imageUrl = (mediaDoc?.url as string) || ''
          item.props.imageAlt = ''
        }
      } catch {
        item.props.imageUrl = ''
        item.props.imageAlt = ''
      }
    }

    // Collect logo media IDs for LogoStrip
    if (item.type === 'LogoStrip' && Array.isArray(item.props.logos)) {
      for (const logo of item.props.logos) {
        if (logo?.mediaId) {
          logoMediaIdsToFetch.add(String(logo.mediaId))
        }
      }
    }

    // Collect testimonial IDs
    if (item.type === 'TestimonialGrid') {
      const mode = item.props.mode || 'manual'
      if (mode === 'manual') {
        const manuals = item.props.manualTestimonials as
          Array<{ testimonialId?: string | number }> | undefined
        if (Array.isArray(manuals)) {
          for (const m of manuals) {
            if (m?.testimonialId) testimonialIdsToFetch.add(m.testimonialId)
          }
        }
        const flatIds = item.props.testimonialIds as Array<string | number> | undefined
        if (Array.isArray(flatIds)) {
          for (const id of flatIds) {
            if (id) testimonialIdsToFetch.add(id)
          }
        }
      }
    } else if (item.type === 'TestimonialSlider') {
      const manuals = item.props.manualTestimonials as
        Array<{ testimonialId?: string | number }> | undefined
      if (Array.isArray(manuals)) {
        for (const m of manuals) {
          if (m?.testimonialId) testimonialIdsToFetch.add(m.testimonialId)
        }
      }
      const flatIds = item.props.testimonialIds as Array<string | number> | undefined
      if (Array.isArray(flatIds)) {
        for (const id of flatIds) {
          if (id) testimonialIdsToFetch.add(id)
        }
      }
    }

    // Collect product IDs
    if (item.type === 'ProductGrid') {
      const mode = item.props.mode || 'manual'
      if (mode === 'manual') {
        const manuals = item.props.manualProducts as
          Array<{ productId?: string | number }> | undefined
        if (Array.isArray(manuals)) {
          for (const m of manuals) {
            if (m?.productId) productIdsToFetch.add(m.productId)
          }
        }
        const flatIds = item.props.productIds as Array<string | number> | undefined
        if (Array.isArray(flatIds)) {
          for (const id of flatIds) {
            if (id) productIdsToFetch.add(id)
          }
        }
      }
    } else if (
      item.type === 'ProductFeature' ||
      item.type === 'PriceTag' ||
      item.type === 'TrialCTA'
    ) {
      if (item.props.productId) {
        productIdsToFetch.add(item.props.productId as string | number)
      }
    } else if (item.type === 'PackageComparison' || item.type === 'PackageCards') {
      const pkgs = item.props.packages as
        Array<{ packageId?: string | number; productId?: string | number }> | undefined
      if (Array.isArray(pkgs)) {
        for (const p of pkgs) {
          const id = p?.packageId || p?.productId
          if (id) productIdsToFetch.add(id)
        }
      }
      const flatIds = item.props.packageIds as Array<string | number> | undefined
      if (Array.isArray(flatIds)) {
        for (const id of flatIds) {
          if (id) productIdsToFetch.add(id)
        }
      }
    }

    // Collect page IDs for CTAButton, Callout & PackageCards (linkType = page)
    if (item.type === 'CTAButton' && item.props.linkType === 'page' && item.props.pageId) {
      pageIdsToFetch.add(item.props.pageId as string | number)
    }
    if (
      (item.type === 'Callout' || item.type === 'PackageCards') &&
      item.props.buttonLinkType === 'page' &&
      item.props.buttonPageId
    ) {
      pageIdsToFetch.add(item.props.buttonPageId as string | number)
    }

    // Collect product IDs for conversion blocks
    if (item.type === 'LeadForm' && item.props.resourceProductId) {
      productIdsToFetch.add(item.props.resourceProductId as string | number)
    } else if (item.type === 'BookingCTA' && item.props.productId) {
      productIdsToFetch.add(item.props.productId as string | number)
    } else if (
      item.type === 'ShopeeButton' &&
      item.props.mode !== 'store' &&
      item.props.productId
    ) {
      productIdsToFetch.add(item.props.productId as string | number)
    }

    if (item.type === 'ShopeeButton' || item.type === 'ZaloButton') {
      needsSiteSettings = true
    }
  })

  // Phase 2: Batch fetch products, testimonials, and logo media
  const productMap = new Map<string, PublicProduct>()

  if (productIdsToFetch.size > 0) {
    const rawIds = Array.from(productIdsToFetch)
    const numericOrStrIds = rawIds.map((id) => (isNaN(Number(id)) ? id : Number(id)))
    const isDraft = Boolean(options?.draft)

    try {
      const productDocs = await payload.find({
        collection: 'products',
        where: isDraft
          ? { id: { in: numericOrStrIds } }
          : {
              and: [{ id: { in: numericOrStrIds } }, { _status: { equals: 'published' } }],
            },
        select: PUBLIC_PRODUCT_SELECT as never,
        depth: 1,
        limit: numericOrStrIds.length + 20,
        draft: isDraft,
        // Draft preview: enforce the admin's access. Public read keeps the previous behaviour
        // (field access such as products.files is admin-only and must not blank the public page).
        ...(isDraft ? { overrideAccess: false, user: options?.user as never } : {}),
      })

      for (const doc of productDocs.docs as unknown as Array<{
        id: string | number
        saleStatus: string
      }>) {
        // Discard hidden products (spec requirement), trừ khi admin đang xem trước
        if (doc.saleStatus !== 'hidden' || isDraft) {
          productMap.set(String(doc.id), toPublicProduct(doc))
        }
      }
    } catch {
      // Gracefully continue if fetch fails
    }
  }

  const testimonialMap = new Map<string, PublicTestimonial>()

  if (testimonialIdsToFetch.size > 0) {
    const rawTids = Array.from(testimonialIdsToFetch)
    const numericOrStrTids = rawTids.map((id) => (isNaN(Number(id)) ? id : Number(id)))

    try {
      const testimonialDocs = await payload.find({
        collection: 'testimonials',
        where: {
          and: [
            { id: { in: numericOrStrTids } },
            { consent: { equals: true } },
            { _status: { equals: 'published' } },
          ],
        },
        select: PUBLIC_TESTIMONIAL_SELECT as never,
        depth: 1,
        limit: numericOrStrTids.length + 20,
      })

      for (const doc of testimonialDocs.docs) {
        const pub = toPublicTestimonial(doc)
        if (pub) {
          testimonialMap.set(String(pub.id), pub)
        }
      }
    } catch {
      // Gracefully continue if fetch fails
    }
  }

  const logoMediaMap = new Map<string, { url: string; alt: string }>()

  if (logoMediaIdsToFetch.size > 0) {
    for (const mid of logoMediaIdsToFetch) {
      try {
        const mediaDoc = await payload.findByID({
          collection: 'media',
          id: String(mid),
        })
        if (mediaDoc) {
          logoMediaMap.set(String(mid), {
            url: (mediaDoc.url as string) || '',
            alt: typeof mediaDoc.alt === 'string' ? mediaDoc.alt.trim() : '',
          })
        }
      } catch {
        // Gracefully continue
      }
    }
  }

  const pageMap = new Map<string, string>()

  if (pageIdsToFetch.size > 0) {
    const rawPids = Array.from(pageIdsToFetch)
    const numericOrStrPids = rawPids.map((id) => (isNaN(Number(id)) ? id : Number(id)))

    try {
      const pageDocs = await payload.find({
        collection: 'pages',
        where: { id: { in: numericOrStrPids } },
        depth: 0,
        limit: numericOrStrPids.length + 10,
      })

      for (const p of pageDocs.docs) {
        if (p?.id != null && typeof p.slug === 'string') {
          pageMap.set(String(p.id), p.slug)
        }
      }
    } catch {
      // Gracefully continue
    }
  }

  let publicSiteSettings: PublicSiteSettings = {
    shopeeStoreUrl: null,
    zaloChatUrl: null,
    zaloGroupUrl: null,
  }

  if (needsSiteSettings) {
    try {
      const siteDoc = await payload.findGlobal({
        slug: 'siteSettings',
        depth: 0,
      })
      publicSiteSettings = toPublicSiteSettings(siteDoc)
    } catch {
      // Gracefully continue
    }
  }

  // Phase 3: Attach _resolved to each block (including blocks inside Columns slots)
  await walkPuckItems(resolvedData, async (item) => {
    if (!item || !item.props) return

    if (item.type === 'ProductGrid') {
      const mode = item.props.mode || 'manual'
      if (mode === 'filter') {
        const filterWeb = item.props.filterWeb as string | undefined
        const filterType = item.props.filterType as string | undefined
        const limit = Number(item.props.limit) || 6

        try {
          const filterDocs = await payload.find({
            collection: 'products',
            where: {
              and: [
                { _status: { equals: 'published' } },
                ...(filterWeb && filterWeb !== 'all' ? [{ web: { equals: filterWeb } }] : []),
                ...(filterType && filterType !== 'all' ? [{ type: { equals: filterType } }] : []),
              ],
            },
            select: PUBLIC_PRODUCT_SELECT as never,
            depth: 1,
            limit,
            sort: 'order',
          })
          const publishedNonHidden = (filterDocs.docs as unknown[])
            .filter((p: unknown) => (p as { saleStatus?: string })?.saleStatus !== 'hidden')
            .map(toPublicProduct)
          item.props._resolved = { products: publishedNonHidden }
        } catch {
          item.props._resolved = { products: [] }
        }
      } else {
        const manuals = item.props.manualProducts as
          Array<{ productId?: string | number }> | undefined
        const flatIds = item.props.productIds as Array<string | number> | undefined
        const ids: Array<string | number> = []
        if (Array.isArray(manuals)) {
          for (const m of manuals) {
            if (m?.productId) ids.push(m.productId)
          }
        }
        if (Array.isArray(flatIds)) {
          for (const id of flatIds) {
            if (id) ids.push(id)
          }
        }
        const resolvedList = ids
          .map((id) => productMap.get(String(id)))
          .filter(Boolean) as PublicProduct[]
        item.props._resolved = { products: resolvedList }
      }
    } else if (
      item.type === 'ProductFeature' ||
      item.type === 'PriceTag' ||
      item.type === 'TrialCTA'
    ) {
      const prodId = item.props.productId ? String(item.props.productId) : ''
      const prod = prodId ? productMap.get(prodId) || null : null
      item.props._resolved = { product: prod }
    } else if (item.type === 'PackageComparison') {
      const pkgs = item.props.packages as
        Array<{ packageId?: string | number; productId?: string | number }> | undefined
      const flatIds = item.props.packageIds as Array<string | number> | undefined
      const ids: Array<string | number> = []
      if (Array.isArray(pkgs)) {
        for (const p of pkgs) {
          const id = p?.packageId || p?.productId
          if (id) ids.push(id)
        }
      }
      if (Array.isArray(flatIds)) {
        for (const id of flatIds) {
          if (id) ids.push(id)
        }
      }
      const resolvedList = ids
        .map((id) => productMap.get(String(id)))
        .filter(Boolean) as PublicProduct[]
      item.props._resolved = { packages: resolvedList }
    } else if (item.type === 'PackageCards') {
      const pkgs = item.props.packages as
        Array<{ packageId?: string | number; productId?: string | number }> | undefined
      const flatIds = item.props.packageIds as Array<string | number> | undefined
      const ids: Array<string | number> = []
      if (Array.isArray(pkgs)) {
        for (const p of pkgs) {
          const id = p?.packageId || p?.productId
          if (id) ids.push(id)
        }
      }
      if (Array.isArray(flatIds)) {
        for (const id of flatIds) {
          if (id) ids.push(id)
        }
      }
      const resolvedList = ids
        .map((id) => productMap.get(String(id)))
        .filter(Boolean) as PublicProduct[]

      let resolvedButtonUrl: string | null = null
      if (item.props.buttonLinkType === 'page') {
        const pId = item.props.buttonPageId ? String(item.props.buttonPageId) : ''
        const slug = pId ? pageMap.get(pId) : null
        resolvedButtonUrl = slug ? (slug === 'trang-chu' ? '/' : `/${slug}`) : null
      } else if (item.props.buttonLinkType === 'url') {
        resolvedButtonUrl = item.props.buttonUrl || item.props.buttonLink || null
      } else {
        resolvedButtonUrl = item.props.buttonLink || null
      }

      item.props._resolved = {
        packages: resolvedList,
        buttonUrl: resolvedButtonUrl,
      }
    } else if (item.type === 'TestimonialGrid') {
      const mode = item.props.mode || 'manual'
      if (mode === 'recent') {
        const limit = Number(item.props.limit) || 6
        try {
          const recentDocs = await payload.find({
            collection: 'testimonials',
            where: {
              and: [{ consent: { equals: true } }, { _status: { equals: 'published' } }],
            },
            select: PUBLIC_TESTIMONIAL_SELECT as never,
            depth: 1,
            limit,
            sort: '-createdAt',
          })
          const resolvedRecent = (recentDocs.docs as unknown[])
            .map(toPublicTestimonial)
            .filter((t): t is PublicTestimonial => t !== null)
          item.props._resolved = { testimonials: resolvedRecent }
        } catch {
          item.props._resolved = { testimonials: [] }
        }
      } else {
        const manuals = item.props.manualTestimonials as
          Array<{ testimonialId?: string | number }> | undefined
        const flatIds = item.props.testimonialIds as Array<string | number> | undefined
        const ids: Array<string | number> = []
        if (Array.isArray(manuals)) {
          for (const m of manuals) {
            if (m?.testimonialId) ids.push(m.testimonialId)
          }
        }
        if (Array.isArray(flatIds)) {
          for (const id of flatIds) {
            if (id) ids.push(id)
          }
        }
        const resolvedList = ids
          .map((id) => testimonialMap.get(String(id)))
          .filter(Boolean) as PublicTestimonial[]
        item.props._resolved = { testimonials: resolvedList }
      }
    } else if (item.type === 'TestimonialSlider') {
      const manuals = item.props.manualTestimonials as
        Array<{ testimonialId?: string | number }> | undefined
      const flatIds = item.props.testimonialIds as Array<string | number> | undefined
      const ids: Array<string | number> = []
      if (Array.isArray(manuals)) {
        for (const m of manuals) {
          if (m?.testimonialId) ids.push(m.testimonialId)
        }
      }
      if (Array.isArray(flatIds)) {
        for (const id of flatIds) {
          if (id) ids.push(id)
        }
      }
      const resolvedList = ids
        .map((id) => testimonialMap.get(String(id)))
        .filter(Boolean) as PublicTestimonial[]
      item.props._resolved = { testimonials: resolvedList }
    } else if (item.type === 'LogoStrip') {
      const logos = item.props.logos as
        | Array<{ mediaId?: string | number; alt?: string; link?: string; imageUrl?: string }>
        | undefined
      if (Array.isArray(logos)) {
        const resolvedLogos = logos.map((l) => {
          const mid = l?.mediaId ? String(l.mediaId) : ''
          const found = mid ? logoMediaMap.get(mid) : undefined
          return {
            ...l,
            imageUrl: found?.url || l.imageUrl || '',
            alt: l.alt || found?.alt || '',
          }
        })
        item.props._resolved = { logos: resolvedLogos }
      }
    } else if (item.type === 'CTAButton') {
      const pId = item.props.pageId ? String(item.props.pageId) : ''
      item.props._resolved = { pageSlug: pId ? pageMap.get(pId) || null : null }
    } else if (item.type === 'Callout') {
      const pId = item.props.buttonPageId ? String(item.props.buttonPageId) : ''
      item.props._resolved = { pageSlug: pId ? pageMap.get(pId) || null : null }
    } else if (item.type === 'LeadForm') {
      const rId = item.props.resourceProductId ? String(item.props.resourceProductId) : ''
      const rProd = rId ? productMap.get(rId) : null
      item.props._resolved = {
        resource: rProd ? { id: rProd.id, name: rProd.name, slug: rProd.slug } : null,
      }
    } else if (item.type === 'BookingCTA') {
      const bId = item.props.productId ? String(item.props.productId) : ''
      const bProd = bId ? productMap.get(bId) || null : null
      item.props._resolved = { product: bProd }
    } else if (item.type === 'ShopeeButton') {
      const pId = item.props.productId ? String(item.props.productId) : ''
      const sProd = pId ? productMap.get(pId) : null
      item.props._resolved = {
        externalUrl: sProd?.externalUrl || null,
        shopeeStoreUrl: publicSiteSettings.shopeeStoreUrl,
      }
    } else if (item.type === 'ZaloButton') {
      item.props._resolved = {
        zaloChatUrl: publicSiteSettings.zaloChatUrl,
        zaloGroupUrl: publicSiteSettings.zaloGroupUrl,
      }
    } else if (item.type === 'LibraryPreview') {
      const tab = item.props.tab || 'khoa-hoc'
      const limit = Number(item.props.limit) || 3
      if (tab === 'noi-dung') {
        try {
          const postsResult = await payload.find({
            collection: 'posts',
            where: { _status: { equals: 'published' } },
            sort: '-createdAt',
            depth: 1,
            limit,
          })
          const items = postsResult.docs.map((p) => {
            const thumb =
              p.thumbnail && typeof p.thumbnail === 'object' && 'url' in p.thumbnail
                ? {
                    src: (p.thumbnail as { url?: string }).url || null,
                    alt: (p.thumbnail as { alt?: string }).alt || p.title,
                  }
                : null
            return {
              id: p.id,
              title: p.title,
              slug: p.slug,
              format: p.format,
              series: p.series,
              topic: p.topic,
              thumbnail: thumb,
              isPost: true as const,
            }
          })
          item.props._resolved = { items }
        } catch {
          item.props._resolved = { items: [] }
        }
      } else {
        try {
          const prodsResult = await payload.find({
            collection: 'products',
            where: {
              and: [
                { _status: { equals: 'published' } },
                { saleStatus: { not_equals: 'hidden' } },
                { type: { in: ['digital_tool', 'package'] } },
              ],
            },
            select: PUBLIC_PRODUCT_SELECT as never,
            sort: 'order',
            depth: 1,
            limit,
          })
          const items = prodsResult.docs
            .filter((p: unknown) => (p as { saleStatus?: string })?.saleStatus !== 'hidden')
            .map(toPublicProduct)
          item.props._resolved = { items }
        } catch {
          item.props._resolved = { items: [] }
        }
      }
    }

    // Gắn slug trang đã chuẩn hóa vào props của các khối chuyển đổi (khóa tạm, không lưu DB)
    if (normalizedSlug) {
      if (
        item.type === 'ShopeeButton' ||
        item.type === 'B2BBriefForm' ||
        item.type === 'LeadForm' ||
        item.type === 'BookingCTA'
      ) {
        item.props.pageSlug = normalizedSlug
      }
    }
  })

  return resolvedData
}
