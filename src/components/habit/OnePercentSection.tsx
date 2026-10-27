import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { OnePercentSlider } from './OnePercentSlider'
import { isRichTextEmpty } from '@/lib/legal'
import { vi } from '@/lib/i18n/vi'
import type { CleanHabitOnePercent } from '@/lib/habit/journey-content.server'

export interface OnePercentSectionProps {
  onePercent?: CleanHabitOnePercent | null
  className?: string
}

export function OnePercentSection({ onePercent, className = '' }: OnePercentSectionProps) {
  if (!onePercent) {
    return null
  }

  const rawTitle = onePercent.title?.trim() || ''
  const hasTitle = rawTitle.length > 0
  const hasIntro = Boolean(onePercent.intro && !isRichTextEmpty(onePercent.intro))

  // Ẩn toàn bộ khối khi cả title và intro đều rỗng (Hana chưa nhập nội dung)
  if (!hasTitle && !hasIntro) {
    return null
  }

  // Tách tiêu đề 2 tầng qua ký tự '|' theo quy ước brand
  let line1 = rawTitle
  let line2: string | undefined = undefined

  if (rawTitle.includes('|')) {
    const parts = rawTitle.split('|')
    line1 = parts[0]?.trim() || ''
    line2 = parts.slice(1).join('|').trim() || undefined
  }

  const hasFacts = Array.isArray(onePercent.facts) && onePercent.facts.length > 0

  return (
    <section
      aria-label={rawTitle || vi.hb07.onePercent.label}
      data-testid="one-percent-section"
      className={`w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-2 ${className}`}
    >
      {/* Tiêu đề 2 tầng chuẩn Brand Book */}
      {hasTitle && (
        <SectionHeader
          titleLine1={line1}
          titleLine2={line2}
          as="h2"
          align="center"
          className="mb-4 sm:mb-6 text-center"
        />
      )}

      {/* Giới thiệu Lexical rich text */}
      {hasIntro && onePercent.intro && (
        <div
          data-testid="one-percent-intro"
          className="font-ui text-base text-deep-navy/85 leading-relaxed space-y-3 mb-6 sm:mb-8 max-w-2xl mx-auto text-center"
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <RichText data={onePercent.intro as any} />
        </div>
      )}

      {/* Thanh kéo trực quan & so sánh kết quả */}
      <OnePercentSlider dailyPercent={onePercent.dailyPercent} maxDays={onePercent.maxDays} />

      {/* Danh sách số liệu dẫn chứng có nguồn kiểm chứng */}
      {hasFacts && (
        <div data-testid="one-percent-facts" className="mt-6 pt-5 border-t border-deep-navy/10">
          <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/60 mb-3">
            {vi.hb08.factsHeading}
          </h3>
          <ul className="space-y-2">
            {onePercent.facts.map((fact, idx) => (
              <li
                key={fact.id || idx}
                className="font-ui text-xs sm:text-sm text-deep-navy/80 flex items-start gap-2"
              >
                <span className="text-bright-magenta font-bold leading-tight select-none">•</span>
                <span className="leading-relaxed">
                  <span>{fact.statement}</span>{' '}
                  <span className="text-deep-navy/60 font-medium">
                    ({vi.hb08.sourcePrefix}:{' '}
                    {fact.sourceUrl ? (
                      <a
                        href={fact.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-pink underline hover:text-bright-magenta focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-pink rounded-sm"
                      >
                        {fact.sourceLabel}
                      </a>
                    ) : (
                      <span>{fact.sourceLabel}</span>
                    )}
                    )
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
