'use client'

import React, { useEffect, useState } from 'react'
import type { Data } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'

const t = vi.bx08.builderPanel

type ExistingPage = { id: string | number; published: boolean } | null

/** Builder page with this slug (any status) and whether a published version exists. */
async function findExistingPage(slug: string): Promise<ExistingPage> {
  try {
    const q = `where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`
    const res = await fetch(`/api/pages?${q}&draft=true`, { credentials: 'include' })
    const doc = res.ok ? (await res.json())?.docs?.[0] : null
    if (!doc) return null
    // The latest draft's `_status` does not tell whether a published version exists.
    const pub = await fetch(`/api/pages?${q}&where[_status][equals]=published`, {
      credentials: 'include',
    })
    const published = pub.ok ? Boolean((await pub.json())?.docs?.length) : false
    return { id: doc.id, published }
  } catch {
    return null
  }
}

export interface BuilderPagePanelProps {
  /** `pages.slug` of the builder page; empty = nothing can be replaced. */
  slug: string
  title: string
  hint: string
  /** Shown instead of the button when `slug` is empty. */
  noTargetMessage?: string
  /** Shown instead of the button while the document is not saved yet. */
  notReadyMessage?: string
  ready: boolean
  pageTitle: string
  buildPuckData: (pageTitle: string) => Data
  testId: string
}

/**
 * BX-08: create (as a draft) or open the builder page that replaces a coded page. Only signed-in
 * admins see the admin forms, and REST access rules on `pages` still apply to the create call.
 */
export function BuilderPagePanel({
  slug,
  title,
  hint,
  noTargetMessage,
  notReadyMessage,
  ready,
  pageTitle,
  buildPuckData,
  testId,
}: BuilderPagePanelProps) {
  const [existing, setExisting] = useState<ExistingPage | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    findExistingPage(slug).then((page) => {
      if (!cancelled) setExisting(page)
    })
    return () => {
      cancelled = true
    }
  }, [slug, reloadKey])

  const create = async () => {
    if (!slug || !ready) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/pages?draft=true', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageTitle,
          slug,
          kind: 'page',
          _status: 'draft',
          puckData: buildPuckData(pageTitle),
        }),
      })
      const json = res.ok ? await res.json() : null
      const pageId = json?.doc?.id
      if (!pageId) throw new Error('create failed')
      window.open(`/builder/${pageId}`, '_blank', 'noopener,noreferrer')
      setReloadKey((k) => k + 1)
    } catch {
      setError(t.createFailed)
    } finally {
      setBusy(false)
    }
  }

  const box: React.CSSProperties = {
    margin: '0 0 16px',
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid rgb(40 10 96 / 0.2)',
    background: '#E9DDF9',
    color: '#280A60',
    fontSize: 13,
    lineHeight: 1.5,
  }
  const button: React.CSSProperties = {
    display: 'inline-flex',
    marginTop: 8,
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    background: '#280A60',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 13,
    textDecoration: 'none',
    cursor: 'pointer',
  }

  let body: React.ReactNode
  if (!slug) body = <p style={{ margin: 0 }}>{noTargetMessage}</p>
  else if (!ready) body = <p style={{ margin: 0 }}>{notReadyMessage}</p>
  else if (existing === undefined) body = null
  else if (existing)
    body = (
      <>
        <p style={{ margin: 0 }}>{t.showing(existing.published)}</p>
        <a
          href={`/builder/${existing.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={button}
        >
          {t.open} ↗
        </a>
      </>
    )
  else
    body = (
      <>
        <p style={{ margin: 0 }}>{t.showingNone}</p>
        <button type="button" onClick={create} disabled={busy} style={button}>
          {busy ? t.creating : t.create}
        </button>
        {error ? <p style={{ margin: '8px 0 0', color: '#BC039E' }}>{error}</p> : null}
      </>
    )

  return (
    <div style={box} data-testid={testId} role="region" aria-label={title}>
      <strong style={{ display: 'block', marginBottom: 4 }}>{title}</strong>
      {body}
      {slug ? <p style={{ margin: '8px 0 0', opacity: 0.8 }}>{hint}</p> : null}
    </div>
  )
}
