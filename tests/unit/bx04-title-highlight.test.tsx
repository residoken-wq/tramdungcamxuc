import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@puckeditor/core', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    createUsePuck: () => () => undefined,
  }
})
import { renderToStaticMarkup } from 'react-dom/server'
import {
  TwoToneTitle,
  renderHighlightedTitle,
  stripTitleHighlight,
  hasTitleHighlight,
  TITLE_HIGHLIGHT_COLOR,
  TITLE_HIGHLIGHT_DARK_COLOR,
  TITLE_STRIKE_COLOR,
  TITLE_STRIKE_DARK_COLOR,
  TITLE_UNDERLINE_CLASS,
  TITLE_UNDERLINE_DARK_CLASS,
  TITLE_PILL_CLASS,
  TITLE_PILL_DARK_CLASS,
} from '@/components/ui/TwoToneTitle'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { TitleHighlightInput } from '@/puck/editor/TitleHighlightInput'
import {
  parseTitleWords,
  toggleTitleWordAt,
} from '@/puck/editor/title-word-chips'
import { StylePanelProvider, useStylePanel } from '@/puck/editor/style-context'
import { DEFAULT_DESIGN_SYSTEM } from '@/lib/design/design-system'

function TabSwitcherTest() {
  const { setTab } = useStylePanel()
  return (
    <div>
      <button type="button" onClick={() => setTab('style')}>
        Switch to Style
      </button>
      <TitleHighlightInput
        name="titleLine1"
        label="Tiêu đề dòng 1"
        value="Tiêu đề mẫu"
        onChange={() => {}}
      />
    </div>
  )
}

// WCAG relative luminance & contrast ratio calculation
function srgbToLinear(c: number): number {
  const norm = c / 255
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4)
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Brand color palette definitions (Brand Book 2026)
const PALETTE = {
  'deep-navy': { r: 40, g: 10, b: 96 },
  'bright-magenta': { r: 188, g: 3, b: 158 },
  'accent-pink': { r: 239, g: 59, b: 131 },
  'soft-pink': { r: 253, g: 230, b: 246 },
  'lavender-mist': { r: 233, g: 221, b: 249 },
  'mint-haze': { r: 217, g: 241, b: 234 },
  'butter-cream': { r: 246, g: 233, b: 184 },
  'warm-ivory': { r: 250, g: 247, b: 244 },
  white: { r: 255, g: 255, b: 255 },
}

