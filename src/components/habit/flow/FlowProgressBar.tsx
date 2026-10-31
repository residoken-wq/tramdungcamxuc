'use client'

import React from 'react'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import type { HabitFlowStep } from './draft'

export interface FlowProgressBarProps {
  currentStep: HabitFlowStep
  journeyDays?: number
  isPlanSaved?: boolean
  onSelectStep: (step: HabitFlowStep) => void
}

interface StepDefinition {
  step: HabitFlowStep
  label: string
  stage: 'discover' | 'build'
}

const FLOW_STEPS: readonly StepDefinition[] = [
  { step: 1, label: vi.hb16.steps.diagnose.shortTitle, stage: 'discover' },
  { step: 2, label: vi.hb16.steps.onePercent.shortTitle, stage: 'discover' },
  { step: 3, label: vi.hb16.steps.mentor.shortTitle, stage: 'build' },
  { step: 4, label: vi.hb16.steps.name.shortTitle, stage: 'build' },
  { step: 5, label: vi.hb16.steps.loop.shortTitle, stage: 'build' },
  { step: 6, label: vi.hb16.steps.boardingPass.shortTitle, stage: 'build' },
]

export function FlowProgressBar({
  currentStep,
  journeyDays = 28,
  isPlanSaved = false,
  onSelectStep,
}: FlowProgressBarProps) {
  const discoverSteps = FLOW_STEPS.filter((s) => s.stage === 'discover')
  const buildSteps = FLOW_STEPS.filter((s) => s.stage === 'build')
  const activeStepDef = FLOW_STEPS.find((s) => s.step === currentStep) ?? FLOW_STEPS[0]
  const progressPercent = isPlanSaved ? 100 : Math.round((currentStep / 6) * 100)

  const renderStepButton = (item: StepDefinition) => {
    const isCompleted = isPlanSaved || item.step < currentStep
    const isCurrent = !isPlanSaved && item.step === currentStep
    const isUpcoming = !isPlanSaved && item.step > currentStep

    const statusText = isCompleted
      ? vi.hb16.progress.statusCompleted
      : isCurrent
        ? vi.hb16.progress.statusCurrent
        : vi.hb16.progress.statusUpcoming

    return (
      <li key={item.step} className="flex">
        <button
          type="button"
          disabled={isUpcoming}
          aria-current={isCurrent ? 'step' : undefined}
          onClick={() => {
            if (isCompleted || isCurrent) {
              onSelectStep(item.step)
            }
          }}
          className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-left transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta focus-visible:ring-offset-1 flex items-center justify-between gap-2 ${
            isCurrent
              ? 'bg-soft-pink border-2 border-bright-magenta text-deep-navy shadow-xs'
              : isCompleted
                ? 'bg-mint-haze/70 border-deep-navy/20 text-deep-navy hover:bg-mint-haze cursor-pointer'
                : 'bg-warm-ivory border-lavender-mist text-deep-navy/60 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span
              aria-hidden="true"
              className={`w-6 h-6 rounded-full text-xs font-ui font-bold inline-flex items-center justify-center shrink-0 ${
                isCurrent
                  ? 'bg-bright-magenta text-white'
                  : isCompleted
                    ? 'bg-deep-navy text-warm-ivory'
                    : 'bg-lavender-mist text-deep-navy/70'
              }`}
            >
              {isCompleted ? '✓' : item.step}
            </span>
            <span className="font-ui text-xs sm:text-sm font-semibold leading-snug break-words">
              <span className="sr-only">{item.step}. </span>
              {item.label}
            </span>
          </span>
          <span
            className={`text-[11px] font-ui font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              isCurrent
                ? 'bg-white text-bright-magenta border border-bright-magenta'
                : isCompleted
                  ? 'bg-white/80 text-deep-navy'
                  : 'bg-lavender-mist/40 text-deep-navy/60'
            }`}
          >
            {statusText}
          </span>
        </button>
      </li>
    )
  }

  return (
    <nav aria-label={vi.hb16.progress.navAria} className="mb-8 space-y-4">
      {/* Dòng tóm tắt bước & thanh tiến độ tổng */}
      <div>
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-deep-navy mb-2">
          <span>{vi.habit.wizard.stepIndicator(currentStep, 6)}</span>
          <span className="text-bright-magenta">{activeStepDef.label}</span>
        </div>
        <div className="w-full h-2.5 bg-lavender-mist/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-bright-magenta transition-all duration-300 motion-reduce:transition-none rounded-full"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-label={vi.habit.wizard.errors.progressAria}
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Lưới 3 giai đoạn: Khám (1-2) · Xây (3-6) · Chuyển mình (✦ N ngày) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Giai đoạn 1: Khám */}
        <div className="p-3 sm:p-4 rounded-2xl bg-warm-ivory border border-lavender-mist space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta">
              {vi.hb16.progress.stageHeader(1, vi.hb16.stages.discover)}
            </span>
          </div>
          <ol className="space-y-2">{discoverSteps.map(renderStepButton)}</ol>
        </div>

        {/* Giai đoạn 2: Xây */}
        <div className="p-3 sm:p-4 rounded-2xl bg-warm-ivory border border-lavender-mist space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta">
              {vi.hb16.progress.stageHeader(2, vi.hb16.stages.build)}
            </span>
          </div>
          <ol className="space-y-2">{buildSteps.map(renderStepButton)}</ol>
        </div>

        {/* Giai đoạn 3: Chuyển mình */}
        <div className="p-3 sm:p-4 rounded-2xl bg-warm-ivory border border-lavender-mist space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta">
                {vi.hb16.progress.stageHeader(3, vi.hb16.stages.transform)}
              </span>
            </div>

            {isPlanSaved ? (
              <Link
                href="/habit/tracker"
                data-testid="journey-tracker-link"
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-mint-haze border-2 border-deep-navy text-deep-navy font-ui font-bold text-xs sm:text-sm flex items-center justify-between gap-2 hover:bg-soft-pink transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta"
              >
                <span>{vi.hb16.progress.journeyItem(journeyDays)}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-deep-navy">
                  {vi.hb16.progress.journeyUnlockedStatus} →
                </span>
              </Link>
            ) : (
              <div
                aria-disabled="true"
                data-testid="journey-tracker-locked"
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-warm-ivory border border-dashed border-lavender-mist text-deep-navy/60 font-ui font-semibold text-xs sm:text-sm flex items-center justify-between gap-2 opacity-75 select-none"
              >
                <span>{vi.hb16.progress.journeyItem(journeyDays)}</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-lavender-mist/40 text-deep-navy/60">
                  {vi.hb16.progress.journeyLockedStatus}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

