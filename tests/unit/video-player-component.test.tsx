import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { VideoPlayer } from '@/components/habit/learning/VideoPlayer'
import { recordLessonProgress } from '@/lib/courses/actions'
import { vi as viLabels } from '@/lib/i18n/vi'

vi.mock('@/lib/courses/actions', () => ({
  recordLessonProgress: vi.fn(),
}))

vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
}))

describe('VideoPlayer Component (T2-05b)', () => {
  const fakeLessonId = 42
  const mockRecordProgress = vi.mocked(recordLessonProgress)

  beforeEach(() => {
    vi.clearAllMocks()
    mockRecordProgress.mockResolvedValue({
      success: true,
      meta: {
        courseSlug: 'habit-mastery',
        moduleId: 1,
        lessonId: fakeLessonId,
        lessonOrder: 1,
      },
      newlyCompleted: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  describe('allowSimulate button visibility guard', () => {
    it('hides simulate watch button when playback.allowSimulate is false', () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'sandbox',
            url: null,
            expiresAt: new Date(),
            allowSimulate: false,
          }}
          isAuthenticated={true}
        />,
      )

      expect(
        screen.queryByRole('button', { name: viLabels.learning.lesson.simulateWatchButton }),
      ).toBeNull()
    })

    it('shows simulate watch button when playback.allowSimulate is true and user is authenticated', () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'sandbox',
            url: null,
            expiresAt: new Date(),
            allowSimulate: true,
          }}
          isAuthenticated={true}
        />,
      )

      expect(
        screen.getByRole('button', { name: viLabels.learning.lesson.simulateWatchButton }),
      ).toBeDefined()
    })

    it('hides simulate watch button when user is not authenticated, even if allowSimulate is true', () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'sandbox',
            url: null,
            expiresAt: new Date(),
            allowSimulate: true,
          }}
          isAuthenticated={false}
        />,
      )

      expect(
        screen.queryByRole('button', { name: viLabels.learning.lesson.simulateWatchButton }),
      ).toBeNull()
    })

    it('never renders simulate watch button for iframe player kind', () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: 'https://iframe.mediadelivery.net/embed/123/456?token=abc&expires=123',
            expiresAt: new Date(),
            allowSimulate: false,
          }}
          isAuthenticated={true}
        />,
      )

      expect(
        screen.queryByRole('button', { name: viLabels.learning.lesson.simulateWatchButton }),
      ).toBeNull()
      expect(screen.getByTitle(viLabels.learning.lesson.videoTitle)).toBeDefined()
    })
  })

  describe('Bunny Stream iframe postMessage events', () => {
    const iframeUrl =
      'https://iframe.mediadelivery.net/embed/12345/a1b2c3d4-e5f6-7890-abcd-ef1234567890?token=mock&expires=999999'

    it('ignores postMessage originating from untrusted/foreign domains', async () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: iframeUrl,
            expiresAt: new Date(),
            allowSimulate: false,
          }}
          isAuthenticated={true}
        />,
      )

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://evil.attacker.com',
            data: {
              context: 'player.js',
              event: 'ended',
            },
          }),
        )
      })

      expect(mockRecordProgress).not.toHaveBeenCalled()
    })

    it('ignores postMessage without player.js context', async () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: iframeUrl,
            expiresAt: new Date(),
            allowSimulate: false,
          }}
          isAuthenticated={true}
        />,
      )

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://iframe.mediadelivery.net',
            data: {
              context: 'some-other-plugin',
              event: 'ended',
            },
          }),
        )
      })

      expect(mockRecordProgress).not.toHaveBeenCalled()
    })

    it('records progress on timeupdate event from https://iframe.mediadelivery.net', async () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: iframeUrl,
            expiresAt: new Date(),
            allowSimulate: false,
          }}
          isAuthenticated={true}
        />,
      )

      // Emit timeupdate (30s out of 100s = 30%)
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://iframe.mediadelivery.net',
            data: {
              context: 'player.js',
              event: 'timeupdate',
              value: {
                seconds: 30,
                duration: 100,
              },
            },
          }),
        )
      })

      expect(mockRecordProgress).toHaveBeenCalledWith(fakeLessonId, 30)
    })

    it('handles stringified JSON message payload on ended event', async () => {
      const onProgressRecorded = vi.fn()
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: iframeUrl,
            expiresAt: new Date(),
            allowSimulate: false,
          }}
          isAuthenticated={true}
          onProgressRecorded={onProgressRecorded}
        />,
      )

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://iframe.mediadelivery.net',
            data: JSON.stringify({
              context: 'player.js',
              event: 'ended',
            }),
          }),
        )
      })

      expect(mockRecordProgress).toHaveBeenCalledWith(fakeLessonId, 100)
    })

    it('removes window message listener on component unmount', async () => {
      const { unmount } = render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: iframeUrl,
            expiresAt: new Date(),
            allowSimulate: false,
          }}
          isAuthenticated={true}
        />,
      )

      unmount()

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://iframe.mediadelivery.net',
            data: {
              context: 'player.js',
              event: 'ended',
            },
          }),
        )
      })

      expect(mockRecordProgress).not.toHaveBeenCalled()
    })
  })
})
