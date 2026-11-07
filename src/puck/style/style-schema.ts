/**
 * EB-04: the optional `_style` prop every Puck block can carry (Style / Advanced tabs), and the
 * rules that clean it. Everything here is pure and client-safe. Values coming from the editor are
 * user data: `sanitizeBlockStyle` drops anything malformed or not allowed by the brand locks of
 * the `designSystem` global, so the CSS builder only ever sees validated tokens and numbers.
 */
import { isOpen, isValidHex, type CleanDesignSystem } from '@/lib/design/design-system'
import { isDesignFont } from '@/lib/design/fonts'
import { TEXT_TARGETS } from './text-targets'
import {
  cleanEmotionGap,
  cleanEyebrowGap,
  cleanTitleLineHeight,
  type EmotionGapPreset,
  type EyebrowGapPreset,
  type TitleLineHeightPreset,
} from '@/lib/design/title-spacing'

export const DEVICES = ['desktop', 'tablet', 'mobile'] as const
export type Device = (typeof DEVICES)[number]

/** Per-device value; a missing device inherits mobile ← tablet ← desktop (like Elementor). */
export type Responsive<T> = Partial<Record<Device, T>>

/** Media queries for each device. Desktop is the base rule (no query). */
export const DEVICE_MEDIA: Record<Device, string | null> = {
  desktop: null,
  tablet: '(max-width: 1023px)',
  mobile: '(max-width: 767px)',
}

export const SPACING_PRESETS = ['none', 'sm', 'md', 'lg', 'xl'] as const
export const FONT_SIZE_PRESETS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
export type FontSizePreset = (typeof FONT_SIZE_PRESETS)[number]
export const RADIUS_PRESETS = ['none', 'sm', 'card', 'full'] as const
export const SHADOWS = ['none', 'soft', 'strong'] as const
export const FONT_WEIGHTS = [400, 600, 700] as const
export const TEXT_ALIGNS = ['left', 'center', 'right', 'justify'] as const
export const LINE_HEIGHTS = ['tight', 'normal', 'relaxed'] as const
export const SIDES = ['top', 'right', 'bottom', 'left'] as const
export type Side = (typeof SIDES)[number]

/** Spacing / size value: a preset name, or (sizes open) a number + unit such as `12px`. */
export type Length = string
export type Box = Partial<Record<Side, Length>>

/** EB-15a: custom styling for individual text targets in a block */
export interface TextTargetStyle {
  color?: string // token màu của designSystem
  size?: Responsive<FontSizePreset> // theo thiết bị như fontSize khối
  weight?: 400 | 600 | 700
  align?: Responsive<'left' | 'center' | 'right'>
}

export const CARD_FRAMES = ['default', 'borderless', 'flat', 'none', 'glass'] as const
export type CardFrame = (typeof CARD_FRAMES)[number]

export const CARD_ACCENTS = [
  'none',
  'cycle',
  'deep-navy',
  'bright-magenta',
  'accent-pink',
  'soft-pink',
  'lavender-mist',
  'mint-haze',
  'butter-cream',
  'warm-ivory',
] as const
export type CardAccent = (typeof CARD_ACCENTS)[number]

export interface BlockStyle {
  // Style tab
  background?: string
  textColor?: string
  fontFamily?: string
  fontSize?: Responsive<Length>
  fontWeight?: number
  lineHeight?: string
  textAlign?: Responsive<string>
  radius?: Length
  borderWidth?: number
  borderColor?: string
  shadow?: string
  titleLineHeight?: TitleLineHeightPreset
  eyebrowGap?: EyebrowGapPreset
  emotionGap?: EmotionGapPreset
  cardFrame?: CardFrame
  cardAccent?: CardAccent
  // EB-15a: Individual text target styles
  texts?: Record<string, TextTargetStyle>
  // Advanced tab
  padding?: Responsive<Box>
  margin?: Responsive<Box>
  hideOn?: Device[]
  anchorId?: string
  cssClasses?: string[]
  zIndex?: number
  entrance?: EntrancePreset
  entranceDelay?: EntranceDelay
  customCss?: string
}

export const ENTRANCE_PRESETS = ['none', 'fade-in', 'fade-up', 'zoom-in'] as const
export type EntrancePreset = (typeof ENTRANCE_PRESETS)[number]

export const ENTRANCE_DELAYS = [0, 150, 300, 500] as const
export type EntranceDelay = (typeof ENTRANCE_DELAYS)[number]

export const CSS_CLASS_NAME = /^[a-z][a-z0-9-]{0,39}$/

/** Free-value ranges when `lock.sizes` is open. */
export const LENGTH_RANGES = {
  spacing: { px: [0, 200], rem: [0, 12], '%': [0, 50] },
  margin: { px: [-200, 200], rem: [-12, 12], '%': [-50, 50] },
  fontSize: { px: [10, 96], rem: [0.625, 6], '%': [50, 400] },
  radius: { px: [0, 200], rem: [0, 12], '%': [0, 50] },
} as const
export type LengthKind = keyof typeof LENGTH_RANGES

