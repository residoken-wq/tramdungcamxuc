'use client'

import React from 'react'
import { Mail } from 'lucide-react'
import { vi } from '@/lib/i18n/vi'

/** Floating email button (above Zalo and the coffee cup); address from Cài đặt website. */
export function FloatingEmail({ href }: { href: string }) {
  return (
    <a
      href={href}
      aria-label={vi.site.floatingEmail.ariaLabel}
      title={vi.site.floatingEmail.ariaLabel}
      data-testid="floating-email"
      className="group flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-lavender-mist text-bright-magenta shadow-soft hover:border-bright-magenta hover:scale-105 active:scale-95 transition-all duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy"
    >
      <Mail className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
    </a>
  )
}
