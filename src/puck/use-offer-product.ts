'use client'

import { useEffect, useState } from 'react'
import type { ProductPageResolved } from './product-page-types'

const cache = new Map<string, ProductPageResolved | null>()

/**
 * BX-08: offer data for a "Trang sản phẩm" block. Public pages get it from the server
 * (`_resolved`); in the builder it is fetched once per product id.
 */
export function useOfferProduct(
  productId: string | number | null | undefined,
  resolved?: ProductPageResolved | null,
): { data: ProductPageResolved | null; loading: boolean } {
  const id = productId ? String(productId) : ''
  const [state, setState] = useState<{ id: string; data: ProductPageResolved | null } | null>(() =>
    id && cache.has(id) ? { id, data: cache.get(id) ?? null } : null,
  )

  useEffect(() => {
    if (resolved || !id || cache.has(id)) return
    let cancelled = false
    fetch(`/api/builder/offer-product/${encodeURIComponent(id)}`, { credentials: 'include' })
      .then((res) => (res.ok ? (res.json() as Promise<ProductPageResolved>) : null))
      .catch(() => null)
      .then((data) => {
        cache.set(id, data)
        if (!cancelled) setState({ id, data })
      })
    return () => {
      cancelled = true
    }
  }, [id, resolved])

  if (resolved) return { data: resolved, loading: false }
  if (!id) return { data: null, loading: false }
  if (cache.has(id)) return { data: cache.get(id) ?? null, loading: false }
  if (state?.id === id) return { data: state.data, loading: false }
  return { data: null, loading: true }
}
