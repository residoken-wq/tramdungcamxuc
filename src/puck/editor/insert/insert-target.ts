import type { ComponentData, Config, Data } from '@puckeditor/core'
import { isAllowedInZone } from '../context-menu/clipboard'

export type ItemSelector = {
  index: number
  zone?: string
}

export type InsertTargetResult =
  | {
      allowed: true
      destinationIndex: number
      destinationZone: string
      parentType?: string
    }
  | {
      allowed: false
      reason: 'disallowed' | 'unknown-type'
      message?: string
    }

export type GetInsertTargetParams = {
  blockType: string
  data: Data
  config: Config
  itemSelector?: ItemSelector | null
  selectedItem?: ComponentData | null
  getItemById?: (id: string) => ComponentData | null | undefined
}

/**
 * Inspects a component's field configuration in Puck to determine if it is a container
 * with slots (e.g. Container, Columns, TabsWidget, AccordionWidget).
 *
 * Returns the primary slot path (e.g. 'items', 'col1', 'items[0].content') or null if it's a normal block.
 */
export function getBlockPrimarySlot(config: Config, blockType: string): string | null {
  if (!config?.components || !config.components[blockType]) return null
  const compConfig = config.components[blockType] as { fields?: Record<string, unknown> } | undefined
  const fields = compConfig?.fields
  if (!fields || typeof fields !== 'object') return null

  // 1. Direct slot fields (e.g. items, col1, cards, posts)
  for (const [key, fieldDef] of Object.entries(fields)) {
    if (fieldDef && typeof fieldDef === 'object' && (fieldDef as { type?: string }).type === 'slot') {
      return key
    }
  }

  // 2. Nested slot fields inside array fields (e.g. TabsWidget, AccordionWidget items[0].content)
  for (const [arrayKey, fieldDef] of Object.entries(fields)) {
    if (
      fieldDef &&
      typeof fieldDef === 'object' &&
      (fieldDef as { type?: string }).type === 'array'
    ) {
      const arrayFields = (fieldDef as { arrayFields?: Record<string, unknown> }).arrayFields
      if (arrayFields && typeof arrayFields === 'object') {
        for (const [subKey, subFieldDef] of Object.entries(arrayFields)) {
          if (
            subFieldDef &&
            typeof subFieldDef === 'object' &&
            (subFieldDef as { type?: string }).type === 'slot'
          ) {
            return `${arrayKey}[0].${subKey}`
          }
        }
      }
    }
  }

  return null
}

/**
 * Calculates the current number of child blocks in a target zone.
 */
export function getZoneItemCount(
  data: Data,
  zone: string,
  parentItem?: ComponentData | null,
): number {
  const isRoot = !zone || zone.startsWith('root:') || zone === 'default-zone'
  if (isRoot) {
    return Array.isArray(data.content) ? data.content.length : 0
  }

  // 1. Check data.zones
  if (data.zones && Array.isArray(data.zones[zone])) {
    return data.zones[zone].length
  }

  // 2. Check parentItem props
  if (parentItem && parentItem.props && typeof parentItem.props === 'object') {
    const slotPath = zone.slice(zone.indexOf(':') + 1)
    if (slotPath) {
      const directVal = (parentItem.props as Record<string, unknown>)[slotPath]
      if (Array.isArray(directVal)) {
        return directVal.length
      }

      // Check array path e.g. items[0].content
      const arrayMatch = /^([A-Za-z0-9_]+)\[(\d+)\]\.([A-Za-z0-9_]+)$/.exec(slotPath)
      if (arrayMatch) {
        const arr = (parentItem.props as Record<string, unknown>)[arrayMatch[1]]
        if (Array.isArray(arr)) {
          const item = arr[Number(arrayMatch[2])]
          if (item && typeof item === 'object') {
            const subVal = (item as Record<string, unknown>)[arrayMatch[3]]
            if (Array.isArray(subVal)) {
              return subVal.length
            }
          }
        }
      }
    }
  }

  return 0
}

/**
 * Searches the page content and zones for an item with the given ID.
 */
export function findItemById(data: Data, id: string): ComponentData | null {
  if (!id) return null

  if (Array.isArray(data.content)) {
    for (const item of data.content) {
      if (item?.props?.id === id) return item
    }
  }

  if (data.zones && typeof data.zones === 'object') {
    for (const zoneList of Object.values(data.zones)) {
      if (Array.isArray(zoneList)) {
        for (const item of zoneList) {
          if (item?.props?.id === id) return item
        }
      }
    }
  }

  return null
}

/**
 * EB-13b Pure logic: determines the insertion target index and zone for a block.
 *
 * Rules:
 * 1. Selected item is a container with slots (Container, Columns, Tabs…):
 *    Inserts at the end of the slot if allowed.
 * 2. Selected item is a normal block:
 *    Inserts immediately after it in the same zone if allowed.
 * 3. Nothing selected:
 *    Inserts at the end of the page (root) if allowed.
 * 4. If disallowed by slot / zone rules:
 *    Returns allowed: false with reason 'disallowed'.
 */
