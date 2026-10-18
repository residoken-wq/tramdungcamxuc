import type { Data } from '@puckeditor/core'

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'HeroTwoEntries') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      const rawEntry1 =
        props.entry1 && typeof props.entry1 === 'object'
          ? (props.entry1 as Record<string, unknown>)
          : {}
      const rawEntry2 =
        props.entry2 && typeof props.entry2 === 'object'
          ? (props.entry2 as Record<string, unknown>)
          : {}

      newItem = {
        ...newItem,
        props: {
          ...props,
          version: 2,
          description: typeof props.description === 'string' ? props.description : '',
          mediaId: props.mediaId != null ? props.mediaId : '',
          imageUrl: typeof props.imageUrl === 'string' ? props.imageUrl : '',
          imageAlt: typeof props.imageAlt === 'string' ? props.imageAlt : '',
          entry1: {
            ...rawEntry1,
            groupLabel: typeof rawEntry1.groupLabel === 'string' ? rawEntry1.groupLabel : '',
            buttonStyle: rawEntry1.buttonStyle === 'outline' ? 'outline' : 'solid',
          },
          entry2: {
            ...rawEntry2,
            groupLabel: typeof rawEntry2.groupLabel === 'string' ? rawEntry2.groupLabel : '',
            buttonStyle: rawEntry2.buttonStyle === 'solid' ? 'solid' : 'outline',
          },
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
 * Migration v1 -> v2 for HeroTwoEntries:
 * Adds description, mediaId, imageUrl, imageAlt, groupLabel, buttonStyle.
 * entry1 defaults buttonStyle to 'solid', entry2 defaults buttonStyle to 'outline'.
 */
export function migrateHeroTwoEntriesV1ToV2(data: Data): Data {
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
    zones: newZones,
  }
}
