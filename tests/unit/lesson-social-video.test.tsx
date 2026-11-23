import React from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/courses/actions', () => ({
  recordLessonProgress: vi.fn(async () => ({ success: true })),
}))
vi.mock('@/lib/analytics/track', () => ({ track: vi.fn() }))

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '@/payload.config'
import { parseSocialVideoUrl } from '@/lib/video/social'
import { isValidExampleVideoUrl } from '@/collections/Techniques'
import { getLessonPlayback } from '@/lib/courses/service.server'
import { VideoPlayer } from '@/components/habit/learning/VideoPlayer'
import { recordLessonProgress } from '@/lib/courses/actions'
import { vi as viLabels } from '@/lib/i18n/vi'

const TIKTOK = 'https://www.tiktok.com/@tram.mau/video/7300000000000000000'
const FACEBOOK = 'https://www.facebook.com/reel/1000000000000000'

describe('Lesson video on Facebook / TikTok', () => {
  it('accepts only https Facebook / TikTok video links', () => {
    expect(parseSocialVideoUrl(TIKTOK)).toEqual({ url: TIKTOK, platform: 'tiktok' })
    expect(parseSocialVideoUrl('https://vt.tiktok.com/ZSabc123/')?.platform).toBe('tiktok')
    expect(parseSocialVideoUrl(FACEBOOK)?.platform).toBe('facebook')
    expect(parseSocialVideoUrl('https://fb.watch/abc123/')?.platform).toBe('facebook')
    expect(parseSocialVideoUrl('https://m.facebook.com/watch/?v=1')?.platform).toBe('facebook')
    expect(parseSocialVideoUrl('http://www.tiktok.com/@a/video/1')).toBeNull()
    expect(parseSocialVideoUrl('https://tiktok.com.evil.example/video/1')).toBeNull()
    expect(parseSocialVideoUrl('https://www.facebook.com/')).toBeNull()
    expect(parseSocialVideoUrl('javascript:alert(1)')).toBeNull()
    expect(parseSocialVideoUrl('')).toBeNull()
  })

  it('Habit Loop 5 phút technique videos also accept TikTok links', () => {
    expect(isValidExampleVideoUrl(TIKTOK)).toBe(true)
    expect(isValidExampleVideoUrl('https://vm.tiktok.com/ZMabc/')).toBe(true)
    expect(isValidExampleVideoUrl('https://tiktok.evil.example/x')).toBe(false)
  })

  describe('VideoPlayer', () => {
    const base = { lessonId: 1, isAuthenticated: true, lessonTitle: '[MẪU] Bài học' }
    const expiresAt = new Date()

    it('no player and no link: nothing is shown (no empty video box)', () => {
      const { container } = render(
        <VideoPlayer
          {...base}
          playback={{ kind: 'iframe', url: null, expiresAt, external: null }}
        />,
      )
      expect(container.innerHTML).toBe('')
      expect(screen.queryByText(viLabels.learning.lesson.noVideoUrl)).toBeNull()
      cleanup()
    })

    it('link only: a button opens TikTok in a new tab and counts the lesson as watched', () => {
      render(
        <VideoPlayer
          {...base}
          playback={{
            kind: 'iframe',
            url: null,
            expiresAt,
            external: { url: TIKTOK, platform: 'tiktok' },
          }}
        />,
      )
      const link = screen.getByTestId('lesson-external-video')
      expect(link.getAttribute('href')).toBe(TIKTOK)
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.textContent).toContain(viLabels.learning.lesson.externalVideo.tiktok)
      fireEvent.click(link)
      expect(recordLessonProgress).toHaveBeenCalledWith(1, 100)
      cleanup()
    })

    it('player and link: both are shown', () => {
      render(
        <VideoPlayer
          {...base}
          playback={{
            kind: 'iframe',
            url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?enablejsapi=1',
            expiresAt,
            external: { url: FACEBOOK, platform: 'facebook' },
          }}
        />,
      )
      expect(document.querySelector('iframe')).not.toBeNull()
      expect(screen.getByTestId('lesson-external-video').textContent).toContain(
        viLabels.learning.lesson.externalVideo.facebook,
      )
      cleanup()
    })
  })

  describe('Service: the link follows the lesson access rules', () => {
    let payload: Payload
    const created: { collection: CollectionSlug; id: number }[] = []
    let freeLessonId = 0
    let paidLessonId = 0
    let emptyLessonId = 0

    beforeAll(async () => {
      payload = await getPayload({ config: await config })
      const mod = await payload.create({
        collection: 'courseModules',
        data: {
          title: `[MẪU] Nhóm ${randomUUID().slice(0, 6)}`,
          group: 'insight',
          order: 1,
          _status: 'published',
        },
        overrideAccess: true,
      })
      created.push({ collection: 'courseModules', id: mod.id })
      const lesson = async (data: Record<string, unknown>) => {
        const doc = await payload.create({
          collection: 'lessons',
          data: { module: mod.id, _status: 'published', ...data } as never,
          overrideAccess: true,
        })
        created.push({ collection: 'lessons', id: doc.id })
        return doc.id
      }
      freeLessonId = await lesson({
        title: '[MẪU] Bài TikTok xem thử',
        videoSource: 'youtube',
        youtubeUrl: '',
        socialVideoUrl: TIKTOK,
        isFreePreview: true,
      })
      paidLessonId = await lesson({
        title: '[MẪU] Bài Facebook trả phí',
        videoSource: 'youtube',
        socialVideoUrl: FACEBOOK,
        isFreePreview: false,
      })
      emptyLessonId = await lesson({
        title: '[MẪU] Bài chưa có video',
        videoSource: 'youtube',
        youtubeUrl: '',
        isFreePreview: true,
      })
    })

    afterAll(async () => {
      for (const item of created.reverse()) {
        await payload
          .delete({ collection: item.collection, id: item.id, overrideAccess: true })
          .catch(() => {})
      }
    })

    it('allowed lesson gets the link; no player URL is invented', async () => {
      const res = await getLessonPlayback(freeLessonId, null)
      expect(res.allowed).toBe(true)
      expect(res.playback?.url).toBeNull()
      expect(res.playback?.external).toEqual({ url: TIKTOK, platform: 'tiktok' })
    })

    it('locked lesson never leaks the link', async () => {
      const res = await getLessonPlayback(paidLessonId, null)
      expect(res.allowed).toBe(false)
      expect(JSON.stringify(res)).not.toContain('facebook.com')
    })

    it('lesson without any video: no player URL and no link (page hides the box)', async () => {
      const res = await getLessonPlayback(emptyLessonId, null)
      expect(res.playback?.url ?? null).toBeNull()
      expect(res.playback?.external ?? null).toBeNull()
    })

    it('the CMS rejects a non Facebook / TikTok link', async () => {
      await expect(
        payload.create({
          collection: 'lessons',
          data: {
            title: '[MẪU] Link sai',
            socialVideoUrl: 'https://example.com/video',
          } as never,
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    })
  })
})
