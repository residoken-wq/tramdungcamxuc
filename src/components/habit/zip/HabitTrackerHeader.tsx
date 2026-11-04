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
  currentStep = 1,
  maxReachedStep = 1,
  onNavigateStep,
  onStageClick,
  headerContent = DEFAULT_DP01_CONTENT.header,
}: HabitTrackerHeaderProps) {
  // Tính % tiến trình cho từng giai đoạn
  const stepNum = typeof currentStep === 'number' ? currentStep : 7

  let progressStage1 = 0
  if (stepNum === 1) progressStage1 = 50
  else if (stepNum >= 2) progressStage1 = 100

  let progressStage2 = 0
  if (stepNum === 3) progressStage2 = 25
  else if (stepNum === 4) progressStage2 = 50
  else if (stepNum === 5) progressStage2 = 75
  else if (stepNum >= 6) progressStage2 = 100

  let progressStage3 = 0
  if (stepNum >= 7 || currentStep === 'result') progressStage3 = 100

  const isStage1Active = stepNum === 1 || stepNum === 2
  const isStage2Active = stepNum >= 3 && stepNum <= 6
  const isStage3Active = stepNum >= 7 || currentStep === 'result'

  return (
    <header className="w-full mb-6 pt-1">
      {/* Top Bar with Badge on left and video guide button on right */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soft-pink/70 border border-bright-magenta/20 text-deep-navy text-[11px] sm:text-xs font-semibold tracking-wider uppercase font-ui">
            <span className="w-2 h-2 rounded-full bg-bright-magenta animate-pulse" />
            <span>{headerContent.badgeText}</span>
          </div>
        </div>

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
        <p className="text-xs sm:text-sm text-deep-navy/75 font-ui leading-relaxed pt-1.5 max-w-3xl">
          {headerContent.introText}
        </p>

        {/* 3 Thẻ Giai Đoạn (grid 3 cột) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          {/* Giai đoạn 1 */}
          <button
            type="button"
            onClick={() => onNavigateStep?.(1)}
            className={`p-3.5 sm:p-4 rounded-[20px] border text-left transition-all cursor-pointer ${
              isStage1Active
                ? 'bg-white border-bright-magenta/40 shadow-soft ring-1 ring-bright-magenta/20'
                : 'bg-white/80 border-lavender-mist hover:border-bright-magenta/30 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider font-ui text-deep-navy/70">
                GIAI ĐOẠN 1
              </span>
              {progressStage1 === 100 && (
                <span className="text-[10px] font-bold text-deep-navy bg-mint-haze px-2 py-0.5 rounded-full">
                  {vi.dp01.completedBadge}
                </span>
              )}
            </div>
            <h3 className="font-ui font-bold text-sm sm:text-base text-deep-navy">
              {headerContent.stage1Title}
            </h3>
            <p className="text-xs text-deep-navy/65 font-ui mt-1 leading-relaxed">
              {headerContent.stage1Desc}
            </p>
            <div className="w-full h-1.5 bg-lavender-mist/60 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-bright-magenta rounded-full transition-all duration-300"
                style={{ width: `${progressStage1}%` }}
              />
            </div>
          </button>

          {/* Giai đoạn 2 */}
          <button
            type="button"
            onClick={() => onNavigateStep?.(3)}
            className={`p-3.5 sm:p-4 rounded-[20px] border text-left transition-all cursor-pointer ${
              isStage2Active
                ? 'bg-white border-bright-magenta/40 shadow-soft ring-1 ring-bright-magenta/20'
                : 'bg-white/80 border-lavender-mist hover:border-bright-magenta/30 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider font-ui text-deep-navy/70">
                GIAI ĐOẠN 2
              </span>
              {progressStage2 === 100 && (
                <span className="text-[10px] font-bold text-deep-navy bg-mint-haze px-2 py-0.5 rounded-full">
                  {vi.dp01.completedBadge}
                </span>
              )}
            </div>
            <h3 className="font-ui font-bold text-sm sm:text-base text-deep-navy">
              {headerContent.stage2Title}
            </h3>
            <p className="text-xs text-deep-navy/65 font-ui mt-1 leading-relaxed">
              {headerContent.stage2Desc}
            </p>
            <div className="w-full h-1.5 bg-lavender-mist/60 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-bright-magenta rounded-full transition-all duration-300"
                style={{ width: `${progressStage2}%` }}
              />
            </div>
          </button>

          {/* Giai đoạn 3 */}
          <button
            type="button"
            onClick={() => onNavigateStep?.(7)}
            className={`p-3.5 sm:p-4 rounded-[20px] border text-left transition-all cursor-pointer ${
              isStage3Active
                ? 'bg-white border-bright-magenta/40 shadow-soft ring-1 ring-bright-magenta/20'
                : 'bg-white/80 border-lavender-mist hover:border-bright-magenta/30 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider font-ui text-deep-navy/70">
                GIAI ĐOẠN 3
              </span>
              {progressStage3 === 100 && (
                <span className="text-[10px] font-bold text-deep-navy bg-mint-haze px-2 py-0.5 rounded-full">
                  {vi.dp01.inProgressBadge}
                </span>
              )}
            </div>
            <h3 className="font-ui font-bold text-sm sm:text-base text-deep-navy">
              {headerContent.stage3Title}
            </h3>
            <p className="text-xs text-deep-navy/65 font-ui mt-1 leading-relaxed">
              {headerContent.stage3Desc}
            </p>
            <div className="w-full h-1.5 bg-lavender-mist/60 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-bright-magenta rounded-full transition-all duration-300"
                style={{ width: `${progressStage3}%` }}
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
