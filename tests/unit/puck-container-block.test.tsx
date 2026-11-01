import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContainerBlock } from '@/puck/blocks/Container'
import { vi } from '@/lib/i18n/vi'

describe('EB-05: ContainerBlock render', () => {
  it('renders with tag "section" when tag="section" is specified', () => {
    const { container } = render(
      <ContainerBlock.render
        id="con-section"
        tag="section"
        width="boxed"
        contentWidth="lg"
        items={[]}
      />,
    )
    const section = container.querySelector('section')
    expect(section).not.toBeNull()
  })

  it('renders with tag "div" by default', () => {
    const { container } = render(
      <ContainerBlock.render id="con-div" width="boxed" contentWidth="lg" items={[]} />,
    )
    const section = container.querySelector('section')
    expect(section).toBeNull()
    const contentDiv = container.querySelector('[data-eb-id="con-div"]')
    expect(contentDiv).not.toBeNull()
  })

  it('applies boxed max-width and centering when width="boxed"', () => {
    const { container } = render(
      <ContainerBlock.render
        id="con-boxed"
        width="boxed"
        contentWidth="lg"
        items={[]}
      />,
    )
    const content = container.querySelector('[data-eb-id="con-boxed"]')
    expect(content?.className).toContain('mx-auto')
    expect(content?.className).toContain('max-w-6xl')
  })

  it('applies full-width when width="full"', () => {
    const { container } = render(
      <ContainerBlock.render id="con-full" width="full" items={[]} />,
    )
    const content = container.querySelector('[data-eb-id="con-full"]')
    expect(content?.className).toContain('w-full')
    expect(content?.className).not.toContain('max-w-6xl')
    expect(content?.className).not.toContain('mx-auto')
  })

  it('does NOT render empty hint text outside of editor mode', () => {
    const { container, queryByText } = render(
      <ContainerBlock.render id="con-empty-public" items={[]} puck={{ isEditing: false }} />,
    )
    expect(queryByText(vi.eb05.emptyHint)).toBeNull()
    expect(container.querySelector('[data-eb-empty-hint]')).toBeNull()
  })

  it('renders empty hint text inside editor mode when slot is empty', () => {
    const { getByText } = render(
      <ContainerBlock.render id="con-empty-edit" items={[]} puck={{ isEditing: true }} />,
    )
    expect(getByText(vi.eb05.emptyHint)).not.toBeNull()
  })
})
