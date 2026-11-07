import React from 'react'
import type { BrandSvgProps } from './HeartLine'

/**
 * Biểu tượng ly cà phê mang đi của Trạm Dừng Cảm Xúc (tự vẽ, 07/11): nắp, thân thuôn,
 * phần cà phê tô màu. Viền theo `currentColor` (nút đặt `text-deep-navy`); phần cà phê
 * `fill-butter-cream` – màu vàng trong bảng màu brand book.
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
      {/* Phần cà phê trong ly (mặt hơi gợn) */}
      <path
        data-coffee-fill=""
        d="M6.5 11.6C8.6 10.7 10.4 12.3 12.3 11.6C14.1 10.9 15.9 10.9 17.5 11.5L16.6 19.9C16.5 20.6 16 21 15.4 21H8.6C8 21 7.5 20.6 7.4 19.9L6.5 11.6Z"
        className="fill-butter-cream"
      />
      <path
        d="M6.5 11.6C8.6 10.7 10.4 12.3 12.3 11.6C14.1 10.9 15.9 10.9 17.5 11.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Thân ly thuôn dần xuống đáy */}
      <path
        d="M5.9 7L7.4 20.2C7.5 21 8.1 21.6 8.9 21.6H15.1C15.9 21.6 16.5 21 16.6 20.2L18.1 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Vành nắp */}
      <path
        d="M4.5 5.3C4.5 4.5 5.1 3.9 5.9 3.9H18.1C18.9 3.9 19.5 4.5 19.5 5.3V5.6C19.5 6.4 18.9 7 18.1 7H5.9C5.1 7 4.5 6.4 4.5 5.6V5.3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Chóp nắp */}
      <path
        d="M7.6 3.9C7.8 2.8 8.5 2.2 9.5 2.2H14.5C15.5 2.2 16.2 2.8 16.4 3.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
