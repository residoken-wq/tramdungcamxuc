import React from 'react'

export interface BrandSvgProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  width?: number | string
  height?: number | string
  'aria-hidden'?: boolean | 'true' | 'false'
}

/**
 * Nét trái tim thương hiệu Trạm Dừng Cảm Xúc
 * Đường nét thanh mảnh, uyển chuyển theo Brand Book 2026.
 */
export function HeartLine({
  className = '',
  width = 64,
  height = 24,
  'aria-hidden': ariaHidden = true,
  ...props
}: BrandSvgProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={ariaHidden}
      className={`inline-block ${className}`}
      {...props}
    >
      <path
        d="M2 13.5H16L20 7L24 17L28 10L32 14H35C35 11.2386 37.2386 9 40 9C42.0558 9 43.8242 10.2435 44.5936 12.0229C45.363 10.2435 47.1314 9 49.1872 9C51.9486 9 54.1872 11.2386 54.1872 14C54.1872 17.5 48.5 21.5 44.5936 23C40.6872 21.5 35 17.5 35 14H62"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
