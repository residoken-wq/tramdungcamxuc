import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ComponentConfig } from '@puckeditor/core'
import { withBlockStyle } from '../../src/puck/style/with-block-style'

const block: ComponentConfig<{ text: string }> = {
  fields: { text: { type: 'text' } },
  render: ({ text }) => <p className="x">{text}</p>,
}
const wrapped = withBlockStyle(block as ComponentConfig)
const renderBlock = (props: Record<string, unknown>) =>
  render(<>{wrapped.render({ id: 'B-1', puck: {}, ...props } as never)}</>).container

describe('EB-04: withBlockStyle', () => {
  it('leaves blocks without _style untouched (same DOM)', () => {
    const plain = render(
      <>{block.render({ id: 'B-1', text: 'Chào', puck: {} } as never)}</>,
    ).container
    expect(renderBlock({ text: 'Chào' }).innerHTML).toBe(plain.innerHTML)
    expect(renderBlock({ text: 'Chào', _style: {} }).innerHTML).toBe(plain.innerHTML)
  })

  it('wraps a styled block with data-eb-id and a clean anchor id', () => {
    const html = renderBlock({
      text: 'Chào',
      _style: { background: 'soft-pink', anchorId: 'dang-ky' },
    }).innerHTML
    expect(html).toBe('<div data-eb-id="B-1" id="dang-ky"><p class="x">Chào</p></div>')
    const bad = renderBlock({ text: 'Chào', _style: { anchorId: 'x"><script>' } }).innerHTML
    expect(bad).toBe('<div data-eb-id="B-1"><p class="x">Chào</p></div>')
  })
})
