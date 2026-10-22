/* eslint-disable @typescript-eslint/no-explicit-any -- fixtures read loose Puck JSON and resolveFields params */
import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Data } from '@puckeditor/core'
import { migrateStatsBarV2ToV3 } from '@/puck/migrations/v3-stats-bar'
import { migrateJourneyStepsV2ToV3 } from '@/puck/migrations/v3-journey-steps'
import { normalizePuckData } from '@/puck/migrations'
import { JourneySteps } from '@/components/site/JourneySteps'
import { JourneyStep } from '@/components/site/JourneyStep'

describe('PK-03: Puck Migrations v3 (StatsBar & JourneySteps)', () => {
  describe('StatsBar migration v1/v2 -> v3', () => {
    const legacyStatsV1: Data = {
      root: { props: { title: 'Test Migration' } },
      content: [
        {
          type: 'StatsBar',
          props: {
            id: 'test-stats-v1',
            version: 1,
            bgColor: 'warm-ivory',
            padding: 'md',
            items: [
              { value: '10+', label: 'Năm kinh nghiệm', description: 'Đào tạo', icon: 'star' },
              { value: '500+', label: 'Học viên', description: 'Toàn quốc', icon: 'heart' },
              { value: '98%', label: 'Hài lòng', description: 'Đánh giá', icon: 'spark' },
            ],
          },
        },
      ],
    }

    const legacyStatsV2: Data = {
      root: { props: { title: 'Test Migration' } },
      content: [
        {
          type: 'StatsBar',
          props: {
            id: 'test-stats-v2',
            version: 2,
            bgColor: 'lavender-mist',
            padding: 'lg',
            stats: [
              { value: '2,5 giờ', label: 'Thời lượng', description: 'Thực hành', icon: '' },
              { value: '12 người', label: 'Quy mô', description: 'Nhóm nhỏ', icon: '' },
            ],
          },
        },
      ],
    }

    it('v1 (items) chuyển thành v3 stats slot với Stat blocks và gỡ items', () => {
      const migrated = migrateStatsBarV2ToV3(legacyStatsV1)
      const block = migrated.content[0] as any

      expect(block.type).toBe('StatsBar')
      expect(block.props.version).toBe(3)
      expect(block.props.items).toBeUndefined()
      expect(block.props.columns).toBe(3)
      expect(Array.isArray(block.props.stats)).toBe(true)
      expect(block.props.stats).toHaveLength(3)

      const [s0, s1, s2] = block.props.stats
      expect(s0.type).toBe('Stat')
      expect(s0.props.id).toBe('test-stats-v1-stat-0')
      expect(s0.props.value).toBe('10+')
      expect(s0.props.label).toBe('Năm kinh nghiệm')
      expect(s0.props.description).toBe('Đào tạo')
      expect(s0.props.icon).toBe('star')

      expect(s1.props.id).toBe('test-stats-v1-stat-1')
      expect(s1.props.value).toBe('500+')
      expect(s2.props.id).toBe('test-stats-v1-stat-2')
      expect(s2.props.value).toBe('98%')
    })

    it('v2 (raw stats) chuyển thành v3 stats slot với Stat blocks và xác định columns = 2', () => {
      const migrated = migrateStatsBarV2ToV3(legacyStatsV2)
      const block = migrated.content[0] as any

      expect(block.type).toBe('StatsBar')
      expect(block.props.version).toBe(3)
      expect(block.props.columns).toBe(2)
      expect(block.props.bgColor).toBe('lavender-mist')
      expect(block.props.padding).toBe('lg')
      expect(block.props.stats).toHaveLength(2)

      expect(block.props.stats[0].type).toBe('Stat')
      expect(block.props.stats[0].props.id).toBe('test-stats-v2-stat-0')
      expect(block.props.stats[0].props.value).toBe('2,5 giờ')
      expect(block.props.stats[1].props.id).toBe('test-stats-v2-stat-1')
      expect(block.props.stats[1].props.value).toBe('12 người')
    })

    it('bỏ các ô rỗng và gán columns theo số ô còn lại', () => {
      const dataWithEmpty: Data = {
        root: { props: {} },
        content: [
          {
            type: 'StatsBar',
            props: {
              id: 'empty-test',
              version: 2,
              stats: [
                { value: '1', label: 'Item 1', description: '', icon: '' },
                { value: '', label: '', description: '', icon: '' },
                null,
                { value: '2', label: 'Item 2', description: '', icon: '' },
              ],
            },
          } as any,
        ],
      }

      const migrated = migrateStatsBarV2ToV3(dataWithEmpty)
      const block = migrated.content[0] as any
      expect(block.props.stats).toHaveLength(2)
      expect(block.props.columns).toBe(2)
      expect(block.props.stats[0].props.value).toBe('1')
      expect(block.props.stats[1].props.value).toBe('2')
    })
  })

  describe('JourneySteps migration v1/v2 -> v3', () => {
    const legacyJourney: Data = {
      root: { props: { title: 'Test Migration' } },
      content: [
        {
          type: 'JourneySteps',
          props: {
            id: 'test-journey',
            version: 2,
            variant: 'cards',
            highlightStep: 2,
            seriesLabel: 'Tiến trình',
            titleLine1: 'HÀNH TRÌNH 5 BƯỚC',
            titleLine2: 'CHUYỂN HÓA',
            emotionLine: 'Dòng cảm xúc',
            step1Subtitle: 'Bước 1',
            step1Description: 'Mô tả bước 1 tùy biến',
            step2Subtitle: '',
            step2Description: 'Mô tả bước 2 tùy biến',
            step3Subtitle: '',
            step3Description: '', // rỗng -> fallback chữ mặc định
            step4Subtitle: '',
            step4Description: 'Mô tả bước 4',
            step5Subtitle: 'Bước 5',
            step5Description: 'Mô tả bước 5',
            bgColor: 'warm-ivory',
            padding: 'lg',
          },
        },
      ],
    }

    it('chuyển đổi thành 5 Step blocks, columns = 5, highlight đúng bước và fallback description rỗng', () => {
      const migrated = migrateJourneyStepsV2ToV3(legacyJourney)
      const block = migrated.content[0] as any

      expect(block.type).toBe('JourneySteps')
      expect(block.props.version).toBe(3)
      expect(block.props.columns).toBe(5)
      expect(block.props.variant).toBe('cards')
      expect(block.props.seriesLabel).toBe('Tiến trình')
      expect(block.props.titleLine1).toBe('HÀNH TRÌNH 5 BƯỚC')
      expect(block.props.titleLine2).toBe('CHUYỂN HÓA')
      expect(block.props.emotionLine).toBe('Dòng cảm xúc')

      // Old props removed
      expect(block.props.step1Description).toBeUndefined()
      expect(block.props.highlightStep).toBeUndefined()

      expect(Array.isArray(block.props.steps)).toBe(true)
      expect(block.props.steps).toHaveLength(5)

      // Step 0: Pause (index 0, not highlighted since highlightStep = 2)
      expect(block.props.steps[0].type).toBe('Step')
      expect(block.props.steps[0].props.id).toBe('test-journey-step-0')
      expect(block.props.steps[0].props.name).toBe('Pause')
      expect(block.props.steps[0].props.subtitle).toBe('Bước 1')
      expect(block.props.steps[0].props.description).toBe('Mô tả bước 1 tùy biến')
      expect(block.props.steps[0].props.highlight).toBe(false)

      // Step 1: Feel (index 1, highlightStep = 2 -> highlight = true)
      expect(block.props.steps[1].props.id).toBe('test-journey-step-1')
      expect(block.props.steps[1].props.name).toBe('Feel')
      expect(block.props.steps[1].props.highlight).toBe(true)

      // Step 2: Name (index 2, highlightStep = 2 -> highlight = false, description fell back to default)
      expect(block.props.steps[2].props.id).toBe('test-journey-step-2')
      expect(block.props.steps[2].props.name).toBe('Name')
      expect(block.props.steps[2].props.highlight).toBe(false)
      // Empty description fell back to default [MẪU] description
      expect(block.props.steps[2].props.description.length).toBeGreaterThan(0)
      expect(block.props.steps[2].props.description).toContain('[MẪU]')
    })
  })

  describe('Idempotency, Recursion & normalizePuckData', () => {
    it('chạy 2 lần trả về cùng kết quả (idempotent)', () => {
      const sampleData: Data = {
        root: { props: {} },
        content: [
          {
            type: 'StatsBar',
            props: {
              id: 'stat-idemp',
              version: 2,
              stats: [{ value: '1', label: 'L1' }],
            },
          } as any,
          {
            type: 'JourneySteps',
            props: {
              id: 'journey-idemp',
              version: 2,
              highlightStep: 0,
            },
          } as any,
        ],
      }

      const once = normalizePuckData(sampleData)
      const twice = normalizePuckData(once)
      expect(twice).toEqual(once)
    })

    it('đi vào các slot con của Columns (col1, col2, col3) và zones', () => {
      const dataInColumns: Data = {
        root: { props: {} },
        content: [
          {
            type: 'Columns',
            props: {
              id: 'cols-wrap',
              col1: [
                {
                  type: 'StatsBar',
                  props: {
                    id: 'nested-stats',
                    version: 1,
                    items: [{ value: '3', label: 'L3' }],
                  },
                },
              ],
              col2: [],
              col3: [],
            },
          } as any,
        ],
        zones: {
          'zone-test': [
            {
              type: 'JourneySteps',
              props: {
                id: 'zone-journey',
                version: 2,
              },
            },
          ],
        },
      }

      const migrated = normalizePuckData(dataInColumns)
      const nestedStats = (migrated.content[0] as any).props.col1[0]
      expect(nestedStats.props.version).toBe(3)
      expect(nestedStats.props.stats[0].type).toBe('Stat')

      const zoneJourney = (migrated.zones as any)['zone-test'][0]
      expect(zoneJourney.props.version).toBe(3)
      expect(zoneJourney.props.steps).toHaveLength(5)
    })
  })

  describe('Visual and HTML rendering comparison across variants (circles, cards, list)', () => {
    const variants = ['circles', 'cards', 'list'] as const

    for (const variant of variants) {
      it(`render HTML của biến thể "${variant}" giữ nguyên text, nhãn và cấu trúc cốt lõi`, () => {
        const legacyProps = {
          variant,
          seriesLabel: 'TIẾN TRÌNH',
          titleLine1: '5 BƯỚC',
          titleLine2: 'CHUYỂN HÓA',
          emotionLine: 'Dòng cảm xúc',
          highlightStep: 1,
          step1Subtitle: '',
          step1Description: 'Mô tả bước 1',
          step2Subtitle: '',
          step2Description: 'Mô tả bước 2',
          step3Subtitle: '',
          step3Description: 'Mô tả bước 3',
          step4Subtitle: '',
          step4Description: 'Mô tả bước 4',
          step5Subtitle: '',
          step5Description: 'Mô tả bước 5',
          bgColor: 'warm-ivory' as const,
        }

        const data: Data = {
          root: { props: {} },
          content: [
            {
              type: 'JourneySteps',
              props: {
                id: `journey-${variant}`,
                version: 2,
                ...legacyProps,
              },
            } as any,
          ],
        }

        const migrated = migrateJourneyStepsV2ToV3(data)
        const migratedBlock = migrated.content[0] as any

        // Render migrated component with slot
        const stepsNodes = React.createElement(
          React.Fragment,
          null,
          migratedBlock.props.steps.map((s: any, idx: number) =>
            React.createElement(JourneyStep, {
              key: s.props.id,
              index: idx,
              ...s.props,
            }),
          ),
        )

        const html = renderToStaticMarkup(
          React.createElement(JourneySteps, {
            ...migratedBlock.props,
            steps: stepsNodes,
          }),
        )

        // Verifications
        expect(html).toContain('TIẾN TRÌNH')
        expect(html).toContain('5 BƯỚC')
        expect(html).toContain('CHUYỂN HÓA')
        expect(html).toContain('Dòng cảm xúc')
        expect(html).toContain('Pause')
        expect(html).toContain('Feel')
        expect(html).toContain('Name')
        expect(html).toContain('Choose')
        expect(html).toContain('Practice')
        expect(html).toContain('Mô tả bước 1')
        expect(html).toContain('Mô tả bước 2')
        expect(html).toContain(`data-variant="${variant}"`)
      })
    }
  })
})
