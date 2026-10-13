import { createHash } from 'node:crypto'
import type { VideoPlayback, VideoPlaybackOptions, VideoProvider } from './types'

/**
 * Định dạng Video ID chuẩn của Bunny Stream (UUID v4 / GUID chuẩn 36 ký tự).
 */
export const BUNNY_VIDEO_ID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

/**
 * Định dạng Library ID chuẩn của Bunny Stream (số nguyên dương).
 */
export const BUNNY_LIBRARY_ID_REGEX = /^\d+$/

export interface SignBunnyEmbedUrlParams {
  libraryId: string | number
  videoId: string
  tokenKey: string
  expiresInSec?: number
  now?: Date
}

export interface SignedBunnyEmbedUrlResult {
  url: string
  expiresAt: Date
  token: string
  expires: number
}

/**
 * REVIEW-REQUIRED: Hàm thuần ký URL nhúng Bunny Stream bằng Token Authentication.
 *
 * Tài liệu tham chiếu Bunny Stream:
 * https://docs.bunny.net/docs/stream-token-authentication
 *
 * Công thức ký:
 * token = sha256_hex(tokenSecurityKey + videoId + expirationTimestamp)
 * URL = https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}?token={token}&expires={expires}
 */
export function signBunnyEmbedUrl({
  libraryId,
  videoId,
  tokenKey,
  expiresInSec = 3600,
  now = new Date(),
}: SignBunnyEmbedUrlParams): SignedBunnyEmbedUrlResult {
  const cleanLibraryId = String(libraryId ?? '').trim()
  if (!cleanLibraryId) {
    throw new Error('Thiếu mã thư viện Bunny Stream (libraryId).')
  }
  if (!BUNNY_LIBRARY_ID_REGEX.test(cleanLibraryId)) {
    throw new Error(
      `Mã thư viện Bunny Stream không hợp lệ: "${cleanLibraryId}" (phải là số nguyên dương).`,
    )
  }

  const cleanTokenKey = String(tokenKey ?? '').trim()
  if (!cleanTokenKey) {
    throw new Error('Thiếu khóa bảo mật Bunny Stream (tokenKey).')
  }

  const cleanVideoId = String(videoId ?? '').trim()
  if (!cleanVideoId) {
    throw new Error('Mã video Bunny Stream không được để trống.')
  }
  if (!BUNNY_VIDEO_ID_REGEX.test(cleanVideoId)) {
    throw new Error(`Mã video Bunny Stream không đúng định dạng GUID: "${cleanVideoId}".`)
  }

  const durationSec =
    typeof expiresInSec === 'number' && Number.isFinite(expiresInSec) && expiresInSec > 0
      ? Math.round(expiresInSec)
      : 3600

  const nowMs = now instanceof Date && !isNaN(now.getTime()) ? now.getTime() : Date.now()
  const expires = Math.floor(nowMs / 1000) + durationSec
  const expiresAt = new Date(expires * 1000)

  // Token = SHA256_HEX(TokenSecurityKey + VideoID + ExpirationTimestamp)
  const stringToHash = `${cleanTokenKey}${cleanVideoId}${expires}`
  const token = createHash('sha256').update(stringToHash).digest('hex')

  const url = `https://iframe.mediadelivery.net/embed/${cleanLibraryId}/${cleanVideoId}?token=${token}&expires=${expires}`

  return {
    url,
    expiresAt,
    token,
    expires,
  }
}

export interface BunnyStreamProviderOptions {
  libraryId?: string | number
  tokenKey?: string
}

/**
 * REVIEW-REQUIRED: BunnyStreamProvider sinh link nhúng iframe được ký bằng Token Authentication.
 */
export class BunnyStreamProvider implements VideoProvider {
  private readonly libraryId: string
  private readonly tokenKey: string

  constructor(options?: BunnyStreamProviderOptions) {
    const rawLibraryId = options?.libraryId ?? process.env.BUNNY_STREAM_LIBRARY_ID
    const rawTokenKey = options?.tokenKey ?? process.env.BUNNY_STREAM_TOKEN_KEY

    const cleanLibraryId = String(rawLibraryId ?? '').trim()
    const cleanTokenKey = String(rawTokenKey ?? '').trim()

    if (!cleanLibraryId) {
      throw new Error('Thiếu biến môi trường BUNNY_STREAM_LIBRARY_ID cho Bunny Stream.')
    }
    if (!BUNNY_LIBRARY_ID_REGEX.test(cleanLibraryId)) {
      throw new Error(
        'Mã thư viện Bunny (BUNNY_STREAM_LIBRARY_ID) không hợp lệ (phải là số nguyên dương).',
      )
    }

    if (!cleanTokenKey) {
      throw new Error('Thiếu biến môi trường BUNNY_STREAM_TOKEN_KEY cho Bunny Stream.')
    }

    this.libraryId = cleanLibraryId
    this.tokenKey = cleanTokenKey
  }

  async getPlayback(videoId: string, options?: VideoPlaybackOptions): Promise<VideoPlayback> {
    const { url, expiresAt } = signBunnyEmbedUrl({
      libraryId: this.libraryId,
      videoId,
      tokenKey: this.tokenKey,
      expiresInSec: options?.expiresInSec ?? 3600,
    })

    return {
      kind: 'iframe',
      url,
      expiresAt,
      allowSimulate: false,
    }
  }
}
