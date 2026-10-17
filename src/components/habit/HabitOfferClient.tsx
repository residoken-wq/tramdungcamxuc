'use client'

import React from 'react'
import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { PriceTag } from '@/components/ui/PriceTag'
import { vi } from '@/lib/i18n/vi'
import { HABIT_LOOP_PATH } from '@/lib/habit'
import { getEffectivePrice } from '@/lib/products'
import type { HabitProductData } from '@/lib/habit.server'

export interface HabitOfferClientProps {
  product: HabitProductData | null
}

export function HabitOfferClient({ product }: HabitOfferClientProps) {
  const effectivePricing = product
    ? getEffectivePrice(
        {
          price: product.price ?? null,
          salePrice: product.salePrice ?? null,
          saleEndsAt: product.saleEndsAt ?? null,
        },
        new Date(),
      )
    : { price: null, salePrice: null }

  const hasPrice = effectivePricing.price != null || effectivePricing.salePrice != null
  const trialDays =
    typeof product?.trialDays === 'number' && product.trialDays > 0 ? product.trialDays : null
  const cta = product?.cta || null

  const videoCount = typeof product?.videoCount === 'number' ? product.videoCount : 0
  const techniqueCount = typeof product?.techniqueCount === 'number' ? product.techniqueCount : 0

  const includesList = product?.includes && product.includes.length > 0 ? product.includes : []
  const faqList = product?.faq && product.faq.length > 0 ? product.faq : []
  const isLifetime = !product?.accessDurationDays || product.accessDurationDays <= 0

  return (
    <div className="w-full">
      {/* 1. HERO SECTION */}
      <section className="py-12 sm:py-20 bg-warm-ivory border-b border-lavender-mist/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <SectionHeader
            seriesLabel={vi.habit.offer.badge}
            titleLine1={vi.habit.offer.titleLine1}
            titleLine2={vi.habit.offer.titleLine2}
            emotionLine={vi.habit.offer.emotionalLine}
            as="h1"
            className="mb-8"
          />

          {/* Pricing & CTA Card */}
          <div className="bg-white rounded-card shadow-soft border border-lavender-mist/80 p-6 sm:p-10 max-w-2xl mx-auto text-center">
            {/* Trial Badge - chỉ hiển thị khi có trialDays từ CMS */}
            {trialDays !== null && (
              <div className="inline-block px-4 py-1.5 rounded-full bg-soft-pink text-deep-navy text-xs sm:text-sm font-semibold mb-4">
                ✨ {trialDays} {vi.product.trialBadge}
              </div>
            )}

            {/* Price Tag qua PriceTag component theo Brand Book và getEffectivePrice */}
            {hasPrice && (
              <div className="flex items-center justify-center mb-3">
                <PriceTag
                  originalPrice={effectivePricing.price}
                  salePrice={effectivePricing.salePrice}
                  size="lg"
                />
              </div>
            )}

            {/* Chỉ hiện cam kết khi đúng với cấu hình CMS: vĩnh viễn khi không giới hạn ngày, không cần thẻ khi có dùng thử */}
            {hasPrice && (isLifetime || trialDays !== null) && (
              <p className="text-xs sm:text-sm text-deep-navy/70 mb-6 font-medium">
                {[
                  isLifetime ? vi.habit.offer.permanentAccess : null,
                  trialDays !== null ? vi.habit.offer.noCreditCard : null,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            )}

            {/* Includes list from CMS if present */}
            {includesList.length > 0 && (
              <div className="mb-6 text-left border-t border-b border-lavender-mist/40 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-deep-navy/70 mb-2 font-ui">
                  {vi.habit.offer.includesHeading}
                </p>
                <ul className="space-y-2">
                  {includesList.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-deep-navy/90">
                      <span className="text-accent-pink font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {cta &&
                (cta.external ? (
                  <a
                    href={cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-accent-pink text-white font-bold text-[19px] tracking-tight shadow-soft hover:bg-bright-magenta transition-colors"
                  >
                    {cta.label} →
                  </a>
                ) : (
                  <Link
                    href={cta.href}
                    className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-accent-pink text-white font-bold text-[19px] tracking-tight shadow-soft hover:bg-bright-magenta transition-colors"
                  >
                    {cta.label} →
                  </Link>
                ))}
              <Link
                href={HABIT_LOOP_PATH}
                className="inline-flex items-center justify-center px-6 py-4 rounded-full bg-lavender-mist/60 text-deep-navy font-semibold text-base hover:bg-soft-pink transition-colors"
              >
                {vi.habit.offer.habitLoopCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BAR (Đếm động từ DB: số lessons và techniques) */}
      <section className="py-8 bg-white border-b border-lavender-mist/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {/* Số đếm từ DB: chưa có bài học / kỹ thuật nào thì ẩn ô đó */}
            {videoCount > 0 && (
              <div className="p-4 rounded-xl bg-warm-ivory">
                <span className="font-display text-2xl sm:text-3xl text-bright-magenta block mb-1">
                  {videoCount}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-deep-navy">
                  {vi.habit.offer.stats.videos}
                </span>
              </div>
            )}
            {techniqueCount > 0 && (
              <div className="p-4 rounded-xl bg-warm-ivory">
                <span className="font-display text-2xl sm:text-3xl text-bright-magenta block mb-1">
                  {techniqueCount}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-deep-navy">
                  {vi.habit.offer.stats.techniques}
                </span>
              </div>
            )}
            <div className="p-4 rounded-xl bg-warm-ivory">
              <span className="font-display text-2xl sm:text-3xl text-bright-magenta block mb-1">
                {vi.habit.offer.stats.trackerValue}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-deep-navy">
                {vi.habit.offer.stats.tracker}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-warm-ivory">
              <span className="font-display text-2xl sm:text-3xl text-bright-magenta block mb-1">
                {vi.habit.offer.stats.modulesValue}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-deep-navy">
                {vi.habit.offer.stats.modules}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4 MODULES CURRICULUM */}
      <section className="py-12 sm:py-16 bg-warm-ivory">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl text-deep-navy mb-2">
              {vi.habit.offer.curriculum.heading}
            </h2>
            <p className="text-sm sm:text-base text-deep-navy/70">
              {vi.habit.offer.curriculum.subheading}
            </p>
          </div>

          <div className="space-y-4">
            {vi.habit.offer.curriculum.modules.map((mod, index) => (
              <div
                key={index}
                className="bg-white rounded-card p-6 border border-lavender-mist shadow-soft flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-soft-pink text-deep-navy font-bold flex items-center justify-center shrink-0 text-sm">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg text-deep-navy mb-1">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-deep-navy/70 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY DIFFERENT */}
      <section className="py-12 sm:py-16 bg-white border-t border-lavender-mist/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl text-deep-navy mb-2">
              {vi.habit.offer.features.heading}
            </h2>
            <p className="text-sm sm:text-base text-deep-navy/70">
              {vi.habit.offer.features.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vi.habit.offer.features.items.map((feat, index) => (
              <div
                key={index}
                className="p-6 rounded-card bg-warm-ivory border border-lavender-mist text-left"
              >
                <span className="w-8 h-8 rounded-full bg-mint-haze text-deep-navy flex items-center justify-center font-bold text-sm mb-4">
                  ✓
                </span>
                <h3 className="font-semibold text-deep-navy text-base mb-2">{feat.title}</h3>
                <p className="text-sm text-deep-navy/70 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ – chỉ hiện khi CMS có câu hỏi (không hiện FAQ mẫu ra trang công khai) */}
      {faqList.length > 0 && (
        <section className="py-12 sm:py-16 bg-warm-ivory">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="font-display text-2xl sm:text-3xl text-deep-navy text-center mb-8">
              {vi.habit.offer.faq.heading}
            </h2>

            <div className="space-y-4">
              {faqList.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-card p-6 border border-lavender-mist shadow-soft"
                >
                  <h3 className="font-semibold text-deep-navy text-base mb-2">{item.question}</h3>
                  {item.answer && (
                    <p className="text-sm text-deep-navy/80 leading-relaxed">{item.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. BOTTOM CTA */}
      <section className="py-16 bg-brand-gradient border-t border-lavender-mist">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-deep-navy mb-4">
            {vi.habit.offer.bottomTitle}
          </h2>
          <p className="text-base text-deep-navy/80 mb-8 max-w-lg mx-auto">
            {vi.habit.offer.bottomDesc(videoCount, techniqueCount)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {cta &&
              (cta.external ? (
                <a
                  href={cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-accent-pink text-white font-bold text-[19px] tracking-tight shadow-soft hover:bg-bright-magenta transition-colors"
                >
                  {cta.label} →
                </a>
              ) : (
                <Link
                  href={cta.href}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-accent-pink text-white font-bold text-[19px] tracking-tight shadow-soft hover:bg-bright-magenta transition-colors"
                >
                  {cta.label} →
                </Link>
              ))}
            <Link
              href={HABIT_LOOP_PATH}
              className="inline-flex items-center justify-center px-6 py-4 rounded-full bg-white text-deep-navy font-semibold text-base hover:bg-soft-pink transition-colors border border-lavender-mist"
            >
              {vi.habit.offer.habitLoopCta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
