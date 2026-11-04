'use client'

import React from 'react'
import { useClientPageSlug } from '@/puck/client-preview'
import { getSafeLink, type WidgetLinkProps } from './link-helper'
import { typographyClasses, type TypographyDefaults } from './style-defaults'
import { textTarget } from '@/puck/style/text-target'

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface HeadingWidgetProps extends WidgetLinkProps {
  version?: number
  text?: React.ReactNode
  level?: HeadingLevel
}

const SIZE: Record<HeadingLevel, string> = {
  h1: 'text-3xl sm:text-4xl md:text-5xl',
  h2: 'text-2xl sm:text-3xl md:text-4xl',
  h3: 'text-xl sm:text-2xl',
  h4: 'text-lg sm:text-xl',
  h5: 'text-base sm:text-lg',
  h6: 'text-sm sm:text-base',
}

const defaultsFor = (level: HeadingLevel): TypographyDefaults => ({
  textColor: 'text-deep-navy',
  fontSize: SIZE[level],
  fontFamily: 'font-display',
  fontWeight: 'font-bold',
  lineHeight: '!leading-[var(--tdcx-title-lh,1.3)]',
})

export function HeadingWidget({
  id,
  text = 'Tiêu đề',
  level = 'h2',
  linkType = 'none',
  pageId,
  href,
  newTab = false,
  _resolved,
  _style,
}: HeadingWidgetProps & { id?: string; _style?: unknown }) {
  const { slug: clientSlug } = useClientPageSlug(pageId, _resolved?.pageSlug)
  const Tag: HeadingLevel = level && /^h[1-6]$/.test(level) ? level : 'h2'
  const defaultClass = typographyClasses(defaultsFor(Tag), _style)

  const linkProps = getSafeLink(linkType, href, _resolved?.pageSlug ?? clientSlug, newTab)

  const content = linkProps ? (
    <a {...linkProps} className="hover:opacity-80 transition-opacity">
      {text}
    </a>
  ) : (
    text
  )

  return (
    <Tag className={defaultClass} {...textTarget(id, 'text')}>
      {content}
    </Tag>
  )
}
