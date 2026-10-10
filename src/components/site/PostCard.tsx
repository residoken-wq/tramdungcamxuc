import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { vi } from '@/lib/i18n/vi'

export interface PostCardProps {
  title: string
  slug: string
  format?: 'article' | 'video' | string | null
  series?: string | null
  topic?: string | null
  thumbnail?: {
    src?: string | null
    alt?: string | null
  } | null
  className?: string
}

export function PostCard({
  title,
  slug,
  format = 'article',
  series,
  topic,
  thumbnail,
  className = '',
}: PostCardProps) {
  const isVideo = format === 'video'
  const formatBadge = isVideo ? vi.library.badges.video : vi.library.badges.article
  const topicLabel =
    topic && topic in vi.library.topics
      ? vi.library.topics[topic as keyof typeof vi.library.topics]
      : topic

  return (
    <Card
      as="article"
      variant="white"
      className={`flex flex-col h-full overflow-hidden p-0 transition-all duration-300 hover:shadow-md ${className}`}
    >
      {/* Thumbnail or Fallback */}
      <div className="relative w-full aspect-[16/10] bg-lavender-mist/30 overflow-hidden border-b border-deep-navy/10">
        {thumbnail?.src ? (
          <Image
            src={thumbnail.src}
            alt={thumbnail.alt || title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105 motion-reduce:hover:scale-100"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-lavender-mist/40 via-soft-pink/30 to-warm-ivory p-4 text-center">
            <span className="font-display text-2xl uppercase tracking-wider text-deep-navy/30 select-none">
              {isVideo ? 'Video' : 'Bài viết'}
            </span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-ui text-xs font-semibold bg-white/95 text-deep-navy border border-deep-navy/15 shadow-sm backdrop-blur-sm">
            {formatBadge}
          </span>
          {topicLabel && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-ui text-xs font-semibold bg-soft-pink text-bright-magenta border border-bright-magenta/20 shadow-sm backdrop-blur-sm">
              {topicLabel}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-grow p-5 sm:p-6">
        {/* Series label if present */}
        {series && (
          <span className="text-xs font-bold uppercase tracking-wider text-bright-magenta mb-2 font-ui">
            {series}
          </span>
        )}

        {/* Title */}
        <h3 className="font-ui font-bold text-xl text-deep-navy mb-4 leading-snug line-clamp-2">
          <Link
            href={`/blog/${encodeURIComponent(slug)}`}
            className="hover:text-bright-magenta transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy rounded-sm"
          >
            {title}
          </Link>
        </h3>

        {/* Link / CTA slot */}
        <div className="mt-auto pt-3 border-t border-deep-navy/10 flex items-center justify-between">
          <Link
            href={`/blog/${encodeURIComponent(slug)}`}
            className="inline-flex items-center gap-1.5 font-ui text-sm font-semibold text-bright-magenta hover:text-deep-navy transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy rounded-sm min-h-[44px]"
          >
            <span>{isVideo ? vi.library.watchVideo : vi.library.readArticle}</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </Card>
  )
}
