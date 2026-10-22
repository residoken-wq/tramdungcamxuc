import React from 'react'
import Image from 'next/image'
import { BrandIcon } from '@/components/brand/BrandIcon'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'
import {
  textColorClass,
  fontSizeClass,
  type TextColorOption,
  type FontSizeOption,
  type AlignOption,
} from '@/lib/brand/format-classes'

export interface IconCardProps {
  icon?: BrandIconKey | string
  mediaId?: string | number
  imageUrl?: string
  imageAlt?: string
  title?: string
  text?: string
  titleColor?: TextColorOption
  textColor?: TextColorOption
  titleSize?: FontSizeOption
  textSize?: FontSizeOption
  align?: AlignOption
  // Standalone / direct render props (optional):
  index?: number
  marker?: 'icon' | 'number'
  cardStyle?: 'white' | 'soft' | 'outline'
  isDeepNavy?: boolean
}

function getExplicitCardClasses(cardStyle: 'white' | 'soft' | 'outline' = 'white', isDeepNavy = false): string {
  if (isDeepNavy) {
    switch (cardStyle) {
      case 'soft':
        return 'bg-soft-pink/15 border-soft-pink/30 text-white'
      case 'outline':
        return 'bg-transparent border-2 border-white/30 text-white'
      case 'white':
      default:
        return 'bg-white/10 border border-white/20 text-white'
    }
  }

  switch (cardStyle) {
    case 'soft':
      return 'bg-soft-pink border-accent-pink/20 text-deep-navy shadow-soft'
    case 'outline':
      return 'bg-transparent border-2 border-deep-navy/20 text-deep-navy'
    case 'white':
    default:
      return 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
  }
}

export function IconCard({
  icon = 'star',
  imageUrl,
  imageAlt,
  title = '',
  text = '',
  titleColor = 'deep-navy',
  textColor = 'deep-navy',
  titleSize = 'md',
  textSize = 'md',
  align = 'left',
  index,
  marker,
  cardStyle,
  isDeepNavy = false,
}: IconCardProps) {
  const hasValidImage = Boolean(imageUrl && imageAlt && imageAlt.trim().length > 0)
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  const titleSizeClass = fontSizeClass('card-title', titleSize)
  const textSizeClass = fontSizeClass('card-text', textSize)

  // Title color: custom color if specified; if default deep-navy, adapt on deep-navy parent
  const titleColorClass =
    titleColor && titleColor !== 'deep-navy'
      ? textColorClass(titleColor)
      : isDeepNavy
        ? 'text-white'
        : 'text-deep-navy group-data-[bg=deep-navy]/grid:text-white'

  // Text color: custom color if specified; if default deep-navy, adapt on deep-navy parent
  const textColorStyleClass =
    textColor && textColor !== 'deep-navy'
      ? textColor === 'white'
        ? 'text-white/80'
        : textColorClass(textColor)
      : isDeepNavy
        ? 'text-white/80'
        : 'text-deep-navy/75 group-data-[bg=deep-navy]/grid:text-white/80'

  const explicitThemeClass = cardStyle
    ? getExplicitCardClasses(cardStyle, isDeepNavy)
    : getExplicitCardClasses('white', isDeepNavy)

  return (
    <div
      className={`flex flex-col p-6 sm:p-8 rounded-card border transition-transform hover:-translate-y-0.5 [counter-increment:card-counter] w-full ${alignClass} ${explicitThemeClass} group-data-[card-theme=navy-soft]/grid:bg-soft-pink/15 group-data-[card-theme=navy-soft]/grid:border-soft-pink/30 group-data-[card-theme=navy-soft]/grid:text-white group-data-[card-theme=navy-soft]/grid:shadow-none group-data-[card-theme=navy-outline]/grid:bg-transparent group-data-[card-theme=navy-outline]/grid:border-2 group-data-[card-theme=navy-outline]/grid:border-white/30 group-data-[card-theme=navy-outline]/grid:text-white group-data-[card-theme=navy-outline]/grid:shadow-none group-data-[card-theme=navy-white]/grid:bg-white/10 group-data-[card-theme=navy-white]/grid:border group-data-[card-theme=navy-white]/grid:border-white/20 group-data-[card-theme=navy-white]/grid:text-white group-data-[card-theme=navy-white]/grid:shadow-none group-data-[card-theme=light-soft]/grid:bg-soft-pink group-data-[card-theme=light-soft]/grid:border-accent-pink/20 group-data-[card-theme=light-soft]/grid:text-deep-navy group-data-[card-theme=light-soft]/grid:shadow-soft group-data-[card-theme=light-outline]/grid:bg-transparent group-data-[card-theme=light-outline]/grid:border-2 group-data-[card-theme=light-outline]/grid:border-deep-navy/20 group-data-[card-theme=light-outline]/grid:text-deep-navy group-data-[card-theme=light-outline]/grid:shadow-none group-data-[card-theme=light-white]/grid:bg-white group-data-[card-theme=light-white]/grid:border-deep-navy/10 group-data-[card-theme=light-white]/grid:text-deep-navy group-data-[card-theme=light-white]/grid:shadow-soft`}
    >
      <div className="mb-4 flex items-center">
        {marker === 'number' && index !== undefined ? (
          <span className="font-display text-3xl sm:text-4xl text-bright-magenta">
            {String(index + 1).padStart(2, '0')}
          </span>
        ) : marker === 'icon' && index !== undefined ? (
          hasValidImage ? (
            <div className="relative h-12 w-12 rounded-2xl overflow-hidden">
              <Image src={imageUrl!} alt={imageAlt!} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-pink text-bright-magenta">
              <BrandIcon name={(icon as BrandIconKey) || 'star'} size={24} />
            </div>
          )
        ) : (
          <>
            <span className="hidden group-data-[marker=number]/grid:inline-block font-display text-3xl sm:text-4xl text-bright-magenta before:content-[counter(card-counter,_decimal-leading-zero)]" />
            <div className="flex group-data-[marker=number]/grid:hidden items-center justify-center">
              {hasValidImage ? (
                <div className="relative h-12 w-12 rounded-2xl overflow-hidden">
                  <Image src={imageUrl!} alt={imageAlt!} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-pink text-bright-magenta">
                  <BrandIcon name={(icon as BrandIconKey) || 'star'} size={24} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {title && (
        <h3 className={`font-ui ${titleSizeClass} font-bold leading-snug ${titleColorClass}`}>
          {title}
        </h3>
      )}

      {text && (
        <p className={`mt-2 font-ui ${textSizeClass} leading-relaxed ${textColorStyleClass}`}>
          {text}
        </p>
      )}
    </div>
  )
}
