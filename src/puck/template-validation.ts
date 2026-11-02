import type { ComponentData, Config, Data } from '@puckeditor/core'
import { isPuckItem } from './walk'
import { vi } from '@/lib/i18n/vi'

export const MAX_TEMPLATE_BYTES = 200 * 1024 // 200 KB
export const MAX_TEMPLATE_BLOCKS = 200

export type TemplateValidationResult =
  | { success: true; blockCount: number }
  | {
      success: false
      code: 'TOO_LARGE' | 'INVALID_PAYLOAD' | 'UNKNOWN_TYPE' | 'TOO_MANY_BLOCKS'
      message: string
    }

export function generateSafeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Validates untrusted template puckData on server or client.
 * Enforces byte size <= 200 KB, total block count <= 200, valid structure, and registered block types.
 */
export function validateTemplatePuckData(
  puckData: unknown,
  kind: 'section' | 'page',
  config?: Config,
): TemplateValidationResult {
  if (!puckData || typeof puckData !== 'object') {
    return {
      success: false,
      code: 'INVALID_PAYLOAD',
      message: vi.eb08.invalidData,
    }
  }

  let rawString: string
  try {
    rawString = JSON.stringify(puckData)
  } catch {
    return {
      success: false,
      code: 'INVALID_PAYLOAD',
      message: vi.eb08.invalidData,
    }
  }

  if (rawString.length > MAX_TEMPLATE_BYTES) {
    return {
      success: false,
      code: 'TOO_LARGE',
      message: vi.eb08.tooLarge,
    }
  }

  let count = 0

  function checkItem(item: unknown): TemplateValidationResult | null {
    if (!isPuckItem(item)) {
      return {
        success: false,
        code: 'INVALID_PAYLOAD',
        message: vi.eb08.invalidData,
      }
    }

    count++
    if (count > MAX_TEMPLATE_BLOCKS) {
      return {
        success: false,
        code: 'TOO_MANY_BLOCKS',
        message: vi.eb08.tooManyBlocks,
      }
    }

    if (config?.components && !config.components[item.type]) {
      return {
        success: false,
        code: 'UNKNOWN_TYPE',
        message: `${vi.eb08.invalidData}: ${item.type}`,
      }
    }

    // Recursively check nested slot arrays in props
    const props = item.props || {}
    for (const [key, value] of Object.entries(props)) {
      if (key === 'id') continue
      if (Array.isArray(value)) {
        for (const el of value) {
          if (isPuckItem(el)) {
            const err = checkItem(el)
            if (err) return err
          } else if (el && typeof el === 'object') {
            for (const subVal of Object.values(el as Record<string, unknown>)) {
              if (Array.isArray(subVal)) {
                for (const subEl of subVal) {
                  if (isPuckItem(subEl)) {
                    const err = checkItem(subEl)
                    if (err) return err
                  }
                }
              }
            }
          }
        }
      } else if (value && typeof value === 'object' && !isPuckItem(value)) {
        for (const subVal of Object.values(value as Record<string, unknown>)) {
          if (Array.isArray(subVal)) {
            for (const subEl of subVal) {
              if (isPuckItem(subEl)) {
                const err = checkItem(subEl)
                if (err) return err
              }
            }
          }
        }
      }
    }

    return null
  }

  if (kind === 'section') {
    if (!isPuckItem(puckData)) {
      return {
        success: false,
        code: 'INVALID_PAYLOAD',
        message: vi.eb08.invalidData,
      }
    }
    const err = checkItem(puckData)
    if (err) return err
    return { success: true, blockCount: count }
  }

  if (kind === 'page') {
    const pageObj = puckData as Partial<Data>
    if (!Array.isArray(pageObj.content)) {
      return {
        success: false,
        code: 'INVALID_PAYLOAD',
        message: vi.eb08.invalidData,
      }
    }
    for (const item of pageObj.content) {
      const err = checkItem(item)
      if (err) return err
    }
    return { success: true, blockCount: count }
  }

  return {
    success: false,
    code: 'INVALID_PAYLOAD',
    message: vi.eb08.invalidData,
  }
}

/**
 * Recursively clones a ComponentData giving brand new UUIDs to the block and every nested block.
 */
export function remapBlockIds(item: ComponentData): ComponentData {
  const originalProps = item.props || {}
  const newProps: Record<string, unknown> = {
    ...originalProps,
    id: generateSafeUUID(),
  }

  for (const [key, value] of Object.entries(originalProps)) {
    if (key === 'id') continue
    if (Array.isArray(value)) {
      newProps[key] = value.map((el) => {
        if (isPuckItem(el)) {
          return remapBlockIds(el as ComponentData)
        } else if (el && typeof el === 'object') {
          const clonedEl: Record<string, unknown> = { ...(el as Record<string, unknown>) }
          for (const [subKey, subVal] of Object.entries(clonedEl)) {
            if (Array.isArray(subVal)) {
              clonedEl[subKey] = subVal.map((subEl) => {
                if (isPuckItem(subEl)) {
                  return remapBlockIds(subEl as ComponentData)
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
      const clonedObj: Record<string, unknown> = { ...(value as Record<string, unknown>) }
      for (const [subKey, subVal] of Object.entries(clonedObj)) {
        if (Array.isArray(subVal)) {
          clonedObj[subKey] = subVal.map((subEl) => {
            if (isPuckItem(subEl)) {
              return remapBlockIds(subEl as ComponentData)
            }
            return subEl
          })
        }
      }
      newProps[key] = clonedObj
    }
  }

  return {
    type: item.type,
    props: newProps as ComponentData['props'],
  }
}

/**
 * Regenerates UUIDs for all blocks across an entire page Data object.
 */
export function remapPageBlockIds(data: Data): Data {
  const content = Array.isArray(data.content)
    ? data.content.map((item) => (isPuckItem(item) ? remapBlockIds(item as ComponentData) : item))
    : []

  return {
    ...data,
    content,
    root: data.root || {},
  }
}
