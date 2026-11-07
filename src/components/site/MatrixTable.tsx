import React from 'react'
import { TwoToneTitle } from '@/components/ui/TwoToneTitle'

export type MatrixTableVariant = 'grid' | 'list'

export interface MatrixColumn {
  label: string
  color?: 'butter-cream' | 'soft-pink' | 'mint-haze' | 'lavender-mist' | 'warm-ivory' | 'deep-navy'
}

export interface MatrixCell {
  title?: string
  text?: string
}

export interface MatrixRow {
  label: string
  cells?: MatrixCell[]
  text?: string
  color?: 'butter-cream' | 'soft-pink' | 'mint-haze' | 'lavender-mist' | 'warm-ivory' | 'deep-navy'
  hasAccentBar?: boolean
}

export interface MatrixChip {
  label: string
}

export interface MatrixTableProps {
  version?: number
  variant?: MatrixTableVariant
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  chipsTitle?: string
  chips?: MatrixChip[]
  columns?: MatrixColumn[]
  rows?: MatrixRow[]
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-12 px-6 sm:px-8',
  lg: 'py-16 px-6 sm:px-12',
} as const

const TONE_BG: Record<string, string> = {
  'butter-cream': 'bg-butter-cream/70 text-deep-navy border-deep-navy/10',
  'soft-pink': 'bg-soft-pink/70 text-deep-navy border-deep-navy/10',
  'mint-haze': 'bg-mint-haze/70 text-deep-navy border-deep-navy/10',
  'lavender-mist': 'bg-lavender-mist/70 text-deep-navy border-deep-navy/10',
  'warm-ivory': 'bg-warm-ivory text-deep-navy border-deep-navy/10',
  'deep-navy': 'bg-deep-navy text-white border-white/20',
}

function getToneClass(tone: string | undefined, isDeepNavy: boolean): string {
  if (isDeepNavy) {
    if (tone && TONE_BG[tone]) {
      return TONE_BG[tone]
    }
    return 'bg-white/[0.08] text-white border-white/15'
  }
  if (tone && TONE_BG[tone]) {
    return TONE_BG[tone]
  }
  return 'bg-white text-deep-navy border-deep-navy/10'
}

