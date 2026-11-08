import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { buildSocialLinks } from '@/lib/site-shell.server'
import { SocialLinksBlock } from '@/puck/blocks/site/SocialLinks'
import { Footer } from '@/components/site/Footer'
import { ContactInfo } from '@/components/site/ContactInfo'
import { SocialIcon } from '@/components/brand/SocialIcon'
import { vi as viStrings } from '@/lib/i18n/vi'

describe('PK-32: Footer – Icon mạng xã hội đọc từ Cài đặt Website + thêm TikTok', () => {
  describe('1.1 & 1.3: buildSocialLinks danh sách mạng xã hội dùng chung', () => {
    it('returns all 6 social links in exact order when provided with valid URLs', () => {
      const mockSettings = {
        facebookUrl: 'https://facebook.com/tramdungcamxuc',
        tiktokUrl: 'https://tiktok.com/@tramdungcamxuc',
        youtubeUrl: 'https://youtube.com/@tramdungcamxuc',
        linkedInUrl: 'https://linkedin.com/company/tramdungcamxuc',
        zaloGroupUrl: 'https://zalo.me/g/community123',
        shopeeStoreUrl: 'https://shopee.vn/tramdungcamxuc',
      }

      const links = buildSocialLinks(mockSettings)
      expect(links).toHaveLength(6)

      expect(links.map((l) => l.key)).toEqual([
        'facebook',
        'tiktok',
        'youtube',
        'linkedin',
        'zalo',
        'shopee',
      ])

      expect(links[0]).toEqual({
        key: 'facebook',
        label: viStrings.pk32.socialLabels.facebook,
        href: 'https://facebook.com/tramdungcamxuc',
      })
      expect(links[1]).toEqual({
        key: 'tiktok',
        label: viStrings.pk32.socialLabels.tiktok,
        href: 'https://tiktok.com/@tramdungcamxuc',
      })
      expect(links[2]).toEqual({
        key: 'youtube',
        label: viStrings.pk32.socialLabels.youtube,
        href: 'https://youtube.com/@tramdungcamxuc',
      })
      expect(links[3]).toEqual({
        key: 'linkedin',
        label: viStrings.pk32.socialLabels.linkedin,
        href: 'https://linkedin.com/company/tramdungcamxuc',
      })
      expect(links[4]).toEqual({
        key: 'zalo',
        label: viStrings.pk32.socialLabels.zalo,
        href: 'https://zalo.me/g/community123',
      })
      expect(links[5]).toEqual({
        key: 'shopee',
        label: viStrings.pk32.socialLabels.shopee,
        href: 'https://shopee.vn/tramdungcamxuc',
      })
    })

    it('filters out empty, whitespace-only, and unsafe URLs (javascript:, protocol-relative)', () => {
      const mockSettings = {
        facebookUrl: '   ',
        tiktokUrl: 'javascript:alert("pwned")',
        youtubeUrl: '//evil.com/youtube',
        linkedInUrl: 'https://linkedin.com/in/hanaluong',
        zaloGroupUrl: '',
        shopeeStoreUrl: null,
      }

      const links = buildSocialLinks(mockSettings)
      expect(links).toHaveLength(1)
      expect(links[0].key).toBe('linkedin')
      expect(links[0].href).toBe('https://linkedin.com/in/hanaluong')
    })
  })

  describe('1.4: SocialIcon component', () => {
    it('renders inline SVG with viewBox 0 0 24 24 and aria-hidden for all 6 network names', () => {
      const networks = ['facebook', 'tiktok', 'youtube', 'linkedin', 'zalo', 'shopee'] as const
      for (const net of networks) {
        const { container } = render(<SocialIcon name={net} />)
        const svg = container.querySelector('svg')
        expect(svg).not.toBeNull()
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
        expect(svg?.getAttribute('aria-hidden')).toBe('true')
      }
    })
  })

  describe('1.5 & 1.6: SocialLinks builder block', () => {
    it('renders 40x40 icon buttons with aria-label, title, and proper contrast classes', () => {
      const Render = SocialLinksBlock.render
      const links = [
        {
          key: 'facebook' as const,
          label: 'Facebook',
          href: 'https://facebook.com/tram',
        },
        {
          key: 'tiktok' as const,
          label: 'TikTok',
          href: 'https://tiktok.com/@tram',
        },
      ]

      const { container } = render(
        <Render id="test-social-links" align="left" socialLinks={links} puck={{ isEditing: false } as any} />,
      )

      const anchors = container.querySelectorAll('a')
      expect(anchors).toHaveLength(2)

      expect(anchors[0].getAttribute('href')).toBe('https://facebook.com/tram')
      expect(anchors[0].getAttribute('aria-label')).toBe('Facebook (mở tab mới)')
      expect(anchors[0].getAttribute('title')).toBe('Facebook')
      expect(anchors[0].className).toContain('w-10')
      expect(anchors[0].className).toContain('h-10')
      expect(anchors[0].className).toContain('rounded-full')
      expect(anchors[0].className).toContain('group-data-[footer-bg=deep-navy]/footer:text-soft-pink')

      const svg0 = anchors[0].querySelector('svg')
      expect(svg0).not.toBeNull()

      const svg1 = anchors[1].querySelector('svg')
      expect(svg1).not.toBeNull()
    })

    it('shows empty hint in builder editing mode when socialLinks is empty (no mock links)', () => {
      const Render = SocialLinksBlock.render

      const { container } = render(
        <Render id="test-social-links" align="left" socialLinks={[]} puck={{ isEditing: true } as any} />,
      )

      expect(container.textContent).toContain(viStrings.pk32.emptyHint)
      expect(container.querySelectorAll('a')).toHaveLength(0)
    })

    it('renders nothing on public site when socialLinks is empty', () => {
      const Render = SocialLinksBlock.render

      const { container } = render(
        <Render id="test-social-links" align="left" socialLinks={[]} puck={{ isEditing: false } as any} />,
      )

      expect(container.innerHTML).toBe('')
      expect(container.textContent).toBe('')
    })
  })

  describe('1.5: Footer.tsx code component', () => {
    it('renders round icon buttons for social links while preserving legal links and seller info', () => {
      const legalLinks = [{ title: 'Chính sách bảo mật', slug: '/chinh-sach-bao-mat' }]
      const sellerInfo = { name: 'Trạm Dừng Cảm Xúc', phone: '0901234567' }
      const socialLinks = [
        {
          key: 'tiktok' as const,
          label: 'TikTok',
          href: 'https://tiktok.com/@tram',
        },
      ]

      const { container } = render(
        <Footer
          legalLinks={legalLinks}
          sellerInfo={sellerInfo}
          socialLinks={socialLinks}
          tagline="Nơi dừng chân cho những tâm hồn đẹp"
        />,
      )

      // Social link icon button
      const socialAnchor = container.querySelector('a[href="https://tiktok.com/@tram"]')
      expect(socialAnchor).not.toBeNull()
      expect(socialAnchor?.getAttribute('aria-label')).toBe('TikTok (mở tab mới)')
      expect(socialAnchor?.className).toContain('w-10')
      expect(socialAnchor?.className).toContain('h-10')
      expect(socialAnchor?.querySelector('svg')).not.toBeNull()

      // Legal & seller info preserved
      expect(screen.getByText('Chính sách bảo mật')).not.toBeNull()
      expect(screen.getByText('Trạm Dừng Cảm Xúc')).not.toBeNull()
      expect(screen.getByText(/Nơi dừng chân cho những tâm hồn đẹp/)).not.toBeNull()
    })
  })

  describe('1.7: ContactInfo.tsx with TikTok', () => {
    it('renders TikTok button when tiktokUrl is provided in _resolved contact data', () => {
      const contactData = {
        tiktokUrl: 'https://www.tiktok.com/@tramdungcamxuc',
      }

      const { container } = render(<ContactInfo _resolved={{ contact: contactData }} />)

      const tiktokAnchor = container.querySelector(
        'a[href="https://www.tiktok.com/@tramdungcamxuc"]',
      )
      expect(tiktokAnchor).not.toBeNull()
      expect(tiktokAnchor?.getAttribute('aria-label')).toBe(
        viStrings.sm06.contactInfo.tiktokLabel,
      )
      expect(tiktokAnchor?.querySelector('svg')).not.toBeNull()
    })
  })
})

