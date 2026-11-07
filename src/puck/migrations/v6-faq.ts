import type { Data } from '@puckeditor/core'

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'FAQ') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 6) {
      newItem = {
        ...newItem,
        props: {
          ...props,
          version: 6,
          variant: typeof props.variant === 'string' ? props.variant : 'accordion',
        },
      }
    }
  }

  // Recurse into nested slot arrays if present in props
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
 * Migration v5 -> v6 for FAQ (PK-21):
 * Upgrades version to 6 and adds variant: 'accordion' (default) if not present.
 */
export function migrateFAQV5ToV6(data: Data): Data {
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
