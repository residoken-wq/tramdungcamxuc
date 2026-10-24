'use client'

import React, { useEffect, useState } from 'react'
import { vi } from '@/lib/i18n/vi'

export type SummaryCollection =
  'services' | 'products' | 'pages' | 'programs' | 'testimonials' | 'media'

type SummaryRecord = {
  name?: string
  title?: string
  alt?: string
  filename?: string
  url?: string
  thumbnailURL?: string
}

// In-memory cache per editor session, keyed by `collection:id`. Several cards pointing at the same
// record share one request. Only the display name is shown; puckData keeps storing the ID (§5B).
const cache = new Map<string, Promise<SummaryRecord | null>>()

export function clearRecordSummaryCache(): void {
  cache.clear()
}

function loadRecord(collection: SummaryCollection, id: string): Promise<SummaryRecord | null> {
  const key = `${collection}:${id}`
  let pending = cache.get(key)
  if (!pending) {
    pending = fetch(`/api/${collection}/${encodeURIComponent(id)}?depth=0`, {
      credentials: 'include',
    })
      .then((res) => (res.ok ? (res.json() as Promise<SummaryRecord>) : null))
      .catch(() => null)
    // A failed lookup is not cached, so a record created later can still be resolved.
    pending.then((record) => {
      if (!record) cache.delete(key)
    })
    cache.set(key, pending)
  }
  return pending
}

function recordLabel(record: SummaryRecord): string {
  return record.name || record.title || record.alt || record.filename || ''
}

export function RecordSummary({
  collection,
  id,
}: {
  collection: SummaryCollection
  id: string | number
}) {
  const recordId = String(id)
  const [state, setState] = useState<{ id: string; record: SummaryRecord | null } | null>(null)

  useEffect(() => {
    let active = true
    loadRecord(collection, recordId).then((record) => {
      if (active) setState({ id: recordId, record })
    })
    return () => {
      active = false
    }
  }, [collection, recordId])

  const t = vi.builder.recordSummary
  if (!state || state.id !== recordId) {
    return <span data-record-summary="loading">{t.loading}</span>
  }
  const label = state.record ? recordLabel(state.record) : ''
  if (!state.record || !label) {
    return <span data-record-summary="missing">{t.notFound(recordId)}</span>
  }

  const thumb = collection === 'media' ? state.record.thumbnailURL || state.record.url : undefined
  return (
    <span
      data-record-summary="ready"
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
        />
      ) : null}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </span>
  )
}
