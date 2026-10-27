import React from 'react'
import type { Metadata } from 'next'
import { vi } from '@/lib/i18n/vi'
import { getTechniques } from '@/lib/habit.server'
import { getHabitJourneyContent } from '@/lib/habit/journey-content.server'
import { HabitLoopWizard } from '@/components/habit/HabitLoopWizard'
import { OnePercentSection } from '@/components/habit/OnePercentSection'

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
  const [techniques, journeyContent] = await Promise.all([
    getTechniques(),
    getHabitJourneyContent().catch((error) => {
      console.error('[HabitLoopPage] Failed to fetch habit journey content:', error)
      return null
    }),
  ])

  return (
    <div className="w-full">
      <OnePercentSection onePercent={journeyContent?.onePercent} />
      <HabitLoopWizard techniques={techniques} />
    </div>
  )
}
