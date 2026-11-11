'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import {
  Wind,
  Heart,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  RefreshCw,
  Eye,
  BookOpen,
  Bookmark,
  Share2,
  Download,
  Check,
  ShoppingBag,
} from 'lucide-react'
import { GuideModal } from './GuideModal'
import { EQCardFlip } from './EQCardFlip'
import { ExperienceBookingButton } from '@/components/site/ExperienceBookingButton'
import type { PublicEqCard } from '@/lib/eq/cards.server'
import type { PublicProduct } from '@/lib/products'
import { getEffectivePrice } from '@/lib/products'
import { formatVnd } from '@/lib/format'
import { appendUtmParams } from '@/lib/utm'
import { safeHref } from '@/lib/safe-href'
import { track } from '@/lib/analytics/track'
import { drawEqCardAction } from '@/lib/eq/actions'
import { saveEqCardAction } from '@/lib/eq/saved-actions'
import { EQ_BUDDY_PRODUCT_SLUG } from '@/lib/eq/config'
import { vi } from '@/lib/i18n/vi'

export interface EQDrawAppContentProps {
  quoteTop?: string | null
  stateIcon1Label?: string | null
  stateIcon2Label?: string | null
  stateIcon3Label?: string | null
  cardBackPromptTitle?: string | null
  cardBackQuote?: string | null
  guideModalTitle?: string | null
  guideModalQuote?: string | null
  guideModalButton?: string | null
  step1Title?: string | null
  step1Desc?: string | null
  step2Title?: string | null
  step2Desc?: string | null
  step3Title?: string | null
  step3Desc?: string | null
}

export interface EQDrawAppProps {
  allCards: PublicEqCard[]
  initialCard?: PublicEqCard | null
  initialStep?: 'draw' | 'result' | 'all-cards' | 'paywall'
  isLoggedIn?: boolean
  isUnlockedAll?: boolean
  isFreeMode?: boolean
  suggestedEmotions?: string[]
  guideModalQuote?: string
  paywall?: React.ReactNode
  eqProduct?: PublicProduct | null
  coachingProduct?: PublicProduct | null
  shopeeUrl?: string | null
  content?: EQDrawAppContentProps | null
}

