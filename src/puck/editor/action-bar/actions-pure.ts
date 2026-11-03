import type { ComponentData, Data } from '@puckeditor/core'
import { walkPuckItemsSync } from '@/puck/walk'

export type MoveStatus = {
  canMoveUp: boolean
  canMoveDown: boolean
  totalItems: number
  currentIndex: number
  zone: string
}

/**
 * Checks if a zone string refers to the root content zone.
 */
export function isRootZone(zone?: string | null): boolean {
  return !zone || zone === 'root' || zone === 'default-zone' || zone === 'root:default-zone'
}

/**
 * Resolves a propPath string (e.g. "items", "items[0].content", "col1") on a props object.
 */
export function resolvePropPath(
  props: Record<string, unknown> | null | undefined,
  propPath: string,
): ComponentData[] {
  if (!props || !propPath) return []

  // Fast path for direct property match
  if (Array.isArray(props[propPath])) {
    return props[propPath] as ComponentData[]
  }

  // Parse path with brackets and dots, e.g. "items[0].content"
  const tokens: (string | number)[] = []
  const regex = /([^.[\]]+)|\[(\d+)\]/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(propPath)) !== null) {
    if (match[1] !== undefined) {
      tokens.push(match[1])
    } else if (match[2] !== undefined) {
      tokens.push(Number(match[2]))
    }
  }

  let current: unknown = props
  for (const token of tokens) {
    if (current == null || typeof current !== 'object') return []
    current = (current as Record<string | number, unknown>)[token]
  }

  if (Array.isArray(current)) {
    return current as ComponentData[]
  }

  return []
}

/**
 * Pure function: retrieves the array of items in the specified zone.
 * Supports root zone, data.zones, nested slot props (e.g. Container.items),
 * and array-item slots (e.g. Tabs.items[0].content).
 */
export function getZoneItems(
  data: Data | null | undefined,
  zoneCompound?: string | null,
): ComponentData[] {
  if (!data) return []

  if (isRootZone(zoneCompound)) {
    return Array.isArray(data.content) ? (data.content as ComponentData[]) : []
  }

  // Check data.zones dictionary
  if (data.zones && typeof data.zones === 'object' && zoneCompound) {
    const fromZones = data.zones[zoneCompound]
    if (Array.isArray(fromZones)) {
      return fromZones as ComponentData[]
    }
  }

  if (!zoneCompound) return []

  // Deconstruct parentId:propPath
  const colonIndex = zoneCompound.indexOf(':')
  if (colonIndex === -1) return []
  const parentId = zoneCompound.slice(0, colonIndex)
  const propPath = zoneCompound.slice(colonIndex + 1)

  // Find parent item in data
  let parentItem: ComponentData | undefined
  walkPuckItemsSync(data, (item) => {
    if (String(item.props?.id) === parentId) {
      parentItem = item as unknown as ComponentData
    }
  })

  if (!parentItem || !parentItem.props) return []

  return resolvePropPath(parentItem.props as Record<string, unknown>, propPath)
}

/**
 * Pure function: calculates move capabilities (canMoveUp, canMoveDown, total items)
 * for a given item selector in data.
 */
export function getMoveStatus(
  data: Data | null | undefined,
  selector: { index: number; zone?: string } | null | undefined,
  /** EB-13ac: `permissions.drag` of the block – a locked block (e.g. homepage Hero) never moves. */
  canDrag = true,
): MoveStatus {
  if (!selector || selector.index < 0 || !data) {
    return {
      canMoveUp: false,
      canMoveDown: false,
      totalItems: 0,
      currentIndex: -1,
      zone: 'root:default-zone',
    }
  }

  const zone = selector.zone || 'root:default-zone'
  const items = getZoneItems(data, zone)
  const totalItems = items.length
  const currentIndex = selector.index

  return {
    canMoveUp: canDrag && currentIndex > 0,
    canMoveDown: canDrag && currentIndex >= 0 && currentIndex < totalItems - 1,
    totalItems,
    currentIndex,
    zone,
  }
}

/**
 * Pure function: returns destination index for Move Up, or null if cannot move up.
 */
export function getMoveUpIndex(currentIndex: number): number | null {
  if (currentIndex <= 0) return null
  return currentIndex - 1
}

/**
 * Pure function: returns destination index for Move Down, or null if cannot move down.
 */
export function getMoveDownIndex(currentIndex: number, totalItems: number): number | null {
  if (currentIndex < 0 || currentIndex >= totalItems - 1) return null
  return currentIndex + 1
}

/**
 * Pure function: determines whether a keyboard shortcut should be processed or ignored.
 * Returns false when the target or activeElement is an input, textarea, select,
 * contentEditable element, or inside a rich text editor.
 */
export function shouldHandleBlockShortcut(
  target: EventTarget | null,
  activeElement?: Element | null,
): boolean {
  const elementsToCheck = [target, activeElement]

  for (const item of elementsToCheck) {
    if (!item || !(item instanceof Element)) continue

    const tagName = item.tagName.toUpperCase()
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return false
    }

    if (item.getAttribute('contenteditable') === 'true') {
      return false
    }

    // Check ancestors for editable containers or rich text editors
    if (
      item.closest(
        // EB-13ac: also dialogs / menus – Esc must close them and Delete must not remove the block
        // while focus sits on a dialog button.
        'input, textarea, select, [contenteditable="true"], .ProseMirror, [data-lexical-editor], [role="textbox"], [role="searchbox"], [role="combobox"], [role="dialog"], [role="alertdialog"], [aria-modal="true"], [role="menu"]',
      )
    ) {
      return false
    }
  }

  return true
}
