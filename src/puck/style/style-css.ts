/**
 * EB-04: CSS for blocks that carry a `_style`. Input is always passed through
 * `sanitizeBlockStyle` first, so only presets, validated numbers, palette tokens and hex values
 * reach the strings built here.
 */
import { DESIGN_FONT_OPTIONS, type FontCategory } from '@/lib/design/fonts'
import {
  CSS_VARS,
  EMOTION_GAP_VALUES,
  EYEBROW_GAP_VALUES,
  TITLE_LINE_HEIGHT_VALUES,
} from '@/lib/design/title-spacing'
import { isOpen, type CleanDesignSystem } from '@/lib/design/design-system'
import { sanitizeBlockCustomCss, sanitizePageCustomCss, PAGE_ATTR } from './custom-css'
import { containerCss, cssUrl } from './container-css'
import {
  CARD_ATTR,
  SECTION_ATTR,
  cssColor,
  isSafeBlockId,
  SPACING_CSS,
  STYLE_ATTR,
} from './css-shared'
import { cleanImageUrl, sanitizeContainer } from './container-schema'
import { TEXT_TARGET_ATTR } from './text-target'
import {
  DEVICE_MEDIA,
  DEVICES,
  SIDES,
  sanitizeBlockStyle,
  type BlockStyle,
  type Box,
  type Device,
  type Length,
  type Side,
  type TextTargetStyle,
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

const SAFE_TEXT_KEY = /^[A-Za-z0-9_-]{1,64}$/
function isSafeTextKey(key: unknown): key is string {
  return typeof key === 'string' && SAFE_TEXT_KEY.test(key)
}

function textDeclarations(textStyle: TextTargetStyle, device: Device): string[] {
  const size = textStyle.size?.[device]
  const align = textStyle.align?.[device]
  return [
    ...(size ? [`font-size:${length(size, FONT_SIZE)}`] : []),
    ...(align ? [`text-align:${align}`] : []),
  ]
}

function textBaseDeclarations(textStyle: TextTargetStyle): string[] {
  return [
    ...(textStyle.color ? [`color:${color(textStyle.color)}`] : []),
    ...(textStyle.weight ? [`font-weight:${textStyle.weight}`] : []),
    ...textDeclarations(textStyle, 'desktop'),
  ]
}

const length = (value: Length, presets: Record<string, string>) => presets[value] ?? value
const color = cssColor

function boxDeclarations(
  property: 'padding' | 'margin',
  box: Box | undefined,
  sides: readonly Side[] = SIDES,
): string[] {
  if (!box) return []
  return sides.flatMap((side) =>
    box[side] ? [`${property}-${side}:${length(box[side], SPACING)}`] : [],
  )
}

function deviceDeclarations(style: BlockStyle, device: Device, isContainer = false): string[] {
  const fontSize = style.fontSize?.[device]
  const textAlign = style.textAlign?.[device]
  const paddingSides: readonly Side[] = isContainer ? SIDES : ['right', 'left']
  return [
    ...boxDeclarations('padding', style.padding?.[device], paddingSides),
    ...boxDeclarations('margin', style.margin?.[device]),
    ...(fontSize ? [`font-size:${length(fontSize, FONT_SIZE)}`] : []),
    ...(textAlign ? [`text-align:${textAlign}`] : []),
  ]
}

function innerPaddingDeclarations(style: BlockStyle, device: Device): string[] {
  return boxDeclarations('padding', style.padding?.[device], ['top', 'bottom'])
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
    ...(style.titleLineHeight
      ? [`${CSS_VARS.titleLineHeight}:${TITLE_LINE_HEIGHT_VALUES[style.titleLineHeight]}`]
      : []),
    ...(style.eyebrowGap ? [`${CSS_VARS.eyebrowGap}:${EYEBROW_GAP_VALUES[style.eyebrowGap]}`] : []),
    ...(style.emotionGap ? [`${CSS_VARS.emotionGap}:${EMOTION_GAP_VALUES[style.emotionGap]}`] : []),
    ...(style.zIndex !== undefined ? [`z-index:${style.zIndex}`, 'position:relative'] : []),
    // Rounded corners need clipping so a background does not spill out.
    ...(style.radius && style.radius !== 'none' ? ['overflow:hidden'] : []),
  ]
}

