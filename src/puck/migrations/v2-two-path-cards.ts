import type { Data } from '@puckeditor/core'

const LEGACY_SUFFIXES = [
  'GroupLabel',
  'Title',
  'Description',
  'ButtonLabel',
  'LinkType',
  'PageId',
  'Href',
  'ButtonStyle',
] as const

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toPathCard(
  props: Record<string, unknown>,
  prefix: 'path1' | 'path2',
  id: string,
  defaultStyle: 'solid' | 'outline',
) {
  const style = props[`${prefix}ButtonStyle`]
  const pageId = props[`${prefix}PageId`]
  return {
    type: 'PathCard',
    props: {
      id,
      version: 1,
      groupLabel: str(props[`${prefix}GroupLabel`]),
      title: str(props[`${prefix}Title`]),
      description: str(props[`${prefix}Description`]),
      buttonLabel: str(props[`${prefix}ButtonLabel`]),
      linkType: props[`${prefix}LinkType`] === 'page' ? 'page' : 'url',
      pageId: typeof pageId === 'string' || typeof pageId === 'number' ? pageId : '',
      href: str(props[`${prefix}Href`]),
      buttonStyle: style === 'solid' || style === 'outline' ? style : defaultStyle,
      labelColor: 'deep-navy',
      titleColor: 'deep-navy',
      textColor: 'deep-navy',
      titleSize: 'md',
      textSize: 'md',
      align: 'left',
    },
  }
}

function isEmptyPath(props: Record<string, unknown>, prefix: 'path1' | 'path2'): boolean {
  return (
    !props[`${prefix}GroupLabel`] &&
    !props[`${prefix}Title`] &&
    !props[`${prefix}Description`] &&
    !props[`${prefix}ButtonLabel`]
  )
}

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; id?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'TwoPathCards') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      const parentId =
        typeof props.id === 'string' && props.id
          ? props.id
          : typeof rawItem.id === 'string' && rawItem.id
            ? rawItem.id
            : 'paths'

      const paths = [
        isEmptyPath(props, 'path1')
          ? null
          : toPathCard(props, 'path1', `${parentId}-path-0`, 'solid'),
        isEmptyPath(props, 'path2')
          ? null
          : toPathCard(props, 'path2', `${parentId}-path-1`, 'outline'),
      ].filter(Boolean)

      const restProps: Record<string, unknown> = { ...props }
      for (const prefix of ['path1', 'path2']) {
        for (const suffix of LEGACY_SUFFIXES) delete restProps[`${prefix}${suffix}`]
      }
      newItem = {
        ...newItem,
        props: {
          ...restProps,
          version: 2,
          titleSize: typeof props.titleSize === 'string' ? props.titleSize : 'md',
          paths: Array.isArray(props.paths) ? props.paths : paths,
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
 * Migration v1 -> v2 for TwoPathCards (PK-08):
 * converts the flat `path1*` / `path2*` props into a `paths` slot of draggable `PathCard`
 * child blocks (ids `${parentId}-path-0/1`), and adds `titleSize`.
 * Empty legacy paths are dropped so no blank card appears.
 */
export function migrateTwoPathCardsV1ToV2(data: Data): Data {
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
