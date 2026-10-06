import React from 'react'

export interface VideoEmbedProps {
  version?: number
  url?: string
  title?: string
  caption?: string
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  isEditing?: boolean
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-12 px-6 sm:px-8',
  lg: 'py-16 px-6 sm:px-12',
} as const

export interface ParsedVideo {
  isValid: boolean
  embedUrl: string | null
  provider: 'youtube' | 'vimeo' | null
}

export function parseVideoUrl(rawUrl?: string): ParsedVideo {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, embedUrl: null, provider: null }
  }

  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return { isValid: false, embedUrl: null, provider: null }
  }

  try {
    const parsed = new URL(trimmed)
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')

    // YouTube matches
    if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
      let videoId = ''
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || ''
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.slice('/embed/'.length).split('/')[0]
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.slice('/shorts/'.length).split('/')[0]
      }

      if (videoId && /^[\w-]{6,}$/.test(videoId)) {
        return {
          isValid: true,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
          provider: 'youtube',
        }
      }
    } else if (hostname === 'youtu.be') {
      const videoId = parsed.pathname.slice(1).split('/')[0]
      if (videoId && /^[\w-]{6,}$/.test(videoId)) {
        return {
          isValid: true,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
          provider: 'youtube',
        }
      }
    }

    // Vimeo matches
    if (hostname === 'vimeo.com') {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const videoId = parts[0] || ''
      if (videoId && /^\d+$/.test(videoId)) {
        return {
          isValid: true,
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          provider: 'vimeo',
        }
      }
    } else if (hostname === 'player.vimeo.com') {
      if (parsed.pathname.startsWith('/video/')) {
        const videoId = parsed.pathname.slice('/video/'.length).split('/')[0]
        if (videoId && /^\d+$/.test(videoId)) {
          return {
            isValid: true,
            embedUrl: `https://player.vimeo.com/video/${videoId}`,
            provider: 'vimeo',
          }
        }
      }
    }
  } catch {
    return { isValid: false, embedUrl: null, provider: null }
  }

  return { isValid: false, embedUrl: null, provider: null }
}

export function VideoEmbed({
  url,
  title = '[MẪU] Video chia sẻ',
  caption,
  bgColor = 'warm-ivory',
  padding = 'md',
  isEditing = false,
}: VideoEmbedProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const { isValid, embedUrl } = parseVideoUrl(url)

  if (!isValid || !embedUrl) {
    if (isEditing) {
      return (
        <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
          <div className="mx-auto max-w-4xl">
            <div className="rounded-card border border-bright-magenta/30 bg-soft-pink/80 p-6 text-center text-deep-navy">
              <p className="font-ui text-sm font-bold text-bright-magenta">
                Liên kết video không hợp lệ
              </p>
              <p className="mt-1 font-ui text-xs text-deep-navy/80">
                Chỉ chấp nhận URL công khai từ YouTube (ví dụ: https://www.youtube.com/watch?v=...) hoặc Vimeo (ví dụ: https://vimeo.com/...).
              </p>
            </div>
          </div>
        </section>
      )
    }
    return null
  }

  const captionColorClass = isDeepNavy ? 'text-white/80' : 'text-deep-navy/75'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-4xl">
        <div className={`relative aspect-video w-full overflow-hidden rounded-card border shadow-soft ${
          isDeepNavy ? 'border-white/20' : 'border-deep-navy/10'
        }`}>
          <iframe
            src={embedUrl}
            title={title || 'Video nhúng'}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>

        {caption && (
          <p className={`mt-3 text-center font-quote text-sm sm:text-base italic ${captionColorClass}`}>
            {caption}
          </p>
        )}
      </div>
    </section>
  )
}
