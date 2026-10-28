'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import { ProgressGrid } from '@/components/ui/ProgressGrid'
import { CheckInModal } from './CheckInModal'
import { TrackerSummaryCard } from './TrackerSummaryCard'
import type { EmotionKey } from '@/lib/emotions'
import { calculateTrackerStats } from '@/lib/habit/tracker-stats'
import type { PublicCertificateData, CertificateEligibility } from '@/lib/habit/certificate-types'
import type { CheckinStatus } from '@/lib/habit/rhythm'
import { buildTrackerView } from '@/lib/habit/tracker-view'
import { requiredDays } from '@/lib/habit/journey'

export interface InitialCheckinData {
  day: number
  done?: boolean
  status?: CheckinStatus | null
  emotion?: string | null
  note?: string | null
}

export interface TrackerDashboardProps {
  planId: number
  identityStatement?: string | null
  anchorHabit?: string | null
  twoMinuteAction?: string | null
  rhythmDays?: string[] | null
  startDate?: string | Date | null
  stationNames?: string[] | null
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
  anchorHabit,
  twoMinuteAction,
  rhythmDays,
  startDate,
  stationNames,
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

  // Góc nhìn tính toán từ hàm thuần tracker-view (HB-11)
  const view = React.useMemo(() => {
    return buildTrackerView(
      {
        startDate,
        journeyDays,
        rhythmDays,
      },
      checkins,
      new Date(),
      stationNames,
    )
  }, [startDate, journeyDays, rhythmDays, checkins, stationNames])

  // Chuyển đổi các trạm sang cấu trúc ProgressStationItem cho ProgressGrid
  const stations = React.useMemo(() => {
    return view.stations.map((st) => ({
      name: st.name,
      fromDay: st.fromDay,
      toDay: st.toDay,
      votedCount: st.votedCount,
      votingDaysTotal: st.votingDaysTotal,
      days: st.days.map((d) => ({
        day: d.day,
        status: d.state,
        emotionKey: d.emotionKey,
        note: d.note,
        disabled: d.day > currentDay,
      })),
    }))
  }, [view.stations, currentDay])

  // Banner lỡ nhịp 1 ngày theo luật nhịp tuần (HB-11)
  const showMissedOneDayEncouragement = view.missedRun.count === 1 && !readOnly

  // Số ngày bỏ phiếu tối thiểu cần đạt để nhận chứng nhận (90%)
  const minRequiredVotingDays = requiredDays(view.votingDaysTotal, eligibility?.minPercent ?? 90)

  // Handle day click
  const handleSelectDay = (day: number) => {
    if (day > currentDay) return
    setActiveModalDay(day)
  }

  // Handle success from modal
  const handleCheckinSuccess = (
    day: number,
    doneOrStatus: boolean | CheckinStatus,
    emotion?: EmotionKey | null,
    note?: string | null,
  ) => {
    const status: CheckinStatus =
      typeof doneOrStatus === 'string' ? doneOrStatus : doneOrStatus ? 'voted' : 'missed'
    const done = status === 'voted' || status === 'minimal'

    setCheckins((prev) => {
      const filtered = prev.filter((c) => c.day !== day)
      return [...filtered, { day, done, status, emotion, note }]
    })
  }

  const selectedEntry = activeModalDay ? checkinMap.get(activeModalDay) : null
  const activeDayView = activeModalDay
    ? view.stations.flatMap((s) => s.days).find((d) => d.day === activeModalDay)
    : null
  const stats = calculateTrackerStats(checkins)

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* 1. Header, Badges & Identity Commitment */}
      <div className="bg-warm-ivory rounded-card border border-deep-navy/10 p-6 sm:p-8 shadow-soft text-center space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-ui font-semibold bg-lavender-mist/60 text-deep-navy">
            <span className="w-2 h-2 rounded-full bg-accent-pink" />
            <span>
              {vi.tracker.currentDayBadge(Math.min(journeyDays, currentDay), journeyDays)}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-ui font-semibold bg-mint-haze/80 text-deep-navy border border-deep-navy/10">
            <span className="w-2 h-2 rounded-full bg-deep-navy" />
            <span>{vi.hb11.streakBadge(view.streak)}</span>
          </div>
        </div>

        <h1 className="font-quote italic text-lg sm:text-xl text-deep-navy font-normal max-w-lg mx-auto">
          &ldquo;{vi.tracker.votingQuestion}&rdquo;
        </h1>

        <div className="space-y-2.5 max-w-md w-full mx-auto text-left">
          {identityStatement && (
            <div className="p-3.5 rounded-xl bg-warm-ivory/80 border border-deep-navy/10">
              <p className="text-xs font-ui uppercase font-bold text-bright-magenta mb-1">
                {vi.tracker.identityCommitmentLabel}
              </p>
              <p className="font-sans text-sm font-medium text-deep-navy leading-relaxed">
                {identityStatement}
              </p>
            </div>
          )}

          {anchorHabit?.trim() && (
            <div className="p-3.5 rounded-xl bg-warm-ivory/80 border border-deep-navy/10">
              <p className="text-xs font-ui uppercase font-bold text-bright-magenta mb-1">
                {vi.hb11.anchorHabitLabel}
              </p>
              <p className="font-sans text-sm font-medium text-deep-navy leading-relaxed">
                {anchorHabit.trim()}
              </p>
            </div>
          )}

          {twoMinuteAction?.trim() && (
            <div className="p-3.5 rounded-xl bg-warm-ivory/80 border border-deep-navy/10">
              <p className="text-xs font-ui uppercase font-bold text-bright-magenta mb-1">
                {vi.hb11.twoMinuteLabel}
              </p>
              <p className="font-sans text-sm font-medium text-deep-navy leading-relaxed">
                {twoMinuteAction.trim()}
              </p>
            </div>
          )}
        </div>
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

      {/* 3. Lưới hành trình theo trạm */}
      <div className="bg-warm-ivory rounded-card border border-deep-navy/10 p-6 sm:p-8 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deep-navy/10 pb-3">
          <h2 className="font-ui font-bold text-base sm:text-lg text-deep-navy">
            {vi.tracker.pageTitle}
          </h2>
          <span className="text-xs font-sans text-deep-navy/80">
            {vi.hb11.progress90(view.votedCount, view.votingDaysTotal, minRequiredVotingDays)}
          </span>
        </div>

        <ProgressGrid
          stations={stations}
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
          initialStatus={selectedEntry?.status ?? null}
          isVotingDay={activeDayView ? activeDayView.isVotingDay : true}
          twoMinuteAction={twoMinuteAction}
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
