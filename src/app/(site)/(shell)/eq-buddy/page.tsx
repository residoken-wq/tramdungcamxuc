import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product } from '@/payload-types'
import { EQ_BUDDY_PRODUCT_SLUG } from '@/lib/eq/config'
import { getEqIntroData } from '@/lib/eq/intro-data.server'
import { EQBuddyIntro } from '@/components/eq/zip/EQBuddyIntro'
import { TrialBanner } from '@/components/habit/TrialBanner'
import {
  BuilderPage,
  builderPageMetadata,
  findPublishedBuilderPage,
} from '@/lib/pages/puck-override.server'
import { vi } from '@/lib/i18n/vi'

export const dynamic = 'force-dynamic'

/** BX-08b: a published builder page with this slug replaces the coded intro below. */
const BUILDER_SLUG = 'eq-buddy'

export async function generateMetadata(): Promise<Metadata> {
  const builderPage = await findPublishedBuilderPage(BUILDER_SLUG)
  if (builderPage) return builderPageMetadata(builderPage)
  try {
    const payload = await getPayload({ config: await config })
    const res = await payload.find({
      collection: 'products',
      where: { slug: { equals: EQ_BUDDY_PRODUCT_SLUG } },
      limit: 1,
      overrideAccess: true,
    })
    const product = res.docs[0] as Product | undefined
    if (product) {
      return {
        title: product.name,
        description: product.shortDescription || vi.eqBuddy.intro.metaDescription,
      }
    }
  } catch {
    // Fallback to static meta below
  }
  return {
    title: vi.eqBuddy.intro.metaTitle,
    description: vi.eqBuddy.intro.metaDescription,
  }
}

export default async function EqBuddyIntroPage() {
  const payload = await getPayload({ config: await config })
  const [{ content, isFreeMode }, builderPage] = await Promise.all([
    getEqIntroData(payload),
    findPublishedBuilderPage(BUILDER_SLUG),
  ])
  // Trial / entitlement rules do not depend on the layout: the banner stays above either page.
  const trialBanner = isFreeMode ? null : <TrialBanner productSlug={EQ_BUDDY_PRODUCT_SLUG} />

  if (builderPage) {
    return (
      <>
        {/* TrialBanner renders nothing for visitors without a trial: `empty:hidden` drops the gap */}
        {trialBanner ? (
          <div className="w-full px-4 pt-6 empty:hidden sm:px-6 sm:pt-10">{trialBanner}</div>
        ) : null}
        <BuilderPage doc={builderPage} slug={BUILDER_SLUG} />
      </>
    )
  }

  return (
    <div className="w-full py-6 sm:py-10 px-4 sm:px-6">
      <EQBuddyIntro content={content} trialBanner={trialBanner} />
    </div>
  )
}
