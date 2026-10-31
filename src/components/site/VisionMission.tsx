import React from 'react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'
import type { FontSizeOption } from '@/lib/brand/format-classes'
import { VisionCardItem, type VisionCardItemProps } from './VisionCardItem'

export interface VisionMissionProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  quote?: string
  visionTitle?: string
  visionContent?: string
  visionIcon?: BrandIconKey | string
  missionTitle?: string
  missionContent?: string
  missionIcon?: BrandIconKey | string
  /** v2 (PK-09): draggable VisionCard children. Puck passes the slot as a component. */
  cards?:
    | React.ComponentType<{ className?: string }>
    | React.ReactNode
    | Array<{ type?: string; props?: VisionCardItemProps & { id?: string } }>
  titleSize?: FontSizeOption
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
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

// `md` (the default) keeps the pre-PK-09 heading size.
const TITLE_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-2xl sm:text-3xl',
  md: 'text-3xl sm:text-4xl',
  lg: 'text-4xl sm:text-5xl',
}

const CARDS_GRID = 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch'

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function VisionMission({
  seriesLabel,
  titleLine1,
  titleLine2,
  quote,
  visionTitle,
  visionContent,
  visionIcon = 'compass',
  missionTitle,
  missionContent,
  missionIcon = 'heart',
  cards,
  titleSize = 'md',
  bgColor = 'warm-ivory',
  padding = 'md',
}: VisionMissionProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const textColorClass = isDeepNavy ? 'text-white' : 'text-deep-navy'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const descColorClass = isDeepNavy ? 'text-white/90' : 'text-deep-navy/80'
  const cardBgClass = isDeepNavy ? 'bg-white/10 border-white/15' : 'bg-white border-deep-navy/10'
  const iconColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'

  const visionParagraphs = (visionContent || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const missionParagraphs = (missionContent || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <section
      className={`group/vm w-full ${BG_COLORS[bgColor] || BG_COLORS['warm-ivory']} ${PADDINGS[padding]} transition-colors`}
      data-bg={bgColor}
    >
      <div className="mx-auto max-w-5xl">
        {(seriesLabel || titleLine1) && (
          <div className="text-center mb-8 sm:mb-12">
            {seriesLabel && (
              <span
                className={`mb-3 block font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
              >
                {seriesLabel}
              </span>
            )}

            {titleLine1 && (
              <h2
                className={`font-display ${TITLE_SIZES[titleSize] ?? TITLE_SIZES.md} uppercase tracking-tight leading-[1.3]`}
              >
                <span className={textColorClass}>{titleLine1}</span>{' '}
                {titleLine2 && <span className={titleLine2ColorClass}>{titleLine2}</span>}
              </h2>
            )}
          </div>
        )}

        {quote && (
          <div className="mb-10 max-w-2xl mx-auto text-center">
            <blockquote
              className={`font-quote text-lg sm:text-xl italic leading-relaxed ${
                isDeepNavy ? 'text-soft-pink' : 'text-deep-navy'
              }`}
            >
              &ldquo;{quote}&rdquo;
            </blockquote>
            <div className="mt-4 flex justify-center">
              <div className="w-12 h-0.5 bg-bright-magenta/40 rounded-full" />
            </div>
          </div>
        )}

        {typeof cards === 'function' ? (
          React.createElement(cards as React.ComponentType<{ className?: string }>, {
            className: CARDS_GRID,
          })
        ) : cards && React.isValidElement(cards) ? (
          <div className={CARDS_GRID}>{cards}</div>
        ) : Array.isArray(cards) ? (
          <div className={CARDS_GRID}>
            {(cards as unknown[]).map((child, idx) => {
              const block = child as { props?: VisionCardItemProps & { id?: string } } | null
              return block && typeof block === 'object' && block.props ? (
                <VisionCardItem key={block.props.id || idx} {...block.props} />
              ) : null
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Card 1: Tầm nhìn */}
            <div
              className={`rounded-card border ${cardBgClass} p-6 sm:p-8 shadow-soft flex flex-col justify-between`}
            >
              <div>
                <div className="mb-4 inline-flex items-center justify-center p-3 rounded-full bg-soft-pink/40">
                  <BrandIcon
                    name={visionIcon}
                    className={`w-8 h-8 ${iconColorClass}`}
                    aria-hidden="true"
                  />
                </div>

                <h3
                  className={`font-display text-2xl uppercase tracking-tight mb-3 ${textColorClass}`}
                >
                  {visionTitle}
                </h3>

                <div className="space-y-3">
                  {visionParagraphs.map((p, idx) => (
                    <p key={idx} className={`font-ui text-base leading-relaxed ${descColorClass}`}>
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Sứ mệnh */}
            <div
              className={`rounded-card border ${cardBgClass} p-6 sm:p-8 shadow-soft flex flex-col justify-between`}
            >
              <div>
                <div className="mb-4 inline-flex items-center justify-center p-3 rounded-full bg-soft-pink/40">
                  <BrandIcon
                    name={missionIcon}
                    className={`w-8 h-8 ${iconColorClass}`}
                    aria-hidden="true"
                  />
                </div>

                <h3
                  className={`font-display text-2xl uppercase tracking-tight mb-3 ${textColorClass}`}
                >
                  {missionTitle}
                </h3>

                <div className="space-y-3">
                  {missionParagraphs.map((p, idx) => (
                    <p key={idx} className={`font-ui text-base leading-relaxed ${descColorClass}`}>
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
