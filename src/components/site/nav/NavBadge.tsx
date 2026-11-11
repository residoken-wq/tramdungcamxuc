import React from 'react'

export interface NavBadgeProps {
  badge?: string | null
  className?: string
}

/**
 * Chip nhỏ nền soft-pink, chữ bright-magenta đậm (đạt chuẩn tương phản WCAG AA ~5.8:1),
 * đọc được bằng trình đọc màn hình qua aria-label.
 */
export function NavBadge({ badge, className = '' }: NavBadgeProps) {
  const text = badge?.trim()
  if (!text) return null

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-soft-pink text-bright-magenta border border-bright-magenta/20 select-none ml-1.5 align-middle leading-none ${className}`.trim()}
      aria-label={`Nhãn: ${text}`}
    >
      {text}
    </span>
  )
}