const CARD_ITEMS: Record<string, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
  justify: 'flex-start',
}

/**
 * PK-17 / PK-20: card frame styling for [data-eb-card] inside the block.
 * default: no rule generated
 * borderless: border-color:transparent
 * flat: border-color:transparent;box-shadow:none
 * none: border-color:transparent;box-shadow:none;background:transparent
 * glass: background:rgb(255 255 255/.7); backdrop-filter:blur(12px); border-color:rgb(255 255 255/.6)
 */
function cardFrameRule(
  selector: string,
  cardFrame: BlockStyle['cardFrame'],
  isDark = false,
): string {
  if (!cardFrame || cardFrame === 'default') return ''
  if (cardFrame === 'borderless') {
    return `${selector} [${CARD_ATTR}]{border-color:transparent}`
  }
  if (cardFrame === 'flat') {
    return `${selector} [${CARD_ATTR}]{border-color:transparent;box-shadow:none}`
  }
  if (cardFrame === 'none') {
    // QA PK-17c: a solid (deep-navy, white text) card keeps its background, or its text would
    // turn invisible on a light section.
    return `${selector} [${CARD_ATTR}]{border-color:transparent;box-shadow:none}${selector} [${CARD_ATTR}]:not([${CARD_ATTR}-solid]){background:transparent}`
  }
  if (cardFrame === 'glass') {
    const lightGlass = `${selector} [${CARD_ATTR}]{background:rgb(255 255 255/.7);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-color:rgb(255 255 255/.6)}`
    const fallback = `@supports not (backdrop-filter:blur(12px)){${selector} [${CARD_ATTR}]{background:rgb(255 255 255/.9)}}`
    const darkSelectors = isDark
      ? `${selector}[data-bg="deep-navy"] [${CARD_ATTR}],${selector} [data-bg="deep-navy"] [${CARD_ATTR}],${selector} [${CARD_ATTR}]`
      : `${selector}[data-bg="deep-navy"] [${CARD_ATTR}],${selector} [data-bg="deep-navy"] [${CARD_ATTR}]`
    const darkGlass = `${darkSelectors}{background:rgb(255 255 255/.12);border-color:rgb(255 255 255/.2)}`
    return `${lightGlass}${fallback}${darkGlass}`
  }
  return ''
}

const VALID_BRAND_ACCENTS = [
  'deep-navy',
  'bright-magenta',
  'accent-pink',
  'soft-pink',
  'lavender-mist',
  'mint-haze',
  'butter-cream',
  'warm-ivory',
] as const

/**
 * PK-20: 6px accent stripe on top of [data-eb-card].
 * cycle: bright-magenta -> accent-pink -> deep-navy on cards 1, 2, 3...
 */
function cardAccentRule(
  selector: string,
  cardAccent: BlockStyle['cardAccent'],
  cardAccentShape?: BlockStyle['cardAccentShape'],
): string {
  const flatRadius =
    cardAccentShape === 'flat' ? ';border-top-left-radius:0;border-top-right-radius:0' : ''
  const stripe = (c: string) =>
    `border-top-width:6px;border-top-style:solid;border-top-color:${c}${flatRadius}`

  if (cardAccent && cardAccent !== 'none') {
    if (cardAccent === 'cycle') {
      const colors = [cssColor('bright-magenta'), cssColor('accent-pink'), cssColor('deep-navy')]
      const nth = ['3n+1', '3n+2', '3n']
      return colors
        .map(
          (c, i) =>
            `${selector} [${CARD_ATTR}]:nth-child(${nth[i]}),${selector} :nth-child(${nth[i]}) > [${CARD_ATTR}]:only-child{${stripe(c)}}`,
        )
        .join('')
    }
    if ((VALID_BRAND_ACCENTS as readonly string[]).includes(cardAccent)) {
      // CD-04 QA: Specificity >= 0,4,0 (repeated selector like PK-18d) so single-accent stripe beats
      // group-data-[card-theme=light-white]/grid:border-deep-navy/10 (0,3,0) in Columns and Grids.
      return `${selector}${selector}${selector} [${CARD_ATTR}],${selector} [${CARD_ATTR}]{${stripe(cssColor(cardAccent))}}`
    }
  }

  if (cardAccentShape === 'flat') {
    return `${selector}${selector}${selector} [${CARD_ATTR}],${selector} [${CARD_ATTR}]{border-top-left-radius:0;border-top-right-radius:0}`
  }

  return ''
}

