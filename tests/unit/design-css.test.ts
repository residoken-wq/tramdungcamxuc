import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildDesignCss, googleFontsHref } from '../../src/lib/design/design-css'
import {
  cleanDesignSystem,
  DEFAULT_DESIGN_SYSTEM,
  hexToRgbTriplet,
  type CleanDesignSystem,
} from '../../src/lib/design/design-system'
import { DESIGN_FONT_OPTIONS } from '../../src/lib/design/fonts'
import { buildCspDirective } from '../../src/lib/security-headers'

const withChanges = (patch: Partial<CleanDesignSystem>): CleanDesignSystem => ({
  ...DEFAULT_DESIGN_SYSTEM,
  ...patch,
})

describe('EB-02: defaults keep the page identical', () => {
  it('emits no CSS and no Google Fonts request for the Brand Book defaults', () => {
    expect(buildDesignCss(DEFAULT_DESIGN_SYSTEM)).toBe('')
    expect(googleFontsHref(DEFAULT_DESIGN_SYSTEM)).toBeNull()
    expect(buildDesignCss(cleanDesignSystem(null))).toBe('')
  })

  it('the defaults match the CSS variables in styles.css', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/(site)/styles.css'), 'utf8')
    for (const color of DEFAULT_DESIGN_SYSTEM.colors) {
      expect(css).toMatch(new RegExp(`--color-${color.token}: ${color.hex};`, 'i'))
      expect(css).toContain(`--color-${color.token}-rgb: ${hexToRgbTriplet(color.hex)};`)
    }
    expect(css).toContain(`--radius-card: ${DEFAULT_DESIGN_SYSTEM.radiusCard}px;`)
    expect(css).toContain(`--space-breath-sm: ${DEFAULT_DESIGN_SYSTEM.spacing.sm}px;`)
    expect(css).toContain(`--space-breath-md: ${DEFAULT_DESIGN_SYSTEM.spacing.md}px;`)
    expect(css).toContain(`--space-breath-lg: ${DEFAULT_DESIGN_SYSTEM.spacing.lg}px;`)
  })
})

describe('EB-02: buildDesignCss', () => {
  it('overrides only the changed colour, with its rgb triplet', () => {
    const colors = DEFAULT_DESIGN_SYSTEM.colors.map((c) =>
      c.token === 'accent-pink' ? { ...c, hex: '#FF0000' } : c,
    )
    expect(buildDesignCss(withChanges({ colors }))).toBe(
      'html:root{--color-accent-pink: #FF0000;--color-accent-pink-rgb: 255 0 0}',
    )
  })

  it('adds extra colours, changed fonts, radius and spacing', () => {
    const css = buildDesignCss(
      withChanges({
        colors: [...DEFAULT_DESIGN_SYSTEM.colors, { token: 'xanh-la', label: 'x', hex: '#00AA00' }],
        fonts: { ...DEFAULT_DESIGN_SYSTEM.fonts, heading: 'Oswald', body: 'Lora' },
        radiusCard: 8,
        spacing: { ...DEFAULT_DESIGN_SYSTEM.spacing, lg: 40 },
      }),
    )
    expect(css).toContain('--color-xanh-la: #00AA00;--color-xanh-la-rgb: 0 170 0')
    expect(css).toContain("--font-display: 'Oswald', sans-serif")
    expect(css).toContain("--font-body: 'Lora', serif")
    expect(css).not.toContain('--font-ui')
    expect(css).toContain('--radius-card: 8px')
    expect(css).toContain('--space-breath-lg: 40px')
    expect(css).not.toContain('--space-breath-sm')
  })
})

describe('EB-02: googleFontsHref', () => {
  it('requests only replaced fonts, with the weights each family has', () => {
    const href = googleFontsHref(
      withChanges({ fonts: { ...DEFAULT_DESIGN_SYSTEM.fonts, heading: 'Oswald', ui: 'Inter' } }),
    )
    expect(href).toBe(
      'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Inter:wght@400;600;700&display=swap',
    )
  })

  it('asks for italic only for the quote role and only when the family has it', () => {
    expect(
      googleFontsHref(withChanges({ fonts: { ...DEFAULT_DESIGN_SYSTEM.fonts, quote: 'Lora' } })),
    ).toBe(
      'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap',
    )
    expect(
      googleFontsHref(withChanges({ fonts: { ...DEFAULT_DESIGN_SYSTEM.fonts, quote: 'Prata' } })),
    ).toBe('https://fonts.googleapis.com/css2?family=Prata:wght@400&display=swap')
  })

  it('font metadata matches next/font font-data.json', () => {
    const data = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          'node_modules/next/dist/compiled/@next/font/dist/google/font-data.json',
        ),
        'utf8',
      ),
    ) as Record<
      string,
      { weights: string[]; styles: string[]; axes?: { tag: string; min: number; max: number }[] }
    >
    for (const font of DESIGN_FONT_OPTIONS) {
      const meta = data[font.value]!
      const wght = meta.axes?.find((a) => a.tag === 'wght')
      for (const w of font.weights) {
        const served = meta.weights.includes(String(w)) || (wght && wght.min <= w && w <= wght.max)
        expect(served, `${font.value} ${w}`).toBeTruthy()
      }
      expect(font.italic, font.value).toBe(meta.styles.includes('italic'))
    }
  })
})

describe('EB-02: CSP allows Google Fonts', () => {
  it('lists fonts.googleapis.com for styles and fonts.gstatic.com for fonts', () => {
    const csp = buildCspDirective({ isDev: false })
    expect(csp).toMatch(/style-src [^;]*https:\/\/fonts\.googleapis\.com/)
    expect(csp).toMatch(/font-src [^;]*https:\/\/fonts\.gstatic\.com/)
  })
})
