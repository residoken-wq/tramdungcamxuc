import type { Data } from '@puckeditor/core'

type LegacyFAQItem =
  | {
      question?: unknown
      answer?: unknown
      type?: unknown
      props?: Record<string, unknown>
    }
  | null
  | undefined

function migrateItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item

  const rawItem = item as { type?: unknown; id?: unknown; props?: Record<string, unknown> }
  let newItem = { ...rawItem }

  if (newItem.type === 'FAQ') {
    const props = newItem.props || {}
    const version = typeof props.version === 'number' ? props.version : 1
    if (version < 4) {
      const parentId =
        typeof props.id === 'string' && props.id
          ? props.id
          : typeof rawItem.id === 'string' && rawItem.id
            ? rawItem.id
            : 'faq'

      const rawItems = Array.isArray(props.items) ? props.items : []
      // Bỏ câu không có cả câu hỏi lẫn trả lời
      const validItems = rawItems.filter((i: LegacyFAQItem) => {
        if (!i || typeof i !== 'object') return false
        if (i.type === 'FaqItem') return true
        const q = typeof i.question === 'string' ? i.question.trim() : ''
        const a = typeof i.answer === 'string' ? i.answer.trim() : ''
        return Boolean(q || a)
      })

      const childItems = validItems.map((itemData: LegacyFAQItem, index: number) => {
        if (itemData && itemData.type === 'FaqItem') {
          return itemData
        }
        return {
          type: 'FaqItem',
          props: {
            id: `${parentId}-faq-${index}`,
            question: typeof itemData?.question === 'string' ? itemData.question : '',
            answer: typeof itemData?.answer === 'string' ? itemData.answer : '',
            questionColor: 'deep-navy',
            questionSize: 'md',
            answerColor: 'deep-navy',
            answerSize: 'md',
          },
        }
      })

      newItem = {
        ...newItem,
        props: {
          ...props,
          version: 4,
          source: typeof props.source === 'string' ? props.source : 'manual',
          group: typeof props.group === 'string' ? props.group : 'general',
          limit: typeof props.limit === 'number' ? props.limit : 5,
          items: childItems,
        },
      }
    }
  }

  // Recurse into nested slot arrays if present in props (e.g. Columns col1, col2, col3)
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
 * Migration v3 -> v4 for FAQ:
 * Converts legacy `items` array to slot with `FaqItem` child blocks,
 * drops empty items (without question and answer),
 * deterministic child IDs `${parentId}-faq-${i}`,
 * default colors ('deep-navy') and sizes ('md'),
 * preserves `source: 'group'` and other props.
 * Idempotent: running multiple times produces no further changes.
 */
export function migrateFAQV3ToV4(data: Data): Data {
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
