import React from 'react'
import { textTarget } from '@/puck/style/text-target'

export const TITLE_HIGHLIGHT_COLOR = 'text-bright-magenta'
export const TITLE_HIGHLIGHT_DARK_COLOR = 'text-soft-pink'

export interface RenderHighlightedTitleOptions {
  isDark?: boolean
  highlightColor?: string
}

/**
 * Tách chuỗi tiêu đề thành các thẻ <span> cho phần được đánh dấu *...*.
 * - Không có '*' -> trả về chuỗi gốc (giữ nguyên HTML snapshot cũ).
 * - Dấu '*' lẻ -> giữ nguyên ký tự.
 * - Render an toàn bằng React Node, KHÔNG dùng dangerouslySetInnerHTML.
 */
export function renderHighlightedTitle(
  text: string | null | undefined,
  options?: RenderHighlightedTitleOptions,
): React.ReactNode {
  if (!text) return text
  if (!text.includes('*')) return text

  const isDark = options?.isDark ?? false
  const highlightClass =
    options?.highlightColor ?? (isDark ? TITLE_HIGHLIGHT_DARK_COLOR : TITLE_HIGHLIGHT_COLOR)

  const parts: React.ReactNode[] = []
  const regex = /\*([^*]+)\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let matchedAny = false

  while ((match = regex.exec(text)) !== null) {
    matchedAny = true
    const matchStart = match.index
    const matchEnd = regex.lastIndex

    if (matchStart > lastIndex) {
      parts.push(text.slice(lastIndex, matchStart))
    }

    parts.push(
      <span key={`hl-${matchStart}`} className={highlightClass}>
        {match[1]}
      </span>,
    )

    lastIndex = matchEnd
  }

  if (!matchedAny) return text

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export interface TwoToneTitleProps {
  id?: string
  line1?: string
  line2?: string
  line1ClassName?: string
  line2ClassName?: string
  isDark?: boolean
}

export function TwoToneTitle({
  id,
  line1,
  line2,
  line1ClassName = '',
  line2ClassName = '',
  isDark,
}: TwoToneTitleProps) {
  const l1Class = line1ClassName ? `block ${line1ClassName}` : 'block'
  const l2Class = line2ClassName ? `block ${line2ClassName}` : 'block'

  const l1Dark =
    isDark ??
    Boolean(
      line1ClassName?.includes('text-white') ||
        line1ClassName?.includes('white') ||
        line1ClassName?.includes('text-soft-pink'),
    )
  const l2Dark =
    isDark ??
    Boolean(
      line2ClassName?.includes('text-white') ||
        line2ClassName?.includes('white') ||
        line2ClassName?.includes('text-soft-pink'),
    )

  return (
    <>
      <span {...textTarget(id, 'titleLine1')} className={l1Class}>
        {renderHighlightedTitle(line1, { isDark: l1Dark })}
      </span>
      {line2 ? (
        <>
          {' '}
          <span {...textTarget(id, 'titleLine2')} className={l2Class}>
            {renderHighlightedTitle(line2, { isDark: l2Dark })}
          </span>
        </>
      ) : null}
    </>
  )
}
