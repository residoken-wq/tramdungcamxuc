'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { useClientPageSlug } from '@/puck/client-preview'
import type { FontSizeOption } from '@/lib/brand/format-classes'
import { PathCard, resolveSafeLink, type PathCardProps } from './PathCard'

export interface TwoPathCardsProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  path1GroupLabel?: string
  path1Title?: string
  path1Description?: string
  path1ButtonLabel?: string
  path1LinkType?: 'url' | 'page'
  path1PageId?: string | number
  path1Href?: string
  path1ButtonStyle?: 'solid' | 'outline'

  path2GroupLabel?: string
  path2Title?: string
  path2Description?: string
  path2ButtonLabel?: string
  path2LinkType?: 'url' | 'page'
  path2PageId?: string | number
  path2Href?: string
  path2ButtonStyle?: 'solid' | 'outline'

  /** v2 (PK-08): draggable PathCard children. Puck passes the slot as a component. */
  paths?:
    | React.ComponentType<{ className?: string }>
    | React.ReactNode
    | Array<{ type?: string; props?: PathCardProps & { id?: string } }>
  titleSize?: FontSizeOption
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    path1PageSlug?: string | null
    path2PageSlug?: string | null
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

// `md` (the default) keeps the pre-PK-08 heading size.
const TITLE_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-2xl sm:text-3xl',
  md: 'text-3xl sm:text-4xl',
  lg: 'text-4xl sm:text-5xl',
}

const PATHS_GRID = 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch'

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function TwoPathCards({
  seriesLabel,
  titleLine1,
  titleLine2,
  path1GroupLabel,
  path1Title,
  path1Description,
  path1ButtonLabel,
  path1LinkType = 'url',
  path1PageId,
  path1Href,
  path1ButtonStyle = 'solid',

  path2GroupLabel,
  path2Title,
  path2Description,
  path2ButtonLabel,
  path2LinkType = 'url',
  path2PageId,
  path2Href,
  path2ButtonStyle = 'outline',

  paths,
  titleSize = 'md',
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
}: TwoPathCardsProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const textColorClass = isDeepNavy ? 'text-white' : 'text-deep-navy'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const cardBgClass = isDeepNavy ? 'bg-white/10 border-white/15' : 'bg-white border-deep-navy/10'
  const descColorClass = isDeepNavy ? 'text-white/90' : 'text-deep-navy/80'

  const { slug: clientSlug1 } = useClientPageSlug(path1PageId, _resolved?.path1PageSlug)
  const { slug: clientSlug2 } = useClientPageSlug(path2PageId, _resolved?.path2PageSlug)

  const finalHref1 = resolveSafeLink(
    path1LinkType,
    path1Href,
    _resolved?.path1PageSlug ?? clientSlug1,
  )
  const finalHref2 = resolveSafeLink(
    path2LinkType,
    path2Href,
    _resolved?.path2PageSlug ?? clientSlug2,
  )

  return (
    <section
      className={`group/paths w-full ${BG_COLORS[bgColor] || BG_COLORS['warm-ivory']} ${PADDINGS[padding]} transition-colors`}
      data-bg={bgColor}
    >
      <div className="mx-auto max-w-5xl">
        {(seriesLabel || titleLine1) && (
          <div className="text-center mb-10 sm:mb-14">
            {seriesLabel && (
              <span
                className={`mb-3 block font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
              >
                {seriesLabel}
              </span>
            )}

            {titleLine1 && (
              <h2
                className={`font-display uppercase tracking-tight leading-tight ${TITLE_SIZES[titleSize] ?? TITLE_SIZES.md}`}
              >
                <span className={textColorClass}>{titleLine1}</span>{' '}
                {titleLine2 && <span className={titleLine2ColorClass}>{titleLine2}</span>}
              </h2>
            )}
          </div>
        )}

        {typeof paths === 'function' ? (
          React.createElement(paths as React.ComponentType<{ className?: string }>, {
            className: PATHS_GRID,
          })
        ) : paths && React.isValidElement(paths) ? (
          <div className={PATHS_GRID}>{paths}</div>
        ) : Array.isArray(paths) ? (
          <div className={PATHS_GRID}>
            {(paths as unknown[]).map((child, idx) => {
              const block = child as { props?: PathCardProps & { id?: string } } | null
              return block && typeof block === 'object' && block.props ? (
                <PathCard key={block.props.id || idx} {...block.props} />
              ) : null
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Card 1: Cá nhân */}
            <div
              className={`rounded-card border ${cardBgClass} p-6 sm:p-8 shadow-soft flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1`}
            >
              <div>
                {path1GroupLabel && (
                  <span
                    className={`mb-3 block font-ui text-xs font-bold uppercase tracking-widest ${
                      isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
                    }`}
                  >
                    {path1GroupLabel}
                  </span>
                )}

                <h3
                  className={`font-display text-2xl sm:text-3xl uppercase tracking-tight mb-4 ${textColorClass}`}
                >
                  {path1Title}
                </h3>

                <p className={`font-ui text-base leading-relaxed mb-6 ${descColorClass}`}>
                  {path1Description}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  href={finalHref1}
                  variant={path1ButtonStyle === 'outline' ? 'ghost' : 'primary'}
                  size="md"
                  className="w-full text-center"
                >
                  {path1ButtonLabel}
                </Button>
              </div>
            </div>

            {/* Card 2: Doanh nghiệp */}
            <div
              className={`rounded-card border ${cardBgClass} p-6 sm:p-8 shadow-soft flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1`}
            >
              <div>
                {path2GroupLabel && (
                  <span
                    className={`mb-3 block font-ui text-xs font-bold uppercase tracking-widest ${
                      isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
                    }`}
                  >
                    {path2GroupLabel}
                  </span>
                )}

                <h3
                  className={`font-display text-2xl sm:text-3xl uppercase tracking-tight mb-4 ${textColorClass}`}
                >
                  {path2Title}
                </h3>

                <p className={`font-ui text-base leading-relaxed mb-6 ${descColorClass}`}>
                  {path2Description}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  href={finalHref2}
                  variant={path2ButtonStyle === 'outline' ? 'ghost' : 'primary'}
                  size="md"
                  className="w-full text-center"
                >
                  {path2ButtonLabel}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
