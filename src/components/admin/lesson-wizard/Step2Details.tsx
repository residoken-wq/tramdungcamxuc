'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import { LESSON_STAGES, type LessonStage } from '@/lib/cms/lesson-wizard-schema'

interface Step2DetailsProps {
  title: string
  summary: string
  stage: LessonStage
  order: number
  onChange: (fields: {
    title?: string
    summary?: string
    stage?: LessonStage
    order?: number
  }) => void
}

export function Step2Details({
  title,
  summary,
  stage,
  order,
  onChange,
}: Step2DetailsProps) {
  const stageLabels = vi.cms.lessonWizard.labels.stageOptions

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-deep-navy">
          {vi.cms.lessonWizard.steps.step2.title}
        </h2>
        <p className="mt-1 font-ui text-sm text-deep-navy/70">
          {vi.cms.lessonWizard.steps.step2.description}
        </p>
      </div>

      <div className="space-y-5">
        {/* Tiêu đề bài học */}
        <div>
          <label className="mb-1.5 block font-ui text-xs font-bold text-deep-navy">
            {vi.cms.lessonWizard.labels.title} <span className="text-accent-pink">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={vi.cms.lessonWizard.labels.titlePlaceholder}
            className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 font-ui text-sm text-deep-navy shadow-sm focus:border-bright-magenta focus:outline-none"
            required
          />
        </div>

        {/* Tóm tắt */}
        <div>
          <label className="mb-1.5 block font-ui text-xs font-bold text-deep-navy">
            {vi.cms.lessonWizard.labels.summary}
          </label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => onChange({ summary: e.target.value })}
            placeholder={vi.cms.lessonWizard.labels.summaryPlaceholder}
            className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2.5 font-ui text-xs text-deep-navy shadow-sm focus:border-bright-magenta focus:outline-none"
          />
        </div>

        {/* Chặng thói quen */}
        <div>
          <label className="mb-2 block font-ui text-xs font-bold text-deep-navy">
            {vi.cms.lessonWizard.labels.stage}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {LESSON_STAGES.map((s) => {
              const isSelected = stage === s
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChange({ stage: s })}
                  className={`rounded-xl border p-3 text-center font-ui text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-bright-magenta bg-soft-pink/40 text-bright-magenta shadow-sm ring-1 ring-bright-magenta'
                      : 'border-lavender-mist bg-white text-deep-navy/80 hover:bg-warm-ivory'
                  }`}
                >
                  {stageLabels[s] || s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Thứ tự hiển thị */}
        <div className="max-w-xs">
          <label className="mb-1.5 block font-ui text-xs font-bold text-deep-navy">
            {vi.cms.lessonWizard.labels.order}
          </label>
          <input
            type="number"
            min={0}
            value={order}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              onChange({ order: Number.isNaN(val) ? 0 : val })
            }}
            className="w-full rounded-xl border border-lavender-mist bg-white px-4 py-2 font-ui text-xs text-deep-navy shadow-sm focus:border-bright-magenta focus:outline-none"
          />
          <p className="mt-1 font-ui text-[11px] text-deep-navy/60">
            {vi.cms.lessonWizard.labels.orderHint}
          </p>
        </div>
      </div>
    </div>
  )
}
