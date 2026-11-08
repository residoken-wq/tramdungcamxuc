'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { vi } from '@/lib/i18n/vi'
import type { FloatingCoffeeData } from '@/lib/site-shell.server'
import { CoffeeButton, CoffeeDonationModal, useCoffeeModal } from './FloatingCoffee'
import { FloatingChat, shouldHideFloatingChat } from './FloatingChat'

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
  const coffeeModal = useCoffeeModal()

  // CF-02: coffee shows on every page (Hana 02/11); Zalo keeps its hide list
  const isCoffeeVisible = Boolean(floatingCoffee && floatingCoffee.qrSrc)

  const isChatVisible = Boolean(
    showFloatingChat && zaloChatUrl && !shouldHideFloatingChat(pathname),
  )

  if (!isCoffeeVisible && !isChatVisible) {
    return null
  }

  return (
    <>
      <aside
        aria-label={vi.cf01.floatingActions.ariaLabel}
        className={`fixed right-4 sm:right-6 z-30 flex flex-col items-end gap-3 ${className}`}
        style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        {isCoffeeVisible && (
          <CoffeeButton
            label={floatingCoffee?.title}
            onOpen={coffeeModal.open}
            buttonRef={coffeeModal.buttonRef}
          />
        )}
        {isChatVisible && (
          <FloatingChat
            showFloatingChat={showFloatingChat}
            zaloChatUrl={zaloChatUrl}
            isStandalone={false}
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