/**
 * EB-15bc: cards inside the block follow its "Căn chữ" (text and decorative row). Specificity
 * 0,2,0: beats the card's own align classes, loses to the grid's "Căn lề tất cả thẻ" variants.
 */
function cardAlignRule(selector: string, align: string | undefined): string {
  const items = align ? CARD_ITEMS[align] : undefined
  if (!items) return ''
  const rule = `${selector} [${CARD_ATTR}]{text-align:${align};align-items:${items}}`
  // Step: the number + badge row is `justify-between` unless centred (also resets a wider device).
  const justify = align === 'center' ? 'center;gap:0.5rem' : 'space-between'
  return `${rule}${selector} [${CARD_ATTR}-row]{justify-content:${justify}}`
}

/** CSS for one block (already sanitized). Empty string when nothing applies. */
export function blockStyleCss(
  id: string,
  style: BlockStyle,
  optionsOrIsContainer?: boolean | { isContainer?: boolean },
): string {
  if (!isSafeBlockId(id)) return ''
  const isContainer =
    typeof optionsOrIsContainer === 'boolean'
      ? optionsOrIsContainer
      : optionsOrIsContainer?.isContainer === true
  const selector = `[${STYLE_ATTR}="${id}"]`
  const rules: string[] = []
  const base = [...baseDeclarations(style), ...deviceDeclarations(style, 'desktop', isContainer)]

  // PK-18: Background image declarations on block wrapper
  const bgImg = style.backgroundImage
  if (bgImg?.imageUrl) {
    base.push(
      'position:relative',
      `background-image:${cssUrl(bgImg.imageUrl)}`,
      `background-size:${bgImg.size ?? 'cover'}`,
      `background-position:${bgImg.position ?? 'center'}`,
      'background-repeat:no-repeat',
    )
  }

  if (base.length) rules.push(`${selector}{${base.join(';')}}`)

  // PK-24: Apply font family to all child elements with (0,2,0) specificity to beat Tailwind font-* classes
  const font = style.fontFamily
    ? DESIGN_FONT_OPTIONS.find((f) => f.value === style.fontFamily)
    : undefined
  if (font) {
    rules.push(`${selector}${selector} *{font-family:'${font.value}',${GENERIC[font.category]}}`)
  }

  // PK-24: Vertical padding (top/bottom) replaces existing block padding on the inner root element (> *)
  if (!isContainer) {
    const desktopInnerPadding = innerPaddingDeclarations(style, 'desktop')
    if (desktopInnerPadding.length) {
      rules.push(`${selector}${selector} > *{${desktopInnerPadding.join(';')}}`)
    }
  }

  // PK-18 / PK-23: Mobile background image
  if (bgImg?.mobileImageUrl) {
    rules.push(
      `@media (max-width: 639px){${selector}{background-image:${cssUrl(bgImg.mobileImageUrl)}}}`,
    )
  }

  // PK-18: Overlay via ::before
  if (bgImg?.imageUrl && bgImg.overlay && bgImg.overlayOpacity && bgImg.overlayOpacity > 0) {
    const opacityVal = (bgImg.overlayOpacity / 100).toFixed(2).replace(/\.?0+$/, '')
    rules.push(
      `${selector}::before{content:"";position:absolute;inset:0;background:${cssColor(bgImg.overlay)};opacity:${opacityVal};pointer-events:none;z-index:0}`,
    )
  }

  // PK-18: When block has background image, direct children and [data-eb-section] elements have transparent background
  if (bgImg?.imageUrl) {
    // QA PK-18d: doubled attribute selector (0,2,0) beats Tailwind `bg-*` (0,1,0) whatever the
    // CSS order. In the builder iframe Tailwind loads after the page styles, so a single
    // selector lost and the block's own background hid the image.
    const strong = `${selector}${selector}`
    rules.push(`${strong}>*{position:relative;z-index:1;background-color:transparent}`)
    rules.push(`${strong} [${SECTION_ATTR}]{background-color:transparent}`)
  }

  const desktopCards = cardAlignRule(selector, style.textAlign?.desktop)
  if (desktopCards) rules.push(desktopCards)
  const isDark = style.background === 'deep-navy'
  const cardFrame = cardFrameRule(selector, style.cardFrame, isDark)
  if (cardFrame) rules.push(cardFrame)
  const cardAccent = cardAccentRule(selector, style.cardAccent, style.cardAccentShape)
  if (cardAccent) rules.push(cardAccent)
  for (const device of DEVICES) {
    const media = DEVICE_MEDIA[device]
    if (!media) continue
    const declarations = deviceDeclarations(style, device, isContainer)
    const innerPadding = isContainer ? [] : innerPaddingDeclarations(style, device)
    const cards = cardAlignRule(selector, style.textAlign?.[device])
    if (declarations.length || innerPadding.length || cards) {
      const own = declarations.length ? `${selector}{${declarations.join(';')}}` : ''
      const inner = innerPadding.length
        ? `${selector}${selector} > *{${innerPadding.join(';')}}`
        : ''
      rules.push(`@media ${media}{${own}${inner}${cards}}`)
    }
  }
  for (const device of style.hideOn ?? []) {
    rules.push(`@media ${HIDE_MEDIA[device]}{${selector}{display:none}}`)
  }
  // EB-15a: Individual text target styles
  if (style.texts && typeof style.texts === 'object') {
    for (const [key, textStyle] of Object.entries(style.texts)) {
      if (!isSafeTextKey(key) || !textStyle) continue
      const targetSelector = `[${TEXT_TARGET_ATTR}="${id}:${key}"][${TEXT_TARGET_ATTR}]`
      const baseText = textBaseDeclarations(textStyle)
      if (baseText.length) {
        rules.push(`${targetSelector}{${baseText.join(';')}}`)
      }
      for (const device of ['tablet', 'mobile'] as const) {
        const media = DEVICE_MEDIA[device]
        if (!media) continue
        const devText = textDeclarations(textStyle, device)
        if (devText.length) {
          rules.push(`@media ${media}{${targetSelector}{${devText.join(';')}}}`)
        }
      }
    }
  }
  if (style.customCss) {
    const custom = sanitizeBlockCustomCss(style.customCss, id)
    if (custom) rules.push(custom)
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
    yield* walkNested(node.props)
  }
}

