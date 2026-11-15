// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi as vitest } from 'vitest'

vitest.mock('server-only', () => ({}))
import { HabitOfferClient } from '@/components/habit/HabitOfferClient'
import { getHabitProduct, type HabitProductData } from '@/lib/habit.server'
import { vi } from '@/lib/i18n/vi'
import { up, down } from '@/migrations/20261115_180000_bx03_product_sections'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

describe('BX-03: Product Offer Page Section Toggles ("Ẩn phần này")', () => {
  const fullProduct: HabitProductData = {
    id: 1,
    name: 'Habit Tracker số',
    slug: 'habit-tracker-so',
    price: 250000,
    salePrice: 178000,
    trialDays: 28,
    saleStatus: 'on_sale',
    shortDescription: 'Bộ tài liệu tự học bao gồm:',
    includes: ['20 video bài giảng', '11 kỹ thuật thực hành'],
    faq: [{ question: 'Tôi có được xem lại video không?', answer: 'Có, bạn được xem lại vĩnh viễn.' }],
    cta: { href: '/thanh-toan', label: 'Bắt đầu dùng thử', kind: 'trial' },
    videoCount: 20,
    techniqueCount: 11,
    offerSeriesLabel: 'Khóa học thói quen',
    offerTitleLine1: 'Rèn luyện thói quen',
    offerTitleLine2: 'Mỗi ngày 1% bền bỉ',
    offerEmotionLine: 'Thương mình trong từng bước chân nhỏ.',
    curriculumHeading: 'Lộ trình 4 giai đoạn tinh gọn',
    curriculumSubheading: 'Được thiết kế từng bước vững chắc.',
    curriculumModules: [
      { title: 'Giai đoạn 1: Nhận diện', description: 'Quan sát nhịp sinh học' },
      { title: 'Giai đoạn 2: Neo giữ', description: 'Gắn thói quen vào mỏ neo' },
    ],
    featuresHeading: 'Tại sao Habit Tracker số khác biệt?',
    featuresSubheading: 'Thiết kế riêng cho người từng nhiều lần bỏ cuộc.',
    featureItems: [
      { title: 'Không đếm chuỗi', description: 'Không phạt khi lỡ nhịp' },
      { title: 'Nhịp tuần 5/7', description: 'Dành 2 ngày nghỉ ngơi' },
    ],
    bottomTitle: 'Bắt đầu hành trình 28 ngày của bạn',
    bottomDescription: 'Tận hưởng 28 ngày trọn vẹn đặc quyền.',
  }

  describe('1. Mặc định (6 cờ tắt / undefined) -> HTML hiển thị đầy đủ như cũ', () => {
    it('hiển thị đầy đủ tất cả các phần khi cả 6 cờ đều tắt (false)', () => {
      const defaultProduct: HabitProductData = {
        ...fullProduct,
        hideOfferIncludes: false,
        hideOfferStats: false,
        hideOfferCurriculum: false,
        hideOfferFeatures: false,
        hideOfferFaq: false,
        hideOfferBottom: false,
      }

      const { container } = render(<HabitOfferClient product={defaultProduct} journeyDays={28} />)

      // Hero luôn hiện
      expect(screen.getByText('Khóa học thói quen')).toBeDefined()
      expect(screen.getByText('Rèn luyện thói quen')).toBeDefined()
      expect(screen.getAllByText('Bắt đầu dùng thử →').length).toBeGreaterThan(0)

      // Includes list trong Hero hiện
      expect(screen.getByText('Bộ tài liệu tự học bao gồm:')).toBeDefined()
      expect(screen.getByText('20 video bài giảng')).toBeDefined()

      // Stats bar hiện
      expect(screen.getByText(vi.habit.offer.stats.videos)).toBeDefined()
      expect(screen.getByText(vi.habit.offer.stats.techniques)).toBeDefined()

      // Curriculum hiện
      expect(screen.getByText('Lộ trình 4 giai đoạn tinh gọn')).toBeDefined()
      expect(screen.getByText('Giai đoạn 1: Nhận diện')).toBeDefined()

      // Features hiện (vì có featureItems và hideOfferFeatures = false)
      expect(screen.getByText('Tại sao Habit Tracker số khác biệt?')).toBeDefined()
      expect(screen.getByText('Không đếm chuỗi')).toBeDefined()

      // FAQ hiện
      expect(screen.getByText('Tôi có được xem lại video không?')).toBeDefined()

      // Bottom CTA hiện
      expect(screen.getByText('Bắt đầu hành trình 28 ngày của bạn')).toBeDefined()

      // Nền xen kẽ chuẩn ban đầu
      const sections = container.querySelectorAll('section')
      expect(sections.length).toBe(6)
      expect(sections[0].className).toContain('bg-warm-ivory') // Hero
      expect(sections[1].className).toContain('bg-white')      // Stats
      expect(sections[2].className).toContain('bg-warm-ivory') // Curriculum
      expect(sections[3].className).toContain('bg-white')      // Features
      expect(sections[4].className).toContain('bg-warm-ivory') // FAQ
      expect(sections[5].className).toContain('bg-brand-gradient') // Bottom CTA
    })
  })

  describe('2. Bật từng cờ -> đúng phần biến mất, các phần khác vẫn còn', () => {
    it('hideOfferIncludes: true -> ẩn danh sách tài liệu trong hero, các phần khác còn', () => {
      const product = { ...fullProduct, hideOfferIncludes: true }
      render(<HabitOfferClient product={product} />)

      expect(screen.queryByText('Bộ tài liệu tự học bao gồm:')).toBeNull()
      expect(screen.queryByText('20 video bài giảng')).toBeNull()

      // Hero tiêu đề và nút mua vẫn còn
      expect(screen.getByText('Rèn luyện thói quen')).toBeDefined()
      expect(screen.getAllByText('Bắt đầu dùng thử →').length).toBeGreaterThan(0)
      // Stats, Curriculum, Features, FAQ, Bottom vẫn còn
      expect(screen.getByText(vi.habit.offer.stats.videos)).toBeDefined()
      expect(screen.getByText('Lộ trình 4 giai đoạn tinh gọn')).toBeDefined()
      expect(screen.getByText('Tại sao Habit Tracker số khác biệt?')).toBeDefined()
      expect(screen.getByText('Tôi có được xem lại video không?')).toBeDefined()
      expect(screen.getByText('Bắt đầu hành trình 28 ngày của bạn')).toBeDefined()
    })

    it('hideOfferStats: true -> ẩn thanh số liệu, curriculum chuyển sang nền trắng để xen kẽ hợp lý', () => {
      const product = { ...fullProduct, hideOfferStats: true }
      const { container } = render(<HabitOfferClient product={product} />)

      expect(screen.queryByText(vi.habit.offer.stats.videos)).toBeNull()
      expect(screen.queryByText(vi.habit.offer.stats.techniques)).toBeNull()

      // Curriculum vẫn còn và tự chuyển sang bg-white để xen kẽ với Hero (warm-ivory)
      expect(screen.getByText('Lộ trình 4 giai đoạn tinh gọn')).toBeDefined()
      const sections = container.querySelectorAll('section')
      expect(sections.length).toBe(5)
      expect(sections[0].className).toContain('bg-warm-ivory') // Hero
      expect(sections[1].className).toContain('bg-white')      // Curriculum (chuyển sang trắng để xen kẽ)
      expect(sections[2].className).toContain('bg-warm-ivory') // Features (chuyển sang warm-ivory)
      expect(sections[3].className).toContain('bg-white')      // FAQ (chuyển sang trắng)
      expect(sections[4].className).toContain('bg-brand-gradient') // Bottom
    })

    it('hideOfferCurriculum: true -> ẩn phần lộ trình, các phần khác còn', () => {
      const product = { ...fullProduct, hideOfferCurriculum: true }
      const { container } = render(<HabitOfferClient product={product} />)

      expect(screen.queryByText('Lộ trình 4 giai đoạn tinh gọn')).toBeNull()
      expect(screen.queryByText('Giai đoạn 1: Nhận diện')).toBeNull()

      // Stats, Features, FAQ, Bottom vẫn còn
      expect(screen.getByText(vi.habit.offer.stats.videos)).toBeDefined()
      expect(screen.getByText('Tại sao Habit Tracker số khác biệt?')).toBeDefined()
      expect(screen.getByText('Tôi có được xem lại video không?')).toBeDefined()
      expect(screen.getByText('Bắt đầu hành trình 28 ngày của bạn')).toBeDefined()

      // Kiểm tra xen kẽ: Hero (warm-ivory) -> Stats (white) -> Features (warm-ivory) -> FAQ (white) -> Bottom
      const sections = container.querySelectorAll('section')
      expect(sections.length).toBe(5)
      expect(sections[0].className).toContain('bg-warm-ivory')
      expect(sections[1].className).toContain('bg-white')
      expect(sections[2].className).toContain('bg-warm-ivory')
      expect(sections[3].className).toContain('bg-white')
      expect(sections[4].className).toContain('bg-brand-gradient')
    })

    it('hideOfferFeatures: true -> ẩn phần "khác biệt" ngay cả khi có dữ liệu', () => {
      const product = { ...fullProduct, hideOfferFeatures: true }
      render(<HabitOfferClient product={product} />)

      expect(screen.queryByText('Tại sao Habit Tracker số khác biệt?')).toBeNull()
      expect(screen.queryByText('Không đếm chuỗi')).toBeNull()

      // Curriculum và FAQ vẫn còn
      expect(screen.getByText('Lộ trình 4 giai đoạn tinh gọn')).toBeDefined()
      expect(screen.getByText('Tôi có được xem lại video không?')).toBeDefined()
    })

    it('hideOfferFaq: true -> ẩn phần câu hỏi thường gặp, các phần khác còn', () => {
      const product = { ...fullProduct, hideOfferFaq: true }
      render(<HabitOfferClient product={product} />)

      expect(screen.queryByText('Tôi có được xem lại video không?')).toBeNull()
      expect(screen.getByText('Lộ trình 4 giai đoạn tinh gọn')).toBeDefined()
      expect(screen.getByText('Tại sao Habit Tracker số khác biệt?')).toBeDefined()
      expect(screen.getByText('Bắt đầu hành trình 28 ngày của bạn')).toBeDefined()
    })

    it('hideOfferBottom: true -> ẩn khối kêu gọi cuối trang', () => {
      const product = { ...fullProduct, hideOfferBottom: true }
      render(<HabitOfferClient product={product} />)

      expect(screen.queryByText('Bắt đầu hành trình 28 ngày của bạn')).toBeNull()
      expect(screen.queryByText('Tận hưởng 28 ngày trọn vẹn đặc quyền.')).toBeNull()

      // Hero nút mua và các phần trên vẫn còn
      expect(screen.getByText('Bắt đầu dùng thử →')).toBeDefined()
      expect(screen.getByText('Tôi có được xem lại video không?')).toBeDefined()
    })
  })

  describe('3. Rà soát AU-03 & Tình huống Hana bật ẩn theo audit mục 17', () => {
    it('"khác biệt" trống + cờ tắt -> vẫn tự ẩn theo AU-03', () => {
      const productWithoutFeatures: HabitProductData = {
        ...fullProduct,
        featureItems: [],
        hideOfferFeatures: false,
      }
      render(<HabitOfferClient product={productWithoutFeatures} />)

      expect(screen.queryByText('Tại sao Habit Tracker số khác biệt?')).toBeNull()
    })

    it('Hana bật ẩn cả "khác biệt" và "FAQ" -> xen kẽ nền hoàn hảo không dính mảng', () => {
      const product = {
        ...fullProduct,
        hideOfferFeatures: true,
        hideOfferFaq: true,
      }
      const { container } = render(<HabitOfferClient product={product} />)

      expect(screen.queryByText('Tại sao Habit Tracker số khác biệt?')).toBeNull()
      expect(screen.queryByText('Tôi có được xem lại video không?')).toBeNull()

      // Các phần còn lại: Hero (warm-ivory) -> Stats (white) -> Curriculum (warm-ivory) -> Bottom (brand-gradient)
      const sections = container.querySelectorAll('section')
      expect(sections.length).toBe(4)
      expect(sections[0].className).toContain('bg-warm-ivory')
      expect(sections[1].className).toContain('bg-white')
      expect(sections[2].className).toContain('bg-warm-ivory')
      expect(sections[3].className).toContain('bg-brand-gradient')
    })
  })

  describe('4. getHabitProduct đọc đủ 6 cờ từ collection products', () => {
    it('đọc đúng cả 6 cờ từ Payload doc', async () => {
      const mockDoc = {
        id: 10,
        name: 'Habit Tracker',
        slug: 'habit-tracker-so',
        saleStatus: 'on_sale',
        hideOfferIncludes: true,
        hideOfferStats: false,
        hideOfferCurriculum: true,
        hideOfferFeatures: false,
        hideOfferFaq: true,
        hideOfferBottom: false,
      }

      const mockPayload = {
        find: vitest.fn().mockResolvedValue({ docs: [mockDoc] }),
        count: vitest.fn().mockResolvedValue({ totalDocs: 10 }),
      } as unknown as Parameters<typeof getHabitProduct>[0]

      const result = await getHabitProduct(mockPayload)

      expect(result).not.toBeNull()
      expect(result?.hideOfferIncludes).toBe(true)
      expect(result?.hideOfferStats).toBe(false)
      expect(result?.hideOfferCurriculum).toBe(true)
      expect(result?.hideOfferFeatures).toBe(false)
      expect(result?.hideOfferFaq).toBe(true)
      expect(result?.hideOfferBottom).toBe(false)
    })
  })

  describe('5. Migration 20261115_180000_bx03_product_sections', () => {
    it('up() và down() chạy qua lệnh execute SQL không ném lỗi', async () => {
      const executeMock = vitest.fn().mockResolvedValue(undefined)
      const mockDb = { execute: executeMock }

      await up({ db: mockDb } as unknown as MigrateUpArgs)
      expect(executeMock).toHaveBeenCalledTimes(1)

      await down({ db: mockDb } as unknown as MigrateDownArgs)
      expect(executeMock).toHaveBeenCalledTimes(2)
    })
  })
})
