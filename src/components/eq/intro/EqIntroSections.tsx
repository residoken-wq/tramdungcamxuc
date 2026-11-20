'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Compass,
  Heart,
  Layers,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'
import type { EqIntroView } from '@/lib/eq/intro-view'
import { GuideStepsList, resolveGuideCopy } from '@/components/eq/zip/GuideModal'

/**
 * BX-08b: parts of the /eq-buddy intro. The coded page (`EQBuddyIntro`) composes them with the
 * default options; the "EQ Buddy" builder blocks expose the options. Defaults keep the coded HTML.
 */

export const EQ_DRAW_HREF = '/eq-buddy/rut-the'

export type EqFrameBg = 'warm-ivory' | 'white' | 'soft-pink' | 'lavender-mist'
export type EqAlign = 'auto' | 'center' | 'left'

const FRAME_BG: Record<EqFrameBg, string> = {
  'warm-ivory': 'bg-warm-ivory',
  white: 'bg-white',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
}

/** The rounded card that holds the intro on the coded page. */
export function EqFrame({
  bg = 'warm-ivory',
  children,
}: {
  bg?: EqFrameBg
  children?: React.ReactNode
}) {
  return (
    <div
      className={`w-full max-w-3xl mx-auto ${FRAME_BG[bg] ?? FRAME_BG['warm-ivory']} rounded-2xl sm:rounded-3xl border border-lavender-mist p-4 sm:p-6 md:p-8 shadow-soft-md transition-all relative`}
    >
      {children}
    </div>
  )
}

