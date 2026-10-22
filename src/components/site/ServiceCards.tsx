import React from 'react'
import { ServiceCardItem } from './ServiceCardItem'
import { vi } from '@/lib/i18n/vi'

export interface ResolvedService {
  id: string | number
  name: string
  slug: string
  badge?: string | null
  imageUrl?: string | null
  imageAlt?: string | null
  audience?: string | null
  audienceLabel?: string | null
  situations?: string[] | null
  outcomes?: string[] | null
  ctaLabel?: string | null
  saleStatus?: string | null
}

export interface ServiceCardsProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  columns?: 1 | 2 | 3 | '1' | '2' | '3'
  cards?: React.ReactNode | React.ComponentType<{ className?: string }> | unknown[]
  // Legacy v1 props:
  services?: Array<{ serviceId?: string | number }>
  highlightServiceId?: string | number
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    services?: ResolvedService[]
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
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function ServiceCards({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  columns,
  cards,
  services,
  highlightServiceId,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: ServiceCardsProps) {
  const isEditing = Boolean(puck?.isEditing)
  const isDeepNavy = bgColor === 'deep-navy'

  const hasCards = Boolean(cards)
  const v1Services = (_resolved?.services || services || []) as Array<
    ResolvedService | { serviceId?: string | number }
  >
  const hasV1Services = v1Services.length > 0

  if (!isEditing && !hasCards && !hasV1Services) {
    return null
  }

  const numCols =
    columns !== undefined
      ? Number(columns) || 3
      : v1Services.length === 1
        ? 1
        : v1Services.length === 2
          ? 2
          : 3
  const gridColsClass =
    numCols === 1
      ? 'max-w-md mx-auto'
      : numCols === 2
        ? 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'

  const textColorClass = isDeepNavy ? 'text-white' : 'text-deep-navy'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'

  return (
    <section
      className={`w-full ${BG_COLORS[bgColor] || BG_COLORS['warm-ivory']} ${PADDINGS[padding]} transition-colors`}
    >
      <div className="mx-auto max-w-6xl">
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
              <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight leading-tight mb-3">
                <span className={textColorClass}>{titleLine1}</span>{' '}
                {titleLine2 && <span className={titleLine2ColorClass}>{titleLine2}</span>}
              </h2>
            )}

            {emotionLine && (
              <p
                className={`font-quote text-lg sm:text-xl italic max-w-2xl mx-auto leading-relaxed ${
                  isDeepNavy ? 'text-soft-pink' : 'text-deep-navy/80'
                }`}
              >
                {emotionLine}
              </p>
            )}
          </div>
        )}

        {/* Slot or fallback content */}
        {hasCards ? (
          typeof cards === 'function' ? (
            React.createElement(
              cards as React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
              { className: gridColsClass },
            )
          ) : React.isValidElement(cards) ? (
            <div className={gridColsClass}>{cards}</div>
          ) : Array.isArray(cards) ? (
            <div className={gridColsClass}>
              {cards.map((child: unknown, idx: number) => {
                if (React.isValidElement(child)) return child
                if (child && typeof child === 'object') {
                  const item = child as { props?: Record<string, unknown> }
                  if (item.props) {
                    return (
                      <ServiceCardItem
                        key={typeof item.props.id === 'string' ? item.props.id : idx}
                        isDeepNavy={isDeepNavy}
                        puck={puck}
                        {...item.props}
                      />
                    )
                  }
                }
                return null
              })}
            </div>
          ) : (
            <div className={gridColsClass}>{cards as React.ReactNode}</div>
          )
        ) : hasV1Services ? (
          <div className={gridColsClass}>
            {v1Services.map((service, idx) => {
              const srvObj = service as ResolvedService
              const srvId =
                srvObj.id || (service as { serviceId?: string | number }).serviceId || idx
              const isHighlighted =
                highlightServiceId != null &&
                String(highlightServiceId).trim() !== '' &&
                String(highlightServiceId) === String(srvId)

              return (
                <ServiceCardItem
                  key={srvId}
                  serviceId={srvId}
                  highlight={isHighlighted}
                  isDeepNavy={isDeepNavy}
                  _resolved={{ service: srvObj.name ? srvObj : null }}
                  puck={puck}
                />
              )
            })}
          </div>
        ) : isEditing ? (
          <div className="mx-auto max-w-5xl py-8 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
            {vi.sm04.emptyServicesMessage}
          </div>
        ) : null}
      </div>
    </section>
  )
}
