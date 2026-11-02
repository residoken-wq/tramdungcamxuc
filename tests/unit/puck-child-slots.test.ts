import { describe, it, expect } from 'vitest'
import { puckConfig } from '@/puck/config'
import {
  getSingleChildSlots,
  getChildSlotForParent,
  getParentForChildType,
} from '@/puck/child-slots'

describe('PK-14: getSingleChildSlots', () => {
  it('returns exactly the 9 expected single-child parent blocks', () => {
    const slots = getSingleChildSlots(puckConfig)

    const expected = [
      { parentType: 'PackageCards', slotName: 'cards', childType: 'PackageCard' },
      { parentType: 'ServiceCards', slotName: 'cards', childType: 'ServiceCard' },
      { parentType: 'IconCardGrid', slotName: 'cards', childType: 'Card' },
      { parentType: 'StatsBar', slotName: 'stats', childType: 'Stat' },
      { parentType: 'JourneySteps', slotName: 'steps', childType: 'Step' },
      { parentType: 'FAQ', slotName: 'items', childType: 'FaqItem' },
      { parentType: 'HeroTwoEntries', slotName: 'entries', childType: 'EntryCard' },
      { parentType: 'TwoPathCards', slotName: 'paths', childType: 'PathCard' },
      { parentType: 'VisionMission', slotName: 'cards', childType: 'VisionCard' },
    ]

    expect(slots).toHaveLength(expected.length)

    for (const exp of expected) {
      const match = slots.find(
        (s) =>
          s.parentType === exp.parentType &&
          s.slotName === exp.slotName &&
          s.childType === exp.childType,
      )
      expect(match).toBeDefined()
    }
  })

  it('excludes multi-type or non-single slot blocks', () => {
    const slots = getSingleChildSlots(puckConfig)
    const parentTypes = slots.map((s) => s.parentType)

    const excludedBlocks = [
      'Container',
      'Columns',
      'FreeSection',
      'AccordionWidget',
      'TabsWidget',
    ]

    for (const excluded of excludedBlocks) {
      expect(parentTypes).not.toContain(excluded)
    }
  })

  it('getChildSlotForParent correctly retrieves child slot info', () => {
    const slot = getChildSlotForParent(puckConfig, 'PackageCards')
    expect(slot).toEqual({
      parentType: 'PackageCards',
      slotName: 'cards',
      childType: 'PackageCard',
    })

    const nonChildSlot = getChildSlotForParent(puckConfig, 'FreeSection')
    expect(nonChildSlot).toBeUndefined()
  })

  it('getParentForChildType correctly retrieves parent info for a child card', () => {
    const parent = getParentForChildType(puckConfig, 'PackageCard')
    expect(parent).toEqual({
      parentType: 'PackageCards',
      slotName: 'cards',
      childType: 'PackageCard',
    })

    const unknownParent = getParentForChildType(puckConfig, 'HeadingWidget')
    expect(unknownParent).toBeUndefined()
  })
})
