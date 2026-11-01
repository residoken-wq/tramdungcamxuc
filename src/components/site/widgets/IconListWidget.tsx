'use client'

import React from 'react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import { useClientPageSlug } from '@/puck/client-preview'
import { resolveIconColor } from './IconWidget'
import { getSafeLink, type WidgetLinkProps } from './link-helper'

export interface IconListItem extends WidgetLinkProps {
  text: string
  icon?: string
  iconColor?: string
}

export interface IconListWidgetProps {
  version?: number
  layout?: 'vertical' | 'horizontal'
  defaultIcon?: string
  iconColor?: string
  items?: IconListItem[]
}

function IconListItemView({
  item,
  defaultIcon,
  defaultColor,
}: {
  item: IconListItem
  defaultIcon: string
  defaultColor: string
}) {
  const { slug: clientSlug } = useClientPageSlug(item.pageId, item._resolved?.pageSlug)
  const iconName = item.icon && item.icon.trim() ? item.icon : defaultIcon
  const color = resolveIconColor(item.iconColor || defaultColor)

  const linkProps = getSafeLink(
    item.linkType,
    item.href,
    item._resolved?.pageSlug ?? clientSlug,
    item.newTab,
  )

  const textNode = linkProps ? (
    <a {...linkProps} className="text-deep-navy transition-colors hover:text-bright-magenta">
      {item.text}
    </a>
  ) : (
    <span className="text-deep-navy">{item.text}</span>
  )

  return (
    <li className="flex items-center gap-2.5 font-body text-sm sm:text-base">
      <BrandIcon
        name={iconName}
        size={18}
        aria-hidden="true"
        style={{ color }}
        className="shrink-0"
      />
      {textNode}
    </li>
  )
}

export function IconListWidget({
  layout = 'vertical',
  defaultIcon = 'check',
  iconColor = 'accent-pink',
  items = [],
}: IconListWidgetProps) {
  if (!items || items.length === 0) return null

  const listClass =
    layout === 'horizontal'
      ? 'flex flex-wrap items-center gap-4 sm:gap-6 list-none m-0 p-0'
      : 'flex flex-col gap-3 list-none m-0 p-0'

  return (
    <ul className={listClass}>
      {items.map((item, idx) => (
        <IconListItemView
          key={idx}
          item={item}
          defaultIcon={defaultIcon}
          defaultColor={iconColor}
        />
      ))}
    </ul>
  )
}
