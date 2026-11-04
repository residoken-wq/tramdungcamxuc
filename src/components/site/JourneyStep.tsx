import React from 'react'
import {
  textColorClass,
  fontSizeClass,
  type TextColorOption,
  type FontSizeOption,
  type AlignOption,
} from '@/lib/brand/format-classes'
import { textTarget } from '@/puck/style/text-target'

export interface JourneyStepProps {
  version?: number
  name?: string
  subname?: string
  subtitle?: string
  description?: string
  highlight?: boolean
  nameColor?: TextColorOption
  nameSize?: FontSizeOption
  descColor?: TextColorOption
  descSize?: FontSizeOption
  align?: AlignOption
  index?: number
  variant?: 'circles' | 'cards' | 'list'
  isDeepNavy?: boolean
}

export function JourneyStep({
  name = 'Pause',
  subname = 'Dừng lại',
  subtitle,
  description,
  highlight = false,
  nameColor,
  nameSize = 'md',
  descColor,
  descSize = 'md',
  align = 'left',
  index,
  variant,
  isDeepNavy = false,
  id,
}: JourneyStepProps & { id?: string }) {
  const isHighlighted = Boolean(highlight)
  const isNavy = isHighlighted || isDeepNavy

  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  const nameSizeClass = fontSizeClass('step-name', nameSize)
  const descSizeClass = fontSizeClass('step-desc', descSize)

  const cardBgClass = isHighlighted
    ? 'bg-deep-navy text-white border-deep-navy shadow-md'
    : isDeepNavy
      ? 'bg-white/10 border-white/20 text-white shadow-none'
      : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft group-data-[bg=deep-navy]/journey:bg-white/10 group-data-[bg=deep-navy]/journey:border-white/20 group-data-[bg=deep-navy]/journey:text-white group-data-[bg=deep-navy]/journey:shadow-none'

  const nameColorClass =
    nameColor && nameColor !== 'deep-navy'
      ? textColorClass(nameColor)
      : isNavy
        ? 'text-white'
        : 'text-deep-navy group-data-[bg=deep-navy]/journey:text-white'

  const descColorClass =
    descColor && descColor !== 'deep-navy'
      ? descColor === 'white'
        ? 'text-white/85'
        : textColorClass(descColor)
      : isNavy
        ? 'text-white/85'
        : 'text-deep-navy/80 group-data-[bg=deep-navy]/journey:text-white/85'

  const badgeClass = isNavy
    ? 'bg-white/15 text-soft-pink'
    : 'bg-soft-pink text-deep-navy group-data-[bg=deep-navy]/journey:bg-white/15 group-data-[bg=deep-navy]/journey:text-soft-pink'

  const subtitleColorClass = isNavy
    ? 'text-soft-pink'
    : 'text-bright-magenta group-data-[bg=deep-navy]/journey:text-soft-pink'

  const stepNumberClass = isNavy
    ? 'text-soft-pink'
    : 'text-bright-magenta group-data-[bg=deep-navy]/journey:text-soft-pink'

  const circleBadgeClass = isNavy
    ? 'bg-white/10 border-soft-pink/30 text-soft-pink'
    : 'bg-soft-pink border-bright-magenta/20 text-bright-magenta group-data-[bg=deep-navy]/journey:bg-white/10 group-data-[bg=deep-navy]/journey:border-soft-pink/30 group-data-[bg=deep-navy]/journey:text-soft-pink'

  const stepNumberNode =
    index !== undefined ? (
      <span>{String(index + 1).padStart(2, '0')}</span>
    ) : (
      <span className="before:content-[counter(step-counter,_decimal-leading-zero)]" />
    )

  // Layout 1: Explicit List
  if (variant === 'list') {
    return (
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-5 sm:p-6 rounded-card border transition-transform hover:-translate-y-0.5 [counter-increment:step-counter] w-full ${cardBgClass}`}
      >
        <div
          className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-display text-2xl sm:text-3xl border ${circleBadgeClass}`}
        >
          {stepNumberNode}
        </div>

        <div className="flex-1 min-w-0 w-full text-left">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className={`font-ui ${nameSizeClass} font-bold ${nameColorClass}`}>{name}</h3>
            {subname && (
              <span
                className={`font-ui text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}
              >
                {subname}
              </span>
            )}
          </div>

          {subtitle && (
            <p className={`font-ui text-xs sm:text-sm font-semibold mb-1.5 ${subtitleColorClass}`}>
              {subtitle}
            </p>
          )}

          {description && (
            <p className={`font-ui ${descSizeClass} leading-relaxed ${descColorClass}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Layout 2: Explicit Cards / Circles
  if (variant === 'cards' || variant === 'circles') {
    return (
      <div
        data-eb-card=""
        className={`flex flex-col p-5 sm:p-6 rounded-card border transition-transform hover:-translate-y-1 [counter-increment:step-counter] w-full ${alignClass} group-data-[card-align=center]/grid:items-center group-data-[card-align=center]/grid:text-center group-data-[card-align=left]/grid:items-start group-data-[card-align=left]/grid:text-left group-data-[card-align=center]/journey:items-center group-data-[card-align=center]/journey:text-center group-data-[card-align=left]/journey:items-start group-data-[card-align=left]/journey:text-left ${cardBgClass}`}
      >
        <div className="w-full self-stretch mb-3 text-[inherit]">
          <div
            data-eb-card-row=""
            className={`flex items-baseline ${align === 'center' ? 'justify-center gap-2' : 'justify-between'} group-data-[card-align=center]/grid:justify-center group-data-[card-align=center]/grid:gap-2 group-data-[card-align=center]/journey:justify-center group-data-[card-align=center]/journey:gap-2 group-data-[card-align=left]/grid:justify-between group-data-[card-align=left]/journey:justify-between`}
          >
            <span
              className={`inline-block font-display text-2xl sm:text-3xl tracking-tight ${stepNumberClass}`}
            >
              {stepNumberNode}
            </span>
            {subname && (
              <span
                {...textTarget(id, 'subname')}
                className={`inline-block font-ui text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}
              >
                {subname}
              </span>
            )}
          </div>
        </div>

        <h3
          {...textTarget(id, 'name')}
          className={`font-ui ${nameSizeClass} font-bold ${subtitle ? 'mb-1' : 'mb-2'} ${nameColorClass}`}
        >
          {name}
        </h3>

        {subtitle && (
          <p
            {...textTarget(id, 'subtitle')}
            className={`font-ui text-xs font-semibold mb-2 ${subtitleColorClass}`}
          >
            {subtitle}
          </p>
        )}

        {description && (
          <p
            {...textTarget(id, 'description')}
            className={`font-ui ${descSizeClass} leading-relaxed mt-auto ${descColorClass}`}
          >
            {description}
          </p>
        )}
      </div>
    )
  }

  // Layout 3: Slot mode (switches between list and card using group-data-[variant=list]/journey)
  return (
    <div
      data-eb-card=""
      className={`flex flex-col group-data-[variant=list]/journey:sm:flex-row group-data-[variant=list]/journey:items-start group-data-[variant=list]/journey:sm:items-center group-data-[variant=list]/journey:gap-4 group-data-[variant=list]/journey:sm:gap-6 p-5 sm:p-6 rounded-card border transition-transform hover:-translate-y-1 [counter-increment:step-counter] w-full ${alignClass} group-data-[card-align=center]/grid:items-center group-data-[card-align=center]/grid:text-center group-data-[card-align=left]/grid:items-start group-data-[card-align=left]/grid:text-left group-data-[card-align=center]/journey:items-center group-data-[card-align=center]/journey:text-center group-data-[card-align=left]/journey:items-start group-data-[card-align=left]/journey:text-left ${cardBgClass}`}
    >
      {/* List circular badge (hidden on cards/circles, visible on list) */}
      <div
        className={`hidden group-data-[variant=list]/journey:flex flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full items-center justify-center font-display text-2xl sm:text-3xl border ${circleBadgeClass}`}
      >
        {stepNumberNode}
      </div>

      <div className="flex flex-1 flex-col min-w-0 w-full">
        {/* Cards/Circles top row indicator (visible on cards/circles, hidden on list) */}
        <div className="w-full self-stretch mb-3 text-[inherit] group-data-[variant=list]/journey:!hidden">
          <div
            data-eb-card-row=""
            className={`flex items-baseline ${align === 'center' ? 'justify-center gap-2' : 'justify-between'} group-data-[card-align=center]/grid:justify-center group-data-[card-align=center]/grid:gap-2 group-data-[card-align=center]/journey:justify-center group-data-[card-align=center]/journey:gap-2 group-data-[card-align=left]/grid:justify-between group-data-[card-align=left]/journey:justify-between`}
          >
            <span
              className={`inline-block font-display text-2xl sm:text-3xl tracking-tight ${stepNumberClass}`}
            >
              {stepNumberNode}
            </span>
            {subname && (
              <span
                {...textTarget(id, 'subname')}
                className={`inline-block font-ui text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}
              >
                {subname}
              </span>
            )}
          </div>
        </div>

        {/* List top row (hidden on cards/circles, visible on list) */}
        <div className="hidden group-data-[variant=list]/journey:flex flex-wrap items-center gap-2 mb-1">
          <h3
            {...textTarget(id, 'name')}
            className={`font-ui ${nameSizeClass} font-bold ${nameColorClass}`}
          >
            {name}
          </h3>
          {subname && (
            <span
              {...textTarget(id, 'subname')}
              className={`font-ui text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}
            >
              {subname}
            </span>
          )}
        </div>

        {/* Card step name (visible on cards/circles, hidden on list) */}
        <h3
          {...textTarget(id, 'name')}
          className={`flex group-data-[variant=list]/journey:hidden font-ui ${nameSizeClass} font-bold ${
            subtitle ? 'mb-1' : 'mb-2'
          } ${nameColorClass}`}
        >
          {name}
        </h3>

        {/* Optional Subtitle */}
        {subtitle && (
          <p
            {...textTarget(id, 'subtitle')}
            className={`font-ui text-xs ${
              variant === 'list' ? 'sm:text-sm font-semibold mb-1.5' : 'font-semibold mb-2'
            } group-data-[variant=list]/journey:sm:text-sm group-data-[variant=list]/journey:mb-1.5 ${subtitleColorClass}`}
          >
            {subtitle}
          </p>
        )}

        {/* Description */}
        {description && (
          <p
            {...textTarget(id, 'description')}
            className={`font-ui ${descSizeClass} leading-relaxed group-data-[variant=list]/journey:mt-0 mt-auto ${descColorClass}`}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
