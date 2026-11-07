'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { BrandIcon } from '@/components/brand/BrandIcon'

/**
 * QA PK-19c: client part of the FAQ contact card. FAQ itself stays a server component; only
 * the builder preview (no server-resolved URL yet) fetches the chosen media here.
 */
export function FaqContactAvatar({
  url,
  alt,
  mediaId,
}: {
  url?: string | null
  alt?: string | null
  mediaId?: string | number | null
}) {
  const [fetched, setFetched] = useState<{ url: string; alt: string } | null>(null)

  useEffect(() => {
    if (url || !mediaId) return
    let alive = true
    fetch(`/api/media/${encodeURIComponent(String(mediaId))}?depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive && data?.url) setFetched({ url: data.url, alt: data.alt || '' })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [url, mediaId])

  const src = url || fetched?.url
  if (!src) return <BrandIcon name="user" size={48} className="text-deep-navy" />
  return <Image src={src} alt={(url ? alt : fetched?.alt) || ''} fill className="object-cover" />
}
