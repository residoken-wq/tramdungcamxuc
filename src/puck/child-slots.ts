import type { Config } from '@puckeditor/core'

export interface SingleChildSlotInfo {
  parentType: string
  slotName: string
  childType: string
}

/**
 * Reads the Puck configuration and finds all components that have a slot field
 * allowing exactly ONE child component type.
 *
 * Excludes multi-type slot containers like Container, Columns, FreeSection,
 * AccordionWidget, and TabsWidget.
 */
export function getSingleChildSlots(config: Config): SingleChildSlotInfo[] {
  if (!config?.components) return []

  const results: SingleChildSlotInfo[] = []

  for (const [parentType, componentConfig] of Object.entries(config.components)) {
    if (!componentConfig || typeof componentConfig !== 'object') continue
    const fields = componentConfig.fields
    if (!fields || typeof fields !== 'object') continue

    for (const [slotName, fieldConfig] of Object.entries(fields)) {
      if (!fieldConfig || typeof fieldConfig !== 'object') continue
      const field = fieldConfig as { type?: string; allow?: unknown }
      if (
        field.type === 'slot' &&
        Array.isArray(field.allow) &&
        field.allow.length === 1 &&
        typeof field.allow[0] === 'string'
      ) {
        results.push({
          parentType,
          slotName,
          childType: field.allow[0],
        })
      }
    }
  }

  return results
}

/**
 * Returns single child slot info for a given parent component type, if applicable.
 */
export function getChildSlotForParent(
  config: Config,
  parentType: string,
): SingleChildSlotInfo | undefined {
  const slots = getSingleChildSlots(config)
  return slots.find((s) => s.parentType === parentType)
}

/**
 * Returns parent slot info for a given child component type, if applicable.
 */
export function getParentForChildType(
  config: Config,
  childType: string,
): SingleChildSlotInfo | undefined {
  const slots = getSingleChildSlots(config)
  return slots.find((s) => s.childType === childType)
}
