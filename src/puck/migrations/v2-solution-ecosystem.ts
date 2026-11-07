import type { Data } from '@puckeditor/core'

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'SolutionEcosystem') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      newItem = {
        ...newItem,
        props: {
          ...props,
          version: 2,
          layout: typeof props.layout === 'string' ? props.layout : 'cards',
          col1Icon: typeof props.col1Icon === 'string' ? props.col1Icon : '',
          col1Accent: typeof props.col1Accent === 'string' ? props.col1Accent : 'none',
          col1Groups: Array.isArray(props.col1Groups) ? props.col1Groups : [],
          col2Icon: typeof props.col2Icon === 'string' ? props.col2Icon : '',
          col2Accent: typeof props.col2Accent === 'string' ? props.col2Accent : 'none',
          col2Groups: Array.isArray(props.col2Groups) ? props.col2Groups : [],
          col3Icon: typeof props.col3Icon === 'string' ? props.col3Icon : '',
          col3Accent: typeof props.col3Accent === 'string' ? props.col3Accent : 'none',
          col3Groups: Array.isArray(props.col3Groups) ? props.col3Groups : [],
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
 * Migration v1 -> v2 for SolutionEcosystem:
 * Ensures all existing SolutionEcosystem items have version: 2, layout: 'cards',
 * and empty new column accent/icon/group fields, preserving existing colNProducts/Services/Programs.
 */
export function migrateSolutionEcosystemV1ToV2(data: Data): Data {
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
