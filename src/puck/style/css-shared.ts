/**
 * EB-04 / EB-05: pieces shared by the block-style CSS (`style-css.ts`) and the Container CSS
 * (`container-css.ts`). Kept in their own module so the two builders do not import each other.
 */

/** Attribute a styled block's wrapper carries; the CSS selects on it. */
export const STYLE_ATTR = 'data-eb-id'
/**
 * EB-15bc: marks the root of a card (IconCard, Step, Stat, PackageCard…). The tab "Kiểu" text
 * alignment of any ancestor block is also applied to these roots, because a card sets its own
 * `text-left` / `items-start` and would otherwise ignore the inherited value.
 */
export const CARD_ATTR = 'data-eb-card'
/** PK-18: marks inner section elements whose background should be cleared when parent has a background image */
export const SECTION_ATTR = 'data-eb-section'
const SAFE_ID = /^[A-Za-z0-9_-]{1,100}$/

export const isSafeBlockId = (id: unknown): id is string =>
  typeof id === 'string' && SAFE_ID.test(id)

/** Spacing presets (padding, margin, gap) as CSS values. */
export const SPACING_CSS: Record<string, string> = {
  none: '0',
  sm: 'var(--space-breath-sm, 16px)',
  md: 'var(--space-breath-md, 24px)',
  lg: 'var(--space-breath-lg, 32px)',
  xl: 'calc(var(--space-breath-lg, 32px) * 2)',
}

/** A sanitized colour: a palette token, or a hex value when colours are open. */
export const cssColor = (value: string) =>
  value.startsWith('#') ? value : `rgb(var(--color-${value}-rgb))`
