import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BunnyStreamProvider,
  BUNNY_LIBRARY_ID_REGEX,
  BUNNY_VIDEO_ID_REGEX,
  signBunnyEmbedUrl,
} from '@/lib/video/bunny'

describe('Bunny Stream Token Signing & Provider (T2-05b)', () => {
  const fakeLibraryId = '12345'
  const fakeVideoId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  const fakeTokenKey = 'test-token-key-123'

  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Regex patterns', () => {
    it('validates UUID/GUID format for Bunny videoId', () => {
      expect(BUNNY_VIDEO_ID_REGEX.test(fakeVideoId)).toBe(true)
      expect(BUNNY_VIDEO_ID_REGEX.test('00000000-0000-0000-0000-000000000000')).toBe(true)
      expect(BUNNY_VIDEO_ID_REGEX.test('not-a-guid')).toBe(false)
      expect(BUNNY_VIDEO_ID_REGEX.test('../traversal')).toBe(false)
      expect(BUNNY_VIDEO_ID_REGEX.test(`${fakeVideoId}?query=1`)).toBe(false)
      expect(BUNNY_VIDEO_ID_REGEX.test('')).toBe(false)
    })

    it('validates integer format for Bunny libraryId', () => {
      expect(BUNNY_LIBRARY_ID_REGEX.test('12345')).toBe(true)
      expect(BUNNY_LIBRARY_ID_REGEX.test('1')).toBe(true)
      expect(BUNNY_LIBRARY_ID_REGEX.test('-123')).toBe(false)
      expect(BUNNY_LIBRARY_ID_REGEX.test('abc')).toBe(false)
      expect(BUNNY_LIBRARY_ID_REGEX.test('')).toBe(false)
    })
  })

  describe('signBunnyEmbedUrl', () => {
    it('signs embed URL with SHA256 according to Bunny Stream formula', () => {
      const fixedNow = new Date('2026-10-13T12:00:00Z')
      const expiresInSec = 3600
      const expectedExpires = Math.floor(fixedNow.getTime() / 1000) + expiresInSec

      const expectedString = `${fakeTokenKey}${fakeVideoId}${expectedExpires}`
      const expectedHash = createHash('sha256').update(expectedString).digest('hex')

      const result = signBunnyEmbedUrl({
        libraryId: fakeLibraryId,
        videoId: fakeVideoId,
        tokenKey: fakeTokenKey,
        expiresInSec,
        now: fixedNow,
      })

      expect(result.token).toBe(expectedHash)
      expect(result.expires).toBe(expectedExpires)
      expect(result.expiresAt.getTime()).toBe(expectedExpires * 1000)
      expect(result.url).toBe(
        `https://iframe.mediadelivery.net/embed/${fakeLibraryId}/${fakeVideoId}?token=${expectedHash}&expires=${expectedExpires}`,
      )
    })

    it('supports custom expiresInSec (e.g. 1800s and 7200s)', () => {
      const fixedNow = new Date('2026-10-13T12:00:00Z')

      const result1800 = signBunnyEmbedUrl({
        libraryId: fakeLibraryId,
        videoId: fakeVideoId,
        tokenKey: fakeTokenKey,
        expiresInSec: 1800,
        now: fixedNow,
      })
      expect(result1800.expires).toBe(Math.floor(fixedNow.getTime() / 1000) + 1800)

      const result7200 = signBunnyEmbedUrl({
        libraryId: fakeLibraryId,
        videoId: fakeVideoId,
        tokenKey: fakeTokenKey,
        expiresInSec: 7200,
        now: fixedNow,
      })
      expect(result7200.expires).toBe(Math.floor(fixedNow.getTime() / 1000) + 7200)
    })

    it('throws when libraryId is missing or invalid', () => {
      expect(() =>
        signBunnyEmbedUrl({
          libraryId: '',
          videoId: fakeVideoId,
          tokenKey: fakeTokenKey,
        }),
      ).toThrow(/Thiếu mã thư viện/)

      expect(() =>
        signBunnyEmbedUrl({
          libraryId: 'invalid-id',
          videoId: fakeVideoId,
          tokenKey: fakeTokenKey,
        }),
      ).toThrow(/Mã thư viện Bunny Stream không hợp lệ/)
    })

    it('throws when tokenKey is missing without leaking sensitive info', () => {
      expect(() =>
        signBunnyEmbedUrl({
          libraryId: fakeLibraryId,
          videoId: fakeVideoId,
          tokenKey: '',
        }),
      ).toThrow(/Thiếu khóa bảo mật Bunny Stream/)
    })

    it('throws when videoId is missing or not a GUID, never leaking tokenKey', () => {
      let thrownMessage = ''
      try {
        signBunnyEmbedUrl({
          libraryId: fakeLibraryId,
          videoId: '../traversal-attack',
          tokenKey: fakeTokenKey,
        })
      } catch (err: any) {
        thrownMessage = err.message
      }

      expect(thrownMessage).toContain('không đúng định dạng GUID')
      expect(thrownMessage).not.toContain(fakeTokenKey)

      expect(() =>
        signBunnyEmbedUrl({
          libraryId: fakeLibraryId,
          videoId: '',
          tokenKey: fakeTokenKey,
        }),
      ).toThrow(/Mã video Bunny Stream không được để trống/)
    })
  })

  describe('BunnyStreamProvider', () => {
    it('initializes from explicit options and generates signed iframe playback', async () => {
      const provider = new BunnyStreamProvider({
        libraryId: fakeLibraryId,
        tokenKey: fakeTokenKey,
      })

      const playback = await provider.getPlayback(fakeVideoId, { expiresInSec: 1800 })

      expect(playback.kind).toBe('iframe')
      expect(playback.allowSimulate).toBe(false)
      expect(playback.url).toMatch(
        new RegExp(
          `^https://iframe\\.mediadelivery\\.net/embed/${fakeLibraryId}/${fakeVideoId}\\?token=[0-9a-f]{64}&expires=\\d+$`,
        ),
      )
      expect(playback.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('reads configuration from environment variables', async () => {
      vi.stubEnv('BUNNY_STREAM_LIBRARY_ID', fakeLibraryId)
      vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', fakeTokenKey)

      const provider = new BunnyStreamProvider()
      const playback = await provider.getPlayback(fakeVideoId)

      expect(playback.kind).toBe('iframe')
      expect(playback.allowSimulate).toBe(false)
      expect(playback.url).toContain(
        `https://iframe.mediadelivery.net/embed/${fakeLibraryId}/${fakeVideoId}`,
      )
    })

    it('throws when BUNNY_STREAM_LIBRARY_ID is missing or invalid', () => {
      vi.stubEnv('BUNNY_STREAM_LIBRARY_ID', '')
      vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', fakeTokenKey)

      expect(() => new BunnyStreamProvider()).toThrow(
        /Thiếu biến môi trường BUNNY_STREAM_LIBRARY_ID/,
      )

      vi.stubEnv('BUNNY_STREAM_LIBRARY_ID', 'not-a-number')
      expect(() => new BunnyStreamProvider()).toThrow(/Mã thư viện Bunny.*không hợp lệ/)
    })

    it('throws when BUNNY_STREAM_TOKEN_KEY is missing without leaking sensitive data', () => {
      vi.stubEnv('BUNNY_STREAM_LIBRARY_ID', fakeLibraryId)
      vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', '')

      expect(() => new BunnyStreamProvider()).toThrow(
        /Thiếu biến môi trường BUNNY_STREAM_TOKEN_KEY/,
      )
    })
  })
})
