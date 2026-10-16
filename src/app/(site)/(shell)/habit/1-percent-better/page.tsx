import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { vi } from '@/lib/i18n/vi'
import { getHabitProduct } from '@/lib/habit.server'
import { HabitOfferClient } from '@/components/habit/HabitOfferClient'

import { RefreshOnSave } from '@/components/site/RefreshOnSave'
import { getAdminPreviewUser } from '@/lib/live-preview.server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: vi.habit.metadata.offerPage.title,
  description: vi.habit.metadata.offerPage.description,
  openGraph: {
    title: vi.habit.metadata.offerPage.ogTitle,
    description: vi.habit.metadata.offerPage.ogDescription,
  },
}

interface HabitOfferPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HabitOfferPage({ searchParams }: HabitOfferPageProps) {
  const search = (await searchParams) || {}
  // REVIEW-REQUIRED: Chỉ phiên admin Payload (users collection) mới được đọc bản nháp của sản phẩm.
  // Khách vãng lai và học viên dù có preview=1 vẫn chỉ đọc bản đã xuất bản.
  const adminUser = await getAdminPreviewUser(search)

  const product = await getHabitProduct(undefined, {
    draft: Boolean(adminUser),
    previewId: typeof search.previewId === 'string' ? search.previewId : undefined,
    user: adminUser,
  })

  if (!product) {
    notFound()
  }

  return (
    <>
      {adminUser && <RefreshOnSave />}
      <HabitOfferClient product={product} />
    </>
  )
}
