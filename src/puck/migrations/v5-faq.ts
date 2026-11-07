import type { Data } from '@puckeditor/core'

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'FAQ') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 5) {
      const contactBadge =
        props.contactBadge !== undefined
          ? props.contactBadge
          : props.aside === 'booking'
            ? 'Trạm Dừng Cảm Xúc'
            : ''

      newItem = {
        ...newItem,
        props: {
          ...props,
          version: 5,
          description: typeof props.description === 'string' ? props.description : '',
          seriesLabelStyle:
            typeof props.seriesLabelStyle === 'string' ? props.seriesLabelStyle : 'text',
          iconStyle: typeof props.iconStyle === 'string' ? props.iconStyle : 'chevron',
          contactMediaId:
            typeof props.contactMediaId === 'string' || typeof props.contactMediaId === 'number'
              ? props.contactMediaId
              : '',
          contactBadge,
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
 * Migration v4 -> v5 for FAQ:
 * Ensures all existing FAQ items have version: 5, description: '', seriesLabelStyle: 'text',
 * iconStyle: 'chevron', contactMediaId: '', and assigns contactBadge: 'Trạm Dừng Cảm Xúc'
 * to existing blocks using aside: 'booking' to preserve appearance.
 */
export function migrateFAQV4ToV5(data: Data): Data {
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
