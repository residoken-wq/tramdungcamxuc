'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { vi } from '@/lib/i18n/vi'
import { track } from '@/lib/analytics/track'
import { safeHref } from '@/lib/safe-href'
import { CoffeeCupIcon } from '@/components/brand/CoffeeCupIcon'
import { Modal } from '@/components/ui/Modal'
import type { FloatingCoffeeData } from '@/lib/site-shell.server'

interface CoffeeButtonProps {
  onOpen: () => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
}

/** Round floating button with the coffee cup icon. */
export function CoffeeButton({ onOpen, buttonRef }: CoffeeButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onOpen}
      aria-label={vi.cf01.floatingCoffee.ariaLabel}
      className="group flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border border-lavender-mist text-deep-navy shadow-soft hover:bg-soft-pink hover:scale-105 active:scale-95 transition-all duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer"
    >
      <CoffeeCupIcon
        width={28}
        height={28}
        className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-200 motion-reduce:transition-none group-hover:rotate-6"
      />
      <span className="sr-only">{vi.cf01.floatingCoffee.ariaLabel}</span>
    </button>
  )
}

interface CoffeeDonationModalProps {
  coffeeDonation: FloatingCoffeeData
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

/**
 * QR modal. CF-01c: must be rendered OUTSIDE the fixed floating column – a `position: fixed`
 * parent creates its own stacking context (z-30), so the modal's z-50 would sit under the
 * sticky navbar (z-40).
 */
export function CoffeeDonationModal({
  coffeeDonation,
  isOpen,
  onClose,
  triggerRef,
}: CoffeeDonationModalProps) {
  const rawMomoUrl = coffeeDonation.momoUrl?.trim()
  const safeMomo = rawMomoUrl ? safeHref(rawMomoUrl) : null
  const safeMomoUrl = safeMomo && safeMomo.startsWith('https://') ? safeMomo : null
  const modalTitle = coffeeDonation.title?.trim() || vi.cf01.floatingCoffee.defaultTitle

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} triggerRef={triggerRef}>
      <div className="flex flex-col items-center text-center">
        {coffeeDonation.message ? (
          <p className="text-sm text-deep-navy/80 mb-4 whitespace-pre-line leading-relaxed">
            {coffeeDonation.message}
          </p>
        ) : null}

        {/* CF-03: a QR must stay pixel-sharp to scan – shown large (up to 340 px, natural aspect
            ratio, no square crop) and served as the original file (`unoptimized`: no resize /
            lossy re-encode by the image optimizer). */}
        <div className="my-2 w-full max-w-[340px] rounded-2xl border border-lavender-mist/80 bg-white p-2 shadow-sm">
          <Image
            src={coffeeDonation.qrSrc}
            alt={coffeeDonation.qrAlt || modalTitle}
            width={coffeeDonation.qrWidth || 340}
            height={coffeeDonation.qrHeight || 340}
            unoptimized
            className="block w-full h-auto rounded-xl"
          />
        </div>
        <a
          href={coffeeDonation.qrSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-xs font-semibold text-bright-magenta underline underline-offset-2 hover:text-accent-pink focus-visible:outline-2 focus-visible:outline-deep-navy"
        >
          {vi.cf01.floatingCoffee.openFullQr}
        </a>

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
  )
}

/** Open / close state of the coffee modal, shared by FloatingCoffee and FloatingActions. */
export function useCoffeeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const open = () => {
    setIsOpen(true)
    track('coffee_opened')
  }
  const close = () => setIsOpen(false)
  return { isOpen, open, close, buttonRef }
}

export interface FloatingCoffeeProps {
  coffeeDonation?: FloatingCoffeeData | null
  className?: string
}

/** Standalone coffee widget (own fixed column). The site shell uses FloatingActions instead. */
export function FloatingCoffee({ coffeeDonation, className = '' }: FloatingCoffeeProps) {
  const modal = useCoffeeModal()

  // CF-02: hiện ở mọi trang (Hana 02/11); chỉ ẩn khi chưa bật hoặc thiếu ảnh QR
  if (!coffeeDonation || !coffeeDonation.qrSrc) {
    return null
  }

  return (
    <>
      <aside
        aria-label={vi.cf01.floatingCoffee.ariaLabel}
        className={`fixed right-4 sm:right-6 z-30 ${className}`}
        style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        <CoffeeButton onOpen={modal.open} buttonRef={modal.buttonRef} />
      </aside>
      <CoffeeDonationModal
        coffeeDonation={coffeeDonation}
        isOpen={modal.isOpen}
        onClose={modal.close}
        triggerRef={modal.buttonRef}
      />
    </>
  )
}
