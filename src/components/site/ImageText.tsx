'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export interface ImageTextProps {
  layout?: 'image-left' | 'image-right'
  seriesLabel?: string
  titleLine1: string
  titleLine2?: string
  content: string
  mediaId?: string
  imageUrl?: string
  imageAlt?: string
  buttonText?: string
  buttonLink?: string
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
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
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function ImageText({
  layout = 'image-left',
  seriesLabel,
  titleLine1,
  titleLine2,
  content,
  mediaId,
  imageUrl,
  imageAlt,
  buttonText,
  buttonLink,
  bgColor = 'warm-ivory',
  padding = 'md',
}: ImageTextProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const textColorClass = isDeepNavy ? 'text-white' : 'text-deep-navy'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const descColorClass = isDeepNavy ? 'text-white/90' : 'text-deep-navy/80'

  // Client-side preview in visual editor when imageUrl is not pre-rendered from server
  const [clientImage, setClientImage] = useState<{ url: string; alt: string } | null>(null)

  useEffect(() => {
    if (!imageUrl && mediaId) {
      let isMounted = true
      fetch(`/api/media/${encodeURIComponent(mediaId)}`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((doc) => {
          if (
            isMounted &&
            doc?.url &&
            doc?.alt &&
            typeof doc.alt === 'string' &&
            doc.alt.trim().length > 0
          ) {
            setClientImage({ url: doc.url, alt: doc.alt.trim() })
          }
        })
        .catch(() => {})
      return () => {
        isMounted = false
      }
    }
  }, [imageUrl, mediaId])

  const activeUrl = imageUrl || clientImage?.url
  const activeAlt = (imageAlt || clientImage?.alt || '').trim()
  const hasValidImage = Boolean(activeUrl && activeAlt)

  const paragraphs = (content || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const isImageLeft = layout === 'image-left'

  return (
    <section className={`w-full ${BG_COLORS[bgColor] || BG_COLORS['warm-ivory']} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        <div className={`grid grid-cols-1 ${hasValidImage ? 'md:grid-cols-2' : ''} gap-8 lg:gap-12 items-center`}>
          {/* Image Column - only rendered if activeUrl and activeAlt are present */}
          {hasValidImage && (
            <div className={`${isImageLeft ? 'md:order-1' : 'md:order-2'} w-full`}>
              <div className="overflow-hidden rounded-card border border-deep-navy/10 shadow-soft bg-white">
                <Image
                  src={activeUrl!}
                  alt={activeAlt}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover max-h-[460px]"
                  loading="lazy"
                  unoptimized={activeUrl?.startsWith('data:') || activeUrl?.startsWith('blob:')}
                />
              </div>
            </div>
          )}

          {/* Text Column */}
          <div className={`${hasValidImage ? (isImageLeft ? 'md:order-2' : 'md:order-1') : 'max-w-3xl mx-auto'} flex flex-col justify-center`}>
            {seriesLabel && (
              <span className={`mb-3 font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}>
                {seriesLabel}
              </span>
            )}

            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight leading-tight mb-4">
              <span className={textColorClass}>{titleLine1}</span>{' '}
              {titleLine2 && <span className={titleLine2ColorClass}>{titleLine2}</span>}
            </h2>

            <div className="space-y-3 mb-6">
              {paragraphs.map((p, idx) => (
                <p key={idx} className={`font-ui text-base leading-relaxed ${descColorClass}`}>
                  {p}
                </p>
              ))}
            </div>

            {buttonText && buttonLink && (
              <div className="pt-2">
                <Button href={buttonLink} variant={isDeepNavy ? 'secondary' : 'primary'} size="md">
                  {buttonText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

