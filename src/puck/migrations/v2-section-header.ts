import type { Data } from '@puckeditor/core'

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'SectionHeader') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      newItem = {
        ...newItem,
        props: {
          ...props,
          version: 2,
          line1Color: typeof props.line1Color === 'string' ? props.line1Color : 'deep-navy',
          line2Color: typeof props.line2Color === 'string' ? props.line2Color : 'bright-magenta',
          eyebrowColor:
            typeof props.eyebrowColor === 'string' ? props.eyebrowColor : 'bright-magenta',
          emotionColor: typeof props.emotionColor === 'string' ? props.emotionColor : 'deep-navy',
          titleSize: typeof props.titleSize === 'string' ? props.titleSize : 'md',
          emotionSize: typeof props.emotionSize === 'string' ? props.emotionSize : 'md',
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
 * Migration v1 -> v2 for SectionHeader:
 * Adds default formatting props: line1Color ('deep-navy'), line2Color ('bright-magenta'),
 * eyebrowColor ('bright-magenta'), emotionColor ('deep-navy'), titleSize ('md'), emotionSize ('md').
 * Sets version: 2 on all SectionHeader instances, including inside Columns slots.
 * Idempotent: running multiple times produces no further changes.
 */
export function migrateSectionHeaderV1ToV2(data: Data): Data {
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