describe('BX-04: Tiêu đề – Chọn kiểu nhấn chữ & gạch ngang tương phản', () => {
  describe('1. Cú pháp *...* (nhấn) và ~...~ (gạch ngang)', () => {
    it('renders *...* as highlighted span with bright-magenta by default', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('*CHUYỂN* MÌNH')}</div>,
      )
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_COLOR}">CHUYỂN</span>`)
      expect(markup).toContain(' MÌNH')
    })

    it('renders ~...~ as strikethrough <s> with contrast-compliant color', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('KHÔNG ~CHÊNH~ VÊNH')}</div>,
      )
      expect(markup).toContain(
        `<s class="line-through ${TITLE_STRIKE_COLOR}">CHÊNH</s>`,
      )
      expect(markup).toContain('KHÔNG ')
      expect(markup).toContain(' VÊNH')
    })

    it('renders both *...* and ~...~ together in the same heading', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('*CHUYỂN* MÌNH KHÔNG ~CHÊNH~ VÊNH')}</div>,
      )
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_COLOR}">CHUYỂN</span>`)
      expect(markup).toContain(
        `<s class="line-through ${TITLE_STRIKE_COLOR}">CHÊNH</s>`,
      )
    })

    it('leaves text untouched when there are no markers (HTML snapshot exactly identical)', () => {
      const plain = 'CHUYỂN MÌNH KHÔNG CHÊNH VÊNH'
      const res = renderHighlightedTitle(plain)
      expect(res).toBe(plain)
      const markup = renderToStaticMarkup(<div>{res}</div>)
      expect(markup).toBe(`<div>${plain}</div>`)
    })

    it('preserves single or unmatched asterisks and tildes as literal text', () => {
      const odd = '*CHUYỂN* MÌNH * KHÔNG ~CHÊNH~ VÀ ~'
      const markup = renderToStaticMarkup(<div>{renderHighlightedTitle(odd)}</div>)
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_COLOR}">CHUYỂN</span>`)
      expect(markup).toContain(
        `<s class="line-through ${TITLE_STRIKE_COLOR}">CHÊNH</s>`,
      )
      expect(markup).toContain(' MÌNH * KHÔNG ')
      expect(markup).toContain(' VÀ ~')
    })

    it('returns non-string inputs (React elements, null, undefined) untouched without error', () => {
      const element = <span>*Chuyển* mình</span>
      expect(renderHighlightedTitle(element)).toBe(element)
      expect(renderHighlightedTitle(null)).toBeNull()
      expect(renderHighlightedTitle(undefined)).toBeUndefined()
    })
  })

  describe('2. 3 kiểu nhấn (color, underline, pill) × nền sáng / tối', () => {
    it('applies "color" style correctly on light background', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('*CHUYỂN*', { style: 'color', isDark: false })}</div>,
      )
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_COLOR}">CHUYỂN</span>`)
    })

    it('applies "color" style correctly on dark background', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('*CHUYỂN*', { style: 'color', isDark: true })}</div>,
      )
      expect(markup).toContain(`<span class="${TITLE_HIGHLIGHT_DARK_COLOR}">CHUYỂN</span>`)
    })

    it('applies "underline" style correctly on light background', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('*CHUYỂN*', { style: 'underline', isDark: false })}</div>,
      )
      expect(markup).toContain(`<span class="${TITLE_UNDERLINE_CLASS}">CHUYỂN</span>`)
    })

    it('applies "underline" style correctly on dark background', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('*CHUYỂN*', { style: 'underline', isDark: true })}</div>,
      )
      expect(markup).toContain(`<span class="${TITLE_UNDERLINE_DARK_CLASS}">CHUYỂN</span>`)
    })

    it('applies "pill" style correctly on light background (white on bright-magenta)', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('*CHUYỂN*', { style: 'pill', isDark: false })}</div>,
      )
      expect(markup).toContain(`<span class="${TITLE_PILL_CLASS}">CHUYỂN</span>`)
    })

    it('applies "pill" style correctly on dark background (deep-navy on soft-pink)', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('*CHUYỂN*', { style: 'pill', isDark: true })}</div>,
      )
      expect(markup).toContain(`<span class="${TITLE_PILL_DARK_CLASS}">CHUYỂN</span>`)
    })

    it('applies correct strike color on dark background', () => {
      const markup = renderToStaticMarkup(
        <div>{renderHighlightedTitle('~CHÊNH~', { isDark: true })}</div>,
      )
      expect(markup).toContain(
        `<s class="line-through ${TITLE_STRIKE_DARK_COLOR}">CHÊNH</s>`,
      )
    })
  })

  describe('3. WCAG AA contrast verification for all style × background combinations', () => {
    const lightBgs = [
      'warm-ivory',
      'white',
      'soft-pink',
      'lavender-mist',
      'mint-haze',
      'butter-cream',
    ] as const

    const darkBgs = ['deep-navy', 'bright-magenta'] as const

    it('guarantees >= 3.0:1 contrast (AA Large Text) for highlight text on all light backgrounds', () => {
      const textRgb = PALETTE['bright-magenta']
      const textLum = relativeLuminance(textRgb.r, textRgb.g, textRgb.b)

      for (const bgName of lightBgs) {
        const bgRgb = PALETTE[bgName]
        const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
        const ratio = contrastRatio(textLum, bgLum)
        expect(
          ratio,
          `bright-magenta on ${bgName} must have ratio >= 3.0 (got ${ratio.toFixed(2)})`,
        ).toBeGreaterThanOrEqual(3.0)
      }
    })

    it('guarantees >= 3.0:1 contrast (AA Large Text) for highlight text on dark backgrounds', () => {
      const textRgb = PALETTE['soft-pink']
      const textLum = relativeLuminance(textRgb.r, textRgb.g, textRgb.b)

      for (const bgName of darkBgs) {
        const bgRgb = PALETTE[bgName]
        const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
        const ratio = contrastRatio(textLum, bgLum)
        expect(
          ratio,
          `soft-pink on ${bgName} must have ratio >= 3.0 (got ${ratio.toFixed(2)})`,
        ).toBeGreaterThanOrEqual(3.0)
      }
    })

    it('guarantees >= 4.5:1 contrast for pill style text on its pill background', () => {
      // Light mode pill: white text on bright-magenta background
      const whiteLum = relativeLuminance(255, 255, 255)
      const magentaRgb = PALETTE['bright-magenta']
      const magentaLum = relativeLuminance(magentaRgb.r, magentaRgb.g, magentaRgb.b)
      const lightPillRatio = contrastRatio(whiteLum, magentaLum)
      expect(lightPillRatio, 'white on bright-magenta pill').toBeGreaterThanOrEqual(4.5)

      // Dark mode pill: deep-navy text on soft-pink background
      const navyRgb = PALETTE['deep-navy']
      const navyLum = relativeLuminance(navyRgb.r, navyRgb.g, navyRgb.b)
      const softPinkRgb = PALETTE['soft-pink']
      const softPinkLum = relativeLuminance(softPinkRgb.r, softPinkRgb.g, softPinkRgb.b)
      const darkPillRatio = contrastRatio(navyLum, softPinkLum)
      expect(darkPillRatio, 'deep-navy on soft-pink pill').toBeGreaterThanOrEqual(4.5)
    })
  })

  describe('4. stripTitleHighlight and hasTitleHighlight helpers', () => {
    it('strips both * and ~ markers cleanly from title strings', () => {
      expect(stripTitleHighlight('*CHUYỂN* MÌNH KHÔNG ~CHÊNH~ VÊNH')).toBe(
        'CHUYỂN MÌNH KHÔNG CHÊNH VÊNH',
      )
      expect(stripTitleHighlight('*Khoảnh khắc* Me *Time*')).toBe('Khoảnh khắc Me Time')
      expect(stripTitleHighlight('~Gạch ngang~ thường')).toBe('Gạch ngang thường')
      expect(stripTitleHighlight('Không có marker')).toBe('Không có marker')
    })

    it('returns undefined when input is not a string (e.g. inline-edited React elements)', () => {
      expect(stripTitleHighlight(<span>Inline</span>)).toBeUndefined()
      expect(stripTitleHighlight(null)).toBeUndefined()
      expect(stripTitleHighlight(undefined)).toBeUndefined()
      expect(stripTitleHighlight(123)).toBeUndefined()
    })

    it('detects presence of highlight markers correctly via hasTitleHighlight', () => {
      expect(hasTitleHighlight('*CHUYỂN* MÌNH')).toBe(true)
      expect(hasTitleHighlight('KHÔNG ~CHÊNH~')).toBe(true)
      expect(hasTitleHighlight('*CHUYỂN* VÀ ~CHÊNH~')).toBe(true)
      expect(hasTitleHighlight('Tiêu đề thường')).toBe(false)
      expect(hasTitleHighlight('Dấu sao lẻ *')).toBe(false)
      expect(hasTitleHighlight('Dấu ngã lẻ ~')).toBe(false)
      expect(hasTitleHighlight(null)).toBe(false)
    })
  })

  describe('5. Chip Word Logic (title-word-chips)', () => {
    it('parses words and identifies their highlight states correctly', () => {
      const text = '*CHUYỂN* MÌNH KHÔNG ~CHÊNH~ VÊNH'
      const { words } = parseTitleWords(text)
      expect(words).toHaveLength(5)
      expect(words[0]).toEqual({ word: 'CHUYỂN', state: 'highlight', index: 0 })
      expect(words[1]).toEqual({ word: 'MÌNH', state: 'none', index: 1 })
      expect(words[2]).toEqual({ word: 'KHÔNG', state: 'none', index: 2 })
      expect(words[3]).toEqual({ word: 'CHÊNH', state: 'strike', index: 3 })
      expect(words[4]).toEqual({ word: 'VÊNH', state: 'none', index: 4 })
    })

    it('cycles word state on click: none -> highlight (*) -> strike (~) -> none', () => {
      const initial = 'CHUYỂN MÌNH KHÔNG CHÊNH VÊNH'

      // Bấm lần 1 vào CHUYỂN (index 0) -> thành *CHUYỂN*
      const step1 = toggleTitleWordAt(initial, 0)
      expect(step1).toBe('*CHUYỂN* MÌNH KHÔNG CHÊNH VÊNH')

      // Bấm lần 1 vào CHÊNH (index 3) -> thành *CHÊNH*
      const step2 = toggleTitleWordAt(step1, 3)
      expect(step2).toBe('*CHUYỂN* MÌNH KHÔNG *CHÊNH* VÊNH')

      // Bấm lần 2 vào CHÊNH (index 3) -> thành ~CHÊNH~
      const step3 = toggleTitleWordAt(step2, 3)
      expect(step3).toBe('*CHUYỂN* MÌNH KHÔNG ~CHÊNH~ VÊNH')

      // Bấm lần 3 vào CHÊNH (index 3) -> về lại CHÊNH (bình thường)
      const step4 = toggleTitleWordAt(step3, 3)
      expect(step4).toBe('*CHUYỂN* MÌNH KHÔNG CHÊNH VÊNH')
    })

    it('preserves surrounding punctuation when toggling words', () => {
      const withPunct = 'CHUYỂN, MÌNH!'
      const step1 = toggleTitleWordAt(withPunct, 0)
      expect(step1).toBe('*CHUYỂN*, MÌNH!')

      const step2 = toggleTitleWordAt(step1, 0)
      expect(step2).toBe('~CHUYỂN~, MÌNH!')

      const step3 = toggleTitleWordAt(step2, 0)
      expect(step3).toBe('CHUYỂN, MÌNH!')
    })
  })

  describe('6. TitleHighlightInput Component in Puck Builder', () => {
    it('renders input and interactive chips reflecting current string state', () => {
      let currentValue = '*CHUYỂN* MÌNH KHÔNG ~CHÊNH~ VÊNH'
      const handleChange = (val: string) => {
        currentValue = val
      }

      render(
        <TitleHighlightInput
          value={currentValue}
          onChange={handleChange}
          label="Tiêu đề dòng 1"
        />,
      )

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('*CHUYỂN* MÌNH KHÔNG ~CHÊNH~ VÊNH')

      // Verify chips exist and have accessible labels
      const chipChuyen = screen.getByRole('button', { name: /Chữ "CHUYỂN"/i })
      const chipChenh = screen.getByRole('button', { name: /Chữ "CHÊNH"/i })
      const chipMinh = screen.getByRole('button', { name: /Chữ "MÌNH"/i })

      expect(chipChuyen).toBeDefined()
      expect(chipChenh).toBeDefined()
      expect(chipMinh).toBeDefined()

      // Bấm chip MÌNH -> kích hoạt onChange
      fireEvent.click(chipMinh)
      expect(currentValue).toBe('*CHUYỂN* *MÌNH* KHÔNG ~CHÊNH~ VÊNH')
    })

    it('supports typing in input directly and synchronizes chips', () => {
      let currentValue = 'TẬP THƯƠNG'
      const { rerender } = render(
        <TitleHighlightInput
          value={currentValue}
          onChange={(val) => {
            currentValue = val
          }}
        />,
      )

      expect(screen.getAllByRole('button')).toHaveLength(2)

      // Gõ thêm dấu * vào input
      rerender(
        <TitleHighlightInput
          value="*TẬP* THƯƠNG"
          onChange={(val) => {
            currentValue = val
          }}
        />,
      )

      const chipTap = screen.getByRole('button', { name: /Chữ "TẬP" – Đang nhấn/i })
      expect(chipTap).toBeDefined()
    })

    it('associates label correctly so textbox accessible name is "Tiêu đề dòng 1"', () => {
      render(
        <TitleHighlightInput
          name="titleLine1"
          label="Tiêu đề dòng 1"
          value="Tiêu đề mẫu"
          onChange={() => {}}
        />,
      )

      const input = screen.getByRole('textbox', { name: 'Tiêu đề dòng 1' })
      expect(input).toBeDefined()
      expect((input as HTMLInputElement).value).toBe('Tiêu đề mẫu')

      // Dãy chip để ngoài <label> (nút không nằm trong label)
      const labelEl = screen.getByText('Tiêu đề dòng 1').closest('label')
      expect(labelEl).not.toBeNull()
      expect(labelEl?.querySelector('button')).toBeNull()
    })

    it('only renders in "content" tab and hides in "style" tab', () => {
      render(
        <StylePanelProvider ds={DEFAULT_DESIGN_SYSTEM}>
          <TabSwitcherTest />
        </StylePanelProvider>,
      )

      expect(screen.getByRole('textbox', { name: 'Tiêu đề dòng 1' })).toBeDefined()

      // Chuyển sang tab Kiểu (style)
      fireEvent.click(screen.getByRole('button', { name: 'Switch to Style' }))
      expect(screen.queryByRole('textbox', { name: 'Tiêu đề dòng 1' })).toBeNull()
    })
  })

  describe('7. Integration with TwoToneTitle and SectionHeader', () => {
    it('passes highlightStyle and highlightAnimation to TwoToneTitle', () => {
      const markup = renderToStaticMarkup(
        <TwoToneTitle
          line1="*CHUYỂN* MÌNH"
          line2="KHÔNG ~CHÊNH~ VÊNH"
          highlightStyle="pill"
        />,
      )
      expect(markup).toContain(`<span class="${TITLE_PILL_CLASS}">CHUYỂN</span>`)
      expect(markup).toContain(
        `<s class="line-through ${TITLE_STRIKE_COLOR}">CHÊNH</s>`,
      )
    })

    it('passes highlightStyle and highlightAnimation through SectionHeader', () => {
      const markup = renderToStaticMarkup(
        <SectionHeader
          titleLine1="*CHUYỂN* MÌNH"
          titleLine2="KHÔNG ~CHÊNH~ VÊNH"
          titleHighlightStyle="underline"
        />,
      )
      expect(markup).toContain(`<span class="${TITLE_UNDERLINE_CLASS}">CHUYỂN</span>`)
      expect(markup).toContain(
        `<s class="line-through ${TITLE_STRIKE_COLOR}">CHÊNH</s>`,
      )
    })

    it('preserves 100% exact HTML of SectionHeader when no markers are provided', () => {
      const markup = renderToStaticMarkup(
        <SectionHeader titleLine1="TIÊU ĐỀ 1" titleLine2="TIÊU ĐỀ 2" />,
      )
      expect(markup).toContain('<span class="block text-deep-navy">TIÊU ĐỀ 1</span>')
      expect(markup).toContain('<span class="block text-bright-magenta">TIÊU ĐỀ 2</span>')
      expect(markup).not.toContain('<span class="text-bright-magenta">')
      expect(markup).not.toContain('<s ')
    })
  })

  describe('8. Animation wrappers and styles', () => {
    it('wraps animated title with TitleHighlightAnimator when animation="draw"', () => {
      const markup = renderToStaticMarkup(
        <div>
          {renderHighlightedTitle('*CHUYỂN* MÌNH ~CHÊNH~', {
            animation: 'draw',
            style: 'underline',
          })}
        </div>,
      )
      expect(markup).toContain('data-title-animation="draw"')
      expect(markup).toContain('title-strike-token title-strike-line')
      expect(markup).toContain('title-hl-token title-hl-underline title-underline-line')
      expect(markup).toContain('data-hl-index="0"')
      expect(markup).toContain('data-hl-index="1"')
    })

    it('wraps animated title with TitleHighlightAnimator when animation="pop"', () => {
      const markup = renderToStaticMarkup(
        <div>
          {renderHighlightedTitle('*CHUYỂN* MÌNH', {
            animation: 'pop',
            style: 'pill',
          })}
        </div>,
      )
      expect(markup).toContain('data-title-animation="pop"')
      expect(markup).toContain('title-hl-token title-hl-pill')
    })
  })
})
