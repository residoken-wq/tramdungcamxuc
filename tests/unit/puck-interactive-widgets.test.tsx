import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { TabsWidget } from '@/components/site/widgets/TabsWidget'
import { AccordionWidget } from '@/components/site/widgets/AccordionWidget'
import { CounterWidget, formatCounterNumber } from '@/components/site/widgets/CounterWidget'
import { TabsWidgetBlock } from '@/puck/blocks/widgets/TabsWidget'
import { AccordionWidgetBlock } from '@/puck/blocks/widgets/AccordionWidget'
import { CounterWidgetBlock } from '@/puck/blocks/widgets/CounterWidget'
import { puckConfig } from '@/puck/config'
import { getBlockIcon } from '@/puck/editor/block-icons'
import { filterBlockCategories } from '@/puck/editor/block-search'
import { fieldTab } from '@/puck/style/field-groups'

describe('EB-06b: TabsWidget', () => {
  it('renders defaultProps matching snapshot', () => {
    const { container } = render(<TabsWidget {...TabsWidgetBlock.defaultProps} />)
    expect(container.innerHTML).toMatchSnapshot()
    expect(screen.getByRole('tablist')).not.toBeNull()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('renders ARIA attributes properly and starts with first tab active', () => {
    render(
      <TabsWidget
        id="test-tabs"
        items={[
          { title: 'Thẻ 1', content: <div>Nội dung thẻ 1</div> },
          { title: 'Thẻ 2', content: <div>Nội dung thẻ 2</div> },
        ]}
      />,
    )

    const tablist = screen.getByRole('tablist')
    expect(tablist.getAttribute('aria-orientation')).toBe('horizontal')

    const tabs = screen.getAllByRole('tab')
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(tabs[0].getAttribute('tabindex')).toBe('0')
    expect(tabs[1].getAttribute('aria-selected')).toBe('false')
    expect(tabs[1].getAttribute('tabindex')).toBe('-1')

    const panel1 = screen.getByText('Nội dung thẻ 1').parentElement
    const panel2 = screen.getByText('Nội dung thẻ 2').parentElement
    expect(panel1?.className).toContain('block')
    expect(panel2?.className).toContain('hidden')
  })

  it('switches active tab on mouse click', () => {
    render(
      <TabsWidget
        id="test-tabs-click"
        items={[
          { title: 'Tab Alpha', content: <div>Content Alpha</div> },
          { title: 'Tab Beta', content: <div>Content Beta</div> },
        ]}
      />,
    )

    const tabs = screen.getAllByRole('tab')
    fireEvent.click(tabs[1])

    expect(tabs[0].getAttribute('aria-selected')).toBe('false')
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')

    const panel1 = screen.getByText('Content Alpha').parentElement
    const panel2 = screen.getByText('Content Beta').parentElement
    expect(panel1?.className).toContain('hidden')
    expect(panel2?.className).toContain('block')
  })

  it('supports keyboard navigation with Arrow keys, Home, and End in horizontal mode', () => {
    render(
      <TabsWidget
        id="test-tabs-kbd"
        items={[
          { title: 'T1', content: <div>P1</div> },
          { title: 'T2', content: <div>P2</div> },
          { title: 'T3', content: <div>P3</div> },
        ]}
      />,
    )

    const tabs = screen.getAllByRole('tab')
    tabs[0].focus()

    // ArrowRight: 0 -> 1
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')

    // ArrowRight: 1 -> 2
    fireEvent.keyDown(tabs[1], { key: 'ArrowRight' })
    expect(tabs[2].getAttribute('aria-selected')).toBe('true')

    // ArrowRight wraps: 2 -> 0
    fireEvent.keyDown(tabs[2], { key: 'ArrowRight' })
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')

    // ArrowLeft wraps: 0 -> 2
    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' })
    expect(tabs[2].getAttribute('aria-selected')).toBe('true')

    // Home: -> 0
    fireEvent.keyDown(tabs[2], { key: 'Home' })
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')

    // End: -> 2
    fireEvent.keyDown(tabs[0], { key: 'End' })
    expect(tabs[2].getAttribute('aria-selected')).toBe('true')
  })

  it('supports vertical orientation with ArrowDown and ArrowUp', () => {
    render(
      <TabsWidget
        id="test-tabs-vert"
        orientation="vertical"
        items={[
          { title: 'V1', content: <div>P1</div> },
          { title: 'V2', content: <div>P2</div> },
        ]}
      />,
    )

    const tablist = screen.getByRole('tablist')
    expect(tablist.getAttribute('aria-orientation')).toBe('vertical')

    const tabs = screen.getAllByRole('tab')
    fireEvent.keyDown(tabs[0], { key: 'ArrowDown' })
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(tabs[1], { key: 'ArrowUp' })
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
  })

  it('applies typographyClasses to tab title text', () => {
    const { container } = render(
      <TabsWidget
        items={[{ title: 'Styled Tab' }]}
        _style={{ textColor: 'bright-magenta', fontSize: '2xl' }}
      />,
    )
    const titleSpan = container.querySelector('button span')
    expect(titleSpan?.className).not.toContain('text-deep-navy')
    expect(titleSpan?.className).not.toContain('text-sm')
  })
})

describe('EB-06b: AccordionWidget', () => {
  it('renders defaultProps matching snapshot', () => {
    const { container } = render(<AccordionWidget {...AccordionWidgetBlock.defaultProps} />)
    expect(container.innerHTML).toMatchSnapshot()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('starts with first item open in defaultExpanded="first"', () => {
    render(
      <AccordionWidget
        id="acc-test-1"
        items={[
          { title: 'Q1', content: <div>Answer 1</div> },
          { title: 'Q2', content: <div>Answer 2</div> },
        ]}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false')

    const p1 = screen.getByText('Answer 1').parentElement
    const p2 = screen.getByText('Answer 2').parentElement
    expect(p1?.className).toContain('block')
    expect(p2?.className).toContain('hidden')
  })

  it('handles single mode: clicking Q2 closes Q1 and opens Q2, clicking Q2 again closes all', () => {
    render(
      <AccordionWidget
        id="acc-single"
        expandMode="single"
        items={[
          { title: 'Q1', content: <div>A1</div> },
          { title: 'Q2', content: <div>A2</div> },
        ]}
      />,
    )

    const buttons = screen.getAllByRole('button')

    // Click Q2
    fireEvent.click(buttons[1])
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false')
    expect(buttons[1].getAttribute('aria-expanded')).toBe('true')

    // Click Q2 again -> closed
    fireEvent.click(buttons[1])
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false')
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false')
  })

  it('handles multiple mode: multiple items can be opened simultaneously', () => {
    render(
      <AccordionWidget
        id="acc-multi"
        expandMode="multiple"
        defaultExpanded="none"
        items={[
          { title: 'Q1', content: <div>A1</div> },
          { title: 'Q2', content: <div>A2</div> },
        ]}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false')
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(buttons[0])
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(buttons[1])
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
    expect(buttons[1].getAttribute('aria-expanded')).toBe('true')
  })

  it('applies typographyClasses to accordion header text', () => {
    const { container } = render(
      <AccordionWidget
        items={[{ title: 'Custom Header' }]}
        _style={{ textColor: 'accent-pink' }}
      />,
    )
    const span = container.querySelector('button span')
    expect(span?.className).not.toContain('text-deep-navy')
  })
})

describe('EB-06b: CounterWidget', () => {
  beforeEach(() => {
    class MockObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
    vi.stubGlobal('IntersectionObserver', MockObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders defaultProps matching snapshot', () => {
    const { container } = render(<CounterWidget {...CounterWidgetBlock.defaultProps} />)
    expect(container.innerHTML).toMatchSnapshot()
    expect(container.textContent).toContain('100')
    expect(container.textContent).toContain('+')
    expect(container.textContent).toContain('Chỉ số thống kê')
  })

  it('formats numbers with thousandSeparator correctly', () => {
    expect(formatCounterNumber(1234, '.')).toBe('1.234')
    expect(formatCounterNumber(1234567, '.')).toBe('1.234.567')
    expect(formatCounterNumber(1234, ',')).toBe('1,234')
    expect(formatCounterNumber(1234, 'none')).toBe('1234')
  })

  it('renders final endNumber initially for SSR and SEO', () => {
    const { container } = render(
      <CounterWidget
        startNumber={0}
        endNumber={500}
        prefix="+"
        suffix=" học viên"
        thousandSeparator="."
      />,
    )
    expect(container.textContent).toContain('+500 học viên')
  })

  it('respects prefers-reduced-motion and stays at endNumber', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { container } = render(<CounterWidget startNumber={0} endNumber={750} />)
    expect(container.textContent).toContain('750')
  })

  it('applies typographyClasses to counter number', () => {
    const { container } = render(
      <CounterWidget endNumber={99} _style={{ textColor: 'bright-magenta', fontSize: '3xl' }} />,
    )
    const numberSpan = container.querySelectorAll('span')[0]
    expect(numberSpan?.className).not.toContain('text-deep-navy')
    expect(numberSpan?.className).not.toContain('text-4xl')
  })
})

describe('EB-06b: Metadata, Icons & Searchability', () => {
  const INTERACTIVE_BLOCKS = [
    { key: 'TabsWidget', block: TabsWidgetBlock, nameQuery: 'tabs' },
    { key: 'AccordionWidget', block: AccordionWidgetBlock, nameQuery: 'accordion' },
    { key: 'CounterWidget', block: CounterWidgetBlock, nameQuery: 'bo dem' },
  ] as const

  it('all 3 interactive widgets have version 1 in defaultProps', () => {
    for (const { key, block } of INTERACTIVE_BLOCKS) {
      expect(block.defaultProps?.version, `${key} must have version: 1`).toBe(1)
    }
  })

  it('all 3 interactive widgets have a dedicated SVG icon in blockIconMap', () => {
    for (const { key } of INTERACTIVE_BLOCKS) {
      const icon = getBlockIcon(key)
      expect(React.isValidElement(icon), `${key} must return a valid React icon`).toBe(true)
    }
  })

  it('all 3 interactive widgets are searchable by non-diacritic names in puckConfig', () => {
    const categories = puckConfig.categories || {}
    const labels = Object.fromEntries(
      Object.entries(puckConfig.components).map(([k, c]) => [k, c.label || k]),
    )

    for (const { key, nameQuery } of INTERACTIVE_BLOCKS) {
      const filtered = filterBlockCategories(categories, labels, nameQuery)
      const found = filtered.some((cat) => cat.components.includes(key))
      expect(found, `${key} should match query "${nameQuery}"`).toBe(true)
    }
  })

  it('sorts widget fields to appropriate tabs according to fieldTab', () => {
    expect(fieldTab('orientation')).toBe('content')
    expect(fieldTab('items')).toBe('content')
    expect(fieldTab('expandMode')).toBe('content')
    expect(fieldTab('defaultExpanded')).toBe('content')
    expect(fieldTab('startNumber')).toBe('content')
    expect(fieldTab('endNumber')).toBe('content')
    expect(fieldTab('prefix')).toBe('content')
    expect(fieldTab('suffix')).toBe('content')
    expect(fieldTab('thousandSeparator')).toBe('content')
    expect(fieldTab('duration')).toBe('content')
    expect(fieldTab('label')).toBe('content')
    expect(fieldTab('align')).toBe('style')
  })
})
