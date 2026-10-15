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

  // 2. Nếu đã hết quyền ngay từ khi tải trang (ví dụ khách đã rút trước đó hoặc trial hết hạn)
  if (!access.allowed) {
    return (
      <div className="w-full py-10 sm:py-16 px-6">
        <div className="max-w-xl mx-auto mb-6">
          <Link
            href="/eq-buddy"
            className="inline-flex items-center gap-1.5 font-ui text-sm font-semibold text-deep-navy/70 hover:text-bright-magenta motion-reduce:transition-none transition-colors"
          >
            ← {vi.eqBuddy.draw.backToIntro}
          </Link>
        </div>
        <ToolPaywall productSlug={EQ_BUDDY_PRODUCT_SLUG} />
      </div>
    )
  }

  // 3. Lấy danh sách 26 từ khóa A–Z đã xuất bản
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

      <EqDrawWizard keywords={keywords} />
    </div>
  )
}
