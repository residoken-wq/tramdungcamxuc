import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { vi } from '@/lib/i18n/vi'
import { getTechniques } from '@/lib/habit.server'
import { getHabitJourneyContent } from '@/lib/habit/journey-content.server'
import { HabitFlow } from '@/components/habit/flow/HabitFlow'

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
  const payload = await getPayload({ config: await config })

  // Đọc cài đặt số ngày hành trình từ siteSettings (mặc định 28)
  let habitJourneyDays = 28
  try {
    const settings = await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })
    if (typeof settings?.habitJourneyDays === 'number' && settings.habitJourneyDays > 0) {
      habitJourneyDays = settings.habitJourneyDays
    }
  } catch {
    habitJourneyDays = 28
  }

  const [techniques, journeyContent] = await Promise.all([
    getTechniques(payload),
    getHabitJourneyContent(payload).catch((error) => {
      console.error('[HabitLoopPage] Failed to fetch habit journey content:', error)
      return null
    }),
  ])

  return (
    <div className="w-full">
      <HabitFlow
        techniques={techniques}
        journeyDays={habitJourneyDays}
        onePercent={journeyContent?.onePercent}
      />
    </div>
  )
}
