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
  readingMinutes?: number | null
  excerpt?: string | null
  featured?: boolean
  href?: string
  isResource?: boolean
}

export function PostCard({
  title,
  slug,
  format = 'article',
  series,
  topic,
  thumbnail,
  className = '',
  readingMinutes,
  excerpt,
  featured = false,
  href,
  isResource = false,
}: PostCardProps) {
  const isVideo = format === 'video'
  const formatBadge = isResource
    ? vi.sm05.topics.taiLieu
    : isVideo
      ? vi.library.badges.video
      : vi.library.badges.article
  const topicLabel =
    topic && topic in vi.library.topics
      ? vi.library.topics[topic as keyof typeof vi.library.topics]
      : topic

  const targetHref =
    href ||
    (isResource ? `/tai-nguyen/${encodeURIComponent(slug)}` : `/blog/${encodeURIComponent(slug)}`)

  const ctaText = isResource
    ? 'Nhận tài liệu'
    : isVideo
      ? vi.library.watchVideo
      : vi.library.readArticle

  // 1. Biến thể Bài nổi bật (Featured Large Card)
  if (featured) {
    return (
      <Card
        as="article"
        variant="white"
        className={`overflow-hidden p-0 transition-all duration-300 hover:shadow-lg border border-deep-navy/10 ${className}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
          {/* Large Thumbnail */}
          <div className="relative aspect-[16/10] lg:aspect-auto lg:col-span-6 bg-lavender-mist/30 overflow-hidden min-h-[260px] sm:min-h-[320px]">
            {thumbnail?.src ? (
              <Image
                src={thumbnail.src}
                alt={thumbnail.alt || title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 hover:scale-105 motion-reduce:hover:scale-100"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-lavender-mist/40 via-soft-pink/30 to-warm-ivory p-6 text-center min-h-[260px]">
                <span className="font-display text-3xl uppercase tracking-wider text-deep-navy/70 select-none">
                  {isVideo ? 'Video' : 'Bài viết'}
                </span>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center gap-2 pointer-events-none">
              <span className="inline-flex items-center rounded-full px-3 py-1 font-ui text-xs font-bold bg-bright-magenta text-white shadow-sm">
                {vi.sm05.featuredBadge}
              </span>
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

          {/* Large Card Content */}
          <div className="p-6 sm:p-8 lg:p-10 lg:col-span-6 flex flex-col justify-center">
            {series && (
              <span className="text-xs font-bold uppercase tracking-wider text-bright-magenta mb-2 font-ui">
                {series}
              </span>
            )}

            <h3 className="font-display uppercase text-2xl sm:text-3xl lg:text-4xl text-deep-navy leading-tight tracking-tight mb-4">
              <Link
                href={targetHref}
                className="hover:text-bright-magenta transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy rounded-sm"
              >
                {title}
              </Link>
            </h3>

            {excerpt && (
              <p className="font-body text-base text-deep-navy/80 line-clamp-3 mb-6 leading-relaxed">
                {excerpt}
              </p>
            )}

            <div className="pt-4 border-t border-deep-navy/10 flex flex-wrap items-center justify-between gap-4 mt-auto">
              <Link
                href={targetHref}
                className="inline-flex items-center gap-2 font-ui text-base font-bold text-bright-magenta hover:text-deep-navy transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy rounded-sm min-h-[44px]"
              >
                <span>{ctaText}</span>
                <svg
                  className="w-5 h-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              {!isVideo && readingMinutes != null && readingMinutes > 0 && (
                <span className="font-ui text-xs sm:text-sm text-deep-navy/60 font-medium">
                  {vi.sm05.readingTime(readingMinutes)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // 2. Biến thể Lưới thông thường (Standard Grid Card)
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
            <span className="font-display text-2xl uppercase tracking-wider text-deep-navy/70 select-none">
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
            href={targetHref}
            className="hover:text-bright-magenta transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy rounded-sm"
          >
            {title}
          </Link>
        </h3>

        {excerpt && (
          <p className="font-body text-sm text-deep-navy/80 line-clamp-2 mb-4 leading-relaxed">
            {excerpt}
          </p>
        )}

        {/* Link / CTA slot */}
        <div className="mt-auto pt-3 border-t border-deep-navy/10 flex items-center justify-between gap-2">
          <Link
            href={targetHref}
            className="inline-flex items-center gap-1.5 font-ui text-sm font-semibold text-bright-magenta hover:text-deep-navy transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy rounded-sm min-h-[44px]"
          >
            <span>{ctaText}</span>
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

          {!isVideo && readingMinutes != null && readingMinutes > 0 && (
            <span className="font-ui text-xs text-deep-navy/60 font-medium">
              {vi.sm05.readingTime(readingMinutes)}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
