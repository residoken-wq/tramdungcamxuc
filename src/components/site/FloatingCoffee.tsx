'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import { safeHref } from '@/lib/safe-href'
import { CoffeeCupIcon } from '@/components/brand/CoffeeCupIcon'
import { Modal } from '@/components/ui/Modal'
import type { FloatingCoffeeData } from '@/lib/site-shell.server'
import { shouldHideFloatingCoffee } from './FloatingChat'

export interface FloatingCoffeeProps {
  coffeeDonation?: FloatingCoffeeData | null
  className?: string
  isStandalone?: boolean
}

export function FloatingCoffee({
  coffeeDonation,
  className = '',
  isStandalone = true,
}: FloatingCoffeeProps) {
  const pathname = usePathname()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Ẩn khi không có cấu hình hoặc thiếu ảnh QR
  if (!coffeeDonation || !coffeeDonation.qrSrc) {
    return null
  }

  // Ẩn trên các route học tập / rút thẻ / thanh toán / dùng thử
  if (shouldHideFloatingCoffee(pathname)) {
    return null
  }

  const handleOpen = () => {
    setIsModalOpen(true)
    track('coffee_opened')
  }

  const rawMomoUrl = coffeeDonation.momoUrl?.trim()
  const safeMomo = rawMomoUrl ? safeHref(rawMomoUrl) : null
  const safeMomoUrl = safeMomo && safeMomo.startsWith('https://') ? safeMomo : null

  const modalTitle = coffeeDonation.title?.trim() || vi.cf01.floatingCoffee.defaultTitle

  const button = (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleOpen}
      aria-label={vi.cf01.floatingCoffee.ariaLabel}
      className={`group flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border border-lavender-mist text-bright-magenta shadow-soft hover:bg-soft-pink hover:scale-105 active:scale-95 transition-all duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer ${
        !isStandalone ? className : ''
      }`}
    >
      <CoffeeCupIcon
        width={28}
        height={28}
        className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-200 motion-reduce:transition-none group-hover:rotate-6"
      />
      <span className="sr-only">{vi.cf01.floatingCoffee.ariaLabel}</span>
    </button>
  )

  const content = (
    <>
      {button}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        triggerRef={buttonRef}
      >
        <div className="flex flex-col items-center text-center">
          {coffeeDonation.message ? (
            <p className="text-sm text-deep-navy/80 mb-4 whitespace-pre-line leading-relaxed">
              {coffeeDonation.message}
            </p>
          ) : null}

          <div className="relative my-2 w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-lavender-mist/80 bg-white p-2 shadow-sm flex items-center justify-center">
            <Image
              src={coffeeDonation.qrSrc}
              alt={coffeeDonation.qrAlt || modalTitle}
              width={coffeeDonation.qrWidth || 260}
              height={coffeeDonation.qrHeight || 260}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <p className="text-xs sm:text-sm text-deep-navy/70 mt-3 mb-4 leading-relaxed">
            {vi.cf01.floatingCoffee.scanGuide}
          </p>

          {safeMomoUrl ? (
            <a
              href={safeMomoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('coffee_momo_clicked')}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full font-semibold text-sm bg-bright-magenta text-white hover:bg-accent-pink shadow-soft transition-all duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer mt-1"
            >
              {vi.cf01.floatingCoffee.openMomo}
            </a>
          ) : null}
        </div>
      </Modal>
    </>
  )

  if (!isStandalone) {
    return content
  }

  return (
    <aside
      aria-label={vi.cf01.floatingCoffee.ariaLabel}
      className={`fixed right-4 sm:right-6 z-30 ${className}`}
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
    >
      {content}
    </aside>
  )
}
