import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { JourneyStep } from '@/components/site/JourneyStep'
import { HanaStory } from '@/components/site/HanaStory'
import { stripWrappingQuotes } from '@/lib/text/quotes'
import { blockStyleCss } from '@/puck/style/style-css'
import { sanitizeBlockStyle } from '@/puck/style/style-schema'
import { DEFAULT_DESIGN_SYSTEM } from '@/lib/design/design-system'

describe('PK-17: JourneyStep variant="circles"', () => {
  it('renders circles variant without card background/border/shadow and with circle number', () => {
    const { container } = render(
      <JourneyStep
        variant="circles"
        index={0}
        name="Pause"
        subname="Dừng lại"
        description="Mô tả dừng lại"
      />,
    )

    const card = container.querySelector('[data-eb-card]')
    expect(card).not.toBeNull()
    // Does not have card border/shadow/bg classes in circles mode
    expect(card?.classList.contains('border-deep-navy/10')).toBe(false)
    expect(card?.classList.contains('shadow-soft')).toBe(false)

    // Has circle number node
    const circleBox = container.querySelector('[data-eb-card-row]')
    expect(circleBox).not.toBeNull()
    expect(circleBox?.textContent?.trim()).toBe('01')
    expect(circleBox?.classList.contains('rounded-full')).toBe(true)
    expect(circleBox?.classList.contains('border-[3px]')).toBe(true)
  })

  it('renders highlight step with bg-accent-pink and white text', () => {
    const { container } = render(
      <JourneyStep
        variant="circles"
        index={4}
        name="Practice"
        subname="Thực hành"
        highlight={true}
      />,
    )

    const circleBox = container.querySelector('[data-eb-card-row]')
    expect(circleBox).not.toBeNull()
    expect(circleBox?.classList.contains('bg-accent-pink')).toBe(true)
    expect(circleBox?.classList.contains('text-white')).toBe(true)
  })

  it('renders white circle on deep-navy background when not highlighted', () => {
    const { container } = render(
      <JourneyStep variant="circles" index={1} name="Feel" subname="Cảm nhận" isDeepNavy={true} />,
    )

    const circleBox = container.querySelector('[data-eb-card-row]')
    expect(circleBox).not.toBeNull()
    expect(circleBox?.classList.contains('border-white')).toBe(true)
    expect(circleBox?.classList.contains('text-white')).toBe(true)
  })

  it('keeps variant="cards" untouched with card background, border, and shadow', () => {
    const { container } = render(
      <JourneyStep variant="cards" index={0} name="Pause" subname="Dừng lại" />,
    )

    const card = container.querySelector('[data-eb-card]')
    expect(card).not.toBeNull()
    expect(card?.classList.contains('rounded-card')).toBe(true)
    expect(card?.classList.contains('border')).toBe(true)
  })
})

describe('PK-17: HanaStory layout="spotlight"', () => {
  it('renders spotlight layout with proper DOM order and vertical left border for quote', () => {
    const { container } = render(
      <HanaStory
        id="test-hana"
        layout="spotlight"
        seriesLabel="Về Hana"
        titleLine1="Hana Lương"
        titleLine2="Executive Coach"
        jobTitle="Founder & Certified Coach"
        quoteLine="Những điều xuất phát từ trái tim sẽ chạm đến trái tim."
        storyContent="Nội dung câu chuyện sứ mệnh của Hana..."
        chips={[{ text: 'ICF ACC' }, { text: '10+ năm' }]}
        buttonText="Khám phá hành trình"
        buttonLink="/ve-hana"
        imageUrl="/brand/hana.jpg"
        imageAlt="Hana Lương"
      />,
    )

    // Check DOM order: seriesLabel -> title -> jobTitle -> quoteLine -> storyContent -> chips -> button
    const textCol = container.querySelector('.lg\\:col-span-7')
    expect(textCol).not.toBeNull()

    const series = textCol?.querySelector('[data-eb-text="test-hana:seriesLabel"]')
    const title1 = textCol?.querySelector('[data-eb-text="test-hana:titleLine1"]')
    const job = textCol?.querySelector('[data-eb-text="test-hana:jobTitle"]')
    const quote = textCol?.querySelector('[data-eb-text="test-hana:quoteLine"]')
    const story = textCol?.querySelector('[data-eb-text="test-hana:storyContent"]')
    const button = textCol?.querySelector('a')

    expect(series).not.toBeNull()
    expect(title1).not.toBeNull()
    expect(job).not.toBeNull()
    expect(quote).not.toBeNull()
    expect(story).not.toBeNull()
    expect(button).not.toBeNull()

    // Quote has left vertical line (border-l-[3px] border-accent-pink), not a boxed card
    const quoteWrapper = quote?.parentElement
    expect(quoteWrapper?.className).toContain('border-l-[3px]')
    expect(quoteWrapper?.className).toContain('border-accent-pink')
    expect(quoteWrapper?.className).not.toContain('rounded-card')
  })

  it('switches image position to left or right', () => {
    const { container: rightContainer } = render(
      <HanaStory layout="spotlight" imagePosition="right" imageUrl="/brand/hana.jpg" />,
    )
    const rightImgCol = rightContainer.querySelector('.lg\\:col-span-5')
    expect(rightImgCol?.className).toContain('lg:rounded-l-[120px]')

    const { container: leftContainer } = render(
      <HanaStory layout="spotlight" imagePosition="left" imageUrl="/brand/hana.jpg" />,
    )
    const leftImgCol = leftContainer.querySelector('.lg\\:col-span-5')
    expect(leftImgCol?.className).toContain('lg:rounded-r-[120px]')
  })
})

