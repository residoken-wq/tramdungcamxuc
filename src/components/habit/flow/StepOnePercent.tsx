'use client'

import React from 'react'
import { OnePercentSection } from '@/components/habit/OnePercentSection'
import { OnePercentSlider } from '@/components/habit/OnePercentSlider'
import { isRichTextEmpty } from '@/lib/legal'
import { vi } from '@/lib/i18n/vi'
import type { CleanHabitOnePercent } from '@/lib/habit/journey-content.server'

export interface StepOnePercentProps {
  onePercent?: CleanHabitOnePercent | null
}

export function StepOnePercent({ onePercent }: StepOnePercentProps) {
  const hasCmsTitle = Boolean(onePercent?.title?.trim())
  const hasCmsIntro = Boolean(onePercent?.intro && !isRichTextEmpty(onePercent.intro))
  const hasCmsSection = hasCmsTitle || hasCmsIntro

  return (
    <div className="space-y-6 animate-fade-in">
      {!hasCmsTitle && (
        <div>
          <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
            {vi.hb16.steps.onePercent.title}
          </h2>
          <p className="text-sm sm:text-base text-deep-navy/80">
            {vi.hb16.steps.onePercent.subtitle}
          </p>
        </div>
      )}

      <OnePercentSection onePercent={onePercent} className="!px-0 !pt-0 !pb-0" />

      {!hasCmsSection && (
        <OnePercentSlider dailyPercent={onePercent?.dailyPercent} maxDays={onePercent?.maxDays} />
      )}
    </div>
  )
}
