'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { vi } from '@/lib/i18n/vi'
import { buildProductPageData, productPageTarget } from '@/puck/templates/product-page'

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

/**
 * BX-08: in the product form – create (as a draft) or open the builder page that replaces this
 * product's coded page. Only signed-in admins see the product form, and REST access rules on
 * `pages` still apply to the create call.
 */
export const ProductBuilderButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const fields = useFormFields(([f]) => ({
    slug: (f.slug?.value as string | undefined) ?? '',
    type: (f.type?.value as string | undefined) ?? '',
    saleStatus: (f.saleStatus?.value as string | undefined) ?? '',
    name: (f.name?.value as string | undefined) ?? '',
  }))
  const target = productPageTarget(fields)
  const [existing, setExisting] = useState<ExistingPage | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [reloadKey, setReloadKey] = useState(0)
  const targetSlug = target?.slug ?? ''

  useEffect(() => {
    if (!targetSlug) return
    let cancelled = false
    findExistingPage(targetSlug).then((page) => {
      if (!cancelled) setExisting(page)
    })
    return () => {
      cancelled = true
    }
  }, [targetSlug, reloadKey])

  const create = async () => {
    if (!target || !id) return
    setBusy(true)
    setError('')
    try {
      const title = fields.name || target.slug
      const res = await fetch('/api/pages?draft=true', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: target.slug,
          kind: 'page',
          _status: 'draft',
          puckData: buildProductPageData(target.kind, id, title),
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
  if (!target) body = <p style={{ margin: 0 }}>{t.noTarget}</p>
  else if (!id) body = <p style={{ margin: 0 }}>{t.saveFirst}</p>
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
        <p style={{ margin: 0 }}>{t.showing(false)}</p>
        <button type="button" onClick={create} disabled={busy} style={button}>
          {busy ? t.creating : t.create}
        </button>
        {error ? <p style={{ margin: '8px 0 0', color: '#BC039E' }}>{error}</p> : null}
      </>
    )

  return (
    <div style={box} data-testid="product-builder-panel" role="region" aria-label={t.title}>
      <strong style={{ display: 'block', marginBottom: 4 }}>{t.title}</strong>
      {body}
      {target ? <p style={{ margin: '8px 0 0', opacity: 0.8 }}>{t.hint}</p> : null}
    </div>
  )
}
