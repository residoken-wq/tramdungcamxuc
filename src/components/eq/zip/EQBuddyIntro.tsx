'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Heart,
  Compass,
  Users,
  Layers,
  BookOpen,
  ShoppingBag,
} from 'lucide-react'
import { GuideModal } from './GuideModal'
import { appendUtmParams } from '@/lib/utm'
import { safeHref } from '@/lib/safe-href'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'
import { withEqBuddyDefaults, type Dp01EqBuddyContent } from '@/lib/eq/eq-content'

export interface EQBuddyIntroProps {
  content?: Partial<Dp01EqBuddyContent> | null
  /** QA DP-01c: rendered by the server page (TrialBanner is an async Server Component). */
  trialBanner?: React.ReactNode
}

export function EQBuddyIntro({ content, trialBanner }: EQBuddyIntroProps) {
  const resolvedContent = withEqBuddyDefaults(content)
  const [introStep, setIntroStep] = useState<1 | 2>(1)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)

  const rawShopeeUrl =
    resolvedContent.shopeeUrl ||
    'https://shopee.vn/search?keyword=tr%E1%BA%A1m%20d%E1%BB%ABng%20c%E1%BA%A3m%20x%C3%BAc'
  // Same UTM + event as ShopeeButton (AGENTS §8.3, §9: Shopee link carries UTM, logs external_clicked)
  const shopeeUrl =
    safeHref(
      appendUtmParams(rawShopeeUrl, {
        source: 'tramdungcamxuc',
        medium: 'website',
        campaign: 'eq-buddy',
      }),
    ) || rawShopeeUrl

  return (
    <div className="w-full space-y-8">
      {/* Trial banner: chỉ hiển thị khi chế độ yêu cầu đăng ký dùng thử */}
      {trialBanner}

      {/* Khung zip chính */}
      <div className="w-full max-w-3xl mx-auto bg-warm-ivory rounded-2xl sm:rounded-3xl border border-lavender-mist p-4 sm:p-6 md:p-8 shadow-soft-md transition-all relative">
        {/* Header Series Bar */}
        <div className="flex items-center justify-between border-b border-lavender-mist pb-3 sm:pb-4 mb-4 sm:mb-6 font-ui">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-bright-magenta animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-deep-navy/70">
              {resolvedContent.tagline}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Hướng dẫn */}
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soft-pink hover:bg-bright-magenta hover:text-white text-bright-magenta text-xs font-semibold border border-bright-magenta/30 shadow-soft-md transition-all active:scale-95 group cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-bright-magenta group-hover:text-white transition-colors" />
              <span>📖 {vi.dp01eq.guide}</span>
            </button>

            <span className="font-quote italic text-sm sm:text-base md:text-lg text-bright-magenta font-semibold tracking-wide hidden sm:inline">
              {resolvedContent.quoteTop}
            </span>
          </div>
        </div>

        {/* Header Intro chung */}
        <div className="space-y-2 mb-6 text-center sm:text-left font-ui">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soft-pink text-bright-magenta text-xs font-semibold">
              {/* a11y-contrast-ok: SVG icon trang trí */}
              <Sparkles className="w-3.5 h-3.5 text-accent-pink" />
              <span>{resolvedContent.badge}</span>
            </div>

            {/* Progress step badge 1/2 */}
            <div className="flex items-center gap-1.5 text-xs text-deep-navy/60 font-medium">
              <span className="px-2 py-0.5 rounded-full bg-lavender-mist/60 text-deep-navy font-semibold text-[11px]">
                {vi.dp01eq.stepPrefix} {introStep}/2
              </span>
              <span>{introStep === 1 ? vi.dp01eq.introCard1Title : vi.dp01eq.introCard2Title}</span>
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide text-deep-navy">
            {resolvedContent.mainTitle}
          </h1>

          <p className="text-sm sm:text-base text-deep-navy/80 font-medium">
            {resolvedContent.subtitle ? (
              resolvedContent.subtitle
            ) : (
              <>
                {vi.dp01eq.introSubtitlePrefix}{' '}
                <strong className="text-bright-magenta">{vi.dp01eq.introSubtitleName}</strong> -{' '}
                <strong className="text-bright-magenta">{vi.dp01eq.introSubtitleRecord}</strong> -{' '}
                <strong className="text-deep-navy">{vi.dp01eq.introSubtitleRemind}</strong>
              </>
            )}
          </p>
        </div>

        {/* ==================================================== */}
        {/* MÀN HÌNH INTRO 1: "BỘ THẺ LÀ GÌ?" (Lưới 4 thẻ thông tin) */}
        {/* ==================================================== */}
        {introStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-l-4 border-bright-magenta pl-3 text-left font-ui">
              <h3 className="font-display text-lg sm:text-xl text-deep-navy uppercase">
                {resolvedContent.intro1Heading}
              </h3>
              <p className="text-xs text-deep-navy/60 font-medium">
                {resolvedContent.intro1Description}
              </p>
            </div>

            {/* LƯỚI 4 THẺ THÔNG TIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-left font-ui">
              {/* 1. Mục đích */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5 hover:border-bright-magenta/40 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-soft-pink text-bright-magenta flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Heart className="w-4 h-4 text-bright-magenta" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-soft-pink text-bright-magenta">
                    {vi.dp01eq.purpose}
                  </span>
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                  {resolvedContent.card1Title}
                </h4>
                <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                  {resolvedContent.card1Desc}
                </p>
              </div>

              {/* 2. Dùng một mình */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5 hover:border-mint-haze transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-mint-haze text-deep-navy flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4 text-deep-navy" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mint-haze text-deep-navy">
                    {vi.dp01eq.useAlone}
                  </span>
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                  {resolvedContent.card2Title}
                </h4>
                <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                  {resolvedContent.card2Desc}
                </p>
              </div>

              {/* 3. Dùng nhiều người */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5 hover:border-butter-cream transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-butter-cream text-deep-navy flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4 text-deep-navy" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-butter-cream text-deep-navy">
                    {vi.dp01eq.useGroup}
                  </span>
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                  {resolvedContent.card3Title}
                </h4>
                <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                  {resolvedContent.card3Desc}
                </p>
              </div>

              {/* 4. Cấu trúc mỗi thẻ */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5 hover:border-lavender-mist transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-lavender-mist text-deep-navy flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4 text-deep-navy" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lavender-mist text-deep-navy">
                    {vi.dp01eq.cardStructure}
                  </span>
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                  {resolvedContent.card4Title}
                </h4>
                <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                  {resolvedContent.card4Desc}
                </p>
              </div>
            </div>

            {/* Nút thao tác Intro 1 */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-lavender-mist font-ui">
              <Link
                href="/eq-buddy/rut-the"
                className="text-xs text-deep-navy/70 hover:text-deep-navy underline underline-offset-4 transition-colors order-2 sm:order-1"
              >
                {vi.dp01eq.skipToDraw}
              </Link>

              <button
                type="button"
                onClick={() => setIntroStep(2)}
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-semibold text-sm shadow-soft-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group order-1 sm:order-2 cursor-pointer"
              >
                <span>{vi.dp01.continue}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MÀN HÌNH INTRO 2: "4 BƯỚC SỬ DỤNG" */}
        {/* ==================================================== */}
        {introStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-l-4 border-bright-magenta pl-3 text-left font-ui">
              <h3 className="font-display text-lg sm:text-xl text-deep-navy uppercase">
                {resolvedContent.intro2Heading}
              </h3>
              <p className="text-xs text-deep-navy/60 font-medium">
                {resolvedContent.intro2Description}
              </p>
            </div>

            {/* Danh sách 4 bước */}
            <div className="grid grid-cols-1 gap-3 text-left font-ui">
              {/* Bước 1: Mở đầu */}
              <div className="p-4 rounded-2xl bg-white border border-lavender-mist shadow-soft-md flex items-start gap-3.5 hover:border-bright-magenta/30 transition-all">
                <div className="w-9 h-9 rounded-2xl bg-mint-haze text-deep-navy flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                      {resolvedContent.step1Title}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint-haze text-deep-navy">
                      {resolvedContent.step1Tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-deep-navy/75 leading-relaxed">
                    {resolvedContent.step1Desc}
                  </p>
                </div>
              </div>

              {/* Bước 2: Chọn thẻ */}
              <div className="p-4 rounded-2xl bg-white border border-lavender-mist shadow-soft-md flex items-start gap-3.5 hover:border-bright-magenta/30 transition-all">
                <div className="w-9 h-9 rounded-2xl bg-soft-pink text-bright-magenta flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                      {resolvedContent.step2Title}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-soft-pink text-bright-magenta">
                      {resolvedContent.step2Tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-deep-navy/75 leading-relaxed">
                    {resolvedContent.step2Desc}
                  </p>
                </div>
              </div>

              {/* Bước 3: Thực hiện */}
              <div className="p-4 rounded-2xl bg-white border border-lavender-mist shadow-soft-md flex items-start gap-3.5 hover:border-bright-magenta/30 transition-all">
                <div className="w-9 h-9 rounded-2xl bg-butter-cream text-deep-navy flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                      {resolvedContent.step3Title}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-butter-cream text-deep-navy">
                      {resolvedContent.step3Tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-deep-navy/75 leading-relaxed">
                    {resolvedContent.step3Desc}
                  </p>
                </div>
              </div>

              {/* Bước 4: Khám phá */}
              <div className="p-4 rounded-2xl bg-white border border-lavender-mist shadow-soft-md flex items-start gap-3.5 hover:border-bright-magenta/30 transition-all">
                <div className="w-9 h-9 rounded-2xl bg-lavender-mist text-deep-navy flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  4
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                      {resolvedContent.step4Title}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lavender-mist text-deep-navy">
                      {resolvedContent.step4Tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-deep-navy/75 leading-relaxed">
                    {resolvedContent.step4Desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Nút thao tác Intro 2 */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-lavender-mist font-ui">
              <button
                type="button"
                onClick={() => setIntroStep(1)}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-soft-pink/40 border border-lavender-mist text-deep-navy text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-soft-md cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{vi.dp01eq.backToStep1}</span>
              </button>

              <Link
                href="/eq-buddy/rut-the"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-semibold text-sm sm:text-base shadow-soft-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span>✨ {vi.dp01eq.drawNow}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Nút Shopee mua bộ thẻ vật lý */}
      <div className="max-w-3xl mx-auto text-center font-ui">
        <a
          href={shopeeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('external_clicked', { url: shopeeUrl, type: 'shopee' })}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-lavender-mist hover:border-bright-magenta text-deep-navy hover:text-bright-magenta text-xs sm:text-sm font-semibold shadow-soft-md transition-all"
        >
          <ShoppingBag className="w-4 h-4 text-bright-magenta" />
          <span>{vi.dp01eq.buyPhysicalDeck} →</span>
        </a>
      </div>

      {/* Global Guide Modal */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        quote={resolvedContent.guideModalQuote}
      />
    </div>
  )
}
