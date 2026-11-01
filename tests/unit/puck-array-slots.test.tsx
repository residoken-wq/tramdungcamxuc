import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { walkPuckItems } from '@/puck/walk'
import { collectPageStyles } from '@/puck/style/style-css'
import { cleanDesignSystem } from '@/lib/design/design-system'
import { renderItemSlots } from '@/puck/blocks/widgets/slot-items'
import { TabsWidget } from '@/components/site/widgets/TabsWidget'
import { AccordionWidget } from '@/components/site/widgets/AccordionWidget'

const data = {
  content: [
    {
      type: 'TabsWidget',
      props: {
        id: 'tabs',
        items: [
          {
            title: 'A',
            content: [
              {
                type: 'HeadingWidget',
                props: { id: 'in-tab', text: 'x', _style: { textColor: 'bright-magenta' } },
              },
            ],
          },
        ],
      },
    },
  ],
}

describe('EB-06bc: blocks inside array-item slots (Tabs / Accordion)', () => {
  it('walkPuckItems visits them (media / page links get resolved)', async () => {
    const seen: string[] = []
    await walkPuckItems(data, (item) => {
      seen.push(String(item.props.id))
    })
    expect(seen).toEqual(['tabs', 'in-tab'])
  })

  it('collectPageStyles emits their _style', () => {
    const { css } = collectPageStyles(data, cleanDesignSystem(null))
    expect(css).toContain('[data-eb-id="in-tab"]{color:rgb(var(--color-bright-magenta-rgb))}')
  })

  it('renderItemSlots turns slot components into elements (serialisable for client widgets)', () => {
    const Slot = ({ className }: { className?: string }) => <div className={className}>Ô</div>
    const items = renderItemSlots([{ title: 'A', content: Slot }, { title: 'B' }], 'cls')
    expect(React.isValidElement(items[0].content)).toBe(true)
    expect(items[1].content).toBeNull()
    const { container } = render(<>{items[0].content}</>)
    expect(container.querySelector('.cls')?.textContent).toBe('Ô')
  })

  it('editor shows every tab panel and every accordion item', () => {
    const items = [
      { title: 'A', content: <p>Một</p> },
      { title: 'B', content: <p>Hai</p> },
    ]
    const hiddenAncestor = (el: HTMLElement) => Boolean(el.closest('.hidden'))
    const tabs = render(<TabsWidget items={items} isEditing />)
    expect(hiddenAncestor(tabs.getByText('Hai'))).toBe(false)
    tabs.unmount()
    const acc = render(<AccordionWidget items={items} isEditing />)
    expect(hiddenAncestor(acc.getByText('Hai'))).toBe(false)
    acc.unmount()
    // Public page: only the first tab / item is shown.
    const pub = render(<TabsWidget items={items} />)
    expect(hiddenAncestor(pub.getByText('Một'))).toBe(false)
    expect(hiddenAncestor(pub.getByText('Hai'))).toBe(true)
  })
})
