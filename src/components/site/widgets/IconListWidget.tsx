'use client'

import React from 'react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import { useClientPageSlug } from '@/puck/client-preview'
import { getSafeLink, type WidgetLinkProps } from './link-helper'
import { typographyClasses, widgetColor } from './style-defaults'

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
  const color = widgetColor(item.iconColor || defaultColor, 'accent-pink')

  const linkProps = getSafeLink(
    item.linkType,
    item.href,
    item._resolved?.pageSlug ?? clientSlug,
    item.newTab,
  )

  const textNode = linkProps ? (
    <a
      {...linkProps}
      className="underline-offset-2 transition-opacity hover:underline hover:opacity-80"
    >
      {item.text}
    </a>
  ) : (
    <span>{item.text}</span>
  )

  return (
    <li className="flex items-center gap-2.5">
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
  _style,
}: IconListWidgetProps & { _style?: unknown }) {
  if (!items || items.length === 0) return null

  const listClass =
    layout === 'horizontal'
      ? 'flex flex-wrap items-center gap-4 sm:gap-6 list-none m-0 p-0'
      : 'flex flex-col gap-3 list-none m-0 p-0'
  const textClass = typographyClasses(
    { textColor: 'text-deep-navy', fontFamily: 'font-body', fontSize: 'text-sm sm:text-base' },
    _style,
  )

  return (
    <ul className={`${listClass} ${textClass}`}>
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