export function EQDrawApp({
  allCards,
  initialCard,
  initialStep = 'draw',
  isLoggedIn = false,
  isUnlockedAll = false,
  isFreeMode = false,
  suggestedEmotions = [
    'Mông lung',
    'Căng thẳng',
    'Biết ơn',
    'Bình an',
    'Tò mò',
    'Cần dẫn lối',
    'Hơi mệt',
    'Bối rối',
  ],
  guideModalQuote,
  paywall,
  eqProduct,
  coachingProduct,
  shopeeUrl,
  content,
}: EQDrawAppProps) {
  const router = useRouter()
  const [step, setStep] = useState<'draw' | 'result' | 'all-cards' | 'paywall'>(initialStep)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)

  // AU-02: Phân biệt chữ khách gõ và cảm xúc đã chọn
  const [userNote, setUserNote] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)

  const [selectedCard, setSelectedCard] = useState<PublicEqCard | null>(
    initialCard || allCards[0] || null,
  )
  const [reflectionText, setReflectionText] = useState('')
  const [isSavingReflection, setIsSavingReflection] = useState(false)
  const [reflectionSavedMessage, setReflectionSavedMessage] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [toastMessage, setToastMessage] = useState<{
    text: string
    type: 'error' | 'success'
  } | null>(null)

  React.useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => {
      setToastMessage(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // Giá EQ Buddy số cho nút Trở thành VIP Member
  const eqPricing = eqProduct
    ? getEffectivePrice(eqProduct, new Date())
    : { price: 250000, salePrice: null }
  const hasSale = eqPricing.salePrice !== null && eqPricing.salePrice !== undefined
  const currentVipPrice = hasSale ? eqPricing.salePrice : eqPricing.price

  // Link Shopee có UTM
  const rawShopeeUrl = shopeeUrl?.trim() || 'https://tinyurl.com/yc43suhc'
  const resolvedShopeeUrl =
    safeHref(
      appendUtmParams(rawShopeeUrl, {
        source: 'tramdungcamxuc',
        medium: 'website',
        campaign: 'eq-buddy',
      }),
    ) || rawShopeeUrl

  // Rút thẻ
  const triggerConfetti = () => {
    try {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!prefersReducedMotion && typeof confetti === 'function') {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#BC039E', '#EF3B83', '#E9DDF9', '#F6E9B8', '#D9F1EA'],
        })
      }
    } catch {
      // ignore
    }
  }

  const handleDrawCard = async () => {
    setIsDrawing(true)
    try {
      const res = await drawEqCardAction({
        mode: 'random',
        previousCardCode: selectedCard?.code,
      })

      if (res.success) {
        setSelectedCard(res.card)
        setIsFlipped(false)
        setReflectionText('')
        setReflectionSavedMessage(null)
        setStep('result')
        triggerConfetti()
      } else if (res.code === 'PAYWALL') {
        setStep('paywall')
      } else {
        setToastMessage({ text: res.message || vi.dp01eq.drawError, type: 'error' })
      }
    } catch (err) {
      console.error('Error drawing card:', err)
      // Fallback local draw if offline/mock
      if (allCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * allCards.length)
        setSelectedCard(allCards[randomIndex])
        setIsFlipped(false)
        setStep('result')
        triggerConfetti()
      }
    } finally {
      setIsDrawing(false)
    }
  }

  // Chọn thẻ cụ thể từ danh sách tất cả thẻ
  const handleSelectSpecificCard = async (card: PublicEqCard) => {
    if (!isUnlockedAll && !isFreeMode && !card.message) {
      const res = await drawEqCardAction({
        mode: 'keyword',
        qrSlug: card.qrSlug,
      })
      if (res.success) {
        setSelectedCard(res.card)
        setIsFlipped(false)
        setStep('result')
      } else if (res.code === 'PAYWALL') {
        setStep('paywall')
      }
      return
    }

    setSelectedCard(card)
    setIsFlipped(false)
    setReflectionText('')
    setReflectionSavedMessage(null)
    setStep('result')
  }

  // Lưu thẻ và suy ngẫm
  const handleSaveReflection = async () => {
    if (!selectedCard) return
    if (!isLoggedIn) {
      router.push(`/tai-khoan/dang-nhap?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setIsSavingReflection(true)
    try {
      const res = await saveEqCardAction({
        qrSlug: selectedCard.qrSlug,
        reflection: reflectionText.trim() || null,
      })
      if (res.success) {
        setReflectionSavedMessage(vi.dp01eq.saveCardSuccess)
        setTimeout(() => setReflectionSavedMessage(null), 3000)
      } else {
        setToastMessage({ text: res.message || vi.dp01eq.saveCardError, type: 'error' })
      }
    } catch (err) {
      console.error('Error saving reflection:', err)
    } finally {
      setIsSavingReflection(false)
    }
  }

  // Sao chép link thẻ
  const handleCopyLink = () => {
    if (!selectedCard) return
    const url = `${window.location.origin}/eq-buddy/the/${selectedCard.qrSlug}`
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Khung zip chính */}
      <div className="w-full max-w-3xl mx-auto bg-warm-ivory rounded-2xl sm:rounded-3xl border border-lavender-mist p-4 sm:p-6 md:p-8 shadow-soft-md transition-all relative">
        {/* Header Series Bar */}
        <div className="flex items-center justify-between border-b border-lavender-mist pb-3 sm:pb-4 mb-4 sm:mb-6 font-ui">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-bright-magenta animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-deep-navy/70">
              EQ Buddy • Thẻ Trạm Dừng Cảm Xúc
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soft-pink hover:bg-bright-magenta hover:text-white text-bright-magenta text-xs font-semibold border border-bright-magenta/30 shadow-soft-md transition-all active:scale-95 group cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-bright-magenta group-hover:text-white transition-colors" />
              <span>📖 {vi.dp01eq.guide}</span>
            </button>

            <span className="font-quote italic text-sm sm:text-base md:text-lg text-bright-magenta font-semibold tracking-wide hidden sm:inline">
              {content?.quoteTop || vi.dp01eq.pauseReturnQuote}
            </span>
          </div>
        </div>

        {/* In-app Toast / Notification banner */}
        {toastMessage && (
          <div
            role="alert"
            aria-live="polite"
            className={`mb-4 p-3 rounded-2xl flex items-center justify-between text-xs font-semibold font-ui ${
              toastMessage.type === 'error'
                ? 'bg-soft-pink border border-accent-pink/40 text-deep-navy'
                : 'bg-mint-haze border border-[#2E7D32]/40 text-[#2E7D32]'
            }`}
          >
            <span>{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 text-deep-navy/70 hover:text-deep-navy cursor-pointer"
              aria-label={vi.common.close}
            >
              ×
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* BƯỚC 1: MÀN HÌNH NHẬP TRẠNG THÁI (DRAW) - AU-02 */}
        {/* ==================================================== */}
        {step === 'draw' && (
          <div className="space-y-6 animate-fadeIn font-ui">
            <div className="p-5 sm:p-8 rounded-3xl bg-white border border-lavender-mist shadow-soft-md space-y-5 text-center sm:text-left">
              {/* 3 Biểu tượng trạng thái theo Hana rà soát */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-2xl bg-warm-ivory border border-lavender-mist">
                  <div className="w-8 h-8 rounded-xl bg-mint-haze text-deep-navy flex items-center justify-center">
                    <Wind className="w-4 h-4 text-deep-navy" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-deep-navy leading-tight">
                    {content?.stateIcon1Label || vi.au02.stateIcon1}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-2xl bg-warm-ivory border border-lavender-mist">
                  <div className="w-8 h-8 rounded-xl bg-soft-pink text-bright-magenta flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-bright-magenta" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-deep-navy leading-tight">
                    {content?.stateIcon2Label || vi.au02.stateIcon2}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-2xl bg-warm-ivory border border-lavender-mist">
                  <div className="w-8 h-8 rounded-xl bg-butter-cream text-deep-navy flex items-center justify-center">
                    <Heart className="w-4 h-4 text-deep-navy" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-deep-navy leading-tight">
                    {content?.stateIcon3Label || vi.au02.stateIcon3}
                  </span>
                </div>
              </div>

              {/* Gợi ý chọn nhanh cảm xúc */}
              <div className="space-y-1.5 text-left pt-1">
                <span className="text-[11px] text-deep-navy/60 font-medium">
                  {vi.dp01eq.quickMoodSuggestions}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedEmotions.map((em, idx) => {
                    const isSelected = selectedEmotion === em
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedEmotion((prev) => (prev === em ? null : em))}
                        className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-bright-magenta text-white border-bright-magenta shadow-sm'
                            : 'bg-warm-ivory hover:bg-soft-pink text-deep-navy/80 border-lavender-mist'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {em}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Ô Input và Nút Rút thẻ */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <label htmlFor="emotion-input" className="sr-only">
                  {vi.dp01eq.todayEmotionLabel}
                </label>
                <input
                  id="emotion-input"
                  type="text"
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDrawCard()
                  }}
                  placeholder={vi.dp01eq.emotionInputPlaceholder}
                  className="w-full px-4 py-3 rounded-2xl border border-lavender-mist text-xs sm:text-sm text-deep-navy placeholder:text-deep-navy/70 focus:border-bright-magenta focus:ring-2 focus:ring-bright-magenta/20 focus:outline-none transition-all bg-warm-ivory/50 focus:bg-white"
                />

                <button
                  type="button"
                  disabled={isDrawing}
                  onClick={handleDrawCard}
                  aria-label={vi.dp01eq.drawRandomCardAria}
                  className="w-full sm:w-auto shrink-0 px-6 py-3 rounded-2xl bg-bright-magenta hover:bg-bright-magenta/90 text-white text-xs sm:text-sm font-semibold transition-all shadow-soft-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isDrawing ? vi.dp01eq.drawing : vi.dp01eq.drawCardButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nút Quay lại Intro */}
            <div className="flex items-center justify-between text-xs text-deep-navy/60 pt-2 font-ui">
              <Link
                href="/eq-buddy"
                className="inline-flex items-center gap-1.5 hover:text-bright-magenta transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{vi.dp01eq.backToGuide}</span>
              </Link>
              <span className="font-quote italic text-bright-magenta">
                {vi.dp01eq.everyEmotionMatters}
              </span>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* BƯỚC 2: MÀN HÌNH KẾT QUẢ (CARD FLIP 3D + 3 NÚT) - AU-02 */}
        {/* ==================================================== */}
        {step === 'result' && selectedCard && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn flex flex-col items-center text-center font-ui">
            {/* Header Kết quả: Nhắc lại Tôi đang / Tôi cảm thấy (ẩn dòng trống) */}
            <div className="space-y-1 max-w-lg">
              {userNote.trim() && (
                <p className="text-xs sm:text-sm text-deep-navy/80 font-medium leading-relaxed">
                  <strong className="text-deep-navy">{vi.au02.iAm}</strong> &ldquo;{userNote.trim()}&rdquo;
                </p>
              )}
              {selectedEmotion && (
                <p className="text-xs sm:text-sm text-deep-navy/80 font-medium leading-relaxed">
                  <strong className="text-deep-navy">{vi.au02.iFeel}</strong>{' '}
                  <span className="text-bright-magenta font-semibold">&ldquo;{selectedEmotion}&rdquo;</span>
                </p>
              )}
              {!userNote.trim() && !selectedEmotion && (
                <p className="text-xs sm:text-sm text-deep-navy/80 font-medium leading-relaxed">
                  {vi.dp01eq.quietMomentMessage}
                </p>
              )}
              <span className="text-[11px] text-deep-navy/70 block pt-0.5">
                {vi.dp01eq.flipCardTip}
              </span>
            </div>

            {/* Thẻ lật 3D (Đã bỏ toàn bộ số thẻ / mã thẻ) */}
            <EQCardFlip
              card={selectedCard}
              isFlipped={isFlipped}
              onToggleFlip={() => setIsFlipped((prev) => !prev)}
              totalPublishedCards={allCards.length || 26}
              reflectionHeading={content?.cardBackPromptTitle || undefined}
              cardBackQuote={content?.cardBackQuote || undefined}
            />

            {/* Thao tác lật thẻ & rút thẻ khác */}
            <div className="space-y-3 pt-2 w-full max-w-sm">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFlipped((prev) => !prev)}
                  aria-label={isFlipped ? vi.dp01eq.flipToFrontAria : vi.dp01eq.flipToBackAria}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-deep-navy to-bright-magenta hover:from-bright-magenta hover:to-accent-pink text-white text-xs sm:text-sm font-semibold transition-all shadow-soft-md active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>{isFlipped ? vi.dp01eq.seeFront : vi.dp01eq.flipCard}</span>
                </button>

                <button
                  type="button"
                  disabled={isDrawing}
                  onClick={handleDrawCard}
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-soft-pink/30 border border-lavender-mist hover:border-bright-magenta text-deep-navy hover:text-bright-magenta text-xs sm:text-sm font-semibold transition-all shadow-soft-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4 text-bright-magenta" />
                  <span>{vi.dp01eq.drawAnotherCard}</span>
                </button>
              </div>

              {/* Nút Xem tất cả thẻ & Đổi cảm xúc */}
              <div className="flex items-center justify-center gap-4 text-xs pt-1 font-ui">
                <button
                  type="button"
                  onClick={() => setStep('all-cards')}
                  className="inline-flex items-center gap-1.5 text-deep-navy/70 hover:text-bright-magenta font-semibold underline underline-offset-4 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{vi.dp01eq.viewAllCards}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('draw')}
                  className="text-deep-navy/70 hover:text-deep-navy transition-colors cursor-pointer"
                >
                  {vi.dp01eq.changeEmotion}
                </button>
              </div>
            </div>

            {/* Khối Ghi suy ngẫm · Lưu thẻ · Chia sẻ */}
            <div className="w-full max-w-md p-5 sm:p-6 rounded-3xl bg-white border border-lavender-mist shadow-soft-md space-y-4 text-left font-ui">
              <div className="border-b border-lavender-mist pb-2">
                <h4 className="font-semibold text-sm text-deep-navy flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-bright-magenta" />
                  <span>{vi.dp01eq.reflectionCardTitle}</span>
                </h4>
                <p className="text-[11px] text-deep-navy/60 mt-0.5">
                  {vi.dp01eq.reflectionCardDesc}
                </p>
              </div>

              <div className="space-y-1.5">
                <textarea
                  id="reflection-input"
                  aria-label={vi.dp01eq.reflectionPlaceholder}
                  rows={3}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder={vi.dp01eq.reflectionPlaceholder}
                  className="w-full p-3 rounded-2xl bg-warm-ivory border border-lavender-mist text-xs text-deep-navy focus:border-bright-magenta focus:outline-none resize-y"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSavingReflection}
                  onClick={handleSaveReflection}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-bright-magenta hover:bg-bright-magenta/90 text-white text-xs font-semibold shadow-soft-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSavingReflection ? (
                    <span>{vi.dp01.saving}</span>
                  ) : reflectionSavedMessage ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{reflectionSavedMessage}</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{vi.dp01eq.saveReflectionButton}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    title={vi.dp01eq.copyCardLink}
                    className="p-2 rounded-xl border border-lavender-mist text-deep-navy/70 hover:text-bright-magenta hover:border-bright-magenta transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-deep-navy" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={`/eq-buddy/the/${selectedCard.qrSlug}/anh/4x5`}
                    download
                    title={vi.dp01eq.download45Title}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-lavender-mist text-deep-navy/70 hover:text-bright-magenta hover:border-bright-magenta text-[11px] font-semibold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>{vi.dp01eq.download45}</span>
                  </a>

                  <a
                    href={`/eq-buddy/the/${selectedCard.qrSlug}/anh/9x16`}
                    download
                    title={vi.dp01eq.download916Title}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-lavender-mist text-deep-navy/70 hover:text-bright-magenta hover:border-bright-magenta text-[11px] font-semibold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>{vi.dp01eq.download916}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* ================================================== */}
            {/* 3 NÚT HÀNH ĐỘNG THEO RÀ SOÁT CỦA HANA (AU-02) */}
            {/* ================================================== */}
            <div className="w-full max-w-md space-y-3 font-ui pt-2">
              {/* 1. Nút Trở thành VIP Member (giá từ sản phẩm CMS, có xử lý khuyến mãi) */}
              <Link
                href={`/thanh-toan?san-pham=${eqProduct?.slug || EQ_BUDDY_PRODUCT_SLUG}`}
                className="w-full py-3 px-5 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-soft-md hover:shadow-lg transition-all active:scale-95"
              >
                <span>{vi.au02.vipMember}</span>
                {hasSale ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="line-through opacity-75">{formatVnd(eqPricing.price)}</span>
                    <span className="font-bold">{formatVnd(eqPricing.salePrice)}</span>
                  </span>
                ) : currentVipPrice != null ? (
                  <span className="text-xs opacity-90">({formatVnd(currentVipPrice)})</span>
                ) : null}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                {/* 2. Nút Mua bộ thẻ trên Shopee */}
                <a
                  href={resolvedShopeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track('external_clicked', { url: resolvedShopeeUrl, type: 'shopee' })
                  }
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-full bg-white border border-lavender-mist hover:border-bright-magenta text-deep-navy hover:text-bright-magenta font-semibold text-xs flex items-center justify-center gap-1.5 shadow-soft transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-bright-magenta" />
                  <span>{vi.au02.buyDeckShopee}</span>
                </a>

                {/* 3. Nút Đặt lịch coaching 1-1 (phiên trải nghiệm 149k, AU-04) */}
                <div className="w-full sm:w-1/2">
                  <ExperienceBookingButton
                    product={coachingProduct}
                    productSlug="growth-mirror-phien-trai-nghiem"
                    buttonText={vi.au02.bookCoaching}
                    variant="secondary"
                    size="md"
                    shape="pill"
                    showPrice={true}
                    className="w-full !py-2.5 !text-xs justify-center shadow-soft"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* BƯỚC 3: MÀN HÌNH BỘ SƯU TẬP (TẤT CẢ THẺ) */}
        {/* ==================================================== */}
        {step === 'all-cards' && (
          <div className="space-y-5 animate-fadeIn font-ui">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-soft-pink text-bright-magenta text-xs font-semibold mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-bright-magenta" />
                  <span>{vi.dp01eq.collectionBadge}</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl text-deep-navy uppercase">
                  {vi.dp01eq.allCardsTitle}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setStep('result')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-soft-pink/40 border border-lavender-mist text-deep-navy text-xs font-semibold flex items-center gap-1.5 transition-all shadow-soft-md cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{vi.dp01eq.backToCard}</span>
              </button>
            </div>

            <p className="text-xs text-deep-navy/70">{vi.dp01eq.allCardsSubtitle}</p>

            {/* Grid thẻ - Đã bỏ card code / mã thẻ theo AU-02 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
              {allCards.map((card) => {
                const isCurrent = selectedCard?.id === card.id
                const isCardUnlocked = isUnlockedAll || isFreeMode || Boolean(card.message)
                const cardLabel = `${card.keywordVi || card.keywordEn || ''} - ${isCardUnlocked ? vi.dp01eq.cardUnlocked : vi.dp01eq.cardLocked}`

                return (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => handleSelectSpecificCard(card)}
                    aria-label={cardLabel}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group hover:shadow-soft-md text-left w-full ${
                      isCurrent
                        ? 'bg-soft-pink/50 border-bright-magenta ring-2 ring-bright-magenta/20'
                        : 'bg-white hover:bg-warm-ivory border-lavender-mist'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-deep-navy/70 mb-2">
                      <span className="font-semibold text-bright-magenta bg-soft-pink px-2 py-0.5 rounded-full">
                        {card.category || 'EQ BUDDY'}
                      </span>
                      <span className="font-bold text-deep-navy/70">
                        {card.keywordVi || 'Việt'}
                      </span>
                    </div>

                    <h4 className="font-display text-xl text-deep-navy group-hover:text-bright-magenta transition-colors">
                      {card.keywordEn || card.keywordVi || ''}
                    </h4>

                    {isCardUnlocked && card.message ? (
                      <p className="font-quote text-xs text-deep-navy/80 italic mt-1.5 line-clamp-2 leading-relaxed">
                        &ldquo;{card.message}&rdquo;
                      </p>
                    ) : (
                      <p className="font-ui text-xs text-deep-navy/70 italic mt-1.5">
                        {isUnlockedAll || isFreeMode
                          ? vi.dp01eq.touchToOpen
                          : vi.dp01eq.trialOrBuyToUnlock}
                      </p>
                    )}

                    <div className="mt-3 pt-2 border-t border-deep-navy/5 flex items-center justify-between text-[10px] text-bright-magenta font-semibold">
                      <span>{isCardUnlocked ? vi.dp01eq.viewAndFlip3D : vi.dp01eq.unlockCard}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MÀN HÌNH PAYWALL: ĐẶT BÊN TRONG KHUNG ZIP */}
        {/* ==================================================== */}
        {step === 'paywall' && (
          <div className="space-y-4 animate-fadeIn font-ui">
            <div className="flex items-center justify-between border-b border-lavender-mist pb-3">
              <button
                type="button"
                onClick={() => setStep(selectedCard ? 'result' : 'draw')}
                className="inline-flex items-center gap-1.5 text-xs text-deep-navy/70 hover:text-bright-magenta font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{vi.dp01eq.back}</span>
              </button>
            </div>
            {paywall}
          </div>
        )}
      </div>

      {/* Global Guide Modal */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        title={content?.guideModalTitle || undefined}
        quote={guideModalQuote || content?.guideModalQuote || undefined}
        buttonText={content?.guideModalButton || undefined}
        step1Title={content?.step1Title || undefined}
        step1Desc={content?.step1Desc || undefined}
        step2Title={content?.step2Title || undefined}
        step2Desc={content?.step2Desc || undefined}
        step3Title={content?.step3Title || undefined}
        step3Desc={content?.step3Desc || undefined}
      />
    </div>
  )
}
