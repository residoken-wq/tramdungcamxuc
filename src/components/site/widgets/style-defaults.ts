/**
 * EB-06a: widgets take their typography from `_style` (Style tab), which `withBlockStyle` puts on
 * a wrapper around the widget. CSS inheritance only reaches the widget's text when the widget does
 * not set the same property itself, so each default class is dropped as soon as `_style` sets the
 * matching property.
 */
import { isValidHex } from '@/lib/design/design-system'

type StyleKey = 'textColor' | 'fontSize' | 'fontFamily' | 'fontWeight' | 'lineHeight' | 'textAlign'

export type TypographyDefaults = Partial<Record<StyleKey, string>>

export function typographyClasses(defaults: TypographyDefaults, style: unknown): string {
  const s = (style && typeof style === 'object' ? style : {}) as Record<string, unknown>
  return (Object.keys(defaults) as StyleKey[])
    .filter((key) => s[key] === undefined || s[key] === null || s[key] === '')
    .map((key) => defaults[key])
    .join(' ')
}

const TOKEN = /^[a-z][a-z0-9-]{1,40}$/

/** Palette token → its CSS variable (follows the designSystem); hex kept; anything else dropped. */
export function widgetColor(value: unknown, fallback = 'deep-navy'): string {
  if (typeof value === 'string' && isValidHex(value)) return value
  const token = typeof value === 'string' && TOKEN.test(value) ? value : fallback
  return `rgb(var(--color-${token}-rgb))`
}
