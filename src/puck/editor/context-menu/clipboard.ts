import type { ComponentData, Config } from '@puckeditor/core'
import { isPuckItem } from '@/puck/walk'
import { ROOT_DISALLOW } from '@/puck/constants'

export const CLIPBOARD_STORAGE_KEY = 'eb07:clipboard'
export const MAX_CLIPBOARD_BYTES = 200 * 1024 // 200 KB
export const MAX_PASTE_BLOCKS = 200

export type ClipboardPayload = {
  v: 1
  item: ComponentData
}

export type PasteRejectReason =
  | 'empty-clipboard'
  | 'invalid-payload'
  | 'unknown-type'
  | 'not-allowed-here'
  | 'too-large'
  | 'too-many-blocks'

export type PasteValidationResult =
  | { success: true; item: ComponentData }
  | { success: false; reason: PasteRejectReason; message?: string }

// In-memory fallback if localStorage is disabled or throws
let memoryClipboard: ClipboardPayload | null = null

function generateSafeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Copies a Puck block into the clipboard (cross-page via localStorage + memory fallback).
 */
export function copyBlock(item: ComponentData): void {
  const payload: ClipboardPayload = {
    v: 1,
    item: JSON.parse(JSON.stringify(item)),
  }
  memoryClipboard = payload

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(payload))
    }
  } catch {
    // QuotaExceededError or private browsing: keep in memory
  }
}

/**
 * Reads the current item from the clipboard (localStorage first, falling back to memory).
 */
export function readClipboard(): ClipboardPayload | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(CLIPBOARD_STORAGE_KEY)
      if (raw) {
        if (raw.length > MAX_CLIPBOARD_BYTES) return null
        const parsed = JSON.parse(raw)
        if (parsed && parsed.v === 1 && parsed.item && typeof parsed.item.type === 'string') {
          return parsed as ClipboardPayload
        }
      }
    }
  } catch {
    // Fail silently and use memory fallback
  }
  return memoryClipboard
}

/**
 * Clears the clipboard (used in tests or resets).
 */
export function clearClipboard(): void {
  memoryClipboard = null
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(CLIPBOARD_STORAGE_KEY)
    }
  } catch {
    // Fail silently
  }
}

type SlotRules = { allow?: string[]; disallow?: string[] }

/**
 * The slot field a zone points to. Zones are `root:default-zone` or `<parentId>:<slot path>`, the
 * slot path being a prop name (`items`, `col1`) or a path into an array field (`items[1].content`).
 */
function slotRules(config: Config, parentType: string | undefined, zone: string): SlotRules | null {
  if (!parentType) return null
  const component = config.components?.[parentType] as
    { fields?: Record<string, unknown> } | undefined
  const path = zone.slice(zone.indexOf(':') + 1)
  const arrayMatch = /^([A-Za-z0-9_]+)\[\d+\]\.([A-Za-z0-9_]+)$/.exec(path)
  const field = arrayMatch
    ? (component?.fields?.[arrayMatch[1]] as { arrayFields?: Record<string, unknown> } | undefined)
        ?.arrayFields?.[arrayMatch[2]]
    : component?.fields?.[path]
  if (!field || (field as { type?: string }).type !== 'slot') return null
  return field as SlotRules
}

/**
 * Whether a block type may be dropped into a zone, using the same rules as dragging: the page root
 * refuses `ROOT_DISALLOW`; a slot follows its own `allow` / `disallow`. A zone whose slot cannot be
 * found refuses everything (safer than guessing).
 */
export function isAllowedInZone(
  blockType: string,
  targetZone: string,
  parentType?: string,
  config?: Config,
): boolean {
  const isRoot = !targetZone || targetZone.startsWith('root:') || targetZone === 'default-zone'
  if (isRoot) return !ROOT_DISALLOW.includes(blockType)
  if (!config) return false
  const rules = slotRules(config, parentType, targetZone)
  if (!rules) return false
  if (rules.allow && !rules.allow.includes(blockType)) return false
  if (rules.disallow && rules.disallow.includes(blockType)) return false
  return true
}

