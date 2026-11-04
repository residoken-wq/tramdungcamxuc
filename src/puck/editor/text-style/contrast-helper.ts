import { contrastRatio, isValidHex } from '@/lib/design/design-system'
import { BRAND_COLORS_HEX, type BrandColorToken } from '@/lib/brand/tokens'
import type { ComponentData } from '@puckeditor/core'
import type { BlockStyle } from '@/puck/style/style-schema'

export function getBlockBackground(item: ComponentData | null | undefined): string | null {
  if (!item?.props) return null
  const props = item.props as Record<string, unknown>
  const style = props._style as BlockStyle | undefined
  if (style?.background) {
    return style.background
  }
  if (typeof props.bgColor === 'string' && props.bgColor) {
    return props.bgColor
  }
  // For Hero blocks in backdrop mode:
  if (props.layout === 'backdrop') {
    return props.overlayTone === 'light' ? 'warm-ivory' : 'deep-navy'
  }
  return 'warm-ivory'
}

export function getContrastInfo(
  textToken: string,
  bgTokenOrHex: string | null | undefined,
  isLargeText: boolean,
  dsColors?: Array<{ token: string; hex: string }>,
): { allowed: boolean; ratio: number | null; isUnknownBg: boolean } {
  if (!bgTokenOrHex) {
    return { allowed: true, ratio: null, isUnknownBg: true }
  }
  if (bgTokenOrHex === 'image' || bgTokenOrHex === 'gradient') {
    return { allowed: true, ratio: null, isUnknownBg: true }
  }

  const textHex =
    dsColors?.find((c) => c.token === textToken)?.hex ||
    BRAND_COLORS_HEX[textToken as BrandColorToken] ||
    (isValidHex(textToken) ? textToken : null)

  const bgHex =
    dsColors?.find((c) => c.token === bgTokenOrHex)?.hex ||
    BRAND_COLORS_HEX[bgTokenOrHex as BrandColorToken] ||
    (isValidHex(bgTokenOrHex) ? bgTokenOrHex : null)

  if (!textHex || !bgHex) {
    return { allowed: true, ratio: null, isUnknownBg: true }
  }

  const ratio = contrastRatio(textHex, bgHex)
  if (ratio === null) {
    return { allowed: true, ratio: null, isUnknownBg: true }
  }

  const threshold = isLargeText ? 3.0 : 4.5
  return { allowed: ratio >= threshold, ratio, isUnknownBg: false }
}
