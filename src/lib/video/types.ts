export type PlaybackKind = 'iframe' | 'video' | 'sandbox'

export interface VideoPlayback {
  kind: PlaybackKind
  url: string | null
  expiresAt: Date
  allowSimulate?: boolean
  /** Lesson video on Hana's Facebook / TikTok, opened in a new tab (shown when set). */
  external?: { url: string; platform: 'facebook' | 'tiktok' } | null
}

export interface VideoPlaybackOptions {
  expiresInSec?: number
}

export interface VideoProvider {
  getPlayback(videoId: string, options?: VideoPlaybackOptions): Promise<VideoPlayback>
}
