'use client'

import { useEffect, useState } from 'react'
import type { Product } from '@/payload-types'

export function useClientProduct(
  productId: string | number | undefined | null,
  initialProduct?: Product | null,
): { product: Product | null; loading: boolean } {
  const isResolved = initialProduct !== undefined
  const [fetched, setFetched] = useState<{ id: string; product: Product | null } | null>(null)

  const pid = productId ? String(productId) : ''
  const isFetching = !isResolved && Boolean(pid) && fetched?.id !== pid

  useEffect(() => {
    if (isResolved || !pid) return

    let isMounted = true
    const controller = new AbortController()

    fetch(`/api/products/${encodeURIComponent(pid)}?depth=1`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          setFetched({ id: pid, product: data })
        }
      })
      .catch((err: unknown) => {
        const isAbort =
          typeof err === 'object' &&
          err !== null &&
          'name' in err &&
          (err as { name: string }).name === 'AbortError'
        if (!isAbort && isMounted) {
          setFetched({ id: pid, product: null })
        }
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [pid, isResolved])

  const product = isResolved ? initialProduct : fetched?.id === pid ? fetched.product : null

  return { product, loading: isFetching }
}

export function useClientProducts(options: {
  productIds?: Array<string | number>
  mode?: 'manual' | 'filter'
  filterWeb?: string
  filterType?: string
  limit?: number
  initialProducts?: Product[]
}): { products: Product[]; loading: boolean } {
  const { productIds, mode = 'manual', filterWeb, filterType, limit = 6, initialProducts } = options

  const isResolved = initialProducts !== undefined
  const queryKey =
    mode === 'manual'
      ? `manual:${(productIds || []).filter(Boolean).join(',')}`
      : `filter:${filterWeb || 'all'}:${filterType || 'all'}:${limit}`

  const shouldFetch =
    !isResolved &&
    ((mode === 'manual' && Boolean(productIds && productIds.length > 0)) || mode === 'filter')

  const [fetched, setFetched] = useState<{ key: string; products: Product[] } | null>(null)
  const isFetching = shouldFetch && fetched?.key !== queryKey

  useEffect(() => {
    if (!shouldFetch) return

    let isMounted = true
    const controller = new AbortController()

    let url = '/api/products?depth=1'
    if (mode === 'manual') {
      const validIds = (productIds || []).filter(Boolean)
      if (validIds.length === 0) {
        return
      }
      const params = validIds.map((id) => `where[id][in][]=${encodeURIComponent(id)}`).join('&')
      url += `&limit=${validIds.length}&${params}`
    } else {
      url += `&limit=${limit}&sort=order`
      if (filterWeb && filterWeb !== 'all') {
        url += `&where[web][equals]=${encodeURIComponent(filterWeb)}`
      }
      if (filterType && filterType !== 'all') {
        url += `&where[type][equals]=${encodeURIComponent(filterType)}`
      }
    }

    fetch(url, { credentials: 'include', signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          const docs = (data?.docs || []).filter((doc: Product) => doc.saleStatus !== 'hidden')
          if (mode === 'manual' && productIds) {
            const idMap = new Map(docs.map((d: Product) => [String(d.id), d]))
            const ordered = productIds
              .map((id) => idMap.get(String(id)))
              .filter(Boolean) as Product[]
            setFetched({ key: queryKey, products: ordered })
          } else {
            setFetched({ key: queryKey, products: docs })
          }
        }
      })
      .catch((err: unknown) => {
        const isAbort =
          typeof err === 'object' &&
          err !== null &&
          'name' in err &&
          (err as { name: string }).name === 'AbortError'
        if (!isAbort && isMounted) {
          setFetched({ key: queryKey, products: [] })
        }
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [shouldFetch, queryKey, mode, filterWeb, filterType, limit, productIds])

  const products = isResolved ? initialProducts : fetched?.key === queryKey ? fetched.products : []

  return { products, loading: isFetching }
}
