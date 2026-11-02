import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
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

  // HB-15c: the journey length shown on the offer page follows siteSettings (default 28)
  let journeyDays = 28
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 })
    if (typeof settings?.habitJourneyDays === 'number' && settings.habitJourneyDays > 0) {
      journeyDays = settings.habitJourneyDays
    }
  } catch {
    journeyDays = 28
  }

  return (
    <>
      {adminUser && <RefreshOnSave />}
      <HabitOfferClient product={product} journeyDays={journeyDays} />
    </>
  )
}
