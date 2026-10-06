import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  getEffectivePrice,
  resolveProductCta,
  type ProductCtaInput,
} from '../../src/lib/products'
import { ProductCard } from '../../src/components/site/ProductCard'
import { vi } from '../../src/lib/i18n/vi'

describe('getEffectivePrice', () => {
  const fixedNow = new Date('2026-10-06T12:00:00.000Z')

  it('retains salePrice when saleEndsAt is empty or null', () => {
    expect(
      getEffectivePrice(
        { price: 250000, salePrice: 178000, saleEndsAt: null },
        fixedNow,
      ),
    ).toEqual({
      price: 250000,
      salePrice: 178000,
    })

    expect(
      getEffectivePrice(
        { price: 250000, salePrice: 178000, saleEndsAt: '' },
        fixedNow,
      ),
    ).toEqual({
      price: 250000,
      salePrice: 178000,
    })

    expect(
      getEffectivePrice({ price: 250000, salePrice: 178000 }, fixedNow),
    ).toEqual({
      price: 250000,
      salePrice: 178000,
    })
  })

  it('retains salePrice when saleEndsAt is in the future (now < saleEndsAt)', () => {
    const futureEndsAt = '2026-10-10T00:00:00.000Z'
    expect(
      getEffectivePrice(
        { price: 250000, salePrice: 178000, saleEndsAt: futureEndsAt },
        fixedNow,
      ),
    ).toEqual({
      price: 250000,
      salePrice: 178000,
    })
  })

  it('expires salePrice when saleEndsAt is in the past (now > saleEndsAt)', () => {
    const pastEndsAt = '2026-10-05T00:00:00.000Z'
    expect(
      getEffectivePrice(
        { price: 250000, salePrice: 178000, saleEndsAt: pastEndsAt },
        fixedNow,
      ),
    ).toEqual({
      price: 250000,
      salePrice: null,
    })
  })

  it('expires salePrice on exact boundary when now === saleEndsAt', () => {
    const exactBoundary = '2026-10-06T12:00:00.000Z'
    expect(
      getEffectivePrice(
        { price: 250000, salePrice: 178000, saleEndsAt: exactBoundary },
        fixedNow,
      ),
    ).toEqual({
      price: 250000,
      salePrice: null,
    })
  })

  it('returns salePrice: null when saleEndsAt is an invalid date string', () => {
    expect(
      getEffectivePrice(
        { price: 250000, salePrice: 178000, saleEndsAt: 'not-a-valid-date' },
        fixedNow,
      ),
    ).toEqual({
      price: 250000,
      salePrice: null,
    })
  })

  it('returns salePrice: null when product has no salePrice', () => {
    expect(getEffectivePrice({ price: 250000 }, fixedNow)).toEqual({
      price: 250000,
      salePrice: null,
    })

    expect(
      getEffectivePrice({ price: 250000, salePrice: null }, fixedNow),
    ).toEqual({
      price: 250000,
      salePrice: null,
    })
  })

  it('handles null or missing price gracefully', () => {
    expect(getEffectivePrice({}, fixedNow)).toEqual({
      price: null,
      salePrice: null,
    })
  })
})

