import { describe, expect, it } from 'vitest'
import type { Data } from '@puckeditor/core'
import { applyPuckMigrations } from '@/puck/migrations'
import { migratePackageComparisonV1ToV2 } from '@/puck/migrations/v2-package-comparison'

describe('PackageComparison Puck Migration v1 -> v2', () => {
  it('migrates v1 PackageComparison at root level to v2 schema with default note="" and showPaymentPolicyLink=false', () => {
    const v1Data: Data = {
      root: { props: { title: 'Bảng gói Growth Mirror' } },
      content: [
        {
          type: 'PackageComparison',
          props: {
            id: 'pkg-1',
            version: 1,
            packages: [{ packageId: 101 }, { packageId: 102 }],
            showTotalValue: true,
            showDiscountPercent: true,
            bgColor: 'warm-ivory',
            padding: 'lg',
          },
        },
      ],
    }

    const migrated = migratePackageComparisonV1ToV2(v1Data)
    const item = migrated.content[0] as {
      props: {
        version: number
        note: string
        showPaymentPolicyLink: boolean
        packages: Array<{ packageId: number }>
        showTotalValue: boolean
        showDiscountPercent: boolean
        bgColor: string
        padding: string
      }
    }

    expect(item.props.version).toBe(2)
    expect(item.props.note).toBe('')
    expect(item.props.showPaymentPolicyLink).toBe(false)
    expect(item.props.packages).toEqual([{ packageId: 101 }, { packageId: 102 }])
    expect(item.props.showTotalValue).toBe(true)
    expect(item.props.showDiscountPercent).toBe(true)
    expect(item.props.bgColor).toBe('warm-ivory')
    expect(item.props.padding).toBe('lg')
  })

  it('migrates PackageComparison without version prop (implicit v1)', () => {
    const rawData: Data = {
      root: {},
      content: [
        {
          type: 'PackageComparison',
          props: {
            id: 'pkg-legacy',
            packages: [{ packageId: 1 }],
          },
        },
      ],
    }

    const migrated = migratePackageComparisonV1ToV2(rawData)
    const item = migrated.content[0] as {
      props: { version: number; note: string; showPaymentPolicyLink: boolean }
    }

    expect(item.props.version).toBe(2)
    expect(item.props.note).toBe('')
    expect(item.props.showPaymentPolicyLink).toBe(false)
  })

  it('migrates PackageComparison nested inside slot containers or zones', () => {
    const nestedData: Data = {
      root: {},
      content: [
        {
          type: 'Columns',
          props: {
            id: 'col-block',
            col1: [
              {
                type: 'PackageComparison',
                props: {
                  id: 'nested-pkg',
                  version: 1,
                  packages: [{ packageId: 5 }],
                },
              },
            ],
            col2: [],
          },
        },
      ],
      zones: {
        sidebar: [
          {
            type: 'PackageComparison',
            props: {
              id: 'zone-pkg',
              version: 1,
            },
          },
        ],
      },
    }

    const migrated = applyPuckMigrations(nestedData)
    const colRoot = migrated.content[0] as {
      props: {
        col1: Array<{ props: { version: number; note: string; showPaymentPolicyLink: boolean } }>
      }
    }
    const zoneItem = migrated.zones?.sidebar?.[0] as {
      props: { version: number; note: string; showPaymentPolicyLink: boolean }
    }

    expect(colRoot.props.col1[0].props.version).toBe(3)
    expect(colRoot.props.col1[0].props.note).toBe('')
    expect(colRoot.props.col1[0].props.showPaymentPolicyLink).toBe(false)

    expect(zoneItem?.props.version).toBe(3)
    expect(zoneItem?.props.note).toBe('')
    expect(zoneItem?.props.showPaymentPolicyLink).toBe(false)
  })

  it('does not alter already migrated blocks or other block types unnecessarily', () => {
    const v2Data: Data = {
      root: {},
      content: [
        {
          type: 'PackageComparison',
          props: {
            id: 'pkg-v2',
            version: 2,
            note: 'Ghi chú tùy chỉnh của Hana',
            showPaymentPolicyLink: true,
            packages: [{ packageId: 10 }],
          },
        },
        {
          type: 'SectionHeader',
          props: {
            id: 'sec-1',
            version: 2,
            titleLine1: 'Tiêu đề',
          },
        },
      ],
    }

    const migrated = applyPuckMigrations(v2Data)
    const pkg = migrated.content[0] as {
      props: { version: number; note: string; showPaymentPolicyLink: boolean }
    }
    const sec = migrated.content[1] as { props: { version: number } }

    expect(pkg.props.version).toBe(3)
    expect(pkg.props.note).toBe('Ghi chú tùy chỉnh của Hana')
    expect(pkg.props.showPaymentPolicyLink).toBe(true)
    expect(sec.props.version).toBe(2)
  })

  it('handles empty or malformed data gracefully', () => {
    const emptyData = { root: {}, content: [] } as Data
    expect(migratePackageComparisonV1ToV2(emptyData)).toEqual(emptyData)
  })
})
