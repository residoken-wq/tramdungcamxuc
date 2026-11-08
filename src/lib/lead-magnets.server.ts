import type { Payload } from 'payload'
import { safeHref } from '@/lib/safe-href'
import type { LeadMagnetItem } from '@/components/site/LeadMagnetCarousel'

type ProductDoc = {
  id: string | number
  name: string
  slug: string
  shortDescription?: string | null
  topic?: string | null
  saleStatus?: string | null
  files?: unknown[] | null
  externalUrl?: string | null
  ctaLabel?: string | null
  coverImage?: unknown
}

/** PK-27: free product with a file (lead form) or a link (tool) → one card; otherwise null. */
function toLeadMagnetItem(doc: ProductDoc): LeadMagnetItem | null {
  if (doc.saleStatus !== 'free') return null
  const hasFiles = Array.isArray(doc.files) && doc.files.length > 0
  const safeExternal = doc.externalUrl ? safeHref(doc.externalUrl) : null
  if (!hasFiles && !safeExternal) return null
  const href = hasFiles ? `/tai-nguyen/${doc.slug}` : (safeExternal as string)
  const img = doc.coverImage as { url?: string; alt?: string } | undefined
  return {
    id: doc.id,
    name: doc.name,
    slug: doc.slug,
    shortDescription: doc.shortDescription || null,
    topic: doc.topic || null,
    coverImage: img?.url ? { url: img.url, alt: img.alt || doc.name } : null,
    href,
    isExternal: !hasFiles && /^https?:\/\//i.test(href),
    ctaLabel: typeof doc.ctaLabel === 'string' && doc.ctaLabel.trim() ? doc.ctaLabel.trim() : null,
  }
}

/**
 * Cards of the "Tài nguyên miễn phí" block (`LeadMagnetCarousel`). Shared by the public render
 * (`resolve.server.ts`) and the builder preview (QA PK-27b), so both show the same cards.
 */
export async function loadLeadMagnetItems(
  payload: Payload,
  mode: 'auto' | 'manual',
  manualIds: Array<string | number> = [],
): Promise<LeadMagnetItem[]> {
  try {
    if (mode === 'manual') {
      const ids = manualIds.filter((id) => id !== null && id !== undefined && String(id) !== '')
      if (ids.length === 0) return []
      const numericOrStrIds = ids.map((id) => (isNaN(Number(id)) ? id : Number(id)))
      const docs = await payload.find({
        collection: 'products',
        where: {
          and: [
            { id: { in: numericOrStrIds } },
            { _status: { equals: 'published' } },
            { saleStatus: { equals: 'free' } },
          ],
        },
        overrideAccess: true,
        depth: 1,
        limit: 12,
      })
      const byId = new Map<string, LeadMagnetItem>()
      for (const doc of docs.docs as unknown as ProductDoc[]) {
        const item = toLeadMagnetItem(doc)
        if (item) byId.set(String(doc.id), item)
      }
      return ids
        .map((id) => byId.get(String(id)))
        .filter((item): item is LeadMagnetItem => Boolean(item))
        .slice(0, 12)
    }

    const docs = await payload.find({
      collection: 'products',
      where: {
        and: [{ _status: { equals: 'published' } }, { saleStatus: { equals: 'free' } }],
      },
      overrideAccess: true,
      sort: 'order',
      depth: 1,
      limit: 24,
    })
    return (docs.docs as unknown as ProductDoc[])
      .map(toLeadMagnetItem)
      .filter((item): item is LeadMagnetItem => Boolean(item))
      .slice(0, 12)
  } catch {
    return []
  }
}