describe('resolveProductCta - 7 Branches & Priorities', () => {
  const fixedNow = new Date('2026-10-06T12:00:00.000Z')

  // Branch 1: saleStatus = 'hidden'
  it('Branch 1: returns null when saleStatus is hidden (highest priority, even if externalUrl exists)', () => {
    const hiddenProduct: ProductCtaInput = {
      slug: 'an-san-pham',
      saleStatus: 'hidden',
      externalUrl: 'https://shopee.vn/product-hidden',
      ctaLabel: 'Mua ngay',
    }
    expect(resolveProductCta(hiddenProduct, fixedNow)).toBeNull()
  })

  // Branch 2: externalUrl (and not hidden)
  describe('Branch 2: externalUrl', () => {
    it('returns external CTA with safe link and external_clicked event', () => {
      const product: ProductCtaInput = {
        slug: 'the-eq-vat-ly',
        saleStatus: 'on_sale',
        externalUrl: 'https://shopee.vn/bo-the-eq-buddy',
        externalLabel: 'Mua trên Shopee',
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'external',
        label: 'Mua trên Shopee',
        href: 'https://shopee.vn/bo-the-eq-buddy',
        external: true,
        event: 'external_clicked',
      })
    })

    it('falls back to default vi.product.cta.external when externalLabel is not provided', () => {
      const product: ProductCtaInput = {
        slug: 'the-eq-vat-ly',
        saleStatus: 'on_sale',
        externalUrl: 'https://shopee.vn/bo-the-eq-buddy',
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'external',
        label: vi.product.cta.external,
        href: 'https://shopee.vn/bo-the-eq-buddy',
        external: true,
        event: 'external_clicked',
      })
    })

    it('blocks dangerous externalUrl (e.g. javascript:) and returns null', () => {
      const maliciousProduct: ProductCtaInput = {
        slug: 'doc-hai',
        saleStatus: 'on_sale',
        externalUrl: 'javascript:alert(document.cookie)',
      }
      expect(resolveProductCta(maliciousProduct, fixedNow)).toBeNull()
    })

    it('overrides label with ctaLabel when provided', () => {
      const product: ProductCtaInput = {
        slug: 'the-eq-vat-ly',
        saleStatus: 'on_sale',
        externalUrl: 'https://shopee.vn/bo-the-eq-buddy',
        externalLabel: 'Shopee',
        ctaLabel: 'Ghé thăm Shopee của Hana',
      }
      expect(resolveProductCta(product, fixedNow)?.label).toBe(
        'Ghé thăm Shopee của Hana',
      )
    })
  })

  // Branch 3: coming_soon
  describe('Branch 3: coming_soon', () => {
    it('returns notify CTA with link to /sap-ra-mat', () => {
      const product: ProductCtaInput = {
        slug: 'habit-tracker-pro',
        saleStatus: 'coming_soon',
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'notify',
        label: vi.product.cta.notify,
        href: '/sap-ra-mat?san-pham=habit-tracker-pro',
      })
    })

    it('overrides notify label with ctaLabel', () => {
      const product: ProductCtaInput = {
        slug: 'habit-tracker-pro',
        saleStatus: 'coming_soon',
        ctaLabel: 'Để lại email chờ thông báo',
      }
      expect(resolveProductCta(product, fixedNow)?.label).toBe(
        'Để lại email chờ thông báo',
      )
    })
  })

  // Branch 4: on_sale with trialDays > 0
  describe('Branch 4: on_sale + trialDays > 0', () => {
    it('returns trial CTA with 21 days trial label and /sap-ra-mat trial URL', () => {
      const product: ProductCtaInput = {
        slug: 'habit-tracker',
        saleStatus: 'on_sale',
        trialDays: 21,
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'trial',
        label: 'Dùng thử 21 ngày miễn phí',
        href: '/sap-ra-mat?san-pham=habit-tracker&loai=dung-thu',
      })
    })

    it('formats label with custom trial days (e.g. 14 days)', () => {
      const product: ProductCtaInput = {
        slug: 'eq-buddy',
        saleStatus: 'on_sale',
        trialDays: 14,
      }
      expect(resolveProductCta(product, fixedNow)?.label).toBe(
        'Dùng thử 14 ngày miễn phí',
      )
    })

    it('overrides trial label with ctaLabel', () => {
      const product: ProductCtaInput = {
        slug: 'habit-tracker',
        saleStatus: 'on_sale',
        trialDays: 21,
        ctaLabel: 'Trải nghiệm 21 ngày ngay',
      }
      expect(resolveProductCta(product, fixedNow)?.label).toBe(
        'Trải nghiệm 21 ngày ngay',
      )
    })
  })

  // Branch 5: on_sale (trialDays = 0, null, or undefined)
  describe('Branch 5: on_sale without trial', () => {
    it('returns buy CTA when trialDays is 0', () => {
      const product: ProductCtaInput = {
        slug: 'so-tay-giay',
        saleStatus: 'on_sale',
        trialDays: 0,
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'buy',
        label: vi.product.cta.buy,
        href: '/thanh-toan?san-pham=so-tay-giay',
      })
    })

    it('returns buy CTA when trialDays is null or undefined', () => {
      const product: ProductCtaInput = {
        slug: 'so-tay-giay',
        saleStatus: 'on_sale',
        trialDays: null,
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'buy',
        label: vi.product.cta.buy,
        href: '/thanh-toan?san-pham=so-tay-giay',
      })
    })

    it('overrides buy label with ctaLabel', () => {
      const product: ProductCtaInput = {
        slug: 'so-tay-giay',
        saleStatus: 'on_sale',
        trialDays: 0,
        ctaLabel: 'Sở hữu ngay hôm nay',
      }
      expect(resolveProductCta(product, fixedNow)?.label).toBe(
        'Sở hữu ngay hôm nay',
      )
    })
  })

  // Branch 6: free
  describe('Branch 6: free', () => {
    it('returns free CTA with /tai-nguyen URL', () => {
      const product: ProductCtaInput = {
        slug: 'ebook-tu-nhan-thuc',
        saleStatus: 'free',
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'free',
        label: vi.product.cta.free,
        href: '/tai-nguyen/ebook-tu-nhan-thuc',
      })
    })

    it('overrides free label with ctaLabel', () => {
      const product: ProductCtaInput = {
        slug: 'ebook-tu-nhan-thuc',
        saleStatus: 'free',
        ctaLabel: 'Tải ebook miễn phí',
      }
      expect(resolveProductCta(product, fixedNow)?.label).toBe(
        'Tải ebook miễn phí',
      )
    })
  })

  // Branch 7: consult
  describe('Branch 7: consult', () => {
    it('routes to /coaching/<slug> when type is coaching_trial', () => {
      const product: ProductCtaInput = {
        slug: 'phien-trai-nghiem-growth-mirror',
        saleStatus: 'consult',
        type: 'coaching_trial',
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'consult',
        label: vi.product.cta.consult,
        href: '/coaching/phien-trai-nghiem-growth-mirror',
      })
    })

    it('routes to /coaching/<slug> when type is package', () => {
      const product: ProductCtaInput = {
        slug: 'growth-mirror-clear',
        saleStatus: 'consult',
        type: 'package',
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'consult',
        label: vi.product.cta.consult,
        href: '/coaching/growth-mirror-clear',
      })
    })

    it('routes to /doanh-nghiep for other product types', () => {
      const product: ProductCtaInput = {
        slug: 'workshop-eq-doanh-nghiep',
        saleStatus: 'consult',
        type: 'b2b',
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'consult',
        label: vi.product.cta.consult,
        href: '/doanh-nghiep',
      })

      const productWithoutType: ProductCtaInput = {
        slug: 'tu-van-chung',
        saleStatus: 'consult',
      }
      expect(resolveProductCta(productWithoutType, fixedNow)?.href).toBe(
        '/doanh-nghiep',
      )
    })

    it('overrides consult label with ctaLabel', () => {
      const product: ProductCtaInput = {
        slug: 'growth-mirror-shine',
        saleStatus: 'consult',
        type: 'package',
        ctaLabel: 'Đặt lịch tư vấn cùng Hana',
      }
      expect(resolveProductCta(product, fixedNow)?.label).toBe(
        'Đặt lịch tư vấn cùng Hana',
      )
    })
  })
})

