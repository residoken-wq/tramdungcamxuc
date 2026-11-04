'use client'

import React from 'react'
import { Sparkles, RotateCw, Quote } from 'lucide-react'
import type { PublicEqCard } from '@/lib/eq/cards.server'
import { vi } from '@/lib/i18n/vi'

export interface EQCardFlipProps {
  card: PublicEqCard
  isFlipped: boolean
  onToggleFlip: () => void
  totalPublishedCards?: number
}

export function EQCardFlip({
  card,
  isFlipped,
  onToggleFlip,
  totalPublishedCards = 26,
}: EQCardFlipProps) {
  const gradientTheme = card.gradientTheme || 'from-[#FDE6F6] via-[#FAF7F4] to-[#E9DDF9]'
  const cardNum = String(card.code || card.order || card.id).padStart(2, '0')
  const keywordVi = card.keywordVi || 'Việt'

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleFlip()
    }
  }

  const prompts = [
    { label: vi.dp01eq.recallLabel, text: card.promptRecall },
    { label: vi.dp01eq.packLabel, text: card.promptPack },
    { label: vi.dp01eq.acknowledgeLabel, text: card.promptAcknowledge },
  ].filter((p) => Boolean(p.text))

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${vi.dp01eq.cardIndexAria} ${cardNum}: ${card.keywordEn || ''}. ${isFlipped ? 'Đang ở mặt sau' : 'Đang ở mặt trước'}. Bấm để lật.`}
      onClick={onToggleFlip}
      onKeyDown={handleKeyDown}
      className="perspective-1000 w-[290px] h-[400px] sm:w-[330px] sm:h-[450px] cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-bright-magenta rounded-3xl"
    >
      <div
        className={`relative w-full h-full rounded-3xl preserve-3d transition-transform duration-700 shadow-xl ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* =================== MẶT TRƯỚC =================== */}
        <div
          className={`absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-7 bg-gradient-to-br ${gradientTheme} border-2 border-lavender-mist backface-hidden flex flex-col justify-between shadow-soft-md`}
        >
          {/* Viền chỉ đôi sang trọng */}
          <div className="absolute inset-2.5 rounded-2xl border border-deep-navy/10 pointer-events-none" />

          {/* Top thẻ */}
          <div className="flex items-center justify-between text-deep-navy/60 text-[10px] uppercase font-bold tracking-widest relative z-10 font-ui">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-bright-magenta" />
              <span>
                {vi.dp01eq.cardIndexPrefix} {cardNum} / {totalPublishedCards}
              </span>
            </span>
            {card.category && (
              <span className="font-semibold text-bright-magenta bg-soft-pink px-2 py-0.5 rounded-full">
                {card.category}
              </span>
            )}
          </div>

          {/* Giữa: Keyword & Lời trích dẫn */}
          <div className="space-y-4 my-auto relative z-10 text-center">
            <div className="space-y-1">
              <h2 className="font-display text-3xl sm:text-4xl text-deep-navy uppercase tracking-wider">
                {card.keywordEn || card.code}
              </h2>
              <span className="text-xs uppercase tracking-widest text-bright-magenta font-semibold block font-ui">
                • {keywordVi} •
              </span>
            </div>

            {/* Front Quote */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white/60 border border-white/80 shadow-soft-md backdrop-blur-sm">
              <Quote className="w-4 h-4 text-bright-magenta mb-1 mx-auto" />
              <p className="font-quote italic text-sm sm:text-base text-deep-navy leading-relaxed">
                &ldquo;{card.message}&rdquo;
              </p>
            </div>
          </div>

          {/* Bottom thẻ */}
          <div className="flex items-center justify-between text-[10px] text-deep-navy/70 relative z-10 border-t border-deep-navy/5 pt-2 font-ui">
            <span className="font-quote italic text-bright-magenta">
              {vi.dp01eq.brandSignature}
            </span>
            <span className="flex items-center gap-1 font-medium group-hover:text-bright-magenta transition-colors">
              <span>{vi.dp01eq.touchToFlip}</span>
              <RotateCw className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* =================== MẶT SAU (LẬT 180 ĐỘ) =================== */}
        <div className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-warm-ivory via-white to-soft-pink border-2 border-bright-magenta/40 backface-hidden rotate-y-180 flex flex-col justify-between shadow-soft-md text-left">
          {/* Viền mảnh */}
          <div className="absolute inset-2.5 rounded-2xl border border-bright-magenta/15 pointer-events-none" />

          {/* Top mặt sau */}
          <div className="flex items-center justify-between text-deep-navy/70 text-[10px] uppercase font-bold tracking-widest relative z-10 font-ui">
            <span className="text-bright-magenta flex items-center gap-1">
              <RotateCw className="w-3 h-3" />
              <span>{vi.dp01eq.reflectionPromptHeading}</span>
            </span>
            <span className="text-deep-navy/70 font-bold">
              #{cardNum} • {card.keywordEn || card.code}
            </span>
          </div>

          {/* Danh sách 3 câu hỏi Reflection */}
          <div className="space-y-2 my-auto relative z-10 overflow-y-auto max-h-[290px] pr-0.5 font-ui">
            <span className="text-[10px] sm:text-[11px] text-deep-navy/60 font-semibold uppercase tracking-wider block">
              {vi.dp01eq.gentleReflectionIntro}
            </span>

            <div className="space-y-1.5 sm:space-y-2">
              {prompts.map((p, pIdx) => (
                <div
                  key={pIdx}
                  className="p-2 sm:p-2.5 rounded-xl bg-warm-ivory/80 border border-lavender-mist space-y-0.5"
                >
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-soft-pink text-bright-magenta flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                      {pIdx + 1}
                    </span>
                    <p className="text-[11px] sm:text-xs text-deep-navy/90 leading-snug font-medium">
                      <strong className="text-bright-magenta font-semibold mr-1">{p.label}:</strong>
                      {p.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom mặt sau */}
          <div className="text-[11px] text-deep-navy/70 text-center relative z-10 border-t border-deep-navy/5 pt-2">
            <span className="font-quote italic text-bright-magenta font-semibold block">
              {vi.dp01eq.pauseReturnQuote}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
