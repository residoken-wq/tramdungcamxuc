export type PlaybackKind = 'iframe' | 'video' | 'sandbox'

export interface VideoPlayback {
  kind: PlaybackKind
  url: string | null
  expiresAt: Date
  allowSimulate?: boolean
}

export interface VideoPlaybackOptions {
  expiresInSec?: number
}

export interface VideoProvider {
  getPlayback(videoId: string, options?: VideoPlaybackOptions): Promise<VideoPlayback>
}
