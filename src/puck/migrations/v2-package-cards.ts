import type { Data } from '@puckeditor/core'

type LegacyPackageItem =
  | {
      packageId?: unknown
      productId?: unknown
    }
  | string
  | number
  | null
  | undefined

function extractPackageId(item: LegacyPackageItem): string | number | null {
  if (item == null) return null
  if (typeof item === 'string' || typeof item === 'number') {
    const s = String(item).trim()
    return s.length > 0 ? item : null
  }
  if (typeof item === 'object') {
    const raw = item.packageId ?? item.productId
    if (raw != null) {
      const s = String(raw).trim()
      return s.length > 0 ? (raw as string | number) : null
    }
  }
  return null
}

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; id?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'PackageCards') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      const parentId =
        typeof props.id === 'string' && props.id
          ? props.id
          : typeof rawItem.id === 'string' && rawItem.id
            ? rawItem.id
            : 'packages'

      const rawPackages = Array.isArray(props.packages) ? props.packages : []
      const rawPackageIds = Array.isArray(props.packageIds) ? props.packageIds : []

      const collectedIds: Array<string | number> = []
      if (rawPackages.length > 0) {
        for (const p of rawPackages) {
          const id = extractPackageId(p)
          if (id != null) collectedIds.push(id)
        }
      } else if (rawPackageIds.length > 0) {
        for (const p of rawPackageIds) {
          const id = extractPackageId(p)
          if (id != null) collectedIds.push(id)
        }
      }

      const highlightId =
        props.highlightPackageId != null ? String(props.highlightPackageId).trim() : ''

      const cards = collectedIds.map((pId: string | number, index: number) => {
        const isHighlighted = highlightId !== '' && String(pId) === highlightId

        return {
          type: 'PackageCard',
          props: {
            id: `${parentId}-package-${index}`,
            packageId: pId,
            highlight: isHighlighted,
            nameColor: 'deep-navy',
            nameSize: 'md',
            textColor: 'deep-navy',
            textSize: 'md',
            align: 'left',
          },
        }
      })

      const {
        packages: _oldPackages,
        packageIds: _oldPackageIds,
        highlightPackageId: _oldHighlight,
        ...restProps
      } = props

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
 * Migration v1 -> v2 for PackageCards:
 * Converts `packages` / `packageIds` array to draggable `PackageCard` child blocks slot.
 */
export function migratePackageCardsV1ToV2(data: Data): Data {
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
