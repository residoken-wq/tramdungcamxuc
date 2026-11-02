/**
 * Pure isomorphic helper to recursively traverse all Puck items in a page data structure.
 * This file has NO 'server-only' directive so it can be used in unit tests, client code,
 * or server resolvers alike.
 */

export type PuckItem = {
  type: string
  props: Record<string, unknown>
}

export type WalkVisitor = (item: PuckItem) => Promise<void> | void

export function isPuckItem(value: unknown): value is PuckItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as { type: unknown }).type === 'string' &&
    'props' in value &&
    typeof (value as { props: unknown }).props === 'object' &&
    (value as { props: unknown }).props !== null
  )
}

/**
 * Recursively visits all Puck items in:
 * 1. root `data.content`
 * 2. `data.zones`
 * 3. nested slot props (e.g. `props.col1`, `props.col2`, `props.col3` or any prop holding a block array)
 * regardless of slot prop name or nesting depth.
 */
export async function walkPuckItems(data: unknown, visit: WalkVisitor): Promise<void> {
  if (!data || typeof data !== 'object') {
    return
  }

  const visitedItems = new Set<object>()

  async function walkItem(item: PuckItem): Promise<void> {
    if (visitedItems.has(item)) {
      return
    }
    visitedItems.add(item)

    await visit(item)

    if (item.props && typeof item.props === 'object') {
      await walkProps(item.props)
    }
  }

  async function walkProps(props: Record<string, unknown>): Promise<void> {
    for (const value of Object.values(props)) {
      if (Array.isArray(value)) {
        for (const element of value) {
          if (isPuckItem(element)) {
            await walkItem(element)
          } else if (element && typeof element === 'object' && !Array.isArray(element)) {
            // EB-06b: array fields whose items hold slots (Tabs / Accordion `items[].content`).
            await walkProps(element as Record<string, unknown>)
          }
        }
      } else if (value && typeof value === 'object' && !isPuckItem(value)) {
        // In case an object contains nested slot arrays
        await walkProps(value as Record<string, unknown>)
      }
    }
  }

  const d = data as { content?: unknown; zones?: Record<string, unknown> }

  if (Array.isArray(d.content)) {
    for (const item of d.content) {
      if (isPuckItem(item)) {
        await walkItem(item)
      }
    }
  }

  if (d.zones && typeof d.zones === 'object') {
    for (const zoneContent of Object.values(d.zones)) {
      if (Array.isArray(zoneContent)) {
        for (const item of zoneContent) {
          if (isPuckItem(item)) {
            await walkItem(item)
          }
        }
      }
    }
  }
}

/**
 * Synchronous version of walkPuckItems for fast validation without Promises.
 */
export function walkPuckItemsSync(data: unknown, visit: (item: PuckItem) => void): void {
  if (!data || typeof data !== 'object') {
    return
  }

  const visitedItems = new Set<object>()

  function walkItem(item: PuckItem): void {
    if (visitedItems.has(item)) {
      return
    }
    visitedItems.add(item)

    visit(item)

    if (item.props && typeof item.props === 'object') {
      walkProps(item.props)
    }
  }

  function walkProps(props: Record<string, unknown>): void {
    for (const value of Object.values(props)) {
      if (Array.isArray(value)) {
        for (const element of value) {
          if (isPuckItem(element)) {
            walkItem(element)
          } else if (element && typeof element === 'object' && !Array.isArray(element)) {
            walkProps(element as Record<string, unknown>)
          }
        }
      } else if (value && typeof value === 'object' && !isPuckItem(value)) {
        walkProps(value as Record<string, unknown>)
      }
    }
  }

  const d = data as { content?: unknown; zones?: Record<string, unknown> }

  if (Array.isArray(d.content)) {
    for (const item of d.content) {
      if (isPuckItem(item)) {
        walkItem(item)
      }
    }
  }

  if (d.zones && typeof d.zones === 'object') {
    for (const zoneContent of Object.values(d.zones)) {
      if (Array.isArray(zoneContent)) {
        for (const item of zoneContent) {
          if (isPuckItem(item)) {
            walkItem(item)
          }
        }
      }
    }
  }
}