export function getInsertTarget({
  blockType,
  data,
  config,
  itemSelector,
  selectedItem,
  getItemById,
}: GetInsertTargetParams): InsertTargetResult {
  // Validate that the block type is registered in the config
  if (!config?.components || !config.components[blockType]) {
    return { allowed: false, reason: 'unknown-type' }
  }

  // CASE 3: Nothing is selected -> insert at the end of the root page
  if (!itemSelector || !selectedItem) {
    const rootZone = 'root:default-zone'
    const allowed = isAllowedInZone(blockType, rootZone, undefined, config)
    if (!allowed) {
      return { allowed: false, reason: 'disallowed' }
    }
    return {
      allowed: true,
      destinationIndex: Array.isArray(data?.content) ? data.content.length : 0,
      destinationZone: rootZone,
    }
  }

  const primarySlot = getBlockPrimarySlot(config, selectedItem.type)

  // CASE 1: Selected item is a container with slots (Container, Columns, Tabs, etc.)
  if (primarySlot !== null) {
    const parentId = selectedItem.props?.id ? String(selectedItem.props.id) : ''
    const targetZone = `${parentId}:${primarySlot}`
    const parentType = selectedItem.type

    const allowed = isAllowedInZone(blockType, targetZone, parentType, config)
    if (!allowed) {
      return { allowed: false, reason: 'disallowed' }
    }

    const currentCount = getZoneItemCount(data, targetZone, selectedItem)
    return {
      allowed: true,
      destinationIndex: currentCount,
      destinationZone: targetZone,
      parentType,
    }
  }

  // CASE 2: Selected item is a normal block -> insert right after it in the same zone
  const targetZone = itemSelector.zone || 'root:default-zone'
  const isRoot = !targetZone || targetZone.startsWith('root:') || targetZone === 'default-zone'

  let parentType: string | undefined
  if (!isRoot && targetZone.includes(':')) {
    const parentId = targetZone.slice(0, targetZone.indexOf(':'))
    const parentItem = getItemById ? getItemById(parentId) : findItemById(data, parentId)
    parentType = parentItem?.type
  }

  const allowed = isAllowedInZone(blockType, targetZone, parentType, config)
  if (!allowed) {
    return { allowed: false, reason: 'disallowed' }
  }

  const destinationIndex =
    typeof itemSelector.index === 'number' && itemSelector.index >= 0 ? itemSelector.index + 1 : 0

  return {
    allowed: true,
    destinationIndex,
    destinationZone: targetZone,
    parentType,
  }
}

/**
 * Generates a brand new UUID safe for all browser and node environments.
 */
function generateUUID(prefix = 'eb13b'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * EB-13b item 4: Ready-made 2-column pattern (Image + Text).
 *
 * Returns a Container configured with row layout on desktop, column layout on mobile,
 * containing an ImageWidget and a TextWidget with '[MẪU]' placeholder text.
 * Generates fresh unique UUIDs on every call so multiple insertions never collide.
 */
export function createTwoColumnContainerPattern(): ComponentData {
  const containerId = generateUUID('container')
  const imageId = generateUUID('image')
  const textId = generateUUID('text')

  return {
    type: 'Container',
    props: {
      id: containerId,
      version: 1,
      tag: 'div',
      width: 'boxed',
      contentWidth: 'lg',
      minHeight: 'none',
      layout: {
        direction: { desktop: 'row', mobile: 'column' },
        gap: { desktop: 'md', mobile: 'md' },
        alignItems: { desktop: 'center' },
      },
      background: { type: 'none' },
      items: [
        {
          type: 'ImageWidget',
          props: {
            id: imageId,
            version: 1,
            mediaId: '',
            imageUrl: '',
            imageSize: '100',
            linkType: 'none',
            caption: '[MẪU] Hình ảnh minh họa',
          },
        },
        {
          type: 'TextWidget',
          props: {
            id: textId,
            version: 1,
            content:
              '<p><strong>[MẪU] Tiêu đề nội dung</strong></p><p>[MẪU] Nhập văn bản giới thiệu hoặc mô tả chi tiết tại đây...</p>',
          },
        },
      ],
    },
  }
}

/**
 * Smoothly scrolls the canvas / preview to the component with the given ID.
 */
export function scrollToCanvasBlock(id: string) {
  if (typeof window === 'undefined' || !id) return

  setTimeout(() => {
    try {
      const iframe = window.document.querySelector('iframe')
      const doc = iframe?.contentDocument || window.document
      const el =
        doc.querySelector(`[data-puck-component="${id}"]`) ||
        doc.querySelector(`[data-eb-id="${id}"]`) ||
        doc.getElementById(id)
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } catch {
      // Safe fallback on cross-origin iframe or detached node
    }
  }, 100)
}
