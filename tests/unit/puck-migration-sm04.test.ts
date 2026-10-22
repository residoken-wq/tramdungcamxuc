import { describe, expect, it } from 'vitest'
import type { Data } from '@puckeditor/core'
import {
  applyPuckMigrations,
  migrateJourneyStepsV1ToV2,
  migrateHanaStoryV1ToV2,
  migrateHanaStoryV2ToV3,
  migrateImageTextV1ToV2,
  migrateLogoStripV1ToV2,
} from '@/puck/migrations'
import * as seedData from '../../seed/data'

function wrapBlock(type: string, props: Record<string, unknown>): Data {
  return {
    root: {},
    content: [{ type, props: props as never }],
  }
}

describe('SM-04: Puck Migrations on Seed Pages and Upgraded Blocks', () => {
  it('migrates seedData.pages: all SM-04 blocks have version 2', () => {
    for (const page of seedData.pages) {
      const puckData: Data = {
        root: { props: { title: page.title } },
        content: page.blocks as unknown as Data['content'],
      }
      if (!puckData.content || puckData.content.length === 0) continue

      const migrated = applyPuckMigrations(puckData)
      for (const block of migrated.content) {
        if (block.type === 'ImageText' || block.type === 'LogoStrip') {
          expect((block.props as { version?: number }).version).toBe(2)
        } else if (block.type === 'HanaStory' || block.type === 'JourneySteps') {
          expect((block.props as { version?: number }).version).toBe(3)
        }
      }
    }
  })

  it('is idempotent: running applyPuckMigrations twice produces the exact same output', () => {
    for (const page of seedData.pages) {
      const puckData: Data = {
        root: { props: { title: page.title } },
        content: page.blocks as unknown as Data['content'],
      }
      if (!puckData.content || puckData.content.length === 0) continue

      const run1 = applyPuckMigrations(puckData)
      const run2 = applyPuckMigrations(run1)
      expect(run2).toEqual(run1)
    }
  })

  describe('migrateJourneyStepsV1ToV2', () => {
    it('upgrades v1 JourneySteps props to v2 with default variant circles', () => {
      const data = wrapBlock('JourneySteps', {
        version: 1,
        titleLine1: '5 BƯỚC THỰC HÀNH',
        step1Description: 'Mô tả bước 1',
      })

      const migrated = migrateJourneyStepsV1ToV2(data)
      const v2Props = migrated.content[0].props as Record<string, unknown>
      expect(v2Props.version).toBe(2)
      expect(v2Props.variant).toBe('circles')
      expect(v2Props.titleLine1).toBe('5 BƯỚC THỰC HÀNH')
      expect(v2Props.step1Description).toBe('Mô tả bước 1')
    })

    it('does not mutate already v2 JourneySteps props', () => {
      const data = wrapBlock('JourneySteps', {
        version: 2,
        variant: 'cards',
        highlightStep: 3,
        step3Subtitle: 'Mở rộng vốn từ',
      })

      const migrated = migrateJourneyStepsV1ToV2(data)
      const result = migrated.content[0].props as Record<string, unknown>
      expect(result.version).toBe(2)
      expect(result.variant).toBe('cards')
      expect(result.highlightStep).toBe(3)
      expect(result.step3Subtitle).toBe('Mở rộng vốn từ')
    })
  })

  describe('migrateHanaStoryV1ToV2', () => {
    it('upgrades v1 HanaStory props to v2 with light tone and story layout', () => {
      const data = wrapBlock('HanaStory', {
        version: 1,
        titleLine1: 'CHUYỆN CỦA HANA',
        storyContent: 'Tôi bắt đầu từ con số không...',
      })

      const migrated = migrateHanaStoryV1ToV2(data)
      const v2Props = migrated.content[0].props as Record<string, unknown>
      expect(v2Props.version).toBe(2)
      expect(v2Props.tone).toBe('light')
      expect(v2Props.layout).toBe('story')
      expect(v2Props.titleLine1).toBe('CHUYỆN CỦA HANA')
      expect(v2Props.storyContent).toBe('Tôi bắt đầu từ con số không...')
    })

    it('preserves existing dark tone and letter layout in v2', () => {
      const data = wrapBlock('HanaStory', {
        version: 2,
        tone: 'dark',
        layout: 'letter',
        founderSignatureAlt: 'Chữ ký tay',
      })

      const migrated = migrateHanaStoryV1ToV2(data)
      const result = migrated.content[0].props as Record<string, unknown>
      expect(result.version).toBe(2)
      expect(result.tone).toBe('dark')
      expect(result.layout).toBe('letter')
      expect(result.founderSignatureAlt).toBe('Chữ ký tay')
    })
  })

  describe('migrateHanaStoryV2ToV3', () => {
    it('upgrades v2 HanaStory props to v3 with greeting and signatureName defaults', () => {
      const data = wrapBlock('HanaStory', {
        version: 2,
        titleLine1: 'CHUYỆN CỦA HANA',
        layout: 'letter',
      })

      const migrated = migrateHanaStoryV2ToV3(data)
      const v3Props = migrated.content[0].props as Record<string, unknown>
      expect(v3Props.version).toBe(3)
      expect(v3Props.greeting).toBe('')
      expect(v3Props.signatureName).toBe('')
      expect(v3Props.titleLine1).toBe('CHUYỆN CỦA HANA')
    })

    it('preserves existing greeting and signatureName in v3', () => {
      const data = wrapBlock('HanaStory', {
        version: 2,
        layout: 'letter',
        greeting: 'Chào bạn thương mến,',
        signatureName: 'Hana',
      })

      const migrated = migrateHanaStoryV2ToV3(data)
      const result = migrated.content[0].props as Record<string, unknown>
      expect(result.version).toBe(3)
      expect(result.greeting).toBe('Chào bạn thương mến,')
      expect(result.signatureName).toBe('Hana')
    })

    it('is idempotent: running migrateHanaStoryV2ToV3 twice produces identical output', () => {
      const data = wrapBlock('HanaStory', {
        version: 2,
        layout: 'letter',
        greeting: 'Chào bạn,',
      })
      const run1 = migrateHanaStoryV2ToV3(data)
      const run2 = migrateHanaStoryV2ToV3(run1)
      expect(run2).toEqual(run1)
    })
  })

  describe('migrateImageTextV1ToV2', () => {
    it('upgrades v1 ImageText props to v2 while preserving custom fields', () => {
      const data = wrapBlock('ImageText', {
        version: 1,
        titleLine1: 'KHÔNG GIAN AN TOÀN',
        content: 'Nội dung chia sẻ trung tính.',
        imageUrl: '/brand/custom.jpg',
      })

      const migrated = migrateImageTextV1ToV2(data)
      const v2Props = migrated.content[0].props as Record<string, unknown>
      expect(v2Props.version).toBe(2)
      expect(v2Props.titleLine1).toBe('KHÔNG GIAN AN TOÀN')
      expect(v2Props.content).toBe('Nội dung chia sẻ trung tính.')
      expect(v2Props.imageUrl).toBe('/brand/custom.jpg')
    })
  })

  describe('migrateLogoStripV1ToV2', () => {
    it('migrates legacy flat logos array into groups array in v2', () => {
      const data = wrapBlock('LogoStrip', {
        version: 1,
        title: 'ĐỐI TÁC',
        logos: [{ alt: 'Đối tác A' }, { alt: 'Đối tác B' }],
      })

      const migrated = migrateLogoStripV1ToV2(data)
      const v2Props = migrated.content[0].props as {
        version: number
        groups?: Array<{ logos?: Array<{ alt: string }> }>
      }
      expect(v2Props.version).toBe(2)
      expect(v2Props.groups).toBeDefined()
      expect(v2Props.groups?.length).toBe(1)
      expect(v2Props.groups?.[0].logos).toHaveLength(2)
      expect(v2Props.groups?.[0].logos?.[0].alt).toBe('Đối tác A')
    })

    it('creates empty groups array if legacy logos is empty', () => {
      const data = wrapBlock('LogoStrip', {
        version: 1,
        title: 'CHỨNG CHỈ',
      })

      const migrated = migrateLogoStripV1ToV2(data)
      const v2Props = migrated.content[0].props as { version: number; groups?: unknown[] }
      expect(v2Props.version).toBe(2)
      expect(v2Props.groups).toEqual([{ label: '', logos: [] }])
    })
  })

  it('preserves user-entered content across full page migration', () => {
    const customData: Data = {
      root: { props: { title: 'Trang kiểm tra v2' } },
      content: [
        {
          type: 'JourneySteps',
          props: {
            id: 'journey-custom',
            version: 1,
            titleLine1: 'HÀNH TRÌNH TÙY BIẾN',
            step1Subtitle: 'Khởi đầu',
          },
        },
        {
          type: 'HanaStory',
          props: {
            id: 'story-custom',
            version: 1,
            titleLine1: 'LỜI BẠC TÙY BIẾN',
            chips: [{ text: 'ACC' }],
          },
        },
        {
          type: 'ImageText',
          props: {
            id: 'img-custom',
            version: 1,
            titleLine1: 'ẢNH CHỮ TÙY BIẾN',
            quote: 'Trích dẫn cá nhân',
          },
        },
        {
          type: 'LogoStrip',
          props: {
            id: 'logo-custom',
            version: 1,
            title: 'LOGO TÙY BIẾN',
            logos: [{ alt: 'Logo 1' }],
          },
        },
      ],
    }

    const migrated = applyPuckMigrations(customData)
    expect(migrated.content[0].props.version).toBe(3)
    expect(migrated.content[0].props.titleLine1).toBe('HÀNH TRÌNH TÙY BIẾN')
    const step0 = (migrated.content[0].props.steps as any)[0]
    expect(step0.props?.subtitle || step0.subtitle).toBe('Khởi đầu')

    expect(migrated.content[1].props.version).toBe(3)
    expect(migrated.content[1].props.titleLine1).toBe('LỜI BẠC TÙY BIẾN')
    expect(migrated.content[1].props.chips).toEqual([{ text: 'ACC' }])
    expect((migrated.content[1].props as Record<string, unknown>).greeting).toBe('')
    expect((migrated.content[1].props as Record<string, unknown>).signatureName).toBe('')

    expect(migrated.content[2].props.version).toBe(2)
    expect(migrated.content[2].props.titleLine1).toBe('ẢNH CHỮ TÙY BIẾN')
    expect(migrated.content[2].props.quote).toBe('Trích dẫn cá nhân')

    expect(migrated.content[3].props.version).toBe(2)
    expect(migrated.content[3].props.title).toBe('LOGO TÙY BIẾN')
    const logoProps = migrated.content[3].props as {
      groups?: Array<{ logos?: Array<{ alt: string }> }>
    }
    expect(logoProps.groups?.[0].logos?.[0].alt).toBe('Logo 1')
  })
})
