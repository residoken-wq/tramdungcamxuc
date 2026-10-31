/**
 * EB-02: turns the cleaned `designSystem` into the CSS that overrides the Brand Book defaults.
 * Only values that differ from the defaults are emitted, so a site still on the Brand Book renders
 * exactly as before (no extra <style>, no Google Fonts request – the self-hosted fonts stay).
 */
import { DEFAULT_DESIGN_SYSTEM, hexToRgbTriplet, type CleanDesignSystem } from './design-system'
import { DEFAULT_FONTS, DESIGN_FONT_OPTIONS, type FontCategory, type FontRole } from './fonts'

export const GOOGLE_FONTS_CSS_ORIGIN = 'https://fonts.googleapis.com'
export const GOOGLE_FONTS_FILE_ORIGIN = 'https://fonts.gstatic.com'

/** CSS variable each font role writes (see tailwind.config.ts fontFamily). */
export const FONT_ROLE_VARIABLES: Record<FontRole, string> = {
  heading: '--font-display',
  ui: '--font-ui',
  quote: '--font-quote',
  body: '--font-body',
}

const GENERIC_FAMILY: Record<FontCategory, string> = {
  'sans-serif': 'sans-serif',
  display: 'sans-serif',
  serif: 'serif',
  handwriting: 'cursive',
}

function changedFontRoles(ds: CleanDesignSystem): FontRole[] {
  return (Object.keys(DEFAULT_FONTS) as FontRole[]).filter(
    (role) => ds.fonts[role] !== DEFAULT_FONTS[role],
  )
}

const fontOption = (name: string) => DESIGN_FONT_OPTIONS.find((f) => f.value === name)

/**
 * Google Fonts CSS2 URL for the fonts that replace a default, or null when every role keeps its
 * self-hosted Brand Book font. Weights are limited to what each family serves (400 / 600 / 700);
 * the quote role also asks for italic 400 when the family has it.
 */
export function googleFontsHref(ds: CleanDesignSystem): string | null {
  const wanted = new Map<string, { italic: boolean }>()
  for (const role of changedFontRoles(ds)) {
    const name = ds.fonts[role]
    const option = fontOption(name)
    if (!option) continue
    const entry = wanted.get(name) ?? { italic: false }
    if (role === 'quote' && option.italic) entry.italic = true
    wanted.set(name, entry)
  }
  return googleFontsHrefFor(wanted)
}

/** Fonts the designSystem already loads from Google (roles changed from the defaults). */
export function designSystemGoogleFonts(ds: CleanDesignSystem): string[] {
  return changedFontRoles(ds).map((role) => ds.fonts[role])
}

/**
 * Google Fonts CSS2 URL for the given families (EB-02 roles, EB-04 per-block fonts). Unknown
 * names are skipped; null when nothing is left.
 */
export function googleFontsHrefFor(
  wanted: ReadonlyMap<string, { italic: boolean }>,
): string | null {
  const families = [...wanted.entries()].flatMap(([name, { italic }]) => {
    const option = fontOption(name)
    if (!option) return []
    const family = name.replace(/ /g, '+')
    if (!italic) return [`family=${family}:wght@${option.weights.join(';')}`]
    const tuples = [...option.weights.map((w) => `0,${w}`), '1,400']
    return [`family=${family}:ital,wght@${tuples.join(';')}`]
  })
  if (families.length === 0) return null
  return `${GOOGLE_FONTS_CSS_ORIGIN}/css2?${families.join('&')}&display=swap`
}

/** Font names come from a fixed list, but escape anyway so a value can never break the rule. */
const cssString = (value: string) => `'${value.replace(/[^A-Za-z0-9 ]/g, '')}'`

/**
 * Custom properties that differ from the Brand Book defaults, as one `html:root { … }` rule.
 * `html:root` beats the `next/font` variable classes set on <html>. Empty string when nothing
 * differs.
 */
export function buildDesignCss(ds: CleanDesignSystem): string {
  const declarations: string[] = []
  const defaults = new Map(DEFAULT_DESIGN_SYSTEM.colors.map((c) => [c.token, c.hex.toUpperCase()]))

  for (const color of ds.colors) {
    const hex = color.hex.toUpperCase()
    if (defaults.get(color.token) === hex) continue
    const rgb = hexToRgbTriplet(hex)
    if (!rgb) continue
    declarations.push(`--color-${color.token}: ${hex}`, `--color-${color.token}-rgb: ${rgb}`)
  }

  for (const role of changedFontRoles(ds)) {
    const option = fontOption(ds.fonts[role])
    if (!option) continue
    declarations.push(
      `${FONT_ROLE_VARIABLES[role]}: ${cssString(option.value)}, ${GENERIC_FAMILY[option.category]}`,
    )
  }

  if (ds.radiusCard !== DEFAULT_DESIGN_SYSTEM.radiusCard) {
    declarations.push(`--radius-card: ${ds.radiusCard}px`)
  }
  for (const size of ['sm', 'md', 'lg'] as const) {
    if (ds.spacing[size] !== DEFAULT_DESIGN_SYSTEM.spacing[size]) {
      declarations.push(`--space-breath-${size}: ${ds.spacing[size]}px`)
    }
  }

  return declarations.length ? `html:root{${declarations.join(';')}}` : ''
}
