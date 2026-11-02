import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { LegalFooterBlock } from '@/puck/blocks/site/LegalFooter'
import { SocialLinksBlock } from '@/puck/blocks/site/SocialLinks'
import { TaglineBlock } from '@/puck/blocks/site/Tagline'
import {
  getLockedComponentPermissions,
  validatePageKindBlocks,
} from '@/puck/locks'
import { vi as i18nVi } from '@/lib/i18n/vi'

describe('EB-10: Footer blocks and kind block validation rules', () => {
  it('LegalFooterBlock is locked against delete and duplicate', () => {
    expect(LegalFooterBlock.permissions).toEqual({
      delete: false,
      duplicate: false,
    })

    const lockedPermissions = getLockedComponentPermissions('LegalFooter', '/any-page')
    expect(lockedPermissions).toEqual({
      delete: false,
    })
  })

  it('LegalFooterBlock renders 6 legal links in sorted order and seller info', () => {
    const legalLinks = [
      { title: 'Chính sách bảo mật', slug: '/chinh-sach-bao-mat', order: 2 },
      { title: 'Điều khoản dịch vụ', slug: '/dieu-khoan-dich-vu', order: 1 },
      { title: 'Thông tin pháp lý', slug: '/thong-tin-phap-ly', order: 3 },
    ]
    const sellerInfo = {
      name: 'Hana Lương Co., Ltd',
      taxCode: '0123456789',
      address: 'Hà Nội, Việt Nam',
      phone: '0901234567',
      email: 'contact@tramdungcamxuc.com',
    }

    const { container } = render(
      LegalFooterBlock.render({
        id: 'test-legal-footer',
        showLegalLinks: true,
        showSellerInfo: true,
        legalLinks,
        sellerInfo,
        puck: {} as any,
      }),
    )

    // Verify legal links rendered in sorted order
    const links = Array.from(container.querySelectorAll('ul a')).map((a) => a.textContent)
    expect(links).toEqual(['Điều khoản dịch vụ', 'Chính sách bảo mật', 'Thông tin pháp lý'])

    // Verify seller info rendered
    expect(screen.getByText('Hana Lương Co., Ltd')).toBeTruthy()
    expect(screen.getByText('0123456789')).toBeTruthy()
  })

  it('SocialLinksBlock renders external social links', () => {
    const socialLinks = [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/hanaluong' },
      { label: 'Shopee', href: 'https://shopee.vn/tramdung' },
    ]

    render(
      SocialLinksBlock.render({
        id: 'test-social-links',
        align: 'left',
        socialLinks,
        puck: {} as any,
      }),
    )
    const shopeeLink = screen.getByRole('link', { name: 'Shopee' })
    expect(shopeeLink).toBeTruthy()
    expect(shopeeLink.getAttribute('href')).toBe('https://shopee.vn/tramdung')
  })

  it('TaglineBlock renders brand tagline with heartline', () => {
    const { container } = render(
      TaglineBlock.render({
        id: 'test-tagline',
        align: 'center',
        showHeartLine: true,
        tagline: 'Hiểu mình rõ. Hành động bền bỉ.',
        puck: {} as any,
      }),
    )

    expect(screen.getByText('“Hiểu mình rõ. Hành động bền bỉ.”')).toBeTruthy()
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  describe('validatePageKindBlocks', () => {
    it('footer must have exactly 1 LegalFooter', () => {
      // Missing LegalFooter
      const emptyFooterData = {
        content: [{ type: 'Container', props: {} }],
      }
      const res1 = validatePageKindBlocks('footer', emptyFooterData)
      expect(res1.valid).toBe(false)
      expect(res1.error).toBe(i18nVi.eb10.errorLegalFooterRequired)

      // Multiple LegalFooter
      const multiFooterData = {
        content: [
          { type: 'LegalFooter', props: {} },
          { type: 'LegalFooter', props: {} },
        ],
      }
      const res2 = validatePageKindBlocks('footer', multiFooterData)
      expect(res2.valid).toBe(false)
      expect(res2.error).toBe(i18nVi.eb10.errorLegalFooterMaxOne)

      // Exactly 1 LegalFooter
      const validFooterData = {
        content: [
          { type: 'SiteLogo', props: {} },
          { type: 'Tagline', props: {} },
          { type: 'LegalFooter', props: {} },
        ],
      }
      const res3 = validatePageKindBlocks('footer', validFooterData)
      expect(res3.valid).toBe(true)
    })

    it('rejects disallowed blocks in header or footer', () => {
      // ProductGrid in header
      const headerWithProduct = {
        content: [
          { type: 'SiteLogo', props: {} },
          { type: 'ProductGrid', props: {} },
        ],
      }
      const res1 = validatePageKindBlocks('header', headerWithProduct)
      expect(res1.valid).toBe(false)
      expect(res1.error).toContain('ProductGrid')

      // LeadForm in footer
      const footerWithLeadForm = {
        content: [
          { type: 'LegalFooter', props: {} },
          { type: 'LeadForm', props: {} },
        ],
      }
      const res2 = validatePageKindBlocks('footer', footerWithLeadForm)
      expect(res2.valid).toBe(false)
      expect(res2.error).toContain('LeadForm')
    })

    it('rejects site theme blocks on regular pages', () => {
      const pageWithSiteLogo = {
        content: [
          { type: 'HeroTwoEntries', props: {} },
          { type: 'SiteLogo', props: {} },
        ],
      }
      const res = validatePageKindBlocks('page', pageWithSiteLogo)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('SiteLogo')
    })

    it('allows valid header blocks', () => {
      const validHeader = {
        content: [
          { type: 'Container', props: {} },
          { type: 'SiteLogo', props: {} },
          { type: 'NavMenu', props: {} },
          { type: 'HeaderCTA', props: {} },
          { type: 'AccountLink', props: {} },
        ],
      }
      const res = validatePageKindBlocks('header', validHeader)
      expect(res.valid).toBe(true)
    })
  })
})
