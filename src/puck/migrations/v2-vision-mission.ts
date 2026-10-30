import type { Data } from '@puckeditor/core'

const LEGACY_KEYS = [
  'visionTitle',
  'visionContent',
  'visionIcon',
  'missionTitle',
  'missionContent',
  'missionIcon',
] as const

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toVisionCard(
  props: Record<string, unknown>,
  prefix: 'vision' | 'mission',
  id: string,
  defaultIcon: string,
) {
  const icon = str(props[`${prefix}Icon`])
  return {
    type: 'VisionCard',
    props: {
      id,
      version: 1,
      icon: icon || defaultIcon,
      title: str(props[`${prefix}Title`]),
      content: str(props[`${prefix}Content`]),
      titleColor: 'deep-navy',
      textColor: 'deep-navy',
      titleSize: 'md',
      textSize: 'md',
      align: 'left',
    },
  }
}

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; id?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'VisionMission') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      const parentId =
        typeof props.id === 'string' && props.id
          ? props.id
          : typeof rawItem.id === 'string' && rawItem.id
            ? rawItem.id
            : 'vision-mission'

      const cards = [
        props.visionTitle || props.visionContent
          ? toVisionCard(props, 'vision', `${parentId}-card-0`, 'compass')
          : null,
        props.missionTitle || props.missionContent
          ? toVisionCard(props, 'mission', `${parentId}-card-1`, 'heart')
          : null,
      ].filter(Boolean)

      const restProps: Record<string, unknown> = { ...props }
      for (const key of LEGACY_KEYS) delete restProps[key]
      newItem = {
        ...newItem,
        props: {
          ...restProps,
          version: 2,
          titleSize: typeof props.titleSize === 'string' ? props.titleSize : 'md',
          cards: Array.isArray(props.cards) ? props.cards : cards,
        },
      }
    }
  }

  // Recurse into nested slot arrays (e.g. Columns slots)
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
 * Migration v1 -> v2 for VisionMission (PK-09):
 * converts the flat `vision*` / `mission*` props into a `cards` slot of draggable `VisionCard`
 * child blocks (ids `${parentId}-card-0/1`), and adds `titleSize`.
 * Empty legacy cards are dropped so no blank card appears.
 */
export function migrateVisionMissionV1ToV2(data: Data): Data {
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
