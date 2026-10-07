import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  getEffectivePrice,
  resolveProductCta,
  type ProductCtaInput,
  GROWTH_MIRROR_PATH,
  buildPackageComparison,
  type ProductPackageInput,
  toPublicProduct,
} from '../../src/lib/products'
import { ProductCard } from '../../src/components/site/ProductCard'
import { vi } from '../../src/lib/i18n/vi'

describe('getEffectivePrice', () => {
  const fixedNow = new Date('2026-10-06T12:00:00.000Z')

  it('retains salePrice when saleEndsAt is empty or null', () => {
    expect(
      getEffectivePrice({ price: 250000, salePrice: 178000, saleEndsAt: null }, fixedNow),
    ).toEqual({
      price: 250000,
      salePrice: 178000,
    })

    expect(
      getEffectivePrice({ price: 250000, salePrice: 178000, saleEndsAt: '' }, fixedNow),
    ).toEqual({
      price: 250000,
      salePrice: 178000,
    })

    expect(getEffectivePrice({ price: 250000, salePrice: 178000 }, fixedNow)).toEqual({
      price: 250000,
      salePrice: 178000,
    })
  })

  it('retains salePrice when saleEndsAt is in the future (now < saleEndsAt)', () => {
    const futureEndsAt = '2026-10-10T00:00:00.000Z'
    expect(
      getEffectivePrice({ price: 250000, salePrice: 178000, saleEndsAt: futureEndsAt }, fixedNow),
    ).toEqual({
      price: 250000,
      salePrice: 178000,
    })
  })

  it('expires salePrice when saleEndsAt is in the past (now > saleEndsAt)', () => {
    const pastEndsAt = '2026-10-05T00:00:00.000Z'
    expect(
      getEffectivePrice({ price: 250000, salePrice: 178000, saleEndsAt: pastEndsAt }, fixedNow),
    ).toEqual({
      price: 250000,
      salePrice: null,
    })
  })

  it('expires salePrice on exact boundary when now === saleEndsAt', () => {
    const exactBoundary = '2026-10-06T12:00:00.000Z'
    expect(
      getEffectivePrice({ price: 250000, salePrice: 178000, saleEndsAt: exactBoundary }, fixedNow),
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

    expect(getEffectivePrice({ price: 250000, salePrice: null }, fixedNow)).toEqual({
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
      expect(resolveProductCta(product, fixedNow)?.label).toBe('Ghé thăm Shopee của Hana')
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
      expect(resolveProductCta(product, fixedNow)?.label).toBe('Để lại email chờ thông báo')
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
      expect(resolveProductCta(product, fixedNow)?.label).toBe('Dùng thử 14 ngày miễn phí')
    })

    it('overrides trial label with ctaLabel', () => {
      const product: ProductCtaInput = {
        slug: 'habit-tracker',
        saleStatus: 'on_sale',
        trialDays: 21,
        ctaLabel: 'Trải nghiệm 21 ngày ngay',
      }
      expect(resolveProductCta(product, fixedNow)?.label).toBe('Trải nghiệm 21 ngày ngay')
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
      expect(resolveProductCta(product, fixedNow)?.label).toBe('Sở hữu ngay hôm nay')
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
      expect(resolveProductCta(product, fixedNow)?.label).toBe('Tải ebook miễn phí')
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

    it('routes to GROWTH_MIRROR_PATH when type is package', () => {
      const product: ProductCtaInput = {
        slug: 'growth-mirror-clear',
        saleStatus: 'consult',
        type: 'package',
      }
      expect(resolveProductCta(product, fixedNow)).toEqual({
        kind: 'consult',
        label: vi.product.cta.consult,
        href: GROWTH_MIRROR_PATH,
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
      expect(resolveProductCta(productWithoutType, fixedNow)?.href).toBe('/doanh-nghiep')
    })

    it('overrides consult label with ctaLabel', () => {
      const product: ProductCtaInput = {
        slug: 'growth-mirror-shine',
        saleStatus: 'consult',
        type: 'package',
        ctaLabel: 'Đặt lịch tư vấn cùng Hana',
      }
      expect(resolveProductCta(product, fixedNow)?.label).toBe('Đặt lịch tư vấn cùng Hana')
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
    expect(link.getAttribute('href')).toBe('/sap-ra-mat?san-pham=habit-tracker&loai=dung-thu')
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
        cta: React.createElement('button', { 'data-testid': 'custom-legacy-cta' }, 'Nút cũ'),
      }),
    )

    expect(screen.getByTestId('custom-legacy-cta')).toBeDefined()
    expect(screen.getByText('Nút cũ')).toBeDefined()
  })
})

describe('buildPackageComparison - Pure table builder', () => {
  const fixedNow = new Date('2026-10-06T12:00:00.000Z')

  const samplePackages: ProductPackageInput[] = [
    {
      id: 1,
      name: 'CLEAR',
      slug: 'growth-mirror-clear',
      price: 1750000,
      salePrice: null,
      components: [
        { label: 'Bộ công cụ số Habit Tracker + EQ Buddy', quantity: 1, unitValue: 500000 },
        { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
        { label: 'Coaching 1:1 "Vững vàng chuyển mình"', quantity: 1, unitValue: 1000000 },
      ],
    },
    {
      id: 2,
      name: 'BUILD',
      slug: 'growth-mirror-build',
      price: 2900000,
      salePrice: null,
      components: [
        { label: 'Bộ công cụ số Habit Tracker + EQ Buddy', quantity: 1, unitValue: 500000 },
        { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
        { label: 'Coaching 1:1 "Vững vàng chuyển mình"', quantity: 3, unitValue: 1000000 },
        { label: 'Tư vấn hướng nghiệp', quantity: 1, unitValue: 1000000 },
        { label: 'Cộng đồng private', quantity: 1, unitValue: 300000 },
      ],
    },
    {
      id: 3,
      name: 'SHINE',
      slug: 'growth-mirror-shine',
      price: 4320000,
      salePrice: null,
      components: [
        { label: 'Bộ công cụ số Habit Tracker + EQ Buddy', quantity: 1, unitValue: 500000 },
        { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
        { label: 'Coaching 1:1 "Vững vàng chuyển mình"', quantity: 6, unitValue: 1000000 },
        { label: 'Tư vấn hướng nghiệp', quantity: 3, unitValue: 1000000 },
        { label: 'Cộng đồng private', quantity: 1, unitValue: 300000 },
      ],
    },
  ]

  it('gathers all unique component labels and preserves first-seen order', () => {
    const result = buildPackageComparison(samplePackages, fixedNow)
    expect(result.rows.map((r) => r.label)).toEqual([
      'Bộ công cụ số Habit Tracker + EQ Buddy',
      'Workshop "Tập thương cảm xúc"',
      'Coaching 1:1 "Vững vàng chuyển mình"',
      'Tư vấn hướng nghiệp',
      'Cộng đồng private',
    ])
  })

  it('marks missing components as "Không" and binary presence as "Có" or numeric', () => {
    const result = buildPackageComparison(samplePackages, fixedNow)

    // First component: all 3 packages have quantity 1 (maxQty = 1) -> all "Có"
    const toolRow = result.rows[0]
    expect(toolRow.cells.map((c) => c.text)).toEqual(['Có', 'Có', 'Có'])
    expect(toolRow.cells.map((c) => c.has)).toEqual([true, true, true])

    // Coaching row: quantities are 1, 3, 6 (maxQty = 6 > 1) -> '1', '3', '6'
    const coachingRow = result.rows[2]
    expect(coachingRow.cells.map((c) => c.text)).toEqual(['1', '3', '6'])

    // Career row: CLEAR doesn't have it -> 'Không', BUILD has 1, SHINE has 3 (maxQty = 3 > 1) -> 'Không', '1', '3'
    const careerRow = result.rows[3]
    expect(careerRow.cells.map((c) => c.text)).toEqual(['Không', '1', '3'])
    expect(careerRow.cells[0].has).toBe(false)
    expect(careerRow.cells[1].has).toBe(true)
    expect(careerRow.cells[2].has).toBe(true)

    // Community row: CLEAR doesn't have it -> 'Không', BUILD and SHINE have quantity 1 (maxQty = 1) -> 'Không', 'Có', 'Có'
    const communityRow = result.rows[4]
    expect(communityRow.cells.map((c) => c.text)).toEqual(['Không', 'Có', 'Có'])
  })

  it('computes totalValue, sellingPrice, and discountPercent accurately', () => {
    const result = buildPackageComparison(samplePackages, fixedNow)
    // CLEAR: totalValue = 500k + 2*500k + 1*1000k = 2.500.000, price = 1.750.000 -> (2.5M - 1.75M)/2.5M = 30%
    expect(result.packages[0].totalValue).toBe(2500000)
    expect(result.packages[0].sellingPrice).toBe(1750000)
    expect(result.packages[0].discountPercent).toBe(30)

    // BUILD: totalValue = 500k + 1000k + 3000k + 1000k + 300k = 5.800.000, price = 2.900.000 -> 50%
    expect(result.packages[1].totalValue).toBe(5800000)
    expect(result.packages[1].sellingPrice).toBe(2900000)
    expect(result.packages[1].discountPercent).toBe(50)

    // SHINE: totalValue = 500k + 1000k + 6000k + 3000k + 300k = 10.800.000, price = 4.320.000 -> 60%
    expect(result.packages[2].totalValue).toBe(10800000)
    expect(result.packages[2].sellingPrice).toBe(4320000)
    expect(result.packages[2].discountPercent).toBe(60)
  })

  it('respects saleEndsAt when active vs expired', () => {
    const promoPackage: ProductPackageInput = {
      id: 10,
      name: 'PROMO PACKAGE',
      price: 2000000,
      salePrice: 1500000,
      saleEndsAt: '2026-10-10T00:00:00.000Z',
      components: [{ label: 'Quyền lợi A', quantity: 1, unitValue: 2500000 }],
    }

    // Active promo (fixedNow < 2026-10-10)
    const activeResult = buildPackageComparison([promoPackage], fixedNow)
    expect(activeResult.packages[0].sellingPrice).toBe(1500000)
    // Discount: (2.5M - 1.5M)/2.5M = 40%
    expect(activeResult.packages[0].discountPercent).toBe(40)

    // Expired promo
    const afterExpiry = new Date('2026-10-11T00:00:00.000Z')
    const expiredResult = buildPackageComparison([promoPackage], afterExpiry)
    expect(expiredResult.packages[0].sellingPrice).toBe(2000000)
    // Discount: (2.5M - 2.0M)/2.5M = 20%
    expect(expiredResult.packages[0].discountPercent).toBe(20)
  })

  it('returns empty packages and rows when input is null, undefined, or empty', () => {
    expect(buildPackageComparison(null, fixedNow)).toEqual({ packages: [], rows: [] })
    expect(buildPackageComparison(undefined, fixedNow)).toEqual({ packages: [], rows: [] })
    expect(buildPackageComparison([], fixedNow)).toEqual({ packages: [], rows: [] })
  })
})

describe('toPublicProduct (Anti-data-leak DTO)', () => {
  it('keeps "includes" items stored by the lines() field under the "text" key', () => {
    const result = toPublicProduct({
      id: 1,
      name: 'Bộ công cụ',
      includes: [
        { id: 'a', text: 'Tracker 21 ngày' },
        { id: 'b', text: '20 video' },
      ],
    })
    expect(result.includes).toEqual([{ text: 'Tracker 21 ngày' }, { text: '20 video' }])
  })

  it('strips files property completely from product document', () => {
    const rawDocWithFiles = {
      id: 999,
      name: 'Ebook Tuyệt Mật',
      slug: 'ebook-tuyet-mat',
      web: 'site',
      type: 'ebook',
      price: 250000,
      salePrice: null,
      saleStatus: 'on_sale',
      description: 'Mô tả chi tiết nội bộ',
      faq: [{ question: 'Q?', answer: 'A' }],
      relatedProducts: [1, 2],
      files: [
        {
          id: 'file-1',
          file: {
            filename: 'private-secret-guide.pdf',
            url: '/media/private-secret-guide.pdf',
          },
        },
      ],
      createdAt: '2026-10-06T00:00:00.000Z',
      updatedAt: '2026-10-06T00:00:00.000Z',
      _status: 'published',
    }

    const publicProduct = toPublicProduct(rawDocWithFiles)

    // Key 'files' must not exist
    expect('files' in publicProduct).toBe(false)
    expect((publicProduct as unknown as Record<string, unknown>).files).toBeUndefined()

    // Key 'description', 'faq', 'relatedProducts', system fields must not exist
    expect('description' in publicProduct).toBe(false)
    expect('faq' in publicProduct).toBe(false)
    expect('relatedProducts' in publicProduct).toBe(false)
    expect('_status' in publicProduct).toBe(false)
    expect('createdAt' in publicProduct).toBe(false)
    expect('updatedAt' in publicProduct).toBe(false)

    // JSON serialization must not contain private filename
    const jsonString = JSON.stringify(publicProduct)
    expect(jsonString).not.toContain('private-secret-guide.pdf')
    expect(jsonString).not.toContain('files')
    expect(jsonString).not.toContain('Mô tả chi tiết nội bộ')

    // Essential public fields are preserved
    expect(publicProduct.id).toBe(999)
    expect(publicProduct.name).toBe('Ebook Tuyệt Mật')
    expect(publicProduct.slug).toBe('ebook-tuyet-mat')
    expect(publicProduct.price).toBe(250000)
    expect(publicProduct.saleStatus).toBe('on_sale')
  })

  it('normalizes coverImage to { url, alt } without internal media fields', () => {
    const rawDoc = {
      id: 123,
      name: 'Khóa học EQ',
      slug: 'khoa-hoc-eq',
      price: 100000,
      saleStatus: 'on_sale',
      coverImage: {
        id: 'img-1',
        url: '/brand/cover.jpg',
        alt: 'Ảnh bìa khóa học',
        filename: 'cover.jpg',
        filesize: 10240,
        createdAt: '2026-10-06T00:00:00.000Z',
      },
    }

    const publicProduct = toPublicProduct(rawDoc)
    expect(publicProduct.coverImage).toEqual({
      url: '/brand/cover.jpg',
      alt: 'Ảnh bìa khóa học',
    })
    expect((publicProduct.coverImage as Record<string, unknown>).filesize).toBeUndefined()
  })

  it('normalizes components to only { label, quantity, unitValue }', () => {
    const rawPackage = {
      id: 456,
      name: 'Gói CLEAR',
      slug: 'growth-mirror-clear',
      price: 1750000,
      saleStatus: 'consult',
      components: [
        {
          label: 'Bộ công cụ số Habit Tracker + EQ Buddy',
          quantity: 1,
          unitValue: 500000,
          retailPrice: 500000,
          grantsProduct: 101,
          internalNote: 'Tự động mở entitlement',
        },
      ],
    }

    const publicProduct = toPublicProduct(rawPackage)
    expect(publicProduct.components).toEqual([
      {
        label: 'Bộ công cụ số Habit Tracker + EQ Buddy',
        quantity: 1,
        unitValue: 500000,
      },
    ])
    expect((publicProduct.components![0] as Record<string, unknown>).retailPrice).toBeUndefined()
    expect((publicProduct.components![0] as Record<string, unknown>).internalNote).toBeUndefined()
  })
})
