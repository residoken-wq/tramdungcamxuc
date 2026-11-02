'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { vi } from '@/lib/i18n/vi'
import type { FloatingCoffeeData } from '@/lib/site-shell.server'
import { FloatingCoffee } from './FloatingCoffee'
import { FloatingChat, shouldHideFloatingChat, shouldHideFloatingCoffee } from './FloatingChat'

export interface FloatingActionsProps {
  floatingCoffee?: FloatingCoffeeData | null
  showFloatingChat?: boolean | null
  zaloChatUrl?: string | null
  className?: string
}

export function FloatingActions({
  floatingCoffee,
  showFloatingChat,
  zaloChatUrl,
  className = '',
}: FloatingActionsProps) {
  const pathname = usePathname()

  const isCoffeeVisible = Boolean(
    floatingCoffee && floatingCoffee.qrSrc && !shouldHideFloatingCoffee(pathname),
  )

  const isChatVisible = Boolean(
    showFloatingChat && zaloChatUrl && !shouldHideFloatingChat(pathname),
  )

  if (!isCoffeeVisible && !isChatVisible) {
    return null
  }

  return (
    <aside
      aria-label={vi.cf01.floatingActions.ariaLabel}
      className={`fixed right-4 sm:right-6 z-30 flex flex-col items-end gap-3 ${className}`}
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
    >
      {isCoffeeVisible && <FloatingCoffee coffeeDonation={floatingCoffee} isStandalone={false} />}
      {isChatVisible && (
        <FloatingChat
          showFloatingChat={showFloatingChat}
          zaloChatUrl={zaloChatUrl}
          isStandalone={false}
        />
      )}
    </aside>
  )
}
