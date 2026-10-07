import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Data } from '@puckeditor/core'
import { toPublicProduct, type PublicProduct } from '@/lib/products'
import { toPublicTestimonial, type PublicTestimonial } from '@/lib/testimonials'

import { walkPuckItems } from './walk'

const PUBLIC_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  web: true,
  type: true,
  journeyStep: true,
  shortDescription: true,
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

/**
 * Server-only helper to resolve server-side data (media URL/alt from Local API,
 * published products and consent-approved published testimonials by ID without storing in DB)
 * for Puck Data before passing to <Render>.
 * This ensures src/puck/config.tsx remains 100% pure isomorphic and prevents
 * Next.js server-only modules from leaking into client bundles.
 */
export async function resolveServerData(data: Data): Promise<Data> {
  if (!data || !Array.isArray(data.content)) {
    return data
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Deep clone data to avoid mutating original
  const resolvedData: Data = JSON.parse(JSON.stringify(data))

  // Phase 1: Collect media IDs, product IDs, and testimonial IDs across all items (including nested inside Columns slots)
  const productIdsToFetch = new Set<string | number>()
  const testimonialIdsToFetch = new Set<string | number>()
  const logoMediaIdsToFetch = new Set<string | number>()

  await walkPuckItems(resolvedData, async (item) => {
    if (!item || !item.props) return

    // Media resolution for ImageText, HeroImage, & HanaStory
    if (
      (item.type === 'ImageText' || item.type === 'HeroImage' || item.type === 'HanaStory') &&
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
    } else if (item.type === 'PackageComparison') {
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
  })

  // Phase 2: Batch fetch products, testimonials, and logo media
  const productMap = new Map<string, PublicProduct>()

  if (productIdsToFetch.size > 0) {
    const rawIds = Array.from(productIdsToFetch)
    const numericOrStrIds = rawIds.map((id) => (isNaN(Number(id)) ? id : Number(id)))

    try {
      const productDocs = await payload.find({
        collection: 'products',
        where: {
          and: [{ id: { in: numericOrStrIds } }, { _status: { equals: 'published' } }],
        },
        select: PUBLIC_PRODUCT_SELECT as never,
        depth: 1,
        limit: numericOrStrIds.length + 20,
      })

      for (const doc of productDocs.docs as unknown as Array<{
        id: string | number
        saleStatus: string
      }>) {
        // Discard hidden products (spec requirement)
        if (doc.saleStatus !== 'hidden') {
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
    }
  })

  return resolvedData
}
