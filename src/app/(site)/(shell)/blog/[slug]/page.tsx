import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { vi } from '@/lib/i18n/vi'
import { getPostDetail } from '@/lib/detail-pages.server'

import { PostDetail } from '@/components/site/PostDetail'
import { DetailLivePreview } from '@/components/site/DetailLivePreview'
import { getDetailPreview } from '@/lib/live-preview.server'
import type { PreviewSearchParams } from '@/lib/live-preview'

export const dynamic = 'force-dynamic'

type BlogDetailPageProps = {
  searchParams: Promise<PreviewSearchParams>
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostDetail(slug)

  if (post) {
    return {
      title: `${post.title} | Trạm Dừng Cảm Xúc`,
      description: post.series || undefined,
      openGraph: post.thumbnail?.src ? { images: [post.thumbnail.src] } : undefined,
    }
  }

  return {
    title: `${vi.notFound.title} | Trạm Dừng Cảm Xúc`,
  }
}

export default async function BlogDetailPage({ params, searchParams }: BlogDetailPageProps) {
  const { slug } = await params
  const preview = await getDetailPreview('posts', slug, await searchParams)
  if (preview) return <DetailLivePreview collection="posts" initialData={preview} />
  const post = await getPostDetail(slug)

  if (!post) {
    notFound()
  }

  return <PostDetail post={post} />
}
