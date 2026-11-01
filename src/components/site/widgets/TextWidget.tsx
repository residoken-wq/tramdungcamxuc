import React from 'react'
import { sanitizeRichText } from '@/lib/html/sanitize-rich-text'

export interface TextWidgetProps {
  version?: number
  content?: string
}

export function TextWidget({
  content = '<p>Nhập đoạn văn bản của bạn tại đây...</p>',
}: TextWidgetProps) {
  const safeHtml = sanitizeRichText(content)

  return (
    <div
      className="prose-clean max-w-none font-body leading-relaxed text-deep-navy [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-bright-magenta [&_a]:underline hover:[&_a]:text-accent-pink"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
