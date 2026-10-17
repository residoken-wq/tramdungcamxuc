import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { PublicEqCard } from '@/lib/eq/cards.server'
import { HeartLine } from '@/components/brand/HeartLine'
import { isRichTextEmpty } from '@/lib/legal'
import { vi } from '@/lib/i18n/vi'

export interface EqCardFaceProps {
  card: PublicEqCard
  face?: 'front' | 'back' | 'both'
  className?: string
  headingLevel?: 'h1' | 'h2'
  children?: React.ReactNode
}

export function EqCardFace({
  card,
  face = 'both',
  className = '',
  headingLevel,
  children,
}: EqCardFaceProps) {
  const showFront = face === 'front' || face === 'both'
  const showBack = face === 'back' || face === 'both'

  const HeadingTag = headingLevel || (face === 'both' ? 'h1' : 'h2')

  const hasStory = Boolean(card.story && !isRichTextEmpty(card.story))
  const prompts: { label: string; text: string | null }[] = [
    { label: vi.eqBuddy.cardPage.promptRecall, text: card.promptRecall },
    { label: vi.eqBuddy.cardPage.promptPack, text: card.promptPack },
    { label: vi.eqBuddy.cardPage.promptAcknowledge, text: card.promptAcknowledge },
  ].filter((p) => Boolean(p.text?.trim()))

  const hasSmallAction = Boolean(card.smallAction?.trim())

  return (
    <article
      className={`rounded-3xl bg-warm-ivory border border-lavender-mist shadow-soft p-6 sm:p-10 md:p-12 ${className}`.trim()}
    >
      {/* Front: series badge + keyword + message */}
      {showFront && (
        <div className="flex flex-col items-center">
          {/* Nhãn Series & Mã thẻ */}
          <div className="text-center mb-6">
            <span className="inline-block px-3.5 py-1 rounded-full bg-soft-pink text-bright-magenta font-ui text-xs sm:text-sm font-bold uppercase tracking-wider">
              {vi.eqBuddy.cardPage.seriesLabel(card.code)}
            </span>
          </div>

          {/* Keyword */}
          {card.keywordEn && (
            <HeadingTag className="text-center font-display text-4xl sm:text-5xl text-bright-magenta tracking-wide">
              {card.keywordEn}
            </HeadingTag>
          )}

          {/* Message */}
          {card.message && (
            <div className="text-center my-6 sm:my-8 px-2 sm:px-4">
              <blockquote className="font-quote italic text-2xl sm:text-3xl md:text-4xl text-deep-navy leading-relaxed sm:leading-relaxed">
                {card.message}
              </blockquote>
            </div>
          )}
        </div>
      )}

      {/* HeartLine divider between front and back when showing both */}
      {/* a11y-contrast-ok: SVG trang trí HeartLine trên mặt thẻ EQ */}
      {face === 'both' && (
        <div
          className="flex items-center justify-center my-8 text-accent-pink/40"
          aria-hidden="true"
        >
          <HeartLine width={80} height={28} />
        </div>
      )}

      {/* Back: series label (if back only), 3 prompts, small action, story */}
      {showBack && (
        <div>
          {face === 'back' && (
            <div className="text-center mb-6">
              <span className="inline-block px-3.5 py-1 rounded-full bg-soft-pink text-bright-magenta font-ui text-xs sm:text-sm font-bold uppercase tracking-wider">
                {vi.eqBuddy.cardPage.seriesLabel(card.code)}
              </span>
            </div>
          )}

          {/* The three printed prompts */}
          {prompts.length > 0 && (
            <section
              aria-label={vi.eqBuddy.cardPage.promptsHeading}
              className={face === 'both' ? 'border-t border-deep-navy/10 pt-8 mt-8' : ''}
            >
              <h2 className="font-ui text-sm sm:text-base font-bold text-bright-magenta uppercase tracking-wider mb-6">
                {vi.eqBuddy.cardPage.promptsHeading}
              </h2>
              <dl className="space-y-6">
                {prompts.map((p) => (
                  <div key={p.label}>
                    <dt className="font-ui text-base font-bold text-deep-navy">{p.label}</dt>
                    <dd className="mt-1 font-sans text-base sm:text-lg text-deep-navy/85 leading-relaxed">
                      {p.text}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Hành động nhỏ nếu có */}
          {hasSmallAction && (
            <section
              aria-label={vi.eqBuddy.cardPage.smallActionHeading}
              className="border-t border-deep-navy/10 pt-8 mt-8 space-y-3"
            >
              <h2 className="font-ui text-sm sm:text-base font-bold text-bright-magenta uppercase tracking-wider mb-2">
                {vi.eqBuddy.cardPage.smallActionHeading}
              </h2>
              <p className="font-sans text-base sm:text-lg text-deep-navy/85 leading-relaxed">
                {card.smallAction}
              </p>
            </section>
          )}

          {/* Câu chuyện của thẻ */}
          {hasStory && (
            <section
              aria-label={vi.eqBuddy.cardPage.storyHeading}
              className="border-t border-deep-navy/10 pt-8 mt-8 space-y-4"
            >
              <h2 className="font-ui text-sm sm:text-base font-bold text-bright-magenta uppercase tracking-wider mb-4">
                {vi.eqBuddy.cardPage.storyHeading}
              </h2>
              <div className="font-ui text-base sm:text-lg text-deep-navy/85 leading-relaxed space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <RichText data={card.story as any} />
              </div>
            </section>
          )}
        </div>
      )}

      {/* Children slot (e.g. share slot, CTA buttons) */}
      {children}
    </article>
  )
}
