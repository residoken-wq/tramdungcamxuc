// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi as vitest } from 'vitest'

vitest.mock('server-only', () => ({}))
import { HabitOfferClient } from '@/components/habit/HabitOfferClient'
import { getHabitProduct, type HabitProductData } from '@/lib/habit.server'
import { Products } from '@/collections/Products'
import { vi } from '@/lib/i18n/vi'
import { up } from '@/migrations/20261108_052320_pk30_habit_offer_fields'
import type { MigrateUpArgs } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

describe('PK-30: Habit Offer CMS & Field Customization', () => {
  const baseProduct: HabitProductData = {
    id: 1,
    name: 'Habit Tracker số',
    slug: 'habit-tracker-so',
    price: 250000,
    salePrice: 178000,
    trialDays: 28,
    saleStatus: 'on_sale',
    includes: ['Bao gồm 1', 'Bao gồm 2'],
    faq: [{ question: 'Câu hỏi 1?', answer: 'Trả lời 1' }],
    cta: { href: '/thanh-toan', label: 'Bắt đầu', kind: 'buy' },
    videoCount: 20,
    techniqueCount: 11,
  }

  describe('HabitOfferClient rendering & fallbacks', () => {
    it('khi không có field mới: rơi về chữ mặc định trong vi.habit.offer (HTML giống trước)', () => {
      const { container } = render(<HabitOfferClient product={baseProduct} journeyDays={28} />)

      // Hero header mặc định
      expect(screen.getByText(vi.habit.offer.badge)).toBeDefined()
      expect(screen.getByText(vi.habit.offer.titleLine1)).toBeDefined()
      expect(screen.getByText(vi.habit.offer.titleLine2)).toBeDefined()
      expect(screen.getByText(vi.habit.offer.emotionalLine)).toBeDefined()

      // Module lộ trình mặc định (4 module)
      expect(screen.getByText(vi.habit.offer.curriculum.heading)).toBeDefined()
      expect(screen.getByText(vi.habit.offer.curriculum.subheading)).toBeDefined()
      expect(screen.getByText(vi.habit.offer.curriculum.modules[0].title)).toBeDefined()
      expect(screen.getByText(vi.habit.offer.curriculum.modules[1].title)).toBeDefined()
      expect(screen.getByText(vi.habit.offer.curriculum.modules[2].title)).toBeDefined()
      expect(screen.getByText(vi.habit.offer.curriculum.modules[3].title)).toBeDefined()

      // Số module trên stats bar là 4
      const statsElements = container.querySelectorAll('.font-display')
      const statValues = Array.from(statsElements).map((el) => el.textContent?.trim())
      expect(statValues).toContain('4')

      // AU-03 Mục 17: Điểm khác biệt trống trong CMS -> ẩn hoàn toàn phần "khác biệt"
      expect(screen.queryByText(vi.habit.offer.features.heading)).toBeNull()
      expect(screen.queryByText(vi.habit.offer.features.subheading)).toBeNull()
      expect(screen.queryByText(vi.habit.offer.features.items[0].title)).toBeNull()

      // Bottom CTA mặc định
      expect(screen.getByText(vi.habit.offer.bottomTitle(28))).toBeDefined()
      expect(screen.getByText(vi.habit.offer.bottomDesc(20, 11))).toBeDefined()
    })

    it('khi có field mới từ CMS: hiển thị đúng chữ tùy biến và cập nhật số lượng module động', () => {
      const customProduct: HabitProductData = {
        ...baseProduct,
        offerSeriesLabel: 'Khóa học chuyển hóa đặc biệt',
        offerTitleLine1: 'Rèn luyện thói quen',
        offerTitleLine2: 'Mỗi ngày 1% bền bỉ',
        offerEmotionLine: 'Thương mình trong từng bước chân nhỏ.',
        curriculumHeading: 'Lộ trình 5 bước vững chắc',
        curriculumSubheading: 'Thiết kế riêng cho người bận rộn.',
        curriculumModules: [
          { title: 'Module A: Khởi động', description: 'Mô tả A' },
          { title: 'Module B: Tăng tốc', description: 'Mô tả B' },
          { title: 'Module C: Chuyển hóa', description: 'Mô tả C' },
          { title: 'Module D: Vững vàng', description: 'Mô tả D' },
          { title: 'Module E: Tỏa sáng', description: 'Mô tả E' },
        ],
        featuresHeading: 'Điểm chạm độc bản của Trạm',
        featuresSubheading: 'Được đúc kết từ hơn 500 giờ khai vấn.',
        featureItems: [
          { title: 'Khác biệt 1: Không phán xét', description: 'Chi tiết 1' },
          { title: 'Khác biệt 2: Nhịp tuần tự nhiên', description: 'Chi tiết 2' },
        ],
        bottomTitle: 'Sẵn sàng chuyển mình sau {ngay} ngày cùng Hana',
        bottomDescription: 'Đăng ký ngay hôm nay để nhận trọn vẹn đặc quyền.',
      }

      const { container } = render(<HabitOfferClient product={customProduct} journeyDays={30} />)

      // Chữ tùy biến xuất hiện
      expect(screen.getByText('Khóa học chuyển hóa đặc biệt')).toBeDefined()
      expect(screen.getByText('Rèn luyện thói quen')).toBeDefined()
      expect(screen.getByText('Mỗi ngày 1% bền bỉ')).toBeDefined()
      expect(screen.getByText('Thương mình trong từng bước chân nhỏ.')).toBeDefined()
      expect(screen.getByText('Lộ trình 5 bước vững chắc')).toBeDefined()
      expect(screen.getByText('Thiết kế riêng cho người bận rộn.')).toBeDefined()

      // 5 module tùy biến
      expect(screen.getByText('Module A: Khởi động')).toBeDefined()
      expect(screen.getByText('Module E: Tỏa sáng')).toBeDefined()

      // Số module trên stats bar tự đếm là 5
      const statsElements = container.querySelectorAll('.font-display')
      const statValues = Array.from(statsElements).map((el) => el.textContent?.trim())
      expect(statValues).toContain('5')

      // Điểm khác biệt tùy biến
      expect(screen.getByText('Điểm chạm độc bản của Trạm')).toBeDefined()
      expect(screen.getByText('Khác biệt 1: Không phán xét')).toBeDefined()
      expect(screen.getByText('Khác biệt 2: Nhịp tuần tự nhiên')).toBeDefined()

      // Bottom CTA thay {ngay} bằng journeyDays (30)
      expect(screen.getByText('Sẵn sàng chuyển mình sau 30 ngày cùng Hana')).toBeDefined()
      expect(screen.getByText('Đăng ký ngay hôm nay để nhận trọn vẹn đặc quyền.')).toBeDefined()
    })
  })

  describe('Products collection tab condition', () => {
    it('tab "Trang giới thiệu" chỉ hiển thị với type = digital_tool', () => {
      // Tìm tabs container trong Products.fields
      const tabsField = Products.fields.find((f) => f.type === 'tabs') as {
        type: 'tabs'
        tabs: Array<{ label: string; admin?: { condition?: (data: { type?: string }) => boolean } }>
      }
      expect(tabsField).toBeDefined()

      const introTab = tabsField.tabs.find((t) => t.label === vi.pk30.tabIntro)
      expect(introTab).toBeDefined()
      expect(introTab?.admin?.condition).toBeDefined()

      const condition = introTab!.admin!.condition!
      expect(condition({ type: 'digital_tool' })).toBe(true)
      expect(condition({ type: 'ebook' })).toBe(false)
      expect(condition({ type: 'toolkit' })).toBe(false)
      expect(condition({ type: 'package' })).toBe(false)
      expect(condition({ type: 'workshop' })).toBe(false)
      expect(condition({ type: 'community' })).toBe(false)
      expect(condition({ type: 'coaching_trial' })).toBe(false)
      expect(condition({ type: 'b2b' })).toBe(false)
    })
  })

  describe('getHabitProduct security & public fields', () => {
    it('không bao giờ trả về trường files nhạy cảm', async () => {
      // Mock payload
      const mockPayload = {
        find: async () => ({
          docs: [
            {
              id: 99,
              name: 'Habit Tracker số',
              slug: 'habit-tracker-so',
              saleStatus: 'published',
              files: [{ file: 123 }],
              offerTitleLine1: 'Tiêu đề thử nghiệm',
            },
          ],
        }),
        count: async () => 0,
      } as unknown as Payload

      const product = await getHabitProduct(mockPayload)
      expect(product).not.toBeNull()
      expect(product?.offerTitleLine1).toBe('Tiêu đề thử nghiệm')
      // files không nằm trong HabitProductData
      expect('files' in (product || {})).toBe(false)
    })
  })

  describe('Migration up() seeding logic', () => {
    it('điền sẵn chữ mặc định từ vi.habit.offer khi field trống, không ghi đè khi đã có chữ', async () => {
      let updatedData: Record<string, unknown> | null = null

      const mockDb = {
        execute: async () => {},
      }

      // Giả lập sản phẩm đang trống
      const emptyDoc = {
        id: 42,
        slug: 'habit-tracker-so',
        _status: 'published',
        offerTitleLine1: null,
        curriculumHeading: null,
        curriculumModules: [],
      }

      const mockPayloadEmpty = {
        find: async () => ({
          docs: [{ ...emptyDoc }],
        }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          updatedData = data
          return { id: 42, ...data }
        },
      } as unknown as Payload

      await up({
        db: mockDb as never,
        payload: mockPayloadEmpty,
        req: {} as never,
      } as MigrateUpArgs)

      expect(updatedData).not.toBeNull()
      expect(updatedData!['offerTitleLine1']).toBe(vi.habit.offer.titleLine1)
      expect(updatedData!['curriculumHeading']).toBe(vi.habit.offer.curriculum.heading)
      expect(updatedData!['bottomTitle']).toBe('Bắt đầu hành trình {ngay} ngày của bạn')

      // Chạy lần 2: sản phẩm đã có chữ do người dùng tùy biến -> không ghi đè
      let secondUpdateCalled = false
      const populatedDoc = {
        id: 42,
        slug: 'habit-tracker-so',
        _status: 'published',
        offerTitleLine1: 'Chữ đã được Hana sửa',
        curriculumHeading: 'Lộ trình mới',
        curriculumModules: [{ title: 'Module 1', description: 'Mô tả' }],
      }

      const mockPayloadPopulated = {
        find: async () => ({
          docs: [{ ...populatedDoc }],
        }),
        update: async () => {
          secondUpdateCalled = true
        },
      } as unknown as Payload

      await up({
        db: mockDb as never,
        payload: mockPayloadPopulated,
        req: {} as never,
      } as MigrateUpArgs)

      expect(secondUpdateCalled).toBe(false)
    })

    it('không đụng tới các sản phẩm khác (không phải habit-tracker-so)', async () => {
      let updateCalled = false
      const mockPayload = {
        find: async () => ({
          docs: [], // không tìm thấy habit-tracker-so
        }),
        update: async () => {
          updateCalled = true
        },
      } as unknown as Payload

      await up({
        db: { execute: async () => {} } as never,
        payload: mockPayload,
        req: {} as never,
      } as MigrateUpArgs)

      expect(updateCalled).toBe(false)
    })
  })
})
