import React from 'react'
import { Button } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import {
  textColorClass,
  type AlignOption,
  type FontSizeOption,
  type TextColorOption,
} from '@/lib/brand/format-classes'

export interface HeroEntryCardProps {
  version?: number
  groupLabel?: string
  label?: string
  description?: string
  buttonText?: string
  buttonLink?: string
  buttonStyle?: 'solid' | 'outline'
  badgeColor?: 'soft-pink' | 'lavender-mist'
  labelColor?: TextColorOption
  textColor?: TextColorOption
  labelSize?: FontSizeOption
  textSize?: FontSizeOption
  align?: AlignOption
}

// Own scale so `md` (the default) keeps the pre-PK-08 look: small caps label, base description.
const LABEL_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-xs',
  md: 'text-xs sm:text-sm',
  lg: 'text-sm sm:text-base',
}
const TEXT_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base sm:text-lg',
}

/**
 * One entry card of HeroTwoEntries (PK-08). Rendered inside the parent's `entries` slot; the
 * parent sets `group/hero` + `data-bg`, so cards adapt to a deep-navy section without props.
 * `deep-navy` colours mean "automatic" (white on a navy section), as for Card / Stat / Step.
 */
export function HeroEntryCard({
  groupLabel,
  label,
  description,
  buttonText,
  buttonLink,
  buttonStyle = 'solid',
  badgeColor = 'soft-pink',
  labelColor = 'deep-navy',
  textColor = 'deep-navy',
  labelSize = 'md',
  textSize = 'md',
  align = 'left',
}: HeroEntryCardProps) {
  const href = safeHref(buttonLink)
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  const groupLabelClass =
    labelColor && labelColor !== 'deep-navy'
      ? textColorClass(labelColor)
      : 'text-bright-magenta group-data-[bg=deep-navy]/hero:text-soft-pink'
  const textClass =
    textColor && textColor !== 'deep-navy'
      ? textColor === 'white'
        ? 'text-white/90'
        : textColorClass(textColor)
      : 'text-deep-navy/80 group-data-[bg=deep-navy]/hero:text-white/90'
  const badgeClass = badgeColor === 'lavender-mist' ? 'bg-lavender-mist' : 'bg-soft-pink'

  return (
    <div
      className={`flex flex-col justify-between p-6 sm:p-8 rounded-card border shadow-soft h-full bg-white text-deep-navy border-deep-navy/10 group-data-[bg=deep-navy]/hero:bg-white/10 group-data-[bg=deep-navy]/hero:text-white group-data-[bg=deep-navy]/hero:border-white/20`}
    >
      <div className={`flex flex-col ${alignClass}`}>
        {groupLabel && groupLabel.trim().length > 0 ? (
          <span
            className={`block font-ui font-bold uppercase tracking-widest mb-4 ${LABEL_SIZES[labelSize] ?? LABEL_SIZES.md} ${groupLabelClass}`}
          >
            {groupLabel}
          </span>
        ) : label ? (
          <span
            className={`inline-block px-3 py-1 rounded-full font-ui font-bold uppercase tracking-wider text-deep-navy mb-4 ${LABEL_SIZES[labelSize] ?? LABEL_SIZES.md} ${badgeClass}`}
          >
            {label}
          </span>
        ) : null}
        {description ? (
          <p
            className={`font-ui leading-relaxed mb-6 ${TEXT_SIZES[textSize] ?? TEXT_SIZES.md} ${textClass}`}
          >
            {description}
          </p>
        ) : null}
      </div>
      {href && buttonText ? (
        <div>
          <Button
            href={href}
            variant={buttonStyle === 'outline' ? 'secondary' : 'primary'}
            size="md"
            className="w-full"
          >
            {buttonText}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
