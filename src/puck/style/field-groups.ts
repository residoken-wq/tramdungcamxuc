/**
 * EB-04b: which tab of the right-hand panel a block field belongs to. Only top-level fields are
 * sorted; fields nested in arrays / objects stay with their parent.
 */
export type PanelTab = 'content' | 'style' | 'advanced'

export const STYLE_FIELD = '_style'
export const LABEL_FIELD = '_label'

/** Existing format fields of the blocks (PK-01 / PK-10) that move to the Style tab. */
const STYLE_NAMES = new Set(['align', 'padding', 'bgColor', 'variant', 'tone'])
const STYLE_SUFFIX = /(Color|Size|Style)$/

export function isTopLevelField(name: string): boolean {
  return !/[.[]/.test(name)
}

/** Tab of a top-level field; `_style` returns null because it draws both Style and Advanced. */
export function fieldTab(name: string): PanelTab | null {
  if (name === STYLE_FIELD) return null
  if (name === LABEL_FIELD) return 'advanced'
  if (STYLE_NAMES.has(name) || STYLE_SUFFIX.test(name)) return 'style'
  return 'content'
}

/** Whether a field rendered by Puck should show while `tab` is active. */
export function isFieldVisible(name: string, tab: PanelTab): boolean {
  if (!isTopLevelField(name)) return true
  const own = fieldTab(name)
  return own === null ? tab !== 'content' : own === tab
}
