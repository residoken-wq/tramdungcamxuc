/**
 * EB-10c (Planning QA): the legal footer cannot be switched off or hidden, and the public page
 * never shows invented legal links.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { LegalFooterView, LegalFooterBlock } from '@/puck/blocks/site/LegalFooter'
import { isLegalFooterHidden, validatePageKindBlocks } from '@/puck/locks'
import { vi } from '@/lib/i18n/vi'

const links = [
  { title: 'Điều khoản sử dụng', slug: 'dieu-khoan-su-dung', order: 2 },
  { title: 'Thông tin pháp lý', slug: 'thong-tin-phap-ly', order: 1 },
]
const seller = { name: 'Người bán Test 01', email: 'test@example.com' }

const footer = (legalStyle?: object, containerStyle?: object) => ({
  root: { props: {} },
  content: [
    {
      type: 'Container',
      props: {
        id: 'c1',
        ...(containerStyle ? { _style: containerStyle } : {}),
        items: [
          {
            type: 'LegalFooter',
            props: { id: 'l1', ...(legalStyle ? { _style: legalStyle } : {}) },
          },
        ],
      },
    },
  ],
})

describe('EB-10c LegalFooter', () => {
  it('has no field to switch the legal links or seller info off', () => {
    expect(Object.keys(LegalFooterBlock.fields ?? {})).toEqual([])
  })

  it('ignores old showLegalLinks / showSellerInfo = false and always renders both', () => {
    const html = renderToStaticMarkup(
      <LegalFooterView
        showLegalLinks={false}
        showSellerInfo={false}
        legalLinks={links}
        sellerInfo={seller}
      />,
    )
    expect(html).toContain('Thông tin pháp lý')
    expect(html).toContain('Người bán Test 01')
    expect(html.indexOf('Thông tin pháp lý')).toBeLessThan(html.indexOf('Điều khoản sử dụng'))
  })

  it('never shows invented links on the public page; the editor shows a note', () => {
    const pub = renderToStaticMarkup(<LegalFooterView legalLinks={[]} />)
    expect(pub).not.toContain('href')
    const editor = renderToStaticMarkup(<LegalFooterView legalLinks={[]} isEditing />)
    expect(editor).toContain(vi.eb10.legalFooterEditorEmpty)
    expect(editor).not.toContain('href')
  })

  it('refuses a footer whose LegalFooter or a parent is hidden on some device', () => {
    expect(validatePageKindBlocks('footer', footer()).valid).toBe(true)
    expect(isLegalFooterHidden(footer())).toBe(false)
    for (const data of [
      footer({ hideOn: ['mobile'] }),
      footer(undefined, { hideOn: ['desktop'] }),
    ]) {
      expect(isLegalFooterHidden(data)).toBe(true)
      expect(validatePageKindBlocks('footer', data)).toEqual({
        valid: false,
        error: vi.eb10.errorLegalFooterHidden,
      })
    }
  })
})
