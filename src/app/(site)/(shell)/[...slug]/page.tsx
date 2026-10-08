import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Render, type Data } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'
import { resolveServerData } from '@/puck/resolve.server'

// Pages read published CMS content on each request; never prerender at build (Docker builds have no DB or secret).
export const dynamic = 'force-dynamic'

type CatchAllPageProps = {
  params: Promise<{
    slug: string[]
  }>
}

export async function generateMetadata({ params }: CatchAllPageProps): Promise<Metadata> {
  const { slug } = await params
  const pageSlug = slug.join('/')
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const result = await payload.find({
      collection: 'pages',
      where: {
        and: [{ slug: { equals: pageSlug } }, { _status: { equals: 'published' } }],
      },
      limit: 1,
      draft: false,
    })

    const doc = result.docs[0]
    if (doc) {
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
  } catch {
    // Return default on error
  }

  return {
    title: 'Trang không tồn tại | Trạm Dừng Cảm Xúc',
  }
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params
  const pageSlug = slug.join('/')
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  let pageDoc = null
  try {
    const result = await payload.find({
      collection: 'pages',
      where: {
        and: [{ slug: { equals: pageSlug } }, { _status: { equals: 'published' } }],
      },
      limit: 1,
      draft: false,
    })
    pageDoc = result.docs[0] || null
  } catch {
    notFound()
  }

  if (!pageDoc) {
    notFound()
  }

  const initialData: Data = (pageDoc.puckData as Data) || {
    content: [],
    root: { props: { title: pageDoc.title || '' } },
  }

  const resolvedData = await resolveServerData(initialData, { pageSlug })

  return <Render config={puckConfig} data={resolvedData} />
}
