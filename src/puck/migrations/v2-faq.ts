import type { Data } from '@puckeditor/core'

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'FAQ') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      newItem = {
        ...newItem,
        props: {
          ...props,
          version: 2,
          source: typeof props.source === 'string' ? props.source : 'manual',
          numbered: typeof props.numbered === 'boolean' ? props.numbered : false,
          aside: typeof props.aside === 'string' ? props.aside : 'none',
          bookingAsideTitle:
            typeof props.bookingAsideTitle === 'string' ? props.bookingAsideTitle : '',
          bookingAsideDescription:
            typeof props.bookingAsideDescription === 'string' ? props.bookingAsideDescription : '',
          bookingButtonText:
            typeof props.bookingButtonText === 'string' ? props.bookingButtonText : '',
          bookingButtonLink:
            typeof props.bookingButtonLink === 'string' ? props.bookingButtonLink : '',
          showEmail: typeof props.showEmail === 'boolean' ? props.showEmail : false,
          seeAllLink: typeof props.seeAllLink === 'string' ? props.seeAllLink : '',
        },
      }
    }
  }

  // Recurse into nested slot arrays if present in props (e.g. Columns col1, col2, col3)
  if (newItem.props && typeof newItem.props === 'object') {
    const newProps: Record<string, unknown> = { ...newItem.props }
    let hasArray = false
    for (const [key, value] of Object.entries(newProps)) {
      if (Array.isArray(value)) {
        newProps[key] = value.map(migrateItem)
        hasArray = true
      }
    }
    if (hasArray) {
      newItem.props = newProps
    }
  }

  return newItem
}

/**
 * Migration v1 -> v2 for FAQ:
 * Ensures all existing FAQ items have version: 2, numbered: false, aside: 'none',
 * while safely preserving existing items, titles, colors, and padding.
 */
export function migrateFAQV1ToV2(data: Data): Data {
  if (!data || typeof data !== 'object') return data

  const newContent = Array.isArray(data.content)
    ? (data.content.map(migrateItem) as typeof data.content)
    : []

  let newZones = data.zones
  if (data.zones && typeof data.zones === 'object') {
    const mappedZones: Record<string, unknown[]> = {}
    for (const [zoneKey, zoneItems] of Object.entries(data.zones)) {
      mappedZones[zoneKey] = Array.isArray(zoneItems)
        ? (zoneItems.map(migrateItem) as unknown[])
        : []
    }
    newZones = mappedZones as typeof data.zones
  }

  return {
    ...data,
    content: newContent,
    ...(data.zones !== undefined ? { zones: newZones } : {}),
  }
}
