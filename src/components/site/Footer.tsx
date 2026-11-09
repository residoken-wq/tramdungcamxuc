import React from 'react'
import Link from 'next/link'
import { Logo, type SiteLogo } from '@/components/brand/Logo'
import { HeartLine } from '@/components/brand/HeartLine'
import { SocialIcon } from '@/components/brand'
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

export type SocialKey = 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'zalo' | 'shopee'

export interface SocialLink {
  key?: SocialKey
  label: string
  href: string
}

export interface FooterProps {
  legalLinks?: LegalLink[]
  sellerInfo?: SellerInfo
  socialLinks?: SocialLink[]
  tagline?: string
  logo?: SiteLogo
  className?: string
}

export function Footer({
  legalLinks,
  sellerInfo,
  socialLinks,
  tagline,
  logo,
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
              <Logo width={140} height={40} src={logo?.src} alt={logo?.alt} />
            </Link>

            {/* Optional brand tagline from CMS */}
            {tagline && (
              <p className="font-quote italic text-base text-deep-navy/90 leading-relaxed max-w-sm">
                &ldquo;{tagline}&rdquo;
              </p>
            )}

            <div className="pt-2">
              {/* a11y-contrast-ok: SVG trang trí HeartLine ở footer */}
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
                    {socialLinks.map((social) => {
                      const key: SocialKey =
                        social.key ||
                        ((social.label || '').toLowerCase().includes('facebook')
                          ? 'facebook'
                          : (social.label || '').toLowerCase().includes('tiktok')
                            ? 'tiktok'
                            : (social.label || '').toLowerCase().includes('youtube')
                              ? 'youtube'
                              : (social.label || '').toLowerCase().includes('linkedin')
                                ? 'linkedin'
                                : (social.label || '').toLowerCase().includes('zalo')
                                  ? 'zalo'
                                  : (social.label || '').toLowerCase().includes('shopee')
                                    ? 'shopee'
                                    : 'facebook')
                      return (
                        <a
                          key={social.key || social.label || social.href}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${social.label} (${vi.pk32.newTab})`}
                          title={social.label}
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-deep-navy/15 text-deep-navy hover:text-bright-magenta hover:bg-lavender-mist/40 hover:border-bright-magenta/30 group-data-[footer-bg=deep-navy]/footer:border-white/20 group-data-[footer-bg=deep-navy]/footer:text-soft-pink group-data-[footer-bg=deep-navy]/footer:hover:text-white group-data-[footer-bg=deep-navy]/footer:hover:bg-white/10 group-data-[footer-bg=deep-navy]/footer:hover:border-white/40 transition-colors focus-visible:outline-2 focus-visible:outline-deep-navy group-data-[footer-bg=deep-navy]/footer:focus-visible:outline-white"
                        >
                          <SocialIcon name={key} className="w-5 h-5" />
                        </a>
                      )
                    })}
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
