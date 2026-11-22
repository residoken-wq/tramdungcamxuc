'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { vi } from '@/lib/i18n/vi'
import type { FloatingCoffeeData } from '@/lib/site-shell.server'
import {
  CoffeeButton,
  CoffeeDonationModal,
  shouldHideFloatingCoffee,
  useCoffeeModal,
} from './FloatingCoffee'
import { FloatingChat, shouldHideFloatingChat } from './FloatingChat'
import { FloatingEmail } from './FloatingEmail'

export interface FloatingActionsProps {
  floatingCoffee?: FloatingCoffeeData | null
  showFloatingChat?: boolean | null
  zaloChatUrl?: string | null
  /** `mailto:` link; shown together with Zalo (same "Hiện nút Email & Zalo nổi" switch). */
  emailHref?: string | null
  className?: string
}

export function FloatingActions({
  floatingCoffee,
  showFloatingChat,
  zaloChatUrl,
  emailHref,
  className = '',
}: FloatingActionsProps) {
  const pathname = usePathname()
  const coffeeModal = useCoffeeModal()

  // AU-01: ẩn ly cà phê trên trang bảng Habit (/habit/tracker) vì đã có nút nổi riêng; các trang khác vẫn hiện
  const isCoffeeVisible = Boolean(
    floatingCoffee && floatingCoffee.qrSrc && !shouldHideFloatingCoffee(pathname),
  )

  const contactAllowed = Boolean(showFloatingChat && !shouldHideFloatingChat(pathname))
  const isChatVisible = contactAllowed && Boolean(zaloChatUrl)
  const isEmailVisible = contactAllowed && Boolean(emailHref)

  if (!isCoffeeVisible && !isChatVisible && !isEmailVisible) {
    return null
  }

  return (
    <>
      <aside
        aria-label={vi.cf01.floatingActions.ariaLabel}
        className={`fixed right-4 sm:right-6 z-30 flex flex-col items-end gap-3 ${className}`}
        style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Top to bottom: email, Zalo, coffee cup */}
        {isEmailVisible && emailHref && <FloatingEmail href={emailHref} />}
        {isChatVisible && (
          <FloatingChat
            showFloatingChat={showFloatingChat}
            zaloChatUrl={zaloChatUrl}
            isStandalone={false}
          />
        )}
        {isCoffeeVisible && (
          <CoffeeButton
            label={floatingCoffee?.title}
            onOpen={coffeeModal.open}
            buttonRef={coffeeModal.buttonRef}
          />
        )}
      </aside>
      {/* CF-01c: modal outside the fixed column so it stacks above the sticky navbar */}
      {isCoffeeVisible && floatingCoffee && (
        <CoffeeDonationModal
          coffeeDonation={floatingCoffee}
          isOpen={coffeeModal.isOpen}
          onClose={coffeeModal.close}
          triggerRef={coffeeModal.buttonRef}
        />
      )}
    </>
  )
}
