'use client'

import React, { useEffect } from 'react'
import { BookOpen, X, Wind, Sparkles, Compass } from 'lucide-react'
import { vi } from '@/lib/i18n/vi'

export interface GuideModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  quote?: string
  buttonText?: string
  step1Title?: string
  step1Desc?: string
  step2Title?: string
  step2Desc?: string
  step3Title?: string
  step3Desc?: string
  onConfirm?: () => void
}

export function GuideModal({
  isOpen,
  onClose,
  title = vi.au02.guideModalTitle,
  quote = vi.au02.guideModalQuote,
  buttonText = vi.au02.guideModalButton,
  step1Title = vi.au02.step1Title,
  step1Desc = vi.au02.step1Desc,
  step2Title = vi.au02.step2Title,
  step2Desc = vi.au02.step2Desc,
  step3Title = vi.au02.step3Title,
  step3Desc = vi.au02.step3Desc,
  onConfirm,
}: GuideModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleAction = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl p-5 sm:p-7 border border-lavender-mist shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-lavender-mist pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-deep-navy to-bright-magenta text-white flex items-center justify-center shadow-soft-md">
              <BookOpen className="w-4 h-4 text-soft-pink" />
            </div>
            <div>
              <h3
                id="guide-modal-title"
                className="font-display text-base sm:text-lg text-deep-navy uppercase"
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={vi.dp01eq.closeGuideAria}
            className="w-8 h-8 rounded-full bg-warm-ivory hover:bg-soft-pink text-deep-navy/60 hover:text-deep-navy flex items-center justify-center transition-colors border border-lavender-mist cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 3 Bước theo rà soát của Hana */}
        <div className="space-y-3 text-left font-ui">
          {/* Bước 1: Gọi tên mong muốn và cảm xúc */}
          <div className="p-3.5 rounded-2xl bg-warm-ivory border border-lavender-mist flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-mint-haze text-deep-navy flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              <Wind className="w-4 h-4 text-deep-navy" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint-haze text-deep-navy">
                  1
                </span>
                <h4 className="font-semibold text-xs sm:text-sm text-deep-navy">
                  {step1Title}
                </h4>
              </div>
              <p className="text-xs text-deep-navy/75 leading-relaxed pt-1">
                {step1Desc}
              </p>
            </div>
          </div>

          {/* Bước 2: Chọn thông điệp */}
          <div className="p-3.5 rounded-2xl bg-warm-ivory border border-lavender-mist flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-soft-pink text-bright-magenta flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-bright-magenta" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-soft-pink text-bright-magenta">
                  2
                </span>
                <h4 className="font-semibold text-xs sm:text-sm text-deep-navy">
                  {step2Title}
                </h4>
              </div>
              <p className="text-xs text-deep-navy/75 leading-relaxed pt-1">
                {step2Desc}
              </p>
            </div>
          </div>

          {/* Bước 3: Khám phá */}
          <div className="p-3.5 rounded-2xl bg-warm-ivory border border-lavender-mist flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-butter-cream text-deep-navy flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              <Compass className="w-4 h-4 text-deep-navy" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-butter-cream text-deep-navy">
                  3
                </span>
                <h4 className="font-semibold text-xs sm:text-sm text-deep-navy">
                  {step3Title}
                </h4>
              </div>
              <p className="text-xs text-deep-navy/75 leading-relaxed pt-1">
                {step3Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Câu nghiêng truyền cảm hứng */}
        <div className="p-3.5 rounded-2xl bg-soft-pink/40 border border-soft-pink text-center">
          <p className="font-quote italic text-xs sm:text-sm text-bright-magenta leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
        </div>

        {/* Modal Footer: Nút Trải nghiệm */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAction}
            className="w-full sm:w-auto px-7 py-2.5 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white text-xs sm:text-sm font-semibold shadow-soft-md transition-all active:scale-95 cursor-pointer font-ui"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}
