'use client'

import React from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import { GROWTH_MIRROR_PATH } from '@/lib/products'
import type { TrackerStats } from '@/lib/habit/tracker-stats'

export interface TrackerSummaryCardProps {
  stats: TrackerStats
  isTrialOrExpired: boolean
  buyUrl: string
}

export function TrackerSummaryCard({ stats, isTrialOrExpired, buyUrl }: TrackerSummaryCardProps) {
  const { completedDays, mostFrequentEmotion } = stats

  return (
    <div className="w-full max-w-2xl mx-auto rounded-card border-2 border-bright-magenta/20 bg-linear-to-br from-white via-soft-pink/30 to-lavender-mist/40 p-6 sm:p-8 shadow-md space-y-6">
      <div className="text-center space-y-2">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-ui font-bold bg-bright-magenta text-white shadow-xs">
          {vi.tracker.summary.badge}
        </span>
        <h2 className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy">
          {vi.tracker.summary.title}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-deep-navy/80 max-w-md mx-auto">
          {vi.tracker.summary.congrats}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Số ngày hoàn thành */}
        <div className="p-4 rounded-xl border border-deep-navy/10 bg-white/90 text-center space-y-1">
          <p className="text-xs font-ui uppercase font-semibold text-deep-navy/60">
            Tiến độ hoàn thành
          </p>
          <p className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy">
            {completedDays}{' '}
            <span className="text-base text-deep-navy/60 font-normal">/ 21 ngày</span>
          </p>
          <div className="w-full bg-deep-navy/10 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-accent-pink h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((completedDays / 21) * 100))}%` }}
            />
          </div>
        </div>

        {/* Cảm xúc gặp nhiều nhất */}
        <div className="p-4 rounded-xl border border-deep-navy/10 bg-white/90 text-center space-y-1 flex flex-col justify-center">
          <p className="text-xs font-ui uppercase font-semibold text-deep-navy/60">
            Cảm xúc đồng hành nhiều nhất
          </p>
          {mostFrequentEmotion ? (
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-3xl leading-none" role="img" aria-hidden="true">
                {mostFrequentEmotion.emoji}
              </span>
              <div className="text-left">
                <p className="font-ui font-bold text-base text-deep-navy">
                  {mostFrequentEmotion.label}
                </p>
                <p className="text-xs text-deep-navy/60">
                  {mostFrequentEmotion.count} ngày xuất hiện
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-sans italic text-deep-navy/60 mt-1">
              {vi.tracker.summary.noEmotion}
            </p>
          )}
        </div>
      </div>

      {/* Hành động chuyển đổi */}
      <div className="pt-4 border-t border-deep-navy/10 flex flex-col sm:flex-row items-center justify-center gap-3">
        {isTrialOrExpired && (
          <Link
            href={buyUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-bright-magenta text-white font-ui font-bold text-sm hover:bg-bright-magenta/90 shadow-sm transition-all"
          >
            {vi.tracker.summary.buyButton}
          </Link>
        )}
        <Link
          href={GROWTH_MIRROR_PATH}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full border-2 border-accent-pink text-deep-navy bg-white hover:bg-soft-pink font-ui font-bold text-sm transition-all shadow-xs"
        >
          {vi.tracker.summary.bookingButton}
        </Link>
      </div>
    </div>
  )
}
