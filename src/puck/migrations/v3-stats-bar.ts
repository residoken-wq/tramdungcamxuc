import type { Data } from '@puckeditor/core'

type LegacyStatItem =
  | {
      value?: unknown
      label?: unknown
      description?: unknown
      icon?: unknown
    }
  | null
  | undefined

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; id?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'StatsBar') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 3) {
      const parentId =
        typeof props.id === 'string' && props.id
          ? props.id
          : typeof rawItem.id === 'string' && rawItem.id
            ? rawItem.id
            : 'stats'

      const rawStats = Array.isArray(props.stats)
        ? props.stats
        : Array.isArray(props.items)
          ? props.items
          : []
      // Bỏ ô mà component cũ bỏ qua (không value, label, icon)
      const validStats = rawStats.filter((s: LegacyStatItem) =>
        Boolean(s && (s.value || s.label || s.icon)),
      )

      // columns = the grid StatsBar v2 picked: 2 -> 2, 3 -> 3, any other count -> 4
      const columnsCount = validStats.length === 2 ? 2 : validStats.length === 3 ? 3 : 4

      const stats = validStats.map((statItem: LegacyStatItem, index: number) => ({
        type: 'Stat',
        props: {
          id: `${parentId}-stat-${index}`,
          value: typeof statItem?.value === 'string' ? statItem.value : '',
          label: typeof statItem?.label === 'string' ? statItem.label : '',
          description: typeof statItem?.description === 'string' ? statItem.description : '',
          icon: typeof statItem?.icon === 'string' ? statItem.icon : '',
          valueColor: 'bright-magenta',
          valueSize: 'md',
          labelColor: 'deep-navy',
          labelSize: 'md',
          align: 'center',
        },
      }))

      const { items: _legacyItems, ...restProps } = props

      newItem = {
        ...newItem,
        props: {
          ...restProps,
          version: 3,
          columns: columnsCount,
          stats,
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
 * Migration v2 -> v3 for StatsBar:
 * Converts `stats` array to draggable `Stat` child blocks slot, adds `columns` field.
 */
export function migrateStatsBarV2ToV3(data: Data): Data {
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
