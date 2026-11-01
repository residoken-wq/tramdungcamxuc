'use client'

import React from 'react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import { useClientPageSlug } from '@/puck/client-preview'
import { getSafeLink, type WidgetLinkProps } from './link-helper'

export type IconSize = 'sm' | 'md' | 'lg' | 'xl'
export type IconStyle = 'plain' | 'circle-bg' | 'circle-border'

export interface IconWidgetProps extends WidgetLinkProps {
  version?: number
  icon?: string
  iconColor?: string
  iconSize?: IconSize
  iconStyle?: IconStyle
  ariaLabel?: string
}

const PIXEL_SIZES: Record<IconSize, number> = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 64,
}

const CONTAINER_SIZES: Record<IconSize, string> = {
  sm: 'w-9 h-9',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
}

const BRAND_TOKEN_HEX: Record<string, string> = {
  'deep-navy': '#280A60',
  'bright-magenta': '#BC039E',
  'accent-pink': '#EF3B83',
  'soft-pink': '#FDE6F6',
  'lavender-mist': '#E9DDF9',
  'mint-haze': '#D9F1EA',
  'butter-cream': '#F6E9B8',
  'warm-ivory': '#FAF7F4',
}

export function resolveIconColor(color: string | undefined): string {
  if (!color) return BRAND_TOKEN_HEX['deep-navy']
  return BRAND_TOKEN_HEX[color] || color
}

export function IconWidget({
  icon = 'star',
  iconColor = 'deep-navy',
  iconSize = 'md',
  iconStyle = 'plain',
  linkType = 'none',
  pageId,
  href,
  newTab = false,
  ariaLabel,
  _resolved,
}: IconWidgetProps) {
  const { slug: clientSlug } = useClientPageSlug(pageId, _resolved?.pageSlug)
  const sizePx = PIXEL_SIZES[iconSize] || PIXEL_SIZES.md
  const containerSizeClass = CONTAINER_SIZES[iconSize] || CONTAINER_SIZES.md
  const resolvedColor = resolveIconColor(iconColor)

  const isCircleBg = iconStyle === 'circle-bg'
  const isCircleBorder = iconStyle === 'circle-border'

  const iconCore = (
    <BrandIcon name={icon} size={sizePx} aria-hidden="true" style={{ color: resolvedColor }} />
  )

  let renderedIcon: React.ReactNode = iconCore

  if (isCircleBg) {
    renderedIcon = (
      <div
        className={`${containerSizeClass} flex items-center justify-center rounded-full bg-soft-pink/80`}
      >
        {iconCore}
      </div>
    )
  } else if (isCircleBorder) {
    renderedIcon = (
      <div
        style={{ borderColor: resolvedColor }}
        className={`${containerSizeClass} flex items-center justify-center rounded-full border-2`}
      >
        {iconCore}
      </div>
    )
  }

  const linkProps = getSafeLink(linkType, href, _resolved?.pageSlug ?? clientSlug, newTab)

  if (linkProps) {
    return (
      <div className="inline-block">
        <a
          {...linkProps}
          aria-label={ariaLabel || 'Biểu tượng'}
          className="inline-flex items-center justify-center transition-opacity hover:opacity-80"
        >
          {renderedIcon}
        </a>
      </div>
    )
  }

  return (
    <div className="inline-block">
      <span aria-hidden="true" className="inline-flex items-center justify-center">
        {renderedIcon}
      </span>
    </div>
  )
}
