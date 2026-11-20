'use client'

import React from 'react'
import type { HabitProductData } from '@/lib/habit.server'
import { alternateOfferBackgrounds, buildOfferView } from '@/lib/habit/offer-view'
import {
  OfferBottom,
  OfferCurriculum,
  OfferFaq,
  OfferFeatures,
  OfferHero,
  OfferStats,
} from '@/components/habit/offer/OfferSections'

export interface HabitOfferClientProps {
  product: HabitProductData | null
  /** HB-15c: siteSettings.habitJourneyDays (default 28) */
  journeyDays?: number
}

/**
 * Coded offer page (default when no builder page replaces it – BX-08). The sections are the same
 * components as the builder blocks of the "Trang sản phẩm" group.
 */
export function HabitOfferClient({ product, journeyDays = 28 }: HabitOfferClientProps) {
  const view = buildOfferView(product, journeyDays)
  // BX-03: backgrounds alternate warm-ivory / white over the visible sections only
  const bg = alternateOfferBackgrounds(view.show)

  return (
    <div className="w-full">
      <OfferHero view={view} />
      {view.show.stats && <OfferStats view={view} bg={bg.stats} />}
      {view.show.curriculum && <OfferCurriculum view={view} bg={bg.curriculum} />}
      {view.show.features && <OfferFeatures view={view} bg={bg.features} />}
      {view.show.faq && <OfferFaq view={view} bg={bg.faq} />}
      {view.show.bottom && <OfferBottom view={view} />}
    </div>
  )
}
