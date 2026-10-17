'use client'

import React from 'react'

export interface WizardStepMeta {
  number: number
  name: string
  title: string
  description?: string
}

interface WizardProgressProps {
  steps: WizardStepMeta[]
  currentStep: number
  onStepClick?: (step: number) => void
  highestStepVisited?: number
}

export function WizardProgress({
  steps,
  currentStep,
  onStepClick,
  highestStepVisited = currentStep,
}: WizardProgressProps) {
  const currentStepMeta = steps.find((s) => s.number === currentStep) || steps[0]

  return (
    <nav
      aria-label="Tiến trình tạo sản phẩm"
      className="w-full rounded-2xl border border-lavender-mist/60 bg-white p-4 shadow-sm md:p-6"
    >
      {/* Mobile view: Thanh tiến trình gọn gàng */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-deep-navy/70">
          <span>
            Bước {currentStep} / {steps.length}
          </span>
          <span className="text-bright-magenta font-bold">{currentStepMeta.name}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-soft-pink">
          <div
            className="h-full rounded-full bg-gradient-to-r from-bright-magenta to-accent-pink transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-deep-navy/80">{currentStepMeta.description}</p>
      </div>

      {/* Desktop view: 5 bước hoàn chỉnh */}
      <ol role="list" className="hidden items-center justify-between gap-2 md:flex">
        {steps.map((step, index) => {
          const isCurrent = step.number === currentStep
          const isCompleted = step.number < currentStep
          const isClickable = Boolean(onStepClick && step.number <= highestStepVisited)

          return (
            <li
              key={step.number}
              className={`relative flex flex-1 items-center ${
                index < steps.length - 1 ? 'pr-4' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.number)}
                disabled={!isClickable}
                className={`group flex w-full items-center gap-3 text-left transition-all ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Circle badge */}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-mint-haze text-deep-navy ring-2 ring-mint-haze'
                      : isCurrent
                        ? 'bg-bright-magenta text-white ring-4 ring-soft-pink shadow-sm'
                        : 'bg-lavender-mist/50 text-deep-navy/50'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-4 w-4 stroke-current stroke-[2.5]"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </span>

                {/* Text details */}
                <div className="min-w-0">
                  <div
                    className={`font-ui text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'text-bright-magenta'
                        : isCompleted
                          ? 'text-deep-navy group-hover:text-bright-magenta'
                          : 'text-deep-navy/40'
                    }`}
                  >
                    Bước {step.number}
                  </div>
                  <div
                    className={`truncate text-sm font-semibold transition-colors ${
                      isCurrent
                        ? 'text-deep-navy'
                        : isCompleted
                          ? 'text-deep-navy/80 group-hover:text-deep-navy'
                          : 'text-deep-navy/40'
                    }`}
                  >
                    {step.name}
                  </div>
                </div>
              </button>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`absolute right-0 top-1/2 -mt-px h-0.5 w-4 -translate-y-1/2 transition-colors ${
                    step.number < currentStep ? 'bg-bright-magenta' : 'bg-lavender-mist'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