const FREE_LENGTH = /^(-?\d{1,4}(?:\.\d{1,3})?)(px|rem|%)$/
const ANCHOR_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MAX_BORDER_WIDTH = 16

const includes = <T extends string | number>(list: readonly T[], value: unknown): value is T =>
  (list as readonly unknown[]).includes(value)

export function cleanLength(
  value: unknown,
  kind: LengthKind,
  presets: readonly string[],
  ds: CleanDesignSystem,
): Length | undefined {
  if (typeof value !== 'string') return undefined
  if (presets.includes(value)) return value
  if (!isOpen(ds, 'sizes')) return undefined
  const match = FREE_LENGTH.exec(value)
  if (!match) return undefined
  const unit = match[2] as 'px' | 'rem' | '%'
  const amount = Number(match[1])
  const [min, max] = LENGTH_RANGES[kind][unit]
  return amount >= min && amount <= max ? `${amount}${unit}` : undefined
}

/** A palette token of the design system, or (colors open) a `#RRGGBB` value. */
export function cleanColor(value: unknown, ds: CleanDesignSystem): string | undefined {
  if (typeof value !== 'string') return undefined
  if (ds.colors.some((c) => c.token === value)) return value
  if (isOpen(ds, 'colors') && isValidHex(value)) return value.toUpperCase()
  return undefined
}

function cleanResponsive<T>(
  value: unknown,
  clean: (v: unknown) => T | undefined,
): Responsive<T> | undefined {
  if (!value || typeof value !== 'object') return undefined
  const out: Responsive<T> = {}
  for (const device of DEVICES) {
    const v = clean((value as Record<string, unknown>)[device])
    if (v !== undefined) out[device] = v
  }
  return Object.keys(out).length ? out : undefined
}

function cleanBox(value: unknown, kind: LengthKind, ds: CleanDesignSystem): Box | undefined {
  if (!value || typeof value !== 'object') return undefined
  const out: Box = {}
  for (const side of SIDES) {
    const v = cleanLength((value as Record<string, unknown>)[side], kind, SPACING_PRESETS, ds)
    if (v !== undefined) out[side] = v
  }
  return Object.keys(out).length ? out : undefined
}

export function cleanCssClasses(value: unknown): string[] | undefined {
  let list: string[] = []
  if (Array.isArray(value)) {
    list = value.filter((v): v is string => typeof v === 'string')
  } else if (typeof value === 'string') {
    list = value.trim().split(/\s+/)
  } else {
    return undefined
  }
  const unique = [
    ...new Set(list.map((c) => c.trim().toLowerCase()).filter((c) => CSS_CLASS_NAME.test(c))),
  ].slice(0, 5)
  return unique.length ? unique : undefined
}

export function cleanZIndex(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value >= -10 && value <= 100) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const num = Number(value.trim())
    if (Number.isInteger(num) && num >= -10 && num <= 100) {
      return num
    }
  }
  return undefined
}

export function cleanEntrance(value: unknown): EntrancePreset | undefined {
  return includes(ENTRANCE_PRESETS, value) && value !== 'none' ? value : undefined
}

export function cleanEntranceDelay(value: unknown): EntranceDelay | undefined {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return includes(ENTRANCE_DELAYS, num) && num !== 0 ? (num as EntranceDelay) : undefined
}

export function cleanCustomCss(value: unknown, ds: CleanDesignSystem): string | undefined {
  if (!isOpen(ds, 'customCss')) return undefined
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed && trimmed.length <= 5000 ? trimmed : undefined
}

function cleanTextTargetStyle(raw: unknown, ds: CleanDesignSystem): TextTargetStyle | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const r = raw as Record<string, unknown>

  let color: string | undefined
  if (typeof r.color === 'string') {
    if (ds.colors.some((c) => c.token === r.color)) {
      color = r.color
    } else if (isOpen(ds, 'colors') && isValidHex(r.color)) {
      color = r.color.toUpperCase()
    }
  }

  const size = cleanResponsive(
    r.size,
    (v) => cleanLength(v, 'fontSize', FONT_SIZE_PRESETS, ds) as FontSizePreset | undefined,
  )
  const weight =
    r.weight === 400 || r.weight === 600 || r.weight === 700
      ? (r.weight as 400 | 600 | 700)
      : undefined
  const align = cleanResponsive(r.align, (v) =>
    v === 'left' || v === 'center' || v === 'right' ? v : undefined,
  )

  if (!color && !size && !weight && !align) return undefined
  return {
    ...(color ? { color } : {}),
    ...(size ? { size } : {}),
    ...(weight ? { weight } : {}),
    ...(align ? { align } : {}),
  }
}

