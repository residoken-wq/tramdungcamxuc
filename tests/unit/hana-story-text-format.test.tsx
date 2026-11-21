import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { HanaStory } from '../../src/components/site/HanaStory'
import { HanaStoryBlock } from '../../src/puck/blocks/HanaStory'

const base = {
  id: 'hs',
  seriesLabel: '[MẪU] Người đồng hành',
  titleLine2: '[MẪU] Coach',
  storyContent: '[MẪU] Đoạn kể thứ nhất.',
  quoteLine: '[MẪU] Câu trích dẫn.',
  tone: 'dark' as const,
}

/** Element (tag + classes) that directly wraps a text. */
const wrapperOf = (html: string, text: string) => {
  const i = html.indexOf(text)
  const open = html.lastIndexOf('<p', i)
  return html.slice(open, html.indexOf('>', open) + 1)
}

describe('HanaStory: swap the look of the story and the quote line', () => {
  it('default: story plain, quote italic in a frame', () => {
    const html = renderToStaticMarkup(<HanaStory {...base} />)
    expect(wrapperOf(html, '[MẪU] Đoạn kể')).not.toContain('font-quote')
    expect(wrapperOf(html, '[MẪU] Câu trích')).toContain('font-quote italic')
    expect(html).toContain('“[MẪU] Câu trích dẫn.”')
  })

  for (const layout of ['story', 'letter', 'spotlight'] as const) {
    for (const quoteStyle of ['line', 'box'] as const) {
      it(`swapped (${layout}, ${quoteStyle}): story italic in a frame, quote plain, order kept`, () => {
        const html = renderToStaticMarkup(
          <HanaStory {...base} layout={layout} quoteStyle={quoteStyle} textFormat="swapped" />,
        )
        expect(wrapperOf(html, '[MẪU] Đoạn kể')).toContain('font-quote italic')
        expect(html).toContain('“[MẪU] Đoạn kể thứ nhất.”')
        expect(wrapperOf(html, '[MẪU] Câu trích')).not.toContain('font-quote')
        expect(html).not.toContain('“[MẪU] Câu trích')
        // Same order as the default look
        const def = renderToStaticMarkup(
          <HanaStory {...base} layout={layout} quoteStyle={quoteStyle} />,
        )
        const order = (h: string) => h.indexOf('[MẪU] Đoạn kể') < h.indexOf('[MẪU] Câu trích')
        expect(order(html)).toBe(order(def))
      })
    }
  }

  it('builder field with default "default" (existing pages keep their look)', () => {
    expect(HanaStoryBlock.defaultProps?.textFormat).toBe('default')
    expect(HanaStoryBlock.fields).toHaveProperty('textFormat')
  })
})
