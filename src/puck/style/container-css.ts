/**
 * EB-05: CSS for the Container block. Input comes from `sanitizeContainer`, so only enum values,
 * validated lengths, palette tokens / hex colours and media URLs reach the strings built here.
 *
 * - The background (image or gradient) goes on the outer element (`[data-eb-id]`) so it covers the
 *   full width even when the content is boxed.
 * - The flex layout goes on the slot element (`.eb-c-<id>`), whose direct children are the blocks
 *   dropped into the container. Per-device values only emit a media query when they differ from
 *   the next larger device.
 */
import { cssColor, isSafeBlockId, SPACING_CSS, STYLE_ATTR } from './css-shared'
import { DEVICE_MEDIA, resolveDevice, type Device } from './style-schema'
import {
  cleanImageUrl,
  type ContainerAlign,
  type ContainerBackground,
  type ContainerJustify,
  type ContainerLayout,
} from './container-schema'

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

/** Class of the slot element that holds the container's blocks. `id` must be a safe block id. */
export const containerItemsClass = (id: string) => `eb-c-${id}`

function layoutDeclarations(layout: ContainerLayout | undefined, device: Device): string[] {
  const direction = resolveDevice(layout?.direction, device) ?? 'column'
  const justify = resolveDevice(layout?.justify, device)
  const align = resolveDevice(layout?.align, device)
  const gap = resolveDevice(layout?.gap, device)
  const wrap = resolveDevice(layout?.wrap, device)
  return [
    `flex-direction:${direction}`,
    ...(justify ? [`justify-content:${JUSTIFY_CSS[justify]}`] : []),
    ...(align ? [`align-items:${ALIGN_CSS[align]}`] : []),
    ...(gap ? [`gap:${SPACING_CSS[gap] ?? gap}`] : []),
    ...(wrap ? [`flex-wrap:${wrap}`] : []),
  ]
}

/** URL inside `url("…")`: already filtered by `cleanImageUrl`, encoded again as a second guard. */
// REVIEW-REQUIRED: the only place a user-chosen URL is written into CSS.
/**
 * QA PK-18f: media URLs arrive already percent-encoded by Payload ("TDCX%20%283B%29.jpg").
 * encodeURI on that turned "%20" into "%2520" and the file 500'd, so every background whose file
 * name had a space broke. Decode first, then encode exactly once; ( ) ' " \ always escaped.
 */
function encodeOnce(url: string): string {
  try {
    return encodeURI(decodeURI(url))
  } catch {
    // Malformed escape sequence: keep the sanitized value as is (cleanImageUrl already ran).
    return url
  }
}

export const cssUrl = (url: string) =>
  `url("${encodeOnce(url).replace(/["'()\\]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}")`

function backgroundDeclarations(background: ContainerBackground | undefined): string[] {
  if (background?.type === 'image' && background.imageUrl) {
    const hasOverlay =
      background.overlay && background.overlayOpacity && background.overlayOpacity > 0
    return [
      ...(hasOverlay ? ['position:relative'] : []),
      `background-image:${cssUrl(background.imageUrl)}`,
      `background-size:${background.size ?? 'cover'}`,
      `background-position:${background.position ?? 'center'}`,
      'background-repeat:no-repeat',
    ]
  }
  if (background?.type === 'gradient' && background.from && background.to) {
    // REVIEW-REQUIRED: colours are palette tokens or validated hex values (`cleanColor`).
    const angle = background.angle ?? 180
    return [
      `background-image:linear-gradient(${angle}deg,${cssColor(background.from)},${cssColor(background.to)})`,
    ]
  }
  return []
}

export function containerCss(
  id: string,
  layout?: ContainerLayout,
  background?: ContainerBackground,
): string {
  if (!isSafeBlockId(id)) return ''
  const rules: string[] = []

  const bg = backgroundDeclarations(background)
  if (bg.length) rules.push(`[${STYLE_ATTR}="${id}"]{${bg.join(';')}}`)

  // PK-18: Container overlay support
  if (
    background?.type === 'image' &&
    background.imageUrl &&
    background.overlay &&
    background.overlayOpacity &&
    background.overlayOpacity > 0
  ) {
    const opacityVal = (background.overlayOpacity / 100).toFixed(2).replace(/\.?0+$/, '')
    rules.push(
      `[${STYLE_ATTR}="${id}"]::before{content:"";position:absolute;inset:0;background:${cssColor(background.overlay)};opacity:${opacityVal};pointer-events:none;z-index:0}`,
    )
  }

  const items = `.${containerItemsClass(id)}`
  const desktop = layoutDeclarations(layout, 'desktop')
  rules.push(`${items}{${desktop.join(';')}}`)

  let previous = desktop
  for (const device of ['tablet', 'mobile'] as const) {
    const current = layoutDeclarations(layout, device)
    const changed = current.filter((decl) => !previous.includes(decl))
    // A property that disappears falls back to the larger device's value, which is what we want.
    if (changed.length) rules.push(`@media ${DEVICE_MEDIA[device]}{${items}{${changed.join(';')}}}`)
    previous = current
  }
  return rules.join('')
}
