import React from 'react'
import type { BrandSvgProps } from './HeartLine'

/**
 * Đường kẻ mảnh phân cách Trạm Dừng Cảm Xúc
 * Dùng làm đường ngăn nhẹ giữa các khối nội dung theo Brand Book 2026.
 */
export function ThinLine({
  className = '',
  width = '100%',
  height = 8,
  'aria-hidden': ariaHidden = true,
  ...props
}: BrandSvgProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden={ariaHidden}
      className={`block ${className}`}
      {...props}
    >
      <line
        x1="0"
        y1="4"
        x2="200"
        y2="4"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        strokeDasharray="4 4"
      />
      <circle cx="100" cy="4" r="2" fill="currentColor" />
    </svg>
  )
}
