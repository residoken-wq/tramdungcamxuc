import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPublishedEqCardByQrSlug } from '@/lib/eq/cards.server'
import { isRichTextEmpty } from '@/lib/legal'
import { vi } from '@/lib/i18n/vi'
import { HeartLine } from '@/components/brand/HeartLine'
import { Button } from '@/components/ui/Button'
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

  const snippet = card.message?.trim().slice(0, 120) || ''

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

  const hasStory = Boolean(card.story && !isRichTextEmpty(card.story))

  return (
    <main className="w-full bg-warm-ivory min-h-screen py-10 sm:py-16 px-6 sm:px-8">
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
        <article className="rounded-3xl bg-white border border-lavender-mist shadow-soft p-6 sm:p-10 md:p-12">
          {/* Nhãn Series & Mã thẻ */}
          <div className="text-center mb-6">
            <span className="inline-block px-3.5 py-1 rounded-full bg-soft-pink text-bright-magenta font-ui text-xs sm:text-sm font-bold uppercase tracking-wider">
              {vi.eqBuddy.cardPage.seriesLabel(card.code)}
            </span>
          </div>

          {/* Thông điệp thẻ (Playfair Display Italic cỡ lớn) */}
          {card.message && (
            <div className="text-center my-6 sm:my-8 px-2 sm:px-4">
              <blockquote className="font-quote italic text-2xl sm:text-3xl md:text-4xl text-deep-navy leading-relaxed sm:leading-relaxed">
                &ldquo;{card.message}&rdquo;
              </blockquote>
            </div>
          )}

          {/* Họa tiết nét trái tim thương hiệu */}
          <div
            className="flex items-center justify-center my-8 text-accent-pink/40"
            aria-hidden="true"
          >
            <HeartLine width={80} height={28} />
          </div>

          {/* Câu chuyện của thẻ */}
          {hasStory && (
            <section
              aria-label={vi.eqBuddy.cardPage.storyHeading}
              className="border-t border-deep-navy/10 pt-8 mt-8 space-y-4"
            >
              <h2 className="font-ui text-sm sm:text-base font-bold text-bright-magenta uppercase tracking-wider mb-4">
                {vi.eqBuddy.cardPage.storyHeading}
              </h2>
              <div className="font-ui text-base sm:text-lg text-deep-navy/85 leading-relaxed space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <RichText data={card.story as any} />
              </div>
            </section>
          )}

          {/* Chỗ trống cho khối chia sẻ / offer (T3-05 làm component; T3-02 gắn) */}
          <div id="eq-card-share-slot" aria-hidden="true" className="empty:hidden" />

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
        </article>
      </div>

      {/* Ghi nhận phân tích một lần duy nhất khi mở trang từ QR */}
      <QrOpenedTracker cardCode={card.code} qrSlug={card.qrSlug} />
    </main>
  )
}
