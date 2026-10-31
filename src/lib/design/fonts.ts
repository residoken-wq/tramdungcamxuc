/**
 * EB-01: Google Fonts the design system may pick from. Every font here ships the `vietnamese`
 * subset (checked against next/font's font-data.json in tests/unit/design-fonts.test.ts).
 * `category` is the CSS generic family used as fallback.
 */
export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting'

export interface DesignFontOption {
  value: string
  label: string
  category: FontCategory
  /** Weights among 400 / 600 / 700 that Google serves for this family (EB-02 font request). */
  weights: readonly number[]
  /** Google serves an italic style. */
  italic: boolean
}

const font = (
  value: string,
  category: FontCategory,
  weights: readonly number[],
  italic: boolean,
): DesignFontOption => ({ value, label: value, category, weights, italic })

export const DESIGN_FONT_OPTIONS: readonly DesignFontOption[] = [
  // Brand Book 2026 (Trạm Dừng Cảm Xúc) defaults first.
  font('Anton', 'display', [400], false),
  font('Montserrat', 'sans-serif', [400, 600, 700], true),
  font('Playfair Display', 'serif', [400, 600, 700], true),
  font('Inter', 'sans-serif', [400, 600, 700], true),
  font('Be Vietnam Pro', 'sans-serif', [400, 600, 700], true),
  font('Roboto', 'sans-serif', [400, 600, 700], true),
  font('Open Sans', 'sans-serif', [400, 600, 700], true),
  font('Noto Sans', 'sans-serif', [400, 600, 700], true),
  font('Nunito', 'sans-serif', [400, 600, 700], true),
  font('Mulish', 'sans-serif', [400, 600, 700], true),
  font('Manrope', 'sans-serif', [400, 600, 700], false),
  font('Lexend', 'sans-serif', [400, 600, 700], false),
  font('Work Sans', 'sans-serif', [400, 600, 700], true),
  font('Source Sans 3', 'sans-serif', [400, 600, 700], true),
  font('Raleway', 'sans-serif', [400, 600, 700], true),
  font('Josefin Sans', 'sans-serif', [400, 600, 700], true),
  font('Quicksand', 'sans-serif', [400, 600, 700], false),
  font('Barlow', 'sans-serif', [400, 600, 700], true),
  font('Arimo', 'sans-serif', [400, 600, 700], true),
  font('Oswald', 'display', [400, 600, 700], false),
  font('Comfortaa', 'display', [400, 600, 700], false),
  font('Lora', 'serif', [400, 600, 700], true),
  font('Merriweather', 'serif', [400, 600, 700], true),
  font('Noto Serif', 'serif', [400, 600, 700], true),
  font('Roboto Slab', 'serif', [400, 600, 700], false),
  font('EB Garamond', 'serif', [400, 600, 700], true),
  font('Cormorant Garamond', 'serif', [400, 600, 700], true),
  font('Prata', 'serif', [400], false),
  font('Dancing Script', 'handwriting', [400, 600, 700], false),
  font('Pacifico', 'handwriting', [400], false),
]

export const DESIGN_FONT_VALUES: readonly string[] = DESIGN_FONT_OPTIONS.map((f) => f.value)

export function isDesignFont(value: unknown): value is string {
  return typeof value === 'string' && DESIGN_FONT_VALUES.includes(value)
}

export type FontRole = 'heading' | 'ui' | 'quote' | 'body'

/** Brand Book 2026 font per role (AGENTS §5). */
export const DEFAULT_FONTS: Record<FontRole, string> = {
  heading: 'Anton',
  ui: 'Montserrat',
  quote: 'Playfair Display',
  body: 'Montserrat',
}
