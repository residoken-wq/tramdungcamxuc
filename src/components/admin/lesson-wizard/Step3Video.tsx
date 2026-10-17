'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import { BUNNY_VIDEO_ID_REGEX } from '@/lib/video/bunny'
import { parseDurationToSeconds, formatSecondsToMmSs } from '@/lib/cms/lesson-wizard-schema'

interface Step3VideoProps {
  videoId: string
  durationInput: string
  isFreePreview: boolean
  onChange: (fields: {
    videoId?: string
    durationInput?: string
    durationSec?: number
    isFreePreview?: boolean
  }) => void
}

export function Step3Video({
  videoId,
  durationInput,
  isFreePreview,
  onChange,
}: Step3VideoProps) {
  const isVideoIdValid = !videoId || BUNNY_VIDEO_ID_REGEX.test(videoId.trim())
  const parsedSeconds = parseDurationToSeconds(durationInput)
  const isDurationValid =
    !durationInput || durationInput.trim().length === 0 || parsedSeconds !== null

  const handleDurationChange = (val: string) => {
    const sec = parseDurationToSeconds(val)
    onChange({
      durationInput: val,
      durationSec: sec ?? undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-deep-navy">
          {vi.cms.lessonWizard.steps.step3.title}
        </h2>
        <p className="mt-1 font-ui text-sm text-deep-navy/70">
          {vi.cms.lessonWizard.steps.step3.description}
        </p>
      </div>

      <div className="space-y-5">
        {/* Mã video Bunny Stream (GUID) */}
        <div>
          <div className="flex items-center justify-between">
            <label className="mb-1.5 block font-ui text-xs font-bold text-deep-navy">
              {vi.cms.lessonWizard.labels.videoId}
            </label>
            {videoId && (
              <span
                className={`font-ui text-xs font-bold ${
                  isVideoIdValid ? 'text-bright-magenta' : 'text-accent-pink'
                }`}
              >
                {isVideoIdValid ? '✓ Định dạng GUID hợp lệ' : '⚠️ GUID không đúng định dạng'}
              </span>
            )}
          </div>
          <input
            type="text"
            value={videoId}
            onChange={(e) => onChange({ videoId: e.target.value.trim() })}
            placeholder={vi.cms.lessonWizard.labels.videoIdPlaceholder}
            className={`w-full rounded-xl border bg-white px-4 py-2.5 font-mono text-xs text-deep-navy shadow-sm focus:outline-none ${
              !isVideoIdValid
                ? 'border-accent-pink bg-soft-pink/30 focus:border-accent-pink'
                : 'border-lavender-mist focus:border-bright-magenta'
            }`}
          />
          <p className="mt-1 font-ui text-[11px] text-deep-navy/60">
            {vi.cms.lessonWizard.labels.videoIdHint}
          </p>
          {!isVideoIdValid && (
            <p className="mt-1 font-ui text-xs text-accent-pink">
              ⚠️ {vi.cms.lessonWizard.errors.invalidVideoId}
            </p>
          )}
        </div>

        {/* Thời lượng video */}
        <div>
          <div className="flex items-center justify-between">
            <label className="mb-1.5 block font-ui text-xs font-bold text-deep-navy">
              {vi.cms.lessonWizard.labels.duration}
            </label>
            {parsedSeconds !== null && (
              <span className="font-ui text-xs font-bold text-deep-navy/80">
                = {parsedSeconds} giây ({formatSecondsToMmSs(parsedSeconds)})
              </span>
            )}
          </div>
          <input
            type="text"
            value={durationInput}
            onChange={(e) => handleDurationChange(e.target.value)}
            placeholder={vi.cms.lessonWizard.labels.durationPlaceholder}
            className={`w-full max-w-sm rounded-xl border bg-white px-4 py-2.5 font-ui text-xs text-deep-navy shadow-sm focus:outline-none ${
              !isDurationValid
                ? 'border-accent-pink bg-soft-pink/30 focus:border-accent-pink'
                : 'border-lavender-mist focus:border-bright-magenta'
            }`}
          />
          <p className="mt-1 font-ui text-[11px] text-deep-navy/60">
            {vi.cms.lessonWizard.labels.durationHint}
          </p>
          {!isDurationValid && (
            <p className="mt-1 font-ui text-xs text-accent-pink">
              ⚠️ {vi.cms.lessonWizard.errors.invalidDuration}
            </p>
          )}
        </div>

        {/* Cho phép xem thử */}
        <div className="rounded-2xl border border-lavender-mist/80 bg-warm-ivory/50 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFreePreview}
              onChange={(e) => onChange({ isFreePreview: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-lavender-mist text-bright-magenta focus:ring-bright-magenta"
            />
            <div>
              <span className="font-ui text-xs font-bold text-deep-navy block">
                {vi.cms.lessonWizard.labels.isFreePreview}
              </span>
              <span className="font-ui text-[11px] text-deep-navy/70 mt-0.5 block">
                {vi.cms.lessonWizard.labels.isFreePreviewHint}
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
