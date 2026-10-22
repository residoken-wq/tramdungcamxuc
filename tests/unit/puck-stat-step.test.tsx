/* eslint-disable @typescript-eslint/no-explicit-any -- loose types for resolveFields test params */
import { describe, expect, it } from 'vitest'
import { StatBlock } from '@/puck/blocks/Stat'
import { StepBlock } from '@/puck/blocks/Step'
import { puckConfig } from '@/puck/config'
import { getChildRealBg } from '@/lib/brand/format-classes'

const BRAND_HEX_MAP = {
  'deep-navy': '#280A60',
  'bright-magenta': '#BC039E',
  'accent-pink': '#EF3B83',
  'soft-pink': '#FDE6F6',
  'lavender-mist': '#E9DDF9',
  'mint-haze': '#D9F1EA',
  'butter-cream': '#F6E9B8',
  'warm-ivory': '#FAF7F4',
  white: '#FFFFFF',
} as const

function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const [rLin, gLin, bLin] = [r, g, b].map((val) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4),
  )

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('PK-03: Stat & Step Child Blocks - Unit Tests', () => {
  describe('WCAG AA Contrast on real background (getChildRealBg & resolveFields)', () => {
    it('getChildRealBg determines correct real background for Stat and Step', () => {
      // Step with isHighlighted = true -> deep-navy regardless of parent
      expect(getChildRealBg(null, { highlight: true })).toBe('deep-navy')
      expect(
        getChildRealBg(
          { type: 'JourneySteps', props: { bgColor: 'warm-ivory' } },
          { highlight: true },
        ),
      ).toBe('deep-navy')

      // Step normal (not highlighted) in JourneySteps on warm-ivory -> white
      expect(
        getChildRealBg(
          { type: 'JourneySteps', props: { bgColor: 'warm-ivory' } },
          { highlight: false },
        ),
      ).toBe('white')

      // Parent deep-navy -> deep-navy
      expect(
        getChildRealBg(
          { type: 'StatsBar', props: { bgColor: 'deep-navy' } },
          { highlight: false },
        ),
      ).toBe('deep-navy')
      expect(
        getChildRealBg(
          { type: 'JourneySteps', props: { bgColor: 'deep-navy' } },
          { highlight: false },
        ),
      ).toBe('deep-navy')

      // Fallbacks
      expect(getChildRealBg(null)).toBe('warm-ivory')
      expect(getChildRealBg(undefined)).toBe('warm-ivory')
    })

    it('Stat resolveFields returns WCAG AA compliant colors for light and navy parent backgrounds', async () => {
      if (typeof StatBlock.resolveFields !== 'function') {
        throw new Error('StatBlock.resolveFields must be defined')
      }

      // Case 1: parent StatsBar on deep-navy
      const parentNavy = {
        type: 'StatsBar',
        props: { bgColor: 'deep-navy' },
      }
      const fieldsNavy = await StatBlock.resolveFields(
        { props: { id: 'test-stat', valueSize: 'md', labelSize: 'md' } },
        { fields: StatBlock.fields, parent: parentNavy } as any,
      )

      const valueColorsNavy = (fieldsNavy.valueColor as any).options.map((o: any) => o.value)
      const labelColorsNavy = (fieldsNavy.labelColor as any).options.map((o: any) => o.value)

      expect(valueColorsNavy).toContain('white')
      expect(valueColorsNavy).toContain('soft-pink')
      expect(valueColorsNavy).not.toContain('deep-navy')

      const navyHex = BRAND_HEX_MAP['deep-navy']
      for (const colorName of valueColorsNavy) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, navyHex)
        expect(ratio, `Color ${colorName} on deep-navy should meet AA`).toBeGreaterThanOrEqual(4.5)
      }
      for (const colorName of labelColorsNavy) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, navyHex)
        expect(ratio, `Color ${colorName} on deep-navy should meet AA`).toBeGreaterThanOrEqual(4.5)
      }

      // Case 2: parent StatsBar on warm-ivory
      const parentIvory = {
        type: 'StatsBar',
        props: { bgColor: 'warm-ivory' },
      }
      const fieldsIvory = await StatBlock.resolveFields(
        { props: { id: 'test-stat', valueSize: 'md', labelSize: 'md' } },
        { fields: StatBlock.fields, parent: parentIvory } as any,
      )

      const valueColorsIvory = (fieldsIvory.valueColor as any).options.map((o: any) => o.value)
      const labelColorsIvory = (fieldsIvory.labelColor as any).options.map((o: any) => o.value)

      expect(valueColorsIvory).toContain('deep-navy')
      expect(valueColorsIvory).not.toContain('white')
      expect(valueColorsIvory).not.toContain('warm-ivory')

      const ivoryHex = BRAND_HEX_MAP['warm-ivory']
      // valueColor is large display text (Anton 36px+) -> WCAG AA >= 3.0
      for (const colorName of valueColorsIvory) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, ivoryHex)
        expect(ratio, `Color ${colorName} on warm-ivory (large) should meet AA 3.0`).toBeGreaterThanOrEqual(3.0)
      }
      // labelColor is normal UI text -> WCAG AA >= 4.5
      for (const colorName of labelColorsIvory) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, ivoryHex)
        expect(ratio, `Color ${colorName} on warm-ivory should meet AA 4.5`).toBeGreaterThanOrEqual(4.5)
      }
    })

    it('Step resolveFields adapts to highlight and parent deep-navy with AA compliance', async () => {
      if (typeof StepBlock.resolveFields !== 'function') {
        throw new Error('StepBlock.resolveFields must be defined')
      }

      // Case 1: Highlighted step (real bg is deep-navy)
      const fieldsHighlight = await StepBlock.resolveFields(
        { props: { id: 'test-step', highlight: true } },
        {
          fields: StepBlock.fields,
          parent: { type: 'JourneySteps', props: { bgColor: 'warm-ivory' } },
        } as any,
      )

      const nameColorsHighlight = (fieldsHighlight.nameColor as any).options.map(
        (o: any) => o.value,
      )
      const descColorsHighlight = (fieldsHighlight.descColor as any).options.map(
        (o: any) => o.value,
      )

      expect(nameColorsHighlight).toContain('white')
      expect(nameColorsHighlight).toContain('soft-pink')
      expect(nameColorsHighlight).not.toContain('deep-navy')

      const navyHex = BRAND_HEX_MAP['deep-navy']
      for (const colorName of nameColorsHighlight) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        const ratio = getContrastRatio(textHex, navyHex)
        expect(ratio, `Color ${colorName} on highlighted step should meet AA`).toBeGreaterThanOrEqual(
          4.5,
        )
      }
      for (const colorName of descColorsHighlight) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        const ratio = getContrastRatio(textHex, navyHex)
        expect(ratio, `Color ${colorName} on highlighted step should meet AA`).toBeGreaterThanOrEqual(
          4.5,
        )
      }

      // Case 2: Normal step on warm-ivory JourneySteps (real bg is white)
      const fieldsNormal = await StepBlock.resolveFields(
        { props: { id: 'test-step', highlight: false } },
        {
          fields: StepBlock.fields,
          parent: { type: 'JourneySteps', props: { bgColor: 'warm-ivory' } },
        } as any,
      )

      const nameColorsNormal = (fieldsNormal.nameColor as any).options.map((o: any) => o.value)
      const descColorsNormal = (fieldsNormal.descColor as any).options.map((o: any) => o.value)

      expect(nameColorsNormal).toContain('deep-navy')
      expect(nameColorsNormal).not.toContain('white')
      expect(nameColorsNormal).not.toContain('warm-ivory')

      const whiteHex = BRAND_HEX_MAP['white']
      for (const colorName of nameColorsNormal) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        const ratio = getContrastRatio(textHex, whiteHex)
        // name is step name heading
        expect(ratio, `Color ${colorName} on white step card should meet AA`).toBeGreaterThanOrEqual(
          3.0,
        )
      }
      for (const colorName of descColorsNormal) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        const ratio = getContrastRatio(textHex, whiteHex)
        expect(ratio, `Color ${colorName} on white step card should meet AA`).toBeGreaterThanOrEqual(
          4.5,
        )
      }
    })
  })

  describe('No free text inputs: presets only', () => {
    it('StatBlock only uses select dropdowns for colors and sizes', () => {
      const fields = StatBlock.fields as Record<string, any>

      expect(fields.valueColor.type).toBe('select')
      expect(fields.labelColor.type).toBe('select')
      expect(fields.valueSize.type).toBe('select')
      expect(fields.labelSize.type).toBe('select')
      expect(fields.icon.type).toBe('select')

      // Content fields are text
      expect(fields.value.type).toBe('text')
      expect(fields.label.type).toBe('text')
      expect(fields.description.type).toBe('text')
    })

    it('StepBlock only uses select dropdowns for styling and layout options', () => {
      const fields = StepBlock.fields as Record<string, any>

      expect(fields.nameColor.type).toBe('select')
      expect(fields.descColor.type).toBe('select')
      expect(fields.nameSize.type).toBe('select')
      expect(fields.descSize.type).toBe('select')
      expect(fields.highlight.type).toBe('select')
      expect(fields.align.type).toBe('select')

      // Content fields are text / textarea
      expect(fields.name.type).toBe('text')
      expect(fields.subname.type).toBe('text')
      expect(fields.subtitle.type).toBe('text')
      expect(fields.description.type).toBe('textarea')
    })
  })

  describe('Sidebar visibility & Canvas restrictions', () => {
    it('Stat and Step are not in any visible category on the sidebar', () => {
      const categories = puckConfig.categories || {}

      for (const [key, category] of Object.entries(categories)) {
        if (key === 'other') continue
        const componentList = category.components || []
        expect(componentList).not.toContain('Stat')
        expect(componentList).not.toContain('Step')
      }

      expect(categories.other?.visible).toBe(false)
    })

    it('StatBlock and StepBlock have permissions.insert = false', () => {
      expect(StatBlock.permissions?.insert).toBe(false)
      expect(StepBlock.permissions?.insert).toBe(false)
    })

    it('Columns.col1, col2, col3 disallow Stat and Step', () => {
      const columnsBlock = puckConfig.components.Columns as any
      expect(columnsBlock).toBeDefined()

      expect(columnsBlock.fields.col1.disallow).toContain('Stat')
      expect(columnsBlock.fields.col1.disallow).toContain('Step')
      expect(columnsBlock.fields.col2.disallow).toContain('Stat')
      expect(columnsBlock.fields.col2.disallow).toContain('Step')
      expect(columnsBlock.fields.col3.disallow).toContain('Stat')
      expect(columnsBlock.fields.col3.disallow).toContain('Step')
    })
  })
})
