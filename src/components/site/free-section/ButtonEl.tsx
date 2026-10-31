'use client'

import React from 'react'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { useClientPageSlug } from '@/puck/client-preview'
import { resolveSafeLink } from '../PathCard'

export interface ButtonElProps {
  version?: number
  text?: React.ReactNode
  linkType?: 'url' | 'page'
  pageId?: string | number
  href?: string
  variant?: ButtonVariant
  size?: ButtonSize
  _resolved?: { pageSlug?: string | null }
}

/** Button element of the free section (PK-13). Link: a page of the site or a typed URL. */
export function ButtonEl({
  text,
  linkType = 'url',
  pageId,
  href,
  variant = 'primary',
  size = 'md',
  _resolved,
}: ButtonElProps) {
  const { slug: clientSlug } = useClientPageSlug(pageId, _resolved?.pageSlug)
  if (!text) return null
  const finalHref = resolveSafeLink(linkType, href, _resolved?.pageSlug ?? clientSlug)
  return (
    <div className="pt-2">
      <Button href={finalHref} variant={variant} size={size}>
        {text}
      </Button>
    </div>
  )
}
