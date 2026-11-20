import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { PriceTag } from '@/components/ui/PriceTag'
import { vi } from '@/lib/i18n/vi'
import { HABIT_LOOP_PATH } from '@/lib/habit'
import type { OfferBg, OfferView } from '@/lib/habit/offer-view'
import type {
  TitleHighlightAnimation,
  TitleHighlightStyle,
} from '@/components/ui/TwoToneTitle'

/**
 * BX-08: the six sections of the product offer page. The coded page (`HabitOfferClient`) and the
 * builder blocks of the "Trang sản phẩm" group render these same components, so a builder page
 * looks exactly like the coded one. Default props reproduce the coded page's HTML.
 */

/** Section backgrounds offered to the builder (Brand Book palette + white). */
export type OfferSectionBg =
  | OfferBg
  | 'soft-pink'
  | 'lavender-mist'
  | 'mint-haze'
  | 'butter-cream'

const SECTION_BG: Record<OfferSectionBg, string> = {
  'warm-ivory': 'bg-warm-ivory',
  white: 'bg-white',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
}

/** Card / tile background that contrasts with the section background. */
const cardBgFor = (bg: OfferSectionBg) => (bg === 'warm-ivory' ? 'bg-white' : 'bg-warm-ivory')

const PRIMARY_CTA_CLASS =
  'inline-flex items-center justify-center px-8 py-4 rounded-full bg-accent-pink text-white font-bold text-[19px] tracking-tight shadow-soft hover:bg-bright-magenta transition-colors'

export type OfferSecondaryButton =
  | { kind: 'habitLoop' }
  | { kind: 'none' }
  | { kind: 'custom'; label: string; href: string }

function PrimaryCta({ cta }: { cta: OfferView['cta'] }) {
  if (!cta) return null
  return cta.external ? (
    <a href={cta.href} target="_blank" rel="noopener noreferrer" className={PRIMARY_CTA_CLASS}>
      {cta.label} →
    </a>
  ) : (
    <Link href={cta.href} className={PRIMARY_CTA_CLASS}>
      {cta.label} →
    </Link>
  )
}

function SecondaryCta({
  button,
  className,
}: {
  button: OfferSecondaryButton
  className: string
}) {
  if (button.kind === 'none') return null
  if (button.kind === 'custom') {
    if (!button.label || !button.href) return null
    return (
      <Link href={button.href} className={className}>
        {button.label}
      </Link>
    )
  }
  return (
    <Link href={HABIT_LOOP_PATH} className={className}>
      {vi.habit.offer.habitLoopCta}
    </Link>
  )
}

// ---------------------------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------------------------

export interface OfferHeroProps {
  view: OfferView
  /** Image next to the hero (cover image of the product); 'none' = coded page layout. */
  imagePosition?: 'none' | 'left' | 'right'
  align?: 'center' | 'left'
  showPrice?: boolean
  showIncludes?: boolean
  /** Main buy / trial button (off e.g. for a free resource whose page holds the form). */
  showPrimaryCta?: boolean
  secondaryButton?: OfferSecondaryButton
  bg?: OfferSectionBg
  titleHighlightStyle?: TitleHighlightStyle
  titleHighlightAnimation?: TitleHighlightAnimation
  /** Builder slot "Thêm phần tử" under the buttons. */
  children?: React.ReactNode
}

