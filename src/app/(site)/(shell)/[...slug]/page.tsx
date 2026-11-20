import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  BuilderPage,
  builderPageMetadata,
  findPublishedBuilderPage,
} from '@/lib/pages/puck-override.server'

// Pages read published CMS content on each request; never prerender at build (Docker builds have no DB or secret).
export const dynamic = 'force-dynamic'

type CatchAllPageProps = {
  params: Promise<{
    slug: string[]
  }>
}

export async function generateMetadata({ params }: CatchAllPageProps): Promise<Metadata> {
  const { slug } = await params
  const doc = await findPublishedBuilderPage(slug.join('/'))
  if (doc) return builderPageMetadata(doc)
  return {
    title: 'Trang không tồn tại | Trạm Dừng Cảm Xúc',
  }
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params
  const pageSlug = slug.join('/')
  const doc = await findPublishedBuilderPage(pageSlug)
  if (!doc) {
    notFound()
  }
  return <BuilderPage doc={doc} slug={pageSlug} />
}
