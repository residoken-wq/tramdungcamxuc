'use client'

import React, { useState, useTransition } from 'react'
import type { VideoPlayback } from '@/lib/video'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'
import { recordLessonProgress } from '@/lib/courses/actions'

export interface VideoPlayerProps {
  lessonId: number
  playback: VideoPlayback
  moduleId?: number
  lessonOrder?: number
  initialCompleted?: boolean
  onProgressRecorded?: (percent: number) => void
}

export function VideoPlayer({
  lessonId,
  playback,
  moduleId = 0,
  lessonOrder = 0,
  initialCompleted = false,
  onProgressRecorded,
}: VideoPlayerProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [isPending, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleSimulateWatch = () => {
    startTransition(async () => {
      try {
        const res = await recordLessonProgress(lessonId, 100)
        if (res.success) {
          setIsCompleted(true)
          setStatusMessage(vi.learning.lesson.simulatedSuccess)
          if (onProgressRecorded) {
            onProgressRecorded(100)
          }

          // Phát sự kiện analytics khi lần đầu hoàn thành bài học
          if (res.newlyCompleted && res.meta) {
            track('lesson_completed', {
              courseSlug: res.meta.courseSlug,
              moduleId: res.meta.moduleId ?? moduleId,
              lessonId: res.meta.lessonId,
              lessonOrder: res.meta.lessonOrder ?? lessonOrder,
            })
          }
        } else {
          setStatusMessage('Không thể ghi nhận tiến độ.')
        }
      } catch {
        setStatusMessage('Đã có lỗi xảy ra khi ghi nhận tiến độ.')
      }
    })
  }

  // 1. Sandbox Video Provider (chưa kết nối Bunny)
  if (playback.kind === 'sandbox') {
    return (
      <div className="overflow-hidden rounded-2xl border border-lavender-mist/80 bg-deep-navy text-warm-ivory shadow-lg">
        <div className="relative aspect-video w-full flex flex-col items-center justify-center p-6 text-center">
          {/* Subtle background decoration */}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-bright-magenta/20 via-deep-navy to-deep-navy opacity-75"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center max-w-md space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-soft-pink/15 text-soft-pink">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 6.75v9a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="font-ui text-lg sm:text-xl font-bold text-warm-ivory">
                {vi.learning.lesson.sandboxNotice}
              </h3>
              <p className="font-body text-xs sm:text-sm text-lavender-mist/80">
                {vi.learning.lesson.sandboxDesc}
              </p>
            </div>

            {/* Nút giả lập xem hết (chỉ có khi provider là sandbox, phục vụ test) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSimulateWatch}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-pink px-5 py-2.5 font-ui text-sm font-bold text-white shadow transition-all hover:bg-bright-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
              >
                {isPending ? vi.learning.lesson.simulating : 'Giả lập xem hết'}
              </button>
            </div>

            {statusMessage && (
              <p
                role="status"
                className="font-ui text-xs font-semibold text-mint-haze animate-fade-in"
              >
                {statusMessage}
              </p>
            )}

            {isCompleted && !statusMessage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-haze/20 px-3 py-1 font-ui text-xs font-bold text-mint-haze">
                ✓ {vi.learning.dashboard.status.completed}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 2. Iframe Embed (Bunny stream player hoặc nhúng)
  if (playback.kind === 'iframe' && playback.url) {
    return (
      <div className="overflow-hidden rounded-2xl border border-lavender-mist/80 bg-black shadow-lg">
        <div className="relative aspect-video w-full">
          <iframe
            src={playback.url}
            title="Video bài học"
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        </div>
      </div>
    )
  }

  // 3. Direct Video Element
  if (playback.kind === 'video' && playback.url) {
    return (
      <div className="overflow-hidden rounded-2xl border border-lavender-mist/80 bg-black shadow-lg">
        <div className="relative aspect-video w-full">
          <video controls src={playback.url} className="h-full w-full object-contain" playsInline />
        </div>
      </div>
    )
  }

  return (
    <div className="aspect-video w-full rounded-2xl border border-dashed border-lavender-mist/80 bg-warm-ivory flex items-center justify-center p-6 text-center text-deep-navy/70">
      <p className="font-body text-sm">Chưa có liên kết phát video khả dụng.</p>
    </div>
  )
}
