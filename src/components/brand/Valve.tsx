import React from 'react'
import type { BrandSvgProps } from './HeartLine'

/**
 * Biểu tượng Van xả cảm xúc (Valve) Trạm Dừng Cảm Xúc
 * Biểu tượng cho sự giải tỏa, điều tiết và cân bằng cảm xúc.
 */
export function Valve({
  className = '',
  width = 24,
  height = 24,
  'aria-hidden': ariaHidden = true,
  ...props
}: BrandSvgProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={ariaHidden}
      className={`inline-block ${className}`}
      {...props}
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 3.5V9.5M12 14.5V20.5M3.5 12H9.5M14.5 12H20.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
