'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GuideModal } from './GuideModal'
import { buildEqIntroView, type EqIntroContent } from '@/lib/eq/intro-view'
import {
  EqDrawActions,
  EqFrame,
  EqIntroHeader,
  EqSeriesBar,
  EqShopeeLink,
  EqWhatIsContent,
  EQ_DRAW_HREF,
} from '@/components/eq/intro/EqIntroSections'

export interface EQBuddyIntroProps {
  content?: EqIntroContent | null
  /** QA DP-01c: rendered by the server page (TrialBanner is an async Server Component). */
  trialBanner?: React.ReactNode
}

/**
 * Coded /eq-buddy intro (default page). BX-08b: built from the shared parts in
 * `components/eq/intro/EqIntroSections`, which the "EQ Buddy" builder blocks also use.
 */
export function EQBuddyIntro({ content, trialBanner }: EQBuddyIntroProps) {
  const router = useRouter()
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)
  const view = buildEqIntroView(content)
  const openGuide = () => setIsGuideModalOpen(true)

  return (
    <div className="w-full space-y-8">
      {/* Trial banner: only when the access mode requires a trial sign-up */}
      {trialBanner}

      <EqFrame>
        <EqSeriesBar view={view} onGuide={openGuide} />
        <EqIntroHeader view={view} />

        {/* Optional "Bộ thẻ là gì" part (hidden when the CMS leaves it empty) */}
        {view.hasIntro1 ? (
          <div className="space-y-6 animate-fadeIn font-ui">
            <EqWhatIsContent view={view} />
            <EqDrawActions variant="compact" onGuide={openGuide} />
          </div>
        ) : (
          /* Default per Hana's review: straight to drawing a card */
          <EqDrawActions variant="large" onGuide={openGuide} />
        )}
      </EqFrame>

      {/* Shopee button for the physical deck (only when a Shopee link exists) */}
      <EqShopeeLink view={view} />

      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        {...view.guide}
        onConfirm={() => router.push(EQ_DRAW_HREF)}
      />
    </div>
  )
}
