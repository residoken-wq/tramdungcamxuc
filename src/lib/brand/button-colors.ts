import type { CSSProperties } from 'react'

/**
 * PK-15: brand-only colours for a block's CTA button (button fill + label colour).
 *
 * - Button fill: the 8 Brand Book 2026 colours, or '' = automatic (the block's default style).
 * - Label colour: only colours that reach WCAG AA for *large* text (>= 3:1) on the chosen fill.
 *   Buttons render at 19px bold (md / lg), which counts as large text.
 * - Colours render through the design-system CSS variables (`--color-<name>-rgb`), so a token
 *   changed in "Thiết kế & thương hiệu" still applies. Contrast is computed from the Brand Book
 *   defaults below.
 */

export const BUTTON_BG_COLORS = [
  'accent-pink',
  'bright-magenta',
  'deep-navy',
  'soft-pink',
  'lavender-mist',
  'mint-haze',
  'butter-cream',
  'warm-ivory',
] as const
export type ButtonBgColor = (typeof BUTTON_BG_COLORS)[number]

export const BUTTON_TEXT_COLORS = [
  'white',
  'deep-navy',
  'bright-magenta',
  'accent-pink',
  'soft-pink',
] as const
export type ButtonTextColor = (typeof BUTTON_TEXT_COLORS)[number]

const LABELS: Record<ButtonBgColor | ButtonTextColor, string> = {
  'accent-pink': 'Hồng nhấn',
  'bright-magenta': 'Hồng sen',
  'deep-navy': 'Xanh thẫm',
  'soft-pink': 'Hồng phấn',
  'lavender-mist': 'Tím sương',
  'mint-haze': 'Bạc hà',
  'butter-cream': 'Kem bơ',
  'warm-ivory': 'Ngà ấm',
  white: 'Trắng',
}

const HEX: Record<ButtonBgColor | ButtonTextColor, string> = {
  'deep-navy': '#280A60',
  'bright-magenta': '#BC039E',
  'accent-pink': '#EF3B83',
  'soft-pink': '#FDE6F6',
  'lavender-mist': '#E9DDF9',
  'mint-haze': '#D9F1EA',
  'butter-cream': '#F6E9B8',
  'warm-ivory': '#FAF7F4',
  white: '#FFFFFF',
}

/** WCAG large-text threshold; CTA buttons are 19px bold. */
export const BUTTON_MIN_CONTRAST = 3

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(
  a: ButtonBgColor | ButtonTextColor,
  b: ButtonBgColor | ButtonTextColor,
) {
  const [l1, l2] = [luminance(HEX[a]), luminance(HEX[b])].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

export function isButtonBgColor(value: unknown): value is ButtonBgColor {
  return typeof value === 'string' && (BUTTON_BG_COLORS as readonly string[]).includes(value)
}

export function isButtonTextColor(value: unknown): value is ButtonTextColor {
  return typeof value === 'string' && (BUTTON_TEXT_COLORS as readonly string[]).includes(value)
}

/** Label colours readable on this fill, best contrast first. */
export function allowedButtonTextColors(bg: ButtonBgColor): ButtonTextColor[] {
  return BUTTON_TEXT_COLORS.filter((t) => contrastRatio(bg, t) >= BUTTON_MIN_CONTRAST).sort(
    (a, b) => contrastRatio(bg, b) - contrastRatio(bg, a),
  )
}

/** Automatic label: white like the site's primary button when readable, else the best contrast. */
export function defaultButtonTextColor(bg: ButtonBgColor): ButtonTextColor {
  const allowed = allowedButtonTextColors(bg)
  return allowed.includes('white') ? 'white' : allowed[0]
}

const AUTO = { label: 'Tự động (theo nền khối)', value: '' }

export const BUTTON_BG_OPTIONS = [
  AUTO,
  ...BUTTON_BG_COLORS.map((value) => ({ label: LABELS[value], value })),
]

export function buttonTextOptions(bg: unknown) {
  if (!isButtonBgColor(bg)) return [AUTO]
  return [
    { label: 'Tự động (dễ đọc nhất)', value: '' },
    ...allowedButtonTextColors(bg).map((value) => ({ label: LABELS[value], value })),
  ]
}

const cssColor = (c: ButtonBgColor | ButtonTextColor) =>
  c === 'white' ? '#FFFFFF' : `rgb(var(--color-${c}-rgb))`

/**
 * Inline style for a custom-coloured button, or undefined to keep the block's default variant.
 * A label colour that does not reach 3:1 on the fill (stale data after the fill changed) is
 * replaced by the most readable allowed one, so the button never becomes unreadable.
 * When the fill equals the section background, a 2px border in the label colour keeps the
 * button visible (WCAG 1.4.11).
 */
export function buttonColorStyle(
  bg: unknown,
  text: unknown,
  sectionBg?: string,
): CSSProperties | undefined {
  if (!isButtonBgColor(bg)) return undefined
  const allowed = allowedButtonTextColors(bg)
  const label =
    isButtonTextColor(text) && allowed.includes(text) ? text : defaultButtonTextColor(bg)
  const style: CSSProperties = { backgroundColor: cssColor(bg), color: cssColor(label) }
  if (sectionBg === bg) style.boxShadow = `inset 0 0 0 2px ${cssColor(label)}`
  return style
}
