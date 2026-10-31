import React from 'react'
import type { AlignOption } from '@/lib/brand/format-classes'
import { Spacer } from '../Spacer'
import { ButtonEl } from './ButtonEl'
import { EmotionEl, HeadingEl, ImageEl, ParagraphEl, SeriesLabelEl } from './elements'

type SlotRender = React.ComponentType<{ className?: string }>
type SlotItem = { type?: string; props?: Record<string, unknown> & { id?: string } }

// Renders raw slot data (`{ type, props }` items) outside Puck, e.g. in tests or previews.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- props come from stored slot data
const ELEMENT_RENDERERS: Record<string, React.ComponentType<any>> = {
  SeriesLabelEl,
  HeadingEl,
  ParagraphEl,
  EmotionEl,
  ImageEl,
  ButtonEl,
  Spacer,
}

export interface FreeSectionProps {
  version?: number
  columns?: '1' | '2'
  col1?: SlotRender | React.ReactNode | SlotItem[]
  col2?: SlotRender | React.ReactNode | SlotItem[]
  align?: AlignOption
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
  'deep-navy': 'bg-deep-navy',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

// Elements stack with brand spacing; a column is a flex column so buttons / images follow `align`.
const COLUMN_CLASS = 'flex flex-col gap-4'

function renderSlot(slot: FreeSectionProps['col1'], className: string) {
  if (typeof slot === 'function') {
    return React.createElement(slot as SlotRender, { className })
  }
  if (Array.isArray(slot)) {
    return (
      <div className={className}>
        {(slot as unknown[]).map((child, idx) => {
          if (React.isValidElement(child)) return child
          const item = child as SlotItem | null
          const Element = item?.type ? ELEMENT_RENDERERS[item.type] : undefined
          return Element && item?.props ? (
            <Element key={item.props.id || idx} {...item.props} />
          ) : null
        })}
      </div>
    )
  }
  return slot ? <div className={className}>{slot as React.ReactNode}</div> : null
}

/**
 * Free section (PK-13): a brand section whose content is built from small draggable elements
 * (series label, two-tone heading, paragraph, emotion line, image, button). Elements read
 * `group/fs` + `data-bg` / `data-align` to pick automatic colours and alignment.
 */
export function FreeSection({
  columns = '1',
  col1,
  col2,
  align = 'left',
  bgColor = 'warm-ivory',
  padding = 'md',
}: FreeSectionProps) {
  const twoColumns = columns === '2'
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'
  const columnClass = `${COLUMN_CLASS} ${alignClass}`

  return (
    <section
      className={`group/fs w-full ${BG_COLORS[bgColor] ?? BG_COLORS['warm-ivory']} ${PADDINGS[padding] ?? PADDINGS.md} transition-colors`}
      data-bg={bgColor}
      data-align={align}
    >
      <div
        className={
          twoColumns
            ? 'mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center'
            : 'mx-auto max-w-3xl'
        }
      >
        {renderSlot(col1, columnClass)}
        {twoColumns ? renderSlot(col2, columnClass) : null}
      </div>
    </section>
  )
}
