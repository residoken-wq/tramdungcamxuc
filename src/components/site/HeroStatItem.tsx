import React from 'react'
import {
  textColorClass,
  type AlignOption,
  type FontSizeOption,
  type TextColorOption,
} from '@/lib/brand/format-classes'

export interface HeroStatItemProps {
  version?: number
  value?: string
  label?: string
  valueColor?: TextColorOption
  labelColor?: TextColorOption
  valueSize?: FontSizeOption
  labelSize?: FontSizeOption
  align?: AlignOption
}

// `md` (the default) keeps the pre-PK-09 look of the HeroImage stats strip.
const VALUE_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-xl sm:text-2xl',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl',
}
const LABEL_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-xs',
  md: 'text-xs sm:text-sm',
  lg: 'text-sm sm:text-base',
}

/**
 * One stat of the HeroImage stats strip (PK-09), rendered inside the parent's `stats` slot.
 * Sits directly on the section background; the parent sets `group/heroimg` + `data-bg`, so
 * `deep-navy` colours mean "automatic" (white on a navy section).
 */
export function HeroStatItem({
  value,
  label,
  valueColor = 'deep-navy',
  labelColor = 'deep-navy',
  valueSize = 'md',
  labelSize = 'md',
  align = 'center',
}: HeroStatItemProps) {
  const alignClass = align === 'left' ? 'items-start text-left' : 'items-center text-center'
  const valueClass =
    valueColor !== 'deep-navy'
      ? textColorClass(valueColor)
      : 'text-deep-navy group-data-[bg=deep-navy]/heroimg:text-white'
  const labelClass =
    labelColor !== 'deep-navy'
      ? labelColor === 'white'
        ? 'text-white/80'
        : textColorClass(labelColor)
      : 'text-deep-navy/70 group-data-[bg=deep-navy]/heroimg:text-white/80'

  return (
    <div className={`flex flex-col ${alignClass}`}>
      {value && (
        <span className={`font-display ${VALUE_SIZES[valueSize] ?? VALUE_SIZES.md} ${valueClass}`}>
          {value}
        </span>
      )}
      {label && (
        <span
          className={`font-ui font-medium mt-1 ${LABEL_SIZES[labelSize] ?? LABEL_SIZES.md} ${labelClass}`}
        >
          {label}
        </span>
      )}
    </div>
  )
}
