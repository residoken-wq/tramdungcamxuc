'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import { ProgressGrid, type ProgressDayItem } from '@/components/ui/ProgressGrid'
import { CheckInModal } from './CheckInModal'
import { TrackerSummaryCard } from './TrackerSummaryCard'
import type { EmotionKey } from '@/lib/emotions'
import { calculateTrackerStats } from '@/lib/habit/tracker-stats'
import type { PublicCertificateData, CertificateEligibility } from '@/lib/habit/certificate-types'

export interface InitialCheckinData {
  day: number
  done: boolean
  emotion?: string | null
  note?: string | null
}

export interface TrackerDashboardProps {
  planId: number
  identityStatement?: string | null
  currentDay: number
  initialCheckins: InitialCheckinData[]
  readOnly?: boolean
  isTrialOrExpired?: boolean
  buyUrl: string
  initialCertificate?: PublicCertificateData | null
  eligibility?: CertificateEligibility | null
  customerName?: string | null
  journeyDays?: number
}

export function TrackerDashboard({
  identityStatement,
  currentDay,
  initialCheckins,
  readOnly = false,
  isTrialOrExpired = false,
  buyUrl,
  initialCertificate,
  eligibility,
  customerName,
  journeyDays: propJourneyDays,
}: TrackerDashboardProps) {
  const [checkins, setCheckins] = useState<InitialCheckinData[]>(initialCheckins)
  const [activeModalDay, setActiveModalDay] = useState<number | null>(null)

  const journeyDays = propJourneyDays ?? eligibility?.journeyDays ?? 28

  // Map checkins to day map
  const checkinMap = new Map<number, InitialCheckinData>()
  for (const c of checkins) {
    checkinMap.set(c.day, c)
  }

  // Construct journeyDays for ProgressGrid
  const gridDays: ProgressDayItem[] = []
  for (let d = 1; d <= journeyDays; d++) {
    const entry = checkinMap.get(d)
    const isDone = Boolean(entry?.done)
    const isFuture = d > currentDay

    let status: ProgressDayItem['status']
    if (isFuture) {
      status = 'future'
    } else if (isDone) {
      status = 'done'
    } else if (d === currentDay) {
      status = 'today'
    } else {
      status = 'missed'
    }

    gridDays.push({
      day: d,
      status,
      emotionKey: entry?.emotion || undefined,
      note: entry?.note || undefined,
    })
  }

  // Check condition: hôm qua không tick mà hôm nay chưa tick
  // Yesterday is currentDay - 1. Today is currentDay.
  const hasYesterday = currentDay >= 2
  const yesterdayCheckin = hasYesterday ? checkinMap.get(currentDay - 1) : null
  const yesterdayDone = Boolean(yesterdayCheckin?.done)
  const todayCheckin = checkinMap.get(currentDay)
  const todayDone = Boolean(todayCheckin?.done)

  const showMissedOneDayEncouragement =
    hasYesterday && !yesterdayDone && !todayDone && currentDay <= journeyDays

  // Handle day click
  const handleSelectDay = (day: number) => {
    if (day > currentDay) return
    setActiveModalDay(day)
  }

  // Handle success from modal
  const handleCheckinSuccess = (
    day: number,
    done: boolean,
    emotion?: EmotionKey | null,
    note?: string | null,
  ) => {
    setCheckins((prev) => {
      const filtered = prev.filter((c) => c.day !== day)
      return [...filtered, { day, done, emotion, note }]
    })
  }

  const selectedEntry = activeModalDay ? checkinMap.get(activeModalDay) : null
  const stats = calculateTrackerStats(checkins)

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* 1. Header & Identity Statement */}
      <div className="bg-warm-ivory rounded-card border border-deep-navy/10 p-6 sm:p-8 shadow-soft text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-ui font-semibold bg-lavender-mist/60 text-deep-navy">
          <span className="w-2 h-2 rounded-full bg-accent-pink" />
          <span>{vi.tracker.currentDayBadge(Math.min(journeyDays, currentDay), journeyDays)}</span>
        </div>

        <h1 className="font-quote italic text-lg sm:text-xl text-deep-navy font-normal max-w-lg mx-auto">
          &ldquo;{vi.tracker.votingQuestion}&rdquo;
        </h1>

        {identityStatement && (
          <div className="p-3.5 rounded-xl bg-warm-ivory/80 border border-deep-navy/10 inline-block text-left max-w-md w-full">
            <p className="text-xs font-ui uppercase font-bold text-bright-magenta mb-1">
              {vi.tracker.identityCommitmentLabel}
            </p>
            <p className="font-sans text-sm font-medium text-deep-navy leading-relaxed">
              {identityStatement}
            </p>
          </div>
        )}
      </div>

      {/* 2. Banners */}
      {readOnly && (
        <div className="p-4 rounded-xl border border-bright-magenta/20 bg-soft-pink/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-xs sm:text-sm font-sans text-deep-navy font-medium">
            {vi.tracker.expiredNotice.message}
          </p>
          <Link
            href={buyUrl}
            className="shrink-0 px-4 py-1.5 rounded-full bg-bright-magenta text-warm-ivory font-ui font-semibold text-xs hover:bg-bright-magenta/90 transition-colors motion-reduce:transition-none shadow-xs"
          >
            {vi.tracker.expiredNotice.buyButton}
          </Link>
        </div>
      )}

      {showMissedOneDayEncouragement && !readOnly && (
        <div className="p-4 rounded-xl border border-butter-cream bg-butter-cream/40 flex items-center gap-3">
          <span className="text-2xl leading-none" role="img" aria-hidden="true">
            🌱
          </span>
          <p className="text-xs sm:text-sm font-sans font-medium text-deep-navy">
            {vi.tracker.missedOneDayEncouragement}
          </p>
        </div>
      )}

      {/* 3. Lưới hành trình */}
      <div className="bg-warm-ivory rounded-card border border-deep-navy/10 p-6 sm:p-8 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-deep-navy/10 pb-3">
          <h2 className="font-ui font-bold text-base sm:text-lg text-deep-navy">
            {vi.tracker.pageTitle}
          </h2>
          <span className="text-xs font-sans text-deep-navy/60">
            {stats.completedDays} / {journeyDays} {vi.tracker.daysCompletedSuffix}
          </span>
        </div>

        <ProgressGrid
          days={gridDays}
          totalDays={journeyDays}
          onSelectDay={handleSelectDay}
          readOnly={readOnly}
        />
      </div>

      {/* 4. Tổng kết từ ngày cuối trở đi, khi đã có chứng nhận hoặc khi đã trải nghiệm */}
      {(currentDay >= journeyDays ||
        Boolean(initialCertificate) ||
        eligibility?.outcome === 'experienced') && (
        <div className="pt-4">
          <TrackerSummaryCard
            stats={stats}
            isTrialOrExpired={isTrialOrExpired}
            buyUrl={buyUrl}
            initialCertificate={initialCertificate}
            eligibility={eligibility}
            customerName={customerName}
            journeyDays={journeyDays}
          />
        </div>
      )}

      {/* 5. Modal Check-in */}
      {activeModalDay !== null && (
        <CheckInModal
          day={activeModalDay}
          initialDone={Boolean(selectedEntry?.done)}
          initialEmotion={(selectedEntry?.emotion as EmotionKey) || null}
          initialNote={selectedEntry?.note || ''}
          isOpen={true}
          onClose={() => setActiveModalDay(null)}
          onSuccess={handleCheckinSuccess}
          readOnly={readOnly}
        />
      )}
    </div>
  )
}
