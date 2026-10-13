import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BunnyStreamProvider, getVideoProvider, SandboxVideoProvider } from '@/lib/video'

describe('Video Provider Factory & Providers (T2-05a & T2-05b)', () => {
  const fakeLibraryId = '12345'
  const fakeTokenKey = 'test-token-key-123'
  const fakeVideoId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('SandboxVideoProvider', () => {
    it('returns kind "sandbox", url null, and future expiresAt', async () => {
      const provider = new SandboxVideoProvider()
      const now = Date.now()
      const playback = await provider.getPlayback('sample_video_123', { expiresInSec: 1800 })

      expect(playback.kind).toBe('sandbox')
      expect(playback.url).toBeNull()
      expect(playback.expiresAt).toBeInstanceOf(Date)
      expect(playback.expiresAt.getTime()).toBeGreaterThanOrEqual(now + 1799 * 1000)
    })

    it('sets allowSimulate to false in production when E2E_TEST_HOOKS is not set', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      delete process.env.E2E_TEST_HOOKS

      const provider = new SandboxVideoProvider()
      const playback = await provider.getPlayback('sample_video_123')
      expect(playback.allowSimulate).toBe(false)
    })

    it('sets allowSimulate to true in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      delete process.env.E2E_TEST_HOOKS

      const provider = new SandboxVideoProvider()
      const playback = await provider.getPlayback('sample_video_123')
      expect(playback.allowSimulate).toBe(true)
    })

    it('sets allowSimulate to true in production if E2E_TEST_HOOKS is "1"', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('E2E_TEST_HOOKS', '1')

      const provider = new SandboxVideoProvider()
      const playback = await provider.getPlayback('sample_video_123')
      expect(playback.allowSimulate).toBe(true)
    })

    it('honors explicit allowSimulate constructor option', async () => {
      const disabledProvider = new SandboxVideoProvider({ allowSimulate: false })
      const enabledProvider = new SandboxVideoProvider({ allowSimulate: true })

      const disabledPlayback = await disabledProvider.getPlayback('123')
      const enabledPlayback = await enabledProvider.getPlayback('123')

      expect(disabledPlayback.allowSimulate).toBe(false)
      expect(enabledPlayback.allowSimulate).toBe(true)
    })
  })

  describe('getVideoProvider factory', () => {
    it('defaults to SandboxVideoProvider when VIDEO_PROVIDER is unset or "sandbox"', () => {
      delete process.env.VIDEO_PROVIDER
      const defaultProvider = getVideoProvider()
      expect(defaultProvider).toBeInstanceOf(SandboxVideoProvider)

      process.env.VIDEO_PROVIDER = 'sandbox'
      const sandboxProvider = getVideoProvider()
      expect(sandboxProvider).toBeInstanceOf(SandboxVideoProvider)

      process.env.VIDEO_PROVIDER = '  SANDBOX  '
      const trimmedProvider = getVideoProvider()
      expect(trimmedProvider).toBeInstanceOf(SandboxVideoProvider)
    })

    it('returns BunnyStreamProvider when VIDEO_PROVIDER is "bunny" and env vars are configured', () => {
      vi.stubEnv('VIDEO_PROVIDER', 'bunny')
      vi.stubEnv('BUNNY_STREAM_LIBRARY_ID', fakeLibraryId)
      vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', fakeTokenKey)

      const provider = getVideoProvider()
      expect(provider).toBeInstanceOf(BunnyStreamProvider)
    })

    it('throws error when VIDEO_PROVIDER is "bunny" but env vars are missing', () => {
      vi.stubEnv('VIDEO_PROVIDER', 'bunny')
      delete process.env.BUNNY_STREAM_LIBRARY_ID
      delete process.env.BUNNY_STREAM_TOKEN_KEY

      expect(() => getVideoProvider()).toThrow(/Thiếu biến môi trường BUNNY_STREAM_LIBRARY_ID/)
    })

    it('BunnyStreamProvider always sets allowSimulate to false', async () => {
      vi.stubEnv('VIDEO_PROVIDER', 'bunny')
      vi.stubEnv('BUNNY_STREAM_LIBRARY_ID', fakeLibraryId)
      vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', fakeTokenKey)

      const provider = getVideoProvider()
      const playback = await provider.getPlayback(fakeVideoId)
      expect(playback.allowSimulate).toBe(false)
    })

    it('getVideoProvider throws error on invalid provider', () => {
      vi.stubEnv('VIDEO_PROVIDER', 'vimeo')
      expect(() => getVideoProvider()).toThrow(/Video provider không hợp lệ/)
    })
  })
})
