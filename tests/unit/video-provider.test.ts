import { describe, expect, it } from 'vitest'
import { getVideoProvider, SandboxVideoProvider } from '@/lib/video'

describe('Video Provider Factory & Sandbox Implementation (T2-05a)', () => {
  it('SandboxVideoProvider returns kind "sandbox", url null, and future expiresAt', async () => {
    const provider = new SandboxVideoProvider()
    const now = Date.now()
    const playback = await provider.getPlayback('sample_video_123', { expiresInSec: 1800 })

    expect(playback.kind).toBe('sandbox')
    expect(playback.url).toBeNull()
    expect(playback.expiresAt).toBeInstanceOf(Date)
    expect(playback.expiresAt.getTime()).toBeGreaterThanOrEqual(now + 1799 * 1000)
  })

  it('getVideoProvider defaults to SandboxVideoProvider when VIDEO_PROVIDER is unset or "sandbox"', () => {
    const originalEnv = process.env.VIDEO_PROVIDER
    try {
      delete process.env.VIDEO_PROVIDER
      const defaultProvider = getVideoProvider()
      expect(defaultProvider).toBeInstanceOf(SandboxVideoProvider)

      process.env.VIDEO_PROVIDER = 'sandbox'
      const sandboxProvider = getVideoProvider()
      expect(sandboxProvider).toBeInstanceOf(SandboxVideoProvider)

      process.env.VIDEO_PROVIDER = '  SANDBOX  '
      const trimmedProvider = getVideoProvider()
      expect(trimmedProvider).toBeInstanceOf(SandboxVideoProvider)
    } finally {
      process.env.VIDEO_PROVIDER = originalEnv
    }
  })

  it('getVideoProvider throws informative error when VIDEO_PROVIDER is "bunny" (T2-05b)', () => {
    const originalEnv = process.env.VIDEO_PROVIDER
    try {
      process.env.VIDEO_PROVIDER = 'bunny'
      expect(() => getVideoProvider()).toThrow('Chưa cấu hình Bunny (T2-05b)')
    } finally {
      process.env.VIDEO_PROVIDER = originalEnv
    }
  })

  it('getVideoProvider throws error on invalid provider', () => {
    const originalEnv = process.env.VIDEO_PROVIDER
    try {
      process.env.VIDEO_PROVIDER = 'vimeo'
      expect(() => getVideoProvider()).toThrow(/Video provider không hợp lệ/)
    } finally {
      process.env.VIDEO_PROVIDER = originalEnv
    }
  })
})
