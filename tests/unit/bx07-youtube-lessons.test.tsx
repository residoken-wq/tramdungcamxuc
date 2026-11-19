import React from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { act, cleanup, render, screen } from '@testing-library/react'
import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '@/payload.config'
import type { CourseModule, Customer, Lesson, Product } from '@/payload-types'
import { parseYoutubeVideoId, buildYoutubeEmbedUrl } from '@/lib/video/youtube'
import { getLessonPlayback } from '@/lib/courses/service.server'
import { HABIT_TRACKER_PRODUCT_SLUG } from '@/lib/habit/config'
import { VideoPlayer } from '@/components/habit/learning/VideoPlayer'
import { recordLessonProgress } from '@/lib/courses/actions'
import { vi as viLabels } from '@/lib/i18n/vi'

vi.mock('@/lib/courses/actions', () => ({
  recordLessonProgress: vi.fn(),
}))

vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
}))

describe('BX-07: YouTube Video Lessons', () => {
  describe('1. parseYoutubeVideoId helper', () => {
    it('parses standard watch URL (youtube.com/watch?v=...)', () => {
      expect(parseYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(parseYoutubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ')
      expect(parseYoutubeVideoId('http://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('parses short URL (youtu.be/...)', () => {
      expect(parseYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(parseYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=10')).toBe('dQw4w9WgXcQ')
    })

    it('parses embed URL (youtube.com/embed/...)', () => {
      expect(parseYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(parseYoutubeVideoId('https://youtube.com/embed/dQw4w9WgXcQ?autoplay=1')).toBe('dQw4w9WgXcQ')
    })

    it('parses shorts URL (youtube.com/shorts/...)', () => {
      expect(parseYoutubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(parseYoutubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ?feature=share')).toBe('dQw4w9WgXcQ')
    })

    it('parses nocookie embed URL (youtube-nocookie.com/embed/...)', () => {
      expect(parseYoutubeVideoId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(parseYoutubeVideoId('http://youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('rejects foreign or phishing domains (youtube.com.evil.com, evilyoutube.com)', () => {
      expect(parseYoutubeVideoId('https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ')).toBeNull()
      expect(parseYoutubeVideoId('https://evilyoutube.com/watch?v=dQw4w9WgXcQ')).toBeNull()
      expect(parseYoutubeVideoId('https://fake-youtu.be/dQw4w9WgXcQ')).toBeNull()
    })

    it('rejects non-http protocols (javascript:, data:)', () => {
      expect(parseYoutubeVideoId('javascript:alert("dQw4w9WgXcQ")')).toBeNull()
      expect(parseYoutubeVideoId('data:text/html;base64,dQw4w9WgXcQ')).toBeNull()
    })

    it('rejects empty, null, undefined or non-string inputs', () => {
      expect(parseYoutubeVideoId('')).toBeNull()
      expect(parseYoutubeVideoId('   ')).toBeNull()
      expect(parseYoutubeVideoId(null)).toBeNull()
      expect(parseYoutubeVideoId(undefined)).toBeNull()
    })

    it('rejects invalid ID length or invalid characters', () => {
      expect(parseYoutubeVideoId('https://youtube.com/watch?v=short')).toBeNull()
      expect(parseYoutubeVideoId('https://youtube.com/watch?v=toolongvideo12345')).toBeNull()
      expect(parseYoutubeVideoId('https://youtube.com/watch?v=dQw4w9WgXc$')).toBeNull()
    })
  })

  describe('2. buildYoutubeEmbedUrl helper', () => {
    it('constructs correct secure embed URL with enablejsapi=1 and origin', () => {
      const url = buildYoutubeEmbedUrl('dQw4w9WgXcQ', 'https://tramdungcamxuc.com')
      expect(url).toBe(
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=' +
          encodeURIComponent('https://tramdungcamxuc.com'),
      )
    })

    it('trims trailing slashes from origin', () => {
      const url = buildYoutubeEmbedUrl('dQw4w9WgXcQ', 'https://tramdungcamxuc.com///')
      expect(url).toContain('origin=' + encodeURIComponent('https://tramdungcamxuc.com'))
    })
  })

  describe('3. Service: getLessonPlaybackInternal authorization matrix', () => {
    let payload: Payload
    let habitProduct: Product
    let moduleDoc: CourseModule
    let customerWithEntitlement: Customer
    let customerWithoutEntitlement: Customer

    let youtubeLessonPaid: Lesson
    let youtubeLessonFree: Lesson
    let youtubeLessonInvalidUrl: Lesson
    let bunnyLesson: Lesson

    const createdDocs: { collection: CollectionSlug; id: number }[] = []
    const track = <T extends { id: number }>(col: CollectionSlug, doc: T): T => {
      createdDocs.push({ collection: col, id: doc.id })
      return doc
    }

    const testVideoId = 'dQw4w9WgXcQ'

    beforeAll(async () => {
      payload = await getPayload({ config: await config })

      // 1. Get or create Habit Tracker product
      const existingProduct = await payload.find({
        collection: 'products',
        where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
        limit: 1,
        overrideAccess: true,
      })
      if (existingProduct.docs.length > 0) {
        habitProduct = existingProduct.docs[0] as Product
      } else {
        habitProduct = track(
          'products',
          await payload.create({
            collection: 'products',
            data: {
              name: 'Habit Tracker Số (BX-07 Test)',
              slug: HABIT_TRACKER_PRODUCT_SLUG,
              web: 'habit',
              type: 'digital_tool',
              saleStatus: 'on_sale',
              price: 250000,
              isSample: true,
              _status: 'published',
            },
            overrideAccess: true,
          }),
        )
      }

      // 2. Create course module
      moduleDoc = track(
        'courseModules',
        await payload.create({
          collection: 'courseModules',
          data: {
            title: `Nhóm Bài Học Test BX-07 ${randomUUID().slice(0, 6)}`,
            group: 'insight',
            order: 1,
            _status: 'published',
          },
          overrideAccess: true,
        }),
      )

      // 3. Create customers
      customerWithEntitlement = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `bx07-cust-has-access-${randomUUID().slice(0, 8)}@example.test`,
            name: 'Khách Có Quyền BX-07',
            consentAt: new Date().toISOString(),
          },
          overrideAccess: true,
        }),
      )

      customerWithoutEntitlement = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: {
            email: `bx07-cust-no-access-${randomUUID().slice(0, 8)}@example.test`,
            name: 'Khách Không Quyền BX-07',
            consentAt: new Date().toISOString(),
          },
          overrideAccess: true,
        }),
      )

      // Grant entitlement to customerWithEntitlement
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customerWithEntitlement.id,
            product: habitProduct.id,
            source: 'manual',
            status: 'trial',
            grantedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 28 * 86400000).toISOString(),
            trialKey: `${customerWithEntitlement.id}:${habitProduct.id}`,
          },
          overrideAccess: true,
        }),
      )

      // 4. Create test lessons
      youtubeLessonPaid = track(
        'lessons',
        await payload.create({
          collection: 'lessons',
          data: {
            title: `Bài Học YouTube Trả Phí ${randomUUID().slice(0, 6)}`,
            module: moduleDoc.id,
            videoSource: 'youtube',
            youtubeUrl: `https://www.youtube.com/watch?v=${testVideoId}`,
            isFreePreview: false,
            order: 1,
            _status: 'published',
          },
          overrideAccess: true,
        }),
      )

      youtubeLessonFree = track(
        'lessons',
        await payload.create({
          collection: 'lessons',
          data: {
            title: `Bài Học YouTube Xem Thử ${randomUUID().slice(0, 6)}`,
            module: moduleDoc.id,
            videoSource: 'youtube',
            youtubeUrl: `https://youtu.be/${testVideoId}`,
            isFreePreview: true,
            order: 2,
            _status: 'published',
          },
          overrideAccess: true,
        }),
      )

      youtubeLessonInvalidUrl = track(
        'lessons',
        await payload.create({
          collection: 'lessons',
          data: {
            title: `Bài Học YouTube Link Lỗi ${randomUUID().slice(0, 6)}`,
            module: moduleDoc.id,
            videoSource: 'youtube',
            youtubeUrl: '',
            isFreePreview: false,
            order: 3,
            _status: 'published',
          },
          overrideAccess: true,
        }),
      )

      bunnyLesson = track(
        'lessons',
        await payload.create({
          collection: 'lessons',
          data: {
            title: `Bài Học Bunny Gốc ${randomUUID().slice(0, 6)}`,
            module: moduleDoc.id,
            videoSource: 'bunny',
            videoId: 'c0a80123-4567-89ab-cdef-0123456789ab',
            isFreePreview: false,
            order: 4,
            _status: 'published',
          },
          overrideAccess: true,
        }),
      )
    })

    afterAll(async () => {
      // Cleanup created docs in reverse order
      for (const item of createdDocs.reverse()) {
        try {
          await payload.delete({
            collection: item.collection,
            id: item.id,
            overrideAccess: true,
          })
        } catch {
          // ignore cleanup errors
        }
      }
    })

    it('youtube + có quyền -> kind: "iframe", URL youtube-nocookie.com/embed/<ID> có enablejsapi=1&origin=', async () => {
      const res = await getLessonPlayback(youtubeLessonPaid.id, customerWithEntitlement.id)
      expect(res.allowed).toBe(true)
      expect(res.reason).toBeNull()
      expect(res.playback).not.toBeNull()
      expect(res.playback?.kind).toBe('iframe')
      expect(res.playback?.url).toContain(`https://www.youtube-nocookie.com/embed/${testVideoId}`)
      expect(res.playback?.url).toContain('enablejsapi=1&origin=')
    })

    it('không quyền -> playback = null, kết quả serialize không chứa ID', async () => {
      // 1. Khách chưa đăng nhập
      const resUnauth = await getLessonPlayback(youtubeLessonPaid.id, null)
      expect(resUnauth.allowed).toBe(false)
      expect(resUnauth.playback).toBeNull()
      expect(JSON.stringify(resUnauth)).not.toContain(testVideoId)

      // 2. Khách đã đăng nhập nhưng chưa mua / hết hạn
      const resNoAccess = await getLessonPlayback(youtubeLessonPaid.id, customerWithoutEntitlement.id)
      expect(resNoAccess.allowed).toBe(false)
      expect(resNoAccess.playback).toBeNull()
      expect(JSON.stringify(resNoAccess)).not.toContain(testVideoId)
    })

    it('bài xem thử -> phát được khi chưa đăng nhập (customerId === null)', async () => {
      const res = await getLessonPlayback(youtubeLessonFree.id, null)
      expect(res.allowed).toBe(true)
      expect(res.reason).toBeNull()
      expect(res.playback).not.toBeNull()
      expect(res.playback?.kind).toBe('iframe')
      expect(res.playback?.url).toContain(`https://www.youtube-nocookie.com/embed/${testVideoId}`)
      expect(res.playback?.url).toContain('enablejsapi=1&origin=')
    })

    it('youtube nhưng link sai/trống -> allowed nhưng playback.url = null (không lỗi 500)', async () => {
      const res = await getLessonPlayback(youtubeLessonInvalidUrl.id, customerWithEntitlement.id)
      expect(res.allowed).toBe(true)
      expect(res.playback).not.toBeNull()
      expect(res.playback?.kind).toBe('iframe')
      expect(res.playback?.url).toBeNull()
    })

    it('bunny -> giữ nguyên hành vi của getVideoProvider()', async () => {
      const res = await getLessonPlayback(bunnyLesson.id, customerWithEntitlement.id)
      expect(res.allowed).toBe(true)
      expect(res.playback).not.toBeNull()
      // In sandbox/test environment, provider returns sandbox kind or iframe
      expect(['sandbox', 'iframe']).toContain(res.playback?.kind)
    })
  })

  describe('4. VideoPlayer: postMessage events & progress recording', () => {
    const fakeLessonId = 999
    const mockRecordProgress = vi.mocked(recordLessonProgress)
    const youtubeEmbedUrl =
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=https://tramdungcamxuc.com'

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

    it('renders iframe with correct security attributes and title', () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: youtubeEmbedUrl,
            expiresAt: new Date(),
          }}
          isAuthenticated={true}
          lessonTitle="Bài 01: Nhận diện thói quen"
        />,
      )

      const iframe = screen.getByTitle('Bài 01: Nhận diện thói quen') as HTMLIFrameElement
      expect(iframe).toBeDefined()
      expect(iframe.src).toBe(youtubeEmbedUrl)
      expect(iframe.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin')
      expect(iframe.getAttribute('allowfullscreen')).not.toBeNull()
      expect(iframe.getAttribute('allow')).toContain('accelerometer')
      expect(iframe.getAttribute('allow')).toContain('picture-in-picture')
    })

    it('sends listening command to iframe on load', () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: youtubeEmbedUrl,
            expiresAt: new Date(),
          }}
          isAuthenticated={true}
        />,
      )

      const iframe = document.querySelector('iframe')
      expect(iframe).not.toBeNull()
      const postMessageSpy = vi.fn()
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage = postMessageSpy
      }

      // Trigger onLoad
      act(() => {
        iframe?.dispatchEvent(new Event('load'))
      })

      expect(postMessageSpy).toHaveBeenCalledWith(
        JSON.stringify({ event: 'listening' }),
        'https://www.youtube-nocookie.com',
      )
    })

    it('tin infoDelivery hợp lệ (đúng origin + đúng source) >= 80% -> gọi sendProgress', async () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: youtubeEmbedUrl,
            expiresAt: new Date(),
          }}
          isAuthenticated={true}
        />,
      )

      const iframe = document.querySelector('iframe')

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://www.youtube-nocookie.com',
            source: iframe?.contentWindow ?? null,
            data: JSON.stringify({
              event: 'infoDelivery',
              info: {
                currentTime: 80,
                duration: 100,
                playerState: 1, // PLAYING
              },
            }),
          }),
        )
      })

      expect(mockRecordProgress).toHaveBeenCalledWith(fakeLessonId, 80)
    })

    it('sai origin -> bỏ qua (không gọi sendProgress)', async () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: youtubeEmbedUrl,
            expiresAt: new Date(),
          }}
          isAuthenticated={true}
        />,
      )

      const iframe = document.querySelector('iframe')

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://youtube.attacker.com',
            source: iframe?.contentWindow ?? null,
            data: JSON.stringify({
              event: 'infoDelivery',
              info: {
                currentTime: 80,
                duration: 100,
              },
            }),
          }),
        )
      })

      expect(mockRecordProgress).not.toHaveBeenCalled()
    })

    it('sai source (từ window thay vì iframe) -> bỏ qua', async () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: youtubeEmbedUrl,
            expiresAt: new Date(),
          }}
          isAuthenticated={true}
        />,
      )

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://www.youtube-nocookie.com',
            source: window,
            data: JSON.stringify({
              event: 'infoDelivery',
              info: {
                currentTime: 90,
                duration: 100,
              },
            }),
          }),
        )
      })

      expect(mockRecordProgress).not.toHaveBeenCalled()
    })

    it('JSON hỏng -> bỏ qua không throw exception', async () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: youtubeEmbedUrl,
            expiresAt: new Date(),
          }}
          isAuthenticated={true}
        />,
      )

      const iframe = document.querySelector('iframe')

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://www.youtube-nocookie.com',
            source: iframe?.contentWindow ?? null,
            data: '{broken-invalid-json',
          }),
        )
      })

      expect(mockRecordProgress).not.toHaveBeenCalled()
    })

    it('playerState = 0 (ended) -> ghi nhận 100%', async () => {
      render(
        <VideoPlayer
          lessonId={fakeLessonId}
          playback={{
            kind: 'iframe',
            url: youtubeEmbedUrl,
            expiresAt: new Date(),
          }}
          isAuthenticated={true}
        />,
      )

      const iframe = document.querySelector('iframe')

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://www.youtube-nocookie.com',
            source: iframe?.contentWindow ?? null,
            data: {
              event: 'infoDelivery',
              info: {
                playerState: 0,
              },
            },
          }),
        )
      })

      expect(mockRecordProgress).toHaveBeenCalledWith(fakeLessonId, 100)
    })
  })
})
