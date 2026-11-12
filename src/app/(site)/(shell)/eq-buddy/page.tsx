import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product } from '@/payload-types'
import { EQ_BUDDY_PRODUCT_SLUG } from '@/lib/eq/config'
import { EQBuddyIntro } from '@/components/eq/zip/EQBuddyIntro'
import { TrialBanner } from '@/components/habit/TrialBanner'
import { vi } from '@/lib/i18n/vi'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
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
  const [res, physicalRes, eqContent] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { slug: { equals: EQ_BUDDY_PRODUCT_SLUG } },
      limit: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'products',
      where: {
        and: [
          { type: { equals: 'physical_external' } },
          { web: { equals: 'eq' } },
          { saleStatus: { not_equals: 'hidden' } },
          { _status: { equals: 'published' } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    }),
    payload.findGlobal({ slug: 'eqBuddyContent', overrideAccess: true }).catch(() => null),
  ])
  const product = res.docs[0] as Product | undefined
  const physicalProduct = physicalRes.docs[0] as Product | undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawContent = (eqContent || {}) as any
  const isFreeMode = rawContent?.eqAccessMode === 'free'
  const shopeeUrl =
    rawContent?.shopeeUrl?.trim() ||
    physicalProduct?.externalUrl?.trim() ||
    ''

  const contentProps = {
    ...rawContent,
    badge: rawContent?.badge ?? '',
    mainTitle: rawContent?.mainTitle?.trim() || vi.au02.introTitle,
    subtitle: rawContent?.subtitle?.trim() || vi.au02.introSubtitle,
    shopeeUrl,
  }

  return (
    <div className="w-full py-6 sm:py-10 px-4 sm:px-6">
      <EQBuddyIntro
        content={contentProps}
        trialBanner={isFreeMode ? null : <TrialBanner productSlug={EQ_BUDDY_PRODUCT_SLUG} />}
      />
    </div>
  )
}
