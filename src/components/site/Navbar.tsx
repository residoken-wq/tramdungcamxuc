'use client'

import React from 'react'
import Link from 'next/link'
import { Logo, type SiteLogo } from '@/components/brand/Logo'
import { NavMenuView } from './nav/NavMenuView'

export interface NavLink {
  label: string
  href: string
  description?: string
  featured?: boolean
  shortLabel?: string
}

export interface NavGroup {
  label?: string
  items: NavLink[]
}

export interface NavItem {
  label: string
  /** Empty when the item only opens its submenu. */
  href: string
  featured?: boolean
  shortLabel?: string
  groups?: NavGroup[]
}

export interface NavbarCta {
  label: string
  href: string
}

export interface NavbarCustomer {
  name?: string | null
  email: string
}

export interface NavbarProps {
  items: NavItem[]
  cta: NavbarCta
  customer?: NavbarCustomer | null
  logo?: SiteLogo
  className?: string
}

export function Navbar({ items, cta, customer, logo, className = '' }: NavbarProps) {
  return (
    <header
      className={`sticky top-0 z-40 w-full bg-warm-ivory/95 backdrop-blur-md border-b border-deep-navy/10 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 relative">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex-shrink-0 focus-visible:outline-2 focus-visible:outline-deep-navy rounded-sm"
          >
            <Logo width={130} height={38} src={logo?.src} alt={logo?.alt} />
          </Link>

          <NavMenuView
            items={items}
            cta={cta}
            customer={customer}
            breakpoint="lg"
            showAccountLink
            showCta
            showFeaturedItem
          />
        </div>
      </div>
    </header>
  )
}

