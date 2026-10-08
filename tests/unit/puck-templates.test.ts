import { describe, it, expect } from 'vitest'
import { puckConfig } from '@/puck/config'
import { applyPuckMigrations } from '@/puck/migrations'
import {
  pageTemplates,
  pageTemplateList,
  getTemplateData,
  campaignTemplate,
  serviceTemplate,
  workshopTemplate,
  eventTemplate,
} from '@/puck/templates'

describe('Puck Page Templates (T1-04)', () => {
  const templates = [
    { key: 'campaign', name: 'Landing chiến dịch', data: campaignTemplate },
    { key: 'service', name: 'Trang dịch vụ', data: serviceTemplate },
    { key: 'workshop', name: 'Trang workshop', data: workshopTemplate },
    { key: 'event', name: 'Trang sự kiện', data: eventTemplate },
  ]

  it('exports all 4 page templates with proper metadata and Vietnamese labels', () => {
    expect(pageTemplateList).toHaveLength(4)
    expect(Object.keys(pageTemplates)).toEqual(['campaign', 'service', 'workshop', 'event'])

    for (const t of templates) {
      expect(pageTemplates[t.key as keyof typeof pageTemplates].label).toBe(t.name)
      expect(pageTemplates[t.key as keyof typeof pageTemplates].data).toBe(t.data)
    }
  })

  it('every component type in templates exists in puckConfig.components', () => {
    const validComponentTypes = new Set(Object.keys(puckConfig.components))

    for (const { key, data } of templates) {
      expect(Array.isArray(data.content)).toBe(true)
      expect(data.content.length).toBeGreaterThan(0)

      for (const item of data.content) {
        expect(
          validComponentTypes.has(item.type),
          `Template ${key} contains invalid component type: ${item.type}`,
        ).toBe(true)
        expect(item.props).toBeDefined()
        expect(typeof item.props.id).toBe('string')
      }
    }
  })

  it('each template passes through applyPuckMigrations without modification', () => {
    for (const { data } of templates) {
      const migrated = applyPuckMigrations(data)
      expect(migrated).toEqual(data)
    }
  })

  it('templates do not contain author name "Hana" (case-insensitive)', () => {
    for (const { key, data } of templates) {
      const jsonString = JSON.stringify(data)
      expect(
        jsonString.toLowerCase().includes('hana'),
        `Template "${key}" should not contain "Hana"`,
      ).toBe(false)
    }
  })

  it('templates do not contain hardcoded currency prices or amounts', () => {
    // Check against patterns like 149.000, 178.000, 250.000, "VNĐ", " đồng", standalone "đ"
    const pricePatterns = [/\d{2,3}\.\d{3}/, /VNĐ/i, /\b\d+\s*đ\b/i, /\bđồng\b/i]

    for (const { key, data } of templates) {
      const jsonString = JSON.stringify(data)
      for (const pattern of pricePatterns) {
        expect(
          pattern.test(jsonString),
          `Template "${key}" contains price-like pattern matching ${pattern}`,
        ).toBe(false)
      }
    }
  })

  it('getTemplateData clones data and optionally sets page title', () => {
    const customTitle = 'Chiến dịch Mùa Thu 2026'
    const result = getTemplateData('campaign', customTitle)
    expect(result).not.toBeNull()
    expect(result?.root.props?.title).toBe(customTitle)

    // Ensure it is a clone, not mutating original template
    expect(campaignTemplate.root.props?.title).toBe('Landing chiến dịch')

    const unknownResult = getTemplateData('non-existent')
    expect(unknownResult).toBeNull()
  })
})
