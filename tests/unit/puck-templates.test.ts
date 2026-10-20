import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Render } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'
import { applyPuckMigrations } from '@/puck/migrations'
import { validatePageLockedBlocks } from '@/puck/locks'
import {
  pageTemplates,
  pageTemplateList,
  getTemplateData,
  homeV2Template,
  journeyTemplate,
  aboutTemplate,
  coachTemplate,
  contactTemplate,
  communityTemplate,
  businessTemplate,
  campaignTemplate,
  serviceTemplate,
  workshopTemplate,
  eventTemplate,
} from '@/puck/templates'

describe('Puck Page Templates (SM-07, SM-08 & T1-04)', () => {
  const allTemplates = [
    { key: 'home-v2', name: 'Trang chủ v2', data: homeV2Template },
    { key: 'journey', name: 'Trang lộ trình', data: journeyTemplate },
    { key: 'about', name: 'Trang Về Trạm', data: aboutTemplate },
    { key: 'coach', name: 'Trang Coach 1:1', data: coachTemplate },
    { key: 'contact', name: 'Trang Liên hệ', data: contactTemplate },
    { key: 'community', name: 'Trang Cộng đồng', data: communityTemplate },
    { key: 'business', name: 'Trang Doanh nghiệp', data: businessTemplate },
    { key: 'campaign', name: 'Landing chiến dịch', data: campaignTemplate },
    { key: 'service', name: 'Trang dịch vụ', data: serviceTemplate },
    { key: 'workshop', name: 'Trang workshop', data: workshopTemplate },
    { key: 'event', name: 'Trang sự kiện', data: eventTemplate },
  ]

  const sitemapV2Templates = allTemplates.slice(0, 7)

  it('exports all 11 page templates with proper metadata and Vietnamese labels', () => {
    expect(pageTemplateList).toHaveLength(11)
    expect(Object.keys(pageTemplates)).toEqual([
      'home-v2',
      'journey',
      'about',
      'coach',
      'contact',
      'community',
      'business',
      'campaign',
      'service',
      'workshop',
      'event',
    ])

    for (const t of allTemplates) {
      expect(pageTemplates[t.key as keyof typeof pageTemplates].label).toBe(t.name)
      expect(pageTemplates[t.key as keyof typeof pageTemplates].data).toBe(t.data)
      expect(t.data).toHaveProperty('content')
      expect(t.data).toHaveProperty('root')
      expect(t.data).toHaveProperty('zones')
      expect(Array.isArray(t.data.content)).toBe(true)
    }
  })

  it('every component type in all 9 templates exists in puckConfig.components', () => {
    const validComponentTypes = new Set(Object.keys(puckConfig.components))

    for (const { key, data } of allTemplates) {
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

  it('block version matches defaultProps version for each block in all 9 templates', () => {
    for (const { key, data } of allTemplates) {
      for (const item of data.content) {
        const comp = (
          puckConfig.components as Record<string, { defaultProps?: Record<string, unknown> }>
        )[item.type]
        expect(comp, `Unknown component ${item.type} in ${key}`).toBeDefined()
        const defProps = comp.defaultProps as Record<string, unknown> | undefined
        const expectedVersion = defProps?.version ?? 1
        const actualVersion = (item.props as Record<string, unknown>).version ?? 1
        expect(
          actualVersion,
          `Block ${item.type} in template ${key} has version ${actualVersion}, expected ${expectedVersion}`,
        ).toBe(expectedVersion)
      }
    }
  })

  it('each of the 9 templates passes through applyPuckMigrations without modification (idempotent)', () => {
    for (const { data } of allTemplates) {
      const migrated = applyPuckMigrations(data)
      expect(migrated).toEqual(data)
    }
  })

  it('content and zone IDs are unique within each template', () => {
    for (const { key, data } of allTemplates) {
      const seenIds = new Set<string>()
      const checkItems = (items: Array<{ props?: { id?: string } }>) => {
        for (const item of items) {
          if (item?.props?.id) {
            expect(
              seenIds.has(item.props.id),
              `Duplicate ID "${item.props.id}" in template ${key}`,
            ).toBe(false)
            seenIds.add(item.props.id)
          }
        }
      }

      checkItems(data.content)
      if (data.zones) {
        for (const zoneItems of Object.values(data.zones)) {
          if (Array.isArray(zoneItems)) {
            checkItems(zoneItems as Array<{ props?: { id?: string } }>)
          }
        }
      }
    }
  })

  it('sample copy adheres to [MẪU] convention and contains no fake data', () => {
    for (const { key, data } of allTemplates) {
      const jsonString = JSON.stringify(data)

      // No emails other than @example.com
      const emails = jsonString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
      for (const email of emails) {
        expect(
          email.toLowerCase().endsWith('@example.com'),
          `Template ${key} contains non-example email: ${email}`,
        ).toBe(true)
      }

      // No Vietnamese phone numbers
      const phoneMatches =
        jsonString.match(/(?:\+84|0)(?:3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}/g) || []
      expect(phoneMatches, `Template ${key} contains phone number`).toEqual([])
    }
  })

  it('templates do not contain author name "Hana" in sample copy', () => {
    for (const { key, data } of allTemplates) {
      for (const item of data.content) {
        const props = item.props as Record<string, unknown>
        for (const [propKey, propVal] of Object.entries(props)) {
          if (typeof propVal === 'string' && propVal.includes('[MẪU]')) {
            expect(
              propVal.toLowerCase().includes('hana'),
              `Template ${key} block ${item.type}.${propKey} contains "Hana": ${propVal}`,
            ).toBe(false)
          }
        }
      }
    }
  })

  it('templates do not contain hardcoded currency prices or amounts', () => {
    const pricePatterns = [/\d{2,3}\.\d{3}/, /VNĐ/i, /\b\d+\s*đ\b/i, /\bđồng\b/i]

    for (const { key, data } of allTemplates) {
      const jsonString = JSON.stringify(data)
      for (const pattern of pricePatterns) {
        expect(
          pattern.test(jsonString),
          `Template "${key}" contains price-like pattern matching ${pattern}`,
        ).toBe(false)
      }
    }
  })

  it('templates do not contain unconfirmed metric claims (\\d+\\+ or \\d+%) in sample copy', () => {
    const unconfirmedMetric = /\b\d+(\+|%)/
    for (const { key, data } of allTemplates) {
      const jsonString = JSON.stringify(data)
      expect(
        unconfirmedMetric.test(jsonString),
        `Template "${key}" contains unconfirmed metric claim matching \\d+\\+ or \\d+%`,
      ).toBe(false)
    }
  })

  it('home-v2 template passes locked homepage block checks (validatePageLockedBlocks)', () => {
    const res = validatePageLockedBlocks('/', homeV2Template)
    expect(res.valid).toBe(true)
    expect(res.error).toBeUndefined()
  })

  it('getTemplateData clones data and optionally sets page title', () => {
    const customTitle = 'Lộ trình chuyển mình 2026'
    const result = getTemplateData('journey', customTitle)
    expect(result).not.toBeNull()
    expect(result?.root.props?.title).toBe(customTitle)

    // Ensure it is a clone, not mutating original template
    expect(journeyTemplate.root.props?.title).toBe('Trang lộ trình')

    const unknownResult = getTemplateData('non-existent')
    expect(unknownResult).toBeNull()
  })

  describe('Server-side rendering and snapshot verification of Sitemap v2 templates', () => {
    function assertNoFunctions(obj: unknown, path = '') {
      if (obj === null || obj === undefined) return
      if (typeof obj === 'function') {
        throw new Error(`Found unexpected function at prop path: ${path}`)
      }
      if (typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          assertNoFunctions(v, path ? `${path}.${k}` : k)
        }
      }
    }

    for (const { key, data } of sitemapV2Templates) {
      it(`renders template "${key}" server-side without crashing and has no function props`, () => {
        assertNoFunctions(data.content, `${key}.content`)
        assertNoFunctions(data.root, `${key}.root`)
        assertNoFunctions(data.zones, `${key}.zones`)

        const { container } = render(React.createElement(Render, { config: puckConfig, data }))
        expect(container).toBeDefined()
        expect(container.innerHTML.length).toBeGreaterThan(0)
      })
    }
  })
})
