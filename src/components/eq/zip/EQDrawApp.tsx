'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import {
  Flower2,
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
} from 'lucide-react'
import { GuideModal } from './GuideModal'
import { EQCardFlip } from './EQCardFlip'
import type { PublicEqCard } from '@/lib/eq/cards.server'
import { drawEqCardAction } from '@/lib/eq/actions'
import { saveEqCardAction } from '@/lib/eq/saved-actions'

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
}: EQDrawAppProps) {
  const router = useRouter()
  const [step, setStep] = useState<'draw' | 'result' | 'all-cards' | 'paywall'>(initialStep)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [emotionInput, setEmotionInput] = useState('')
  const [selectedCard, setSelectedCard] = useState<PublicEqCard | null>(
    initialCard || allCards[0] || null,
  )
  const [reflectionText, setReflectionText] = useState('')
  const [isSavingReflection, setIsSavingReflection] = useState(false)
  const [reflectionSavedMessage, setReflectionSavedMessage] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

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
        alert(res.message || 'Không thể rút thẻ. Vui lòng thử lại!')
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
    // Nếu thẻ chưa mở nội dung và không ở freeMode
    if (!isUnlockedAll && !isFreeMode && !card.message) {
      // Thử gọi server action để rút/xem theo slug
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
        setReflectionSavedMessage('Đã lưu vào bộ thẻ của bạn!')
        setTimeout(() => setReflectionSavedMessage(null), 3000)
      } else {
        alert(res.message || 'Không thể lưu thẻ. Vui lòng thử lại!')
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
              <span>📖 Hướng dẫn</span>
            </button>

            <span className="font-quote italic text-sm sm:text-base md:text-lg text-bright-magenta font-semibold tracking-wide hidden sm:inline">
              Trạm dừng để lắng nghe ♡
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* BƯỚC 1: MÀN HÌNH NHẬP CẢM XÚC (DRAW) */}
        {/* ==================================================== */}
        {step === 'draw' && (
          <div className="space-y-6 animate-fadeIn font-ui">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-lavender-mist shadow-soft-md space-y-5 text-center sm:text-left">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soft-pink text-bright-magenta text-xs font-semibold">
                  {/* a11y-contrast-ok: SVG icon trang trí */}
                  <Flower2 className="w-3.5 h-3.5 text-accent-pink" />
                  <span>Bước 2: Lắng nghe tiếng lòng</span>
                </div>

                <h2 className="font-semibold text-lg sm:text-xl md:text-2xl text-deep-navy">
                  🌸 Hôm nay bạn đang cảm thấy thế nào?
                </h2>

                <p className="text-xs sm:text-sm text-deep-navy/70 leading-relaxed">
                  Kể cho mình nghe một cảm xúc, tình huống bạn đang gặp... Hoặc để trống và bấm{' '}
                  <strong className="text-deep-navy">Rút thẻ ngẫu nhiên</strong>.
                </p>
              </div>

              {/* Gợi ý cảm xúc nhanh */}
              <div className="space-y-1.5 text-left">
                <span className="text-[11px] text-deep-navy/60 font-medium">
                  Gợi ý chọn nhanh tâm trạng:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedEmotions.map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEmotionInput(em)}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-warm-ivory hover:bg-soft-pink text-deep-navy/80 border border-lavender-mist transition-colors cursor-pointer"
                    >
                      + {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ô Input và Nút Rút thẻ */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <label htmlFor="emotion-input" className="sr-only">
                  Cảm xúc hôm nay
                </label>
                <input
                  id="emotion-input"
                  type="text"
                  value={emotionInput}
                  onChange={(e) => setEmotionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDrawCard()
                  }}
                  placeholder="VD: Mình đang thấy hơi mông lung và phân vân trước quyết định mới..."
                  className="w-full px-4 py-3 rounded-2xl border border-lavender-mist text-xs sm:text-sm text-deep-navy placeholder:text-deep-navy/70 focus:border-bright-magenta focus:ring-2 focus:ring-bright-magenta/20 focus:outline-none transition-all bg-warm-ivory/50 focus:bg-white"
                />

                <button
                  type="button"
                  disabled={isDrawing}
                  onClick={handleDrawCard}
                  aria-label="Rút ngẫu nhiên một thẻ"
                  className="w-full sm:w-auto shrink-0 px-6 py-3 rounded-2xl bg-bright-magenta hover:bg-bright-magenta/90 text-white text-xs sm:text-sm font-semibold transition-all shadow-soft-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isDrawing ? 'Đang lắng nghe...' : '✨ Rút thẻ'}</span>
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
                <span>Quay lại hướng dẫn</span>
              </Link>
              <span className="font-quote italic text-bright-magenta">
                Mỗi cảm xúc đều xứng đáng được lắng nghe ♡
              </span>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* BƯỚC 2: MÀN HÌNH KẾT QUẢ (CARD FLIP 3D + KHỐI E2) */}
        {/* ==================================================== */}
        {step === 'result' && selectedCard && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn flex flex-col items-center text-center font-ui">
            {/* Header Kết quả: Lời lắng nghe vỗ về */}
            <div className="space-y-1.5 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-butter-cream/60 text-deep-navy text-xs font-semibold">
                <span>Mình đã lắng nghe bạn 💛</span>
              </div>

              <p className="text-xs sm:text-sm text-deep-navy/80 font-medium leading-relaxed">
                {emotionInput.trim() ? (
                  <>
                    Bạn đang chia sẻ về:{' '}
                    <strong className="text-bright-magenta">&ldquo;{emotionInput}&rdquo;</strong>
                  </>
                ) : (
                  'Bạn đã dành cho mình một khoảng lặng dịu êm để đón nhận thông điệp ♡'
                )}
              </p>

              <span className="text-[11px] text-deep-navy/70 block">
                (Chạm vào thẻ hoặc bấm nút Lật thẻ để đọc câu hỏi suy ngẫm)
              </span>
            </div>

            {/* Thẻ lật 3D */}
            <EQCardFlip
              card={selectedCard}
              isFlipped={isFlipped}
              onToggleFlip={() => setIsFlipped((prev) => !prev)}
              totalPublishedCards={allCards.length || 26}
            />

            {/* Thao tác dưới thẻ */}
            <div className="space-y-3 pt-2 w-full max-w-sm">
              <div className="flex items-center justify-center gap-3">
                {/* Nút Lật thẻ */}
                <button
                  type="button"
                  onClick={() => setIsFlipped((prev) => !prev)}
                  aria-label={isFlipped ? 'Lật về mặt trước' : 'Lật thẻ sang mặt sau'}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-deep-navy to-bright-magenta hover:from-bright-magenta hover:to-accent-pink text-white text-xs sm:text-sm font-semibold transition-all shadow-soft-md active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>{isFlipped ? 'Mặt trước' : 'Lật thẻ'}</span>
                </button>

                {/* Nút Rút thẻ khác */}
                <button
                  type="button"
                  disabled={isDrawing}
                  onClick={handleDrawCard}
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-soft-pink/30 border border-lavender-mist hover:border-bright-magenta text-deep-navy hover:text-bright-magenta text-xs sm:text-sm font-semibold transition-all shadow-soft-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4 text-bright-magenta" />
                  <span>Rút thẻ khác</span>
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
                  <span>👁️ Xem tất cả thẻ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('draw')}
                  className="text-deep-navy/70 hover:text-deep-navy transition-colors cursor-pointer"
                >
                  Đổi cảm xúc khác
                </button>
              </div>
            </div>

            {/* ================================================== */}
            {/* KHỐI MỚI E2: GHI SUY NGẪM · LƯU THẺ · CHIA SẺ */}
            {/* ================================================== */}
            <div className="w-full max-w-md p-5 sm:p-6 rounded-3xl bg-white border border-lavender-mist shadow-soft-md space-y-4 text-left font-ui mt-4">
              <div className="border-b border-lavender-mist pb-2">
                <h4 className="font-semibold text-sm text-deep-navy flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-bright-magenta" />
                  <span>Ghi suy ngẫm · Lưu giữ khoảnh khắc</span>
                </h4>
                <p className="text-[11px] text-deep-navy/60 mt-0.5">
                  Ghi lại suy ngẫm từ 3 câu hỏi mặt sau để lưu vào hành trình phát triển bản thân.
                </p>
              </div>

              <div className="space-y-1.5">
                <textarea
                  rows={3}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Viết suy ngẫm của bạn về thông điệp này..."
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
                    <span>Đang lưu...</span>
                  ) : reflectionSavedMessage ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{reflectionSavedMessage}</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Lưu thẻ & Suy ngẫm</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    title="Sao chép link thẻ"
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
                    title="Tải ảnh 4:5"
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-lavender-mist text-deep-navy/70 hover:text-bright-magenta hover:border-bright-magenta text-[11px] font-semibold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>4:5</span>
                  </a>

                  <a
                    href={`/eq-buddy/the/${selectedCard.qrSlug}/anh/9x16`}
                    download
                    title="Tải ảnh 9:16"
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-lavender-mist text-deep-navy/70 hover:text-bright-magenta hover:border-bright-magenta text-[11px] font-semibold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>9:16</span>
                  </a>
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
                  {/* a11y-contrast-ok: SVG icon trang trí */}
                  <BookOpen className="w-3.5 h-3.5 text-accent-pink" />
                  <span>Bộ sưu tập 26 thông điệp</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl text-deep-navy uppercase">
                  Tất cả thẻ Trạm Dừng
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setStep('result')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-soft-pink/40 border border-lavender-mist text-deep-navy text-xs font-semibold flex items-center gap-1.5 transition-all shadow-soft-md cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại thẻ</span>
              </button>
            </div>

            <p className="text-xs text-deep-navy/70">
              Bấm vào bất kỳ thẻ nào để mở lời gợi mở chi tiết và thực hành suy ngẫm:
            </p>

            {/* Grid thẻ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
              {allCards.map((card) => {
                const isCurrent = selectedCard?.id === card.id
                const isCardUnlocked = isUnlockedAll || isFreeMode || Boolean(card.message)

                return (
                  <div
                    key={card.id}
                    onClick={() => handleSelectSpecificCard(card)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group hover:shadow-soft-md ${
                      isCurrent
                        ? 'bg-soft-pink/50 border-bright-magenta ring-2 ring-bright-magenta/20'
                        : 'bg-white hover:bg-warm-ivory border-lavender-mist'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-deep-navy/70 mb-2">
                      <span className="font-bold">
                        THẺ #{String(card.code || card.order || card.id).padStart(2, '0')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-soft-pink text-bright-magenta font-semibold">
                        {card.keywordVi || 'Việt'}
                      </span>
                    </div>

                    <h4 className="font-display text-xl text-deep-navy group-hover:text-bright-magenta transition-colors">
                      {card.keywordEn || card.code}
                    </h4>

                    {isCardUnlocked && card.message ? (
                      <p className="font-quote text-xs text-deep-navy/80 italic mt-1.5 line-clamp-2 leading-relaxed">
                        &ldquo;{card.message}&rdquo;
                      </p>
                    ) : (
                      <p className="font-ui text-xs text-deep-navy/70 italic mt-1.5">
                        {isUnlockedAll || isFreeMode
                          ? 'Chạm để mở thẻ'
                          : 'Dùng thử hoặc mua để mở trọn vẹn'}
                      </p>
                    )}

                    <div className="mt-3 pt-2 border-t border-deep-navy/5 flex items-center justify-between text-[10px] text-bright-magenta font-semibold">
                      <span>{isCardUnlocked ? 'Xem & Lật 3D' : 'Mở khóa thẻ'}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
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
                <span>Quay lại</span>
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
        quote={guideModalQuote}
      />
    </div>
  )
}
