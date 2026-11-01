import type { ComponentData, Data } from '@puckeditor/core'

/**
 * Inserts a ComponentData block into a Puck Data tree at a given zone and index.
 * Handles root content as well as nested container and slot zones.
 */
export function insertBlockIntoData(
  data: Data,
  zoneCompound: string,
  targetIndex: number,
  newItem: ComponentData,
): Data {
  const isRoot =
    !zoneCompound ||
    zoneCompound === 'root:default-zone' ||
    zoneCompound === 'default-zone' ||
    zoneCompound.startsWith('root:') ||
    zoneCompound === 'root'

  if (isRoot) {
    const content = Array.isArray(data.content) ? [...data.content] : []
    const clampedIndex = Math.max(0, Math.min(targetIndex, content.length))
    content.splice(clampedIndex, 0, newItem)
    return { ...data, content }
  }

  // Zone is parentId:slotName
  const [parentId, slotName] = zoneCompound.split(':')
  const newZones = { ...(data.zones || {}) }
  const currentZoneContent = Array.isArray(newZones[zoneCompound])
    ? [...newZones[zoneCompound]]
    : []
  const clampedIndex = Math.max(0, Math.min(targetIndex, currentZoneContent.length))
  currentZoneContent.splice(clampedIndex, 0, newItem)
  newZones[zoneCompound] = currentZoneContent

  // Helper to recursively update the parent's props in content or nested structures
  function updateParentInItems(items: ComponentData[]): ComponentData[] {
    return items.map((item) => {
      if (item.props?.id === parentId) {
        const props = { ...(item.props || {}) }
        if (slotName && Array.isArray(props[slotName])) {
          const slotArr = [...(props[slotName] as ComponentData[])]
          const subClamped = Math.max(0, Math.min(targetIndex, slotArr.length))
          slotArr.splice(subClamped, 0, newItem)
          props[slotName] = slotArr
        }
        return { ...item, props }
      }

      // Check nested props if any
      let changed = false
      const newProps = { ...(item.props || {}) }
      for (const [key, val] of Object.entries(newProps)) {
        if (
          Array.isArray(val) &&
          val.length > 0 &&
          val.some((v) => v && typeof v === 'object' && 'props' in v)
        ) {
          const updated = updateParentInItems(val as ComponentData[])
          newProps[key] = updated
          changed = true
        }
      }
      return changed ? { ...item, props: newProps } : item
    })
  }

  const newContent = Array.isArray(data.content) ? updateParentInItems(data.content) : []

  return {
    ...data,
    content: newContent,
    zones: newZones,
  }
}
