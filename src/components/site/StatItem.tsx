import React from 'react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import { StatCounter } from './StatCounter'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'
import {
  textColorClass,
  fontSizeClass,
  type TextColorOption,
  type FontSizeOption,
  type AlignOption,
} from '@/lib/brand/format-classes'
import { textTarget } from '@/puck/style/text-target'

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
  puck?: {
    isEditing?: boolean
  }
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
  puck,
  id,
}: StatItemProps & { id?: string }) {
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
      data-eb-card=""
      className={`flex flex-col p-6 sm:p-8 rounded-card border transition-transform hover:-translate-y-0.5 w-full ${alignClass} group-data-[card-align=center]/grid:items-center group-data-[card-align=center]/grid:text-center group-data-[card-align=left]/grid:items-start group-data-[card-align=left]/grid:text-left group-data-[card-align=center]/stats:items-center group-data-[card-align=center]/stats:text-center group-data-[card-align=left]/stats:items-start group-data-[card-align=left]/stats:text-left ${cardBgClass}`}
    >
      {icon ? (
        <div className="w-full self-stretch text-[inherit]">
          <div className="inline-flex h-14 sm:h-16 items-center justify-center">
            <BrandIcon name={icon as BrandIconKey} size={44} className={valueColorClass} />
          </div>
        </div>
      ) : (
        value && (
          <div
            {...textTarget(id, 'value')}
            className={`font-display ${valueSizeClass} tracking-tight !leading-[var(--tdcx-title-lh,1.3)] ${valueColorClass}`}
          >
            <StatCounter value={value} isEditing={Boolean(puck?.isEditing)} />
          </div>
        )
      )}

      {label && (
        <p
          {...textTarget(id, 'label')}
          className={`mt-3 font-ui ${labelSizeClass} font-semibold leading-relaxed ${labelColorClass}`}
        >
          {label}
        </p>
      )}

      {description && (
        <p
          {...textTarget(id, 'description')}
          className={`mt-1 font-ui text-xs sm:text-sm leading-relaxed whitespace-pre-line ${descriptionColorClass}`}
        >
          {description}
        </p>
      )}
    </div>
  )
}
