import React from 'react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'
import {
  textColorClass,
  type AlignOption,
  type FontSizeOption,
  type TextColorOption,
} from '@/lib/brand/format-classes'

export interface VisionCardItemProps {
  version?: number
  icon?: BrandIconKey | string
  title?: string
  content?: string
  titleColor?: TextColorOption
  textColor?: TextColorOption
  titleSize?: FontSizeOption
  textSize?: FontSizeOption
  align?: AlignOption
}

// `md` (the default) keeps the pre-PK-09 look of VisionMission cards.
const TITLE_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
}
const TEXT_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base sm:text-lg',
}

/**
 * One card of VisionMission (PK-09), rendered inside the parent's `cards` slot. The parent sets
 * `group/vm` + `data-bg`, so the card adapts to a deep-navy section; `deep-navy` colours mean
 * "automatic". Paragraphs are separated by a blank line.
 */
export function VisionCardItem({
  icon = 'compass',
  title,
  content,
  titleColor = 'deep-navy',
  textColor = 'deep-navy',
  titleSize = 'md',
  textSize = 'md',
  align = 'left',
}: VisionCardItemProps) {
  // In the editor Puck passes contentEditable props as React elements: render it as one block.
  const paragraphs: React.ReactNode[] =
    typeof content === 'string'
      ? content
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean)
      : content
        ? [content]
        : []
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'
  const titleClass =
    titleColor !== 'deep-navy'
      ? textColorClass(titleColor)
      : 'text-deep-navy group-data-[bg=deep-navy]/vm:text-white'
  const descClass =
    textColor !== 'deep-navy'
      ? textColor === 'white'
        ? 'text-white/90'
        : textColorClass(textColor)
      : 'text-deep-navy/80 group-data-[bg=deep-navy]/vm:text-white/90'

  return (
    <div className="rounded-card border bg-white border-deep-navy/10 group-data-[bg=deep-navy]/vm:bg-white/10 group-data-[bg=deep-navy]/vm:border-white/15 p-6 sm:p-8 shadow-soft flex flex-col justify-between h-full">
      <div className={`flex flex-col ${alignClass}`}>
        <div className="mb-4 inline-flex items-center justify-center p-3 rounded-full bg-soft-pink/40">
          <BrandIcon
            name={icon}
            className="w-8 h-8 text-bright-magenta group-data-[bg=deep-navy]/vm:text-soft-pink"
            aria-hidden="true"
          />
        </div>
        {title && (
          <h3
            className={`font-display ${TITLE_SIZES[titleSize] ?? TITLE_SIZES.md} uppercase tracking-tight mb-3 ${titleClass}`}
          >
            {title}
          </h3>
        )}
        <div className="space-y-3">
          {paragraphs.map((p, idx) => (
            <p
              key={idx}
              className={`font-ui ${TEXT_SIZES[textSize] ?? TEXT_SIZES.md} leading-relaxed ${descClass}`}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
