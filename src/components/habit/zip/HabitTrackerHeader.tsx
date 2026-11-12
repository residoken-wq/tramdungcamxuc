'use client'

import React from 'react'
import { PlayCircle } from 'lucide-react'
import type { HabitStep } from './types'
import { DEFAULT_DP01_CONTENT, type Dp01HeaderContent } from '@/lib/habit/dp01-content'
import { vi } from '@/lib/i18n/vi'

export interface HabitTrackerHeaderProps {
  onOpenToolkit?: () => void
  hasVideos?: boolean
  currentStep?: HabitStep
  maxReachedStep?: number
  onNavigateStep?: (step: HabitStep) => void
  onStageClick?: (step: HabitStep) => void
  headerContent?: Dp01HeaderContent
}

export function HabitTrackerHeader({
  onOpenToolkit,
  hasVideos = false,
  headerContent = DEFAULT_DP01_CONTENT.header,
}: HabitTrackerHeaderProps) {
  const badgeText = headerContent.badgeText?.trim() || ''
  const showTopBar = Boolean(badgeText) || Boolean(hasVideos && onOpenToolkit)

  return (
    <header className="w-full mb-4 pt-1">
      {/* Top Bar with optional Badge on left and video guide button on right */}
      {showTopBar && (
        <div
          className={`flex items-center gap-3 mb-3 ${badgeText ? 'justify-between' : 'justify-end'}`}
        >
          {badgeText && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soft-pink/70 border border-bright-magenta/20 text-deep-navy text-[11px] sm:text-xs font-semibold tracking-wider uppercase font-ui">
                <span className="w-2 h-2 rounded-full bg-bright-magenta animate-pulse" />
                <span>{badgeText}</span>
              </div>
            </div>
          )}

          {hasVideos && onOpenToolkit && (
            <button
              type="button"
              onClick={onOpenToolkit}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-deep-navy/10 bg-white hover:bg-warm-ivory text-deep-navy font-medium text-sm font-ui transition-all shadow-sm active:scale-95 group"
              title="Mở cẩm nang video của Coach Hana Lương"
            >
              <PlayCircle className="w-4 h-4 text-bright-magenta flex-shrink-0" />
              <span className="text-deep-navy">{vi.dp01.videoGuide}</span>
            </button>
          )}
        </div>
      )}

      {/* Main Title: Font Anton. Xây Thói Quen màu Navy, Dựng Thương Hiệu màu Magenta */}
      <div className="space-y-1.5 text-left">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-wide uppercase leading-tight">
          <span className="text-deep-navy">{headerContent.titleLine1}</span>
          <span className="text-deep-navy/70 mx-2 font-black">—</span>
          <span className="text-bright-magenta">{headerContent.titleLine2}</span>
        </h1>

        {/* Subtitle: FORM HABIT · BUILD IDENTITY badge + tagline Playfair Italic */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="bg-soft-pink/60 px-2.5 py-0.5 rounded-md inline-block font-semibold text-xs border border-accent-pink/20 shadow-sm font-ui uppercase tracking-wider text-bright-magenta">
            {headerContent.seriesBadge}
          </span>
          <span className="text-deep-navy/70 text-xs">|</span>
          <span className="font-quote italic text-deep-navy/85 text-xs sm:text-sm">
            {headerContent.tagline}
          </span>
        </div>

        {/* Đoạn văn dẫn */}
        {headerContent.introText && (
          <p className="text-xs sm:text-sm text-deep-navy/75 font-ui leading-relaxed pt-1.5 max-w-3xl">
            {headerContent.introText}
          </p>
        )}
      </div>
    </header>
  )
}
