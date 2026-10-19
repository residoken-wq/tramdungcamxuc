'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { useClientServices, type PublicServiceSummary } from '@/puck/client-preview'
import { vi } from '@/lib/i18n/vi'

export interface ServiceCardItem {
  serviceId?: string | number
}

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
  services?: ServiceCardItem[]
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
  services = [],
  highlightServiceId,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: ServiceCardsProps) {
  const isEditing = puck?.isEditing ?? false
  const isDeepNavy = bgColor === 'deep-navy'

  const serviceIds = (services || [])
    .map((s) => s?.serviceId)
    .filter((id): id is string | number => id != null && String(id).trim() !== '')

  const { services: clientServices } = useClientServices({
    serviceIds,
    initialServices: _resolved?.services as PublicServiceSummary[] | undefined,
  })

  const activeServices = (_resolved?.services || clientServices || []) as ResolvedService[]

  if (!isEditing && activeServices.length === 0) {
    return null
  }

  if (isEditing && activeServices.length === 0) {
    return (
      <section
        className={`w-full ${BG_COLORS[bgColor] || BG_COLORS['warm-ivory']} ${PADDINGS[padding]}`}
      >
        <div className="mx-auto max-w-5xl py-8 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
          {vi.sm04.emptyServicesMessage}
        </div>
      </section>
    )
  }

  const textColorClass = isDeepNavy ? 'text-white' : 'text-deep-navy'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'

  const gridColsClass =
    activeServices.length === 1
      ? 'max-w-md mx-auto'
      : activeServices.length === 2
        ? 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'

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

        <div className={gridColsClass}>
          {activeServices.map((service) => {
            const isHighlighted =
              highlightServiceId != null &&
              String(highlightServiceId).trim() !== '' &&
              String(highlightServiceId) === String(service.id)

            return (
              <div
                key={service.id}
                className={`rounded-card border overflow-hidden shadow-soft flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                  isHighlighted
                    ? 'bg-deep-navy border-deep-navy/20 text-white'
                    : 'bg-white border-deep-navy/10 text-deep-navy'
                }`}
              >
                <div>
                  {service.imageUrl ? (
                    <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-warm-ivory/50">
                      <Image
                        src={service.imageUrl}
                        alt={service.imageAlt || service.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                      {service.badge && (
                        <span className="absolute top-3 left-3 rounded-full bg-deep-navy/90 px-3 py-1 font-ui text-xs font-bold text-white shadow-soft">
                          {service.badge}
                        </span>
                      )}
                    </div>
                  ) : service.badge ? (
                    <div className="px-6 pt-6">
                      <span className="inline-block rounded-full bg-soft-pink px-3 py-1 font-ui text-xs font-bold text-deep-navy">
                        {service.badge}
                      </span>
                    </div>
                  ) : null}

                  <div className="p-6 sm:p-7">
                    {service.audienceLabel && (
                      <p
                        className={`font-ui text-xs font-bold uppercase tracking-wider mb-2 ${
                          isHighlighted ? 'text-soft-pink' : 'text-bright-magenta'
                        }`}
                      >
                        {service.audienceLabel}
                      </p>
                    )}

                    <h3
                      className={`font-display text-2xl uppercase tracking-tight mb-4 ${
                        isHighlighted ? 'text-white' : 'text-deep-navy'
                      }`}
                    >
                      {service.name}
                    </h3>

                    {service.situations && service.situations.length > 0 && (
                      <div className="mb-4">
                        <p
                          className={`font-ui text-xs font-bold uppercase tracking-wider mb-2 ${
                            isHighlighted ? 'text-soft-pink' : 'text-deep-navy/70'
                          }`}
                        >
                          {vi.sm04.suitsLabel}
                        </p>
                        <ul className="space-y-1.5 font-ui text-sm">
                          {service.situations.map((sit, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span
                                className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                                  isHighlighted ? 'bg-soft-pink' : 'bg-bright-magenta'
                                }`}
                              />
                              <span
                                className={isHighlighted ? 'text-white/90' : 'text-deep-navy/80'}
                              >
                                {sit}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {service.outcomes && service.outcomes.length > 0 && (
                      <div className="mb-6">
                        <p
                          className={`font-ui text-xs font-bold uppercase tracking-wider mb-2 ${
                            isHighlighted ? 'text-soft-pink' : 'text-deep-navy/70'
                          }`}
                        >
                          {vi.sm04.outcomesLabel}
                        </p>
                        <ul className="space-y-1.5 font-ui text-sm">
                          {service.outcomes.map((out, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span
                                className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                                  isHighlighted ? 'bg-mint-haze' : 'bg-bright-magenta'
                                }`}
                              />
                              <span
                                className={isHighlighted ? 'text-white/90' : 'text-deep-navy/80'}
                              >
                                {out}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 sm:p-7 sm:pt-0">
                  <Button
                    href={`/coaching/${service.slug}`}
                    variant={isHighlighted ? 'primary' : 'secondary'}
                    size="md"
                    className="w-full text-center"
                  >
                    {service.ctaLabel || vi.sm04.defaultServiceCta}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
