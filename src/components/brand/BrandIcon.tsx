import React from 'react'
import type { BrandIcon as BrandIconKey } from '@/lib/brand/icons'

export interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  name?: BrandIconKey | string | null
  className?: string
  size?: number | string
  width?: number | string
  height?: number | string
  title?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

type IconRenderer = () => React.ReactNode

const ICON_RENDERERS: Record<string, IconRenderer> = {
  target: () => (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
    </>
  ),
  layers: () => (
    <>
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  star: () => (
    <polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  heart: () => (
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  butterfly: () => (
    <path
      d="M12 5V19M12 5C10 3 6 3 4 6C2 9 4 13 12 14M12 5C14 3 18 3 20 6C22 9 20 13 12 14M12 14C9.5 15.5 5 17 6 20C7 22 10.5 20.5 12 19M12 14C14.5 15.5 19 17 18 20C17 22 13.5 20.5 12 19"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  leaf: () => (
    <>
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
    </>
  ),
  valve: () => (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 3.5V9.5M12 14.5V20.5M3.5 12H9.5M14.5 12H20.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  ),
  compass: () => (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <polygon
        points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  mask: () => (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 10h.01M15 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 14.5c1.2 1.5 2.5 2 4 2s2.8-.5 4-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  ),
  signpost: () => (
    <path
      d="M12 3v18M5 6h11l3 3-3 3H5V6z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  team: () => (
    <>
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="9"
        cy="7"
        r="4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  chat: () => (
    <path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  book: () => (
    <>
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  spark: () => (
    <path
      d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  shield: () => (
    <path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  mirror: () => (
    <>
      <ellipse cx="12" cy="10" rx="7" ry="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 18v4M8 22h8M10 7l4 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  ),
}

/**
 * Biểu tượng BrandIcon của Trạm Dừng Cảm Xúc
 * Hỗ trợ 16 key biểu tượng chuẩn trong BRAND_ICONS (Brand Book 2026).
 * Key lạ hoặc rỗng trả về null.
 */
export function BrandIcon({
  name,
  className = '',
  size,
  width,
  height,
  title,
  'aria-hidden': ariaHidden,
  ...props
}: BrandIconProps) {
  if (!name || typeof name !== 'string' || !ICON_RENDERERS[name]) {
    return null
  }

  const renderer = ICON_RENDERERS[name]
  const w = width ?? size ?? 24
  const h = height ?? size ?? 24
  const effectiveAriaHidden = ariaHidden !== undefined ? ariaHidden : title ? undefined : true

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={effectiveAriaHidden}
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {renderer()}
    </svg>
  )
}
