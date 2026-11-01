'use client'

import React from 'react'
import Image from 'next/image'
import { vi } from '@/lib/i18n/vi'
import { useClientPageSlug } from '@/puck/client-preview'
import { getSafeLink, type WidgetLinkProps } from './link-helper'

export type ImageWidgetWidth = '25' | '50' | '75' | '100'

export interface ImageWidgetProps extends WidgetLinkProps {
  version?: number
  mediaId?: string | number
  imageUrl?: string
  imageAlt?: string
  caption?: string
  imageSize?: ImageWidgetWidth
  puck?: { isEditing?: boolean }
}

const WIDTH_CLASSES: Record<ImageWidgetWidth, string> = {
  '25': 'w-full max-w-[25%]',
  '50': 'w-full max-w-[50%]',
  '75': 'w-full max-w-[75%]',
  '100': 'w-full max-w-full',
}

export function ImageWidget({
  imageUrl,
  imageAlt,
  caption,
  imageSize = '100',
  linkType = 'none',
  pageId,
  href,
  newTab = false,
  _resolved,
  puck,
}: ImageWidgetProps) {
  const isEditing = Boolean(puck?.isEditing)
  const { slug: clientSlug } = useClientPageSlug(pageId, _resolved?.pageSlug)

  if (!imageUrl) {
    if (isEditing) {
      return (
        <div
          data-eb-empty-image="true"
          className="flex min-h-[140px] w-full items-center justify-center rounded-xl border-2 border-dashed border-deep-navy/20 bg-warm-ivory/50 p-6 text-center font-ui text-xs font-semibold text-deep-navy/60"
        >
          {vi.eb06.image.emptyHint}
        </div>
      )
    }
    return null
  }

  const widthClass = WIDTH_CLASSES[imageSize] || WIDTH_CLASSES['100']
  const linkProps = getSafeLink(linkType, href, _resolved?.pageSlug ?? clientSlug, newTab)

  const imgElement = (
    <div className={`relative ${widthClass} mx-auto overflow-hidden rounded-[inherit]`}>
      <Image
        src={imageUrl}
        alt={imageAlt || 'Hình ảnh'}
        width={1200}
        height={800}
        sizes="(max-width: 768px) 100vw, 1200px"
        className="h-auto w-full object-contain rounded-[inherit]"
      />
    </div>
  )

  const content = linkProps ? (
    <a {...linkProps} className="inline-block w-full transition-opacity hover:opacity-90">
      {imgElement}
    </a>
  ) : (
    imgElement
  )

  return (
    <figure className="w-full">
      {content}
      {caption && caption.trim() ? (
        <figcaption className="mt-2 text-center font-body text-xs italic text-deep-navy/70">
          {caption.trim()}
        </figcaption>
      ) : null}
    </figure>
  )
}
