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
  className?: string
}

export const DEFAULT_LEGAL_LINKS: LegalLink[] = [
  { title: 'Thông tin pháp lý', slug: '/thong-tin-phap-ly', order: 1 },
  { title: 'Điều khoản sử dụng', slug: '/dieu-khoan-su-dung', order: 2 },
  { title: 'Chính sách bảo mật', slug: '/chinh-sach-bao-mat', order: 3 },
  { title: 'Chính sách cung cấp dịch vụ', slug: '/chinh-sach-cung-cap-dich-vu', order: 4 },
  { title: 'Giá & Thanh toán', slug: '/gia-thanh-toan', order: 5 },
  { title: 'Phản ánh & Khiếu nại', slug: '/phan-anh-khieu-nai', order: 6 },
]

export const DEFAULT_SELLER_INFO: SellerInfo = {
  name: 'Trạm Dừng Cảm Xúc',
  address: 'TP. Hồ Chí Minh, Việt Nam',
  email: 'contact@tramdungcamxuc.com',
}

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'Zalo Community', href: 'https://zalo.me' },
]

export function Footer({
  legalLinks = DEFAULT_LEGAL_LINKS,
  sellerInfo = DEFAULT_SELLER_INFO,
  socialLinks = DEFAULT_SOCIAL_LINKS,
  className = '',
}: FooterProps) {
  const currentYear = new Date().getFullYear()

  // Sort legal links by order if provided
  const sortedLegalLinks = [...legalLinks].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  )

  return (
    <footer
      className={`w-full bg-warm-ivory border-t border-deep-navy/10 pt-12 pb-8 sm:pt-16 sm:pb-12 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-deep-navy/10">
          {/* Brand Info & Mission */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-block focus-visible:outline-2 focus-visible:outline-deep-navy rounded-sm">
              <Logo width={140} height={40} />
            </Link>
            <p className="font-serif italic text-base text-deep-navy/90 leading-relaxed max-w-sm">
              &ldquo;{vi.footer.brandTagline}&rdquo;
            </p>
            <div className="pt-2">
              <HeartLine className="w-24 h-4 text-accent-pink/40" />
            </div>
          </div>

          {/* Legal Pages Links */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-ui font-bold text-sm text-deep-navy uppercase tracking-wider">
              {vi.footer.legalHeading}
            </h4>
            <ul className="space-y-2">
              {sortedLegalLinks.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={item.slug}
                    className="font-sans text-sm text-deep-navy/80 hover:text-bright-magenta transition-colors focus-visible:outline-2 focus-visible:outline-deep-navy rounded-sm"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Seller / Contact Info */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-ui font-bold text-sm text-deep-navy uppercase tracking-wider">
              {vi.footer.contactHeading}
            </h4>

            {/* Seller Information (only show non-empty fields) */}
            {sellerInfo && (
              <div className="space-y-1.5 text-sm font-sans text-deep-navy/80">
                {sellerInfo.name && (
                  <p className="font-ui font-semibold text-deep-navy">
                    {sellerInfo.name}
                  </p>
                )}
                {sellerInfo.taxCode && (
                  <p>
                    <span className="font-medium text-deep-navy/60">{vi.footer.seller.taxCode}:</span>{' '}
                    {sellerInfo.taxCode}
                  </p>
                )}
                {sellerInfo.address && (
                  <p>
                    <span className="font-medium text-deep-navy/60">{vi.footer.seller.address}:</span>{' '}
                    {sellerInfo.address}
                  </p>
                )}
                {sellerInfo.phone && (
                  <p>
                    <span className="font-medium text-deep-navy/60">{vi.footer.seller.phone}:</span>{' '}
                    <a
                      href={`tel:${sellerInfo.phone}`}
                      className="hover:text-bright-magenta underline transition-colors"
                    >
                      {sellerInfo.phone}
                    </a>
                  </p>
                )}
                {sellerInfo.email && (
                  <p>
                    <span className="font-medium text-deep-navy/60">{vi.footer.seller.email}:</span>{' '}
                    <a
                      href={`mailto:${sellerInfo.email}`}
                      className="hover:text-bright-magenta underline transition-colors"
                    >
                      {sellerInfo.email}
                    </a>
                  </p>
                )}
              </div>
            )}

            {/* Social Links */}
            {socialLinks && socialLinks.length > 0 && (
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
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-sans text-deep-navy/70 gap-3">
          <p>
            &copy; {currentYear} {vi.footer.copyright}
          </p>
          <p className="font-serif italic">
            Trạm Dừng Cảm Xúc · Nơi cảm xúc được lắng nghe
          </p>
        </div>
      </div>
    </footer>
  )
}