export function OfferHero({
  view,
  imagePosition = 'none',
  align = 'center',
  showPrice = true,
  showIncludes = true,
  showPrimaryCta = true,
  secondaryButton = { kind: 'habitLoop' },
  bg = 'warm-ivory',
  titleHighlightStyle,
  titleHighlightAnimation,
  children,
}: OfferHeroProps) {
  const image = view.coverImage?.url ? view.coverImage : null
  const withImage = imagePosition !== 'none' && Boolean(image)
  const isLeft = align === 'left'

  const card = (
    <div
      className={`bg-white rounded-card shadow-soft border border-lavender-mist/80 p-6 sm:p-10 ${
        withImage || isLeft ? 'w-full' : 'max-w-2xl mx-auto'
      } ${isLeft ? 'text-left' : 'text-center'}`}
    >
      {view.trialDays !== null && (
        <div className="inline-block px-4 py-1.5 rounded-full bg-soft-pink text-deep-navy text-xs sm:text-sm font-semibold mb-4">
          ✨ {view.trialDays} {vi.product.trialBadge}
        </div>
      )}

      {showPrice && view.hasPrice && (
        <div className={`flex items-center ${isLeft ? 'justify-start' : 'justify-center'} mb-3`}>
          <PriceTag
            originalPrice={view.pricing.price}
            salePrice={view.pricing.salePrice}
            size="lg"
          />
        </div>
      )}

      {showPrice && view.hasPrice && (view.isLifetime || view.trialDays !== null) && (
        <p className="text-xs sm:text-sm text-deep-navy/70 mb-6 font-medium">
          {[
            view.isLifetime ? vi.habit.offer.permanentAccess : null,
            view.trialDays !== null ? vi.habit.offer.noCreditCard : null,
          ]
            .filter(Boolean)
            .join(' • ')}
        </p>
      )}

      {showIncludes && view.show.includes && (
        <div className="mb-6 text-left border-t border-b border-lavender-mist/40 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-deep-navy/70 mb-2 font-ui">
            {view.includesHeading}
          </p>
          <ul className="space-y-2">
            {view.includes.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-deep-navy/90">
                <span className="text-bright-magenta font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`flex flex-col sm:flex-row gap-3 ${isLeft ? 'justify-start' : 'justify-center'}`}>
        {showPrimaryCta && <PrimaryCta cta={view.cta} />}
        <SecondaryCta
          button={secondaryButton}
          className="inline-flex items-center justify-center px-6 py-4 rounded-full bg-lavender-mist/60 text-deep-navy font-semibold text-base hover:bg-soft-pink transition-colors"
        />
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  )

  const header = (
    <SectionHeader
      seriesLabel={view.seriesLabel ?? undefined}
      titleLine1={view.titleLine1 ?? ''}
      titleLine2={view.titleLine2 ?? undefined}
      emotionLine={view.emotionLine ?? undefined}
      titleHighlightStyle={titleHighlightStyle}
      titleHighlightAnimation={titleHighlightAnimation}
      as="h1"
      className="mb-8"
    />
  )

  if (!withImage || !image) {
    return (
      <section className={`py-12 sm:py-20 ${SECTION_BG[bg]} border-b border-lavender-mist/40`}>
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 ${isLeft ? 'text-left' : 'text-center'}`}>
          {header}
          {card}
        </div>
      </section>
    )
  }

  return (
    <section className={`py-12 sm:py-20 ${SECTION_BG[bg]} border-b border-lavender-mist/40`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className={`${imagePosition === 'right' ? 'lg:order-1' : 'lg:order-2'} ${isLeft ? 'text-left' : 'text-center'}`}>
          {header}
          {card}
        </div>
        <div
          className={`${imagePosition === 'right' ? 'lg:order-2' : 'lg:order-1'} relative w-full aspect-[4/3] overflow-hidden rounded-card border border-deep-navy/10 shadow-soft bg-lavender-mist`}
        >
          <Image
            src={image.url as string}
            alt={image.alt || view.product?.name || ''}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// 2. Stats bar
// ---------------------------------------------------------------------------------------------

export type OfferStatKey = 'videos' | 'techniques' | 'days' | 'units'
export const OFFER_STAT_KEYS: readonly OfferStatKey[] = ['videos', 'techniques', 'days', 'units']

export interface OfferStatsProps {
  view: OfferView
  bg?: OfferSectionBg
  /** Which stats to show, in this order (default: all four, coded-page order). */
  items?: readonly OfferStatKey[]
  /** Columns on phones (the coded page uses 2). */
  mobileColumns?: 1 | 2
}

export function OfferStats({
  view,
  bg = 'white',
  items = OFFER_STAT_KEYS,
  mobileColumns = 2,
}: OfferStatsProps) {
  const tile = cardBgFor(bg)
  const cells: Record<OfferStatKey, { value: number; label: string } | null> = {
    // DB counts: no lesson / technique yet → hide that tile
    videos: view.videoCount > 0 ? { value: view.videoCount, label: vi.habit.offer.stats.videos } : null,
    techniques:
      view.techniqueCount > 0
        ? { value: view.techniqueCount, label: vi.habit.offer.stats.techniques }
        : null,
    days: { value: view.journeyDays, label: vi.habit.offer.stats.tracker(view.journeyDays) },
    units: { value: view.curriculumModules.length, label: view.curriculumUnitStatLabel },
  }
  const shown = items.map((key) => ({ key, cell: cells[key] })).filter((x) => x.cell !== null)
  if (shown.length === 0) return null

  return (
    <section className={`py-8 ${SECTION_BG[bg]} border-b border-lavender-mist/40`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div
          className={`grid ${mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-4 gap-4 text-center`}
        >
          {shown.map(({ key, cell }) => (
            <div key={key} className={`p-4 rounded-xl ${tile}`}>
              <span className="font-display text-2xl sm:text-3xl text-bright-magenta block mb-1">
                {cell!.value}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-deep-navy">{cell!.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// 3. Curriculum
// ---------------------------------------------------------------------------------------------

export type OfferListLayout = 'list' | 'grid-2' | 'grid-3'

const LIST_LAYOUT: Record<OfferListLayout, string> = {
  list: 'space-y-4',
  'grid-2': 'grid grid-cols-1 md:grid-cols-2 gap-4',
  'grid-3': 'grid grid-cols-1 md:grid-cols-3 gap-4',
}

function SectionIntro({ heading, subheading }: { heading: string | null; subheading: string | null }) {
  if (!heading && !subheading) return null
  return (
    <div className="text-center mb-10">
      {heading && <h2 className="font-display text-2xl sm:text-3xl text-deep-navy mb-2">{heading}</h2>}
      {subheading && <p className="text-sm sm:text-base text-deep-navy/70">{subheading}</p>}
    </div>
  )
}

export interface OfferCurriculumProps {
  view: OfferView
  bg?: OfferSectionBg
  layout?: OfferListLayout
  numbered?: boolean
}

export function OfferCurriculum({
  view,
  bg = 'warm-ivory',
  layout = 'list',
  numbered = true,
}: OfferCurriculumProps) {
  if (view.curriculumModules.length === 0) return null
  return (
    <section
      className={`py-12 sm:py-16 ${SECTION_BG[bg]}${bg === 'warm-ivory' ? '' : ' border-b border-lavender-mist/40'}`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <SectionIntro heading={view.curriculumHeading} subheading={view.curriculumSubheading} />
        <div className={LIST_LAYOUT[layout]}>
          {view.curriculumModules.map((mod, index) => (
            <div
              key={index}
              className={`${cardBgFor(bg)} rounded-card p-6 border border-lavender-mist shadow-soft flex items-start gap-4`}
            >
              {numbered && (
                <div className="w-10 h-10 rounded-full bg-soft-pink text-deep-navy font-bold flex items-center justify-center shrink-0 text-sm">
                  {index + 1 < 10 ? `0${index + 1}` : index + 1}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-base sm:text-lg text-deep-navy mb-1">{mod.title}</h3>
                {mod.desc && <p className="text-sm text-deep-navy/70 leading-relaxed">{mod.desc}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// 4. Why different
// ---------------------------------------------------------------------------------------------

export interface OfferFeaturesProps {
  view: OfferView
  bg?: OfferSectionBg
  layout?: OfferListLayout
  showIcon?: boolean
}

export function OfferFeatures({
  view,
  bg = 'white',
  layout = 'grid-3',
  showIcon = true,
}: OfferFeaturesProps) {
  if (view.featureItems.length === 0) return null
  const grid =
    layout === 'grid-3' ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : LIST_LAYOUT[layout]
  return (
    <section className={`py-12 sm:py-16 ${SECTION_BG[bg]} border-t border-lavender-mist/40`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <SectionIntro heading={view.featuresHeading} subheading={view.featuresSubheading} />
        <div className={grid}>
          {view.featureItems.map((feat, index) => (
            <div
              key={index}
              className={`p-6 rounded-card ${
                bg === 'white' ? 'bg-warm-ivory' : 'bg-white shadow-soft'
              } border border-lavender-mist text-left`}
            >
              {showIcon && (
                <span className="w-8 h-8 rounded-full bg-mint-haze text-deep-navy flex items-center justify-center font-bold text-sm mb-4">
                  ✓
                </span>
              )}
              <h3 className="font-semibold text-deep-navy text-base mb-2">{feat.title}</h3>
              {feat.desc && <p className="text-sm text-deep-navy/70 leading-relaxed">{feat.desc}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// 5. FAQ
// ---------------------------------------------------------------------------------------------

export interface OfferFaqProps {
  view: OfferView
  bg?: OfferSectionBg
  columns?: 1 | 2
}

export function OfferFaq({ view, bg = 'warm-ivory', columns = 1 }: OfferFaqProps) {
  if (view.faq.length === 0) return null
  return (
    <section
      className={`py-12 sm:py-16 ${SECTION_BG[bg]}${bg === 'warm-ivory' ? '' : ' border-t border-lavender-mist/40'}`}
    >
      <div className={`${columns === 2 ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6`}>
        <h2 className="font-display text-2xl sm:text-3xl text-deep-navy text-center mb-8">
          {vi.habit.offer.faq.heading}
        </h2>
        <div className={columns === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
          {view.faq.map((item, index) => (
            <div
              key={index}
              className={`${cardBgFor(bg)} rounded-card p-6 border border-lavender-mist shadow-soft`}
            >
              <h3 className="font-semibold text-deep-navy text-base mb-2">{item.question}</h3>
              {item.answer && <p className="text-sm text-deep-navy/80 leading-relaxed">{item.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// 6. Bottom call to action
// ---------------------------------------------------------------------------------------------

export interface OfferBottomProps {
  view: OfferView
  /** 'gradient' = brand gradient of the coded page. */
  bg?: 'gradient' | OfferSectionBg
  secondaryButton?: OfferSecondaryButton
  /** Builder slot "Thêm phần tử" under the buttons. */
  children?: React.ReactNode
}

export function OfferBottom({
  view,
  bg = 'gradient',
  secondaryButton = { kind: 'habitLoop' },
  children,
}: OfferBottomProps) {
  if (!view.bottomTitle && !view.bottomDescription && !view.cta) return null
  const bgClass = bg === 'gradient' ? 'bg-brand-gradient' : SECTION_BG[bg]
  return (
    <section className={`py-16 ${bgClass} border-t border-lavender-mist`}>
      <div className="max-w-2xl mx-auto px-4 text-center">
        {view.bottomTitle && (
          <h2 className="font-display text-3xl sm:text-4xl text-deep-navy mb-4">{view.bottomTitle}</h2>
        )}
        {view.bottomDescription && (
          <p className="text-base text-deep-navy/80 mb-8 max-w-lg mx-auto">{view.bottomDescription}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <PrimaryCta cta={view.cta} />
          <SecondaryCta
            button={secondaryButton}
            className="inline-flex items-center justify-center px-6 py-4 rounded-full bg-white text-deep-navy font-semibold text-base hover:bg-soft-pink transition-colors border border-lavender-mist"
          />
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  )
}
