import React from 'react'
import { sanitizeRichText } from '@/lib/html/sanitize-rich-text'
import { typographyClasses } from './style-defaults'

export interface TextWidgetProps {
  version?: number
  /**
   * Inside Puck this is the node Puck builds from the stored HTML (`richtext` field); the HTML is
   * sanitized in the page data before rendering (`sanitizePageRichText`). A plain string (used
   * outside Puck) is sanitized here.
   */
  content?: React.ReactNode
}

const PROSE =
  'max-w-none [&_p]:my-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-bright-magenta [&_a]:underline'

export function TextWidget({ content, _style }: TextWidgetProps & { _style?: unknown }) {
  const className = `${PROSE} ${typographyClasses(
    { textColor: 'text-deep-navy', fontFamily: 'font-body', lineHeight: 'leading-relaxed' },
    _style,
  )}`
  if (content == null || content === '') return null
  if (typeof content === 'string') {
    // REVIEW-REQUIRED: allow-list sanitizer before injecting HTML.
    return (
      <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }} />
    )
  }
  return <div className={className}>{content}</div>
}
