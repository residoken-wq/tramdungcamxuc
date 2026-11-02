import React from 'react'
import { sanitizeCustomHtml } from '@/lib/html/sanitize-rich-text'
import { vi } from '@/lib/i18n/vi'

export interface HtmlWidgetProps {
  version?: number
  html?: string
  isEditing?: boolean
  isLocked?: boolean
}

/**
 * REVIEW-REQUIRED: Custom HTML widget.
 * Renders user-provided HTML on the public page and in the editor canvas.
 * When locked in DesignSystem, renders nothing on the public page and a locked notice in the editor.
 */
export function HtmlWidget({ html, isEditing, isLocked }: HtmlWidgetProps) {
  if (isLocked) {
    if (isEditing) {
      return (
        <div
          role="note"
          className="rounded border border-dashed border-deep-navy/30 bg-soft-pink/30 p-3 text-center text-xs text-deep-navy"
        >
          {vi.eb09.htmlLockedNotice}
        </div>
      )
    }
    return null
  }

  if (!html || typeof html !== 'string' || !html.trim()) {
    if (isEditing) {
      return (
        <div className="rounded border border-dashed border-deep-navy/20 p-3 text-center text-xs text-deep-navy/60">
          Chưa có nội dung HTML
        </div>
      )
    }
    return null
  }

  // REVIEW-REQUIRED: Pure allowlist-based sanitizer runs before rendering.
  const clean = sanitizeCustomHtml(html)
  if (!clean) return null

  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
