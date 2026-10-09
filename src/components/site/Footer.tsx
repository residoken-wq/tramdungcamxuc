import React from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { HeartLine } from '@/components/brand/HeartLine'
import { vi } from '@/lib/i18n/vi'

export interface LegalLink {
  title: string
  slug: string
  order?: number
}

export interface SellerInfo {
  name?: string
  taxCode?: string
  address?: string
  phone?: string
  email?: string
}

export interface SocialLink {
  label: string
  href: string
}

export interface FooterProps {
  legalLinks?: LegalLink[]
  sellerInfo?: SellerInfo
  socialLinks?: SocialLink[]
  tagline?: string
  className?: string
}

export function Footer({
  legalLinks,
  sellerInfo,
  socialLinks,
  tagline,
  className = '',
}: FooterProps) {
  const currentYear = new Date().getFullYear()

  // Sort legal links by order if provided
  const sortedLegalLinks = legalLinks
    ? [...legalLinks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : []

  const hasLegalLinks = sortedLegalLinks.length > 0
  const hasSellerDetails = Boolean(
    sellerInfo &&
    (sellerInfo.name?.trim() ||
      sellerInfo.taxCode?.trim() ||
      sellerInfo.address?.trim() ||
      sellerInfo.phone?.trim() ||
      sellerInfo.email?.trim()),
  )
  const hasSocialLinks = Boolean(socialLinks && socialLinks.length > 0)
  const hasContactSection = hasSellerDetails || hasSocialLinks

  return (
    <footer
      className={`w-full bg-warm-ivory border-t border-deep-navy/10 pt-12 pb-8 sm:pt-16 sm:pb-12 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-deep-navy/10">
          {/* Brand Info & Mission */}
          <div className="md:col-span-5 space-y-4">
            <Link
              href="/"
              className="inline-block focus-visible:outline-2 focus-visible:outline-deep-navy rounded-sm"
            >
              <Logo width={140} height={40} />
            </Link>

            {/* Optional brand tagline from CMS */}
            {tagline && (
              <p className="font-quote italic text-base text-deep-navy/90 leading-relaxed max-w-sm">
                &ldquo;{tagline}&rdquo;
              </p>
            )}

            <div className="pt-2">
              <HeartLine className="w-24 h-4 text-accent-pink/40" />
            </div>
          </div>

          {/* Legal Pages Links (rendered only if provided) */}
          {hasLegalLinks && (
            <div className="md:col-span-4 space-y-3">
              <h2 className="font-ui font-bold text-sm text-deep-navy uppercase tracking-wider">
                {vi.footer.legalHeading}
              </h2>
              <ul className="space-y-2">
                {sortedLegalLinks.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={item.slug.startsWith('/') ? item.slug : `/${item.slug}`}
                      className="font-sans text-sm text-deep-navy/80 hover:text-bright-magenta transition-colors focus-visible:outline-2 focus-visible:outline-deep-navy rounded-sm"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seller / Contact Info & Socials (rendered only if provided) */}
          {hasContactSection && (
            <div className="md:col-span-3 space-y-3">
              <h2 className="font-ui font-bold text-sm text-deep-navy uppercase tracking-wider">
                {vi.footer.contactHeading}
              </h2>

              {/* Seller Information (only show non-empty fields) */}
              {hasSellerDetails && sellerInfo && (
                <div className="space-y-1.5 text-sm font-sans text-deep-navy/80">
                  {sellerInfo.name?.trim() && (
                    <p className="font-ui font-semibold text-deep-navy">{sellerInfo.name.trim()}</p>
                  )}
                  {sellerInfo.taxCode?.trim() && (
                    <p>
                      <span className="font-medium text-deep-navy/60">
                        {vi.footer.seller.taxCode}:
                      </span>{' '}
                      {sellerInfo.taxCode.trim()}
                    </p>
                  )}
                  {sellerInfo.address?.trim() && (
                    <p>
                      <span className="font-medium text-deep-navy/60">
                        {vi.footer.seller.address}:
                      </span>{' '}
                      {sellerInfo.address.trim()}
                    </p>
                  )}
                  {sellerInfo.phone?.trim() && (
                    <p>
                      <span className="font-medium text-deep-navy/60">
                        {vi.footer.seller.phone}:
                      </span>{' '}
                      <a
                        href={`tel:${sellerInfo.phone.trim()}`}
                        className="hover:text-bright-magenta underline transition-colors"
                      >
                        {sellerInfo.phone.trim()}
                      </a>
                    </p>
                  )}
                  {sellerInfo.email?.trim() && (
                    <p>
                      <span className="font-medium text-deep-navy/60">
                        {vi.footer.seller.email}:
                      </span>{' '}
                      <a
                        href={`mailto:${sellerInfo.email.trim()}`}
                        className="hover:text-bright-magenta underline transition-colors"
                      >
                        {sellerInfo.email.trim()}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {/* Social Links */}
              {hasSocialLinks && socialLinks && (
                <div className="pt-2">
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.href}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-ui font-bold px-2.5 py-1 rounded-md bg-lavender-mist/40 text-deep-navy hover:bg-bright-magenta hover:text-white transition-all focus-visible:outline-2 focus-visible:outline-deep-navy"
                      >
                        {social.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-sans text-deep-navy/70 gap-3">
          <p>
            &copy; {currentYear} {vi.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
