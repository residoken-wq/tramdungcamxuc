'use client'

import React from 'react'
import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { PriceTag } from '@/components/ui/PriceTag'
import { vi } from '@/lib/i18n/vi'
import { HABIT_LOOP_PATH } from '@/lib/habit'
import type { HabitProductData } from '@/lib/habit.server'

export interface HabitOfferClientProps {
  product: HabitProductData | null
}

export function HabitOfferClient({ product }: HabitOfferClientProps) {
  const originalPrice = product?.price ?? 250000
  const salePrice = product?.salePrice ?? 178000
  const trialDays = product?.trialDays ?? 21
  const cta = product?.cta
  const ctaHref = cta?.href || '/tai-khoan/dang-nhap?redirect=/habit/hoc'
  const ctaLabel = cta?.label || vi.habit.offer.trialCta
  const isCtaExternal = Boolean(cta?.external)

  const videoCount = product?.videoCount ?? 20
  const techniqueCount = product?.techniqueCount ?? 11

  const includesList = product?.includes && product.includes.length > 0 ? product.includes : []
  const faqList = product?.faq && product.faq.length > 0 ? product.faq : []

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
            className="mb-8"
          />

          {/* Pricing & CTA Card */}
          <div className="bg-white rounded-card shadow-soft border border-lavender-mist/80 p-6 sm:p-10 max-w-2xl mx-auto text-center">
            {/* Trial Badge */}
            <div className="inline-block px-4 py-1.5 rounded-full bg-soft-pink text-deep-navy text-xs sm:text-sm font-semibold mb-4">
              ✨ {trialDays} {vi.product.trialBadge}
            </div>

            {/* Price Tag qua PriceTag component theo Brand Book */}
            <div className="flex items-center justify-center mb-3">
              <PriceTag
                originalPrice={originalPrice}
                salePrice={salePrice}
                size="lg"
              />
            </div>

            <p className="text-xs sm:text-sm text-deep-navy/70 mb-6 font-medium">
              {vi.habit.offer.permanentAccess} • {vi.habit.offer.noCreditCard}
            </p>

            {/* Includes list from CMS if present */}
            {includesList.length > 0 && (
              <div className="mb-6 text-left border-t border-b border-lavender-mist/40 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-deep-navy/70 mb-2 font-ui">
                  Bao gồm trong bộ công cụ:
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
              {isCtaExternal ? (
                <a
                  href={ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-accent-pink text-white font-semibold text-base shadow-soft hover:bg-bright-magenta transition-colors"
                >
                  {ctaLabel} →
                </a>
              ) : (
                <Link
                  href={ctaHref}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-accent-pink text-white font-semibold text-base shadow-soft hover:bg-bright-magenta transition-colors"
                >
                  {ctaLabel} →
                </Link>
              )}
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
            <div className="p-4 rounded-xl bg-warm-ivory">
              <span className="font-display text-2xl sm:text-3xl text-bright-magenta block mb-1">
                {videoCount}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-deep-navy">
                {vi.habit.offer.stats.videos}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-warm-ivory">
              <span className="font-display text-2xl sm:text-3xl text-bright-magenta block mb-1">
                {techniqueCount}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-deep-navy">
                {vi.habit.offer.stats.techniques}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-warm-ivory">
              <span className="font-display text-2xl sm:text-3xl text-bright-magenta block mb-1">
                21
              </span>
              <span className="text-xs sm:text-sm font-semibold text-deep-navy">
                {vi.habit.offer.stats.tracker}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-warm-ivory">
              <span className="font-display text-2xl sm:text-3xl text-bright-magenta block mb-1">
                4
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
                <h3 className="font-semibold text-deep-navy text-base mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-deep-navy/70 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ (Từ CMS hoặc fallback mẫu) */}
      <section className="py-12 sm:py-16 bg-warm-ivory">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl text-deep-navy text-center mb-8">
            {vi.habit.offer.faq.heading}
          </h2>

          <div className="space-y-4">
            {faqList.length > 0 ? (
              faqList.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-card p-6 border border-lavender-mist shadow-soft"
                >
                  <h3 className="font-semibold text-deep-navy text-base mb-2">
                    {item.question}
                  </h3>
                  {item.answer && (
                    <p className="text-sm text-deep-navy/80 leading-relaxed">{item.answer}</p>
                  )}
                </div>
              ))
            ) : (
              vi.habit.offer.faq.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-card p-6 border border-lavender-mist shadow-soft"
                >
                  <h3 className="font-semibold text-deep-navy text-base mb-2">
                    {item.q}
                  </h3>
                  <p className="text-sm text-deep-navy/80 leading-relaxed">{item.a}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CTA */}
      <section className="py-16 bg-brand-gradient border-t border-lavender-mist">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-deep-navy mb-4">
            Bắt đầu hành trình 21 ngày của bạn
          </h2>
          <p className="text-base text-deep-navy/80 mb-8 max-w-lg mx-auto">
            Khám phá {videoCount} video bài giảng, {techniqueCount} kỹ thuật thực chiến và bộ theo dõi 10 cảm xúc để bỏ phiếu cho con người bạn muốn trở thành.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isCtaExternal ? (
              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-accent-pink text-white font-semibold text-base shadow-soft hover:bg-bright-magenta transition-colors"
              >
                {ctaLabel} →
              </a>
            ) : (
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-accent-pink text-white font-semibold text-base shadow-soft hover:bg-bright-magenta transition-colors"
              >
                {ctaLabel} →
              </Link>
            )}
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
