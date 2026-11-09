import React, { type ReactNode } from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'

export interface ColumnsProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  numColumns?: '2' | '3' | 2 | 3
  equalHeight?: boolean
  col1?: ReactNode | React.ComponentType
  col2?: ReactNode | React.ComponentType
  col3?: ReactNode | React.ComponentType
  gap?: 'sm' | 'md' | 'lg'
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
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
  sm: 'py-6 px-4 sm:px-6',
  md: 'py-10 px-6 sm:px-8',
  lg: 'py-16 px-6 sm:px-12',
} as const

const GAPS = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
} as const

function renderSlotContent(slot: ReactNode | React.ComponentType | undefined): ReactNode {
  if (!slot) return null
  if (typeof slot === 'function') {
    const SlotComponent = slot as React.ComponentType
    return <SlotComponent />
  }
  return slot
}

export function Columns({
  id,
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  numColumns = '2',
  equalHeight = false,
  col1,
  col2,
  col3,
  gap = 'md',
  bgColor = 'warm-ivory',
  padding = 'md',
}: ColumnsProps & { id?: string }) {
  const isDeepNavy = bgColor === 'deep-navy'
  const hasHeader = Boolean(titleLine1 || titleLine2 || seriesLabel)
  const is3Cols = String(numColumns) === '3'
  const gridColsClass = is3Cols ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
  const colEqualHeightClasses = equalHeight
    ? '[&>[data-eb-card]]:self-stretch [&>[data-eb-card]]:flex-1 [&>*:not([data-eb-card])]:flex [&>*:not([data-eb-card])]:flex-col [&>*:not([data-eb-card])]:flex-1 [&>*>[data-eb-card]]:flex-1'
    : ''

  return (
    <section
      data-block="columns"
      data-bg={bgColor}
      // Cards dropped in a column read their theme like in IconCardGrid (white card style)
      data-card-theme={isDeepNavy ? 'navy-white' : 'light-white'}
      className={`w-full group/grid group/stats group/faq ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}
    >
      <div className="mx-auto max-w-5xl">
        {hasHeader && (
          <div className="mb-8 sm:mb-12">
            <SectionHeader
              id={id}
              seriesLabel={seriesLabel}
              titleLine1={titleLine1 || ''}
              titleLine2={titleLine2}
              emotionLine={emotionLine}
              align="center"
              line1Color={isDeepNavy ? 'white' : 'deep-navy'}
              line2Color={isDeepNavy ? 'soft-pink' : 'bright-magenta'}
              eyebrowColor={isDeepNavy ? 'soft-pink' : 'bright-magenta'}
              emotionColor={isDeepNavy ? 'white' : 'deep-navy'}
            />
          </div>
        )}
        <div
          className={`grid ${gridColsClass} ${GAPS[gap]} ${
            equalHeight ? 'items-stretch' : 'items-start'
          }`}
        >
          <div className={`min-w-0 w-full flex flex-col ${colEqualHeightClasses}`.trim()}>
            {renderSlotContent(col1)}
          </div>
          <div className={`min-w-0 w-full flex flex-col ${colEqualHeightClasses}`.trim()}>
            {renderSlotContent(col2)}
          </div>
          {is3Cols && (
            <div className={`min-w-0 w-full flex flex-col ${colEqualHeightClasses}`.trim()}>
              {renderSlotContent(col3)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
