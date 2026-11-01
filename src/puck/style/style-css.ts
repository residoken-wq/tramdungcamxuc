/**
 * EB-04: CSS for blocks that carry a `_style`. Input is always passed through
 * `sanitizeBlockStyle` first, so only presets, validated numbers, palette tokens and hex values
 * reach the strings built here.
 */
import { DESIGN_FONT_OPTIONS, type FontCategory } from '@/lib/design/fonts'
import type { CleanDesignSystem } from '@/lib/design/design-system'
import { containerCss } from './container-css'
import { cssColor, isSafeBlockId, SPACING_CSS, STYLE_ATTR } from './css-shared'
import { sanitizeContainer } from './container-schema'
import {
  DEVICE_MEDIA,
  DEVICES,
  SIDES,
  sanitizeBlockStyle,
  type BlockStyle,
  type Box,
  type Device,
  type Length,
} from './style-schema'

export { STYLE_ATTR, isSafeBlockId }

const SPACING = SPACING_CSS
const FONT_SIZE: Record<string, string> = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '2rem',
  '3xl': '3rem',
}
const RADIUS: Record<string, string> = {
  none: '0',
  sm: '8px',
  card: 'var(--radius-card, 20px)',
  full: '9999px',
}
const LINE_HEIGHT: Record<string, string> = { tight: '1.2', normal: '1.5', relaxed: '1.75' }
const SHADOW: Record<string, string> = {
  none: 'none',
  soft: '0 4px 20px -2px rgb(var(--color-deep-navy-rgb) / 0.06)',
  strong: '0 12px 32px -4px rgb(var(--color-deep-navy-rgb) / 0.18)',
}
const GENERIC: Record<FontCategory, string> = {
  'sans-serif': 'sans-serif',
  display: 'sans-serif',
  serif: 'serif',
  handwriting: 'cursive',
}
const HIDE_MEDIA: Record<Device, string> = {
  desktop: '(min-width: 1024px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  mobile: '(max-width: 767px)',
}

const length = (value: Length, presets: Record<string, string>) => presets[value] ?? value
const color = cssColor

function boxDeclarations(property: 'padding' | 'margin', box: Box | undefined): string[] {
  if (!box) return []
  return SIDES.flatMap((side) =>
    box[side] ? [`${property}-${side}:${length(box[side], SPACING)}`] : [],
  )
}

function deviceDeclarations(style: BlockStyle, device: Device): string[] {
  const fontSize = style.fontSize?.[device]
  const textAlign = style.textAlign?.[device]
  return [
    ...boxDeclarations('padding', style.padding?.[device]),
    ...boxDeclarations('margin', style.margin?.[device]),
    ...(fontSize ? [`font-size:${length(fontSize, FONT_SIZE)}`] : []),
    ...(textAlign ? [`text-align:${textAlign}`] : []),
  ]
}

function baseDeclarations(style: BlockStyle): string[] {
  const font = style.fontFamily
    ? DESIGN_FONT_OPTIONS.find((f) => f.value === style.fontFamily)
    : undefined
  return [
    ...(style.background ? [`background-color:${color(style.background)}`] : []),
    ...(style.textColor ? [`color:${color(style.textColor)}`] : []),
    ...(font ? [`font-family:'${font.value}',${GENERIC[font.category]}`] : []),
    ...(style.fontWeight ? [`font-weight:${style.fontWeight}`] : []),
    ...(style.lineHeight ? [`line-height:${LINE_HEIGHT[style.lineHeight]}`] : []),
    ...(style.radius ? [`border-radius:${length(style.radius, RADIUS)}`] : []),
    ...(style.borderWidth !== undefined
      ? [
          `border:${style.borderWidth}px solid ${style.borderColor ? color(style.borderColor) : 'currentColor'}`,
        ]
      : []),
    ...(style.shadow ? [`box-shadow:${SHADOW[style.shadow]}`] : []),
    // Rounded corners need clipping so a background does not spill out.
    ...(style.radius && style.radius !== 'none' ? ['overflow:hidden'] : []),
  ]
}

/** CSS for one block (already sanitized). Empty string when nothing applies. */
export function blockStyleCss(id: string, style: BlockStyle): string {
  if (!isSafeBlockId(id)) return ''
  const selector = `[${STYLE_ATTR}="${id}"]`
  const rules: string[] = []
  const base = [...baseDeclarations(style), ...deviceDeclarations(style, 'desktop')]
  if (base.length) rules.push(`${selector}{${base.join(';')}}`)
  for (const device of DEVICES) {
    const media = DEVICE_MEDIA[device]
    if (!media) continue
    const declarations = deviceDeclarations(style, device)
    if (declarations.length) rules.push(`@media ${media}{${selector}{${declarations.join(';')}}}`)
  }
  for (const device of style.hideOn ?? []) {
    rules.push(`@media ${HIDE_MEDIA[device]}{${selector}{display:none}}`)
  }
  return rules.join('')
}

type PuckItem = { type?: unknown; props?: Record<string, unknown> }

function* walkItems(value: unknown): Generator<PuckItem> {
  if (!Array.isArray(value)) return
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const node = item as PuckItem
    yield node
    // Slot fields hold nested arrays of blocks inside props.
    for (const prop of Object.values(node.props ?? {})) {
      if (Array.isArray(prop) && prop.some((p) => p && typeof p === 'object' && 'type' in p)) {
        yield* walkItems(prop)
      }
    }
  }
}

/**
 * Styles for every styled block of a page (content, legacy zones and nested slots), plus the
 * Google fonts those blocks use. Blocks without a valid `_style` add nothing.
 */
export function collectPageStyles(
  data: { content?: unknown; zones?: Record<string, unknown> } | null | undefined,
  ds: CleanDesignSystem,
): { css: string; fonts: string[] } {
  const sources = [data?.content, ...Object.values(data?.zones ?? {})]
  const css: string[] = []
  const fonts = new Set<string>()
  for (const source of sources) {
    for (const item of walkItems(source)) {
      const id = item.props?.id
      if (!isSafeBlockId(id)) continue

      // EB-05: Container layout rules run before _style so user overrides win
      if (item.type === 'Container') {
        const sanitized = sanitizeContainer(item.props, ds)
        const containerRule = containerCss(id, sanitized.layout, sanitized.background)
        if (containerRule) css.push(containerRule)
      }

      const style = sanitizeBlockStyle(item.props?._style, ds)
      if (style) {
        const rule = blockStyleCss(id, style)
        if (rule) css.push(rule)
        if (style.fontFamily) fonts.add(style.fontFamily)
      }
    }
  }
  return { css: css.join(''), fonts: [...fonts] }
}
