import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getAllPublishedCards } from '@/lib/eq/cards.server'
import { checkEqDrawAccess } from '@/lib/eq/draw.server'
import { EQ_BUDDY_PRODUCT_SLUG } from '@/lib/eq/config'
import { ToolPaywall } from '@/components/site/trial/ToolPaywall'
import { EQDrawApp } from '@/components/eq/zip/EQDrawApp'
import { toPublicProduct } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: vi.eqBuddy.draw.metaTitle,
  description: vi.eqBuddy.draw.metaDescription,
}

export default async function EqRutThePage() {
  const payload = await getPayload({ config: await config })

  // 1. Kiểm tra quyền truy cập (free mode / khách rút 1 thẻ / thành viên có trial hoặc active)
  const [access, eqContent, eqProductRes, coachingProductRes, physicalRes] = await Promise.all([
    checkEqDrawAccess(),
    payload.findGlobal({ slug: 'eqBuddyContent', overrideAccess: true }).catch(() => null),
    payload
      .find({
        collection: 'products',
        where: { slug: { equals: EQ_BUDDY_PRODUCT_SLUG } },
        limit: 1,
        overrideAccess: true,
      })
      .catch(() => null),
    payload
      .find({
        collection: 'products',
        where: {
          and: [
            {
              or: [
                { slug: { equals: 'growth-mirror-phien-trai-nghiem' } },
                { type: { equals: 'coaching_trial' } },
              ],
            },
            { _status: { equals: 'published' } },
            { saleStatus: { equals: 'on_sale' } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })
      .catch(() => null),
    payload
      .find({
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
      })
      .catch(() => null),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawContent = (eqContent || {}) as any
  const isFreeMode = access.accessStatus === 'free' || rawContent?.eqAccessMode === 'free'
  const isUnlockedAll =
    isFreeMode || access.accessStatus === 'active' || access.accessStatus === 'trial'

  // 2. Lấy danh sách toàn bộ thẻ đã xuất bản (server-side redaction nếu chưa unlock)
  const allCards = await getAllPublishedCards(isUnlockedAll)

  const eqProduct = eqProductRes?.docs?.[0] ? toPublicProduct(eqProductRes.docs[0]) : null
  const coachingProduct = coachingProductRes?.docs?.[0]
    ? toPublicProduct(coachingProductRes.docs[0])
    : null
  const physicalProduct = physicalRes?.docs?.[0]
  const shopeeUrl = rawContent?.shopeeUrl?.trim() || physicalProduct?.externalUrl?.trim() || ''

  return (
    <div className="w-full py-6 sm:py-10 px-4 sm:px-6">
      <EQDrawApp
        allCards={allCards}
        initialStep={access.allowed ? 'draw' : 'paywall'}
        isLoggedIn={access.customerState === 'logged_in'}
        isUnlockedAll={isUnlockedAll}
        isFreeMode={isFreeMode}
        guideModalQuote={rawContent?.guideModalQuote}
        eqProduct={eqProduct}
        coachingProduct={coachingProduct}
        shopeeUrl={shopeeUrl}
        content={rawContent}
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
