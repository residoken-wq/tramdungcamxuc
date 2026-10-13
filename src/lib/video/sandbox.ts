import type { VideoPlayback, VideoPlaybackOptions, VideoProvider } from './types'

export class SandboxVideoProvider implements VideoProvider {
  async getPlayback(_videoId: string, options?: VideoPlaybackOptions): Promise<VideoPlayback> {
    const expiresInSec = options?.expiresInSec ?? 3600
    return {
      kind: 'sandbox',
      url: null,
      expiresAt: new Date(Date.now() + expiresInSec * 1000),
    }
  }
}
