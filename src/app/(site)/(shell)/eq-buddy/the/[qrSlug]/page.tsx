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

  const hasStory = Boolean(card.story && !isRichTextEmpty(card.story))
  const prompts = [
    { label: vi.eqBuddy.cardPage.promptRecall, text: card.promptRecall },
    { label: vi.eqBuddy.cardPage.promptPack, text: card.promptPack },
    { label: vi.eqBuddy.cardPage.promptAcknowledge, text: card.promptAcknowledge },
  ].filter((p): p is { label: string; text: string } => Boolean(p.text?.trim()))

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
        <article className="rounded-3xl bg-warm-ivory border border-lavender-mist shadow-soft p-6 sm:p-10 md:p-12">
          {/* Nhãn Series & Mã thẻ */}
          <div className="text-center mb-6">
            <span className="inline-block px-3.5 py-1 rounded-full bg-soft-pink text-bright-magenta font-ui text-xs sm:text-sm font-bold uppercase tracking-wider">
              {vi.eqBuddy.cardPage.seriesLabel(card.code)}
            </span>
          </div>

          {/* Front: keyword + message */}
          {card.keywordEn && (
            <h1 className="text-center font-display text-4xl sm:text-5xl text-bright-magenta tracking-wide">
              {card.keywordEn}
            </h1>
          )}
          {card.message && (
            <div className="text-center my-6 sm:my-8 px-2 sm:px-4">
              <blockquote className="font-quote italic text-2xl sm:text-3xl md:text-4xl text-deep-navy leading-relaxed sm:leading-relaxed">
                {card.message}
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

          {/* Back: the three printed prompts */}
          {prompts.length > 0 && (
            <section
              aria-label={vi.eqBuddy.cardPage.promptsHeading}
              className="border-t border-deep-navy/10 pt-8 mt-8"
            >
              <h2 className="font-ui text-sm sm:text-base font-bold text-bright-magenta uppercase tracking-wider mb-6">
                {vi.eqBuddy.cardPage.promptsHeading}
              </h2>
              <dl className="space-y-6">
                {prompts.map((p) => (
                  <div key={p.label}>
                    <dt className="font-ui text-base font-bold text-deep-navy">{p.label}</dt>
                    <dd className="mt-1 font-sans text-base sm:text-lg text-deep-navy/85 leading-relaxed">
                      {p.text}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

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
        </article>
      </div>

      {/* Ghi nhận phân tích một lần duy nhất khi mở trang từ QR */}
      <QrOpenedTracker cardCode={card.code} qrSlug={card.qrSlug} />
    </div>
  )
}
