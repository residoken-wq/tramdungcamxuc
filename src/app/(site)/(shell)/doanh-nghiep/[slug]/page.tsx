import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Render } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'
import { vi } from '@/lib/i18n/vi'
import { getPuckPageBySlug, getProgramDetail } from '@/lib/detail-pages.server'

import { ProgramDetail } from '@/components/site/ProgramDetail'
import { DetailLivePreview } from '@/components/site/DetailLivePreview'
import { getDetailPreview } from '@/lib/live-preview.server'
import type { PreviewSearchParams } from '@/lib/live-preview'

export const dynamic = 'force-dynamic'

type ProgramDetailPageProps = {
  searchParams: Promise<PreviewSearchParams>
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ProgramDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const fullSlug = `doanh-nghiep/${slug}`

  // 1. Kiểm tra trang Puck trước
  const puckPage = await getPuckPageBySlug(fullSlug)
  if (puckPage) {
    const ogMedia =
      typeof puckPage.seo?.ogImage === 'object' && puckPage.seo.ogImage !== null
        ? (puckPage.seo.ogImage as { url?: string })
        : null
    return {
      title:
        puckPage.seo?.title || puckPage.title || 'Chương trình doanh nghiệp | Trạm Dừng Cảm Xúc',
      description: puckPage.seo?.description || undefined,
      openGraph: ogMedia?.url ? { images: [ogMedia.url] } : undefined,
    }
  }

  // 2. Kiểm tra collection programs
  const program = await getProgramDetail(slug)
  if (program) {
    return {
      title: `${program.name} | Trạm Dừng Cảm Xúc`,
      description: program.learnerGroup || undefined,
    }
  }

  return {
    title: `${vi.notFound.title} | Trạm Dừng Cảm Xúc`,
  }
}

export default async function ProgramDetailPage({ params, searchParams }: ProgramDetailPageProps) {
  const { slug } = await params
  const preview = await getDetailPreview('programs', slug, await searchParams)
  if (preview) return <DetailLivePreview collection="programs" initialData={preview} />
  const fullSlug = `doanh-nghiep/${slug}`

  // 1. Ưu tiên render trang Puck nếu có bản published
  const puckPage = await getPuckPageBySlug(fullSlug)
  if (puckPage) {
    return <Render config={puckConfig} data={puckPage.puckData} />
  }

  // 2. Nạp dữ liệu từ collection programs
  const program = await getProgramDetail(slug)
  if (!program) {
    notFound()
  }

  return <ProgramDetail program={program} />
}
