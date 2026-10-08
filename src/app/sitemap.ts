import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'

import { getSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export const STATIC_SITEMAP_ROUTES = [
  '/',
  '/thu-vien',
  '/chinh-sach-bao-mat',
  '/chinh-sach-cung-cap-dich-vu',
  '/dieu-khoan-su-dung',
  '/gia-thanh-toan',
  '/phan-anh-khieu-nai',
  '/thong-tin-phap-ly',
] as const

export const EXCLUDED_SITEMAP_PREFIXES = [
  '/admin',
  '/builder',
  '/api',
  '/styleguide',
  '/tai-khoan',
] as const

export function isExcludedFromSitemap(pathname: string): boolean {
  const normalized = pathname.trim() || '/'
  return EXCLUDED_SITEMAP_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}

export function getBaseSiteUrl(): string {
  return getSiteUrl()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.SITE_NOINDEX === 'true') {
    return []
  }

  const baseUrl = getBaseSiteUrl()
  const entries: Map<string, MetadataRoute.Sitemap[number]> = new Map()

  // 1. Static pages (Home, Library, 6 Legal pages)
  for (const route of STATIC_SITEMAP_ROUTES) {
    if (!isExcludedFromSitemap(route)) {
      const url = route === '/' ? baseUrl : `${baseUrl}${route}`
      entries.set(url, {
        url,
        lastModified: new Date(),
        changeFrequency: route === '/' ? 'daily' : 'weekly',
        priority: route === '/' ? 1.0 : 0.8,
      })
    }
  }

  // 2. Dynamic content from Payload CMS
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const [pagesResult, servicesResult, programsResult, postsResult, freeProductsResult] =
      await Promise.all([
        payload
          .find({
            collection: 'pages',
            where: { _status: { equals: 'published' } },
            limit: 500,
            draft: false,
          })
          .catch(() => ({ docs: [] })),
        payload
          .find({
            collection: 'services',
            where: {
              and: [{ _status: { equals: 'published' } }, { saleStatus: { not_equals: 'hidden' } }],
            },
            limit: 500,
            draft: false,
          })
          .catch(() => ({ docs: [] })),
        payload
          .find({
            collection: 'programs',
            where: {
              and: [{ _status: { equals: 'published' } }, { saleStatus: { not_equals: 'hidden' } }],
            },
            limit: 500,
            draft: false,
          })
          .catch(() => ({ docs: [] })),
        payload
          .find({
            collection: 'posts',
            where: { _status: { equals: 'published' } },
            limit: 500,
            draft: false,
          })
          .catch(() => ({ docs: [] })),
        payload
          .find({
            collection: 'products',
            where: {
              and: [{ _status: { equals: 'published' } }, { saleStatus: { equals: 'free' } }],
            },
            limit: 500,
            draft: false,
          })
          .catch(() => ({ docs: [] })),
      ])

    // Published Puck Pages
    for (const doc of pagesResult.docs) {
      if (!doc?.slug) continue
      const normalizedSlug =
        doc.slug === '/' ? '/' : `/${String(doc.slug).replace(/^\/+|\/+$/g, '')}`
      if (isExcludedFromSitemap(normalizedSlug)) continue

      const url = normalizedSlug === '/' ? baseUrl : `${baseUrl}${normalizedSlug}`
      if (!entries.has(url)) {
        entries.set(url, {
          url,
          lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }

    // Published Services (Coaching)
    for (const doc of servicesResult.docs) {
      if (!doc?.slug) continue
      const path = `/coaching/${String(doc.slug).replace(/^\/+/, '')}`
      if (isExcludedFromSitemap(path)) continue
      const url = `${baseUrl}${path}`
      entries.set(url, {
        url,
        lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }

    // Published Programs (Doanh nghiệp)
    for (const doc of programsResult.docs) {
      if (!doc?.slug) continue
      const path = `/doanh-nghiep/${String(doc.slug).replace(/^\/+/, '')}`
      if (isExcludedFromSitemap(path)) continue
      const url = `${baseUrl}${path}`
      entries.set(url, {
        url,
        lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }

    // Published Posts (Blog)
    for (const doc of postsResult.docs) {
      if (!doc?.slug) continue
      const path = `/blog/${String(doc.slug).replace(/^\/+/, '')}`
      if (isExcludedFromSitemap(path)) continue
      const url = `${baseUrl}${path}`
      entries.set(url, {
        url,
        lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }

    // Published Free Products (Tài nguyên)
    for (const doc of freeProductsResult.docs) {
      if (!doc?.slug) continue
      const path = `/tai-nguyen/${String(doc.slug).replace(/^\/+/, '')}`
      if (isExcludedFromSitemap(path)) continue
      const url = `${baseUrl}${path}`
      entries.set(url, {
        url,
        lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  } catch {
    // If database connection fails, return the static entries collected so far
  }

  return Array.from(entries.values())
}
