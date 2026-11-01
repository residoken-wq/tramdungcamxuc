/**
 * EB-05: Container flexbox schema and sanitization rules.
 * Pure and client-safe. All values coming from the editor are untrusted user input:
 * `sanitizeContainer` drops anything malformed or outside brand locks.
 */
import type { CleanDesignSystem } from '@/lib/design/design-system'
import {
  cleanColor,
  cleanLength,
  DEVICES,
  SPACING_PRESETS,
  type Length,
  type Responsive,
} from './style-schema'

export const CONTAINER_DIRECTIONS = ['row', 'column', 'row-reverse', 'column-reverse'] as const
export type ContainerDirection = (typeof CONTAINER_DIRECTIONS)[number]

export const CONTAINER_JUSTIFY = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const
export type ContainerJustify = (typeof CONTAINER_JUSTIFY)[number]

export const CONTAINER_ALIGN = ['start', 'center', 'end', 'stretch'] as const
export type ContainerAlign = (typeof CONTAINER_ALIGN)[number]

export const CONTAINER_WRAP = ['nowrap', 'wrap'] as const
export type ContainerWrap = (typeof CONTAINER_WRAP)[number]

export const CONTAINER_WIDTH = ['boxed', 'full'] as const
export type ContainerWidth = (typeof CONTAINER_WIDTH)[number]

export const CONTAINER_CONTENT_WIDTH = ['sm', 'md', 'lg', 'xl'] as const
export type ContainerContentWidth = (typeof CONTAINER_CONTENT_WIDTH)[number]

export const CONTAINER_MIN_HEIGHT = ['none', 'sm', 'md', 'lg', 'screen'] as const
export type ContainerMinHeight = (typeof CONTAINER_MIN_HEIGHT)[number]

export const MIN_HEIGHT_CLASSES: Record<ContainerMinHeight, string> = {
  none: '',
  sm: 'min-h-[200px]',
  md: 'min-h-[350px]',
  lg: 'min-h-[500px]',
  screen: 'min-h-screen',
}

export const CONTENT_WIDTH_CLASSES: Record<ContainerContentWidth, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
}

export const CONTAINER_TAG = ['div', 'section'] as const
export type ContainerTag = (typeof CONTAINER_TAG)[number]

export const CONTAINER_BG_TYPES = ['none', 'image', 'gradient'] as const
export type ContainerBgType = (typeof CONTAINER_BG_TYPES)[number]

export const CONTAINER_BG_SIZES = ['cover', 'contain'] as const
export type ContainerBgSize = (typeof CONTAINER_BG_SIZES)[number]

export const CONTAINER_BG_POSITIONS = [
  'top left',
  'top center',
  'top right',
  'center left',
  'center',
  'center right',
  'bottom left',
  'bottom center',
  'bottom right',
] as const
export type ContainerBgPosition = (typeof CONTAINER_BG_POSITIONS)[number]

export const CONTAINER_GRADIENT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const
export type ContainerGradientAngle = (typeof CONTAINER_GRADIENT_ANGLES)[number]

export interface ContainerLayout {
  direction?: Responsive<ContainerDirection>
  justify?: Responsive<ContainerJustify>
  align?: Responsive<ContainerAlign>
  gap?: Responsive<Length>
  wrap?: Responsive<ContainerWrap>
}

export interface ContainerBackground {
  type: ContainerBgType
  // Image mode
  mediaId?: string
  imageUrl?: string
  imageAlt?: string
  size?: ContainerBgSize
  position?: ContainerBgPosition
  // Gradient mode
  from?: string
  to?: string
  angle?: ContainerGradientAngle
}

export interface ContainerProps {
  version?: number
  items?: unknown
  tag?: ContainerTag
  width?: ContainerWidth
  contentWidth?: ContainerContentWidth
  minHeight?: ContainerMinHeight
  layout?: ContainerLayout
  background?: ContainerBackground
  _style?: Record<string, unknown>
}

const includes = <T extends string | number>(list: readonly T[], value: unknown): value is T =>
  (list as readonly unknown[]).includes(value)

/**
 * REVIEW-REQUIRED: URL sanitization for background images to prevent CSS injection
 * (closing url string, breaking style tags, or executing javascript: pseudo-protocols).
 * Only relative media paths `/api/media/file/...` or secure HTTP/HTTPS origins without quotes/parens.
 */
