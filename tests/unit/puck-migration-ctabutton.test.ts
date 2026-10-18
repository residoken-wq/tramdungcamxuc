import { describe, expect, it } from 'vitest'
import type { Data } from '@puckeditor/core'
import { applyPuckMigrations } from '@/puck/migrations'
import { migrateCTAButtonV1ToV2 } from '@/puck/migrations/v2-cta-button'

describe('CTAButton Puck Migration v1 -> v2', () => {
  it('migrates v1 CTAButton at root level to v2 schema with default linkType=url and pageId=""', () => {
    const v1Data: Data = {
      root: { props: { title: 'Trang chủ' } },
      content: [
        {
          type: 'CTAButton',
          props: {
            id: 'btn-1',
            version: 1,
            label: 'Khám phá ngay',
            href: '/habit/chan-doan',
            variant: 'primary',
            size: 'md',
            align: 'center',
          },
        },
      ],
    }

    const migrated = migrateCTAButtonV1ToV2(v1Data)
    const item = migrated.content[0] as {
      props: {
        version: number
        linkType: string
        pageId: string
        href: string
        label: string
        variant: string
      }
    }

    expect(item.props.version).toBe(2)
    expect(item.props.linkType).toBe('url')
    expect(item.props.pageId).toBe('')
    expect(item.props.href).toBe('/habit/chan-doan')
    expect(item.props.label).toBe('Khám phá ngay')
    expect(item.props.variant).toBe('primary')
  })

  it('migrates CTAButton without version prop (implicit v1)', () => {
    const rawData: Data = {
      root: {},
      content: [
        {
          type: 'CTAButton',
          props: {
            id: 'btn-legacy',
            label: 'Bắt đầu',
            href: 'https://shopee.vn',
          },
        },
      ],
    }

    const migrated = migrateCTAButtonV1ToV2(rawData)
    const item = migrated.content[0] as {
      props: { version: number; linkType: string; pageId: string; href: string }
    }

    expect(item.props.version).toBe(2)
    expect(item.props.linkType).toBe('url')
    expect(item.props.pageId).toBe('')
    expect(item.props.href).toBe('https://shopee.vn')
  })

  it('migrates CTAButton nested inside Columns slot containers', () => {
    const nestedData: Data = {
      root: {},
      content: [
        {
          type: 'Columns',
          props: {
            id: 'col-block',
            col1: [
              {
                type: 'CTAButton',
                props: {
                  id: 'nested-btn',
                  version: 1,
                  label: 'Nút trong cột 1',
                  href: '/coaching',
                },
              },
            ],
            col2: [],
          },
        },
      ],
    }

    const migrated = applyPuckMigrations(nestedData)
    const colRoot = migrated.content[0] as {
      props: {
        col1: Array<{ props: { version: number; linkType: string; pageId: string; href: string } }>
      }
    }

    expect(colRoot.props.col1[0].props.version).toBe(2)
    expect(colRoot.props.col1[0].props.linkType).toBe('url')
    expect(colRoot.props.col1[0].props.pageId).toBe('')
    expect(colRoot.props.col1[0].props.href).toBe('/coaching')
  })

  it('does not alter already migrated version 2 blocks or other block types', () => {
    const v2Data: Data = {
      root: {},
      content: [
        {
          type: 'CTAButton',
          props: {
            id: 'btn-v2',
            version: 2,
            linkType: 'page',
            pageId: 'page-123',
            href: '#',
            label: 'Xem giới thiệu',
          },
        },
        {
          type: 'HeroImage',
          props: {
            id: 'hero-1',
            version: 1,
            title: 'Tiêu đề',
          },
        },
      ],
    }

    const migrated = applyPuckMigrations(v2Data)
    const btn = migrated.content[0] as {
      props: { version: number; linkType: string; pageId: string }
    }
    const hero = migrated.content[1] as { props: { version: number } }

    expect(btn.props.version).toBe(2)
    expect(btn.props.linkType).toBe('page')
    expect(btn.props.pageId).toBe('page-123')
    expect(hero.props.version).toBe(2)
  })
})
