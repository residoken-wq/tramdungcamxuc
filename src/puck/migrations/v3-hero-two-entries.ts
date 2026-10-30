import type { Data } from '@puckeditor/core'

type LegacyEntry = Record<string, unknown>

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toEntryCard(
  entry: LegacyEntry,
  id: string,
  defaults: { buttonStyle: 'solid' | 'outline'; badgeColor: 'soft-pink' | 'lavender-mist' },
) {
  const buttonStyle =
    entry.buttonStyle === 'solid' || entry.buttonStyle === 'outline'
      ? entry.buttonStyle
      : defaults.buttonStyle
  return {
    type: 'EntryCard',
    props: {
      id,
      version: 1,
      groupLabel: str(entry.groupLabel),
      label: str(entry.label),
      description: str(entry.description),
      buttonText: str(entry.buttonText),
      buttonLink: str(entry.buttonLink),
      buttonStyle,
      badgeColor: defaults.badgeColor,
      labelColor: 'deep-navy',
      textColor: 'deep-navy',
      labelSize: 'md',
      textSize: 'md',
      align: 'left',
    },
  }
}

function isEmptyEntry(entry: LegacyEntry): boolean {
  return !entry.groupLabel && !entry.label && !entry.description && !entry.buttonText
}

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; id?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'HeroTwoEntries') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 3) {
      const parentId =
        typeof props.id === 'string' && props.id
          ? props.id
          : typeof rawItem.id === 'string' && rawItem.id
            ? rawItem.id
            : 'hero'
      const entry1 =
        props.entry1 && typeof props.entry1 === 'object' ? (props.entry1 as LegacyEntry) : {}
      const entry2 =
        props.entry2 && typeof props.entry2 === 'object' ? (props.entry2 as LegacyEntry) : {}

      const entries = [
        isEmptyEntry(entry1)
          ? null
          : toEntryCard(entry1, `${parentId}-entry-0`, {
              buttonStyle: 'solid',
              badgeColor: 'soft-pink',
            }),
        isEmptyEntry(entry2)
          ? null
          : toEntryCard(entry2, `${parentId}-entry-1`, {
              buttonStyle: 'outline',
              badgeColor: 'lavender-mist',
            }),
      ].filter(Boolean)

      const { entry1: _e1, entry2: _e2, ...restProps } = props
      newItem = {
        ...newItem,
        props: {
          ...restProps,
          version: 3,
          titleSize: typeof props.titleSize === 'string' ? props.titleSize : 'md',
          entries: Array.isArray(props.entries) ? props.entries : entries,
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
 * Migration v2 -> v3 for HeroTwoEntries (PK-08):
 * converts the fixed `entry1` / `entry2` objects into an `entries` slot of draggable
 * `EntryCard` child blocks (ids `${parentId}-entry-0/1`), and adds `titleSize`.
 * Empty legacy entries are dropped so no blank card appears.
 */
export function migrateHeroTwoEntriesV2ToV3(data: Data): Data {
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
