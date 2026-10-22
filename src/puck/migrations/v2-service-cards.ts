import type { Data } from '@puckeditor/core'

type LegacyServiceItem =
  | {
      serviceId?: unknown
    }
  | null
  | undefined

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; id?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'ServiceCards') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      const parentId =
        typeof props.id === 'string' && props.id
          ? props.id
          : typeof rawItem.id === 'string' && rawItem.id
            ? rawItem.id
            : 'services'

      const rawServices = Array.isArray(props.services) ? props.services : []
      // Bỏ serviceId rỗng
      const validServices = rawServices.filter((s: LegacyServiceItem) =>
        Boolean(s && s.serviceId != null && String(s.serviceId).trim() !== ''),
      )

      // columns: 1 -> 1, 2 -> 2, >= 3 -> 3
      const columnsCount = validServices.length === 1 ? 1 : validServices.length === 2 ? 2 : 3

      const highlightId =
        props.highlightServiceId != null ? String(props.highlightServiceId).trim() : ''

      const cards = validServices.map((itemData: LegacyServiceItem, index: number) => {
        const sId = itemData!.serviceId as string | number
        const isHighlighted = highlightId !== '' && String(sId) === highlightId

        return {
          type: 'ServiceCard',
          props: {
            id: `${parentId}-service-${index}`,
            serviceId: sId,
            highlight: isHighlighted,
            nameColor: 'deep-navy',
            nameSize: 'md',
            textColor: 'deep-navy',
            textSize: 'md',
            align: 'left',
          },
        }
      })

      const { services: _oldServices, highlightServiceId: _oldHighlight, ...restProps } = props

      newItem = {
        ...newItem,
        props: {
          ...restProps,
          version: 2,
          columns: columnsCount,
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
 * Migration v1 -> v2 for ServiceCards:
 * Converts `services` array to draggable `ServiceCard` child blocks slot, adds `columns` field.
 */
export function migrateServiceCardsV1ToV2(data: Data): Data {
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
