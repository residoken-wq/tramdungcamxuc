import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PackageComparison } from '@/components/site/PackageComparison'
import { BookingCTA } from '@/components/site/BookingCTA'
import type { PublicProduct } from '@/lib/products'
import * as trackModule from '@/lib/analytics/track'

const mockPackages: PublicProduct[] = [
  {
    id: 1,
    slug: 'growth-mirror-clear',
    name: '[MẪU] Growth Mirror – gói CLEAR',
    web: 'site',
    type: 'package',
    price: 1750000,
    salePrice: null,
    saleStatus: 'consult',
    components: [
      { label: 'Habit Tracker số', quantity: 1, unitValue: 250000 },
      { label: 'EQ Buddy số', quantity: 1, unitValue: 250000 },
      { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
      { label: 'Coaching 1:1 "Vững vàng chuyển mình"', quantity: 1, unitValue: 1000000 },
    ],
  },
  {
    id: 2,
    slug: 'growth-mirror-build',
    name: '[MẪU] Growth Mirror – gói BUILD',
    web: 'site',
    type: 'package',
    price: 2900000,
    salePrice: null,
    saleStatus: 'consult',
    components: [
      { label: 'Habit Tracker số', quantity: 1, unitValue: 250000 },
      { label: 'EQ Buddy số', quantity: 1, unitValue: 250000 },
      { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
      { label: 'Coaching 1:1 "Vững vàng chuyển mình"', quantity: 3, unitValue: 1000000 },
      { label: 'Tư vấn hướng nghiệp', quantity: 1, unitValue: 1000000 },
      { label: 'Cộng đồng private + webinar quý', quantity: 1, unitValue: 300000 },
    ],
  },
  {
    id: 3,
    slug: 'growth-mirror-shine',
    name: '[MẪU] Growth Mirror – gói SHINE',
    web: 'site',
    type: 'package',
    price: 4320000,
    salePrice: null,
    saleStatus: 'consult',
    components: [
      { label: 'Habit Tracker số', quantity: 1, unitValue: 250000 },
      { label: 'EQ Buddy số', quantity: 1, unitValue: 250000 },
      { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
      { label: 'Coaching 1:1 "Vững vàng chuyển mình"', quantity: 6, unitValue: 1000000 },
      { label: 'Tư vấn hướng nghiệp', quantity: 3, unitValue: 1000000 },
      { label: 'Cộng đồng private + webinar quý', quantity: 1, unitValue: 300000 },
    ],
  },
]

const mockTrialProduct: PublicProduct = {
  id: 4,
  slug: 'growth-mirror-phien-trai-nghiem',
  name: '[MẪU] Growth Mirror – phiên trải nghiệm',
  web: 'site',
  type: 'coaching_trial',
  price: 149000,
  salePrice: null,
  saleStatus: 'on_sale',
}

// Mock IntersectionObserver for viewport tracking
type ObserverCallback = (
  entries: Partial<IntersectionObserverEntry>[],
  obs: IntersectionObserver,
) => void
let observerCallbacks: ObserverCallback[] = []
let observedElements: Element[] = []

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  private cb: ObserverCallback

  constructor(cb: ObserverCallback) {
    this.cb = cb
    observerCallbacks.push(cb)
  }

  observe = vi.fn((el: Element) => {
    observedElements.push(el)
  })
  unobserve = vi.fn((el: Element) => {
    observedElements = observedElements.filter((item) => item !== el)
  })
  disconnect = vi.fn(() => {
    observedElements = []
  })
  takeRecords = vi.fn(() => [])
}

describe('Growth Mirror Page Components (T1-11)', () => {
  let originalIO: typeof globalThis.IntersectionObserver

  beforeEach(() => {
    observerCallbacks = []
    observedElements = []
    originalIO = globalThis.IntersectionObserver
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver
    vi.clearAllMocks()
  })

  afterEach(() => {
    globalThis.IntersectionObserver = originalIO
  })

  describe('PackageComparison zero buy buttons requirement', () => {
    it('asserts ZERO buy buttons or checkout links for individual packages', () => {
      const { container } = render(
        <PackageComparison
          packages={mockPackages.map((p) => ({ packageId: p.id }))}
          _resolved={{ packages: mockPackages }}
          showTotalValue={true}
          showDiscountPercent={true}
          showPaymentPolicyLink={false}
        />,
      )

      // 1. Zero <button> elements in the entire table/cards
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(0)

      // 2. Zero <a> links with showPaymentPolicyLink=false
      const links = container.querySelectorAll('a')
      expect(links.length).toBe(0)

      // 3. Text search for purchase/checkout calls to action
      const forbiddenCtaKeywords = ['Mua gói', 'Đặt mua', 'Đăng ký ngay', 'Thanh toán', 'Checkout']
      const allText = container.textContent || ''
      for (const kw of forbiddenCtaKeywords) {
        expect(allText.includes(kw)).toBe(false)
      }
    })

    it('renders only the payment policy link when showPaymentPolicyLink is true', () => {
      const { container } = render(
        <PackageComparison
          packages={mockPackages.map((p) => ({ packageId: p.id }))}
          _resolved={{ packages: mockPackages }}
          showPaymentPolicyLink={true}
        />,
      )

      const links = container.querySelectorAll('a')
      expect(links.length).toBe(1)
      const policyLink = links[0]
      expect(policyLink.getAttribute('href')).toBe('/gia-thanh-toan')
      expect(policyLink.textContent).toMatch(/chính sách/i)
    })
  })

  describe('PackageComparison calculations and note rendering', () => {
    it('renders note text when provided', () => {
      const customNote = '[MẪU] Chi tiết chính sách thanh toán và quyền lợi xem bên dưới.'
      render(
        <PackageComparison
          packages={mockPackages.map((p) => ({ packageId: p.id }))}
          _resolved={{ packages: mockPackages }}
          note={customNote}
          showPaymentPolicyLink={true}
        />,
      )

      expect(screen.getByText(customNote)).toBeDefined()
    })

    it('displays 3 packages (CLEAR, BUILD, SHINE) with package details, total value, and discount %', () => {
      const { container } = render(
        <PackageComparison
          packages={mockPackages.map((p) => ({ packageId: p.id }))}
          _resolved={{ packages: mockPackages }}
          showTotalValue={true}
          showDiscountPercent={true}
        />,
      )

      // Check package labels
      expect(screen.getAllByText(/CLEAR/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/BUILD/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/SHINE/).length).toBeGreaterThan(0)

      // Check prices formatted
      // CLEAR: 1.750.000, totalValue: 2.500.000, discount: 30%
      // BUILD: 2.900.000, totalValue: 5.800.000, discount: 50%
      // SHINE: 4.320.000, totalValue: 10.800.000, discount: 60%
      expect(container.textContent).toContain('1.750.000')
      expect(container.textContent).toContain('2.500.000')
      expect(container.textContent).toContain('30%')

      expect(container.textContent).toContain('2.900.000')
      expect(container.textContent).toContain('5.800.000')
      expect(container.textContent).toContain('50%')

      expect(container.textContent).toContain('4.320.000')
      expect(container.textContent).toContain('10.800.000')
      expect(container.textContent).toContain('60%')
    })
  })

  describe('Analytics: package_viewed IntersectionObserver tracking', () => {
    it('fires package_viewed event exactly once when visible in viewport, with NO PII', () => {
      const trackSpy = vi.spyOn(trackModule, 'track')

      const { rerender } = render(
        <PackageComparison
          packages={mockPackages.map((p) => ({ packageId: p.id }))}
          _resolved={{ packages: mockPackages }}
        />,
      )

      // Observer was attached
      expect(observedElements.length).toBe(1)
      expect(trackSpy).not.toHaveBeenCalled()

      // Trigger intersection
      observerCallbacks.forEach((cb) => {
        cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
      })

      expect(trackSpy).toHaveBeenCalledTimes(1)
      expect(trackSpy).toHaveBeenCalledWith(
        'package_viewed',
        expect.objectContaining({
          packages: ['growth-mirror-clear', 'growth-mirror-build', 'growth-mirror-shine'],
        }),
      )

      // Check no PII in arguments
      const callArgs = trackSpy.mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.email).toBeUndefined()
      expect(callArgs.name).toBeUndefined()
      expect(callArgs.phone).toBeUndefined()

      // Trigger intersection a second time (e.g. scroll up and down) -> MUST NOT fire again
      observerCallbacks.forEach((cb) => {
        cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
      })
      expect(trackSpy).toHaveBeenCalledTimes(1)

      // Re-render component -> MUST NOT fire again
      rerender(
        <PackageComparison
          packages={mockPackages.map((p) => ({ packageId: p.id }))}
          _resolved={{ packages: mockPackages }}
          note="Updated note"
        />,
      )
      expect(trackSpy).toHaveBeenCalledTimes(1)
    })

    it('does NOT track package_viewed in Puck editor mode (isEditing: true)', () => {
      const trackSpy = vi.spyOn(trackModule, 'track')

      render(
        <PackageComparison
          packages={mockPackages.map((p) => ({ packageId: p.id }))}
          _resolved={{ packages: mockPackages }}
          puck={{ isEditing: true }}
        />,
      )

      expect(trackSpy).not.toHaveBeenCalled()
      expect(observedElements.length).toBe(0)
    })
  })

  describe('BookingCTA component integration', () => {
    it('renders single booking button with trial price 149.000đ and tracks booking_clicked on click', () => {
      const trackSpy = vi.spyOn(trackModule, 'track')

      render(
        <BookingCTA
          title="[MẪU] Bắt đầu bằng một phiên trải nghiệm"
          description="[MẪU] 149.000đ để hiểu rõ cách thức đồng hành trước khi chọn gói."
          buttonLabel="Đặt phiên trải nghiệm"
          product={mockTrialProduct}
          pageSlug="coaching-growth-mirror"
        />,
      )

      expect(screen.getByText('149.000đ')).toBeDefined()
      const button = screen.getByRole('link', { name: 'Đặt phiên trải nghiệm' })
      expect(button).toBeDefined()

      fireEvent.click(button)

      expect(trackSpy).toHaveBeenCalledWith('booking_clicked', {
        productId: mockTrialProduct.id,
        slug: mockTrialProduct.slug,
        pageSlug: 'coaching-growth-mirror',
      })
    })
  })
})