export function EqSeriesBar({
  view,
  showGuideButton = true,
  onGuide,
}: {
  view: EqIntroView
  showGuideButton?: boolean
  onGuide?: () => void
}) {
  const { tagline, quoteTop } = view
  return (
    <div className="flex items-center justify-between border-b border-lavender-mist pb-3 sm:pb-4 mb-4 sm:mb-6 font-ui">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {tagline && (
          <>
            <span className="w-2 h-2 rounded-full bg-bright-magenta animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-deep-navy/70">
              {tagline}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showGuideButton && (
          <button
            type="button"
            onClick={onGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soft-pink hover:bg-bright-magenta hover:text-white text-bright-magenta text-xs font-semibold border border-bright-magenta/30 shadow-soft-md transition-all active:scale-95 group cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-bright-magenta group-hover:text-white transition-colors" />
            <span>📖 {vi.dp01eq.guide}</span>
          </button>
        )}

        {quoteTop && (
          <span className="font-quote italic text-sm sm:text-base md:text-lg text-bright-magenta font-semibold tracking-wide hidden sm:inline">
            {quoteTop}
          </span>
        )}
      </div>
    </div>
  )
}

const ALIGN_CLASS: Record<EqAlign, string> = {
  auto: 'text-center sm:text-left',
  center: 'text-center',
  left: 'text-left',
}

export function EqIntroHeader({ view, align = 'auto' }: { view: EqIntroView; align?: EqAlign }) {
  const { badge, mainTitle, subtitle } = view
  if (!badge && !mainTitle && !subtitle) return null
  return (
    <div className={`space-y-3 mb-6 ${ALIGN_CLASS[align] ?? ALIGN_CLASS.auto} font-ui`}>
      {badge && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soft-pink text-bright-magenta text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-bright-magenta" />
          <span>{badge}</span>
        </div>
      )}

      {mainTitle && (
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide text-deep-navy">
          {mainTitle}
        </h1>
      )}

      {subtitle && (
        <p className="text-sm sm:text-base text-deep-navy/80 font-medium leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}

const CARD_ICONS = [
  {
    box: 'bg-soft-pink text-bright-magenta',
    icon: <Heart className="w-4 h-4 text-bright-magenta" />,
  },
  { box: 'bg-mint-haze text-deep-navy', icon: <Compass className="w-4 h-4 text-deep-navy" /> },
  { box: 'bg-butter-cream text-deep-navy', icon: <Users className="w-4 h-4 text-deep-navy" /> },
  { box: 'bg-lavender-mist text-deep-navy', icon: <Layers className="w-4 h-4 text-deep-navy" /> },
] as const

const WHAT_IS_COLUMNS: Record<1 | 2 | 4, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

/** "Bộ thẻ là gì": heading + up to 4 info cards. Renders nothing when the global leaves it empty. */
export function EqWhatIsContent({
  view,
  columns = 2,
  showIcons = true,
}: {
  view: EqIntroView
  columns?: 1 | 2 | 4
  showIcons?: boolean
}) {
  const { intro1Heading, intro1Description, cards } = view
  return (
    <>
      {intro1Heading && (
        <div className="border-l-4 border-bright-magenta pl-3 text-left">
          <h3 className="font-display text-lg sm:text-xl text-deep-navy uppercase">
            {intro1Heading}
          </h3>
          {intro1Description && (
            <p className="text-xs text-deep-navy/60 font-medium">{intro1Description}</p>
          )}
        </div>
      )}

      <div
        className={`grid ${WHAT_IS_COLUMNS[columns] ?? WHAT_IS_COLUMNS[2]} gap-3.5 sm:gap-4 text-left`}
      >
        {cards.map((card, i) =>
          card.title ? (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-lavender-mist shadow-soft-md space-y-2.5"
            >
              {showIcons && (
                <div
                  className={`w-8 h-8 rounded-xl ${CARD_ICONS[i].box} flex items-center justify-center font-bold`}
                >
                  {CARD_ICONS[i].icon}
                </div>
              )}
              <h4 className="font-semibold text-sm sm:text-base text-deep-navy">{card.title}</h4>
              {card.desc && (
                <p className="text-xs sm:text-[13px] text-deep-navy/70 leading-relaxed">
                  {card.desc}
                </p>
              )}
            </div>
          ) : null,
        )}
      </div>
    </>
  )
}

export type EqDrawVariant = 'large' | 'compact'

/**
 * Draw button (→ /eq-buddy/rut-the, where trial / entitlement rules apply) + guide button.
 * `compact` is the look under "Bộ thẻ là gì", `large` the look when that part is empty.
 */
export function EqDrawActions({
  variant = 'large',
  showGuideButton = true,
  onGuide,
}: {
  variant?: EqDrawVariant
  showGuideButton?: boolean
  onGuide?: () => void
}) {
  const justify = showGuideButton ? 'justify-between' : 'justify-center'
  if (variant === 'compact') {
    return (
      <div
        className={`pt-3 flex flex-col sm:flex-row items-center ${justify} gap-3 border-t border-lavender-mist`}
      >
        {showGuideButton && (
          <button
            type="button"
            onClick={onGuide}
            className="text-xs text-deep-navy/70 hover:text-deep-navy underline underline-offset-4 transition-colors cursor-pointer"
          >
            📖 {vi.dp01eq.guide}
          </button>
        )}

        <Link
          href={EQ_DRAW_HREF}
          className="w-full sm:w-auto px-7 py-3 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-semibold text-sm shadow-soft-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
        >
          <span>✨ {vi.au02.drawNow}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    )
  }
  return (
    <div
      className={`pt-4 sm:pt-6 flex flex-col sm:flex-row items-center ${justify} gap-4 border-t border-lavender-mist font-ui`}
    >
      {showGuideButton && (
        <button
          type="button"
          onClick={onGuide}
          className="w-full sm:w-auto px-5 py-3 rounded-full bg-white hover:bg-soft-pink/40 border border-lavender-mist hover:border-bright-magenta text-deep-navy text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-soft-md cursor-pointer order-2 sm:order-1"
        >
          <BookOpen className="w-4 h-4 text-bright-magenta" />
          <span>📖 {vi.dp01eq.guide}</span>
        </button>
      )}

      <Link
        href={EQ_DRAW_HREF}
        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white font-semibold text-sm sm:text-base shadow-soft-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group order-1 sm:order-2"
      >
        <span>✨ {vi.au02.drawNow}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}

/** Shopee button for the physical card deck (UTM + `external_clicked`, AGENTS §8.3). */
export function EqShopeeLink({ view }: { view: EqIntroView }) {
  const { shopeeUrl } = view
  if (!shopeeUrl) return null
  return (
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
  )
}

/** The 3-step guide shown directly on the page (builder option instead of the modal). */
export function EqGuideInline({ view }: { view: EqIntroView }) {
  const copy = resolveGuideCopy(view.guide)
  const { effectiveTitle, effectiveQuote, showStep1, showStep2, showStep3 } = copy
  if (!effectiveTitle && !effectiveQuote && !showStep1 && !showStep2 && !showStep3) return null
  return (
    <div className="space-y-4 font-ui">
      {effectiveTitle && (
        <h2 className="font-display text-lg sm:text-xl text-deep-navy uppercase">
          {effectiveTitle}
        </h2>
      )}
      {(showStep1 || showStep2 || showStep3) && (
        <div className="space-y-3 text-left">
          <GuideStepsList copy={copy} />
        </div>
      )}
      {effectiveQuote && (
        <div className="p-3.5 rounded-2xl bg-soft-pink/40 border border-soft-pink text-center">
          <p className="font-quote italic text-xs sm:text-sm text-bright-magenta leading-relaxed">
            &ldquo;{effectiveQuote}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
