import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StyledRender } from '@/components/design/StyledRender'
import { puckConfig } from '@/puck/config'
import { vi } from '@/lib/i18n/vi'
import { getPuckPageBySlug, getServiceDetail } from '@/lib/detail-pages.server'

import { ServiceDetail } from '@/components/site/ServiceDetail'
import { DetailLivePreview } from '@/components/site/DetailLivePreview'
import { RefreshOnSave } from '@/components/site/RefreshOnSave'
import { getAdminPreviewUser, getDetailPreview } from '@/lib/live-preview.server'
import type { PreviewSearchParams } from '@/lib/live-preview'

export const dynamic = 'force-dynamic'

type CoachingDetailPageProps = {
  searchParams: Promise<PreviewSearchParams>
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: CoachingDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const fullSlug = `coaching/${slug}`

  // 1. Kiểm tra trang Puck trước
  const puckPage = await getPuckPageBySlug(fullSlug)
  if (puckPage) {
    const ogMedia =
      typeof puckPage.seo?.ogImage === 'object' && puckPage.seo.ogImage !== null
        ? (puckPage.seo.ogImage as { url?: string })
        : null
    return {
      title:
        puckPage.seo?.title || puckPage.title || `${vi.library.tabs.courses} | Trạm Dừng Cảm Xúc`,
      description: puckPage.seo?.description || undefined,
      openGraph: ogMedia?.url ? { images: [ogMedia.url] } : undefined,
    }
  }

  // 2. Kiểm tra collection services
  const service = await getServiceDetail(slug)
  if (service) {
    return {
      title: `${service.name} | Trạm Dừng Cảm Xúc`,
      description: service.audience || undefined,
    }
  }

  return {
    title: `${vi.notFound.title} | Trạm Dừng Cảm Xúc`,
  }
}

export default async function CoachingDetailPage({
  params,
  searchParams,
}: CoachingDetailPageProps) {
  const { slug } = await params
  const search = (await searchParams) || {}
  const preview = await getDetailPreview('services', slug, search)
  if (preview) return <DetailLivePreview collection="services" initialData={preview} />
  const fullSlug = `coaching/${slug}`

  // REVIEW-REQUIRED: Chỉ phiên admin Payload (users collection) mới được đọc bản nháp sản phẩm trong trang Puck.
  // Khách vãng lai và học viên dù có preview=1 vẫn chỉ đọc bản đã xuất bản.
  const adminUser = await getAdminPreviewUser(search)

  // 1. Ưu tiên render trang Puck nếu có bản published
  const puckPage = await getPuckPageBySlug(fullSlug, {
    draft: Boolean(adminUser),
    previewId: typeof search.previewId === 'string' ? search.previewId : undefined,
    user: adminUser,
  })
  if (puckPage) {
    return (
      <>
        {adminUser && <RefreshOnSave />}
        <StyledRender config={puckConfig} data={puckPage.puckData} />
      </>
    )
  }

  // 2. Nạp dữ liệu từ collection services
  const service = await getServiceDetail(slug)
  if (!service) {
    notFound()
  }

  return <ServiceDetail service={service} />
}