/** Slot arrays inside props, also inside array items (Tabs / Accordion `items[].content`). */
function* walkNested(props: unknown): Generator<PuckItem> {
  if (!props || typeof props !== 'object') return
  for (const prop of Object.values(props)) {
    if (!Array.isArray(prop)) continue
    if (prop.some((p) => p && typeof p === 'object' && 'type' in p)) {
      yield* walkItems(prop)
    } else {
      for (const element of prop) yield* walkNested(element)
    }
  }
}

/**
 * Styles for every styled block of a page (content, legacy zones and nested slots), plus the
 * Google fonts those blocks use. Blocks without a valid `_style` add nothing.
 */
export function collectPageStyles(
  data:
    | {
        content?: unknown
        zones?: Record<string, unknown>
        root?: { props?: Record<string, unknown>; [key: string]: unknown }
      }
    | null
    | undefined,
  ds: CleanDesignSystem,
  scopeAttr: string = PAGE_ATTR,
): { css: string; fonts: string[] } {
  const sources = [data?.content, ...Object.values(data?.zones ?? {})]
  const css: string[] = []
  const fonts = new Set<string>()

  // EB-09 / EB-10: Page / header / footer custom CSS (when customCss lock is open)
  if (isOpen(ds, 'customCss')) {
    const rawPageCss =
      (data?.root?.props?.customCss as unknown) ?? (data?.root?.customCss as unknown)
    if (typeof rawPageCss === 'string' && rawPageCss.trim()) {
      const pageCss = sanitizePageCustomCss(rawPageCss, scopeAttr)
      if (pageCss) css.push(pageCss)
    }
  }

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

      const style = sanitizeBlockStyle(
        item.props?._style,
        ds,
        typeof item.type === 'string' ? item.type : undefined,
      )
      if (style) {
        const rule = blockStyleCss(id, style, item.type === 'Container')
        if (rule) css.push(rule)
        if (style.fontFamily) fonts.add(style.fontFamily)
      }
    }
  }
  return { css: css.join(''), fonts: [...fonts] }
}
