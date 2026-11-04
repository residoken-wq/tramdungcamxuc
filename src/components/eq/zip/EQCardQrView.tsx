'use client'

import React, { useState } from 'react'
import { RotateCw, Sparkles, Heart } from 'lucide-react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { PublicEqCard } from '@/lib/eq/cards.server'
import { EQCardFlip } from './EQCardFlip'
import { isRichTextEmpty } from '@/lib/legal'

export interface EQCardQrViewProps {
  card: PublicEqCard
  children?: React.ReactNode
}

export function EQCardQrView({ card, children }: EQCardQrViewProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const hasStory = Boolean(card.story && !isRichTextEmpty(card.story))
  const hasSmallAction = Boolean(card.smallAction?.trim())

  return (
    <div className="w-full flex flex-col items-center space-y-8">
      {/* Visual 3D Flip Card */}
      <div className="flex flex-col items-center">
        <EQCardFlip
          card={card}
          isFlipped={isFlipped}
          onToggleFlip={() => setIsFlipped((prev) => !prev)}
        />

        <button
          type="button"
          onClick={() => setIsFlipped((prev) => !prev)}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-soft-pink text-bright-magenta font-ui text-xs font-bold hover:bg-bright-magenta hover:text-white transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>
            {isFlipped ? 'Xem mặt trước (Lời trích dẫn)' : 'Xem mặt sau (3 câu hỏi suy ngẫm)'}
          </span>
        </button>
      </div>

      {/* Hành động nhỏ nếu có */}
      {hasSmallAction && (
        <div className="w-full max-w-xl p-5 rounded-2xl bg-butter-cream/40 border border-butter-cream shadow-soft">
          <div className="flex items-center gap-2 mb-2 text-deep-navy font-ui text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-bright-magenta" />
            <span>Hành động nhỏ hôm nay</span>
          </div>
          <p className="font-sans text-sm sm:text-base text-deep-navy/90 leading-relaxed font-medium">
            {card.smallAction}
          </p>
        </div>
      )}

      {/* Câu chuyện nếu có */}
      {hasStory && (
        <div className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-warm-ivory border border-lavender-mist shadow-soft space-y-3">
          <div className="flex items-center gap-2 text-deep-navy font-ui text-xs font-bold uppercase tracking-wider">
            {/* a11y-contrast-ok: SVG icon trang trí */}
            <Heart className="w-4 h-4 text-accent-pink" />
            <span>Câu chuyện phía sau thẻ</span>
          </div>
          <div className="prose prose-purple max-w-none font-sans text-sm sm:text-base text-deep-navy/85 leading-relaxed">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <RichText data={card.story as any} />
          </div>
        </div>
      )}

      {/* Children (Lưu thẻ & Rút thêm một thẻ) */}
      {children && <div className="w-full max-w-xl">{children}</div>}
    </div>
  )
}
