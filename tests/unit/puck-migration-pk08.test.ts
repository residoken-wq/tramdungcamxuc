import { describe, expect, it } from 'vitest'
import type { Data } from '@puckeditor/core'
import { migrateHeroTwoEntriesV2ToV3, normalizePuckData } from '@/puck/migrations'
import { CHILD_BLOCK_TYPES } from '@/puck/constants'
import { puckConfig } from '@/puck/config'

const v2Hero = {
  type: 'HeroTwoEntries',
  props: {
    id: 'hero-1',
    version: 2,
    titleLine1: 'Dòng 1',
    titleLine2: 'Dòng 2',
    bgColor: 'deep-navy',
    entry1: {
      groupLabel: 'CHO CÁ NHÂN',
      label: 'Cá nhân',
      description: 'Mô tả 1',
      buttonText: 'Nút 1',
      buttonLink: '/a',
      buttonStyle: 'solid',
    },
    entry2: {
      groupLabel: '',
      label: 'Tổ chức',
      description: 'Mô tả 2',
      buttonText: 'Nút 2',
      buttonLink: '/b',
    },
  },
}

function data(content: unknown[], zones: Record<string, unknown[]> = {}): Data {
  return { root: { props: {} }, content, zones } as unknown as Data
}

describe('PK-08: HeroTwoEntries v2 -> v3 (entries slot of EntryCard)', () => {
  it('turns entry1/entry2 into two EntryCard children, keeping every text', () => {
    const out = migrateHeroTwoEntriesV2ToV3(data([v2Hero]))
    const props = out.content[0].props as Record<string, unknown>
    expect(props.version).toBe(3)
    expect(props.titleSize).toBe('md')
    expect(props.entry1).toBeUndefined()
    expect(props.entry2).toBeUndefined()
    const entries = props.entries as Array<{ type: string; props: Record<string, unknown> }>
    expect(entries.map((e) => e.type)).toEqual(['EntryCard', 'EntryCard'])
    expect(entries[0].props).toMatchObject({
      id: 'hero-1-entry-0',
      groupLabel: 'CHO CÁ NHÂN',
      label: 'Cá nhân',
      description: 'Mô tả 1',
      buttonText: 'Nút 1',
      buttonLink: '/a',
      buttonStyle: 'solid',
      badgeColor: 'soft-pink',
    })
    expect(entries[1].props).toMatchObject({
      id: 'hero-1-entry-1',
      label: 'Tổ chức',
      buttonStyle: 'outline',
      badgeColor: 'lavender-mist',
    })
  })

  it('migrates v1 seed data through the whole chain and inside Columns / zones', () => {
    const v1 = { ...v2Hero, props: { ...v2Hero.props, version: 1 } }
    const columns = { type: 'Columns', props: { id: 'col', col1: [v1], col2: [], col3: [] } }
    const out = normalizePuckData(data([columns], { 'x:zone': [v1] }))
    const nested = (out.content[0].props as { col1: Array<{ props: Record<string, unknown> }> })
      .col1[0].props
    expect(nested.version).toBe(3)
    expect(Array.isArray(nested.entries)).toBe(true)
    const zoned = (out.zones?.['x:zone']?.[0]?.props ?? {}) as Record<string, unknown>
    expect(zoned.version).toBe(3)
  })

  it('drops empty legacy entries and is idempotent', () => {
    const hero = { ...v2Hero, props: { ...v2Hero.props, entry2: { label: '' } } }
    const once = migrateHeroTwoEntriesV2ToV3(data([hero]))
    expect((once.content[0].props as { entries: unknown[] }).entries).toHaveLength(1)
    expect(migrateHeroTwoEntriesV2ToV3(once)).toEqual(once)
  })

  it('EntryCard is a child-only block allowed only in the hero slot', () => {
    expect(CHILD_BLOCK_TYPES).toContain('EntryCard')
    expect(puckConfig.components.EntryCard.permissions?.insert).toBe(false)
    const slot = puckConfig.components.HeroTwoEntries.fields?.entries as { allow?: string[] }
    expect(slot.allow).toEqual(['EntryCard'])
  })
})
