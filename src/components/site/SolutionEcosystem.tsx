'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { resolveProductCta, type PublicProduct } from '@/lib/products'
import {
  useClientProducts,
  useClientServices,
  useClientPrograms,
  type PublicServiceSummary,
  type PublicProgramSummary,
} from '@/puck/client-preview'
import { vi } from '@/lib/i18n/vi'

export type { PublicServiceSummary, PublicProgramSummary }

export interface SolutionEcosystemProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  description?: string
  // Column 1: Products
  col1Title?: string
  col1Description?: string
  col1Products?: Array<{ productId?: string | number }>
  // Column 2: Services
  col2Title?: string
  col2Description?: string
  col2Services?: Array<{ serviceId?: string | number }>
  // Column 3: Programs
  col3Title?: string
  col3Description?: string
  col3Programs?: Array<{ programId?: string | number }>
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    products?: PublicProduct[]
    services?: PublicServiceSummary[]
    programs?: PublicProgramSummary[]
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

export function SolutionEcosystem({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  description,
  col1Title = '[MẪU] Đào tạo cá nhân',
  col1Description = '[MẪU] Các công cụ số và lộ trình tự học',
  col1Products,
  col2Title = '[MẪU] Khai vấn 1:1',
  col2Description = '[MẪU] Đồng hành chuyên sâu cá nhân hóa',
  col2Services,
  col3Title = '[MẪU] Doanh nghiệp',
  col3Description = '[MẪU] Giải pháp phát triển văn hóa và đội ngũ',
  col3Programs,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: SolutionEcosystemProps) {
  const isEditing = puck?.isEditing ?? false
  const isDeepNavy = bgColor === 'deep-navy'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const descColorClass = isDeepNavy ? 'text-white/80' : 'text-deep-navy/80'

  const productIds = col1Products?.map((p) => p.productId).filter(Boolean) as
    | Array<string | number>
    | undefined
  const serviceIds = col2Services?.map((s) => s.serviceId).filter(Boolean) as
    | Array<string | number>
    | undefined
  const programIds = col3Programs?.map((p) => p.programId).filter(Boolean) as
    | Array<string | number>
    | undefined

  const { products: loadedProducts } = useClientProducts({
    productIds,
    initialProducts: _resolved?.products,
  })
  const { services: loadedServices } = useClientServices({
    serviceIds,
    initialServices: _resolved?.services,
  })
  const { programs: loadedPrograms } = useClientPrograms({
    programIds,
    initialPrograms: _resolved?.programs,
  })

  const products = loadedProducts || []
  const services = loadedServices || []
  const programs = loadedPrograms || []

  const showCol1 = isEditing || products.length > 0
  const showCol2 = isEditing || services.length > 0
  const showCol3 = isEditing || programs.length > 0

  if (!showCol1 && !showCol2 && !showCol3) {
    if (isEditing) {
      return (
        <div className="p-8 text-center text-deep-navy/60 bg-warm-ivory rounded-card border border-dashed border-deep-navy/20 m-4">
          {vi.builder.noDataSelectInCms}
        </div>
      )
    }
    return null
  }

  const visibleCount = [showCol1, showCol2, showCol3].filter(Boolean).length
  const gridClass =
    visibleCount === 1
      ? 'max-w-md mx-auto grid-cols-1'
      : visibleCount === 2
        ? 'max-w-4xl mx-auto grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-3'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        {(titleLine1 || seriesLabel) && (
          <div className="text-center mb-10 sm:mb-14 flex flex-col items-center">
            {seriesLabel && (
              <span
                className={`mb-3 font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
              >
                {seriesLabel}
              </span>
            )}

            {titleLine1 && (
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-[1.3]">
                <span className={isDeepNavy ? 'text-white' : 'text-deep-navy'}>{titleLine1}</span>{' '}
                {titleLine2 && <span className={titleLine2ColorClass}>{titleLine2}</span>}
              </h2>
            )}

            {emotionLine && (
              <p
                className={`mt-4 font-quote text-lg sm:text-xl italic max-w-2xl ${
                  isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
                }`}
              >
                {emotionLine}
              </p>
            )}

            {description && (
              <p
                className={`mt-4 font-ui text-base sm:text-lg leading-relaxed max-w-2xl ${descColorClass}`}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Dynamic Pillars Grid */}
        <div className={`grid ${gridClass} gap-6 sm:gap-8 items-stretch`}>
          {/* Column 1: Products (Đào tạo cá nhân) */}
          {showCol1 && (
            <div className="flex flex-col justify-between p-6 sm:p-8 rounded-card border border-deep-navy/10 bg-white text-deep-navy shadow-soft">
              <div>
                <h3 className="font-display text-2xl uppercase tracking-tight text-deep-navy mb-2">
                  {col1Title}
                </h3>
                {col1Description && (
                  <p className="font-ui text-sm text-deep-navy/70 leading-relaxed mb-6">
                    {col1Description}
                  </p>
                )}

                <div className="space-y-4">
                  {products.length === 0 ? (
                    isEditing ? (
                      <p className="text-xs italic text-deep-navy/60">
                        {vi.sm03.noProductsSelected}
                      </p>
                    ) : null
                  ) : (
                    products.map((p) => {
                      const cta = resolveProductCta({
                        slug: p.slug,
                        saleStatus: p.saleStatus,
                        type: p.type,
                        trialDays: p.trialDays,
                        externalUrl: p.externalUrl,
                        externalLabel: p.externalLabel,
                        ctaLabel: p.ctaLabel,
                      })
                      const safeLink = cta?.href ? safeHref(cta.href) : null
                      const desc = p.shortDescription || p.tagline || ''

                      return (
                        <div
                          key={p.id}
                          className="rounded-xl border border-deep-navy/10 bg-warm-ivory/60 p-4 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <h4 className="font-ui font-bold text-base text-deep-navy">{p.name}</h4>
                            {desc && (
                              <p className="font-ui text-xs text-deep-navy/75 leading-relaxed mt-1">
                                {desc}
                              </p>
                            )}
                          </div>
                          {safeLink && cta && (
                            <div className="pt-1">
                              <Button
                                href={safeLink}
                                variant="secondary"
                                size="sm"
                                className="w-full text-xs"
                              >
                                {cta.label}
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Column 2: Services (Khai vấn 1:1) - NỀN DEEP-NAVY */}
          {showCol2 && (
            <div className="flex flex-col justify-between p-6 sm:p-8 rounded-card border border-white/20 bg-deep-navy text-white shadow-soft relative ring-2 ring-deep-navy">
              <div>
                <h3 className="font-display text-2xl uppercase tracking-tight text-white mb-2">
                  {col2Title}
                </h3>
                {col2Description && (
                  <p className="font-ui text-sm text-white/80 leading-relaxed mb-6">
                    {col2Description}
                  </p>
                )}

                <div className="space-y-4">
                  {services.length === 0 ? (
                    isEditing ? (
                      <p className="text-xs italic text-white/60">
                        {vi.sm03.noServicesSelected}
                      </p>
                    ) : null
                  ) : (
                    services.map((s) => {
                      const label = s.ctaLabel || vi.detail.service.defaultBookingLabel
                      const safeLink = safeHref(`/coaching/${encodeURIComponent(s.slug)}`)
                      const desc = s.audienceLabel || s.audience || ''

                      return (
                        <div
                          key={s.id}
                          className="rounded-xl border border-white/20 bg-white/10 p-4 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <h4 className="font-ui font-bold text-base text-white">{s.name}</h4>
                            {desc && (
                              <p className="font-ui text-xs text-white/80 leading-relaxed mt-1">
                                {desc}
                              </p>
                            )}
                          </div>
                          {safeLink && (
                            <div className="pt-1">
                              <Button
                                href={safeLink}
                                variant="primary"
                                size="sm"
                                className="w-full text-xs"
                              >
                                {label}
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Column 3: Programs (Giải pháp doanh nghiệp) */}
          {showCol3 && (
            <div className="flex flex-col justify-between p-6 sm:p-8 rounded-card border border-deep-navy/10 bg-white text-deep-navy shadow-soft">
              <div>
                <h3 className="font-display text-2xl uppercase tracking-tight text-deep-navy mb-2">
                  {col3Title}
                </h3>
                {col3Description && (
                  <p className="font-ui text-sm text-deep-navy/70 leading-relaxed mb-6">
                    {col3Description}
                  </p>
                )}

                <div className="space-y-4">
                  {programs.length === 0 ? (
                    isEditing ? (
                      <p className="text-xs italic text-deep-navy/60">
                        {vi.sm03.noProgramsSelected}
                      </p>
                    ) : null
                  ) : (
                    programs.map((prog) => {
                      const label = prog.ctaLabel || vi.detail.program.sendBrief
                      const safeLink = safeHref(`/doanh-nghiep/${encodeURIComponent(prog.slug)}`)
                      const desc = prog.learnerGroup || prog.format || ''

                      return (
                        <div
                          key={prog.id}
                          className="rounded-xl border border-deep-navy/10 bg-warm-ivory/60 p-4 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <h4 className="font-ui font-bold text-base text-deep-navy">
                              {prog.name}
                            </h4>
                            {desc && (
                              <p className="font-ui text-xs text-deep-navy/75 leading-relaxed mt-1">
                                {desc}
                              </p>
                            )}
                          </div>
                          {safeLink && (
                            <div className="pt-1">
                              <Button
                                href={safeLink}
                                variant="secondary"
                                size="sm"
                                className="w-full text-xs"
                              >
                                {label}
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
