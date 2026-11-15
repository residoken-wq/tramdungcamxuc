import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { isBookableExperience, type PublicProduct } from '@/lib/products'
import { selectDefaultBookingProduct } from '@/puck/resolve.server'
import { ExperienceBookingButton } from '@/components/site/ExperienceBookingButton'
import { BookingCTA } from '@/components/site/BookingCTA'
import { vi as viStrings } from '@/lib/i18n/vi'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
}))

describe('BX-06: Booking Guard – Nút đặt lịch và helper dùng chung', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isBookableExperience helper', () => {
    const validProduct: PublicProduct = {
      id: 7,
      name: 'Phiên trải nghiệm Growth Mirror',
      slug: 'growth-mirror-phien-trai-nghiem',
      web: 'site',
      type: 'coaching_trial',
      price: 149000,
      salePrice: null,
      saleStatus: 'on_sale',
    }

    it('trả về true khi đủ mọi điều kiện: coaching_trial, on_sale, price > 0, published', () => {
      expect(isBookableExperience(validProduct)).toBe(true)
      expect(isBookableExperience({ ...validProduct, _status: 'published' })).toBe(true)
    })

    it('trả về false khi saleStatus là consult hoặc hidden', () => {
      expect(isBookableExperience({ ...validProduct, saleStatus: 'consult' })).toBe(false)
      expect(isBookableExperience({ ...validProduct, saleStatus: 'hidden' })).toBe(false)
    })

    it('trả về false khi _status là draft', () => {
      expect(isBookableExperience({ ...validProduct, _status: 'draft' })).toBe(false)
    })

    it('trả về false khi giá bằng 0 hoặc null', () => {
      expect(isBookableExperience({ ...validProduct, price: 0 })).toBe(false)
      expect(isBookableExperience({ ...validProduct, price: null })).toBe(false)
    })

    it('trả về false khi ưu đãi hết hạn và giá gốc bằng 0 hoặc null', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString()
      expect(
        isBookableExperience({
          ...validProduct,
          price: 0,
          salePrice: 99000,
          saleEndsAt: pastDate,
        }),
      ).toBe(false)
    })

    it('trả về true khi ưu đãi còn hạn dù giá gốc bằng 0', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString()
      expect(
        isBookableExperience({
          ...validProduct,
          price: 0,
          salePrice: 99000,
          saleEndsAt: futureDate,
        }),
      ).toBe(true)
    })

    it('trả về false khi loại sản phẩm không phải coaching_trial', () => {
      expect(isBookableExperience({ ...validProduct, type: 'package' })).toBe(false)
      expect(isBookableExperience({ ...validProduct, type: 'digital_tool' })).toBe(false)
      expect(isBookableExperience({ ...validProduct, type: null })).toBe(false)
    })

    it('trả về false cho null, undefined hoặc object rỗng', () => {
      expect(isBookableExperience(null)).toBe(false)
      expect(isBookableExperience(undefined)).toBe(false)
      expect(isBookableExperience({})).toBe(false)
    })
  })

  describe('selectDefaultBookingProduct helper', () => {
    it('lọc bỏ các sản phẩm không đủ điều kiện và sắp xếp theo order ASC, id ASC', () => {
      const products = [
        { id: 7, order: 2, type: 'coaching_trial', saleStatus: 'consult', price: 149000 },
        { id: 10, order: 3, type: 'coaching_trial', saleStatus: 'on_sale', price: 149000 },
        { id: 8, order: 1, type: 'coaching_trial', saleStatus: 'on_sale', price: 199000 },
        { id: 9, order: 1, type: 'coaching_trial', saleStatus: 'on_sale', price: 249000 },
      ]

      const selected = selectDefaultBookingProduct(products)
      expect(selected).not.toBeNull()
      expect(selected?.id).toBe(8)
    })

    it('trả về null khi không có sản phẩm nào đủ điều kiện', () => {
      const products = [
        { id: 7, order: 1, type: 'coaching_trial', saleStatus: 'consult', price: 149000 },
        { id: 8, order: 2, type: 'package', saleStatus: 'on_sale', price: 149000 },
      ]

      const selected = selectDefaultBookingProduct(products)
      expect(selected).toBeNull()
    })
  })

  describe('ExperienceBookingButton rendering & fallback logic', () => {
    const bookableProduct: PublicProduct = {
      id: 8,
      name: 'Phiên trải nghiệm Growth Mirror',
      slug: 'growth-mirror-trai-nghiem',
      web: 'site',
      type: 'coaching_trial',
      price: 149000,
      salePrice: null,
      saleStatus: 'on_sale',
    }

    const unbookableProduct: PublicProduct = {
      id: 7,
      name: 'Phiên trải nghiệm cũ (Tư vấn)',
      slug: 'phien-trai-nghiem-tu-van',
      web: 'site',
      type: 'coaching_trial',
      price: 149000,
      salePrice: null,
      saleStatus: 'consult',
    }

    it('render link chính xác và giá đúng khi sản phẩm đặt được', () => {
      render(<ExperienceBookingButton product={bookableProduct} />)
      const link = screen.getByRole('link', { name: /149\.000đ/ })
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=8')
    })

    it('tự động fallback sang defaultBookingProduct khi sản phẩm gắn với nút không đặt được', () => {
      render(
        <ExperienceBookingButton
          product={unbookableProduct}
          defaultBookingProduct={bookableProduct}
        />,
      )
      const link = screen.getByRole('link', { name: /149\.000đ/ })
      expect(link.getAttribute('href')).toBe('/dat-phien-trai-nghiem?san-pham=8')
    })

    it('trên trang công khai: không render nút khi không có sản phẩm nào đặt được', () => {
      const { container } = render(
        <ExperienceBookingButton product={unbookableProduct} isEditing={false} />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('trong builder (isEditing): hiển thị khung cảnh báo hướng dẫn Hana sửa trong CMS', () => {
      render(<ExperienceBookingButton product={unbookableProduct} isEditing={true} />)
      expect(screen.getByText(viStrings.bx06.bookingUnavailableBuilderNotice)).toBeDefined()
    })

    it('trong builder (puck.isEditing): hiển thị khung cảnh báo tương tự', () => {
      render(
        <ExperienceBookingButton
          product={unbookableProduct}
          puck={{ isEditing: true }}
        />,
      )
      expect(screen.getByText(viStrings.bx06.bookingUnavailableBuilderNotice)).toBeDefined()
    })
  })

  describe('BookingCTA component integration', () => {
    const bookableProduct: PublicProduct = {
      id: 8,
      name: 'Phiên trải nghiệm',
      slug: 'phien-trai-nghiem',
      type: 'coaching_trial',
      price: 149000,
      salePrice: null,
      saleStatus: 'on_sale',
    }

    const unbookableProduct: PublicProduct = {
      id: 7,
      name: 'Phiên trải nghiệm consult',
      slug: 'phien-trai-nghiem-consult',
      type: 'coaching_trial',
      price: 149000,
      salePrice: null,
      saleStatus: 'consult',
    }

    it('render nút và hiển thị giá khi sản phẩm đặt được', () => {
      const markup = renderToStaticMarkup(
        <BookingCTA
          title="Đặt phiên trải nghiệm"
          buttonLabel="Đặt phiên"
          product={bookableProduct}
        />,
      )
      expect(markup).toContain('href="/dat-phien-trai-nghiem?san-pham=8"')
      expect(markup).toContain('149.000đ')
    })

    it('fallback sang defaultBookingProduct khi sản phẩm trực tiếp unbookable', () => {
      const markup = renderToStaticMarkup(
        <BookingCTA
          title="Đặt phiên trải nghiệm"
          buttonLabel="Đặt phiên"
          product={unbookableProduct}
          defaultBookingProduct={bookableProduct}
        />,
      )
      expect(markup).toContain('href="/dat-phien-trai-nghiem?san-pham=8"')
      expect(markup).toContain('149.000đ')
    })

    it('ẩn giá và ẩn nút trên trang công khai khi không có sản phẩm nào khả dụng', () => {
      const markup = renderToStaticMarkup(
        <BookingCTA
          title="Đặt phiên trải nghiệm"
          buttonLabel="Đặt phiên"
          product={unbookableProduct}
          defaultBookingProduct={null}
        />,
      )
      expect(markup).not.toContain('href=')
      expect(markup).not.toContain('149.000đ')
    })

    it('snapshot khối BookingCTA với sản phẩm đặt được đảm bảo tính ổn định', () => {
      const markup = renderToStaticMarkup(
        <BookingCTA
          title="Phiên trải nghiệm Growth Mirror"
          description="Một phiên khai vấn cá nhân 1:1"
          buttonLabel="Đặt phiên trải nghiệm"
          product={bookableProduct}
        />,
      )
      expect(markup).toMatchSnapshot()
    })
  })
})
