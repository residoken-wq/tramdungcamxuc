import {
  allowedTextColors,
  textColorClass,
  type FontSizeOption,
  type TextColorOption,
} from './format-classes'

/**
 * Format presets for the text blocks (PK-10). Every scale keeps `md` equal to the block's
 * pre-PK-10 classes, so pages built before the presets existed look exactly the same.
 * Class strings are literal so Tailwind can see them.
 */
export const SECTION_TITLE_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-2xl sm:text-3xl',
  md: 'text-3xl sm:text-4xl',
  lg: 'text-4xl sm:text-5xl',
}

export const BODY_TEXT_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base sm:text-lg',
}

export const LEAD_TEXT_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-sm sm:text-base',
  md: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
}

export const QUOTE_TEXT_SIZES: Record<FontSizeOption, string> = {
  sm: 'text-lg sm:text-xl',
  md: 'text-xl sm:text-2xl',
  lg: 'text-2xl sm:text-3xl',
}

export const TEXT_ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
} as const

export function sizeClass(scale: Record<FontSizeOption, string>, size?: FontSizeOption): string {
  return scale[size ?? 'md'] ?? scale.md
}

/**
 * Body text colour on a known background. `deep-navy` (the stored default) or a colour that
 * fails WCAG AA on `bg` falls back to `autoClass`, the block's own automatic colour.
 */
export function bodyColorClass(
  color: TextColorOption | undefined,
  bg: string,
  autoClass: string,
  large = false,
): string {
  if (!color || color === 'deep-navy') return autoClass
  const allowed = allowedTextColors(bg, large).some((opt) => opt.value === color)
  return allowed ? textColorClass(color) : autoClass
}
