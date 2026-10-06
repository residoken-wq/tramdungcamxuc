'use client'

import React from 'react'
import Link from 'next/link'
import { track } from '@/lib/analytics/track'
import type { LibraryTab, LibraryTopic } from '@/lib/library'

export interface LibraryFilterLinkProps {
  href: string
  tab: LibraryTab
  topic?: LibraryTopic
  isActive: boolean
  children: React.ReactNode
  className?: string
  'aria-current'?: 'page' | undefined
}

/**
 * Thẻ liên kết chuyển tab hoặc chọn chủ đề trong thư viện.
 * Kích hoạt sự kiện đo lường `library_filtered` khi người dùng bấm, không gửi chuỗi tìm kiếm `q`.
 */
export function LibraryFilterLink({
  href,
  tab,
  topic,
  isActive,
  children,
  className = '',
  'aria-current': ariaCurrent,
}: LibraryFilterLinkProps) {
  const handleClick = () => {
    track('library_filtered', {
      tab,
      topic: topic || 'all',
    })
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-current={isActive ? (ariaCurrent ?? 'page') : undefined}
      className={className}
    >
      {children}
    </Link>
  )
}
