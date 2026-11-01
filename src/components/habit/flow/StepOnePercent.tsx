'use client'

import React from 'react'
import { OnePercentSection } from '@/components/habit/OnePercentSection'
import { OnePercentSlider } from '@/components/habit/OnePercentSlider'
import { isRichTextEmpty } from '@/lib/legal'
import { vi } from '@/lib/i18n/vi'
import type {
  CleanHabitOnePercent,
  CleanStepQuote,
  CleanTitledText,
} from '@/lib/habit/journey-content.server'

export interface StepOnePercentProps {
  onePercent?: CleanHabitOnePercent | null
  unknowns?: CleanTitledText[]
  quote?: CleanStepQuote | null
}

export function StepOnePercent({ onePercent, unknowns, quote }: StepOnePercentProps) {
  const hasCmsTitle = Boolean(onePercent?.title?.trim())
  const hasCmsIntro = Boolean(onePercent?.intro && !isRichTextEmpty(onePercent.intro))
  const hasCmsSection = hasCmsTitle || hasCmsIntro

  const hasUnknowns = Array.isArray(unknowns) && unknowns.length > 0
  const hasClosing = Boolean(onePercent?.closing?.trim())
  const hasUnknownsBlock = hasUnknowns || hasClosing

  return (
    <div className="space-y-6 animate-fade-in">
      {!hasCmsTitle && (
        <div>
          <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
            {vi.hb16.steps.onePercent.title}
          </h2>
          <p className="text-sm sm:text-base text-deep-navy/80">
            {vi.hb16.steps.onePercent.subtitle}
          </p>
        </div>
      )}

      <OnePercentSection onePercent={onePercent} className="!px-0 !pt-0 !pb-0" />

      {!hasCmsSection && (
        <OnePercentSlider dailyPercent={onePercent?.dailyPercent} maxDays={onePercent?.maxDays} />
      )}

      {/* HB-18: 3 điều có thể bạn chưa biết về 1% Better + câu kết */}
      {hasUnknownsBlock && (
        <section
          data-testid="one-percent-unknowns"
          aria-label={vi.hb18.onePercent.unknownsTitle}
          className="rounded-2xl bg-warm-ivory border border-deep-navy/10 p-5 sm:p-6 space-y-4"
        >
          <h3 className="font-display text-lg sm:text-xl text-deep-navy tracking-wide">
            {vi.hb18.onePercent.unknownsTitle}
          </h3>

          {hasUnknowns && (
            <ol className="space-y-3.5">
              {unknowns.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-soft-pink border border-bright-magenta/20 text-bright-magenta font-ui font-bold text-xs flex items-center justify-center mt-0.5 select-none"
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-ui font-semibold text-deep-navy text-sm sm:text-base leading-snug">
                      {item.title}
                    </h4>
                    {item.body && (
                      <p className="font-ui text-xs sm:text-sm text-deep-navy/80 leading-relaxed">
                        {item.body}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {hasClosing && (
            <div
              data-testid="one-percent-closing"
              className="pt-3 border-t border-deep-navy/10 font-quote italic text-sm sm:text-base text-deep-navy/90 text-center sm:text-left leading-relaxed"
            >
              &ldquo;{onePercent?.closing}&rdquo;
            </div>
          )}
        </section>
      )}

      {/* HB-18: Câu trích dẫn bước 2 (nếu có nguồn hợp lệ) */}
      {quote && quote.text && (
        <blockquote
          data-testid="one-percent-quote"
          className="rounded-2xl bg-lavender-mist/40 border border-lavender-mist p-4 sm:p-5 space-y-2"
        >
          <p className="font-quote italic text-base sm:text-lg text-deep-navy leading-relaxed">
            &ldquo;{quote.text}&rdquo;
          </p>
          <footer className="font-ui text-xs sm:text-sm text-deep-navy/80 font-medium">
            <span>— {quote.author}</span>
            <span> · </span>
            {quote.sourceUrl ? (
              <a
                href={quote.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-bright-magenta focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bright-magenta rounded"
              >
                {quote.source}
              </a>
            ) : (
              <span>{quote.source}</span>
            )}
          </footer>
        </blockquote>
      )}
    </div>
  )
}
