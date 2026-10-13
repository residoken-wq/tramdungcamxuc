'use client'

import React, { useEffect, useRef, useState, useTransition } from 'react'
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
  isAuthenticated?: boolean
  onProgressRecorded?: (percent: number) => void
}

export function VideoPlayer({
  lessonId,
  playback,
  moduleId = 0,
  lessonOrder = 0,
  initialCompleted = false,
  isAuthenticated = false,
  onProgressRecorded,
}: VideoPlayerProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [isPending, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Tracking refs cho thẻ <video> và <iframe>
  const lastRecordedTimeRef = useRef<number>(0)
  const lastRecordedPercentRef = useRef<number>(initialCompleted ? 100 : 0)
  const isCompletedRef = useRef<boolean>(initialCompleted)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const sendProgress = async (percent: number) => {
    if (!isAuthenticated) return
    try {
      const res = await recordLessonProgress(lessonId, percent)
      if (res.success) {
        if (percent >= 80) {
          setIsCompleted(true)
          isCompletedRef.current = true
        }
        if (onProgressRecorded) {
          onProgressRecorded(percent)
        }
        if (res.newlyCompleted && res.meta) {
          track('lesson_completed', {
            courseSlug: res.meta.courseSlug,
            moduleId: res.meta.moduleId ?? moduleId,
            lessonId: res.meta.lessonId,
            lessonOrder: res.meta.lessonOrder ?? lessonOrder,
          })
        }
      }
    } catch {
      // Bỏ qua lỗi kết nối nền
    }
  }

  // Xử lý sự kiện postMessage từ iframe Bunny Stream (Player.js API)
  useEffect(() => {
    if (playback.kind !== 'iframe' || !playback.url) return

    const handleMessage = (event: MessageEvent) => {
      // BẢO MẬT: Chỉ chấp nhận message từ iframe Bunny Stream
      if (event.origin !== 'https://iframe.mediadelivery.net') {
        return
      }

      let data: any = event.data
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch {
          return
        }
      }

      if (!data || typeof data !== 'object') {
        return
      }

      if (data.context !== 'player.js') {
        return
      }

      const eventName = data.event

      if (eventName === 'timeupdate') {
        const val = data.value
        const seconds =
          typeof val?.seconds === 'number'
            ? val.seconds
            : typeof data.seconds === 'number'
              ? data.seconds
              : null
        const duration =
          typeof val?.duration === 'number'
            ? val.duration
            : typeof data.duration === 'number'
              ? data.duration
              : null

        if (seconds !== null && duration !== null && duration > 0) {
          const percent = Math.min(100, Math.round((seconds / duration) * 100))
          const timeSinceLast = Math.abs(seconds - lastRecordedTimeRef.current)
          const percentDiff = Math.abs(percent - lastRecordedPercentRef.current)

          if (percentDiff >= 5 || timeSinceLast >= 15) {
            lastRecordedTimeRef.current = seconds
            lastRecordedPercentRef.current = percent
            sendProgress(percent)
          }
        }
      } else if (eventName === 'pause') {
        const val = data.value
        const seconds =
          typeof val?.seconds === 'number'
            ? val.seconds
            : typeof data.seconds === 'number'
              ? data.seconds
              : null
        const duration =
          typeof val?.duration === 'number'
            ? val.duration
            : typeof data.duration === 'number'
              ? data.duration
              : null

        if (seconds !== null && duration !== null && duration > 0) {
          const percent = Math.min(100, Math.round((seconds / duration) * 100))
          lastRecordedPercentRef.current = percent
          sendProgress(percent)
        } else if (lastRecordedPercentRef.current > 0) {
          sendProgress(lastRecordedPercentRef.current)
        }
      } else if (eventName === 'ended') {
        lastRecordedPercentRef.current = 100
        sendProgress(100)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [
    playback.kind,
    playback.url,
    lessonId,
    isAuthenticated,
    moduleId,
    lessonOrder,
    onProgressRecorded,
  ])

  const handleIframeLoad = () => {
    try {
      const target = iframeRef.current?.contentWindow
      if (!target) return
      const events = ['timeupdate', 'pause', 'ended']
      for (const ev of events) {
        target.postMessage({ context: 'player.js', method: 'addEventListener', value: ev }, '*')
      }
    } catch {
      // Bỏ qua lỗi gửi postMessage tới iframe
    }
  }

  // Xử lý sự kiện timeupdate cho thẻ video trực tiếp (tối đa mỗi 15 giây)
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    if (!video.duration || video.duration <= 0) return
    const nowSec = video.currentTime
    if (Math.abs(nowSec - lastRecordedTimeRef.current) >= 15) {
      lastRecordedTimeRef.current = nowSec
      const percent = Math.min(100, Math.round((nowSec / video.duration) * 100))
      lastRecordedPercentRef.current = percent
      sendProgress(percent)
    }
  }

  // Xử lý sự kiện pause cho thẻ video trực tiếp
  const handlePause = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    if (!video.duration || video.duration <= 0) return
    const percent = Math.min(100, Math.round((video.currentTime / video.duration) * 100))
    lastRecordedTimeRef.current = video.currentTime
    lastRecordedPercentRef.current = percent
    sendProgress(percent)
  }

  // Xử lý sự kiện ended cho thẻ video trực tiếp
  const handleEnded = () => {
    lastRecordedPercentRef.current = 100
    sendProgress(100)
  }

  const handleSimulateWatch = () => {
    startTransition(async () => {
      try {
        const res = await recordLessonProgress(lessonId, 100)
        if (res.success) {
          setIsCompleted(true)
          isCompletedRef.current = true
          setStatusMessage(vi.learning.lesson.simulatedSuccess)
          if (onProgressRecorded) {
            onProgressRecorded(100)
          }

          if (res.newlyCompleted && res.meta) {
            track('lesson_completed', {
              courseSlug: res.meta.courseSlug,
              moduleId: res.meta.moduleId ?? moduleId,
              lessonId: res.meta.lessonId,
              lessonOrder: res.meta.lessonOrder ?? lessonOrder,
            })
          }
        } else {
          setStatusMessage(vi.learning.lesson.progressRecordFailed)
        }
      } catch {
        setStatusMessage(vi.learning.lesson.progressError)
      }
    })
  }

  // 1. Sandbox Video Provider
  if (playback.kind === 'sandbox') {
    return (
      <div className="overflow-hidden rounded-2xl border border-lavender-mist/80 bg-deep-navy text-warm-ivory shadow-lg">
        <div className="relative aspect-video w-full flex flex-col items-center justify-center p-6 text-center">
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

            {/* Nút giả lập xem hết (chỉ hiển thị khi đã đăng nhập, provider cho phép simulate, và chưa hoàn thành) */}
            {isAuthenticated && Boolean(playback.allowSimulate) && !isCompleted && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSimulateWatch}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-pink px-5 py-2.5 font-ui text-sm font-bold text-warm-ivory shadow transition-all hover:bg-bright-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-ivory motion-reduce:transition-none disabled:opacity-50"
                >
                  {isPending
                    ? vi.learning.lesson.simulating
                    : vi.learning.lesson.simulateWatchButton}
                </button>
              </div>
            )}

            {statusMessage && (
              <p role="status" className="font-ui text-xs font-semibold text-mint-haze">
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
      <div className="overflow-hidden rounded-2xl border border-lavender-mist/80 bg-deep-navy shadow-lg">
        <div className="relative aspect-video w-full">
          <iframe
            ref={iframeRef}
            src={playback.url}
            title={vi.learning.lesson.videoTitle}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    )
  }

  // 3. Direct Video Element
  if (playback.kind === 'video' && playback.url) {
    return (
      <div className="overflow-hidden rounded-2xl border border-lavender-mist/80 bg-deep-navy shadow-lg">
        <div className="relative aspect-video w-full">
          <video
            controls
            src={playback.url}
            className="h-full w-full object-contain"
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onPause={handlePause}
            onEnded={handleEnded}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="aspect-video w-full rounded-2xl border border-dashed border-lavender-mist/80 bg-warm-ivory flex items-center justify-center p-6 text-center text-deep-navy/70">
      <p className="font-body text-sm">{vi.learning.lesson.noVideoUrl}</p>
    </div>
  )
}
