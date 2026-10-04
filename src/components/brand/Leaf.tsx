import React from 'react'
import type { BrandSvgProps } from './HeartLine'

/**
 * Họa tiết Lá (Leaf) Trạm Dừng Cảm Xúc
 * Đại diện cho sự nuôi dưỡng, hành động bền bỉ và sự bình yên tự nhiên.
 */
export function Leaf({
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
        d="M20 4C14 4 5 7 4 17C14 18 19 11 20 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17C7.5 13.5 12 10.5 17 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 14.5L11 16.5M13 11.5L15.5 13"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
