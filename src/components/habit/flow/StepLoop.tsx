'use client'

import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { vi } from '@/lib/i18n/vi'
import { HABIT_STAGES, type HabitChosenTechnique, type PublicTechnique } from '@/lib/habit'
import type { HabitStage } from '@/lib/diagnostic'
import type { CleanHabitLoop, CleanStepQuote } from '@/lib/habit/journey-content.server'
import { isRichTextEmpty } from '@/lib/legal'
import { safeHref } from '@/lib/safe-href'

type RichTextData = React.ComponentProps<typeof RichText>['data']

export interface StepLoopProps {
  techniques: PublicTechnique[]
  chosenTechniques: Record<HabitStage, HabitChosenTechnique[]>
  onToggleTechnique: (stage: HabitStage, techId: number, defaultName: string) => void
  onUpdateTechniqueAction: (stage: HabitStage, techId: number, action: string) => void
  loop?: CleanHabitLoop | null
  quote?: CleanStepQuote | null
  error?: string | null
}

export function StepLoop({
  techniques,
  chosenTechniques,
  onToggleTechnique,
  onUpdateTechniqueAction,
  loop,
  quote,
}: StepLoopProps) {
  const hasIntro = Boolean(loop?.intro && !isRichTextEmpty(loop.intro))
  const hasStages = Array.isArray(loop?.stages) && loop.stages.length > 0
  const hasNote = Boolean(loop?.note?.trim())
  const hasRules = Array.isArray(loop?.rules) && loop.rules.length > 0
  const hasQuote = Boolean(quote?.text?.trim())

  const hasExplanation = hasIntro || hasStages || hasNote || hasRules || hasQuote

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tiêu đề chính của Bước 5 */}
      <div>
        <h2 className="font-display text-xl sm:text-2xl text-deep-navy mb-1">
          {vi.hb21.stepTitle}
        </h2>
        <p className="text-sm sm:text-base text-deep-navy/80">{vi.hb21.stepSubtitle}</p>
      </div>

      {/* PHẦN 1: GIẢI THÍCH TỪ CMS (ẩn nếu CMS rỗng) */}
      {hasExplanation && (
        <section
          aria-label={vi.hb21.explanation.heading}
          className="space-y-6 pt-2 pb-4 border-b border-lavender-mist/70"
          data-testid="loop-explanation-section"
        >
          {/* loop.intro (Lexical RichText) */}
          {hasIntro && (
            <div
              data-testid="loop-intro"
              className="font-ui text-sm sm:text-base text-deep-navy/85 leading-relaxed space-y-3"
            >
              <RichText data={loop!.intro as RichTextData} />
            </div>
          )}

          {/* 4 Thẻ giai đoạn từ CMS kèm mũi tên vòng lặp */}
          {hasStages && (
            <div className="space-y-3" data-testid="loop-stages-container">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base sm:text-lg text-deep-navy">
                  {vi.hb21.explanation.heading}
                </h3>
                <span className="text-xs font-medium text-bright-magenta flex items-center gap-1">
                  <span>↻</span>
                  <span className="hidden sm:inline">{vi.hb21.explanation.cycleHint}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                {loop!.stages.map((stageItem, index) => {
                  const stageKey = stageItem.stage
                  const stageBadge =
                    vi.hb21.explanation.stages[stageKey]?.badge || `Giai đoạn ${index + 1}`

                  return (
                    <div
                      key={stageItem.stage}
                      data-testid={`loop-stage-card-${stageItem.stage}`}
                      className="p-4 rounded-xl bg-white border border-lavender-mist shadow-xs flex flex-col justify-between relative group hover:border-bright-magenta/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-soft-pink text-deep-navy">
                            {stageBadge}
                          </span>
                          {/* Loop arrow to next stage */}
                          <span
                            aria-hidden="true"
                            className="text-xs text-bright-magenta font-bold flex items-center gap-1"
                          >
                            {index < loop!.stages.length - 1 ? '→' : '↻'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-deep-navy text-sm sm:text-base mb-1.5">
                          {stageItem.title}
                        </h4>
                        <p className="text-xs text-deep-navy/75 leading-relaxed">
                          {stageItem.explanation}
                        </p>
                      </div>

                      {/* SVG Mũi tên dẫn dòng chảy ở mobile */}
                      {index < loop!.stages.length - 1 && (
                        <div className="sm:hidden flex justify-center pt-2 text-bright-magenta/60">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* loop.note (Ghi chú hai giai đoạn đầu) */}
          {hasNote && (
            <div
              data-testid="loop-note"
              className="p-4 rounded-xl bg-butter-cream/40 border border-butter-cream/80 flex items-start gap-3 text-xs sm:text-sm text-deep-navy"
            >
              <span className="text-base select-none" aria-hidden="true">
                💡
              </span>
              <p className="leading-relaxed font-medium">{loop!.note}</p>
            </div>
          )}

          {/* loop.rules (4 quy tắc vàng thay đổi hành vi) */}
          {hasRules && (
            <div className="space-y-3" data-testid="loop-rules-container">
              <h3 className="font-display text-base sm:text-lg text-deep-navy">
                {vi.hb21.rules.heading}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loop!.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    data-testid={`loop-rule-card-${idx}`}
                    className="p-3.5 rounded-xl bg-white/90 border border-lavender-mist/80 hover:border-bright-magenta/30 transition-colors"
                  >
                    <h4 className="font-semibold text-deep-navy text-sm mb-1">{rule.title}</h4>
                    {rule.body && (
                      <p className="text-xs text-deep-navy/75 leading-relaxed">{rule.body}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* stepQuotes.loop (Câu trích dẫn) */}
          {hasQuote && (
            <blockquote
              data-testid="loop-quote"
              className="rounded-2xl bg-lavender-mist/40 border border-lavender-mist p-4 sm:p-5 space-y-2"
            >
              <p className="font-quote italic text-base sm:text-lg text-deep-navy leading-relaxed">
                &ldquo;{quote!.text}&rdquo;
              </p>
              <footer className="font-ui text-xs sm:text-sm text-deep-navy/80 font-medium">
                <span>— {quote!.author}</span>
                <span> · </span>
                {quote!.sourceUrl && safeHref(quote!.sourceUrl) ? (
                  <a
                    href={safeHref(quote!.sourceUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-bright-magenta focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bright-magenta rounded"
                  >
                    {quote!.source}
                  </a>
                ) : (
                  <span>{quote!.source}</span>
                )}
              </footer>
            </blockquote>
          )}
        </section>
      )}

      {/* PHẦN 2: ĐÁNH DẤU KỸ THUẬT THEO 4 GIAI ĐOẠN */}
      <section aria-label={vi.hb21.techniques.heading} className="space-y-6">
        <div>
          <h3 className="font-display text-lg sm:text-xl text-deep-navy mb-1">
            {vi.hb21.techniques.heading}
          </h3>
          <p className="text-xs sm:text-sm text-deep-navy/75">
            {loop?.techniqueHint || vi.hb21.techniques.defaultHint}
          </p>
          <p className="text-xs text-bright-magenta font-medium mt-1">
            {vi.hb21.techniques.maxPerStageNotice}
          </p>
        </div>

        {/* 4 Giai đoạn kỹ thuật */}
        {HABIT_STAGES.map((stage) => {
          const stageInfo = vi.habit.wizard.step3.stages[stage]
          const stageTechniques = techniques.filter((t) => t.stage === stage)
          const currentChosen = chosenTechniques[stage] || []
          const isStageMax = currentChosen.length >= 2

          return (
            <div
              key={stage}
              className="p-5 rounded-card bg-warm-ivory border border-lavender-mist space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="font-semibold text-deep-navy text-base">{stageInfo.title}</h4>
                  <span className="text-xs text-bright-magenta font-medium block">
                    {stageInfo.rule}
                  </span>
                </div>
                <span className="text-xs font-semibold text-deep-navy/70">
                  {vi.hb21.techniques.selectedCount(currentChosen.length)}
                </span>
              </div>
              <p className="text-xs text-deep-navy/70">{stageInfo.desc}</p>

              {/* Danh sách kỹ thuật thuộc giai đoạn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {stageTechniques.length === 0 ? (
                  <p className="col-span-full py-4 text-center text-xs text-deep-navy/60 italic">
                    {vi.habit.wizard.step3.emptyTechniquesList}
                  </p>
                ) : (
                  stageTechniques.map((tech) => {
                    const isSelected = currentChosen.some((item) => item.techniqueId === tech.id)
                    const chosenItem = currentChosen.find((item) => item.techniqueId === tech.id)
                    const isDisabled = !isSelected && isStageMax
                    const safeVideoUrl = tech.exampleVideoUrl
                      ? safeHref(tech.exampleVideoUrl)
                      : null

                    return (
                      <div
                        key={tech.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-white border-bright-magenta ring-1 ring-bright-magenta shadow-soft'
                            : isDisabled
                              ? 'bg-white/40 border-lavender-mist/60 opacity-60'
                              : 'bg-white/80 border-lavender-mist hover:border-accent-pink/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <label
                            className={`flex items-start gap-2.5 flex-1 ${
                              isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => onToggleTechnique(stage, tech.id, tech.name)}
                              aria-label={tech.name}
                              className="mt-1 w-4 h-4 rounded text-bright-magenta focus:ring-bright-magenta disabled:cursor-not-allowed"
                            />
                            <span className="text-sm font-medium text-deep-navy">{tech.name}</span>
                          </label>

                          {/* Link xem ví dụ video (mở tab mới, safeHref) */}
                          {safeVideoUrl && (
                            <a
                              href={safeVideoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-[11px] font-semibold text-bright-magenta hover:underline inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-soft-pink/50 hover:bg-soft-pink"
                            >
                              <span>{vi.hb21.techniques.viewExampleVideo}</span>
                              <span aria-hidden="true">↗</span>
                            </a>
                          )}
                        </div>

                        {/* Ô nhập hành động cụ thể nếu được chọn */}
                        {isSelected && chosenItem && (
                          <div className="mt-3 pt-2.5 border-t border-lavender-mist/50">
                            <label className="block text-xs font-semibold text-deep-navy mb-1">
                              {vi.hb21.techniques.actionLabel}
                            </label>
                            <input
                              type="text"
                              value={chosenItem.action}
                              onChange={(e) =>
                                onUpdateTechniqueAction(stage, tech.id, e.target.value)
                              }
                              placeholder={vi.hb21.techniques.actionPlaceholder}
                              className="w-full px-3 py-1.5 text-xs rounded border border-lavender-mist text-deep-navy bg-white focus:outline-none focus:ring-1 focus:ring-bright-magenta"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
