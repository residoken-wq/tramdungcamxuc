import React from 'react'
import { textTarget } from '@/puck/style/text-target'
import { TitleHighlightAnimator } from './TitleHighlightAnimator'

export type TitleHighlightStyle = 'color' | 'underline' | 'pill'
export type TitleHighlightAnimation = 'none' | 'draw' | 'pop'

export const TITLE_HIGHLIGHT_COLOR = 'text-bright-magenta'
export const TITLE_HIGHLIGHT_DARK_COLOR = 'text-soft-pink'

export const TITLE_STRIKE_COLOR = 'text-deep-navy/60'
export const TITLE_STRIKE_DARK_COLOR = 'text-soft-pink/80'

export const TITLE_UNDERLINE_CLASS =
  'text-bright-magenta underline underline-offset-4 decoration-2 decoration-accent-pink'
export const TITLE_UNDERLINE_DARK_CLASS =
  'text-soft-pink underline underline-offset-4 decoration-2 decoration-soft-pink'

export const TITLE_PILL_CLASS =
  'bg-bright-magenta text-white px-2 py-0.5 rounded-md inline-block'
export const TITLE_PILL_DARK_CLASS =
  'bg-soft-pink text-deep-navy px-2 py-0.5 rounded-md inline-block'

export interface RenderHighlightedTitleOptions {
  isDark?: boolean
  highlightColor?: string
  style?: TitleHighlightStyle
  animation?: TitleHighlightAnimation
}

/**
 * Kiểm tra xem chuỗi có chứa cặp ký tự nhấn *...* hoặc gạch ngang ~...~ hay không.
 */
export function hasTitleHighlight(text: unknown): boolean {
  if (typeof text !== 'string') return false
  return /\*([^*]+)\*/.test(text) || /~([^~]+)~/.test(text)
}

/**
 * Bỏ cả cặp dấu sao *...* và dấu ngã ~...~ để lấy văn bản thuần cho nhãn trình đọc màn hình (aria-label).
 * Nếu đầu vào không phải chuỗi (VD: React element khi sửa trực tiếp trên Puck) -> trả về undefined.
 */
export function stripTitleHighlight(text: unknown): string | undefined {
  if (typeof text !== 'string') return undefined
  return text.replace(/\*([^*]+)\*/g, '$1').replace(/~([^~]+)~/g, '$1')
}

/**
 * Tách chuỗi tiêu đề thành các thẻ <span> (nhấn *...*) và <s> (gạch ngang ~...~).
 * - Không phải chuỗi (VD: React element khi sửa trực tiếp trên Puck) -> trả về nguyên gốc.
 * - Không có '*' và không có '~' -> trả về chuỗi gốc (giữ nguyên HTML snapshot cũ).
 * - Dấu '*' hoặc '~' lẻ -> giữ nguyên ký tự.
 * - Hỗ trợ 3 kiểu nhấn: 'color' (tô màu), 'underline' (gạch chân), 'pill' (nền bo góc).
 * - Hỗ trợ hiệu ứng: 'none' (mặc định), 'draw' (vẽ dần), 'pop' (nổi lên).
 * - Render an toàn bằng React Node, KHÔNG dùng dangerouslySetInnerHTML.
 */
export function renderHighlightedTitle(
  text: React.ReactNode,
  options?: RenderHighlightedTitleOptions,
): React.ReactNode {
  if (!text) return text
  if (typeof text !== 'string') return text
  if (!text.includes('*') && !text.includes('~')) return text

  const isDark = options?.isDark ?? false
  const style = options?.style ?? 'color'
  const animation = options?.animation ?? 'none'

  // Xác định class cho phần nhấn *...*
  let highlightClass =
    options?.highlightColor ?? (isDark ? TITLE_HIGHLIGHT_DARK_COLOR : TITLE_HIGHLIGHT_COLOR)
  if (style === 'underline') {
    highlightClass = isDark ? TITLE_UNDERLINE_DARK_CLASS : TITLE_UNDERLINE_CLASS
  } else if (style === 'pill') {
    highlightClass = isDark ? TITLE_PILL_DARK_CLASS : TITLE_PILL_CLASS
  }

  // Xác định class cho phần gạch ngang ~...~
  const strikeColorClass = isDark ? TITLE_STRIKE_DARK_COLOR : TITLE_STRIKE_COLOR

  const parts: React.ReactNode[] = []
  const regex = /(\*([^*]+)\*|~([^~]+)~)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let matchedAny = false
  let tokenIndex = 0

  while ((match = regex.exec(text)) !== null) {
    matchedAny = true
    const matchStart = match.index
    const matchEnd = regex.lastIndex

    if (matchStart > lastIndex) {
      parts.push(text.slice(lastIndex, matchStart))
    }

    if (match[2] !== undefined) {
      // Khớp *...* (Nhấn chữ)
      const tokenClasses =
        animation !== 'none'
          ? `title-hl-token title-hl-${style} ${style === 'underline' && animation === 'draw' ? 'title-underline-line' : ''}`
          : ''

      const finalClass = tokenClasses ? `${highlightClass} ${tokenClasses}`.trim() : highlightClass

      parts.push(
        <span
          key={`hl-${matchStart}`}
          data-hl-index={animation !== 'none' ? tokenIndex : undefined}
          className={finalClass}
        >
          {match[2]}
        </span>,
      )
      tokenIndex++
    } else if (match[3] !== undefined) {
      // Khớp ~...~ (Gạch ngang tương phản - dùng <s>)
      const strikeBaseClass =
        animation === 'draw'
          ? `title-strike-token title-strike-line ${strikeColorClass}`
          : animation !== 'none'
            ? `title-strike-token line-through ${strikeColorClass}`
            : `line-through ${strikeColorClass}`

      parts.push(
        <s
          key={`st-${matchStart}`}
          data-hl-index={animation !== 'none' ? tokenIndex : undefined}
          className={strikeBaseClass.trim()}
        >
          {match[3]}
        </s>,
      )
      tokenIndex++
    }

    lastIndex = matchEnd
  }

  if (!matchedAny) return text

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  if (animation && animation !== 'none') {
    return <TitleHighlightAnimator animation={animation}>{parts}</TitleHighlightAnimator>
  }

  return parts
}

export interface TwoToneTitleProps {
  id?: string
  line1?: string | null
  line2?: string | null
  line1ClassName?: string
  line2ClassName?: string
  isDark?: boolean
  highlightStyle?: TitleHighlightStyle
  highlightAnimation?: TitleHighlightAnimation
}

function hasTitleContent(val: React.ReactNode): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'string') return val.trim().length > 0
  return true
}

export function TwoToneTitle({
  id,
  line1,
  line2,
  line1ClassName = '',
  line2ClassName = '',
  isDark,
  highlightStyle,
  highlightAnimation,
}: TwoToneTitleProps) {
  const hasL1 = hasTitleContent(line1)
  const hasL2 = hasTitleContent(line2)

  if (!hasL1 && !hasL2) return null

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
      {hasL1 && (
        <span {...textTarget(id, 'titleLine1')} className={l1Class}>
          {renderHighlightedTitle(line1, {
            isDark: l1Dark,
            style: highlightStyle,
            animation: highlightAnimation,
          })}
        </span>
      )}
      {hasL2 ? (
        <>
          {hasL1 ? ' ' : null}
          <span {...textTarget(id, 'titleLine2')} className={l2Class}>
            {renderHighlightedTitle(line2, {
              isDark: l2Dark,
              style: highlightStyle,
              animation: highlightAnimation,
            })}
          </span>
        </>
      ) : null}
    </>
  )
}
