import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getAllPublishedCards } from '@/lib/eq/cards.server'
import { checkEqDrawAccess } from '@/lib/eq/draw.server'
import { EQ_BUDDY_PRODUCT_SLUG } from '@/lib/eq/config'
import { ToolPaywall } from '@/components/site/trial/ToolPaywall'
import { EQDrawApp } from '@/components/eq/zip/EQDrawApp'
import { vi } from '@/lib/i18n/vi'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: vi.eqBuddy.draw.metaTitle,
  description: vi.eqBuddy.draw.metaDescription,
}

export default async function EqRutThePage() {
  const payload = await getPayload({ config: await config })

  // 1. Kiểm tra quyền truy cập (free mode / khách rút 1 thẻ / thành viên có trial hoặc active)
  const [access, eqContent] = await Promise.all([
    checkEqDrawAccess(),
    payload
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .findGlobal({ slug: 'eq-buddy-content' as any, overrideAccess: true })
      .catch(() => null),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawContent = (eqContent || {}) as any
  const isFreeMode = access.accessStatus === 'free' || rawContent?.eqAccessMode === 'free'
  const isUnlockedAll = isFreeMode || access.accessStatus === 'paid' || access.accessStatus === 'trial'

  // 2. Lấy danh sách toàn bộ thẻ đã xuất bản (server-side redaction nếu chưa unlock)
  const allCards = await getAllPublishedCards(isUnlockedAll)

  return (
    <div className="w-full py-6 sm:py-10 px-4 sm:px-6">
      <EQDrawApp
        allCards={allCards}
        initialStep={access.allowed ? 'draw' : 'paywall'}
        isLoggedIn={access.customerState === 'logged_in'}
        isUnlockedAll={isUnlockedAll}
        isFreeMode={isFreeMode}
        guideModalQuote={rawContent?.guideModalQuote}
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
