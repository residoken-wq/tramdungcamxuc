import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OnePercentSection } from '@/components/habit/OnePercentSection'
import { OnePercentSlider } from '@/components/habit/OnePercentSlider'
import type { CleanHabitOnePercent } from '@/lib/habit/journey-content.server'
import { vi } from '@/lib/i18n/vi'

describe('HB-08: OnePercentSection & OnePercentSlider component tests', () => {
  describe('OnePercentSection visibility and rendering', () => {
    it('returns null and renders nothing when onePercent is null or undefined', () => {
      const { container: c1 } = render(<OnePercentSection onePercent={null} />)
      expect(c1.firstChild).toBeNull()

      const { container: c2 } = render(<OnePercentSection onePercent={undefined} />)
      expect(c2.firstChild).toBeNull()
    })

    it('returns null when both title and intro are empty/whitespace', () => {
      const emptyContent: CleanHabitOnePercent = {
        title: '   ',
        intro: null,
        dailyPercent: 1,
        maxDays: 365,
        facts: [],
      }

      const { container } = render(<OnePercentSection onePercent={emptyContent} />)
      expect(container.firstChild).toBeNull()
    })

    it('returns null when intro is an empty Lexical tree and title is empty', () => {
      const emptyIntroContent: CleanHabitOnePercent = {
        title: '',
        intro: {
          root: {
            type: 'root',
            children: [],
          },
        },
        dailyPercent: 1,
        maxDays: 365,
        facts: [],
      }

      const { container } = render(<OnePercentSection onePercent={emptyIntroContent} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders single-line title when title has no pipe delimiter', () => {
      const data: CleanHabitOnePercent = {
        title: 'Nguyên lý 1% tốt hơn mỗi ngày',
        intro: null,
        dailyPercent: 1,
        maxDays: 365,
        facts: [],
      }

      render(<OnePercentSection onePercent={data} />)
      expect(screen.getByText('Nguyên lý 1% tốt hơn mỗi ngày')).toBeTruthy()
      expect(screen.getByTestId('one-percent-section')).toBeTruthy()
    })

    it('renders two-tone heading when title contains "|" separator', () => {
      const data: CleanHabitOnePercent = {
        title: 'Nguyên lý 1% | Tích tiểu thành đại',
        intro: null,
        dailyPercent: 1,
        maxDays: 365,
        facts: [],
      }

      render(<OnePercentSection onePercent={data} />)
      expect(screen.getByText('Nguyên lý 1%')).toBeTruthy()
      expect(screen.getByText('Tích tiểu thành đại')).toBeTruthy()
    })

    it('renders facts with source labels and links when facts are provided', () => {
      const data: CleanHabitOnePercent = {
        title: 'Nguyên lý 1%',
        intro: null,
        dailyPercent: 1,
        maxDays: 365,
        facts: [
          {
            statement: '[MẪU] Số liệu kiểm thử HB-08.',
            sourceLabel: '[MẪU] Nguồn kiểm thử',
            sourceUrl: 'https://example.com/nguon-mau',
          },
          {
            statement: '[MẪU] Số liệu kiểm thử thứ hai.',
            sourceLabel: '[MẪU] Nguồn kiểm thử 2',
            sourceUrl: null,
          },
        ],
      }

      render(<OnePercentSection onePercent={data} />)

      const factsContainer = screen.getByTestId('one-percent-facts')
      expect(factsContainer).toBeTruthy()

      // Statement texts
      expect(screen.getByText('[MẪU] Số liệu kiểm thử HB-08.')).toBeTruthy()
      expect(screen.getByText('[MẪU] Số liệu kiểm thử thứ hai.')).toBeTruthy()

      // Link with target="_blank" and rel="noopener noreferrer"
      const sourceLink = screen.getByRole('link', { name: '[MẪU] Nguồn kiểm thử' })
      expect(sourceLink.getAttribute('href')).toBe('https://example.com/nguon-mau')
      expect(sourceLink.getAttribute('target')).toBe('_blank')
      expect(sourceLink.getAttribute('rel')).toBe('noopener noreferrer')

      // Plain text source label without link
      expect(screen.getByText('[MẪU] Nguồn kiểm thử 2')).toBeTruthy()
    })

    it('does not render facts block when facts list is empty', () => {
      const data: CleanHabitOnePercent = {
        title: 'Nguyên lý 1%',
        intro: null,
        dailyPercent: 1,
        maxDays: 365,
        facts: [],
      }

      render(<OnePercentSection onePercent={data} />)
      expect(screen.queryByTestId('one-percent-facts')).toBeNull()
    })
  })

  describe('OnePercentSlider interactive behavior & accessibility', () => {
    it('renders slider with accessible label and aria-valuetext', () => {
      render(<OnePercentSlider dailyPercent={1} maxDays={365} initialDays={365} />)

      const slider = screen.getByRole('slider', { name: vi.hb08.sliderAriaLabel })
      expect(slider).toBeTruthy()
      expect(slider.getAttribute('aria-valuemin')).toBe('0')
      expect(slider.getAttribute('aria-valuemax')).toBe('365')
      expect(slider.getAttribute('aria-valuenow')).toBe('365')
      expect(slider.getAttribute('aria-valuetext')).toBe('365 ngày')
    })

    it('updates results dynamically when slider value changes', () => {
      render(<OnePercentSlider dailyPercent={1} maxDays={365} initialDays={365} />)

      const slider = screen.getByRole('slider', { name: vi.hb08.sliderAriaLabel })

      // Initial state (365 days): better ≈ 37,78; worse ≈ 0,03
      expect(screen.getByText('×37,78')).toBeTruthy()
      expect(screen.getByText('×0,03')).toBeTruthy()

      // Change to 100 days: 1.01^100 ≈ 2.7048 -> ×2,7; 0.99^100 ≈ 0.366 -> ×0,37
      fireEvent.change(slider, { target: { value: '100' } })

      expect(slider.getAttribute('aria-valuenow')).toBe('100')
      expect(slider.getAttribute('aria-valuetext')).toBe('100 ngày')

      expect(screen.getByText('×2,7')).toBeTruthy()
      expect(screen.getByText('×0,37')).toBeTruthy()

      // Change to 0 days: better = 1, worse = 1
      fireEvent.change(slider, { target: { value: '0' } })

      expect(screen.getAllByText('×1')).toHaveLength(2)
    })
  })
})
