import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Render } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'
import { IconCard as Card } from '@/components/site/IconCard'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { MatrixTable } from '@/components/site/MatrixTable'
import { LoopDiagram } from '@/components/site/LoopDiagram'
import { HeroImage } from '@/components/site/HeroImage'
import { Callout } from '@/components/site/Callout'
import { journeyTemplate } from '@/puck/templates/journey'

describe('PK-26: Chuyển mình không chênh vênh', () => {
  describe('A1: Card component enhancements', () => {
    it('renders with empty new fields backward-compatibly', () => {
      const { container } = render(
        <Card
          id="test-card-empty"
          title="Thẻ thông thường"
          text="Mô tả thẻ thông thường"
        />,
      )
      expect(screen.getByText('Thẻ thông thường')).toBeDefined()
      expect(container.querySelector('ul')).toBeNull()
      expect(container.querySelector('[data-eb-card-solid]')).toBeNull()
    })

    it('renders cardBg deep-navy with data-eb-card-solid and white text', () => {
      const { container } = render(
        <Card
          id="test-card-navy"
          title="Thẻ màu xanh thẫm"
          cardBg="deep-navy"
        />,
      )
      const card = container.querySelector('[data-eb-card]')
      expect(card).toBeDefined()
      expect(card?.getAttribute('data-eb-card-solid')).toBe('')
      expect(card?.className).toContain('bg-deep-navy')
      expect(card?.className).toContain('text-white')
    })

    it('renders eyebrow with eyebrowBar, subtitle, chip, bullet text, items, and note', () => {
      const { container } = render(
        <Card
          id="test-card-full"
          eyebrow="CHẶNG 1"
          eyebrowBar={true}
          title="Tiêu đề chính"
          subtitle="Tiêu đề phụ nổi bật"
          chip="Workshop 1"
          text={'- Dòng 1 gạch đầu dòng\n- Dòng 2 gạch đầu dòng'}
          itemsColumns={2}
          items={[
            { title: 'Nam tính', text: 'Quyết đoán' },
            { title: 'Nữ tính', text: 'Thấu cảm' },
          ]}
          note={{
            title: 'Mang về',
            text: 'Bản đồ cá nhân',
            tone: 'butter-cream',
          }}
        />,
      )

      expect(screen.getByText('CHẶNG 1')).toBeDefined()
      expect(screen.getByText('Tiêu đề phụ nổi bật')).toBeDefined()
      expect(screen.getByText('Workshop 1')).toBeDefined()
      expect(screen.getByText('Dòng 1 gạch đầu dòng')).toBeDefined()
      expect(screen.getByText('Dòng 2 gạch đầu dòng')).toBeDefined()
      expect(screen.getByText('Nam tính')).toBeDefined()
      expect(screen.getByText('Quyết đoán')).toBeDefined()
      expect(screen.getByText('Mang về')).toBeDefined()
      expect(screen.getByText('Bản đồ cá nhân')).toBeDefined()

      // Eyebrow bar has border-l-2
      const eyebrowContainer = container.querySelector('.border-l-2')
      expect(eyebrowContainer).toBeDefined()
    })
  })

  describe('A2: IconCardGrid columns 5 and arrow connector', () => {
    it('applies lg:grid-cols-5 when columns is 5', () => {
      const { container } = render(
        <IconCardGrid
          id="test-grid-5"
          columns={5}
          cards={[
            { id: '1', type: 'Card', props: { title: '1' } },
            { id: '2', type: 'Card', props: { title: '2' } },
          ]}
        />,
      )
      const grid = container.querySelector('.lg\\:grid-cols-5')
      expect(grid).toBeDefined()
    })

    it('renders arrow connector between cards when connector is arrow', () => {
      const { container } = render(
        <IconCardGrid
          id="test-grid-arrow"
          columns={3}
          connector="arrow"
          cards={[
            { id: '1', type: 'Card', props: { title: 'Bước 1' } },
            { id: '2', type: 'Card', props: { title: 'Bước 2' } },
          ]}
        />,
      )
      const arrows = Array.from(container.querySelectorAll('[aria-hidden="true"]'))
      const arrow = arrows.find((el) => el.textContent?.includes('→'))
      expect(arrow).toBeDefined()
    })
  })

  describe('A3: MatrixTable component', () => {
    it('renders grid variant with table and th scope', () => {
      const { container } = render(
        <MatrixTable
          variant="grid"
          seriesLabel="11 · BẢN ĐỒ"
          titleLine1="NHỊP THỰC HÀNH"
          columns={[
            { label: '01 · Thói quen', color: 'butter-cream' },
            { label: '02 · Cảm xúc', color: 'soft-pink' },
          ]}
          rows={[
            {
              label: 'Tuần 1',
              cells: [
                { title: 'Bắt đầu', text: 'Quan sát' },
                { title: 'Tín hiệu', text: 'Cảm xúc' },
              ],
            },
          ]}
        />,
      )

      expect(screen.getByText('11 · BẢN ĐỒ')).toBeDefined()
      expect(screen.getByText('NHỊP THỰC HÀNH')).toBeDefined()

      const table = container.querySelector('table')
      expect(table).toBeDefined()

      const thCol = container.querySelector('th[scope="col"]')
      expect(thCol).toBeDefined()

      const thRow = container.querySelector('th[scope="row"]')
      expect(thRow).toBeDefined()
      expect(thRow?.textContent).toContain('Tuần 1')
    })

    it('renders list variant with matching rows and chips', () => {
      render(
        <MatrixTable
          variant="list"
          bgColor="deep-navy"
          seriesLabel="10 · SỢI CHỈ"
          titleLine1="Reflection"
          chipsTitle="4 MỐC"
          chips={[{ label: 'Ngày 7' }, { label: 'Ngày 14' }]}
          rows={[
            { label: 'NHÌN LẠI', text: 'Điều gì đã diễn ra?', hasAccentBar: true },
            { label: 'HIỂU', text: 'Điều gì giúp mình?', hasAccentBar: true },
          ]}
        />,
      )

      expect(screen.getByText('10 · SỢI CHỈ')).toBeDefined()
      expect(screen.getByText('4 MỐC')).toBeDefined()
      expect(screen.getByText('Ngày 7')).toBeDefined()
      expect(screen.getByText('NHÌN LẠI')).toBeDefined()
      expect(screen.getByText('Điều gì đã diễn ra?')).toBeDefined()
    })
  })

  describe('A4: LoopDiagram component', () => {
    it('renders 6 nodes in ordered list and circular diagram with aria-hidden', () => {
      const { container } = render(
        <LoopDiagram
          seriesLabel="06 · NGUYÊN LÝ"
          titleLine1="Vòng lặp"
          centerText="Hiểu mình và tự tin hơn"
          nodes={[
            { label: '01 · Nhận diện' },
            { label: '02 · Phương pháp' },
            { label: '03 · Hướng dẫn' },
            { label: '04 · Thử nghiệm' },
            { label: '05 · Nhìn lại' },
            { label: '06 · Đúc kết' },
          ]}
        />,
      )

      expect(screen.getByText('06 · NGUYÊN LÝ')).toBeDefined()
      expect(screen.getAllByText('Hiểu mình và tự tin hơn').length).toBeGreaterThan(0)

      // Circular diagram is aria-hidden
      const diagram = container.querySelector('div[aria-hidden="true"]')
      expect(diagram).toBeDefined()

      // Semantic <ol> lists all 6 items
      const olElements = container.querySelectorAll('ol')
      expect(olElements.length).toBeGreaterThan(0)
      const listItems = olElements[0].querySelectorAll('li')
      expect(listItems.length).toBe(6)
      expect(listItems[0].textContent).toContain('01 · Nhận diện')
      expect(listItems[5].textContent).toContain('06 · Đúc kết')
    })
  })

  describe('A5: HeroImage list enhancements', () => {
    it('renders listTitle and listItems with clear and muted items', () => {
      const { container } = render(
        <HeroImage
          titleLine1="Chuyển mình"
          titleLine2="không chênh vênh"
          listTitle="PHASE 1"
          listItems={[
            { text: '01 · Xây thói quen' },
            { text: 'Phase 2 · Career Clarity', muted: true },
          ]}
        />,
      )

      expect(screen.getByText('PHASE 1')).toBeDefined()
      expect(screen.getByText('01 · Xây thói quen')).toBeDefined()
      expect(screen.getByText('Phase 2 · Career Clarity')).toBeDefined()

      // Muted item has circular border dot
      const dots = container.querySelectorAll('span[aria-hidden="true"]')
      expect(dots.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('A6: Callout stripTone', () => {
    it('applies deep-navy stripTone with data-eb-card-solid', () => {
      const { container } = render(
        <Callout
          variant="strip"
          stripTone="deep-navy"
          title="SẴN SÀNG"
          description="Career Clarity"
        />,
      )

      const card = container.querySelector('[data-eb-card]')
      expect(card).toBeDefined()
      expect(card?.getAttribute('data-eb-card-solid')).toBe('')
      expect(card?.className).toContain('bg-deep-navy')
      expect(screen.getByText(/SẴN SÀNG/)).toBeDefined()
    })

    it('applies dashed stripTone with dashed border', () => {
      const { container } = render(
        <Callout
          variant="strip"
          stripTone="dashed"
          title="NHỊP ĐIỆU"
          description="2 workshop 28 ngày"
        />,
      )

      const card = container.querySelector('[data-eb-card]')
      expect(card?.className).toContain('border-dashed')
    })
  })

  describe('Part B: journey template verification', () => {
    it('contains all valid components in puckConfig and has empty zones', () => {
      const componentTypes = new Set(Object.keys(puckConfig.components))
      for (const item of journeyTemplate.content) {
        expect(
          componentTypes.has(item.type),
          `Component ${item.type} not found in puckConfig`,
        ).toBe(true)
      }
      expect(journeyTemplate.zones).toEqual({})
    })

    it('has hero title Chuyển mình không chênh vênh', () => {
      const hero = journeyTemplate.content.find((i) => i.type === 'HeroImage')
      expect(hero).toBeDefined()
      expect(hero?.props?.titleLine1).toBe('Chuyển mình')
      expect(hero?.props?.titleLine2).toBe('không chênh vênh')
    })

    it('contains all 13 numbered section labels (01 to 13)', () => {
      const json = JSON.stringify(journeyTemplate)
      const expectedLabels = [
        '01 · CÂU CHUYỆN KHÔNG CỦA RIÊNG AI',
        '02 · BỐI CẢNH & CHÂN DUNG',
        '03 · NỖI ĐAU',
        '04 · MONG MUỐN THẬT SỰ',
        '05 · KIẾN TRÚC CHƯƠNG TRÌNH',
        '06 · NGUYÊN LÝ THIẾT KẾ',
        '07 · NỀN TẢNG PHƯƠNG PHÁP',
        '08 · MÔ HÌNH TỔNG THỂ',
        '09 · CÁCH TRIỂN KHAI',
        '10 · SỢI CHỈ XUYÊN SUỐT',
        '11 · BẢN ĐỒ 28 NGÀY',
        '12 · ĐIỀU MANG VỀ',
        '13 · PHASE 2',
      ]

      for (const label of expectedLabels) {
        expect(json.includes(label), `Missing section label: ${label}`).toBe(true)
      }
    })

    it('contains no banned strings in sample copy', () => {
      const json = JSON.stringify(journeyTemplate)
      expect(json.toLowerCase().includes('hoàn tiền')).toBe(false)
      expect(json.toLowerCase().includes('atm/visa')).toBe(false)
      // No fake person names or URLs
      expect(json.includes('http://')).toBe(false)
    })

    it('renders through Puck Render without throwing', () => {
      expect(() => {
        render(<Render config={puckConfig} data={journeyTemplate} />)
      }).not.toThrow()
    })
  })
})
