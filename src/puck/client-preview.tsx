'use client'

import { useEffect, useState } from 'react'
import { toPublicProduct, type PublicProduct } from '@/lib/products'

// In-memory client caches (persists across renders in the browser / test environment)
const singleProductCache = new Map<string, PublicProduct | null>()
const multiProductsCache = new Map<string, PublicProduct[]>()
const inFlightSingleProduct = new Map<string, Promise<PublicProduct | null>>()
const inFlightMultiProducts = new Map<string, Promise<PublicProduct[]>>()

/**
 * Xóa cache client preview (dùng cho unit test hoặc reset khi cần)
 */
export function clearClientPreviewCache() {
  singleProductCache.clear()
  multiProductsCache.clear()
  inFlightSingleProduct.clear()
  inFlightMultiProducts.clear()
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
