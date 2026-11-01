import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContainerView } from '@/puck/blocks/Container'
import { puckConfig } from '@/puck/config'
import { CHILD_BLOCK_TYPES } from '@/puck/constants'

const Items = ({ className }: { className?: string }) => (
  <div data-testid="slot" className={className}>
    <p>Khối 1</p>
    <p>Khối 2</p>
  </div>
)

describe('EB-05: Container block', () => {
  it('puts data-eb-id on the outer element and the flex class on the slot element', () => {
    const { container, getByTestId } = render(<ContainerView id="con-a" items={Items} />)
    const outer = container.firstElementChild as HTMLElement
    expect(outer.getAttribute('data-eb-id')).toBe('con-a')
    expect(outer.tagName).toBe('DIV')
    expect(getByTestId('slot').className).toContain('eb-c-con-a')
    // The dropped blocks are direct children of the flex element.
    expect(getByTestId('slot').children).toHaveLength(2)
  })

  it('renders a section, boxed content width and min height', () => {
    const { container } = render(
      <ContainerView id="con-b" tag="section" contentWidth="sm" minHeight="md" items={Items} />,
    )
    const outer = container.firstElementChild as HTMLElement
    expect(outer.tagName).toBe('SECTION')
    expect(outer.className).toContain('min-h-[350px]')
    const inner = outer.firstElementChild as HTMLElement
    expect(inner.className).toContain('mx-auto')
    expect(inner.className).toContain('max-w-3xl')
  })

  it('full width has no max width', () => {
    const { container } = render(<ContainerView id="con-c" width="full" items={Items} />)
    const inner = (container.firstElementChild as HTMLElement).firstElementChild as HTMLElement
    expect(inner.className).not.toContain('mx-auto')
    expect(inner.className).not.toMatch(/max-w-/)
  })

  it('gets the anchor id from _style without a second wrapper', () => {
    const Render = puckConfig.components.Container.render as unknown as React.ComponentType<
      Record<string, unknown>
    >
    const { container } = render(
      <Render
        id="con-d"
        items={Items}
        _style={{ anchorId: 'gioi-thieu', background: 'mint-haze' }}
        puck={{ isEditing: false }}
      />,
    )
    const outer = container.firstElementChild as HTMLElement
    expect(outer.getAttribute('data-eb-id')).toBe('con-d')
    expect(outer.id).toBe('gioi-thieu')
    expect(container.querySelectorAll('[data-eb-id]')).toHaveLength(1)
  })

  it('accepts every block except child cards, including nested Containers', () => {
    const items = puckConfig.components.Container.fields?.items
    expect(items?.type).toBe('slot')
    const disallow = items && 'disallow' in items ? items.disallow : undefined
    expect(disallow).toEqual([...CHILD_BLOCK_TYPES])
    expect(items && 'allow' in items ? items.allow : undefined).toBeUndefined()
  })
})
