import type { Data } from '@puckeditor/core'

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'JourneySteps') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 2) {
      newItem = {
        ...newItem,
        props: {
          ...props,
          version: 2,
          variant: typeof props.variant === 'string' ? props.variant : 'circles',
          highlightStep:
            typeof props.highlightStep === 'number'
              ? props.highlightStep
              : typeof props.highlightStep === 'string' && !isNaN(Number(props.highlightStep))
                ? Number(props.highlightStep)
                : 0,
          step1Subtitle: typeof props.step1Subtitle === 'string' ? props.step1Subtitle : '',
          step2Subtitle: typeof props.step2Subtitle === 'string' ? props.step2Subtitle : '',
          step3Subtitle: typeof props.step3Subtitle === 'string' ? props.step3Subtitle : '',
          step4Subtitle: typeof props.step4Subtitle === 'string' ? props.step4Subtitle : '',
          step5Subtitle: typeof props.step5Subtitle === 'string' ? props.step5Subtitle : '',
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
 * Migration v1 -> v2 for JourneySteps:
 * Adds variant ('circles' default), highlightStep (0 default), and subtitles for 5 steps.
 */
export function migrateJourneyStepsV1ToV2(data: Data): Data {
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
