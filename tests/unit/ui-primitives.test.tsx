import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Button,
  Card,
  SectionHeader,
  QuoteBlock,
  PriceTag,
  StatusBadge,
  SaleStatus,
  resolveButtonClasses,
} from '@/components/ui'
import { vi } from '@/lib/i18n/vi'

describe('UI Primitives (T0-04)', () => {
  describe('Button Component', () => {
    it('render dạng <button> thông thường khi không có prop href', () => {
      render(<Button>Bấm vào đây</Button>)
      const button = screen.getByRole('button', { name: 'Bấm vào đây' })
      expect(button).toBeDefined()
      expect(button.tagName.toLowerCase()).toBe('button')
    })

    it('render dạng link <a> (Next.js Link) khi có prop href mà không lồng <a> trong <button>', () => {
      render(<Button href="/styleguide">Xem Styleguide</Button>)
      const link = screen.getByRole('link', { name: 'Xem Styleguide' })
      expect(link).toBeDefined()
      expect(link.tagName.toLowerCase()).toBe('a')
      expect(link.getAttribute('href')).toBe('/styleguide')
      // Đảm bảo không có thẻ button nào lồng bên trong link
      expect(link.querySelector('button')).toBeNull()
      // Đảm bảo cha của link không phải là button
      expect(link.closest('button')).toBeNull()
    })

    it('thiết lập aria-busy="true" và vô hiệu hóa khi isLoading=true', () => {
      render(<Button isLoading>Đang lưu</Button>)
      const button = screen.getByRole('button', { name: 'Đang lưu' })
      expect(button.getAttribute('aria-busy')).toBe('true')
      expect((button as HTMLButtonElement).disabled).toBe(true)
    })

    it('thiết lập thuộc tính disabled khi disabled=true', () => {
      render(<Button disabled>Không khả dụng</Button>)
      const button = screen.getByRole('button', { name: 'Không khả dụng' })
      expect((button as HTMLButtonElement).disabled).toBe(true)
    })

    it('Q13 Guardrail: size "sm" với variant "primary" tự động chuyển sang "secondary" để bảo đảm tương phản WCAG AA', () => {
      const smallPrimaryClass = resolveButtonClasses({ variant: 'primary', size: 'sm' })
      expect(smallPrimaryClass).toContain('bg-deep-navy')
      expect(smallPrimaryClass).not.toContain('bg-accent-pink')

      const mdPrimaryClass = resolveButtonClasses({ variant: 'primary', size: 'md' })
      expect(mdPrimaryClass).toContain('bg-accent-pink')
    })
  })

  describe('StatusBadge Component', () => {
    const allStatuses: SaleStatus[] = ['coming_soon', 'on_sale', 'free', 'consult', 'hidden']

    it('hiển thị đầy đủ nhãn tiếng Việt cho cả 5 trạng thái saleStatus từ vi.ts', () => {
      for (const status of allStatuses) {
        const { unmount } = render(<StatusBadge status={status} />)
        const expectedLabel = vi.status[status]
        expect(screen.getByText(expectedLabel)).toBeDefined()
        unmount()
      }
    })

    it('cho phép tùy biến nhãn bằng prop label', () => {
      render(<StatusBadge status="on_sale" label="Ưu đãi giới hạn" />)
      expect(screen.getByText('Ưu đãi giới hạn')).toBeDefined()
    })
  })

  describe('PriceTag Component', () => {
    it('hiển thị cả giá gốc gạch ngang và giá ưu đãi kèm nhãn cho trình đọc màn hình', () => {
      render(<PriceTag originalPrice={250000} salePrice={178000} />)
      expect(screen.getByText('250.000đ')).toBeDefined()
      expect(screen.getByText('178.000đ')).toBeDefined()

      // Kiểm tra văn bản cho screen reader
      const srText = screen.getByText(/Giá gốc: 250\.000đ, Giá ưu đãi: 178\.000đ/)
      expect(srText).toBeDefined()
      expect(srText.className).toContain('sr-only')
    })

    it('hiển thị đúng khi chỉ có một mức giá', () => {
      const { unmount } = render(<PriceTag originalPrice={149000} />)
      expect(screen.getByText('149.000đ')).toBeDefined()
      unmount()

      render(<PriceTag salePrice={149000} />)
      expect(screen.getByText('149.000đ')).toBeDefined()
    })

    it('không hiển thị gì (render null) khi cả hai giá trị đều null, undefined hoặc số âm', () => {
      const { container: c1 } = render(<PriceTag originalPrice={null} salePrice={null} />)
      expect(c1.innerHTML).toBe('')

      const { container: c2 } = render(<PriceTag originalPrice={undefined} salePrice={undefined} />)
      expect(c2.innerHTML).toBe('')

      const { container: c3 } = render(<PriceTag originalPrice={-50000} salePrice={-10000} />)
      expect(c3.innerHTML).toBe('')
    })
  })

  describe('Card Component', () => {
    it('render thẻ div với bo góc rounded-card và các biến thể nền brand book', () => {
      const { container } = render(
        <Card variant="soft-pink" className="test-card">
          Nội dung thẻ
        </Card>
      )
      const el = container.firstElementChild as HTMLElement
      expect(el.className).toContain('rounded-card')
      expect(el.className).toContain('bg-soft-pink')
      expect(el.className).toContain('border-deep-navy/10')
      expect(el.className).toContain('shadow-soft')
    })

    it('cho phép đổi thẻ HTML qua prop "as"', () => {
      const { container } = render(
        <Card as="article">Nội dung bài viết</Card>
      )
      expect(container.querySelector('article')).toBeDefined()
    })
  })

  describe('SectionHeader Component', () => {
    it('render đúng tiêu đề 2 tầng màu (dòng 1 navy, dòng 2 magenta) và dòng cảm xúc', () => {
      render(
        <SectionHeader
          seriesLabel="TẬP THƯƠNG CẢM XÚC"
          titleLine1="Hiểu mình rõ."
          titleLine2="Hành động bền bỉ."
          emotionLine="Dòng cảm xúc nhẹ nhàng."
          as="h2"
        />
      )

      expect(screen.getByText('TẬP THƯƠNG CẢM XÚC')).toBeDefined()
      expect(screen.getByText('Hiểu mình rõ.')).toBeDefined()
      expect(screen.getByText('Hành động bền bỉ.')).toBeDefined()
      expect(screen.getByText('Dòng cảm xúc nhẹ nhàng.')).toBeDefined()
    })
  })

  describe('QuoteBlock Component', () => {
    it('render câu quote bằng font-quote italic và thông tin cite tác giả', () => {
      render(
        <QuoteBlock
          quote="Lỡ nhịp một ngày là không sao cả."
          cite="Hana Lương"
          roleOrContext="Chuyên gia Khai vấn Cảm xúc"
        />
      )

      expect(screen.getByText(/Lỡ nhịp một ngày là không sao cả\./)).toBeDefined()
      expect(screen.getByText('Hana Lương')).toBeDefined()
      expect(screen.getByText(/Chuyên gia Khai vấn Cảm xúc/)).toBeDefined()
    })
  })

  describe('Brand Token & Hex Lock Guardrail (Mục 2 & 14 AGENTS.md)', () => {
    it('tuyệt đối không có mã hex thô hay màu Tailwind ngoài 8 token trong thư mục src/components/ui/', () => {
      const uiDir = path.resolve(__dirname, '../../src/components/ui')
      const files = fs.readdirSync(uiDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))

      // Regex phát hiện hex thô dạng #fff, #123456...
      const rawHexRegex = /#[0-9a-fA-F]{3,8}\b/

      // Danh sách các tiền tố màu mặc định của Tailwind bị cấm
      const forbiddenColors = [
        'red-',
        'blue-',
        'green-',
        'yellow-',
        'indigo-',
        'purple-',
        'pink-',
        'emerald-',
        'teal-',
        'cyan-',
        'sky-',
        'slate-',
        'gray-',
        'zinc-',
        'neutral-',
        'stone-',
        'orange-',
        'amber-',
        'lime-',
      ]

      for (const file of files) {
        const filePath = path.join(uiDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')

        // 1. Không chứa hex thô
        expect(
          rawHexRegex.test(content),
          `File ${file} không được chứa mã hex thô, chỉ dùng CSS variable / Tailwind token`
        ).toBe(false)

        // 2. Không chứa class màu Tailwind ngoài bảng
        for (const forbidden of forbiddenColors) {
          // Bỏ qua nếu là chuỗi trong comment hoặc không phải class
          const colorClassRegex = new RegExp(`\\b(bg|text|border|outline)-${forbidden}`, 'i')
          expect(
            colorClassRegex.test(content),
            `File ${file} không được dùng màu Tailwind ngoài 8 token: ${forbidden}`
          ).toBe(false)
        }
      }
    })
  })
})
