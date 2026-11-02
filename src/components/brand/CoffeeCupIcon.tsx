import React from 'react'
import type { BrandSvgProps } from './HeartLine'

/**
 * Biểu tượng ly cà phê nét mảnh thương hiệu Trạm Dừng Cảm Xúc.
 * Thiết kế tự vẽ: ly cà phê ấm áp kèm làn hơi bốc thanh thoát.
 */
export function CoffeeCupIcon({
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
      {/* Làn hơi bốc mảnh mai */}
      <path
        d="M8 2.5C7.2 3.5 8.8 4.5 8 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 1.5C11.2 2.7 12.8 3.8 12 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 2.5C15.2 3.5 16.8 4.5 16 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Thân ly và quai cầm */}
      <path
        d="M4 8H17V14C17 17 14.5 19 10.5 19C6.5 19 4 17 4 14V8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 10H19C20.1 10 21 10.9 21 12C21 13.1 20.1 14 19 14H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Đĩa lót ly */}
      <path
        d="M3 21H18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
