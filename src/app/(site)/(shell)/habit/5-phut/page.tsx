import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { vi } from '@/lib/i18n/vi'
import { getTechniques } from '@/lib/habit.server'
import { getHabitJourneyContent, withDiagnoseFallback } from '@/lib/habit/journey-content.server'
import { getHabitStageGate } from '@/lib/habit/stage-gate.server'
import type { HabitStageGateResult } from '@/lib/habit/stage-gate'
import { HabitTrackerApp } from '@/components/habit/zip/HabitTrackerApp'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: vi.habit.metadata.loop5min.title,
  description: vi.habit.metadata.loop5min.description,
  openGraph: {
    title: vi.habit.metadata.loop5min.ogTitle,
    description: vi.habit.metadata.loop5min.ogDescription,
  },
}

export default async function HabitLoopPage({
  searchParams,
}: {
  searchParams?: Promise<{ buoc?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const rawBuoc = resolvedSearchParams?.buoc
  let initialStepParam: number | undefined
  if (rawBuoc && /^[1-6]$/.test(rawBuoc)) {
    initialStepParam = parseInt(rawBuoc, 10)
  }

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

  const [techniques, journeyContent, initialGate] = await Promise.all([
    getTechniques(payload),
    getHabitJourneyContent(payload).catch((error) => {
      console.error('[HabitLoopPage] Failed to fetch habit journey content:', error)
      return null
    }),
    // QA DP-03c: on an unexpected error fall back to the pre-DP-03 behaviour (no gate, step 6
    // asks for email + Turnstile) instead of 'login', which looped signed-in customers.
    getHabitStageGate().catch((error): HabitStageGateResult => {
      console.error('[HabitLoopPage] Failed to resolve stage gate status:', error)
      return { status: 'ok' }
    }),
  ])
  // Step 1 falls back to the "Câu hỏi chẩn đoán" collection while its own survey is empty.
  const diagnose = await withDiagnoseFallback(journeyContent?.diagnose, payload)

  return (
    <div className="w-full">
      <HabitTrackerApp
        techniques={techniques}
        journeyDays={habitJourneyDays}
        diagnose={diagnose}
        stepQuotes={journeyContent?.stepQuotes}
        loopContent={journeyContent?.loop}
        privacyNote={journeyContent?.privacyNote}
        dp01Content={journeyContent?.dp01Content}
        initialGate={initialGate}
        initialStepParam={initialStepParam}
      />
    </div>
  )
}