// REVIEW-REQUIRED: Untrusted clipboard data sanitizer and deep UUID regenerator.
// This function validates block types against the Puck config, ensures zone compatibility,
// enforces max block count and size limits, and regenerates brand new UUIDs for the block
// and every nested child block across all slot depths (including array item slots like Tabs).
export function prepareForPaste(
  rawItem: unknown,
  config: Config,
  targetZone: string,
  parentType?: string,
): PasteValidationResult {
  if (!rawItem || typeof rawItem !== 'object') {
    return { success: false, reason: 'empty-clipboard' }
  }

  const rawString = JSON.stringify(rawItem)
  if (rawString.length > MAX_CLIPBOARD_BYTES) {
    return { success: false, reason: 'too-large' }
  }

  if (!isPuckItem(rawItem)) {
    return { success: false, reason: 'invalid-payload' }
  }

  const rootType = rawItem.type
  if (!config.components || !config.components[rootType]) {
    return { success: false, reason: 'unknown-type' }
  }

  if (!isAllowedInZone(rootType, targetZone, parentType, config)) {
    return { success: false, reason: 'not-allowed-here' }
  }

  let blockCount = 0

  function cloneWithNewIds(item: ComponentData, _currentParentType?: string): ComponentData {
    blockCount++
    if (blockCount > MAX_PASTE_BLOCKS) {
      throw new Error('TOO_MANY_BLOCKS')
    }

    const type = item.type
    if (!config.components || !config.components[type]) {
      throw new Error(`UNKNOWN_NESTED_TYPE:${type}`)
    }

    const originalProps = item.props || {}
    const newProps: Record<string, unknown> = {
      ...originalProps,
      id: generateSafeUUID(),
    }

    // Process nested slot arrays in props
    for (const [key, value] of Object.entries(originalProps)) {
      if (key === 'id') continue

      if (Array.isArray(value)) {
        newProps[key] = value.map((el) => {
          if (isPuckItem(el)) {
            return cloneWithNewIds(el as ComponentData, type)
          } else if (el && typeof el === 'object') {
            // Check for array items holding slots (Tabs / Accordion `items[].content`)
            const clonedEl: Record<string, unknown> = { ...(el as Record<string, unknown>) }
            for (const [subKey, subVal] of Object.entries(clonedEl)) {
              if (Array.isArray(subVal)) {
                clonedEl[subKey] = subVal.map((subEl) => {
                  if (isPuckItem(subEl)) {
                    return cloneWithNewIds(subEl as ComponentData, type)
                  }
                  return subEl
                })
              }
            }
            return clonedEl
          }
          return el
        })
      } else if (value && typeof value === 'object' && !isPuckItem(value)) {
        // Nested object with potential slots
        const clonedObj: Record<string, unknown> = { ...(value as Record<string, unknown>) }
        for (const [subKey, subVal] of Object.entries(clonedObj)) {
          if (Array.isArray(subVal)) {
            clonedObj[subKey] = subVal.map((subEl) => {
              if (isPuckItem(subEl)) {
                return cloneWithNewIds(subEl as ComponentData, type)
              }
              return subEl
            })
          }
        }
        newProps[key] = clonedObj
      }
    }

    return {
      type,
      props: newProps as ComponentData['props'],
    }
  }

  try {
    const regenerated = cloneWithNewIds(rawItem as ComponentData, parentType)
    return { success: true, item: regenerated }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'TOO_MANY_BLOCKS') {
      return { success: false, reason: 'too-many-blocks' }
    }
    if (err instanceof Error && err.message.startsWith('UNKNOWN_NESTED_TYPE:')) {
      return { success: false, reason: 'unknown-type' }
    }
    return { success: false, reason: 'invalid-payload' }
  }
}
