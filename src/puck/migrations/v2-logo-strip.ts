import type { Data } from '@puckeditor/core'

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'LogoStrip') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      const oldLogos = Array.isArray(props.logos) ? props.logos : []
      const existingGroups = Array.isArray(props.groups) ? props.groups : []
      const groups =
        existingGroups.length > 0
          ? existingGroups
          : [
              {
                label: '',
                logos: oldLogos,
              },
            ]

      newItem = {
        ...newItem,
        props: {
          ...props,
          version: 2,
          groups,
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
 * Migration v1 -> v2 for LogoStrip:
 * Migrates flat `logos` array into a single group with empty label `{ label: '', logos }`.
 */
export function migrateLogoStripV1ToV2(data: Data): Data {
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
    ...(newZones ? { zones: newZones } : {}),
  }
}
