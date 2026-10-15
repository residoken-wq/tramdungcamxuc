import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedEqKeywords } from '@/lib/eq/cards.server'
import { checkEqDrawAccess } from '@/lib/eq/draw.server'
import { EQ_BUDDY_PRODUCT_SLUG } from '@/lib/eq/config'
import { ToolPaywall } from '@/components/site/trial/ToolPaywall'
import { EqDrawWizard } from '@/components/eq/draw/EqDrawWizard'
import { vi } from '@/lib/i18n/vi'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: vi.eqBuddy.draw.metaTitle,
  description: vi.eqBuddy.draw.metaDescription,
}

export default async function EqRutThePage() {
  // 1. Kiểm tra quyền truy cập (khách rút 1 thẻ / thành viên có trial hoặc active)
  const access = await checkEqDrawAccess()

  // The wizard is always rendered at the same position: after a guest's free draw the server
  // action sets the cookie and Next re-renders this page; switching to a different element here
  // would unmount the wizard and hide the card just drawn (T3-02c). The paywall is passed in and
  // shown by the wizard itself.
  const keywords = await getPublishedEqKeywords()

  return (
    <div className="w-full py-10 sm:py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto mb-4">
        <Link
          href="/eq-buddy"
          className="inline-flex items-center gap-1.5 font-ui text-sm font-semibold text-deep-navy/70 hover:text-bright-magenta motion-reduce:transition-none transition-colors"
        >
          ← {vi.eqBuddy.draw.backToIntro}
        </Link>
      </div>

      <EqDrawWizard
        keywords={keywords}
        initialStep={access.allowed ? 1 : 'paywall'}
        isLoggedIn={access.customerState === 'logged_in'}
        paywall={
          <ToolPaywall
            productSlug={EQ_BUDDY_PRODUCT_SLUG}
            badge={vi.eqBuddy.draw.paywall.badge}
            fallbackDescription={vi.eqBuddy.draw.paywall.description}
          />
        }
      />
    </div>
  )
}
