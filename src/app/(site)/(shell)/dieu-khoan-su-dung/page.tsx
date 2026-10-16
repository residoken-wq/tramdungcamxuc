import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLegalPageData, getLegalPageMetadata } from '@/lib/site-shell.server'
import { LegalPageView } from '@/components/site/LegalPageView'

import { RefreshOnSave } from '@/components/site/RefreshOnSave'
import { getAdminPreviewUser } from '@/lib/live-preview.server'

export const dynamic = 'force-dynamic'

const SLUG = 'dieu-khoan-su-dung'

export async function generateMetadata(): Promise<Metadata> {
  return getLegalPageMetadata(SLUG)
}

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DieuKhoanSuDungPage({ searchParams }: PageProps) {
  const search = (await searchParams) || {}
  // REVIEW-REQUIRED: Chỉ phiên admin Payload (users collection) mới được đọc bản nháp của trang pháp lý.
  // Khách vãng lai và học viên dù có preview=1 vẫn chỉ đọc bản đã xuất bản.
  const adminUser = await getAdminPreviewUser(search)

  const data = await getLegalPageData(SLUG, {
    draft: Boolean(adminUser),
    previewId: typeof search.previewId === 'string' ? search.previewId : undefined,
    user: adminUser,
  })
  if (!data) notFound()
  return (
    <>
      {adminUser && <RefreshOnSave />}
      <LegalPageView page={data.page} />
    </>
  )
}
