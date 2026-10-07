import React from 'react'
import Image from 'next/image'
import { safeHref } from '@/lib/safe-href'

export interface LogoItem {
  mediaId?: string | number
  alt: string
  link?: string
  imageUrl?: string
}

export interface LogoStripProps {
  version?: number
  title?: string
  logos?: LogoItem[]
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    logos?: LogoItem[]
  }
  puck?: {
    isEditing?: boolean
  }
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

export function LogoStrip({
  title,
  logos = [],
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: LogoStripProps) {
  const isEditing = puck?.isEditing ?? false
  const activeLogos = _resolved?.logos || logos

  if (!isEditing && (!activeLogos || activeLogos.length === 0)) {
    return null
  }

  const isDeepNavy = bgColor === 'deep-navy'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {title && (
          <p
            className={`text-center font-ui text-xs sm:text-sm font-semibold uppercase tracking-wider mb-8 ${
              isDeepNavy ? 'text-white/70' : 'text-deep-navy/60'
            }`}
          >
            {title}
          </p>
        )}

        {activeLogos.length === 0 ? (
          isEditing ? (
            <div className="py-8 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
              Chưa có logo nào được thêm. Vui lòng thêm logo trong thanh cấu hình bên phải.
            </div>
          ) : null
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 md:gap-16">
            {activeLogos.map((item, index) => {
              const url = item.imageUrl || ''
              const alt = item.alt || 'Logo đối tác'
              const href = item.link ? safeHref(item.link) : null

              const imageElement = url ? (
                <div className="relative h-10 sm:h-12 w-28 sm:w-36 flex items-center justify-center">
                  <Image
                    src={url}
                    alt={alt}
                    fill
                    sizes="(max-width: 640px) 112px, 144px"
                    className="object-contain filter grayscale contrast-75 opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-200"
                  />
                </div>
              ) : (
                <div
                  className={`h-10 sm:h-12 px-4 rounded-md border border-dashed flex items-center justify-center text-xs font-ui ${
                    isDeepNavy
                      ? 'border-white/20 text-white/50'
                      : 'border-deep-navy/20 text-deep-navy/50'
                  }`}
                >
                  {alt}
                </div>
              )

              if (href) {
                return (
                  <a
                    key={`${item.mediaId || index}-${index}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus:outline-none focus:ring-2 focus:ring-accent-pink rounded-md transition-transform hover:scale-105"
                    aria-label={alt}
                  >
                    {imageElement}
                  </a>
                )
              }

              return <div key={`${item.mediaId || index}-${index}`}>{imageElement}</div>
            })}
          </div>
        )}
      </div>
    </section>
  )
}
