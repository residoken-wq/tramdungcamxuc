import React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { render, screen } from '@testing-library/react'
import { selectDefaultBookingProduct } from '@/puck/resolve.server'
import { PackageComparison } from '@/components/site/PackageComparison'
import { PackageCards } from '@/components/site/PackageCards'
import { CTASection } from '@/components/site/CTASection'
import { Callout } from '@/components/site/Callout'
import { FAQ } from '@/components/site/FAQ'
import { vi as viStrings } from '@/lib/i18n/vi'

describe('SM-04b C1: Booking Product Resolution & Link Generation', () => {
  describe('Helper selectDefaultBookingProduct', () => {
    it('trả về null khi mảng rỗng', () => {
      expect(selectDefaultBookingProduct([])).toBeNull()
    })

    it('bỏ qua sản phẩm bản nháp (_status !== published)', () => {
      const items = [
        {
          id: 1,
          type: 'coaching_trial',
          _status: 'draft',
          saleStatus: 'on_sale',
          price: 149000,
        },
      ]
      expect(selectDefaultBookingProduct(items)).toBeNull()
    })

    it('bỏ qua sản phẩm ẩn (saleStatus !== on_sale)', () => {
      const items = [
        {
          id: 2,
          type: 'coaching_trial',
          _status: 'published',
          saleStatus: 'hidden',
          price: 149000,
        },
        {
          id: 3,
          type: 'coaching_trial',
          _status: 'published',
          saleStatus: 'consult',
          price: 149000,
        },
      ]
      expect(selectDefaultBookingProduct(items)).toBeNull()
    })

    it('bỏ qua sản phẩm có giá hiệu lực = 0 hoặc null', () => {
      const items = [
        {
          id: 4,
          type: 'coaching_trial',
          _status: 'published',
          saleStatus: 'on_sale',
          price: 0,
        },
        {
          id: 5,
          type: 'coaching_trial',
          _status: 'published',
          saleStatus: 'on_sale',
          price: null,
          salePrice: null,
        },
      ]
      expect(selectDefaultBookingProduct(items)).toBeNull()
    })

    it('bỏ qua sản phẩm không phải type coaching_trial', () => {
      const items = [
        {
          id: 6,
          type: 'package',
          _status: 'published',
          saleStatus: 'on_sale',
          price: 149000,
        },
      ]
      expect(selectDefaultBookingProduct(items)).toBeNull()
    })

    it('khi có 2 sản phẩm hợp lệ, chọn theo order nhỏ hơn', () => {
      const items = [
        {
          id: 10,
          type: 'coaching_trial',
          _status: 'published',
          saleStatus: 'on_sale',
          price: 149000,
          order: 2,
        },
        {
          id: 20,
          type: 'coaching_trial',
          _status: 'published',
          saleStatus: 'on_sale',
          price: 199000,
          order: 1,
        },
      ]
      const chosen = selectDefaultBookingProduct(items)
      expect(chosen?.id).toBe(20)
    })

    it('khi có 2 sản phẩm cùng order, chọn theo id nhỏ hơn', () => {
      const items = [
        {
          id: 50,
          type: 'coaching_trial',
          _status: 'published',
          saleStatus: 'on_sale',
          price: 149000,
          order: 1,
        },
        {
          id: 30,
          type: 'coaching_trial',
          _status: 'published',
          saleStatus: 'on_sale',
          price: 199000,
          order: 1,
        },
      ]
      const chosen = selectDefaultBookingProduct(items)
      expect(chosen?.id).toBe(30)
    })
  })

  describe('Component link assertions & null handling', () => {
    const samplePackages = [
      {
        id: 101,
        name: 'Gói CLEAR',
        slug: 'growth-mirror-clear',
        price: 1750000,
        salePrice: null,
        type: 'package' as const,
        saleStatus: 'on_sale' as const,
      },
    ]

    describe('PackageComparison', () => {
      it('khi có bookingProductId -> nút Chọn gói này có tham số san-pham và goi', () => {
        const { container } = render(
          <PackageComparison
            showPackageButtons={true}
            _resolved={{
              packages: samplePackages,
              bookingProductId: 42,
            }}
          />,
        )
        const buttons = container.querySelectorAll('a[href*="/dat-phien-trai-nghiem"]')
        expect(buttons.length).toBeGreaterThan(0)
        buttons.forEach((btn) => {
          expect(btn.getAttribute('href')).toContain('san-pham=42')
          expect(btn.getAttribute('href')).toContain('goi=growth-mirror-clear')
        })
      })

      it('khi bookingProductId = null trên trang công khai -> ẩn hoàn toàn nút chọn gói', () => {
        const { container } = render(
          <PackageComparison
            showPackageButtons={true}
            _resolved={{
              packages: samplePackages,
              bookingProductId: null,
            }}
            puck={{ isEditing: false }}
          />,
        )
        const links = container.querySelectorAll('a[href*="/dat-phien-trai-nghiem"]')
        expect(links.length).toBe(0)
      })

      it('khi bookingProductId = null trong editor -> hiện nút và ghi chú cảnh báo', () => {
        render(
          <PackageComparison
            showPackageButtons={true}
            _resolved={{
              packages: samplePackages,
              bookingProductId: null,
            }}
            puck={{ isEditing: true }}
          />,
        )
        const notes = screen.getAllByText(viStrings.sm04.noBookingProduct)
        expect(notes.length).toBeGreaterThan(0)
      })
    })

    describe('PackageCards', () => {
      it('khi link là /dat-phien-trai-nghiem và có bookingProductId -> link có san-pham', () => {
        render(
          <PackageCards
            buttonText="Đặt phiên trải nghiệm"
            buttonLink="/dat-phien-trai-nghiem"
            _resolved={{
              packages: samplePackages,
              bookingProductId: 88,
            }}
          />,
        )
        const link = screen.getByRole('link', { name: 'Đặt phiên trải nghiệm' })
        expect(link.getAttribute('href')).toContain('san-pham=88')
      })

      it('khi link là /dat-phien-trai-nghiem và bookingProductId = null trên trang công khai -> ẩn nút', () => {
        render(
          <PackageCards
            buttonText="Đặt phiên trải nghiệm"
            buttonLink="/dat-phien-trai-nghiem"
            _resolved={{
              packages: samplePackages,
              bookingProductId: null,
            }}
            puck={{ isEditing: false }}
          />,
        )
        expect(screen.queryByRole('link', { name: 'Đặt phiên trải nghiệm' })).toBeNull()
      })

      it('khi link khác /dat-phien-trai-nghiem -> link giữ nguyên', () => {
        render(
          <PackageCards
            buttonText="Tìm hiểu thêm"
            buttonLink="/ve-tram"
            _resolved={{
              packages: samplePackages,
              bookingProductId: null,
            }}
            puck={{ isEditing: false }}
          />,
        )
        const link = screen.getByRole('link', { name: 'Tìm hiểu thêm' })
        expect(link.getAttribute('href')).toBe('/ve-tram')
      })
    })

    describe('CTASection', () => {
      it('khi link là /dat-phien-trai-nghiem và có bookingProductId -> link có san-pham', () => {
        render(
          <CTASection
            buttonText="Bắt đầu ngay"
            buttonLink="/dat-phien-trai-nghiem"
            _resolved={{
              bookingProductId: 99,
            }}
          />,
        )
        const link = screen.getByRole('link', { name: 'Bắt đầu ngay' })
        expect(link.getAttribute('href')).toContain('san-pham=99')
      })

      it('khi link là /dat-phien-trai-nghiem và bookingProductId = null trên trang công khai -> ẩn nút', () => {
        render(
          <CTASection
            buttonText="Bắt đầu ngay"
            buttonLink="/dat-phien-trai-nghiem"
            _resolved={{
              bookingProductId: null,
            }}
            puck={{ isEditing: false }}
          />,
        )
        expect(screen.queryByRole('link', { name: 'Bắt đầu ngay' })).toBeNull()
      })
    })

    describe('Callout', () => {
      it('khi link là /dat-phien-trai-nghiem và có bookingProductId -> link có san-pham', () => {
        render(
          <Callout
            title="Tiêu đề callout"
            description="Mô tả callout"
            buttonText="Đặt lịch"
            buttonLink="/dat-phien-trai-nghiem"
            _resolved={{
              bookingProductId: 77,
            }}
          />,
        )
        const link = screen.getByRole('link', { name: 'Đặt lịch' })
        expect(link.getAttribute('href')).toContain('san-pham=77')
      })

      it('khi link là /dat-phien-trai-nghiem và bookingProductId = null trên trang công khai -> ẩn nút', () => {
        render(
          <Callout
            title="Tiêu đề callout"
            description="Mô tả callout"
            buttonText="Đặt lịch"
            buttonLink="/dat-phien-trai-nghiem"
            _resolved={{
              bookingProductId: null,
            }}
            puck={{ isEditing: false }}
          />,
        )
        expect(screen.queryByRole('link', { name: 'Đặt lịch' })).toBeNull()
      })
    })

    describe('FAQ (aside booking)', () => {
      it('khi có bookingProductId -> nút aside có link san-pham', () => {
        render(
          <FAQ
            aside="booking"
            bookingButtonText="Đặt lịch ngay"
            bookingButtonLink="/dat-phien-trai-nghiem"
            _resolved={{
              bookingProductId: 55,
            }}
          />,
        )
        const link = screen.getByRole('link', { name: 'Đặt lịch ngay' })
        expect(link.getAttribute('href')).toContain('san-pham=55')
      })

      it('khi bookingProductId = null trên trang công khai -> ẩn nút aside', () => {
        render(
          <FAQ
            aside="booking"
            bookingButtonText="Đặt lịch ngay"
            bookingButtonLink="/dat-phien-trai-nghiem"
            _resolved={{
              bookingProductId: null,
            }}
            puck={{ isEditing: false }}
          />,
        )
        expect(screen.queryByRole('link', { name: 'Đặt lịch ngay' })).toBeNull()
      })

      it('khi bookingProductId = null trong editor -> hiện nút và ghi chú cảnh báo', () => {
        render(
          <FAQ
            aside="booking"
            bookingButtonText="Đặt lịch ngay"
            bookingButtonLink="/dat-phien-trai-nghiem"
            _resolved={{
              bookingProductId: null,
            }}
            puck={{ isEditing: true }}
          />,
        )
        expect(screen.getByText(viStrings.sm04.noBookingProduct)).toBeDefined()
      })
    })
  })
})
