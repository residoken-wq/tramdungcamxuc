import type { Data } from '@puckeditor/core'
import { FIXED_JOURNEY_STEPS } from '@/components/site/JourneySteps'

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; id?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'JourneySteps') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 3) {
      const parentId =
        typeof props.id === 'string' && props.id
          ? props.id
          : typeof rawItem.id === 'string' && rawItem.id
            ? rawItem.id
            : 'journey'

      const numericHighlight = Number(props.highlightStep) || 0

      // Luôn sinh 5 Step từ FIXED_JOURNEY_STEPS
      const steps = FIXED_JOURNEY_STEPS.map((fixed, index) => {
        const stepNum = index + 1
        const subtitleKey = `step${stepNum}Subtitle`
        const descKey = `step${stepNum}Description`
        const subtitle = typeof props[subtitleKey] === 'string' ? (props[subtitleKey] as string) : ''
        const rawDesc = props[descKey]
        const description =
          typeof rawDesc === 'string' && rawDesc.trim().length > 0
            ? rawDesc
            : fixed.defaultDesc
        const highlight = numericHighlight === stepNum

        return {
          type: 'Step',
          props: {
            id: `${parentId}-step-${index}`,
            name: fixed.name,
            subname: fixed.subname,
            subtitle,
            description,
            highlight,
            nameColor: highlight ? 'white' : 'deep-navy',
            nameSize: 'md',
            descColor: highlight ? 'white' : 'deep-navy',
            descSize: 'md',
            align: 'left',
          },
        }
      })

      // Clean up legacy step fields
      const {
        highlightStep: _h,
        step1Subtitle: _s1,
        step2Subtitle: _s2,
        step3Subtitle: _s3,
        step4Subtitle: _s4,
        step5Subtitle: _s5,
        step1Description: _d1,
        step2Description: _d2,
        step3Description: _d3,
        step4Description: _d4,
        step5Description: _d5,
        ...restProps
      } = props

      newItem = {
        ...newItem,
        props: {
          ...restProps,
          version: 3,
          columns: 5,
          steps,
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
 * Migration v2 -> v3 for JourneySteps:
 * Converts 15 fixed step fields and highlightStep into draggable `Step` child blocks slot.
 */
export function migrateJourneyStepsV2ToV3(data: Data): Data {
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
