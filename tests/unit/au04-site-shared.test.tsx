import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ExperienceBookingButton,
  formatBookingButtonLabel,
} from '@/components/site/ExperienceBookingButton'
import { BookingCTA } from '@/components/site/BookingCTA'
import { ButtonWidget } from '@/components/site/widgets/ButtonWidget'
import { CTASection } from '@/components/site/CTASection'
import * as analyticsModule from '@/lib/analytics/track'
import type { PublicProduct } from '@/lib/products'

vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
}))

const mockCoachingProduct: PublicProduct = {
  id: 7,
  name: 'Growth Mirror – phiên trải nghiệm',
  slug: 'growth-mirror-phien-trai-nghiem',
  web: 'site',
  type: 'coaching_trial',
  price: 149000,
  salePrice: null,
  saleStatus: 'on_sale',
}

describe('AU-04: Nút đặt lịch dùng chung (Mục 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatBookingButtonLabel helper', () => {
    it('appends price in parenthesis when showPrice is true and label lacks price', () => {
      const res = formatBookingButtonLabel('Đặt phiên trải nghiệm', 149000, true)
      expect(res).toBe('Đặt phiên trải nghiệm (149.000đ)')
    })

    it('replaces {price} placeholder if present', () => {
      const res = formatBookingButtonLabel('Đặt lịch chỉ {price}', 149000, true)
      expect(res).toBe('Đặt lịch chỉ 149.000đ')
    })

    it('does not duplicate price if already contained in label', () => {
      const res = formatBookingButtonLabel('Đặt phiên trải nghiệm 149.000đ', 149000, true)
      expect(res).toBe('Đặt phiên trải nghiệm 149.000đ')
    })

    it('returns raw label when showPrice is false or price is null', () => {
      expect(formatBookingButtonLabel('Đặt lịch', null, true)).toBe('Đặt lịch')
      expect(formatBookingButtonLabel('Đặt lịch', 149000, false)).toBe('Đặt lịch')
    })
  })

  describe('ExperienceBookingButton component', () => {
    it('renders link to /dat-phien-trai-nghiem?san-pham=7 and displays dynamic price', () => {
      render(<ExperienceBookingButton product={mockCoachingProduct} />)
      const link = screen.getByRole('link', { name: /149\.000đ/ })
      expect(link).toBeDefined()
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=7')
      expect(link.textContent).toContain('Đặt phiên trải nghiệm (149.000đ)')
    })

    it('falls back to /dat-phien-trai-nghiem when no product is passed', () => {
      render(<ExperienceBookingButton product={null} />)
      const link = screen.getByRole('link', { name: /Đặt phiên trải nghiệm/ })
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem')
    })

    it('tracks booking_clicked on click', () => {
      render(
        <ExperienceBookingButton
          product={mockCoachingProduct}
          pageSlug="trang-chu"
        />,
      )
      const link = screen.getByRole('link', { name: /149\.000đ/ })
      fireEvent.click(link)
      expect(analyticsModule.track).toHaveBeenCalledWith('booking_clicked', {
        productId: 7,
        slug: 'growth-mirror-phien-trai-nghiem',
        pageSlug: 'trang-chu',
      })
    })

    it('supports custom button text and respects showPrice=false', () => {
      render(
        <ExperienceBookingButton
          product={mockCoachingProduct}
          buttonText="Cần coach đồng hành 1:1"
          showPrice={false}
        />,
      )
      const link = screen.getByRole('link', { name: 'Cần coach đồng hành 1:1' })
      expect(link.textContent).toBe('Cần coach đồng hành 1:1')
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=7')
    })
  })

  describe('BookingCTA with ExperienceBookingButton', () => {
    it('renders booking button with product id query param and tracks on click', () => {
      render(
        <BookingCTA
          title="Phiên trải nghiệm Growth Mirror"
          product={mockCoachingProduct}
          pageSlug="coaching"
        />,
      )
      const button = screen.getByRole('link', { name: 'Đặt phiên trải nghiệm' })
      expect(button.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=7')
      fireEvent.click(button)
      expect(analyticsModule.track).toHaveBeenCalledWith('booking_clicked', {
        productId: 7,
        slug: 'growth-mirror-phien-trai-nghiem',
        pageSlug: 'coaching',
      })
    })
  })

  describe('ButtonWidget with linkType=booking', () => {
    it('renders ExperienceBookingButton with resolved booking product and price', () => {
      render(
        <ButtonWidget
          text="Đặt lịch hẹn 1:1"
          linkType="booking"
          _resolved={{
            bookingProduct: mockCoachingProduct,
            bookingProductId: 7,
          }}
        />,
      )
      const link = screen.getByRole('link', { name: /149\.000đ/ })
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=7')
      expect(link.textContent).toContain('Đặt lịch hẹn 1:1 (149.000đ)')
    })
  })

  describe('CTASection with buttonAction=booking', () => {
    it('renders ExperienceBookingButton with resolved booking product and price', () => {
      render(
        <CTASection
          buttonText="Đặt phiên trải nghiệm"
          buttonAction="booking"
          _resolved={{
            bookingProduct: mockCoachingProduct,
            bookingProductId: 7,
          }}
        />,
      )
      const link = screen.getByRole('link', { name: /149\.000đ/ })
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=7')
      expect(link.textContent).toContain('149.000đ')
    })
  })
})
