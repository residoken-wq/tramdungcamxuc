'use client'

import React, { useState, useSyncExternalStore } from 'react'
import type { PublicEqCard, PublicEqCardKeyword } from '@/lib/eq/cards.server'
import { drawEqCardAction } from '@/lib/eq/actions'
import { EqCardFace } from '@/components/eq/EqCardFace'
import { Button } from '@/components/ui/Button'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'

export interface EqDrawWizardProps {
  keywords: PublicEqCardKeyword[]
  initialCard?: PublicEqCard | null
  initialStep?: 1 | 2 | 3 | 4 | 5 | 'paywall'
  /** Server-rendered ToolPaywall (trial / buy by the customer's status). */
  paywall: React.ReactNode
}

export function EqDrawWizard({
  keywords,
  initialCard = null,
  initialStep = 1,
  paywall,
}: EqDrawWizardProps) {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 'paywall'>(initialStep)
  const [feeling, setFeeling] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentCard, setCurrentCard] = useState<PublicEqCard | null>(initialCard)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reflection, setReflection] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleDraw = async (mode: 'random' | 'keyword', qrSlug?: string) => {
    setIsDrawing(true)
    setError(null)

    try {
      const res = await drawEqCardAction(
        mode === 'keyword' && qrSlug
          ? { mode: 'keyword', qrSlug }
          : { mode: 'random', previousCardCode: currentCard?.code },
      )

      if (!res.success) {
        if (res.code === 'PAYWALL') {
          setCurrentStep('paywall')
          return
        }
        setError(res.message || vi.eqBuddy.draw.errors.generalError)
        return
      }

      setCurrentCard(res.card)
      setIsFlipped(false)
      setReflection('')
      setCurrentStep(2)

      // Ghi nhận sự kiện phân tích (chỉ gửi cardCode, mode, topic; không gửi cảm xúc hay ghi chú)
      track('card_drawn', {
        cardCode: res.card.code,
        mode: res.mode,
        topic: res.card.topic || undefined,
      })
    } catch {
      setError(vi.eqBuddy.draw.errors.generalError)
    } finally {
      setIsDrawing(false)
    }
  }

  // Paywall (rendered on the server with the customer's current status)
  if (currentStep === 'paywall') {
    return <>{paywall}</>
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-accent-pink/10 border border-accent-pink/30 text-accent-pink text-sm font-sans text-center">
          {error}
        </div>
      )}

      {/* BƯỚC 1: CHỌN CÁCH RÚT THẺ */}
      {currentStep === 1 && (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy">
              {vi.eqBuddy.draw.step1.title}
            </h2>
            <p className="font-sans text-sm text-deep-navy/70">{vi.eqBuddy.draw.subheading}</p>
          </div>

          {/* Ô cảm xúc tự do (chỉ lưu state trên máy) */}
          <div className="bg-warm-ivory rounded-3xl border border-lavender-mist p-6 shadow-soft space-y-3">
            <label
              htmlFor="feeling-input"
              className="block font-ui text-sm font-bold text-deep-navy"
            >
              {vi.eqBuddy.draw.step1.feelingLabel}
            </label>
            <textarea
              id="feeling-input"
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              placeholder={vi.eqBuddy.draw.step1.feelingPlaceholder}
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-warm-ivory border border-deep-navy/15 text-deep-navy font-sans text-sm focus:outline-none focus:ring-2 focus:ring-bright-magenta/50"
            />
          </div>

          {/* Lựa chọn A: Rút ngẫu nhiên */}
          <div className="text-center pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => handleDraw('random')}
              disabled={!isHydrated || isDrawing}
              className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all motion-reduce:transition-none"
            >
              {isDrawing ? vi.eqBuddy.draw.step1.drawingButton : vi.eqBuddy.draw.step1.randomButton}
            </Button>
          </div>

          {/* Lựa chọn B: Lưới 26 từ khóa A–Z */}
          {keywords.length > 0 && (
            <div className="pt-6 border-t border-deep-navy/10 space-y-4">
              <h3 className="text-center font-ui text-sm font-bold text-bright-magenta uppercase tracking-wider">
                {vi.eqBuddy.draw.step1.orKeyword}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                {keywords.map((kw) => (
                  <button
                    key={kw.code}
                    type="button"
                    onClick={() => handleDraw('keyword', kw.qrSlug)}
                    disabled={!isHydrated || isDrawing}
                    className="p-3 rounded-2xl bg-warm-ivory border border-deep-navy/15 hover:border-bright-magenta hover:bg-soft-pink/40 text-center transition-all motion-reduce:transition-none group focus:outline-none focus:ring-2 focus:ring-bright-magenta disabled:opacity-50"
                  >
                    <span className="block font-ui text-[11px] font-bold text-bright-magenta/70 uppercase">
                      {kw.code}
                    </span>
                    <span className="block font-display text-lg sm:text-xl text-deep-navy group-hover:text-bright-magenta transition-colors mt-0.5">
                      {kw.keywordEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BƯỚC 2 & 3: MẶT TRƯỚC / LẬT SANG MẶT SAU (CSS 3D FLIP) */}
      {(currentStep === 2 || currentStep === 3) && currentCard && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy">
              {!isFlipped ? vi.eqBuddy.draw.step2.title : vi.eqBuddy.draw.step3.title}
            </h2>
            {!isFlipped && (
              <p className="font-sans text-xs sm:text-sm text-deep-navy/70">
                {vi.eqBuddy.draw.step2.hint}
              </p>
            )}
          </div>

          {/* Khung thẻ 3D */}
          <div className="relative w-full max-w-2xl mx-auto" style={{ perspective: 1200 }}>
            <div
              className="relative w-full transition-transform duration-700 motion-reduce:transition-none motion-reduce:transform-none"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Mặt trước */}
              <div
                className={
                  isFlipped ? 'invisible pointer-events-none absolute inset-0' : 'relative'
                }
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <EqCardFace card={currentCard} face="front" />
              </div>

              {/* Mặt sau */}
              <div
                className={
                  !isFlipped ? 'invisible pointer-events-none absolute inset-0' : 'relative'
                }
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <EqCardFace card={currentCard} face="back" />
              </div>
            </div>
          </div>

          {/* Điều hướng giữa bước 2 và bước 3 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {!isFlipped ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  setIsFlipped(true)
                  setCurrentStep(3)
                }}
                disabled={!isHydrated}
                className="w-full sm:w-auto shadow-md"
              >
                {vi.eqBuddy.draw.step2.flipButton}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setIsFlipped(false)
                    setCurrentStep(2)
                  }}
                  disabled={!isHydrated}
                  className="w-full sm:w-auto"
                >
                  ← {vi.eqBuddy.draw.step2.title}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setCurrentStep(4)}
                  disabled={!isHydrated}
                  className="w-full sm:w-auto shadow-md"
                >
                  {vi.eqBuddy.draw.step3.continueButton} →
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* BƯỚC 4: SUY NGẪM */}
      {currentStep === 4 && currentCard && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy">
              {vi.eqBuddy.draw.step4.title}
            </h2>
            <p className="font-sans text-xs text-deep-navy/60">
              {vi.eqBuddy.draw.step4.localOnlyNotice}
            </p>
          </div>

          {/* Tóm tắt ngắn gọn thẻ đang xem */}
          <div className="p-4 rounded-2xl bg-soft-pink/50 border border-lavender-mist flex items-center justify-between">
            <div>
              <span className="font-ui text-xs font-bold text-bright-magenta uppercase">
                {currentCard.code}
              </span>
              <p className="font-display text-xl text-deep-navy">{currentCard.keywordEn}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFlipped(true)
                setCurrentStep(3)
              }}
              className="font-ui text-xs font-semibold text-deep-navy/70 hover:text-bright-magenta underline transition-colors"
            >
              {vi.eqBuddy.draw.step4.backToQuestions}
            </button>
          </div>

          {/* Ô nhập suy ngẫm */}
          <div className="bg-warm-ivory rounded-3xl border border-lavender-mist p-6 sm:p-8 shadow-soft space-y-3">
            <label
              htmlFor="reflection-input"
              className="block font-ui text-sm font-bold text-deep-navy"
            >
              {vi.eqBuddy.draw.step4.reflectionLabel}
            </label>
            <textarea
              id="reflection-input"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder={vi.eqBuddy.draw.step4.reflectionPlaceholder}
              rows={5}
              className="w-full px-4 py-3 rounded-2xl bg-warm-ivory border border-deep-navy/15 text-deep-navy font-sans text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-bright-magenta/50"
            />
            <p className="font-sans text-xs text-deep-navy/60 italic pt-1">
              * {vi.eqBuddy.draw.step4.localOnlyNotice}
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setCurrentStep(5)}
              disabled={!isHydrated}
              className="w-full sm:w-auto shadow-md"
            >
              {vi.eqBuddy.draw.step4.nextButton} →
            </Button>
          </div>
        </div>
      )}

      {/* BƯỚC 5: ĐỒNG HÀNH TIẾP THEO */}
      {currentStep === 5 && currentCard && (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy">
              {vi.eqBuddy.draw.step5.title}
            </h2>
            <p className="font-display text-2xl sm:text-3xl text-bright-magenta">
              {currentCard.keywordEn} · {currentCard.code}
            </p>
          </div>

          {/* Các nút điều hướng */}
          <div className="bg-warm-ivory rounded-3xl border border-lavender-mist p-6 sm:p-8 shadow-soft space-y-5 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Nút rút thẻ khác */}
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => handleDraw('random')}
                disabled={!isHydrated || isDrawing}
                className="w-full sm:w-auto shadow-md"
              >
                {isDrawing
                  ? vi.eqBuddy.draw.step1.drawingButton
                  : vi.eqBuddy.draw.step5.drawAnotherButton}
              </Button>

              {/* Nút mở trang thẻ QR vĩnh viễn */}
              <Button
                href={`/eq-buddy/the/${encodeURIComponent(currentCard.qrSlug)}`}
                variant="secondary"
                size="md"
                className="w-full sm:w-auto"
              >
                {vi.eqBuddy.draw.step5.openCardPageButton} ↗
              </Button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="font-ui text-xs text-deep-navy/70 hover:text-bright-magenta font-semibold underline transition-colors"
              >
                {vi.eqBuddy.draw.step1.orKeyword}
              </button>
            </div>
          </div>

          {/* Chỗ gắn khối chia sẻ / offer (T3-05 làm sau) */}
          <div id="eq-draw-share-slot" className="empty:hidden" />
        </div>
      )}
    </div>
  )
}
