import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_FONTS, DESIGN_FONT_OPTIONS } from '../../src/lib/design/fonts'
import {
  cleanDesignSystem,
  colorListProblem,
  contrastRatio,
  CORE_COLOR_TOKENS,
  DEFAULT_COLORS,
  DEFAULT_DESIGN_SYSTEM,
  hexToRgbTriplet,
  isOpen,
} from '../../src/lib/design/design-system'

const fontData = JSON.parse(
  readFileSync(
    join(process.cwd(), 'node_modules/next/dist/compiled/@next/font/dist/google/font-data.json'),
    'utf8',
  ),
) as Record<string, { subsets: string[] }>

describe('EB-01: font list', () => {
  it('only offers Google fonts with the vietnamese subset', () => {
    for (const font of DESIGN_FONT_OPTIONS) {
      expect(fontData[font.value]?.subsets, font.value).toContain('vietnamese')
    }
  })

  it('has no duplicates and contains the Brand Book defaults', () => {
    const values = DESIGN_FONT_OPTIONS.map((f) => f.value)
    expect(new Set(values).size).toBe(values.length)
    for (const font of Object.values(DEFAULT_FONTS)) expect(values).toContain(font)
  })
})

describe('EB-01: colour helpers', () => {
  it('converts HEX to the rgb triplet used by the CSS variables', () => {
    expect(hexToRgbTriplet('#280A60')).toBe('40 10 96')
    expect(hexToRgbTriplet('#ffffff')).toBe('255 255 255')
    expect(hexToRgbTriplet('#FFF')).toBeNull()
    expect(hexToRgbTriplet('280A60')).toBeNull()
  })

  it('computes WCAG contrast ratios', () => {
    expect(contrastRatio('#280A60', '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBe(1)
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrastRatio('nope', '#FFFFFF')).toBeNull()
  })

  it('reports missing core tokens and duplicates', () => {
    expect(colorListProblem(DEFAULT_COLORS)).toBeNull()
    expect(colorListProblem(DEFAULT_COLORS.slice(1))).toEqual({
      kind: 'missingCore',
      tokens: [CORE_COLOR_TOKENS[0]],
    })
    expect(colorListProblem([...DEFAULT_COLORS, { token: 'deep-navy' }])).toEqual({
      kind: 'duplicate',
      tokens: ['deep-navy'],
    })
  })
})

describe('EB-01: cleanDesignSystem', () => {
  it('returns the Brand Book defaults with everything locked when empty', () => {
    expect(cleanDesignSystem(null)).toEqual(DEFAULT_DESIGN_SYSTEM)
    expect(DEFAULT_DESIGN_SYSTEM.lock).toEqual({
      colors: 'locked',
      fonts: 'locked',
      sizes: 'locked',
      customCss: 'locked',
      contrastCheck: true,
    })
  })

  it('keeps valid colours, fills missing core tokens and drops invalid rows', () => {
    const clean = cleanDesignSystem({
      colors: [
        { token: 'deep-navy', label: 'Chữ', hex: '#112233' },
        { token: 'xanh-la', label: null, hex: '#00aa00' },
        { token: 'Bad Token', hex: '#000000' },
        { token: 'xam', hex: 'grey' },
        { token: 'xanh-la', hex: '#00BB00' },
      ],
    })
    expect(clean.colors[0]).toEqual({ token: 'deep-navy', label: 'Chữ', hex: '#112233' })
    expect(clean.colors[1]).toEqual({ token: 'xanh-la', label: 'xanh-la', hex: '#00AA00' })
    const tokens = clean.colors.map((c) => c.token)
    for (const core of CORE_COLOR_TOKENS) expect(tokens).toContain(core)
    expect(tokens).not.toContain('xam')
    expect(tokens.filter((tk) => tk === 'xanh-la')).toHaveLength(1)
  })

  it('falls back to the default font of the role for unknown fonts', () => {
    const clean = cleanDesignSystem({ fonts: { heading: 'Comic Sans', ui: 'Inter' } })
    expect(clean.fonts.heading).toBe(DEFAULT_FONTS.heading)
    expect(clean.fonts.ui).toBe('Inter')
  })

  it('reads lock switches and out-of-range numbers safely', () => {
    const clean = cleanDesignSystem({
      lock: { colors: 'open', fonts: 'weird', contrastCheck: false },
      radiusCard: 500,
      spacing: { sm: 8 },
    })
    expect(isOpen(clean, 'colors')).toBe(true)
    expect(isOpen(clean, 'fonts')).toBe(false)
    expect(clean.lock.contrastCheck).toBe(false)
    expect(clean.radiusCard).toBe(DEFAULT_DESIGN_SYSTEM.radiusCard)
    expect(clean.spacing).toEqual({ ...DEFAULT_DESIGN_SYSTEM.spacing, sm: 8 })
  })
})

describe('EB-01: default colour labels', () => {
  it('do not repeat the HEX value', () => {
    for (const color of DEFAULT_COLORS) expect(color.label).not.toMatch(/#[0-9A-F]{6}/i)
  })
})
