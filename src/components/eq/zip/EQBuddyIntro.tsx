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
import { TrialBanner } from '@/components/habit/TrialBanner'
import { EQ_BUDDY_PRODUCT_SLUG } from '@/lib/eq/config'

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
    guideModalQuote?: string | null
  } | null
  showTrialBanner?: boolean
}

export function EQBuddyIntro({
  content,
  showTrialBanner = false,
}: EQBuddyIntroProps) {
  const [introStep, setIntroStep] = useState<1 | 2>(1)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)

  const shopeeUrl =
    content?.shopeeUrl ||
    'https://shopee.vn/search?keyword=tr%E1%BA%A1m%20d%E1%BB%ABng%20c%E1%BA%A3m%20x%C3%BAc'

  return (
    <div className="w-full space-y-8">
      {/* Trial banner: chỉ hiển thị khi chế độ yêu cầu đăng ký dùng thử */}
      {showTrialBanner && <TrialBanner productSlug={EQ_BUDDY_PRODUCT_SLUG} />}

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
              <span>📖 Hướng dẫn</span>
            </button>

            <span className="font-quote italic text-sm sm:text-base md:text-lg text-bright-magenta font-semibold tracking-wide hidden sm:inline">
              {content?.quoteTop || 'Trạm dừng để lắng nghe ♡'}
            </span>
          </div>
        </div>

        {/* Header Intro chung */}
        <div className="space-y-2 mb-6 text-center sm:text-left font-ui">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soft-pink text-bright-magenta text-xs font-semibold">
              {/* a11y-contrast-ok: SVG icon trang trí */}
<Sparkles className="w-3.5 h-3.5 text-accent-pink" />
              <span>{content?.badge || 'Bộ thẻ chánh niệm & Trí tuệ cảm xúc (EQ)'}</span>
            </div>

            {/* Progress step badge 1/2 */}
            <div className="flex items-center gap-1.5 text-xs text-deep-navy/60 font-medium">
              <span className="px-2 py-0.5 rounded-full bg-lavender-mist/60 text-deep-navy font-semibold text-[11px]">
                Bước {introStep}/2
              </span>
              <span>{introStep === 1 ? 'Giới thiệu bộ thẻ' : 'Cách thức sử dụng'}</span>
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide text-deep-navy">
            {content?.mainTitle || 'TRẠM DỪNG CẢM XÚC'}
          </h1>

          <p className="text-sm sm:text-base text-deep-navy/80 font-medium">
            26 thông điệp cùng bạn.{' '}
            <strong className="text-bright-magenta">Gọi tên</strong> -{' '}
            <strong className="text-bright-magenta">Ghi nhận</strong> -{' '}
            <strong className="text-deep-navy">Gợi nhớ</strong>.
          </p>
        </div>

        {/* ==================================================== */}
        {/* MÀN HÌNH INTRO 1: "BỘ THẺ LÀ GÌ?" (Lưới 4 thẻ thông tin) */}
        {/* ==================================================== */}
        {introStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-l-4 border-bright-magenta pl-3 text-left font-ui">
              <h3 className="font-display text-lg sm:text-xl text-deep-navy uppercase">
                {content?.intro1Heading || 'Bộ thẻ là gì?'}
              </h3>
              <p className="text-xs text-deep-navy/60 font-medium">
                {content?.intro1Description ||
                  'Công cụ chiêm nghiệm và đối thoại cảm xúc được thiết kế cho phụ nữ hiện đại.'}
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
                    Mục đích
                  </span>
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                  {content?.card1Title || 'Tĩnh lặng & Lắng nghe sâu'}
                </h4>
                <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                  {content?.card1Desc ||
                    'Mỗi thẻ là một từ khóa EQ giúp bạn dừng lại, kết nối với cảm xúc, nhận diện những xao động và tái tạo nguồn năng lượng an yên bên trong.'}
                </p>
              </div>

              {/* 2. Dùng một mình */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5 hover:border-mint-haze transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-mint-haze text-deep-navy flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4 text-deep-navy" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mint-haze text-deep-navy">
                    Dùng một mình
                  </span>
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                  {content?.card2Title || 'Chiêm nghiệm cá nhân'}
                </h4>
                <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                  {content?.card2Desc ||
                    'Mở đầu ngày mới tràn đầy chánh niệm, đúc kết bài học sau mỗi trải nghiệm, hoặc tìm một từ khóa dẫn lối khi lý trí đang bối rối, mông lung.'}
                </p>
              </div>

              {/* 3. Dùng nhiều người */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5 hover:border-butter-cream transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-butter-cream text-deep-navy flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4 text-deep-navy" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-butter-cream text-deep-navy">
                    Dùng nhiều người
                  </span>
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                  {content?.card3Title || 'Kết nối & Thấu hiểu nhóm'}
                </h4>
                <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                  {content?.card3Desc ||
                    'Phá băng nhóm (Icebreaker), khám phá giá trị đội ngũ, nhắn nhủ chân thành giữa bạn bè hoặc người thân trong một không gian an toàn, cởi mở.'}
                </p>
              </div>

              {/* 4. Cấu trúc mỗi thẻ */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5 hover:border-lavender-mist transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-lavender-mist text-deep-navy flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4 text-deep-navy" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lavender-mist text-deep-navy">
                    Cấu trúc thẻ
                  </span>
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-deep-navy">
                  {content?.card4Title || '2 Mặt tương tác 3D'}
                </h4>
                <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                  {content?.card4Desc ||
                    'Mặt trước: Từ khóa EQ + Thông điệp cảm hứng dẫn dắt. Mặt sau: 3 câu hỏi gợi mở suy ngẫm theo cấu trúc Gợi nhớ - Gói ghém - Ghi nhận.'}
                </p>
              </div>
            </div>

            {/* Nút thao tác Intro 1 */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-lavender-mist font-ui">
              <Link
                href="/eq-buddy/rut-the"
                className="text-xs text-deep-navy/70 hover:text-deep-navy underline underline-offset-4 transition-colors order-2 sm:order-1"
              >
                Bỏ qua hướng dẫn và rút thẻ ngay →
              </Link>

              <button
                type="button"
                onClick={() => setIntroStep(2)}
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-semibold text-sm shadow-soft-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group order-1 sm:order-2 cursor-pointer"
              >
                <span>Tiếp tục</span>
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
                {content?.intro2Heading || '4 Bước Sử Dụng Bộ Thẻ'}
              </h3>
              <p className="text-xs text-deep-navy/60 font-medium">
                {content?.intro2Description ||
                  'Hãy thả lỏng vai, hít một hơi thật sâu và làm theo 4 chỉ dẫn đơn giản sau:'}
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
                      {content?.step1Title || '1. Mở đầu'}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint-haze text-deep-navy">
                      {content?.step1Tag || 'Đặt ý định'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-deep-navy/75 leading-relaxed">
                    {content?.step1Desc ||
                      'Đặt ý định cho điều gì trong cuộc sống hay công việc hôm nay? Dành 30 giây tĩnh lặng, hít thở sâu để đưa tâm trí về trạng thái hiện diện trọn vẹn.'}
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
                      {content?.step2Title || '2. Chọn thẻ'}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-soft-pink text-bright-magenta">
                      {content?.step2Tag || 'Gọi tên cảm xúc'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-deep-navy/75 leading-relaxed">
                    {content?.step2Desc ||
                      'Chia sẻ cảm xúc bạn đang gặp — hoặc để trống và rút ngẫu nhiên thông điệp phù hợp cho khoảnh khắc này.'}
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
                      {content?.step3Title || '3. Thực hiện'}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-butter-cream text-deep-navy">
                      {content?.step3Tag || 'Mặt trước thẻ'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-deep-navy/75 leading-relaxed">
                    {content?.step3Desc ||
                      'Đọc từ khóa kèm câu diễn giải ở mặt trước → kết nối cảm nhận và lắng nghe phản hồi từ cơ thể và tâm trí.'}
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
                      {content?.step4Title || '4. Khám phá'}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lavender-mist text-deep-navy">
                      {content?.step4Tag || 'Mặt sau thẻ'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-deep-navy/75 leading-relaxed">
                    {content?.step4Desc ||
                      'Lật thẻ, trả lời 3 câu hỏi ở mặt sau để đào sâu và kết nối, gói ghém bài học và ghi nhận nỗ lực của bản thân.'}
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
                <span>Quay lại bước 1</span>
              </button>

              <Link
                href="/eq-buddy/rut-the"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-semibold text-sm sm:text-base shadow-soft-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span>✨ Bắt đầu hành trình</span>
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
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-lavender-mist hover:border-bright-magenta text-deep-navy hover:text-bright-magenta text-xs sm:text-sm font-semibold shadow-soft-md transition-all"
        >
          <ShoppingBag className="w-4 h-4 text-bright-magenta" />
          <span>Đặt mua bộ thẻ vật lý trên Shopee →</span>
        </a>
      </div>

      {/* Global Guide Modal */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        quote={content?.guideModalQuote || undefined}
      />
    </div>
  )
}
