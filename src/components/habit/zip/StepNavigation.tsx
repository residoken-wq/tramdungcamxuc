'use client'

import React, { useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import type { HabitStep } from './types'
import { vi } from '@/lib/i18n/vi'

export interface StepNavigationProps {
  currentStep: HabitStep
  /** Omitted on the server-rendered tracker page: steps 1–6 then open the 5-minute flow. */
  onStepChange?: (step: HabitStep) => void
  maxReachedStep?: number
  hasSavedPlan?: boolean
}

interface StepItem {
  id: HabitStep
  num: string
  title: string
}

interface StepGroup {
  groupLabel: string
  steps: StepItem[]
}

const STEP_GROUPS: StepGroup[] = [
  {
    groupLabel: 'KHÁM',
    steps: [
      { id: 1 as HabitStep, num: '1', title: 'Khám đúng bệnh' },
      { id: 2 as HabitStep, num: '2', title: 'Nguyên lý 1%' },
    ],
  },
  {
    groupLabel: 'XÂY',
    steps: [
      { id: 3 as HabitStep, num: '3', title: 'Tìm Mentor' },
      { id: 4 as HabitStep, num: '4', title: 'Gọi tên thói quen' },
      { id: 5 as HabitStep, num: '5', title: 'Vòng lặp' },
      { id: 6 as HabitStep, num: '6', title: 'Boarding Pass' },
    ],
  },
  {
    groupLabel: 'CHUYỂN MÌNH',
    steps: [{ id: 7 as HabitStep, num: '✔', title: '28 ngày' }],
  },
]

export function StepNavigation({
  currentStep,
  onStepChange,
  maxReachedStep = 1,
  hasSavedPlan = false,
}: StepNavigationProps) {
  const isTrackerActive = currentStep === 7 || currentStep === 'result'

  // Quản lý container và mảng các ref của từng nút bước
  const navContainerRef = useRef<HTMLDivElement | null>(null)
  const stepButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Tự động cuộn mượt mà đưa nút active vào giữa tầm nhìn khi currentStep thay đổi
  useEffect(() => {
    const activeKey = isTrackerActive ? '7' : String(currentStep)
    const activeBtn = stepButtonRefs.current[activeKey]
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
      const reducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      activeBtn.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [currentStep, isTrackerActive])

  const wizardStepNumber =
    typeof currentStep === 'number' && currentStep >= 1 && currentStep <= 6 ? currentStep : null
  const wizardTotalSteps = 6
  const wizardPercent = wizardStepNumber ? Math.round((wizardStepNumber / wizardTotalSteps) * 100) : 0

  return (
    <div className="w-full mb-6 space-y-2.5">
      {/* Thanh tiến độ wizard gọn cho luồng 6 bước */}
      {wizardStepNumber !== null && (
        <div className="w-full max-w-4xl mx-auto px-1 flex items-center gap-3">
          <span className="text-xs font-bold font-ui text-deep-navy whitespace-nowrap">
            {vi.dp01.wizardProgressLabel(wizardStepNumber, wizardTotalSteps)}
          </span>
          <div
            role="progressbar"
            aria-label={vi.dp01.wizardProgressAria}
            aria-valuemin={1}
            aria-valuemax={wizardTotalSteps}
            aria-valuenow={wizardStepNumber}
            className="flex-1 h-2 bg-lavender-mist/70 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-bright-magenta rounded-full transition-all motion-reduce:transition-none duration-300"
              style={{ width: `${wizardPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Container cuộn ngang mượt mà */}
      <div
        ref={navContainerRef}
        className="w-full max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto py-3 px-4 scroll-smooth bg-white/95 backdrop-blur-sm border border-lavender-mist rounded-[20px] shadow-soft"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {STEP_GROUPS.map((group, groupIdx) => (
          <React.Fragment key={group.groupLabel}>
            {groupIdx > 0 && <div className="w-px h-5 bg-lavender-mist shrink-0 mx-1" />}

            {/* Nhãn phân nhóm nhỏ in hoa */}
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-deep-navy/70 font-ui px-2 py-1 rounded-md bg-lavender-mist/40 shrink-0 whitespace-nowrap select-none">
              {group.groupLabel}
            </span>

            {/* Các nút bấm bước */}
            {group.steps.map((step) => {
              const isStep7 = step.id === 7
              const isActive = isStep7 ? isTrackerActive : currentStep === step.id

              const isPassed =
                !isActive &&
                (isTrackerActive
                  ? step.id !== 7
                  : typeof currentStep === 'number' &&
                    typeof step.id === 'number' &&
                    currentStep > step.id)

              const isAccessible = isStep7
                ? hasSavedPlan || isTrackerActive
                : step.id === 1 ||
                  isTrackerActive ||
                  isPassed ||
                  (typeof step.id === 'number' && step.id <= maxReachedStep)

              const tooltipText = isStep7 && !isAccessible ? vi.dp01.openAfterBoarding : undefined

              return (
                <button
                  key={step.id}
                  ref={(el) => {
                    stepButtonRefs.current[String(step.id)] = el
                  }}
                  type="button"
                  title={tooltipText}
                  onClick={() => {
                    if (isStep7 && hasSavedPlan && typeof window !== 'undefined') {
                      window.location.assign('/habit/tracker')
                      return
                    }
                    if (!isAccessible) return
                    if (onStepChange) {
                      onStepChange(step.id)
                    } else if (typeof window !== 'undefined') {
                      window.location.assign('/habit/5-phut')
                    }
                  }}
                  disabled={!isAccessible}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-ui font-semibold transition-all duration-200 border ${
                    isActive
                      ? 'bg-bright-magenta text-white border-bright-magenta shadow-soft cursor-pointer'
                      : isPassed
                        ? 'bg-soft-pink/50 text-deep-navy border-lavender-mist hover:bg-soft-pink hover:border-bright-magenta/30 cursor-pointer'
                        : isAccessible
                          ? 'bg-white text-deep-navy/80 border-lavender-mist hover:bg-warm-ivory hover:text-deep-navy cursor-pointer'
                          : 'bg-white/40 text-deep-navy/70 border-lavender-mist/40 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold transition-colors shrink-0 ${
                      isActive
                        ? 'bg-white text-bright-magenta'
                        : isPassed
                          ? 'bg-mint-haze text-deep-navy'
                          : 'bg-lavender-mist/60 text-deep-navy/60'
                    }`}
                  >
                    {isPassed && !isActive ? (
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                    ) : (
                      step.num
                    )}
                  </span>
                  <span className="whitespace-nowrap">{step.title}</span>
                </button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default StepNavigation
