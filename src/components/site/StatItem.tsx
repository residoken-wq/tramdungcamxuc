import React from 'react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'
import {
  textColorClass,
  fontSizeClass,
  type TextColorOption,
  type FontSizeOption,
  type AlignOption,
} from '@/lib/brand/format-classes'

export interface StatItemProps {
  version?: number
  value?: string
  label?: string
  description?: string
  icon?: BrandIconKey | string
  valueColor?: TextColorOption
  valueSize?: FontSizeOption
  labelColor?: TextColorOption
  labelSize?: FontSizeOption
  align?: AlignOption
  isDeepNavy?: boolean
}

export function StatItem({
  value,
  label = '',
  description,
  icon,
  valueColor,
  valueSize = 'md',
  labelColor,
  labelSize = 'md',
  align = 'center',
  isDeepNavy = false,
}: StatItemProps) {
  const alignClass = align === 'left' ? 'items-start text-left' : 'items-center text-center'

  const valueSizeClass = fontSizeClass('stat-value', valueSize)
  const labelSizeClass = fontSizeClass('stat-label', labelSize)

  const cardBgClass = isDeepNavy
    ? 'bg-white/10 border-white/20 text-white shadow-none'
    : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft group-data-[bg=deep-navy]/stats:bg-white/10 group-data-[bg=deep-navy]/stats:border-white/20 group-data-[bg=deep-navy]/stats:text-white group-data-[bg=deep-navy]/stats:shadow-none'

  const valueColorClass =
    valueColor && valueColor !== 'bright-magenta'
      ? textColorClass(valueColor)
      : isDeepNavy
        ? 'text-soft-pink'
        : 'text-bright-magenta group-data-[bg=deep-navy]/stats:text-soft-pink'

  const labelColorClass =
    labelColor && labelColor !== 'deep-navy'
      ? textColorClass(labelColor)
      : isDeepNavy
        ? 'text-white/85'
        : 'text-deep-navy/80 group-data-[bg=deep-navy]/stats:text-white/85'

  const descriptionColorClass = isDeepNavy
    ? 'text-white/75'
    : 'text-deep-navy/70 group-data-[bg=deep-navy]/stats:text-white/75'

  return (
    <div
      className={`flex flex-col p-6 sm:p-8 rounded-card border transition-transform hover:-translate-y-0.5 w-full ${alignClass} ${cardBgClass}`}
    >
      {icon ? (
        <div className="flex h-14 sm:h-16 items-center justify-center">
          <BrandIcon name={icon as BrandIconKey} size={44} className={valueColorClass} />
        </div>
      ) : (
        value && (
          <div
            className={`font-display ${valueSizeClass} tracking-tight leading-none ${valueColorClass}`}
          >
            {value}
          </div>
        )
      )}

      {label && (
        <p className={`mt-3 font-ui ${labelSizeClass} font-semibold leading-relaxed ${labelColorClass}`}>
          {label}
        </p>
      )}

      {description && (
        <p className={`mt-1 font-ui text-xs sm:text-sm leading-relaxed ${descriptionColorClass}`}>
          {description}
        </p>
      )}
    </div>
  )
}
