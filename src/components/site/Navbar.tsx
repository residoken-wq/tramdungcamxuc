'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'

export interface NavItem {
  label: string
  href: string
  featured?: boolean
  shortLabel?: string
}

export interface NavbarCta {
  label: string
  href: string
}

export interface NavbarProps {
  items: NavItem[]
  cta: NavbarCta
  className?: string
}

export function Navbar({
  items,
  cta,
  className = '',
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)

  // Find the featured item (e.g. 5-min habit test lead magnet) to highlight
  const featuredItem = items.find((item) => item.featured)

  // Handle Escape key to close mobile drawer and return focus to toggle button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        toggleButtonRef.current?.focus()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-warm-ivory/95 backdrop-blur-md border-b border-deep-navy/10 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex-shrink-0 focus-visible:outline-2 focus-visible:outline-deep-navy rounded-sm"
          >
            <Logo width={130} height={38} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label={vi.navbar.mainNav}
            className="hidden lg:flex items-center space-x-6 xl:space-x-8"
          >
            {items.map((item) => {
              const isFeatured = Boolean(item.featured)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'font-ui text-sm font-semibold transition-colors duration-150 py-1 border-b-2 border-transparent',
                    isFeatured
                      ? 'text-bright-magenta hover:text-deep-navy font-bold'
                      : 'text-deep-navy hover:text-bright-magenta hover:border-bright-magenta/40',
                    'focus-visible:outline-2 focus-visible:outline-deep-navy rounded-sm',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center">
            <Button href={cta.href} variant="primary" size="md">
              {cta.label}
            </Button>
          </div>

          {/* Mobile Right Controls: Featured action + Hamburger button */}
          <div className="flex lg:hidden items-center gap-2 sm:gap-3 min-w-0">
            {featuredItem && (
              <Link
                href={featuredItem.href}
                className="inline-flex items-center justify-center min-h-[44px] min-w-0 max-w-[130px] sm:max-w-xs px-2.5 py-1 sm:px-3.5 sm:py-2 rounded-full bg-soft-pink text-deep-navy border border-bright-magenta/25 font-ui text-xs sm:text-sm font-bold hover:bg-bright-magenta hover:text-white transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-deep-navy text-center leading-tight"
              >
                <span className="line-clamp-2">
                  {featuredItem.shortLabel ?? featuredItem.label}
                </span>
              </Link>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              ref={toggleButtonRef}
              id="mobile-nav-toggle"
              type="button"
              aria-expanded={isOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={isOpen ? vi.navbar.closeMenu : vi.navbar.openMenu}
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex-shrink-0 min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-deep-navy/15 text-deep-navy hover:bg-lavender-mist/40 transition-colors flex items-center justify-center focus-visible:outline-2 focus-visible:outline-deep-navy cursor-pointer"
            >
              {isOpen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div
          id="mobile-nav-drawer"
          className="lg:hidden border-t border-deep-navy/10 bg-warm-ivory/98 backdrop-blur-md px-4 pt-4 pb-6 space-y-3 shadow-lg"
        >
          <nav aria-label={vi.navbar.mobileNav} className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block py-2.5 px-3 rounded-lg text-base font-ui font-semibold text-deep-navy hover:bg-lavender-mist/40 hover:text-bright-magenta transition-colors focus-visible:outline-2 focus-visible:outline-deep-navy"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-deep-navy/10">
            <Button
              href={cta.href}
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              {cta.label}
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
