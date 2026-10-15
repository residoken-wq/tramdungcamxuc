import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedEqCardByQrSlug } from '@/lib/eq/cards.server'
import { vi } from '@/lib/i18n/vi'
import { Button } from '@/components/ui/Button'
import { EqCardFace } from '@/components/eq/EqCardFace'
import { QrOpenedTracker } from '@/components/eq/QrOpenedTracker'

export const dynamic = 'force-dynamic'

interface CardPageProps {
  params: Promise<{ qrSlug: string }>
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { qrSlug } = await params
  const card = await getPublishedEqCardByQrSlug(qrSlug)

  if (!card) {
    return {
      title: vi.eqBuddy.cardPage.defaultMetaTitle,
    }
  }

  const snippet = card.message?.trim().slice(0, 60) || ''

  return {
    title: vi.eqBuddy.cardPage.metaTitle(card.code, snippet),
    description: snippet || vi.eqBuddy.cardPage.defaultMetaDescription,
  }
}

export default async function EqCardQrPage({ params }: CardPageProps) {
  const { qrSlug } = await params
  const card = await getPublishedEqCardByQrSlug(qrSlug)

  if (!card) {
    notFound()
  }

  return (
    <div className="w-full py-10 sm:py-16 px-6 sm:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Điều hướng quay lại */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/eq-buddy"
            className="inline-flex items-center gap-1.5 font-ui text-sm font-semibold text-deep-navy/70 hover:text-bright-magenta motion-reduce:transition-none transition-colors"
          >
            ← {vi.eqBuddy.cardPage.backToDeck}
          </Link>
        </div>

        {/* Thẻ nội dung chính */}
        <EqCardFace card={card} face="both">
          {/* Chỗ trống cho khối chia sẻ / offer (T3-05 làm component; T3-02 gắn) */}
          <div id="eq-card-share-slot" className="empty:hidden" />

          {/* CTA: Rút thêm một thẻ */}
          <div className="mt-10 pt-8 border-t border-deep-navy/10 flex flex-col items-center">
            <Button
              href="/eq-buddy"
              variant="primary"
              size="md"
              className="motion-reduce:transition-none"
            >
              {vi.eqBuddy.cardPage.drawAnotherCard}
            </Button>
          </div>
        </EqCardFace>
      </div>

      {/* Ghi nhận phân tích một lần duy nhất khi mở trang từ QR */}
      <QrOpenedTracker cardCode={card.code} qrSlug={card.qrSlug} />
    </div>
  )
}