describe('PK-17: stripWrappingQuotes', () => {
  it('strips straight double quotes', () => {
    expect(stripWrappingQuotes('"Những điều xuất phát từ trái tim"')).toBe(
      'Những điều xuất phát từ trái tim',
    )
  })

  it('strips smart double quotes', () => {
    expect(stripWrappingQuotes('“Những điều xuất phát từ trái tim”')).toBe(
      'Những điều xuất phát từ trái tim',
    )
  })

  it('leaves internal quotes intact', () => {
    expect(stripWrappingQuotes('Hana nói: "Hãy dừng lại" và mỉm cười')).toBe(
      'Hana nói: "Hãy dừng lại" và mỉm cười',
    )
  })

  it('handles empty or whitespace strings', () => {
    expect(stripWrappingQuotes('')).toBe('')
    expect(stripWrappingQuotes(undefined)).toBe('')
    expect(stripWrappingQuotes(null)).toBe('')
  })
})

describe('PK-17: cardFrame style rules', () => {
  it('generates no rule for default cardFrame', () => {
    const css = blockStyleCss('test-block', { cardFrame: 'default' })
    expect(css).toBe('')
  })

  it('generates transparent border for borderless', () => {
    const css = blockStyleCss('test-block', { cardFrame: 'borderless' })
    expect(css).toContain('[data-eb-id="test-block"] [data-eb-card]{border-color:transparent}')
  })

  it('generates transparent border and no shadow for flat', () => {
    const css = blockStyleCss('test-block', { cardFrame: 'flat' })
    expect(css).toContain(
      '[data-eb-id="test-block"] [data-eb-card]{border-color:transparent;box-shadow:none}',
    )
  })

  it('generates transparent border, no shadow and transparent background for none', () => {
    const css = blockStyleCss('test-block', { cardFrame: 'none' })
    expect(css).toContain(
      '[data-eb-id="test-block"] [data-eb-card]{border-color:transparent;box-shadow:none}[data-eb-id="test-block"] [data-eb-card]:not([data-eb-card-solid]){background:transparent}',
    )
  })

  it('sanitizes invalid cardFrame values to undefined', () => {
    const sanitized = sanitizeBlockStyle({ cardFrame: 'invalid_value' }, DEFAULT_DESIGN_SYSTEM)
    expect(sanitized?.cardFrame).toBeUndefined()
  })
})

describe('QA PK-17c', () => {
  it('circles: a highlighted step keeps dark texts on a light section (not white on white)', () => {
    const { getByText } = render(
      <JourneyStep
        variant="circles"
        index={4}
        name="Practice"
        subname="[MẪU] Thực hành bền bỉ"
        description="[MẪU] Mô tả"
        highlight={true}
      />,
    )
    expect(getByText('[MẪU] Thực hành bền bỉ').className).toContain('text-deep-navy')
    expect(getByText('[MẪU] Thực hành bền bỉ').className).not.toMatch(/(^|\s)text-white(\s|$)/)
    expect(getByText('[MẪU] Mô tả').className).toContain('text-deep-navy/80')
  })

  it('cards: a highlighted step is marked solid so "Không khung" keeps its navy background', () => {
    const { container } = render(
      <JourneyStep variant="cards" index={1} name="Feel" highlight={true} />,
    )
    expect(container.querySelector('[data-eb-card]')?.hasAttribute('data-eb-card-solid')).toBe(true)
  })

  it('no dynamic Tailwind class fragments left in the slot-mode card', () => {
    const { container } = render(<JourneyStep index={0} name="Pause" />)
    expect(container.innerHTML).not.toContain('journey:bg-white border')
  })

  it('spotlight: heading keeps a space between the two lines', () => {
    const { getByRole } = render(
      <HanaStory layout="spotlight" titleLine1="[MẪU] COACH" titleLine2="[MẪU] HANA" />,
    )
    expect(getByRole('heading', { level: 2 }).textContent).toBe('[MẪU] COACH [MẪU] HANA')
  })
})
