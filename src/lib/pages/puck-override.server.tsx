import 'server-only'
import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import type { Data } from '@puckeditor/core'
import config from '@/payload.config'
import type { Page } from '@/payload-types'
import { StyledRender } from '@/components/design/StyledRender'
import { puckConfig } from '@/puck/config'
import { resolveServerData } from '@/puck/resolve.server'

/**
 * Published builder page (`pages`, kind `page`) for an exact slug, or null.
 * BX-08: product landing routes call this first – a published page replaces the coded page;
 * unpublishing / deleting it brings the coded page back.
 */
export async function findPublishedBuilderPage(slug: string): Promise<Page | null> {
  try {
    const payload = await getPayload({ config: await config })
    const result = await payload.find({
      collection: 'pages',
      where: {
        and: [
          { slug: { equals: slug } },
          { _status: { equals: 'published' } },
          { kind: { equals: 'page' } },
        ],
      },
      limit: 1,
      draft: false,
    })
    return (result.docs[0] as Page | undefined) ?? null
  } catch {
    return null
  }
}

/** Metadata of a builder page (SEO fields, falling back to its title). */
export function builderPageMetadata(doc: Page): Metadata {
  const ogMedia =
    typeof doc.seo?.ogImage === 'object' && doc.seo.ogImage !== null
      ? (doc.seo.ogImage as { url?: string })
      : null
  return {
    title: doc.seo?.title || doc.title || 'Trạm Dừng Cảm Xúc',
    description: doc.seo?.description || undefined,
    openGraph: ogMedia?.url ? { images: [ogMedia.url] } : undefined,
  }
}

/** Renders a builder page exactly like the catch-all route does (single render path). */
export async function BuilderPage({ doc, slug }: { doc: Page; slug: string }) {
  const initialData: Data = (doc.puckData as Data) || {
    content: [],
    root: { props: { title: doc.title || '' } },
  }
  const resolvedData = await resolveServerData(initialData, { pageSlug: slug })
  return <StyledRender config={puckConfig} data={resolvedData} />
}
