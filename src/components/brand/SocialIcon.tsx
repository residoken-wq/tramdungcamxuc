/**
 * SocialIcon
 *
 * SVG icon cho các mạng xã hội của Trạm Dừng Cảm Xúc.
 *
 * Nguồn vector:
 * - Facebook, TikTok, YouTube, LinkedIn, Shopee: Simple Icons (giấy phép CC0 1.0 Universal - Public Domain)
 * - Zalo: Lucide MessageCircle (giấy phép MIT) – biểu tượng trò chuyện trung tính
 */

import React from 'react'

export type SocialIconName = 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'zalo' | 'shopee'

export interface SocialIconProps extends React.SVGAttributes<SVGSVGElement> {
  name: SocialIconName
  size?: number | string
  className?: string
}

export function SocialIcon({
  name,
  size = 20,
  className = '',
  ...props
}: SocialIconProps): React.JSX.Element | null {
  const commonProps = {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'currentColor',
    'aria-hidden': true as const,
    className,
    ...props,
  }

  switch (name) {
    case 'facebook':
      return (
        <svg {...commonProps}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )

    case 'tiktok':
      return (
        <svg {...commonProps}>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      )

    case 'youtube':
      return (
        <svg {...commonProps}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )

    case 'linkedin':
      return (
        <svg {...commonProps}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
        </svg>
      )

    case 'zalo':
      return (
        <svg
          {...commonProps}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      )

    case 'shopee':
      return (
        <svg {...commonProps}>
          <path d="M19.919 7.781a2.094 2.094 0 0 0-.707-.947 2.12 2.12 0 0 0-1.183-.357h-2.17a3.87 3.87 0 0 0-7.718 0H5.97a2.12 2.12 0 0 0-1.183.357 2.094 2.094 0 0 0-.707.947c-.206.43-.298.905-.268 1.381l.995 10.963A2.99 2.99 0 0 0 7.784 23.1h8.432a2.99 2.99 0 0 0 2.977-2.92l.995-10.963a2.68 2.68 0 0 0-.269-1.436zM12 2.585a2.29 2.29 0 0 1 2.28 1.892H9.72A2.29 2.29 0 0 1 12 2.585zm6.587 17.439a1.41 1.41 0 0 1-1.371 1.492H7.784a1.41 1.41 0 0 1-1.371-1.492L5.42 9.061h2.421v2.368a.79.79 0 0 0 1.58 0V9.061h5.158v2.368a.79.79 0 1 0 1.58 0V9.061h2.421z" />
        </svg>
      )

    default:
      return null
  }
}

