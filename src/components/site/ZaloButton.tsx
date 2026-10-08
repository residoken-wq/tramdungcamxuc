'use client'

import React from 'react'
import { Button, type ButtonVariant, type ButtonSize } from '@/components/ui/Button'
import { safeHref } from '@/lib/safe-href'
import { track } from '@/lib/analytics/track'

export interface ZaloButtonProps {
  version?: number
  target?: 'chat' | 'group'
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  align?: 'left' | 'center' | 'right'
  zaloChatUrl?: string | null
  zaloGroupUrl?: string | null
  puck?: { isEditing?: boolean }
}

export function ZaloButton({
  target = 'chat',
  label = 'Nhắn tin qua Zalo',
  variant = 'secondary',
  size = 'md',
  align = 'center',
  zaloChatUrl,
  zaloGroupUrl,
  puck,
}: ZaloButtonProps) {
  const isEditing = puck?.isEditing ?? false
  const rawUrl = target === 'group' ? zaloGroupUrl : zaloChatUrl

  if (!rawUrl || rawUrl.trim() === '') {
    if (isEditing) {
      return (
        <div className="py-4 px-4 text-center">
          <span className="inline-block px-3 py-1.5 rounded-lg bg-soft-pink border border-bright-magenta/30 text-xs font-medium text-bright-magenta">
            {target === 'group'
              ? 'Chưa cấu hình Nhóm Zalo trong Cài đặt website'
              : 'Chưa cấu hình Liên kết trò chuyện Zalo trong Cài đặt website'}
          </span>
        </div>
      )
    }
    return null
  }

  const safeLink = safeHref(rawUrl)
  if (!safeLink) {
    return null
  }

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align]

  const handleClick = () => {
    track('zalo_chat_clicked', {
      target,
    })
  }

  return (
    <div className="py-4 px-4">
      <div className={`mx-auto max-w-5xl flex ${alignClasses}`}>
        <Button
          href={safeLink}
          variant={variant}
          size={size}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="inline-flex items-center gap-2"
        >
          {/* Zalo Speech Bubble Icon */}
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.86 7.04-.15.82-.6 2.38-1.54 3.46-.14.16-.07.41.13.48.24.08.68.14 1.25.14 2.12 0 4.14-1.22 5.09-1.92.71.19 1.45.3 2.21.3 5.52 0 10-4.03 10-9s-4.48-9-10-9z" />
          </svg>
          <span>{label}</span>
        </Button>
      </div>
    </div>
  )
}
