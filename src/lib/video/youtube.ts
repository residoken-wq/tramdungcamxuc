/**
 * YouTube video URL parsing and embedding utilities.
 * Tạm thời phục vụ phát video bài học Habit Hack khi chưa có Bunny Stream (BX-07).
 */

const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/

/**
 * Trích xuất Video ID 11 ký tự từ link YouTube.
 * Hỗ trợ 5 định dạng hợp lệ:
 * 1. youtube.com/watch?v=...
 * 2. youtu.be/...
 * 3. youtube.com/embed/...
 * 4. youtube.com/shorts/...
 * 5. youtube-nocookie.com/embed/...
 *
 * Từ chối an toàn các URL độc hại (youtube.com.evil.com, javascript:, ...) hoặc ID không đúng 11 ký tự.
 */
export function parseYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^(www\.|m\.)/, '')
  let videoId: string | null = null

  if (hostname === 'youtube.com') {
    if (parsed.pathname === '/watch') {
      videoId = parsed.searchParams.get('v')
    } else if (parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.slice('/embed/'.length).split('/')[0]
    } else if (parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.slice('/shorts/'.length).split('/')[0]
    }
  } else if (hostname === 'youtu.be') {
    videoId = parsed.pathname.slice(1).split('/')[0]
  } else if (hostname === 'youtube-nocookie.com') {
    if (parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.slice('/embed/'.length).split('/')[0]
    }
  }

  if (videoId && YOUTUBE_ID_REGEX.test(videoId)) {
    return videoId
  }

  return null
}

/**
 * Dựng URL nhúng YouTube NoCookie bảo mật với các tham số bắt buộc theo BX-07:
 * - rel=0: không gợi ý video từ kênh khác
 * - modestbranding=1: giảm thiểu logo YouTube
 * - playsinline=1: phát nội dòng trên thiết bị di động
 * - enablejsapi=1: bật postMessage API để lắng nghe tiến độ học
 * - origin: trích xuất từ SITE_URL của hệ thống để xác thực nguồn
 */
export function buildYoutubeEmbedUrl(videoId: string, siteUrl: string): string {
  const cleanSiteUrl = siteUrl.trim().replace(/\/+$/, '')
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(cleanSiteUrl)}`
}
