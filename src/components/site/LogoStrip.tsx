import React from 'react'
import Image from 'next/image'
import { safeHref } from '@/lib/safe-href'
import { vi } from '@/lib/i18n/vi'

export interface LogoItem {
  mediaId?: string | number
  alt: string
  link?: string
  imageUrl?: string
}

export interface LogoGroup {
  label?: string
  logos?: LogoItem[]
}

export interface LogoStripProps {
  version?: number
  title?: string
  groups?: LogoGroup[]
  logos?: LogoItem[]
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    logos?: LogoItem[]
    groups?: LogoGroup[]
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
  groups,
  logos = [],
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: LogoStripProps) {
  const isEditing = puck?.isEditing ?? false
  const isDeepNavy = bgColor === 'deep-navy'

  // Prioritize resolved groups/logos from server, fallback to props
  const rawGroups = _resolved?.groups || groups
  const rawLogos = _resolved?.logos || logos

  const effectiveGroups: LogoGroup[] =
    Array.isArray(rawGroups) && rawGroups.length > 0
      ? rawGroups
      : Array.isArray(rawLogos) && rawLogos.length > 0
        ? [{ label: '', logos: rawLogos }]
        : []

  const totalLogosCount = effectiveGroups.reduce(
    (acc, g) => acc + (Array.isArray(g?.logos) ? g.logos.length : 0),
    0,
  )

  if (!isEditing && totalLogosCount === 0) {
    return null
  }

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {title && (
          <p
            className={`text-center font-ui text-xs sm:text-sm font-semibold uppercase tracking-wider mb-8 ${
              isDeepNavy ? 'text-white/80' : 'text-deep-navy/70'
            }`}
          >
            {title}
          </p>
        )}

        {totalLogosCount === 0 ? (
          isEditing ? (
            <div className="py-8 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
              {vi.sm04.logoStripEmptyMessage}
            </div>
          ) : null
        ) : (
          <div className="space-y-10 sm:space-y-12">
            {effectiveGroups.map((group, groupIdx) => {
              const groupLogos = Array.isArray(group?.logos) ? group.logos : []
              if (!isEditing && groupLogos.length === 0) return null

              return (
                <div key={groupIdx} className="space-y-6">
                  {group.label && group.label.trim().length > 0 && (
                    <h3
                      className={`text-center font-ui text-xs sm:text-sm font-bold uppercase tracking-wider ${
                        isDeepNavy ? 'text-white/80' : 'text-deep-navy/70'
                      }`}
                    >
                      {group.label}
                    </h3>
                  )}

                  {groupLogos.length === 0 ? (
                    isEditing ? (
                      <div className="py-4 px-3 rounded-card border border-dashed border-deep-navy/20 text-center font-ui text-xs text-deep-navy/70">
                        {vi.sm04.logoStripGroupEmptyMessage(group.label || `#${groupIdx + 1}`)}
                      </div>
                    ) : null
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 md:gap-16">
                      {groupLogos.map((item, index) => {
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
                                ? 'border-white/20 text-white/70'
                                : 'border-deep-navy/20 text-deep-navy/70'
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
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
