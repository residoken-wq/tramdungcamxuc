'use client'

import { useEffect, useState } from 'react'
import type { EqPageResolved } from './eq-page-types'

let cache: EqPageResolved | null | undefined

/**
 * BX-08b: "Nội dung EQ Buddy" for an EQ Buddy block. Public pages get it from the server
 * (`_resolved`); in the builder it is fetched once.
 */
export function useEqContent(resolved?: EqPageResolved | null): {
  data: EqPageResolved | null
  loading: boolean
} {
  const [state, setState] = useState<EqPageResolved | null | undefined>(cache)

  useEffect(() => {
    if (resolved || cache !== undefined) return
    let cancelled = false
    fetch('/api/builder/eq-content', { credentials: 'include' })
      .then((res) => (res.ok ? (res.json() as Promise<EqPageResolved>) : null))
      .catch(() => null)
      .then((data) => {
        cache = data
        if (!cancelled) setState(data)
      })
    return () => {
      cancelled = true
    }
  }, [resolved])

  if (resolved) return { data: resolved, loading: false }
  if (cache !== undefined) return { data: cache, loading: false }
  if (state !== undefined) return { data: state, loading: false }
  return { data: null, loading: true }
}
