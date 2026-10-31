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
}

const font = (value: string, category: FontCategory): DesignFontOption => ({
  value,
  label: value,
  category,
})

export const DESIGN_FONT_OPTIONS: readonly DesignFontOption[] = [
  // Brand Book 2026 (Trạm Dừng Cảm Xúc) defaults first.
  font('Anton', 'display'),
  font('Montserrat', 'sans-serif'),
  font('Playfair Display', 'serif'),
  font('Inter', 'sans-serif'),
  font('Be Vietnam Pro', 'sans-serif'),
  font('Roboto', 'sans-serif'),
  font('Open Sans', 'sans-serif'),
  font('Noto Sans', 'sans-serif'),
  font('Nunito', 'sans-serif'),
  font('Mulish', 'sans-serif'),
  font('Manrope', 'sans-serif'),
  font('Lexend', 'sans-serif'),
  font('Work Sans', 'sans-serif'),
  font('Source Sans 3', 'sans-serif'),
  font('Raleway', 'sans-serif'),
  font('Josefin Sans', 'sans-serif'),
  font('Quicksand', 'sans-serif'),
  font('Barlow', 'sans-serif'),
  font('Arimo', 'sans-serif'),
  font('Oswald', 'display'),
  font('Comfortaa', 'display'),
  font('Lora', 'serif'),
  font('Merriweather', 'serif'),
  font('Noto Serif', 'serif'),
  font('Roboto Slab', 'serif'),
  font('EB Garamond', 'serif'),
  font('Cormorant Garamond', 'serif'),
  font('Prata', 'serif'),
  font('Dancing Script', 'handwriting'),
  font('Pacifico', 'handwriting'),
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
