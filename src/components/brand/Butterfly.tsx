import React from 'react'
import type { BrandSvgProps } from './HeartLine'

/**
 * Biểu tượng Bướm chuyển mình (Butterfly) Trạm Dừng Cảm Xúc
 * Đại diện cho sự vững vàng chuyển mình và phát triển tự nhiên.
 */
export function Butterfly({
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
      <path
        d="M12 5V19M12 5C10 3 6 3 4 6C2 9 4 13 12 14M12 5C14 3 18 3 20 6C22 9 20 13 12 14M12 14C9.5 15.5 5 17 6 20C7 22 10.5 20.5 12 19M12 14C14.5 15.5 19 17 18 20C17 22 13.5 20.5 12 19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