export function cleanTexts(
  raw: unknown,
  ds: CleanDesignSystem,
  blockType?: string,
): Record<string, TextTargetStyle> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  if (!blockType) return undefined
  const targetDefs = TEXT_TARGETS[blockType]
  if (!targetDefs || !targetDefs.length) return undefined
  const allowedKeys = new Set(targetDefs.map((d) => d.key))

  const entries: [string, TextTargetStyle][] = []
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!allowedKeys.has(key)) continue
    const cleaned = cleanTextTargetStyle(val, ds)
    if (cleaned) {
      entries.push([key, cleaned])
    }
  }

  const limited = entries.slice(0, 20)
  return limited.length ? Object.fromEntries(limited) : undefined
}

/**
 * Keeps only valid values that the current brand locks allow. Returns null when nothing is
 * left, so blocks without a meaningful `_style` render exactly as before.
 */
export function sanitizeBlockStyle(
  raw: unknown,
  ds: CleanDesignSystem,
  blockType?: string,
): BlockStyle | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const style: BlockStyle = {
    background: cleanColor(r.background, ds),
    textColor: cleanColor(r.textColor, ds),
    fontFamily: isOpen(ds, 'fonts') && isDesignFont(r.fontFamily) ? r.fontFamily : undefined,
    fontSize: cleanResponsive(r.fontSize, (v) => cleanLength(v, 'fontSize', FONT_SIZE_PRESETS, ds)),
    fontWeight: includes(FONT_WEIGHTS, r.fontWeight) ? r.fontWeight : undefined,
    lineHeight: includes(LINE_HEIGHTS, r.lineHeight) ? r.lineHeight : undefined,
    textAlign: cleanResponsive(r.textAlign, (v) => (includes(TEXT_ALIGNS, v) ? v : undefined)),
    radius: cleanLength(r.radius, 'radius', RADIUS_PRESETS, ds),
    borderWidth:
      typeof r.borderWidth === 'number' &&
      Number.isInteger(r.borderWidth) &&
      r.borderWidth >= 0 &&
      r.borderWidth <= MAX_BORDER_WIDTH
        ? r.borderWidth
        : undefined,
    borderColor: cleanColor(r.borderColor, ds),
    shadow: includes(SHADOWS, r.shadow) ? r.shadow : undefined,
    titleLineHeight: cleanTitleLineHeight(r.titleLineHeight),
    eyebrowGap: cleanEyebrowGap(r.eyebrowGap),
    emotionGap: cleanEmotionGap(r.emotionGap),
    cardFrame:
      includes(CARD_FRAMES, r.cardFrame) && r.cardFrame !== 'default'
        ? (r.cardFrame as CardFrame)
        : undefined,
    cardAccent:
      includes(CARD_ACCENTS, r.cardAccent) && r.cardAccent !== 'none'
        ? (r.cardAccent as CardAccent)
        : undefined,
    texts: cleanTexts(r.texts, ds, blockType),
    padding: cleanResponsive(r.padding, (v) => cleanBox(v, 'spacing', ds)),
    margin: cleanResponsive(r.margin, (v) => cleanBox(v, 'margin', ds)),
    hideOn: Array.isArray(r.hideOn)
      ? [...new Set(r.hideOn.filter((d): d is Device => includes(DEVICES, d)))]
      : undefined,
    anchorId:
      typeof r.anchorId === 'string' && r.anchorId.length <= 64 && ANCHOR_ID.test(r.anchorId)
        ? r.anchorId
        : undefined,
    cssClasses: cleanCssClasses(r.cssClasses),
    zIndex: cleanZIndex(r.zIndex),
    entrance: cleanEntrance(r.entrance),
    entranceDelay: cleanEntranceDelay(r.entranceDelay),
    customCss: cleanCustomCss(r.customCss, ds),
  }
  if (style.hideOn && style.hideOn.length === 0) style.hideOn = undefined
  const entries = Object.entries(style).filter(([, v]) => v !== undefined)
  return entries.length ? (Object.fromEntries(entries) as BlockStyle) : null
}

/** Value for a device after inheritance: mobile ← tablet ← desktop. */
export function resolveDevice<T>(value: Responsive<T> | undefined, device: Device): T | undefined {
  if (!value) return undefined
  if (device === 'desktop') return value.desktop
  if (device === 'tablet') return value.tablet ?? value.desktop
  return value.mobile ?? value.tablet ?? value.desktop
}

/** Anchor id check that does not depend on the brand locks (used while rendering). */
export function cleanAnchorId(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 64 && ANCHOR_ID.test(value)
    ? value
    : undefined
}

/** True when a raw `_style` object has at least one key (decides whether a block gets a wrapper). */
export function hasStyleKeys(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw && typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw).length)
}
