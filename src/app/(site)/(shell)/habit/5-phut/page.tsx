import React from 'react'
import type { Metadata } from 'next'
import { vi } from '@/lib/i18n/vi'
import { getTechniques } from '@/lib/habit.server'
import { HabitLoopWizard } from '@/components/habit/HabitLoopWizard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: vi.habit.metadata.loop5min.title,
  description: vi.habit.metadata.loop5min.description,
  openGraph: {
    title: vi.habit.metadata.loop5min.ogTitle,
    description: vi.habit.metadata.loop5min.ogDescription,
  },
}

export default async function HabitLoopPage() {
  const techniques = await getTechniques()

  return <HabitLoopWizard techniques={techniques} />
}
