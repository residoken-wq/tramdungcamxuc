import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { VisionCardItem } from '@/components/site/VisionCardItem'
import { IconCard } from '@/components/site/IconCard'
import { HanaStory } from '@/components/site/HanaStory'
import { CardBlock } from '@/puck/blocks/Card'
import { LegalFooterView } from '@/puck/blocks/site/LegalFooter'
import { footerPuckConfig } from '@/puck/config'

describe('PK-31: Trang "Về Trạm" – Xuống dòng, Subtitle color, HanaStory highlights, Footer deep-navy', () => {
  describe('1.1. Xuống dòng (Enter 1 lần = xuống dòng với whitespace-pre-line)', () => {
    it('VisionCardItem content has whitespace-pre-line to respect single line breaks', () => {
      const content = 'VỚI CÁ NHÂN\nTrở thành người bạn đồng hành an toàn.'
      const { container } = render(<VisionCardItem title="TẦM NHÌN" content={content} />)
      const p = container.querySelector('p')
      expect(p).not.toBeNull()
      expect(p?.className).toContain('whitespace-pre-line')
      expect(p?.textContent).toBe(content)
    })

    it('IconCard text has whitespace-pre-line in non-bullet mode', () => {
      const text = 'Dịu dàng & Tinh tế\nĐồng hành an toàn trong từng phiên.'
      const { container } = render(<IconCard title="Gentle" text={text} />)
      const p = container.querySelector('p')
      expect(p).not.toBeNull()
      expect(p?.className).toContain('whitespace-pre-line')
      expect(p?.textContent).toBe(text)
    })

    it('IconCard text has whitespace-pre-line in bullet list mode', () => {
      const text = 'Giới thiệu:\n- Ý 1 dòng 1\n- Ý 2 dòng 2'
      const { container } = render(<IconCard title="Lợi ích" text={text} />)
      const listSpans = container.querySelectorAll('li span.whitespace-pre-line')
      expect(listSpans.length).toBe(2)
      expect(listSpans[0].textContent).toBe('Ý 1 dòng 1')
      expect(listSpans[1].textContent).toBe('Ý 2 dòng 2')
    })
  })

  describe('1.2. Màu "Tiêu đề phụ" của thẻ (Card subtitleColor)', () => {
    it('IconCard applies custom subtitleColor class', () => {
      render(
        <IconCard
          title="Gentle"
          subtitle="Dịu dàng & Tinh tế"
          subtitleColor="bright-magenta"
        />,
      )
      const subtitleEl = screen.getByText('Dịu dàng & Tinh tế')
      expect(subtitleEl.className).toContain('text-bright-magenta')
    })

    it('IconCard defaults subtitleColor to deep-navy on light card and adapts on dark card', () => {
      const { rerender } = render(
        <IconCard title="Gentle" subtitle="Dịu dàng & Tinh tế" />,
      )
      let sub = screen.getByText('Dịu dàng & Tinh tế')
      expect(sub.className).toContain('text-deep-navy/90')

      rerender(
        <IconCard
          title="Gentle"
          subtitle="Dịu dàng & Tinh tế"
          highlight="navy"
        />,
      )
      sub = screen.getByText('Dịu dàng & Tinh tế')
      expect(sub.className).toContain('!text-white/95')
    })

    it('CardBlock exposes subtitleColor in fields and resolves allowed colors', () => {
      expect(CardBlock.fields?.subtitleColor).toBeDefined()
      expect(CardBlock.defaultProps?.subtitleColor).toBe('deep-navy')

      const resolved = CardBlock.resolveFields?.(
        { props: CardBlock.defaultProps } as never,
        {
          fields: CardBlock.fields,
          parent: { type: 'IconCardGrid', props: { bgColor: 'warm-ivory' } },
        } as never,
      ) as any
      expect(resolved?.subtitleColor).toBeDefined()
      expect(resolved?.subtitleColor.type).toBe('select')
    })
  })

  describe('1.3. HanaStory: 3 thẻ đánh số + trích dẫn dạng hộp', () => {
    const sampleHighlights = [
      { title: 'Quan sát', text: 'Lắng nghe cơ thể và nhịp thở.' },
      { title: 'Thấu hiểu', text: 'Nhận diện cảm xúc thật bên dưới.' },
      { title: 'Vững bước', text: 'Lựa chọn phản ứng phù hợp.' },
    ]

    it('renders 3 highlight cards with numbers 01, 02, 03 when highlights prop is provided', () => {
      render(
        <HanaStory
          titleLine1="HÀNH TRÌNH"
          titleLine2="ĐỒNG HÀNH"
          storyContent="Nội dung câu chuyện."
          highlights={sampleHighlights}
        />,
      )

      expect(screen.getByText('01')).toBeDefined()
      expect(screen.getByText('02')).toBeDefined()
      expect(screen.getByText('03')).toBeDefined()
      expect(screen.getByText('Quan sát')).toBeDefined()
      expect(screen.getByText('Thấu hiểu')).toBeDefined()
      expect(screen.getByText('Vững bước')).toBeDefined()
    })

    it('does not render highlight cards when highlights is empty', () => {
      const { container } = render(
        <HanaStory
          titleLine1="HÀNH TRÌNH"
          titleLine2="ĐỒNG HÀNH"
          storyContent="Nội dung câu chuyện."
          highlights={[]}
        />,
      )

      expect(screen.queryByText('01')).toBeNull()
      expect(container.querySelectorAll('.font-display.text-2xl').length).toBe(0)
    })

    it('renders quote in soft-pink box placed ABOVE paragraphs when quoteStyle is box', () => {
      render(
        <HanaStory
          titleLine1="HÀNH TRÌNH"
          titleLine2="ĐỒNG HÀNH"
          quoteLine="Cảm xúc là la bàn chỉ đường."
          quoteStyle="box"
          storyContent="Đoạn văn kể chuyện sau trích dẫn."
        />,
      )

      const quoteEl = screen.getByText(/Cảm xúc là la bàn chỉ đường/)
      const quoteBox = quoteEl.closest('div')
      expect(quoteBox?.className).toContain('bg-soft-pink')
      expect(quoteBox?.className).toContain('text-bright-magenta')

      const storyEl = screen.getByText(/Đoạn văn kể chuyện sau trích dẫn/)
      const textCol = storyEl.closest('.lg\\:col-span-7')
      expect(textCol).not.toBeNull()

      // Verify DOM position: quoteBox comes before storyContent
      const children = Array.from(textCol?.children ?? [])
      const quoteIndex = children.findIndex((el) => el.contains(quoteBox))
      const storyIndex = children.findIndex((el) => el.contains(storyEl))
      expect(quoteIndex).toBeGreaterThanOrEqual(0)
      expect(storyIndex).toBeGreaterThan(quoteIndex)
    })
  })

  describe('1.4. Footer nền deep-navy', () => {
    it('footer root render passes data-footer-bg and applies deep-navy background', () => {
      const RootRender = (footerPuckConfig.root as any).render

      const { container: navyContainer } = render(
        <RootRender footerBg="deep-navy">
          <div data-testid="footer-content">Nội dung chân trang</div>
        </RootRender>,
      )
      const navyWrapper = navyContainer.querySelector('[data-footer-bg="deep-navy"]')
      expect(navyWrapper).not.toBeNull()
      expect(navyWrapper?.className).toContain('bg-deep-navy')
      expect(navyWrapper?.className).toContain('text-white')

      const { container: lightContainer } = render(
        <RootRender footerBg="warm-ivory">
          <div data-testid="footer-content">Nội dung chân trang</div>
        </RootRender>,
      )
      const lightWrapper = lightContainer.querySelector('[data-footer-bg="warm-ivory"]')
      expect(lightWrapper).not.toBeNull()
      expect(lightWrapper?.className).toContain('bg-warm-ivory')
      expect(lightWrapper?.className).toContain('text-deep-navy')
    })

    it('LegalFooterView contains group-data selectors for deep-navy footer styling', () => {
      const legalLinks = [{ slug: 'dieu-khoan', title: 'Điều khoản dịch vụ' }]
      const sellerInfo = { name: 'Trạm Dừng Cảm Xúc', taxCode: '123456789' }

      const { container } = render(
        <div data-footer-bg="deep-navy" className="group/footer">
          <LegalFooterView legalLinks={legalLinks} sellerInfo={sellerInfo} />
        </div>,
      )

      const link = container.querySelector('a')
      expect(link?.className).toContain('group-data-[footer-bg=deep-navy]/footer:text-soft-pink')
      expect(link?.className).toContain('group-data-[footer-bg=deep-navy]/footer:hover:text-white')
    })
  })
})

