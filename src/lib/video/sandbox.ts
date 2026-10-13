import type { VideoPlayback, VideoPlaybackOptions, VideoProvider } from './types'

export interface SandboxVideoProviderOptions {
  allowSimulate?: boolean
}

export class SandboxVideoProvider implements VideoProvider {
  private readonly allowSimulate: boolean

  constructor(options?: SandboxVideoProviderOptions) {
    if (typeof options?.allowSimulate === 'boolean') {
      this.allowSimulate = options.allowSimulate
    } else {
      const isProduction = process.env.NODE_ENV === 'production'
      const isE2e = process.env.E2E_TEST_HOOKS === '1'
      this.allowSimulate = isE2e || !isProduction
    }
  }

  async getPlayback(_videoId: string, options?: VideoPlaybackOptions): Promise<VideoPlayback> {
    const expiresInSec = options?.expiresInSec ?? 3600
    return {
      kind: 'sandbox',
      url: null,
      expiresAt: new Date(Date.now() + expiresInSec * 1000),
      allowSimulate: this.allowSimulate,
    }
  }
}
