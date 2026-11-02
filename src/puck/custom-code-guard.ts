/**
 * EB-09: Custom code permission guard for server actions.
 *
 * REVIEW-REQUIRED:
 * Compares incoming Puck Data with the currently saved document in Payload to detect any
 * changes to custom CSS (root or block) or HtmlWidget HTML. Non-owner users (editors)
 * are forbidden from modifying or introducing custom CSS / HTML.
 */
import { APIError, type CollectionBeforeChangeHook } from 'payload'
import { isOwnerUser } from '@/lib/auth/access'
import { vi } from '@/lib/i18n/vi'

export type CustomCodeMap = {
  rootCss: string
  blockCss: Map<string, string>
  widgetHtml: Map<string, string>
}

type CodeKind = 'blockCss' | 'widgetHtml'

/**
 * Visits every custom CSS / HtmlWidget string in Puck data: content, zones, slots, and array
 * fields whose items hold slots (Tabs / Accordion `items[].content`, EB-06b) or any other
 * nested object. EB-09c: the first version only followed arrays of blocks, so an HtmlWidget
 * inside a Tabs item was never compared.
 */
function visitCustomCode(
  data: unknown,
  visit: (kind: CodeKind, id: string, value: string) => void,
) {
  const seen = new Set<object>()

  function walk(value: unknown) {
    if (!value || typeof value !== 'object' || seen.has(value)) return
    seen.add(value)
    if (Array.isArray(value)) {
      for (const el of value) walk(el)
      return
    }
    const node = value as { type?: unknown; props?: unknown }
    if (typeof node.type === 'string' && node.props && typeof node.props === 'object') {
      const props = node.props as Record<string, unknown>
      const id = typeof props.id === 'string' ? props.id : ''
      const style = props._style
      if (style && typeof style === 'object') {
        const css = (style as Record<string, unknown>).customCss
        if (typeof css === 'string' && css.trim()) visit('blockCss', id, css.trim())
      }
      if (node.type === 'HtmlWidget' && typeof props.html === 'string' && props.html.trim()) {
        visit('widgetHtml', id, props.html.trim())
      }
      for (const child of Object.values(props)) walk(child)
      return
    }
    for (const child of Object.values(value)) walk(child)
  }

  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    walk(d.content)
    walk(d.zones)
  }
}

function rootCssOf(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const d = data as Record<string, unknown>
  const rootProps = (
    d.root && typeof d.root === 'object' ? (d.root as Record<string, unknown>).props : undefined
  ) as Record<string, unknown> | undefined
  const css =
    (typeof rootProps?.customCss === 'string' ? rootProps.customCss : '') ||
    (typeof d.customCss === 'string' ? d.customCss : '')
  return css.trim()
}

/**
 * Traverses a Puck Data object and extracts all custom CSS and HtmlWidget HTML strings.
 */
export function extractCustomCode(data: unknown): CustomCodeMap {
  const blockCss = new Map<string, string>()
  const widgetHtml = new Map<string, string>()
  visitCustomCode(data, (kind, id, value) => {
    ;(kind === 'blockCss' ? blockCss : widgetHtml).set(id, value)
  })
  return { rootCss: rootCssOf(data), blockCss, widgetHtml }
}

/** Every custom code string with its kind and block id, sorted (duplicates kept). */
function codeEntries(data: unknown): string[] {
  const entries = [`root\u0000\u0000${rootCssOf(data)}`]
  visitCustomCode(data, (kind, id, value) => entries.push(`${kind}\u0000${id}\u0000${value}`))
  return entries.sort()
}

/**
 * Checks whether incoming Puck Data modifies any custom CSS (page root or block level)
 * or any HtmlWidget HTML content compared to saved Puck Data: added, changed, removed, or
 * repeated under a duplicated block id (EB-09c: comparing one value per id let a second block
 * with the same id carry new HTML).
 *
 * REVIEW-REQUIRED:
 */
export function hasCustomCodeChanged(savedData: unknown, incomingData: unknown): boolean {
  const saved = codeEntries(savedData)
  const incoming = codeEntries(incomingData)
  return saved.length !== incoming.length || saved.some((entry, i) => entry !== incoming[i])
}

/** True when the data carries any custom CSS or HtmlWidget HTML. */
export function hasCustomCode(data: unknown): boolean {
  const code = extractCustomCode(data)
  return Boolean(code.rootCss) || code.blockCss.size > 0 || code.widgetHtml.size > 0
}

/**
 * REVIEW-REQUIRED: EB-09c – the same rule at the collection level (`pages`, `blockTemplates`),
 * so it also holds for the REST / GraphQL API, Payload admin forms and version restore, not
 * only for the builder's server actions. Calls without a user (seed, migrations, Local API
 * system calls) are not limited.
 */
export const guardCustomCodeHook: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (!req.user || isOwnerUser(req.user)) return data
  if (!data || data.puckData === undefined) return data
  if (hasCustomCodeChanged(originalDoc?.puckData, data.puckData)) {
    throw new APIError(vi.eb09.onlyOwnerAllowed, 403)
  }
  return data
}
