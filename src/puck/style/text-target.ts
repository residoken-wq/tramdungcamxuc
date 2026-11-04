/**
 * EB-15: marks one text element of a block so `_style.texts[key]` can style it.
 * The value is `<blockId>:<fieldKey>`, so nested blocks never pick up a parent's rule.
 */
export const TEXT_TARGET_ATTR = 'data-eb-text'

export function textTarget(blockId: string | undefined, key: string): Record<string, string> {
  return blockId ? { [TEXT_TARGET_ATTR]: `${blockId}:${key}` } : {}
}
