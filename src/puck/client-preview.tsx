'use client'

import { useEffect, useState } from 'react'
import { toPublicProduct, type PublicProduct } from '@/lib/products'
import { toPublicTestimonial, type PublicTestimonial } from '@/lib/testimonials'
import { toPublicSiteSettings, type PublicSiteSettings } from '@/lib/site-public'

// In-memory client caches (persists across renders in the browser / test environment)
const singleProductCache = new Map<string, PublicProduct | null>()
const multiProductsCache = new Map<string, PublicProduct[]>()
const inFlightSingleProduct = new Map<string, Promise<PublicProduct | null>>()
const inFlightMultiProducts = new Map<string, Promise<PublicProduct[]>>()

const singleTestimonialCache = new Map<string, PublicTestimonial | null>()
const multiTestimonialsCache = new Map<string, PublicTestimonial[]>()
const inFlightSingleTestimonial = new Map<string, Promise<PublicTestimonial | null>>()
const inFlightMultiTestimonials = new Map<string, Promise<PublicTestimonial[]>>()

const pageSlugCache = new Map<string, string | null>()
const inFlightPageSlug = new Map<string, Promise<string | null>>()

let siteSettingsCache: PublicSiteSettings | null = null
let inFlightSiteSettings: Promise<PublicSiteSettings> | null = null

export interface PublicServiceSummary {
  id: string | number
  name: string
  slug: string
  badge?: string | null
  imageUrl?: string | null
  imageAlt?: string | null
  audience?: string | null
  audienceLabel?: string | null
  situations?: string[] | null
  outcomes?: string[] | null
  ctaLabel?: string | null
  saleStatus?: string | null
}

export interface PublicProgramSummary {
  id: string | number
  name: string
  slug: string
  learnerGroup?: string | null
  format?: string | null
  ctaLabel?: string | null
  saleStatus?: string | null
}

const multiServicesCache = new Map<string, PublicServiceSummary[]>()
const inFlightMultiServices = new Map<string, Promise<PublicServiceSummary[]>>()

const multiProgramsCache = new Map<string, PublicProgramSummary[]>()
const inFlightMultiPrograms = new Map<string, Promise<PublicProgramSummary[]>>()

/**
 * Xóa cache client preview (dùng cho unit test hoặc reset khi cần)
 */
export function clearClientPreviewCache() {
  singleProductCache.clear()
  multiProductsCache.clear()
  inFlightSingleProduct.clear()
  inFlightMultiProducts.clear()

  singleTestimonialCache.clear()
  multiTestimonialsCache.clear()
  inFlightSingleTestimonial.clear()
  inFlightMultiTestimonials.clear()

  multiServicesCache.clear()
  inFlightMultiServices.clear()

  multiProgramsCache.clear()
  inFlightMultiPrograms.clear()

  pageSlugCache.clear()
  inFlightPageSlug.clear()

  siteSettingsCache = null
  inFlightSiteSettings = null

  teamMembersCache = null
  inFlightTeamMembers = null
}

/**
 * Xây dựng queryKey dạng chuỗi nguyên thủy từ các tham số truy vấn sản phẩm.
 * Chuỗi nguyên thủy này đảm bảo React useEffect so sánh bằng giá trị, tránh re-render lặp vô tận.
 */
export function buildProductsQueryKey(options: {
  productIds?: Array<string | number>
  mode?: 'manual' | 'filter'
  filterWeb?: string
  filterType?: string
  limit?: number
}): string {
  const mode = options.mode || 'manual'
  if (mode === 'manual') {
    const cleanIds = (options.productIds || [])
      .filter((id): id is string | number => id != null && String(id).trim() !== '')
      .map(String)
    return `manual:${cleanIds.join(',')}`
  }
  const fw = options.filterWeb || 'all'
  const ft = options.filterType || 'all'
  const lim = options.limit || 6
  return `filter:${fw}:${ft}:${lim}`
}

