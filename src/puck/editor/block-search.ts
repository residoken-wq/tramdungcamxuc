/**
 * Pure functions for searching and filtering Puck editor blocks.
 * Part of EB-03 (Elementor-style editor frame).
 */

export function normalizeVi(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()
}

export type CategoryDefinition = {
  title?: string
  components?: string[]
  visible?: boolean
  defaultExpanded?: boolean
}

export type CategoriesMap = Record<string, CategoryDefinition>

export type FilteredCategory = {
  id: string
  title: string
  components: string[]
  defaultExpanded?: boolean
}

type LabelsInput = Record<string, string> | ((key: string) => string | undefined)

function getBlockLabel(labels: LabelsInput, key: string): string {
  if (typeof labels === 'function') {
    return labels(key) || key
  }
  return labels[key] || key
}

/**
 * Filter block categories based on a search query.
 * Matches on both the technical component key and the localized display label.
 * Drops empty categories and groups any unassigned components into "Khác".
 */
export function filterBlockCategories(
  categories: CategoriesMap,
  labels: LabelsInput,
  query: string,
  allComponentKeys?: string[],
): FilteredCategory[] {
  const normQuery = normalizeVi(query)
  const isSearchActive = normQuery.length > 0

  // 1. Collect all categorized components to find unassigned ones
  const assigned = new Set<string>()
  const rawList: FilteredCategory[] = []

  for (const [id, cat] of Object.entries(categories)) {
    if (cat.visible === false && id !== 'other') continue
    const components = Array.isArray(cat.components) ? cat.components : []
    components.forEach((c) => assigned.add(c))

    rawList.push({
      id,
      title: cat.title || id,
      components: [...components],
      defaultExpanded: cat.defaultExpanded,
    })
  }

  // 2. Identify unassigned components and add to "Khác" (if any)
  if (allComponentKeys && allComponentKeys.length > 0) {
    const unassigned = allComponentKeys.filter((key) => !assigned.has(key))
    if (unassigned.length > 0) {
      const existingOther = rawList.find((c) => c.id === 'other')
      if (existingOther) {
        // Merge into existing other category and ensure title
        const existingSet = new Set(existingOther.components)
        for (const u of unassigned) {
          if (!existingSet.has(u)) existingOther.components.push(u)
        }
        if (!existingOther.title || existingOther.title === 'other') {
          existingOther.title = 'Khác'
        }
      } else {
        rawList.push({
          id: 'other',
          title: 'Khác',
          components: unassigned,
          defaultExpanded: false,
        })
      }
    }
  }

  // 3. If query is empty, return categories that have components (omit completely empty ones)
  if (!isSearchActive) {
    return rawList.filter((cat) => cat.components.length > 0)
  }

  // 4. Filter categories by matching technical name or display label
  const result: FilteredCategory[] = []

  for (const cat of rawList) {
    const matchedComponents = cat.components.filter((compKey) => {
      const label = getBlockLabel(labels, compKey)
      const normKey = normalizeVi(compKey)
      const normLabel = normalizeVi(label)
      return normKey.includes(normQuery) || normLabel.includes(normQuery)
    })

    if (matchedComponents.length > 0) {
      result.push({
        ...cat,
        components: matchedComponents,
      })
    }
  }

  return result
}
