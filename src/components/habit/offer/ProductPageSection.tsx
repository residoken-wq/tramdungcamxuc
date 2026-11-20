'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import { buildOfferView } from '@/lib/habit/offer-view'
import { useOfferProduct } from '@/puck/use-offer-product'
import type { ProductPageResolved } from '@/puck/product-page-types'
import {
  OfferBottom,
  OfferCurriculum,
  OfferFaq,
  OfferFeatures,
  OfferHero,
  OfferStats,
  type OfferBottomProps,
  type OfferCurriculumProps,
  type OfferFaqProps,
  type OfferFeaturesProps,
  type OfferHeroProps,
  type OfferStatsProps,
} from './OfferSections'

type Omitted<T> = Omit<T, 'view' | 'children'>

export type ProductPageSectionProps =
  | ({ section: 'hero' } & Omitted<OfferHeroProps>)
  | ({ section: 'stats' } & Omitted<OfferStatsProps>)
  | ({ section: 'curriculum' } & Omitted<OfferCurriculumProps>)
  | ({ section: 'features' } & Omitted<OfferFeaturesProps>)
  | ({ section: 'faq' } & Omitted<OfferFaqProps>)
  | ({ section: 'bottom' } & Omitted<OfferBottomProps>)

const SECTION_LABEL: Record<ProductPageSectionProps['section'], string> = {
  hero: 'Hero sản phẩm',
  stats: 'Thanh số liệu',
  curriculum: 'Lộ trình',
  features: 'Khác biệt',
  faq: 'Câu hỏi sản phẩm',
  bottom: 'Khối cuối sản phẩm',
}

function EditorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto my-4 max-w-3xl rounded-card border border-dashed border-bright-magenta/40 bg-soft-pink/40 p-4 text-center font-ui text-sm text-deep-navy">
      {children}
    </div>
  )
}

/**
 * BX-08: one section of the product offer page as a builder block. Public pages pass the
 * server-resolved data; in the builder the data is fetched by product id. Only the id is stored.
 */
export function ProductPageSection(
  props: ProductPageSectionProps & {
    productId?: string | number | null
    _resolved?: ProductPageResolved | null
    isEditing?: boolean
    children?: React.ReactNode
  },
) {
  const { productId, _resolved, isEditing = false, children } = props
  const { data, loading } = useOfferProduct(productId, _resolved)

  if (!productId) return isEditing ? <EditorNote>{vi.bx08.chooseProduct}</EditorNote> : null
  if (loading) return isEditing ? <EditorNote>{vi.bx08.loading}</EditorNote> : null
  if (!data?.offer) return isEditing ? <EditorNote>{vi.bx08.productUnavailable}</EditorNote> : null

  // Builder pages ignore the BX-03 "Ẩn phần này" flags (Hana deletes the block instead).
  const view = buildOfferView(data.offer, data.journeyDays, { ignoreHideFlags: true })
  const empty = <EditorNote>{vi.bx08.sectionEmpty(SECTION_LABEL[props.section])}</EditorNote>

  switch (props.section) {
    case 'hero': {
      const { section: _s, ...rest } = props as { section: 'hero' } & Omitted<OfferHeroProps>
      return (
        <OfferHero view={view} {...pickSectionProps(rest)}>
          {children}
        </OfferHero>
      )
    }
    case 'stats': {
      if (!view.show.stats) return isEditing ? empty : null
      const { section: _s, ...rest } = props as { section: 'stats' } & Omitted<OfferStatsProps>
      return <OfferStats view={view} {...pickSectionProps(rest)} />
    }
    case 'curriculum': {
      if (!view.show.curriculum) return isEditing ? empty : null
      const { section: _s, ...rest } = props as { section: 'curriculum' } &
        Omitted<OfferCurriculumProps>
      return <OfferCurriculum view={view} {...pickSectionProps(rest)} />
    }
    case 'features': {
      if (!view.show.features) return isEditing ? empty : null
      const { section: _s, ...rest } = props as { section: 'features' } &
        Omitted<OfferFeaturesProps>
      return <OfferFeatures view={view} {...pickSectionProps(rest)} />
    }
    case 'faq': {
      if (!view.show.faq) return isEditing ? empty : null
      const { section: _s, ...rest } = props as { section: 'faq' } & Omitted<OfferFaqProps>
      return <OfferFaq view={view} {...pickSectionProps(rest)} />
    }
    case 'bottom': {
      if (!view.show.bottom) return isEditing ? empty : null
      const { section: _s, ...rest } = props as { section: 'bottom' } & Omitted<OfferBottomProps>
      return (
        <OfferBottom view={view} {...pickSectionProps(rest)}>
          {children}
        </OfferBottom>
      )
    }
  }
}

/** Drops the block-only props before spreading the layout options onto a section. */
function pickSectionProps<T extends Record<string, unknown>>(props: T) {
  const {
    productId: _p,
    _resolved: _r,
    isEditing: _e,
    children: _c,
    ...rest
  } = props as T & {
    productId?: unknown
    _resolved?: unknown
    isEditing?: unknown
    children?: unknown
  }
  return rest as Omit<T, 'productId' | '_resolved' | 'isEditing' | 'children'>
}