export function useClientProduct(
  productId: string | number | undefined | null,
  initialProduct?: PublicProduct | null,
): { product: PublicProduct | null; loading: boolean } {
  const isResolved = initialProduct !== undefined
  const pid = productId != null && String(productId).trim() !== '' ? String(productId).trim() : ''

  // Single product queryKey is primitive string pid
  const queryKey = pid

  // Check cache immediately for synchronous initial render
  const cached = queryKey ? singleProductCache.get(queryKey) : undefined

  const [state, setState] = useState<{ key: string; product: PublicProduct | null } | null>(() => {
    if (queryKey && singleProductCache.has(queryKey)) {
      return { key: queryKey, product: singleProductCache.get(queryKey) ?? null }
    }
    return null
  })

  useEffect(() => {
    if (isResolved || !queryKey) return

    // If already in cache, no need to fetch again
    if (singleProductCache.has(queryKey)) {
      return
    }

    let isMounted = true
    const controller = new AbortController()

    let promise = inFlightSingleProduct.get(queryKey)
    if (!promise) {
      promise = fetch(`/api/products/${encodeURIComponent(queryKey)}?depth=1`, {
        credentials: 'include',
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data || data.saleStatus === 'hidden') {
            singleProductCache.set(queryKey, null)
            return null
          }
          const pub = toPublicProduct(data)
          singleProductCache.set(queryKey, pub)
          return pub
        })
        .catch((err: unknown) => {
          const isAbort =
            typeof err === 'object' &&
            err !== null &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          if (!isAbort) {
            singleProductCache.set(queryKey, null)
          }
          return null
        })
        .finally(() => {
          inFlightSingleProduct.delete(queryKey)
        })

      inFlightSingleProduct.set(queryKey, promise)
    }

    promise.then((pub) => {
      if (isMounted) {
        setState({ key: queryKey, product: pub })
      }
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [queryKey, isResolved])

  if (isResolved) {
    return { product: initialProduct ?? null, loading: false }
  }

  if (!queryKey) {
    return { product: null, loading: false }
  }

  const currentProduct = state?.key === queryKey ? state.product : (cached ?? null)
  const isLoaded = singleProductCache.has(queryKey) || state?.key === queryKey

  return {
    product: currentProduct,
    loading: !isLoaded,
  }
}

export function useClientProducts(options: {
  productIds?: Array<string | number>
  mode?: 'manual' | 'filter'
  filterWeb?: string
  filterType?: string
  limit?: number
  initialProducts?: PublicProduct[]
}): { products: PublicProduct[]; loading: boolean } {
  const isResolved = options.initialProducts !== undefined
  const queryKey = buildProductsQueryKey(options)

  const isManualEmpty = queryKey === 'manual:'

  const [state, setState] = useState<{ key: string; products: PublicProduct[] } | null>(() => {
    if (!isManualEmpty && multiProductsCache.has(queryKey)) {
      return { key: queryKey, products: multiProductsCache.get(queryKey) || [] }
    }
    return null
  })

  useEffect(() => {
    if (isResolved || isManualEmpty) return

    // If already in cache, no need to fetch again
    if (multiProductsCache.has(queryKey)) {
      return
    }

    let isMounted = true
    const controller = new AbortController()

    let promise = inFlightMultiProducts.get(queryKey)
    if (!promise) {
      let url = '/api/products?depth=1'
      if (queryKey.startsWith('manual:')) {
        const ids = queryKey.slice('manual:'.length).split(',').filter(Boolean)
        const params = ids.map((id) => `where[id][in][]=${encodeURIComponent(id)}`).join('&')
        url += `&limit=${ids.length}&${params}`
      } else {
        const [, filterWeb, filterType, limit] = queryKey.split(':')
        url += `&limit=${limit}&sort=order`
        if (filterWeb && filterWeb !== 'all') {
          url += `&where[web][equals]=${encodeURIComponent(filterWeb)}`
        }
        if (filterType && filterType !== 'all') {
          url += `&where[type][equals]=${encodeURIComponent(filterType)}`
        }
      }

      promise = fetch(url, { credentials: 'include', signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const rawDocs = (data?.docs || []).filter(
            (doc: { saleStatus?: string }) => doc.saleStatus !== 'hidden',
          )
          const publicDocs = rawDocs.map(toPublicProduct)

          let finalDocs: PublicProduct[] = publicDocs
          if (queryKey.startsWith('manual:')) {
            const ids = queryKey.slice('manual:'.length).split(',').filter(Boolean)
            const idMap = new Map(publicDocs.map((d: PublicProduct) => [String(d.id), d]))
            finalDocs = ids.map((id) => idMap.get(id)).filter(Boolean) as PublicProduct[]
          }

          multiProductsCache.set(queryKey, finalDocs)
          return finalDocs
        })
        .catch((err: unknown) => {
          const isAbort =
            typeof err === 'object' &&
            err !== null &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          if (!isAbort) {
            multiProductsCache.set(queryKey, [])
          }
          return []
        })
        .finally(() => {
          inFlightMultiProducts.delete(queryKey)
        })

      inFlightMultiProducts.set(queryKey, promise)
    }

    promise.then((docs) => {
      if (isMounted) {
        setState({ key: queryKey, products: docs })
      }
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [queryKey, isResolved, isManualEmpty])

  if (isResolved) {
    return { products: options.initialProducts ?? [], loading: false }
  }

  if (isManualEmpty) {
    return { products: [], loading: false }
  }

  const cached = multiProductsCache.get(queryKey)
  const currentProducts = state?.key === queryKey ? state.products : (cached ?? [])
  const isLoaded = multiProductsCache.has(queryKey) || state?.key === queryKey

  return {
    products: currentProducts,
    loading: !isLoaded,
  }
}

/**
 * Xây dựng queryKey dạng chuỗi nguyên thủy từ các tham số truy vấn lời chia sẻ.
 */
export function buildTestimonialsQueryKey(options: {
  testimonialIds?: Array<string | number>
  mode?: 'manual' | 'recent'
  limit?: number
}): string {
  const mode = options.mode || 'manual'
  if (mode === 'manual') {
    const cleanIds = (options.testimonialIds || [])
      .filter((id): id is string | number => id != null && String(id).trim() !== '')
      .map(String)
    return `manual:${cleanIds.join(',')}`
  }
  const lim = options.limit || 6
  return `recent:${lim}`
}

export function useClientTestimonial(
  testimonialId: string | number | undefined | null,
  initialTestimonial?: PublicTestimonial | null,
): { testimonial: PublicTestimonial | null; loading: boolean } {
  const isResolved = initialTestimonial !== undefined
  const tid =
    testimonialId != null && String(testimonialId).trim() !== '' ? String(testimonialId).trim() : ''

  const queryKey = tid
  const cached = queryKey ? singleTestimonialCache.get(queryKey) : undefined

  const [state, setState] = useState<{
    key: string
    testimonial: PublicTestimonial | null
  } | null>(() => {
    if (queryKey && singleTestimonialCache.has(queryKey)) {
      return { key: queryKey, testimonial: singleTestimonialCache.get(queryKey) ?? null }
    }
    return null
  })

  useEffect(() => {
    if (isResolved || !queryKey) return

    if (singleTestimonialCache.has(queryKey)) {
      return
    }

    let isMounted = true
    const controller = new AbortController()

    let promise = inFlightSingleTestimonial.get(queryKey)
    if (!promise) {
      promise = fetch(`/api/testimonials/${encodeURIComponent(queryKey)}?depth=1`, {
        credentials: 'include',
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data || data.consent !== true || (data._status && data._status !== 'published')) {
            singleTestimonialCache.set(queryKey, null)
            return null
          }
          const pub = toPublicTestimonial(data)
          singleTestimonialCache.set(queryKey, pub)
          return pub
        })
        .catch((err: unknown) => {
          const isAbort =
            typeof err === 'object' &&
            err !== null &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          if (!isAbort) {
            singleTestimonialCache.set(queryKey, null)
          }
          return null
        })
        .finally(() => {
          inFlightSingleTestimonial.delete(queryKey)
        })

      inFlightSingleTestimonial.set(queryKey, promise)
    }

    promise.then((pub) => {
      if (isMounted) {
        setState({ key: queryKey, testimonial: pub })
      }
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [queryKey, isResolved])

  if (isResolved) {
    return { testimonial: initialTestimonial ?? null, loading: false }
  }

  if (!queryKey) {
    return { testimonial: null, loading: false }
  }

  const currentTestimonial = state?.key === queryKey ? state.testimonial : (cached ?? null)
  const isLoaded = singleTestimonialCache.has(queryKey) || state?.key === queryKey

  return {
    testimonial: currentTestimonial,
    loading: !isLoaded,
  }
}

export function useClientTestimonials(options: {
  testimonialIds?: Array<string | number>
  mode?: 'manual' | 'recent'
  limit?: number
  initialTestimonials?: PublicTestimonial[]
}): { testimonials: PublicTestimonial[]; loading: boolean } {
  const isResolved = options.initialTestimonials !== undefined
  const queryKey = buildTestimonialsQueryKey(options)
  const isManualEmpty = queryKey === 'manual:'

  const [state, setState] = useState<{
    key: string
    testimonials: PublicTestimonial[]
  } | null>(() => {
    if (!isManualEmpty && multiTestimonialsCache.has(queryKey)) {
      return { key: queryKey, testimonials: multiTestimonialsCache.get(queryKey) || [] }
    }
    return null
  })

  useEffect(() => {
    if (isResolved || isManualEmpty) return

    if (multiTestimonialsCache.has(queryKey)) {
      return
    }

    let isMounted = true
    const controller = new AbortController()

    let promise = inFlightMultiTestimonials.get(queryKey)
    if (!promise) {
      let url =
        '/api/testimonials?depth=1&where[consent][equals]=true&where[_status][equals]=published'
      if (queryKey.startsWith('manual:')) {
        const ids = queryKey.slice('manual:'.length).split(',').filter(Boolean)
        const params = ids.map((id) => `where[id][in][]=${encodeURIComponent(id)}`).join('&')
        url += `&limit=${ids.length}&${params}`
      } else {
        const [, limit] = queryKey.split(':')
        url += `&limit=${limit}&sort=-createdAt`
      }

      promise = fetch(url, { credentials: 'include', signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const rawDocs = (data?.docs || []).filter(
            (doc: { consent?: boolean; _status?: string }) =>
              doc.consent === true && (!doc._status || doc._status === 'published'),
          )
          const publicDocs = rawDocs
            .map(toPublicTestimonial)
            .filter((d: PublicTestimonial | null): d is PublicTestimonial => d !== null)

          let finalDocs: PublicTestimonial[] = publicDocs
          if (queryKey.startsWith('manual:')) {
            const ids = queryKey.slice('manual:'.length).split(',').filter(Boolean)
            const idMap = new Map(publicDocs.map((d: PublicTestimonial) => [String(d.id), d]))
            finalDocs = ids.map((id) => idMap.get(id)).filter(Boolean) as PublicTestimonial[]
          }

          multiTestimonialsCache.set(queryKey, finalDocs)
          return finalDocs
        })
        .catch((err: unknown) => {
          const isAbort =
            typeof err === 'object' &&
            err !== null &&
            'name' in err &&
            (err as { name: string }).name === 'AbortError'
          if (!isAbort) {
            multiTestimonialsCache.set(queryKey, [])
          }
          return []
        })
        .finally(() => {
          inFlightMultiTestimonials.delete(queryKey)
        })

      inFlightMultiTestimonials.set(queryKey, promise)
    }

    promise.then((docs) => {
      if (isMounted) {
        setState({ key: queryKey, testimonials: docs })
      }
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [queryKey, isResolved, isManualEmpty])

  if (isResolved) {
    return { testimonials: options.initialTestimonials ?? [], loading: false }
  }

  if (isManualEmpty) {
    return { testimonials: [], loading: false }
  }

  const cached = multiTestimonialsCache.get(queryKey)
  const currentTestimonials = state?.key === queryKey ? state.testimonials : (cached ?? [])
  const isLoaded = multiTestimonialsCache.has(queryKey) || state?.key === queryKey

  return {
    testimonials: currentTestimonials,
    loading: !isLoaded,
  }
}

export function useClientSiteSettings(initialSettings?: PublicSiteSettings | null): {
  settings: PublicSiteSettings | null
  loading: boolean
} {
  const isResolved = initialSettings !== undefined

  const [settings, setSettings] = useState<PublicSiteSettings | null>(() => {
    if (siteSettingsCache) return siteSettingsCache
    return null
  })

  useEffect(() => {
    if (isResolved) return
    if (siteSettingsCache) return

    let isMounted = true
    const controller = new AbortController()

    let inFlight = inFlightSiteSettings
    if (!inFlight) {
      inFlight = fetch('/api/globals/siteSettings?depth=0', {
        credentials: 'include',
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const pub = toPublicSiteSettings(data)
          siteSettingsCache = pub
          return pub
        })
        .catch(() => {
          const empty: PublicSiteSettings = {
            shopeeStoreUrl: null,
            zaloChatUrl: null,
            zaloGroupUrl: null,
          }
          siteSettingsCache = empty
          return empty
        })
        .finally(() => {
          inFlightSiteSettings = null
        })
      inFlightSiteSettings = inFlight
    }

    inFlight.then((data) => {
      if (isMounted) {
        setSettings(data)
      }
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [isResolved])

  if (isResolved) {
    return { settings: initialSettings ?? null, loading: false }
  }

  const current = settings || siteSettingsCache
  return {
    settings: current,
    loading: !current,
  }
}

export function useClientPageSlug(
  pageId: string | number | undefined | null,
  initialSlug?: string | null,
): { slug: string | null; loading: boolean } {
  const isResolved = initialSlug !== undefined
  const pid = pageId != null && String(pageId).trim() !== '' ? String(pageId).trim() : ''

  const [slug, setSlug] = useState<string | null>(() => {
    if (pid && pageSlugCache.has(pid)) {
      return pageSlugCache.get(pid) ?? null
    }
    return null
  })

  useEffect(() => {
    if (isResolved || !pid) return
    if (pageSlugCache.has(pid)) return

    let isMounted = true
    const controller = new AbortController()

    let promise = inFlightPageSlug.get(pid)
    if (!promise) {
      promise = fetch(`/api/pages/${encodeURIComponent(pid)}?depth=0`, {
        credentials: 'include',
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const resolvedSlug = typeof data?.slug === 'string' ? data.slug : null
          pageSlugCache.set(pid, resolvedSlug)
          return resolvedSlug
        })
        .catch(() => {
          pageSlugCache.set(pid, null)
          return null
        })
        .finally(() => {
          inFlightPageSlug.delete(pid)
        })

      inFlightPageSlug.set(pid, promise)
    }

    promise.then((resSlug) => {
      if (isMounted) {
        setSlug(resSlug)
      }
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [pid, isResolved])

  if (isResolved) {
    return { slug: initialSlug ?? null, loading: false }
  }

  if (!pid) {
    return { slug: null, loading: false }
  }

  const cached = pageSlugCache.get(pid)
  const current = slug ?? cached ?? null
  return {
    slug: current,
    loading: !pageSlugCache.has(pid) && slug === null,
  }
}

export function useClientServices(options: {
  serviceIds?: Array<string | number>
  initialServices?: PublicServiceSummary[]
}): { services: PublicServiceSummary[]; loading: boolean } {
  const isResolved = options.initialServices !== undefined
  const rawIds = options.serviceIds || []
  const cleanIds = rawIds
    .filter((id): id is string | number => id != null && String(id).trim() !== '')
    .map(String)
  const queryKey = cleanIds.join(',')

  const [state, setState] = useState<{ key: string; services: PublicServiceSummary[] } | null>(
    () => {
      if (queryKey && multiServicesCache.has(queryKey)) {
        return { key: queryKey, services: multiServicesCache.get(queryKey) ?? [] }
      }
      return null
    },
  )

  useEffect(() => {
    if (isResolved || !queryKey) return
    if (multiServicesCache.has(queryKey)) return

    let isMounted = true
    const controller = new AbortController()

    let promise = inFlightMultiServices.get(queryKey)
    if (!promise) {
      const ids = queryKey.split(',').filter(Boolean)
      const params = ids.map((id) => `where[id][in][]=${encodeURIComponent(id)}`).join('&')
      const url = `/api/services?limit=${ids.length}&depth=1&where[_status][equals]=published&${params}`

      promise = fetch(url, { credentials: 'include', signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const rawDocs = (data?.docs || []).map((doc: Record<string, unknown>) => {
            const img = doc.image as { url?: string; alt?: string } | undefined
            const situations = Array.isArray(doc.situations)
              ? doc.situations
                  .map((s: { text?: string } | string) =>
                    typeof s === 'string' ? s : s?.text || '',
                  )
                  .filter(Boolean)
              : []
            const outcomes = Array.isArray(doc.outcomes)
              ? doc.outcomes
                  .map((o: { text?: string } | string) =>
                    typeof o === 'string' ? o : o?.text || '',
                  )
                  .filter(Boolean)
              : []

            return {
              id: doc.id as string | number,
              name: doc.name as string,
              slug: doc.slug as string,
              badge: (doc.badge as string) || null,
              imageUrl: img?.url || null,
              imageAlt: img?.alt || null,
              audience: doc.audience as string | undefined,
              audienceLabel: doc.audienceLabel as string | undefined,
              situations,
              outcomes,
              ctaLabel: doc.ctaLabel as string | undefined,
              saleStatus: doc.saleStatus as PublicServiceSummary['saleStatus'],
            }
          }) as PublicServiceSummary[]

          const idMap = new Map(rawDocs.map((d) => [String(d.id), d]))
          const finalDocs = ids.map((id) => idMap.get(id)).filter(Boolean) as PublicServiceSummary[]

          multiServicesCache.set(queryKey, finalDocs)
          return finalDocs
        })
        .catch(() => {
          multiServicesCache.set(queryKey, [])
          return []
        })
        .finally(() => {
          inFlightMultiServices.delete(queryKey)
        })

      inFlightMultiServices.set(queryKey, promise)
    }

    promise.then((docs) => {
      if (isMounted) {
        setState({ key: queryKey, services: docs })
      }
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [queryKey, isResolved])

  if (isResolved) {
    return { services: options.initialServices ?? [], loading: false }
  }

  if (!queryKey) {
    return { services: [], loading: false }
  }

  const cached = multiServicesCache.get(queryKey)
  const current = state?.key === queryKey ? state.services : (cached ?? [])
  return {
    services: current,
    loading: !multiServicesCache.has(queryKey) && state?.key !== queryKey,
  }
}

export function useClientPrograms(options: {
  programIds?: Array<string | number>
  initialPrograms?: PublicProgramSummary[]
}): { programs: PublicProgramSummary[]; loading: boolean } {
  const isResolved = options.initialPrograms !== undefined
  const rawIds = options.programIds || []
  const cleanIds = rawIds
    .filter((id): id is string | number => id != null && String(id).trim() !== '')
    .map(String)
  const queryKey = cleanIds.join(',')

  const [state, setState] = useState<{ key: string; programs: PublicProgramSummary[] } | null>(
    () => {
      if (queryKey && multiProgramsCache.has(queryKey)) {
        return { key: queryKey, programs: multiProgramsCache.get(queryKey) ?? [] }
      }
      return null
    },
  )

  useEffect(() => {
    if (isResolved || !queryKey) return
    if (multiProgramsCache.has(queryKey)) return

    let isMounted = true
    const controller = new AbortController()

    let promise = inFlightMultiPrograms.get(queryKey)
    if (!promise) {
      const ids = queryKey.split(',').filter(Boolean)
      const params = ids.map((id) => `where[id][in][]=${encodeURIComponent(id)}`).join('&')
      const url = `/api/programs?limit=${ids.length}&where[_status][equals]=published&${params}`

      promise = fetch(url, { credentials: 'include', signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const rawDocs = (data?.docs || []).map((doc: Record<string, unknown>) => ({
            id: doc.id as string | number,
            name: doc.name as string,
            slug: doc.slug as string,
            learnerGroup: doc.learnerGroup as string | undefined,
            format: doc.format as string | undefined,
            ctaLabel: doc.ctaLabel as string | undefined,
            saleStatus: doc.saleStatus as PublicProgramSummary['saleStatus'],
          })) as PublicProgramSummary[]

          const idMap = new Map(rawDocs.map((d) => [String(d.id), d]))
          const finalDocs = ids.map((id) => idMap.get(id)).filter(Boolean) as PublicProgramSummary[]

          multiProgramsCache.set(queryKey, finalDocs)
          return finalDocs
        })
        .catch(() => {
          multiProgramsCache.set(queryKey, [])
          return []
        })
        .finally(() => {
          inFlightMultiPrograms.delete(queryKey)
        })

      inFlightMultiPrograms.set(queryKey, promise)
    }

    promise.then((docs) => {
      if (isMounted) {
        setState({ key: queryKey, programs: docs })
      }
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [queryKey, isResolved])

  if (isResolved) {
    return { programs: options.initialPrograms ?? [], loading: false }
  }

  if (!queryKey) {
    return { programs: [], loading: false }
  }

  const cached = multiProgramsCache.get(queryKey)
  const current = state?.key === queryKey ? state.programs : (cached ?? [])
  return {
    programs: current,
    loading: !multiProgramsCache.has(queryKey) && state?.key !== queryKey,
  }
}

export interface PublicTeamMember {
  id: string | number
  name: string
  role?: string | null
  specialty?: string | null
  bio?: string | null
  photoUrl?: string | null
  photoAlt?: string | null
  order?: number | null
  consent?: boolean | null
}

let teamMembersCache: PublicTeamMember[] | null = null
let inFlightTeamMembers: Promise<PublicTeamMember[]> | null = null

export function useClientTeamMembers(options?: { initialMembers?: PublicTeamMember[] }): {
  members: PublicTeamMember[]
  loading: boolean
} {
  const initialMembers = options?.initialMembers
  const isResolved = initialMembers !== undefined

  const [members, setMembers] = useState<PublicTeamMember[] | null>(() => {
    if (isResolved) return initialMembers ?? []
    return teamMembersCache
  })

  useEffect(() => {
    if (isResolved) return
    if (teamMembersCache !== null) return

    let isMounted = true
    const controller = new AbortController()

    let inFlight = inFlightTeamMembers
    if (!inFlight) {
      inFlight = fetch(
        '/api/teamMembers?limit=100&depth=1&where[_status][equals]=published&where[consent][equals]=true&sort=order',
        {
          credentials: 'include',
          signal: controller.signal,
        },
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const list = (data?.docs || [])
            .filter((doc: Record<string, unknown>) => doc.consent === true)
            .map((doc: Record<string, unknown>) => {
              const p = doc.photo as { url?: string; alt?: string } | undefined
              return {
                id: doc.id as string | number,
                name: doc.name as string,
                role: (doc.role as string) || null,
                specialty: (doc.specialty as string) || null,
                bio: (doc.bio as string) || null,
                photoUrl: p?.url || null,
                photoAlt: p?.alt || null,
                order: (doc.order as number) ?? 0,
                consent: Boolean(doc.consent),
              }
            })
          teamMembersCache = list
          return list
        })
        .catch(() => {
          teamMembersCache = []
          return []
        })
        .finally(() => {
          inFlightTeamMembers = null
        })
      inFlightTeamMembers = inFlight
    }

    inFlight.then((data) => {
      if (isMounted) {
        setMembers(data)
      }
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [isResolved])

  if (isResolved) {
    return { members: initialMembers ?? [], loading: false }
  }

  const current = members || teamMembersCache || []
  return {
    members: current,
    loading: teamMembersCache === null && members === null,
  }
}
