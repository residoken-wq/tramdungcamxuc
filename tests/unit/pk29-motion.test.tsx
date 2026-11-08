import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ENTRANCE_PRESETS, cleanEntrance } from '@/puck/style/style-schema'
import { parseStatValue, formatStatNumber } from '@/lib/stat-counter'
import { StatItem } from '@/components/site/StatItem'
import { JourneySteps } from '@/components/site/JourneySteps'
import { FaqAccordionList } from '@/components/site/FaqAccordionList'
import { HeroTwoEntries } from '@/components/site/HeroTwoEntries'
import { HeroImage } from '@/components/site/HeroImage'

describe('PK-29: Motion & Animation Unit Tests', () => {
  describe('1.1 & 1.3 Entrance presets and stagger', () => {
    it('includes stagger in ENTRANCE_PRESETS', () => {
      expect(ENTRANCE_PRESETS).toContain('stagger')
    })

    it('passes cleanEntrance filter for stagger', () => {
      expect(cleanEntrance('stagger')).toBe('stagger')
      expect(cleanEntrance('none')).toBeUndefined()
      expect(cleanEntrance('invalid-preset')).toBeUndefined()
    })
  })

  describe('1.5 Stat number parsing & counting', () => {
    it('correctly parses numbers with suffixes: 10+, 1.000+, 39%, 3X', () => {
      const p10 = parseStatValue('10+')
      expect(p10).toEqual({
        prefix: '',
        number: 10,
        suffix: '+',
        separator: '',
      })

      const p1000 = parseStatValue('1.000+')
      expect(p1000).toEqual({
        prefix: '',
        number: 1000,
        suffix: '+',
        separator: '.',
      })
      expect(formatStatNumber(p1000!.number, p1000!.separator)).toBe('1.000')

      const p39 = parseStatValue('39%')
      expect(p39).toEqual({
        prefix: '',
        number: 39,
        suffix: '%',
        separator: '',
      })

      const p3X = parseStatValue('3X')
      expect(p3X).toEqual({
        prefix: '',
        number: 3,
        suffix: 'X',
        separator: '',
      })
    })

    it('returns null for non-numeric values (no counting)', () => {
      expect(parseStatValue('Hàng ngàn giờ')).toBeNull()
      expect(parseStatValue('ICF ACC')).toBeNull()
      expect(parseStatValue('')).toBeNull()
      expect(parseStatValue(undefined)).toBeNull()
    })

    it('SSR prints the final number directly in HTML', () => {
      const markup = renderToStaticMarkup(<StatItem value="500+" label="Khách hàng" />)
      expect(markup).toContain('500+')
      expect(markup).toContain('Khách hàng')
    })

    it('renders text values as static text without animation wrapper', () => {
      const { container } = render(<StatItem value="ICF ACC" label="Chứng chỉ" />)
      expect(container.textContent).toContain('ICF ACC')
      expect(container.querySelector('.sr-only')).toBeNull()
    })
  })

  describe('1.4 JourneySteps: 5 steps intact without JS', () => {
    it('SSR renders all 5 steps in correct sequential order', () => {
      const markup = renderToStaticMarkup(<JourneySteps />)
      const pauseIndex = markup.indexOf('Pause')
      const feelIndex = markup.indexOf('Feel')
      const nameIndex = markup.indexOf('Name')
      const chooseIndex = markup.indexOf('Choose')
      const practiceIndex = markup.indexOf('Practice')

      expect(pauseIndex).toBeGreaterThan(-1)
      expect(feelIndex).toBeGreaterThan(pauseIndex)
      expect(nameIndex).toBeGreaterThan(feelIndex)
      expect(chooseIndex).toBeGreaterThan(nameIndex)
      expect(practiceIndex).toBeGreaterThan(chooseIndex)
    })
  })

  describe('1.8 FAQ Accordion: aria-expanded and aria-controls preserved', () => {
    const mockFaqs = [
      { question: 'Câu hỏi 1?', answer: 'Trả lời 1' },
      { question: 'Câu hỏi 2?', answer: 'Trả lời 2' },
    ]

    it('maintains aria-expanded and aria-controls on buttons and panels', () => {
      render(<FaqAccordionList items={mockFaqs} />)

      const btn1 = screen.getByRole('button', { name: /Câu hỏi 1\?/i })
      expect(btn1.getAttribute('aria-expanded')).toBe('false')
      const controlsId = btn1.getAttribute('aria-controls')
      expect(controlsId).toBe('faq-a-0')

      const panel = document.getElementById(controlsId!)
      expect(panel).not.toBeNull()
      expect(panel?.hasAttribute('inert')).toBe(true)

      // Toggle open
      fireEvent.click(btn1)
      expect(btn1.getAttribute('aria-expanded')).toBe('true')
      expect(panel?.hasAttribute('inert')).toBe(false)
    })
  })

  describe('1.9 Builder isEditing isolation', () => {
    it('does not attach data-eb-hero when isEditing is true', () => {
      const { container: c1 } = render(
        <HeroTwoEntries
          titleLine1="Tiêu đề 1"
          titleLine2="Tiêu đề 2"
          priority={true}
          puck={{ isEditing: true }}
        />,
      )
      expect(c1.querySelector('[data-eb-hero]')).toBeNull()

      const { container: c2 } = render(
        <HeroImage
          titleLine1="Tiêu đề 1"
          titleLine2="Tiêu đề 2"
          priority={true}
          puck={{ isEditing: true }}
        />,
      )
      expect(c2.querySelector('[data-eb-hero]')).toBeNull()
    })

    it('attaches data-eb-hero="first" on public render when priority=true', () => {
      const { container: c1 } = render(
        <HeroTwoEntries
          titleLine1="Tiêu đề 1"
          titleLine2="Tiêu đề 2"
          priority={true}
          puck={{ isEditing: false }}
        />,
      )
      expect(c1.querySelector('[data-eb-hero="first"]')).not.toBeNull()

      const { container: c2 } = render(
        <HeroImage
          titleLine1="Tiêu đề 1"
          titleLine2="Tiêu đề 2"
          priority={true}
          puck={{ isEditing: false }}
        />,
      )
      expect(c2.querySelector('[data-eb-hero="first"]')).not.toBeNull()
    })
  })
})