export function MatrixTable({
  variant = 'grid',
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  chipsTitle,
  chips = [],
  columns = [],
  rows = [],
  bgColor = 'warm-ivory',
  padding = 'md',
}: MatrixTableProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const hasHeader = Boolean(titleLine1 || titleLine2 || seriesLabel)
  const hasChips = Boolean(chipsTitle || (chips && chips.length > 0))

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {hasHeader && (
          <div className="mb-8 sm:mb-12">
            <header className="flex flex-col text-left items-start">
              {seriesLabel && (
                <span
                  className={`mb-[var(--tdcx-eyebrow-gap,1rem)] font-ui text-xs font-bold uppercase tracking-widest ${
                    isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
                  }`}
                >
                  {seriesLabel}
                </span>
              )}
              {titleLine1 && (
                <TwoToneTitle
                  line1={titleLine1}
                  line2={titleLine2}
                  line1ClassName={isDeepNavy ? 'text-white' : 'text-deep-navy'}
                  line2ClassName={isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'}
                />
              )}
              {emotionLine && (
                <p
                  className={`mt-[var(--tdcx-emotion-gap,0.875rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${
                    isDeepNavy ? 'text-white/85' : 'text-deep-navy/85'
                  }`}
                >
                  {emotionLine}
                </p>
              )}
            </header>
          </div>
        )}

        {hasChips && (
          <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
            {chipsTitle && (
              <span
                className={`font-ui text-xs sm:text-sm font-bold uppercase tracking-wider mr-1 ${
                  isDeepNavy ? 'text-accent-pink' : 'text-bright-magenta'
                }`}
              >
                {chipsTitle}
              </span>
            )}
            {chips.map((chip, idx) => {
              const label = typeof chip === 'string' ? chip : chip?.label || ''
              return (
                <span
                  key={idx}
                  className={`rounded-full px-3 py-1 text-xs sm:text-sm font-semibold border ${
                    isDeepNavy
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-white text-deep-navy border-deep-navy/15 shadow-2xs'
                  }`}
                >
                  {label}
                </span>
              )
            })}
          </div>
        )}

        {variant === 'grid' && (
          <div className="w-full">
            {/* Desktop / Tablet view: Semantic table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-deep-navy/10 bg-white shadow-soft">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-deep-navy/10">
                    <th scope="col" className="p-4 sm:p-5 font-ui text-sm sm:text-base font-bold bg-lavender-mist/60 text-deep-navy w-36">
                      &nbsp;
                    </th>
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        scope="col"
                        className={`p-4 sm:p-5 font-ui text-sm sm:text-base font-bold text-center border-l border-deep-navy/10 ${getToneClass(
                          col.color,
                          false,
                        )}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-deep-navy/10 last:border-b-0">
                      <th
                        scope="row"
                        className="p-4 sm:p-5 font-ui text-sm sm:text-base font-bold text-deep-navy bg-lavender-mist/80 align-top w-36"
                      >
                        {row.label}
                      </th>
                      {columns.map((col, cIdx) => {
                        const cell = row.cells?.[cIdx]
                        return (
                          <td
                            key={cIdx}
                            className={`p-4 sm:p-5 border-l border-deep-navy/10 align-top ${getToneClass(
                              col.color,
                              false,
                            )}`}
                          >
                            {cell?.title && (
                              <div className="font-ui font-bold text-sm sm:text-base text-deep-navy mb-1 leading-snug">
                                {cell.title}
                              </div>
                            )}
                            {cell?.text && (
                              <div className="font-ui text-xs sm:text-sm leading-relaxed text-deep-navy/80">
                                {cell.text}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile view: Stacked cards (no horizontal overflow) */}
            <div className="flex md:hidden flex-col gap-4">
              {rows.map((row, rIdx) => (
                <div
                  key={rIdx}
                  data-eb-card=""
                  className="rounded-2xl border border-deep-navy/10 bg-white shadow-soft overflow-hidden"
                >
                  <div className="bg-lavender-mist px-4 py-2.5 font-ui font-bold text-deep-navy text-sm sm:text-base border-b border-deep-navy/10">
                    {row.label}
                  </div>
                  <div className="divide-y divide-deep-navy/10">
                    {columns.map((col, cIdx) => {
                      const cell = row.cells?.[cIdx]
                      return (
                        <div key={cIdx} className={`p-3.5 ${getToneClass(col.color, false)}`}>
                          <div className="font-ui text-xs font-bold uppercase tracking-wider text-bright-magenta mb-1">
                            {col.label}
                          </div>
                          {cell?.title && (
                            <div className="font-ui font-bold text-sm text-deep-navy mb-0.5">
                              {cell.title}
                            </div>
                          )}
                          {cell?.text && (
                            <div className="font-ui text-xs leading-relaxed text-deep-navy/80">
                              {cell.text}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {variant === 'list' && (
          <div className="flex flex-col gap-3 sm:gap-4 w-full">
            {rows.map((row, idx) => {
              const toneClass = getToneClass(row.color, isDeepNavy)
              const hasAccent = row.hasAccentBar !== false

              return (
                <div
                  key={idx}
                  data-eb-card=""
                  data-eb-card-solid={isDeepNavy ? '' : undefined}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-4 sm:p-5 rounded-2xl border shadow-soft transition-transform ${
                    hasAccent ? 'border-l-4 border-l-accent-pink' : ''
                  } ${toneClass}`}
                >
                  {/* a11y-contrast-ok: PK-26 accent-pink label on deep-navy has 5.3:1 contrast */}
                  <div className="font-ui text-sm sm:text-base font-bold shrink-0 min-w-[140px] text-accent-pink sm:text-inherit">
                    {row.label}
                  </div>
                  {row.text && (
                    <div
                      className={`font-ui text-xs sm:text-sm sm:text-right leading-relaxed flex-1 ${
                        isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
                      }`}
                    >
                      {row.text}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
