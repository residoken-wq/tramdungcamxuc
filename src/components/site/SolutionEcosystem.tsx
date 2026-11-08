'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { BrandIcon } from '@/components/brand/BrandIcon'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'
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
import { TwoToneTitle } from '@/components/ui/TwoToneTitle'

export type { PublicServiceSummary, PublicProgramSummary }

export type ColumnGroupItemStyle = 'row' | 'card'
export type ColumnGroupButtonStyle = 'outline' | 'filled'
export type ColumnGroupFrame = 'outlined' | 'plain'

export interface ColumnGroupProductItem {
  productId?: string | number
  heading?: string
  buttonText?: string
}

export interface ColumnGroupServiceItem {
  serviceId?: string | number
  heading?: string
  buttonText?: string
}

export interface ColumnGroupProgramItem {
  programId?: string | number
  heading?: string
  buttonText?: string
}

export interface ColumnGroup<
  TItem = ColumnGroupProductItem | ColumnGroupServiceItem | ColumnGroupProgramItem,
> {
  badge?: string
  title?: string
  frame?: ColumnGroupFrame
  itemStyle?: ColumnGroupItemStyle
  buttonStyle?: ColumnGroupButtonStyle
  items?: TItem[]
}

export interface SolutionEcosystemProps {
  version?: number
  layout?: 'cards' | 'groups'
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  description?: string
  // Column 1: Products
  col1Title?: string
  col1Description?: string
  col1Icon?: BrandIconKey | string
  col1Accent?: string
  col1Products?: Array<{ productId?: string | number }>
  col1Groups?: Array<ColumnGroup<ColumnGroupProductItem>>
  // Column 2: Services
  col2Title?: string
  col2Description?: string
  col2Icon?: BrandIconKey | string
  col2Accent?: string
  col2Services?: Array<{ serviceId?: string | number }>
  col2Groups?: Array<ColumnGroup<ColumnGroupServiceItem>>
  // Column 3: Programs
  col3Title?: string
  col3Description?: string
  col3Icon?: BrandIconKey | string
  col3Accent?: string
  col3Programs?: Array<{ programId?: string | number }>
  col3Groups?: Array<ColumnGroup<ColumnGroupProgramItem>>
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
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

const ACCENT_BAR_COLORS: Record<string, string> = {
  none: '',
  'deep-navy': 'bg-deep-navy',
  'bright-magenta': 'bg-bright-magenta',
  'accent-pink': 'bg-accent-pink',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'warm-ivory': 'bg-warm-ivory',
}

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function SolutionEcosystem({
  version: _version,
  layout = 'cards',
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  description,
  col1Title = '[MẪU] Đào tạo cá nhân',
  col1Description = '[MẪU] Các công cụ số và lộ trình tự học',
  col1Icon,
  col1Accent = 'accent-pink',
  col1Products,
  col1Groups,
  col2Title = '[MẪU] Khai vấn 1:1',
  col2Description = '[MẪU] Đồng hành chuyên sâu cá nhân hóa',
  col2Icon,
  col2Accent = 'none',
  col2Services,
  col2Groups,
  col3Title = '[MẪU] Doanh nghiệp',
  col3Description = '[MẪU] Giải pháp phát triển văn hóa và đội ngũ',
  col3Icon,
  col3Accent = 'deep-navy',
  col3Programs,
  col3Groups,
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

  const col1GroupProductIds = (col1Groups || []).flatMap(
    (g) => g?.items?.map((it) => it?.productId).filter(Boolean) || [],
  )
  const productIds = [
    ...(col1Products || []).map((p) => p?.productId).filter(Boolean),
    ...col1GroupProductIds,
  ] as Array<string | number> | undefined

  const col2GroupServiceIds = (col2Groups || []).flatMap(
    (g) => g?.items?.map((it) => it?.serviceId).filter(Boolean) || [],
  )
  const serviceIds = [
    ...(col2Services || []).map((s) => s?.serviceId).filter(Boolean),
    ...col2GroupServiceIds,
  ] as Array<string | number> | undefined

  const col3GroupProgramIds = (col3Groups || []).flatMap(
    (g) => g?.items?.map((it) => it?.programId).filter(Boolean) || [],
  )
  const programIds = [
    ...(col3Programs || []).map((p) => p?.programId).filter(Boolean),
    ...col3GroupProgramIds,
  ] as Array<string | number> | undefined

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

  const isGroupsLayout = layout === 'groups'

  // Effective groups: if layout === 'groups' and colNGroups is empty/missing, fall back to a single card group with existing items
  const effectiveCol1Groups: Array<ColumnGroup<ColumnGroupProductItem>> =
    col1Groups && col1Groups.length > 0
      ? col1Groups
      : products.length > 0
        ? [
            {
              frame: 'plain',
              itemStyle: 'card',
              buttonStyle: 'filled',
              items: products.map((p) => ({ productId: p.id })),
            },
          ]
        : []

  const effectiveCol2Groups: Array<ColumnGroup<ColumnGroupServiceItem>> =
    col2Groups && col2Groups.length > 0
      ? col2Groups
      : services.length > 0
        ? [
            {
              frame: 'plain',
              itemStyle: 'card',
              buttonStyle: 'filled',
              items: services.map((s) => ({ serviceId: s.id })),
            },
          ]
        : []

  const effectiveCol3Groups: Array<ColumnGroup<ColumnGroupProgramItem>> =
    col3Groups && col3Groups.length > 0
      ? col3Groups
      : programs.length > 0
        ? [
            {
              frame: 'plain',
              itemStyle: 'card',
              buttonStyle: 'filled',
              items: programs.map((prog) => ({ programId: prog.id })),
            },
          ]
        : []

  const showCol1 =
    isEditing || (isGroupsLayout ? effectiveCol1Groups.length > 0 : products.length > 0)
  const showCol2 =
    isEditing || (isGroupsLayout ? effectiveCol2Groups.length > 0 : services.length > 0)
  const showCol3 =
    isEditing || (isGroupsLayout ? effectiveCol3Groups.length > 0 : programs.length > 0)

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

  const productsMap = new Map(products.map((p) => [String(p.id), p]))
  const servicesMap = new Map(services.map((s) => [String(s.id), s]))
  const programsMap = new Map(programs.map((pr) => [String(pr.id), pr]))

  const getItemDetails = (
    item: ColumnGroupProductItem & ColumnGroupServiceItem & ColumnGroupProgramItem,
    type: 'product' | 'service' | 'program',
  ) => {
    if (type === 'product') {
      const p = item.productId ? productsMap.get(String(item.productId)) : undefined
      if (!p) {
        return {
          name: isEditing ? `[Sản phẩm ID: ${item.productId || ''}]` : '',
          desc: '',
          safeLink: null,
          defaultLabel: vi.pk19.defaultBookNow,
        }
      }
      const cta = resolveProductCta({
        slug: p.slug,
        saleStatus: p.saleStatus,
        type: p.type,
        trialDays: p.trialDays,
        externalUrl: p.externalUrl,
        externalLabel: p.externalLabel,
        ctaLabel: p.ctaLabel,
      })
      return {
        name: p.name,
        desc: p.tagline || p.shortDescription || '',
        safeLink: cta?.href ? safeHref(cta.href) : null,
        defaultLabel: cta?.label || vi.pk19.defaultBookNow,
      }
    }

    if (type === 'service') {
      const s = item.serviceId ? servicesMap.get(String(item.serviceId)) : undefined
      if (!s) {
        return {
          name: isEditing ? `[Dịch vụ ID: ${item.serviceId || ''}]` : '',
          desc: '',
          safeLink: null,
          defaultLabel: vi.detail.service.defaultBookingLabel,
        }
      }
      return {
        name: s.name,
        desc: s.audienceLabel || s.audience || '',
        safeLink: safeHref(`/coaching/${encodeURIComponent(s.slug)}`),
        defaultLabel: s.ctaLabel || vi.detail.service.defaultBookingLabel,
      }
    }

    const prog = item.programId ? programsMap.get(String(item.programId)) : undefined
    if (!prog) {
      return {
        name: isEditing ? `[Chương trình ID: ${item.programId || ''}]` : '',
        desc: '',
        safeLink: null,
        defaultLabel: vi.detail.program.sendBrief,
      }
    }
    return {
      name: prog.name,
      desc: prog.learnerGroup || prog.format || '',
      safeLink: safeHref(`/doanh-nghiep/${encodeURIComponent(prog.slug)}`),
      defaultLabel: prog.ctaLabel || vi.detail.program.sendBrief,
    }
  }

  const renderGroupsColumn = ({
    isDark,
    colTitle,
    colDescription,
    colIcon,
    colAccent,
    groups,
    emptyNote,
    type,
  }: {
    isDark: boolean
    colTitle?: string
    colDescription?: string
    colIcon?: BrandIconKey | string
    colAccent?: string
    groups: Array<ColumnGroup<any>>
    emptyNote: string
    type: 'product' | 'service' | 'program'
  }) => {
    const accentBarClass = colAccent && colAccent !== 'none' ? ACCENT_BAR_COLORS[colAccent] : null

    return (
      <div
        data-eb-card=""
        className={`flex flex-col justify-between rounded-card border shadow-soft overflow-hidden ${
          isDark
            ? 'border-white/20 bg-deep-navy text-white relative ring-2 ring-deep-navy'
            : 'border-deep-navy/10 bg-white text-deep-navy'
        }`}
      >
        <div>
          {accentBarClass && <div className={`h-[6px] w-full ${accentBarClass}`} />}
          <div className="p-6 sm:p-8">
            {colIcon && (
              <div
                className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-white/10 text-soft-pink' : 'bg-soft-pink text-bright-magenta'
                }`}
              >
                <BrandIcon name={colIcon} size={22} />
              </div>
            )}

            <h3
              className={`font-ui font-bold text-xl sm:text-[20px] mb-2 ${
                isDark ? 'text-white' : 'text-deep-navy'
              }`}
            >
              {colTitle}
            </h3>

            {colDescription && (
              <p
                className={`font-ui text-sm leading-relaxed mb-6 ${
                  isDark ? 'text-white/80' : 'text-deep-navy/70'
                }`}
              >
                {colDescription}
              </p>
            )}

            {groups.length === 0 ? (
              isEditing ? (
                <p className={`text-xs italic ${isDark ? 'text-white/60' : 'text-deep-navy/60'}`}>
                  {emptyNote}
                </p>
              ) : null
            ) : (
              <div className="space-y-4">
                {groups.map((grp, gIdx) => {
                  const frame = grp.frame || 'plain'
                  const itemStyle = grp.itemStyle || 'card'
                  const buttonStyle = grp.buttonStyle || 'outline'
                  const isOutlined = frame === 'outlined'
                  const itemsList = grp.items || []

                  return (
                    <div
                      key={gIdx}
                      className={
                        isOutlined
                          ? `rounded-xl p-4 sm:p-5 border border-accent-pink ${
                              isDark ? 'bg-white/5' : 'bg-soft-pink/30'
                            }`
                          : 'space-y-3'
                      }
                    >
                      {grp.badge && (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-ui font-bold uppercase tracking-wider mb-2 ${
                            isDark
                              ? 'bg-white/10 text-soft-pink'
                              : 'bg-soft-pink text-bright-magenta'
                          }`}
                        >
                          {grp.badge}
                        </span>
                      )}

                      {grp.title && (
                        <h4
                          className={`font-ui font-bold text-sm sm:text-base mb-3 ${
                            isDark ? 'text-white' : 'text-deep-navy'
                          }`}
                        >
                          {grp.title}
                        </h4>
                      )}

                      {itemStyle === 'row' ? (
                        <div className="space-y-2">
                          {itemsList.map((item, iIdx) => {
                            const { name, desc, safeLink, defaultLabel } = getItemDetails(
                              item,
                              type,
                            )
                            if (!name && !isEditing) return null
                            const buttonLabel = item.buttonText?.trim() || defaultLabel

                            return (
                              <div
                                key={iIdx}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 py-2 border-b last:border-b-0 ${
                                  isDark ? 'border-white/10' : 'border-deep-navy/5'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  {isOutlined ? (
                                    <span className="w-2.5 h-2.5 rounded-full bg-accent-pink shrink-0 mt-1" />
                                  ) : (
                                    <span className="w-2.5 h-2.5 rounded-sm bg-accent-pink shrink-0 mt-1" />
                                  )}
                                  <div className="font-ui text-xs sm:text-sm leading-relaxed">
                                    <strong
                                      className={`font-ui font-bold ${
                                        isDark ? 'text-white' : 'text-deep-navy'
                                      }`}
                                    >
                                      {name}:
                                    </strong>{' '}
                                    <span
                                      className={isDark ? 'text-white/80' : 'text-deep-navy/80'}
                                    >
                                      {desc}
                                    </span>
                                  </div>
                                </div>

                                {safeLink && (
                                  <Link
                                    href={safeLink}
                                    className={`shrink-0 self-start sm:self-center px-3.5 py-1 text-xs font-bold rounded-full transition-colors min-h-[36px] flex items-center justify-center ${
                                      buttonStyle === 'outline'
                                        ? isDark
                                          ? 'border border-white text-white hover:bg-white hover:text-deep-navy'
                                          : 'border border-bright-magenta text-bright-magenta hover:bg-bright-magenta hover:text-white'
                                        : 'bg-accent-pink text-white hover:opacity-90'
                                    }`}
                                  >
                                    {buttonLabel}
                                  </Link>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {itemsList.map((item, iIdx) => {
                            const { name, desc, safeLink, defaultLabel } = getItemDetails(
                              item,
                              type,
                            )
                            if (!name && !isEditing) return null
                            const buttonLabel = item.buttonText?.trim() || defaultLabel

                            return (
                              <div
                                key={iIdx}
                                className={`rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-3 ${
                                  isDark
                                    ? 'border border-white/20 bg-white/10 text-white'
                                    : 'border border-deep-navy/10 bg-warm-ivory/60 text-deep-navy'
                                }`}
                              >
                                <div>
                                  {item.heading && (
                                    <p
                                      className={`font-ui font-bold text-xs sm:text-sm tracking-wide mb-2 ${
                                        isDark ? 'text-white' : 'text-bright-magenta'
                                      }`}
                                    >
                                      {item.heading}
                                    </p>
                                  )}
                                  <div className="font-ui text-xs sm:text-sm leading-relaxed">
                                    <strong
                                      className={`font-ui font-bold ${
                                        isDark ? 'text-white' : 'text-deep-navy'
                                      }`}
                                    >
                                      {name}:
                                    </strong>{' '}
                                    <span
                                      className={isDark ? 'text-white/80' : 'text-deep-navy/80'}
                                    >
                                      {desc}
                                    </span>
                                  </div>
                                </div>

                                {safeLink && (
                                  <div className="flex justify-center pt-2">
                                    <Link
                                      href={safeLink}
                                      className={`rounded-full px-6 py-2 text-xs sm:text-sm font-bold text-center transition-colors min-h-[44px] flex items-center justify-center ${
                                        isDark
                                          ? 'border border-white text-white hover:bg-white hover:text-deep-navy'
                                          : 'bg-deep-navy text-white hover:opacity-90'
                                      }`}
                                    >
                                      {buttonLabel}
                                    </Link>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        {(titleLine1 || seriesLabel) && (
          <div className="text-center mb-10 sm:mb-14 flex flex-col items-center">
            {seriesLabel && (
              <span
                className={`mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
              >
                {seriesLabel}
              </span>
            )}

            {titleLine1 && (
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)]">
                <TwoToneTitle
                  line1={titleLine1}
                  line2={titleLine2}
                  line1ClassName={isDeepNavy ? 'text-white' : 'text-deep-navy'}
                  line2ClassName={titleLine2ColorClass}
                />
              </h2>
            )}

            {emotionLine && (
              <p
                className={`mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${
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
          {isGroupsLayout ? (
            <>
              {/* Column 1: Products (Groups) */}
              {showCol1 &&
                renderGroupsColumn({
                  isDark: false,
                  colTitle: col1Title,
                  colDescription: col1Description,
                  colIcon: col1Icon,
                  colAccent: col1Accent,
                  groups: effectiveCol1Groups,
                  emptyNote: vi.sm03.noProductsSelected,
                  type: 'product',
                })}

              {/* Column 2: Services (Groups) - NỀN DEEP-NAVY */}
              {showCol2 &&
                renderGroupsColumn({
                  isDark: true,
                  colTitle: col2Title,
                  colDescription: col2Description,
                  colIcon: col2Icon,
                  colAccent: col2Accent,
                  groups: effectiveCol2Groups,
                  emptyNote: vi.sm03.noServicesSelected,
                  type: 'service',
                })}

              {/* Column 3: Programs (Groups) */}
              {showCol3 &&
                renderGroupsColumn({
                  isDark: false,
                  colTitle: col3Title,
                  colDescription: col3Description,
                  colIcon: col3Icon,
                  colAccent: col3Accent,
                  groups: effectiveCol3Groups,
                  emptyNote: vi.sm03.noProgramsSelected,
                  type: 'program',
                })}
            </>
          ) : (
            <>
              {/* Column 1: Products (Đào tạo cá nhân) */}
              {showCol1 && (
                <div
                  data-eb-card=""
                  className="flex flex-col justify-between p-6 sm:p-8 rounded-card border border-deep-navy/10 bg-white text-deep-navy shadow-soft"
                >
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
                                <h4 className="font-ui font-bold text-base text-deep-navy">
                                  {p.name}
                                </h4>
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
                <div
                  data-eb-card=""
                  className="flex flex-col justify-between p-6 sm:p-8 rounded-card border border-white/20 bg-deep-navy text-white shadow-soft relative ring-2 ring-deep-navy"
                >
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
                <div
                  data-eb-card=""
                  className="flex flex-col justify-between p-6 sm:p-8 rounded-card border border-deep-navy/10 bg-white text-deep-navy shadow-soft"
                >
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
                          const safeLink = safeHref(
                            `/doanh-nghiep/${encodeURIComponent(prog.slug)}`,
                          )
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
            </>
          )}
        </div>
      </div>
    </section>
  )
}
