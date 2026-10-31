'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'

export function StepDiagnose() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
          {vi.hb16.steps.diagnose.title}
        </h2>
        <p className="text-sm sm:text-base text-deep-navy/80">{vi.hb16.steps.diagnose.subtitle}</p>
      </div>

      <div className="p-6 rounded-2xl bg-warm-ivory border border-dashed border-lavender-mist text-center">
        <p className="font-ui text-sm sm:text-base text-deep-navy/80 font-medium">
          {vi.hb16.steps.diagnose.samplePlaceholder}
        </p>
      </div>
    </div>
  )
}
