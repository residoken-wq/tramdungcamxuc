'use client'

import { resolveSafeLink } from '@/components/site/PathCard'
import { safeHref } from '@/lib/safe-href'

export interface WidgetLinkProps {
  linkType?: 'none' | 'url' | 'page'
  pageId?: string | number
  href?: string
  newTab?: boolean
  _resolved?: { pageSlug?: string | null }
}

/**
 * Pure & client-safe helper to compute safe anchor props.
 * Rejects javascript:, data:, and unallowed schemes.
 * Enforces `rel="noopener noreferrer"` when `newTab` is true.
 */
export function getSafeLink(
  linkType: 'none' | 'url' | 'page' | undefined,
  href: string | undefined,
  slug: string | null | undefined,
  newTab?: boolean,
): { href: string; target?: string; rel?: string } | null {
  if (!linkType || linkType === 'none') return null

  // Immediately reject dangerous pseudo-protocols or empty URLs
  if (linkType === 'url') {
    if (!href || href.trim() === '' || href.trim() === '#') {
      return null
    }
    if (/^\s*(javascript|data|vbscript):/i.test(href)) {
      return null
    }
  }

  if (linkType === 'page') {
    if (!slug || slug.trim() === '') {
      return null
    }
  }

  const resolved = resolveSafeLink(linkType, href, slug)
  if (!resolved || resolved === '#' || /^\s*(javascript|data|vbscript):/i.test(resolved)) {
    return null
  }

  const safe = safeHref(resolved)
  if (!safe || safe === '#' || /^\s*(javascript|data|vbscript):/i.test(safe)) {
    return null
  }

  return {
    href: safe,
    target: newTab ? '_blank' : undefined,
    rel: newTab ? 'noopener noreferrer' : undefined,
  }
}
