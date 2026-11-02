/**
 * EB-09: Custom code permission guard for server actions.
 *
 * REVIEW-REQUIRED:
 * Compares incoming Puck Data with the currently saved document in Payload to detect any
 * changes to custom CSS (root or block) or HtmlWidget HTML. Non-owner users (editors)
 * are forbidden from modifying or introducing custom CSS / HTML.
 */

export type CustomCodeMap = {
  rootCss: string
  blockCss: Map<string, string>
  widgetHtml: Map<string, string>
}

/**
 * Traverses a Puck Data object and extracts all custom CSS and HtmlWidget HTML strings.
 */
export function extractCustomCode(data: unknown): CustomCodeMap {
  const blockCss = new Map<string, string>()
  const widgetHtml = new Map<string, string>()

  if (!data || typeof data !== 'object') {
    return { rootCss: '', blockCss, widgetHtml }
  }

  const d = data as Record<string, unknown>
  const rootProps = (
    d.root && typeof d.root === 'object' ? (d.root as Record<string, unknown>).props : undefined
  ) as Record<string, unknown> | undefined

  const rootCss =
    (typeof rootProps?.customCss === 'string' ? rootProps.customCss : '') ||
    (typeof d.customCss === 'string' ? d.customCss : '')

  function visitItem(item: unknown) {
    if (!item || typeof item !== 'object') return
    const it = item as { type?: unknown; props?: Record<string, unknown> }
    const id = typeof it.props?.id === 'string' ? it.props.id : undefined

    if (id) {
      const style = it.props?._style
      if (style && typeof style === 'object') {
        const css = (style as Record<string, unknown>).customCss
        if (typeof css === 'string' && css.trim()) {
          blockCss.set(id, css.trim())
        }
      }

      if (it.type === 'HtmlWidget') {
        const html = it.props?.html
        if (typeof html === 'string' && html.trim()) {
          widgetHtml.set(id, html.trim())
        }
      }
    }

    if (it.props && typeof it.props === 'object') {
      for (const val of Object.values(it.props)) {
        if (Array.isArray(val)) {
          for (const child of val) {
            visitItem(child)
          }
        }
      }
    }
  }

  if (Array.isArray(d.content)) {
    for (const item of d.content) visitItem(item)
  }

  if (d.zones && typeof d.zones === 'object') {
    for (const zoneItems of Object.values(d.zones as Record<string, unknown>)) {
      if (Array.isArray(zoneItems)) {
        for (const item of zoneItems) visitItem(item)
      }
    }
  }

  return { rootCss: rootCss.trim(), blockCss, widgetHtml }
}

/**
 * Checks whether incoming Puck Data modifies any custom CSS (page root or block level)
 * or any HtmlWidget HTML content compared to saved Puck Data.
 *
 * REVIEW-REQUIRED:
 */
export function hasCustomCodeChanged(savedData: unknown, incomingData: unknown): boolean {
  const saved = extractCustomCode(savedData)
  const incoming = extractCustomCode(incomingData)

  // 1. Root customCss changed?
  if (saved.rootCss !== incoming.rootCss) {
    return true
  }

  // 2. Block customCss changed or added?
  for (const [id, incomingCss] of incoming.blockCss.entries()) {
    const savedCss = saved.blockCss.get(id) ?? ''
    if (incomingCss !== savedCss) {
      return true
    }
  }
  for (const [id, savedCss] of saved.blockCss.entries()) {
    const incomingCss = incoming.blockCss.get(id) ?? ''
    if (savedCss !== incomingCss) {
      return true
    }
  }

  // 3. HtmlWidget html changed or added?
  for (const [id, incomingHtml] of incoming.widgetHtml.entries()) {
    const savedHtml = saved.widgetHtml.get(id) ?? ''
    if (incomingHtml !== savedHtml) {
      return true
    }
  }
  for (const [id, savedHtml] of saved.widgetHtml.entries()) {
    const incomingHtml = incoming.widgetHtml.get(id) ?? ''
    if (savedHtml !== incomingHtml) {
      return true
    }
  }

  return false
}
