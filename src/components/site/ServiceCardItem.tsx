'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { useClientServices, type PublicServiceSummary } from '@/puck/client-preview'
import { vi } from '@/lib/i18n/vi'
import type { ResolvedService } from './ServiceCards'
import {
  type FontSizeOption,
  type TextColorOption,
  type AlignOption,
  fontSizeClass,
  textColorClass,
  textAlignClass,
} from '@/lib/brand/format-classes'

export interface ServiceCardItemProps {
  version?: number
  serviceId?: string | number
  highlight?: boolean
  nameColor?: TextColorOption
  nameSize?: FontSizeOption
  textColor?: TextColorOption
  textSize?: FontSizeOption
  align?: AlignOption
  _resolved?: {
    service?: ResolvedService | null
  }
  puck?: {
    isEditing?: boolean
  }
  isDeepNavy?: boolean
}

export function ServiceCardItem({
  serviceId,
  highlight = false,
  nameColor,
  nameSize = 'md',
  textColor,
  textSize = 'md',
  align = 'left',
  _resolved,
  puck,
  isDeepNavy: _isDeepNavy = false,
}: ServiceCardItemProps) {
  const isEditing = Boolean(puck?.isEditing)

  const serviceIds = React.useMemo(() => {
    return serviceId != null && String(serviceId).trim() !== '' ? [serviceId] : []
  }, [serviceId])

  const resolvedService = _resolved?.service
  const initialServices = React.useMemo(() => {
    return resolvedService ? [resolvedService as unknown as PublicServiceSummary] : undefined
  }, [resolvedService])

  const { services: clientServices } = useClientServices({
    serviceIds: isEditing ? serviceIds : [],
    initialServices,
  })

  const activeService = (
    isEditing
      ? _resolved?.service || (clientServices && clientServices[0]) || null
      : _resolved?.service || null
  ) as ResolvedService | null

  if (!activeService) {
    if (isEditing) {
      return (
        <div className="rounded-card border-2 border-dashed border-deep-navy/20 p-6 text-center text-sm font-ui text-deep-navy/60 bg-white/50 min-h-[220px] flex flex-col items-center justify-center">
          {serviceId ? `Dịch vụ ID: ${serviceId}` : vi.builder.noDataSelectInCms}
        </div>
      )
    }
    return null
  }

  // ServiceCards v1: only the highlighted card is navy; other cards stay white on any section.
  const isCardNavy = Boolean(highlight)

  // "deep-navy" is the stored default: treat it as automatic so a highlighted card keeps light text
  const resolvedNameColorClass =
    nameColor && nameColor !== 'deep-navy'
      ? textColorClass(nameColor)
      : isCardNavy
        ? 'text-white'
        : 'text-deep-navy'

  const resolvedTextColorClass =
    textColor && textColor !== 'deep-navy'
      ? textColorClass(textColor)
      : isCardNavy
        ? 'text-white/90'
        : 'text-deep-navy/80'

  const audienceLabel = activeService.audienceLabel
  const alignClass = ` ${textAlignClass(align)}`

  return (
    <div
      className={`rounded-card border overflow-hidden shadow-soft flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
        highlight
          ? 'bg-deep-navy border-deep-navy/20 text-white'
          : 'bg-white border-deep-navy/10 text-deep-navy'
      }${alignClass}`}
    >
      <div>
        {activeService.imageUrl ? (
          <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-warm-ivory/50">
            <Image
              src={activeService.imageUrl}
              alt={activeService.imageAlt || activeService.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
            {activeService.badge && (
              <span className="absolute top-3 left-3 rounded-full bg-deep-navy/90 px-3 py-1 font-ui text-xs font-bold text-white shadow-soft">
                {activeService.badge}
              </span>
            )}
          </div>
        ) : activeService.badge ? (
          <div className="px-6 pt-6">
            <span className="inline-block rounded-full bg-soft-pink px-3 py-1 font-ui text-xs font-bold text-deep-navy">
              {activeService.badge}
            </span>
          </div>
        ) : null}

        <div className="p-6 sm:p-7">
          {audienceLabel && (
            <p
              className={`font-ui text-xs font-bold uppercase tracking-wider mb-2 ${
                isCardNavy ? 'text-soft-pink' : 'text-bright-magenta'
              }`}
            >
              {audienceLabel}
            </p>
          )}

          <h3
            className={`font-display ${fontSizeClass('service-name', nameSize)} uppercase tracking-tight mb-4 ${resolvedNameColorClass}`}
          >
            {activeService.name}
          </h3>

          {activeService.situations && activeService.situations.length > 0 && (
            <div className="mb-4">
              <p
                className={`font-ui text-xs font-bold uppercase tracking-wider mb-2 ${
                  isCardNavy ? 'text-soft-pink' : 'text-deep-navy/70'
                }`}
              >
                {vi.sm04.suitsLabel}
              </p>
              <ul className={`space-y-1.5 font-ui ${fontSizeClass('service-text', textSize)}`}>
                {activeService.situations.map((sit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                        isCardNavy ? 'bg-soft-pink' : 'bg-bright-magenta'
                      }`}
                    />
                    <span className={resolvedTextColorClass}>{sit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeService.outcomes && activeService.outcomes.length > 0 && (
            <div className="mb-6">
              <p
                className={`font-ui text-xs font-bold uppercase tracking-wider mb-2 ${
                  isCardNavy ? 'text-soft-pink' : 'text-deep-navy/70'
                }`}
              >
                {vi.sm04.outcomesLabel}
              </p>
              <ul className={`space-y-1.5 font-ui ${fontSizeClass('service-text', textSize)}`}>
                {activeService.outcomes.map((out, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                        isCardNavy ? 'bg-mint-haze' : 'bg-bright-magenta'
                      }`}
                    />
                    <span className={resolvedTextColorClass}>{out}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 pt-0 sm:p-7 sm:pt-0">
        <Button
          href={`/coaching/${activeService.slug}`}
          variant={highlight ? 'primary' : 'secondary'}
          size="md"
          className="w-full text-center"
        >
          {activeService.ctaLabel || vi.sm04.defaultServiceCta}
        </Button>
      </div>
    </div>
  )
}
