'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { useClientPageSlug } from '@/puck/client-preview'
import {
  textColorClass,
  type AlignOption,
  type FontSizeOption,
  type TextColorOption,
} from '@/lib/brand/format-classes'
import { safeHref } from '@/lib/safe-href'

export interface PathCardProps {
  version?: number
  groupLabel?: string
  title?: string
  description?: string
  buttonLabel?: string
  linkType?: 'url' | 'page'
  pageId?: string | number
  href?: string
  buttonStyle?: 'solid' | 'outline'
  labelColor?: TextColorOption
  titleColor?: TextColorOption
  textColor?: TextColorOption
  titleSize?: FontSizeOption
  textSize?: FontSizeOption
  align?: AlignOption
  _resolved?: { pageSlug?: string | null }
}

export function resolveSafeLink(
  linkType: 'url' | 'page' | undefined,
  href: string | undefined,
  slug: string | null | undefined,
): string {
  if (linkType === 'page') {
    if (typeof slug === 'string' && slug.trim() !== '') {
      const s = slug.trim()
      const formatted = s === '/' ? '/' : s.startsWith('/') ? s : `/${s}`
      return safeHref(formatted) || '#'
    }
    return '#'
  }
  return safeHref(href) || '#'
}

// `md` (the default) keeps the pre-PK-08 look of TwoPathCards.
const TITLE_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-xl sm:text-2xl',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl',
}
const TEXT_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base sm:text-lg',
}

/**
 * One card of TwoPathCards (PK-08), rendered inside the parent's `paths` slot. The parent sets
 * `group/paths` + `data-bg`, so the card adapts to a deep-navy section; `deep-navy` colours
 * mean "automatic".
 */
export function PathCard({
  groupLabel,
  title,
  description,
  buttonLabel,
  linkType = 'url',
  pageId,
  href,
  buttonStyle = 'solid',
  labelColor = 'deep-navy',
  titleColor = 'deep-navy',
  textColor = 'deep-navy',
  titleSize = 'md',
  textSize = 'md',
  align = 'left',
  _resolved,
}: PathCardProps) {
  const { slug: clientSlug } = useClientPageSlug(pageId, _resolved?.pageSlug)
  const finalHref = resolveSafeLink(linkType, href, _resolved?.pageSlug ?? clientSlug)
  const alignClass = align === 'center' ? 'text-center' : 'text-left'

  const labelClass =
    labelColor !== 'deep-navy'
      ? textColorClass(labelColor)
      : 'text-bright-magenta group-data-[bg=deep-navy]/paths:text-soft-pink'
  const titleClass =
    titleColor !== 'deep-navy'
      ? textColorClass(titleColor)
      : 'text-deep-navy group-data-[bg=deep-navy]/paths:text-white'
  const descClass =
    textColor !== 'deep-navy'
      ? textColor === 'white'
        ? 'text-white/90'
        : textColorClass(textColor)
      : 'text-deep-navy/80 group-data-[bg=deep-navy]/paths:text-white/90'

  return (
    <div className="rounded-card border bg-white border-deep-navy/10 group-data-[bg=deep-navy]/paths:bg-white/10 group-data-[bg=deep-navy]/paths:border-white/15 p-6 sm:p-8 shadow-soft flex flex-col justify-between h-full transition-transform duration-300 hover:-translate-y-1">
      <div className={alignClass}>
        {groupLabel && (
          <span
            className={`mb-3 block font-ui text-xs font-bold uppercase tracking-widest ${labelClass}`}
          >
            {groupLabel}
          </span>
        )}
        {title && (
          <h3
            className={`font-display uppercase tracking-tight mb-4 ${TITLE_SIZES[titleSize] ?? TITLE_SIZES.md} ${titleClass}`}
          >
            {title}
          </h3>
        )}
        {description && (
          <p
            className={`font-ui leading-relaxed mb-6 ${TEXT_SIZES[textSize] ?? TEXT_SIZES.md} ${descClass}`}
          >
            {description}
          </p>
        )}
      </div>
      {buttonLabel && (
        <div className="pt-2">
          <Button
            href={finalHref}
            variant={buttonStyle === 'outline' ? 'ghost' : 'primary'}
            size="md"
            className="w-full text-center"
          >
            {buttonLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
