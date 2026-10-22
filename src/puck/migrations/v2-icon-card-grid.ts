import type { Data } from '@puckeditor/core'

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; id?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'IconCardGrid') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      const items = Array.isArray(props.items) ? props.items : []
      const parentId =
        typeof props.id === 'string' && props.id
          ? props.id
          : typeof rawItem.id === 'string' && rawItem.id
            ? rawItem.id
            : 'grid'

      const cards = items.map((cardItem: any, index: number) => ({
        type: 'Card',
        props: {
          id: `${parentId}-card-${index}`,
          icon: typeof cardItem?.icon === 'string' ? cardItem.icon : 'star',
          title: typeof cardItem?.title === 'string' ? cardItem.title : '',
          text: typeof cardItem?.text === 'string' ? cardItem.text : '',
          titleColor: 'deep-navy',
          textColor: 'deep-navy',
          titleSize: 'md',
          textSize: 'md',
          align: 'left',
        },
      }))

      const { items: _oldItems, ...restProps } = props
      newItem = {
        ...newItem,
        props: {
          ...restProps,
          version: 2,
          cards,
        },
      }
    }
  }

  // Recurse into nested slot arrays if present in props (e.g. Columns slots)
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
 * Migration v1 -> v2 for IconCardGrid:
 * Converts legacy `items` array to `cards` slot containing draggable `Card` child blocks.
 */
export function migrateIconCardGridV1ToV2(data: Data): Data {
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
