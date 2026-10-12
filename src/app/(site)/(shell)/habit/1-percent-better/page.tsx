import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { vi } from '@/lib/i18n/vi'
import { getHabitProduct } from '@/lib/habit.server'
import { HabitOfferClient } from '@/components/habit/HabitOfferClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: vi.habit.metadata.offerPage.title,
  description: vi.habit.metadata.offerPage.description,
  openGraph: {
    title: vi.habit.metadata.offerPage.ogTitle,
    description: vi.habit.metadata.offerPage.ogDescription,
  },
}

export default async function HabitOfferPage() {
  const product = await getHabitProduct()

  if (!product) {
    notFound()
  }

  return <HabitOfferClient product={product} />
}
