import React, { type ReactNode } from 'react'

export interface ColumnsProps {
  version?: number
  numColumns?: '2' | '3' | 2 | 3
  col1?: ReactNode | React.ComponentType
  col2?: ReactNode | React.ComponentType
  col3?: ReactNode | React.ComponentType
  gap?: 'sm' | 'md' | 'lg'
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
  numColumns = '2',
  col1,
  col2,
  col3,
  gap = 'md',
  bgColor = 'warm-ivory',
  padding = 'md',
}: ColumnsProps) {
  const is3Cols = String(numColumns) === '3'
  const gridColsClass = is3Cols ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        <div className={`grid ${gridColsClass} ${GAPS[gap]} items-start`}>
          <div className="min-w-0 w-full flex flex-col">{renderSlotContent(col1)}</div>
          <div className="min-w-0 w-full flex flex-col">{renderSlotContent(col2)}</div>
          {is3Cols && (
            <div className="min-w-0 w-full flex flex-col">{renderSlotContent(col3)}</div>
          )}
        </div>
      </div>
    </section>
  )
}
