/**
 * EB-06a: rich text inside page data is cleaned **before** Puck renders it.
 *
 * Puck replaces a `richtext` prop with its own renderer before the block's `render` runs, and while
 * that renderer loads it shows a fallback that writes the stored string with
 * `dangerouslySetInnerHTML` unchanged. Cleaning inside the block is therefore too late: the stored
 * HTML has to be cleaned in the data handed to `<Render>`.
 */
import { sanitizeRichText } from '@/lib/html/sanitize-rich-text'

/** Block type → its `richtext` props. */
export const RICH_TEXT_PROPS: Record<string, readonly string[]> = {
  TextWidget: ['content'],
}

type Item = { type?: unknown; props?: Record<string, unknown> }

const isItemArray = (value: unknown): value is Item[] =>
  Array.isArray(value) && value.some((v) => v && typeof v === 'object' && 'type' in v)

function cleanItems(items: unknown): unknown {
  if (!Array.isArray(items)) return items
  return items.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw
    const item = raw as Item
    if (!item.props) return item
    const keys = typeof item.type === 'string' ? (RICH_TEXT_PROPS[item.type] ?? []) : []
    const props: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(item.props)) {
      if (keys.includes(key) && typeof value === 'string') {
        // REVIEW-REQUIRED: every stored rich text string goes through the allow-list sanitizer.
        props[key] = sanitizeRichText(value)
      } else if (Array.isArray(value)) {
        if (isItemArray(value)) {
          props[key] = cleanItems(value) // slots (Container, Columns…)
        } else {
          // Array of objects (e.g. tabs / accordion items) that might contain slot contents
          props[key] = value.map((el) => {
            if (el && typeof el === 'object') {
              const sub: Record<string, unknown> = {}
              for (const [k, v] of Object.entries(el)) {
                sub[k] = isItemArray(v) ? cleanItems(v) : v
              }
              return sub
            }
            return el
          })
        }
      } else {
        props[key] = value
      }
    }
    return { ...item, props }
  })
}

/** Returns a copy of the page data with every rich text prop sanitized (content, zones, slots). */
export function sanitizePageRichText<
  T extends { content?: unknown; zones?: Record<string, unknown> },
>(data: T): T {
  if (!data || typeof data !== 'object') return data
  const zones = data.zones
    ? Object.fromEntries(Object.entries(data.zones).map(([k, v]) => [k, cleanItems(v)]))
    : data.zones
  return { ...data, content: cleanItems(data.content), ...(zones ? { zones } : {}) }
}