describe('ProductCard with ctaInfo & backward compatibility', () => {
  it('renders Button with ctaInfo for internal link', () => {
    render(
      React.createElement(ProductCard, {
        name: '[MẪU] Habit Tracker',
        coverImage: { src: '/brand/sample-cover.svg', alt: 'Cover' },
        saleStatus: 'on_sale',
        ctaInfo: {
          kind: 'trial',
          label: 'Dùng thử 21 ngày miễn phí',
          href: '/sap-ra-mat?san-pham=habit-tracker&loai=dung-thu',
        },
      }),
    )

    const link = screen.getByRole('link', { name: 'Dùng thử 21 ngày miễn phí' })
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe(
      '/sap-ra-mat?san-pham=habit-tracker&loai=dung-thu',
    )
    expect(link.getAttribute('target')).toBeNull()
  })

  it('renders Button with ctaInfo for external link with target="_blank" and rel="noopener noreferrer"', () => {
    render(
      React.createElement(ProductCard, {
        name: '[MẪU] Bộ thẻ EQ Buddy',
        coverImage: { src: '/brand/sample-cover.svg', alt: 'Cover' },
        saleStatus: 'on_sale',
        ctaInfo: {
          kind: 'external',
          label: 'Mua trên Shopee',
          href: 'https://shopee.vn/bo-the-eq',
          external: true,
          event: 'external_clicked',
        },
      }),
    )

    const link = screen.getByRole('link', { name: 'Mua trên Shopee' })
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('https://shopee.vn/bo-the-eq')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('preserves backward compatibility when cta slot is provided without ctaInfo', () => {
    render(
      React.createElement(ProductCard, {
        name: '[MẪU] Sổ tay giấy',
        coverImage: { src: '/brand/sample-cover.svg', alt: 'Cover' },
        saleStatus: 'on_sale',
        cta: React.createElement(
          'button',
          { 'data-testid': 'custom-legacy-cta' },
          'Nút cũ',
        ),
      }),
    )

    expect(screen.getByTestId('custom-legacy-cta')).toBeDefined()
    expect(screen.getByText('Nút cũ')).toBeDefined()
  })
})
