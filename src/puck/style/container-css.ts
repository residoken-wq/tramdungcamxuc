/**
 * EB-05: CSS generation for Container flexbox and advanced background.
 * Output is clean, minified CSS with media queries only when child devices differ from their parent.
 */
import { isSafeBlockId, STYLE_ATTR } from './style-css'
import { DEVICE_MEDIA, resolveDevice, type Length } from './style-schema'
import type {
  ContainerAlign,
  ContainerBackground,
  ContainerDirection,
  ContainerJustify,
  ContainerLayout,
} from './container-schema'

const SPACING: Record<string, string> = {
  none: '0',
  sm: 'var(--space-breath-sm, 16px)',
  md: 'var(--space-breath-md, 24px)',
  lg: 'var(--space-breath-lg, 32px)',
  xl: 'calc(var(--space-breath-lg, 32px) * 2)',
}

const JUSTIFY_CSS: Record<ContainerJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
}

const ALIGN_CSS: Record<ContainerAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
}

const gapValue = (val: Length) => SPACING[val] ?? val
const colorValue = (colorStr: string) =>
  colorStr.startsWith('#') ? colorStr : `rgb(var(--color-${colorStr}-rgb))`

/**
 * Builds CSS for a Container block: flex layout + responsive overrides + background.
 * Returns empty string if id is unsafe or no styles apply.
 */
export function containerCss(
  id: string,
  layout?: ContainerLayout,
  background?: ContainerBackground,
): string {
  if (!isSafeBlockId(id)) return ''
  const selector = `[${STYLE_ATTR}="${id}"]`

  // Desktop values (base rule)
  const desktopDir: ContainerDirection = resolveDevice(layout?.direction, 'desktop') || 'column'
  const desktopJustify = resolveDevice(layout?.justify, 'desktop')
  const desktopAlign = resolveDevice(layout?.align, 'desktop')
  const desktopGap = resolveDevice(layout?.gap, 'desktop')
  const desktopWrap = resolveDevice(layout?.wrap, 'desktop')

  const baseDecls: string[] = ['display:flex', `flex-direction:${desktopDir}`]
  if (desktopJustify) baseDecls.push(`justify-content:${JUSTIFY_CSS[desktopJustify]}`)
  if (desktopAlign) baseDecls.push(`align-items:${ALIGN_CSS[desktopAlign]}`)
  if (desktopGap) baseDecls.push(`gap:${gapValue(desktopGap)}`)
  if (desktopWrap) baseDecls.push(`flex-wrap:${desktopWrap}`)

  // Background rules
  if (background?.type === 'image' && background.imageUrl) {
    // REVIEW-REQUIRED: Build safe background-image url string
    const safeUrl = encodeURI(background.imageUrl).replace(/["'();\\]/g, '')
    baseDecls.push(`background-image:url("${safeUrl}")`)
    baseDecls.push(`background-size:${background.size || 'cover'}`)
    baseDecls.push(`background-position:${background.position || 'center'}`)
    baseDecls.push('background-repeat:no-repeat')
  } else if (background?.type === 'gradient' && background.from && background.to) {
    // REVIEW-REQUIRED: Build safe linear-gradient string
    const angle = background.angle ?? 180
    const fromColor = colorValue(background.from)
    const toColor = colorValue(background.to)
    baseDecls.push(`background-image:linear-gradient(${angle}deg, ${fromColor}, ${toColor})`)
  }

  const rules: string[] = []
  if (baseDecls.length) rules.push(`${selector}{${baseDecls.join(';')}}`)

  // Tablet overrides (only when different from desktop)
  const tabletDir = resolveDevice(layout?.direction, 'tablet')
  const tabletJustify = resolveDevice(layout?.justify, 'tablet')
  const tabletAlign = resolveDevice(layout?.align, 'tablet')
  const tabletGap = resolveDevice(layout?.gap, 'tablet')
  const tabletWrap = resolveDevice(layout?.wrap, 'tablet')

  const tabletDecls: string[] = []
  if (tabletDir && tabletDir !== desktopDir) tabletDecls.push(`flex-direction:${tabletDir}`)
  if (tabletJustify && tabletJustify !== desktopJustify) {
    tabletDecls.push(`justify-content:${JUSTIFY_CSS[tabletJustify]}`)
  }
  if (tabletAlign && tabletAlign !== desktopAlign) {
    tabletDecls.push(`align-items:${ALIGN_CSS[tabletAlign]}`)
  }
  if (tabletGap && tabletGap !== desktopGap) {
    tabletDecls.push(`gap:${gapValue(tabletGap)}`)
  }
  if (tabletWrap && tabletWrap !== desktopWrap) {
    tabletDecls.push(`flex-wrap:${tabletWrap}`)
  }

  if (tabletDecls.length && DEVICE_MEDIA.tablet) {
    rules.push(`@media ${DEVICE_MEDIA.tablet}{${selector}{${tabletDecls.join(';')}}}`)
  }

  // Mobile overrides (only when different from effective tablet value)
  const effTabletDir = tabletDir ?? desktopDir
  const effTabletJustify = tabletJustify ?? desktopJustify
  const effTabletAlign = tabletAlign ?? desktopAlign
  const effTabletGap = tabletGap ?? desktopGap
  const effTabletWrap = tabletWrap ?? desktopWrap

  const mobileDir = resolveDevice(layout?.direction, 'mobile')
  const mobileJustify = resolveDevice(layout?.justify, 'mobile')
  const mobileAlign = resolveDevice(layout?.align, 'mobile')
  const mobileGap = resolveDevice(layout?.gap, 'mobile')
  const mobileWrap = resolveDevice(layout?.wrap, 'mobile')

  const mobileDecls: string[] = []
  if (mobileDir && mobileDir !== effTabletDir) mobileDecls.push(`flex-direction:${mobileDir}`)
  if (mobileJustify && mobileJustify !== effTabletJustify) {
    mobileDecls.push(`justify-content:${JUSTIFY_CSS[mobileJustify]}`)
  }
  if (mobileAlign && mobileAlign !== effTabletAlign) {
    mobileDecls.push(`align-items:${ALIGN_CSS[mobileAlign]}`)
  }
  if (mobileGap && mobileGap !== effTabletGap) {
    mobileDecls.push(`gap:${gapValue(mobileGap)}`)
  }
  if (mobileWrap && mobileWrap !== effTabletWrap) {
    mobileDecls.push(`flex-wrap:${mobileWrap}`)
  }

  if (mobileDecls.length && DEVICE_MEDIA.mobile) {
    rules.push(`@media ${DEVICE_MEDIA.mobile}{${selector}{${mobileDecls.join(';')}}}`)
  }

  return rules.join('')
}
