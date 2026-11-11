'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  ArrowRight,
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

export interface EQBuddyIntroProps {
  content?: {
    tagline?: string | null
    quoteTop?: string | null
    badge?: string | null
    mainTitle?: string | null
    subtitle?: string | null
    shopeeUrl?: string | null
    intro1Heading?: string | null
    intro1Description?: string | null
    card1Title?: string | null
    card1Desc?: string | null
    card2Title?: string | null
    card2Desc?: string | null
    card3Title?: string | null
    card3Desc?: string | null
    card4Title?: string | null
    card4Desc?: string | null
    intro2Heading?: string | null
    intro2Description?: string | null
    step1Title?: string | null
    step1Tag?: string | null
    step1Desc?: string | null
    step2Title?: string | null
    step2Tag?: string | null
    step2Desc?: string | null
    step3Title?: string | null
    step3Tag?: string | null
    step3Desc?: string | null
    step4Title?: string | null
    step4Tag?: string | null
    step4Desc?: string | null
    guideModalTitle?: string | null
    guideModalQuote?: string | null
    guideModalButton?: string | null
  } | null
  /** QA DP-01c: rendered by the server page (TrialBanner is an async Server Component). */
  trialBanner?: React.ReactNode
}

export function EQBuddyIntro({ content, trialBanner }: EQBuddyIntroProps) {
  const router = useRouter()
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)

  const rawShopeeUrl =
    content?.shopeeUrl?.trim() ||
    'https://tinyurl.com/yc43suhc'
  // Same UTM + event as ShopeeButton (AGENTS §8.3, §9: Shopee link carries UTM, logs external_clicked)
  const shopeeUrl =
    safeHref(
      appendUtmParams(rawShopeeUrl, {
        source: 'tramdungcamxuc',
        medium: 'website',
        campaign: 'eq-buddy',
      }),
    ) || rawShopeeUrl

  // Hana rà soát: Bỏ phần "Bộ thẻ là gì" và 4 ô mục đích -> để trống thì ẩn
  const hasIntro1 = Boolean(
    content?.intro1Heading?.trim() ||
    content?.card1Title?.trim() ||
    content?.card2Title?.trim() ||
    content?.card3Title?.trim() ||
    content?.card4Title?.trim()
  )

  const hasBadge = Boolean(content?.badge && content.badge.trim().length > 0)

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
              {content?.tagline || 'EQ Buddy • Thẻ Trạm Dừng Cảm Xúc'}
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
              {content?.quoteTop || 'Dừng để vững vàng bước tới.'}
            </span>
          </div>
        </div>

        {/* Header Intro chung */}
        <div className="space-y-3 mb-6 text-center sm:text-left font-ui">
          {hasBadge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soft-pink text-bright-magenta text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-bright-magenta" />
              <span>{content!.badge}</span>
            </div>
          )}

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide text-deep-navy">
            {content?.mainTitle || 'BỘ THẺ EQ BUDDY'}
          </h1>

          <p className="text-sm sm:text-base text-deep-navy/80 font-medium leading-relaxed">
            {content?.subtitle ||
              '26 thông điệp cùng bạn Gói ghém cảm xúc - Ghi nhận nỗ lực - Gợi nhớ bài học ý nghĩa mỗi ngày.'}
          </p>
        </div>

        {/* ==================================================== */}
        {/* NỘI DUNG TÙY CHỌN: "BỘ THẺ LÀ GÌ?" (NẾU CMS CÓ NHẬP LIỆU) */}
        {/* ==================================================== */}
        {hasIntro1 ? (
          <div className="space-y-6 animate-fadeIn font-ui">
            {content?.intro1Heading?.trim() && (
              <div className="border-l-4 border-bright-magenta pl-3 text-left">
                <h3 className="font-display text-lg sm:text-xl text-deep-navy uppercase">
                  {content.intro1Heading}
                </h3>
                {content.intro1Description?.trim() && (
                  <p className="text-xs text-deep-navy/60 font-medium">
                    {content.intro1Description}
                  </p>
                )}
              </div>
            )}

            {/* LƯỚI THẺ THÔNG TIN NẾU CÓ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-left">
              {content?.card1Title?.trim() && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5">
                  <div className="w-8 h-8 rounded-xl bg-soft-pink text-bright-magenta flex items-center justify-center font-bold">
                    <Heart className="w-4 h-4 text-bright-magenta" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                    {content.card1Title}
                  </h4>
                  {content.card1Desc?.trim() && (
                    <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                      {content.card1Desc}
                    </p>
                  )}
                </div>
              )}

              {content?.card2Title?.trim() && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5">
                  <div className="w-8 h-8 rounded-xl bg-mint-haze text-deep-navy flex items-center justify-center font-bold">
                    <Compass className="w-4 h-4 text-deep-navy" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                    {content.card2Title}
                  </h4>
                  {content.card2Desc?.trim() && (
                    <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                      {content.card2Desc}
                    </p>
                  )}
                </div>
              )}

              {content?.card3Title?.trim() && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5">
                  <div className="w-8 h-8 rounded-xl bg-butter-cream text-deep-navy flex items-center justify-center font-bold">
                    <Users className="w-4 h-4 text-deep-navy" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                    {content.card3Title}
                  </h4>
                  {content.card3Desc?.trim() && (
                    <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                      {content.card3Desc}
                    </p>
                  )}
                </div>
              )}

              {content?.card4Title?.trim() && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5">
                  <div className="w-8 h-8 rounded-xl bg-lavender-mist text-deep-navy flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4 text-deep-navy" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                    {content.card4Title}
                  </h4>
                  {content.card4Desc?.trim() && (
                    <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                      {content.card4Desc}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Nút thao tác đi thẳng vào rút thẻ */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-lavender-mist">
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="text-xs text-deep-navy/70 hover:text-deep-navy underline underline-offset-4 transition-colors cursor-pointer"
              >
                📖 {vi.dp01eq.guide}
              </button>

              <Link
                href="/eq-buddy/rut-the"
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-semibold text-sm shadow-soft-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span>✨ {vi.au02.drawNow}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          /* MẶC ĐỊNH THEO RÀ SOÁT CỦA HANA: ĐI THẲNG VÀO RÚT THẺ */
          <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-lavender-mist font-ui">
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-full bg-white hover:bg-soft-pink/40 border border-lavender-mist hover:border-bright-magenta text-deep-navy text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-soft-md cursor-pointer order-2 sm:order-1"
            >
              <BookOpen className="w-4 h-4 text-bright-magenta" />
              <span>📖 {vi.dp01eq.guide}</span>
            </button>

            <Link
              href="/eq-buddy/rut-the"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-semibold text-sm sm:text-base shadow-soft-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group order-1 sm:order-2"
            >
              <span>✨ {vi.au02.drawNow}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
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
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-lavender-mist hover:border-bright-magenta text-deep-navy hover:text-bright-magenta text-xs sm:text-sm font-semibold shadow-soft-md transition-all cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-bright-magenta" />
          <span>{vi.au02.buyDeckShopee} →</span>
        </a>
      </div>

      {/* Global Guide Modal */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        title={content?.guideModalTitle || undefined}
        quote={content?.guideModalQuote || undefined}
        buttonText={content?.guideModalButton || undefined}
        step1Title={content?.step1Title || undefined}
        step1Desc={content?.step1Desc || undefined}
        step2Title={content?.step2Title || undefined}
        step2Desc={content?.step2Desc || undefined}
        step3Title={content?.step3Title || undefined}
        step3Desc={content?.step3Desc || undefined}
        onConfirm={() => router.push('/eq-buddy/rut-the')}
      />
    </div>
  )
}
