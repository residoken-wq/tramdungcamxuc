import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Render, type Data } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'
import { resolveServerData } from '@/puck/resolve.server'
import { Logo, HeartLine } from '@/components/brand'

// Pages read published CMS content on each request; never prerender at build (Docker builds have no DB or secret).
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const result = await payload.find({
      collection: 'pages',
      where: {
        and: [{ slug: { equals: '/' } }, { _status: { equals: 'published' } }],
      },
      limit: 1,
      draft: false,
    })

    const doc = result.docs[0]
    if (doc?.seo?.title || doc?.seo?.description) {
      const ogMedia =
        typeof doc.seo.ogImage === 'object' && doc.seo.ogImage !== null
          ? (doc.seo.ogImage as { url?: string })
          : null

      return {
        title: doc.seo.title || 'Trạm Dừng Cảm Xúc',
        description:
          doc.seo.description || 'Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.',
        openGraph: ogMedia?.url ? { images: [ogMedia.url] } : undefined,
      }
    }
  } catch {
    // Fallback to default
  }

  return {
    title: 'Trạm Dừng Cảm Xúc',
    description: 'Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.',
  }
}

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  let pageDoc = null
  try {
    const result = await payload.find({
      collection: 'pages',
      where: {
        and: [{ slug: { equals: '/' } }, { _status: { equals: 'published' } }],
      },
      limit: 1,
      draft: false,
    })
    pageDoc = result.docs[0] || null
  } catch {
    pageDoc = null
  }

  if (pageDoc?.puckData && (pageDoc.puckData as Data).content?.length > 0) {
    const resolvedData = await resolveServerData(pageDoc.puckData as Data, { pageSlug: '/' })
    return <Render config={puckConfig} data={resolvedData} />
  }

  // Temporary brand homepage fallback (from T0-03)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-gradient p-6 text-center">
      <div className="flex max-w-md flex-col items-center rounded-card border border-deep-navy/10 bg-warm-ivory/85 p-8 shadow-soft backdrop-blur-sm">
        <Logo width={160} />

        <h1 className="mt-6 font-display text-3xl uppercase tracking-tight text-deep-navy sm:text-4xl">
          Trạm Dừng Cảm Xúc
        </h1>

        <HeartLine className="my-4 text-accent-pink" width={72} height={28} />

        <p className="font-quote text-lg italic text-deep-navy/85">
          Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.
        </p>
      </div>
    </main>
  )
}
