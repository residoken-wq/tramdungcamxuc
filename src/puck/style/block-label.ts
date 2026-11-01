/**
 * EB-07: Helpers and constants for custom block labels in the Puck editor.
 * The `_label` prop is editor-only: it must never be rendered to public page HTML/CSS.
 */

export const LABEL_FIELD = '_label'
export const MAX_BLOCK_LABEL_LENGTH = 60

/**
 * Normalizes a user-entered block label.
 * - Must be a string.
 * - Strips control characters (\x00-\x1F, \x7F-\x9F).
 * - Collapses repeated whitespace to a single space, then trims.
 * - Enforces max 60 characters.
 * - Returns undefined if empty, non-string, or invalid.
 */
export function cleanBlockLabel(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  // Strip control characters (including null bytes, tabs, newlines)
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')

  // Collapse whitespace and trim
  const collapsed = stripped.replace(/\s+/g, ' ').trim()
  if (!collapsed) return undefined

  return collapsed.slice(0, MAX_BLOCK_LABEL_LENGTH)
}
