import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StepOnePercent } from '@/components/habit/flow/StepOnePercent'
import { vi } from '@/lib/i18n/vi'
import type {
  CleanHabitOnePercent,
  CleanStepQuote,
  CleanTitledText,
} from '@/lib/habit/journey-content.server'

describe('HB-18: StepOnePercent (Bước 2 – 1% Better)', () => {
  it('1. Khi CMS rỗng (không có unknowns, không closing, không quote): ẩn hoàn toàn khối 3 điều và quote', () => {
    const emptyOnePercent: CleanHabitOnePercent = {
      title: '1% Better Mỗi Ngày',
      dailyPercent: 1,
      maxDays: 365,
      facts: [],
      closing: null,
    }

    render(<StepOnePercent onePercent={emptyOnePercent} unknowns={[]} quote={null} />)

    // Khối 3 điều chưa biết bị ẩn
    expect(screen.queryByTestId('one-percent-unknowns')).toBeNull()
    expect(screen.queryByText(vi.hb18.onePercent.unknownsTitle)).toBeNull()
    expect(screen.queryByTestId('one-percent-closing')).toBeNull()

    // Khối câu trích dẫn bị ẩn
    expect(screen.queryByTestId('one-percent-quote')).toBeNull()
  })

  it('2. Khi có dữ liệu: hiển thị đầy đủ 3 điều có đánh số và câu kết closing', () => {
    const sampleUnknowns: CleanTitledText[] = [
      {
        title: 'Tác động kép của thói quen',
        body: '1% mỗi ngày tạo ra kết quả gấp 37 lần sau một năm.',
      },
      {
        title: 'Thung lũng của sự thất vọng',
        body: 'Những ngày đầu kết quả chưa rõ rệt khiến nhiều người bỏ cuộc.',
      },
      {
        title: 'Hệ thống hơn mục tiêu',
        body: 'Bạn không đạt được mục tiêu, bạn rơi xuống mức của hệ thống.',
      },
    ]

    const onePercentWithClosing: CleanHabitOnePercent = {
      title: '1% Better Mỗi Ngày',
      dailyPercent: 1,
      maxDays: 365,
      facts: [],
      closing: 'Lời giải không nằm ở cố gắng nhiều hơn, mà ở việc thiết kế môi trường.',
    }

    render(
      <StepOnePercent onePercent={onePercentWithClosing} unknowns={sampleUnknowns} quote={null} />,
    )

    // Khối 3 điều hiển thị
    const unknownsSection = screen.getByTestId('one-percent-unknowns')
    expect(unknownsSection).not.toBeNull()
    expect(screen.getByText(vi.hb18.onePercent.unknownsTitle)).not.toBeNull()

    // Kiểm tra 3 điều được hiển thị với tiêu đề và nội dung
    expect(screen.getByText('Tác động kép của thói quen')).not.toBeNull()
    expect(screen.getByText('1% mỗi ngày tạo ra kết quả gấp 37 lần sau một năm.')).not.toBeNull()
    expect(screen.getByText('Thung lũng của sự thất vọng')).not.toBeNull()
    expect(screen.getByText('Hệ thống hơn mục tiêu')).not.toBeNull()

    // Kiểm tra số thứ tự 1, 2, 3
    expect(screen.getByText('1')).not.toBeNull()
    expect(screen.getByText('2')).not.toBeNull()
    expect(screen.getByText('3')).not.toBeNull()

    // Kiểm tra câu kết closing
    const closingEl = screen.getByTestId('one-percent-closing')
    expect(closingEl).not.toBeNull()
    expect(closingEl.textContent).toContain('Lời giải không nằm ở cố gắng nhiều hơn')
  })

  it('3. Khi có câu trích dẫn hợp lệ (có tác giả và nguồn link): hiển thị đúng blockquote', () => {
    const sampleQuote: CleanStepQuote = {
      text: 'Thành công là sản phẩm của những thói quen hàng ngày, không phải những biến đổi một lần trong đời.',
      author: 'James Clear',
      source: 'Atomic Habits',
      sourceUrl: 'https://jamesclear.com/atomic-habits',
    }

    render(<StepOnePercent onePercent={null} unknowns={[]} quote={sampleQuote} />)

    const quoteBlock = screen.getByTestId('one-percent-quote')
    expect(quoteBlock).not.toBeNull()
    expect(quoteBlock.textContent).toContain(sampleQuote.text)
    expect(quoteBlock.textContent).toContain(sampleQuote.author)

    const link = screen.getByRole('link', { name: sampleQuote.source })
    expect(link.getAttribute('href')).toBe(sampleQuote.sourceUrl)
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('4. Khi câu trích dẫn không có link nguồn: hiển thị nguồn dạng text thường', () => {
    const sampleQuote: CleanStepQuote = {
      text: 'Thói quen nhỏ tạo nên sự khác biệt lớn.',
      author: 'BJ Fogg',
      source: 'Tiny Habits',
      sourceUrl: null,
    }

    render(<StepOnePercent onePercent={null} unknowns={[]} quote={sampleQuote} />)

    const quoteBlock = screen.getByTestId('one-percent-quote')
    expect(quoteBlock.textContent).toContain('BJ Fogg')
    expect(quoteBlock.textContent).toContain('Tiny Habits')
    expect(screen.queryByRole('link', { name: 'Tiny Habits' })).toBeNull()
  })

  it('5. (HB-26) Không render facts trong StepOnePercent ngay cả khi onePercent.facts có dữ liệu', () => {
    const onePercentWithFacts: CleanHabitOnePercent = {
      title: 'Nguyên lý 1% tốt hơn mỗi ngày',
      dailyPercent: 1,
      maxDays: 365,
      facts: [
        {
          statement: 'Số liệu cũ không nên hiện ở flow bản mới',
          sourceLabel: 'Nguồn cũ',
          sourceUrl: null,
        },
      ],
      closing: 'Lời giải không nằm ở cố gắng nhiều hơn.',
    }

    render(<StepOnePercent onePercent={onePercentWithFacts} unknowns={[]} quote={null} />)

    expect(screen.queryByTestId('one-percent-facts')).toBeNull()
    expect(screen.queryByText('Số liệu cũ không nên hiện ở flow bản mới')).toBeNull()
  })
})
