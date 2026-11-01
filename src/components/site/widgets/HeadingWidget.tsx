'use client'

import React from 'react'
import { useClientPageSlug } from '@/puck/client-preview'
import { getSafeLink, type WidgetLinkProps } from './link-helper'

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface HeadingWidgetProps extends WidgetLinkProps {
  version?: number
  text?: React.ReactNode
  level?: HeadingLevel
}

const DEFAULT_LEVEL_CLASSES: Record<HeadingLevel, string> = {
  h1: 'text-3xl sm:text-4xl md:text-5xl font-bold font-display text-deep-navy leading-tight',
  h2: 'text-2xl sm:text-3xl md:text-4xl font-bold font-display text-deep-navy leading-tight',
  h3: 'text-xl sm:text-2xl font-bold font-display text-deep-navy leading-snug',
  h4: 'text-lg sm:text-xl font-bold font-display text-deep-navy leading-snug',
  h5: 'text-base sm:text-lg font-bold font-display text-deep-navy leading-normal',
  h6: 'text-sm sm:text-base font-bold font-display text-deep-navy leading-normal',
}

export function HeadingWidget({
  text = 'Tiêu đề',
  level = 'h2',
  linkType = 'none',
  pageId,
  href,
  newTab = false,
  _resolved,
}: HeadingWidgetProps) {
  const { slug: clientSlug } = useClientPageSlug(pageId, _resolved?.pageSlug)
  const Tag = level && /^h[1-6]$/.test(level) ? level : 'h2'
  const defaultClass = DEFAULT_LEVEL_CLASSES[Tag] || DEFAULT_LEVEL_CLASSES.h2

  const linkProps = getSafeLink(linkType, href, _resolved?.pageSlug ?? clientSlug, newTab)

  const content = linkProps ? (
    <a {...linkProps} className="hover:opacity-80 transition-opacity">
      {text}
    </a>
  ) : (
    text
  )

  return <Tag className={defaultClass}>{content}</Tag>
}