export function cleanImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  // Forbid characters that break out of CSS `url("...")` or trigger injections
  if (/["'()\\;\r\n]/.test(value)) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^javascript:/i.test(trimmed)) return undefined
  if (/^data:/i.test(trimmed)) return undefined

  // Standard Payload local media path
  if (trimmed.startsWith('/api/media/file/')) return trimmed

  // In case of full URL, only allow http / https with safe pathname
  try {
    const parsed = new URL(trimmed, 'http://localhost')
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      if (parsed.pathname.startsWith('/api/media/file/')) {
        return trimmed
      }
    }
  } catch {
    return undefined
  }

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

/**
 * Pure sanitizer for Container layout and background props.
 * Strictly respects designSystem lock switches for gap sizes and gradient colors.
 */
export function sanitizeContainer(
  raw: unknown,
  ds: CleanDesignSystem,
): {
  tag: ContainerTag
  width: ContainerWidth
  contentWidth: ContainerContentWidth
  minHeight: ContainerMinHeight
  layout: ContainerLayout
  background: ContainerBackground
} {
  const r = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<
    string,
    unknown
  >
  const rawLayout = (r.layout && typeof r.layout === 'object' ? r.layout : {}) as Record<
    string,
    unknown
  >
  const rawBg = (r.background && typeof r.background === 'object' ? r.background : {}) as Record<
    string,
    unknown
  >

  const tag: ContainerTag = includes(CONTAINER_TAG, r.tag) ? r.tag : 'div'
  const width: ContainerWidth = includes(CONTAINER_WIDTH, r.width) ? r.width : 'boxed'
  const contentWidth: ContainerContentWidth = includes(CONTAINER_CONTENT_WIDTH, r.contentWidth)
    ? r.contentWidth
    : 'lg'
  const minHeight: ContainerMinHeight = includes(CONTAINER_MIN_HEIGHT, r.minHeight)
    ? r.minHeight
    : 'none'

  const layout: ContainerLayout = {
    direction: cleanResponsive(rawLayout.direction, (v) =>
      includes(CONTAINER_DIRECTIONS, v) ? v : undefined,
    ),
    justify: cleanResponsive(rawLayout.justify, (v) =>
      includes(CONTAINER_JUSTIFY, v) ? v : undefined,
    ),
    align: cleanResponsive(rawLayout.align, (v) => (includes(CONTAINER_ALIGN, v) ? v : undefined)),
    gap: cleanResponsive(rawLayout.gap, (v) => cleanLength(v, 'spacing', SPACING_PRESETS, ds)),
    wrap: cleanResponsive(rawLayout.wrap, (v) => (includes(CONTAINER_WRAP, v) ? v : undefined)),
  }

  // Fallback defaults for desktop direction and gap if not defined
  if (!layout.direction?.desktop) {
    layout.direction = { desktop: 'column', ...layout.direction }
  }

  const bgType: ContainerBgType = includes(CONTAINER_BG_TYPES, rawBg.type) ? rawBg.type : 'none'
  const background: ContainerBackground = { type: bgType }

  if (bgType === 'image') {
    background.mediaId =
      typeof rawBg.mediaId === 'string' && rawBg.mediaId.trim().length > 0
        ? rawBg.mediaId.trim()
        : typeof rawBg.mediaId === 'number'
          ? String(rawBg.mediaId)
          : undefined
    background.imageUrl = cleanImageUrl(rawBg.imageUrl)
    background.imageAlt =
      typeof rawBg.imageAlt === 'string' ? rawBg.imageAlt.slice(0, 200).trim() : undefined
    background.size = includes(CONTAINER_BG_SIZES, rawBg.size) ? rawBg.size : 'cover'
    background.position = includes(CONTAINER_BG_POSITIONS, rawBg.position)
      ? rawBg.position
      : 'center'
  } else if (bgType === 'gradient') {
    background.from = cleanColor(rawBg.from, ds)
    background.to = cleanColor(rawBg.to, ds)
    background.angle = includes(CONTAINER_GRADIENT_ANGLES, rawBg.angle) ? rawBg.angle : 180
  }

  return { tag, width, contentWidth, minHeight, layout, background }
}
