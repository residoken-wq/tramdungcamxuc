/* eslint-disable @typescript-eslint/no-explicit-any -- fixtures read loose Puck JSON */
import { describe, expect, it } from 'vitest'
import type { Data } from '@puckeditor/core'
import { migrateServiceCardsV1ToV2 } from '@/puck/migrations/v2-service-cards'
import { migratePackageCardsV1ToV2 } from '@/puck/migrations/v2-package-cards'
import { normalizePuckData } from '@/puck/migrations'

describe('PK-04: Puck Migrations v2 (ServiceCards & PackageCards)', () => {
  describe('ServiceCards migration v1 -> v2', () => {
    it('chuyển services array sang slot cards với ServiceCard blocks và tính columns = 2', () => {
      const dataV1: Data = {
        root: { props: { title: 'Test' } },
        content: [
          {
            type: 'ServiceCards',
            props: {
              id: 'test-services-v1',
              version: 1,
              titleLine1: 'DỊCH VỤ',
              titleLine2: 'COACHING',
              services: [{ serviceId: 'srv-1' }, { serviceId: 'srv-2' }],
              highlightServiceId: 'srv-2',
              bgColor: 'warm-ivory',
              padding: 'lg',
            },
          },
        ],
      }

      const migrated = migrateServiceCardsV1ToV2(dataV1)
      const block = migrated.content[0] as any

      expect(block.type).toBe('ServiceCards')
      expect(block.props.version).toBe(2)
      expect(block.props.columns).toBe(2)
      expect(block.props.services).toBeUndefined()
      expect(block.props.highlightServiceId).toBeUndefined()
      expect(Array.isArray(block.props.cards)).toBe(true)
      expect(block.props.cards).toHaveLength(2)

      const [c0, c1] = block.props.cards
      expect(c0.type).toBe('ServiceCard')
      expect(c0.props.id).toBe('test-services-v1-service-0')
      expect(c0.props.serviceId).toBe('srv-1')
      expect(c0.props.highlight).toBe(false)
      expect(c0.props.name).toBeUndefined()
      expect(c0.props.price).toBeUndefined()

      expect(c1.type).toBe('ServiceCard')
      expect(c1.props.id).toBe('test-services-v1-service-1')
      expect(c1.props.serviceId).toBe('srv-2')
      expect(c1.props.highlight).toBe(true)
    })

    it('tính columns chính xác cho 1, 3, và 5 dịch vụ và lọc bỏ serviceId rỗng', () => {
      const testCases = [
        {
          services: [{ serviceId: 's1' }, { serviceId: '' }, { serviceId: null }],
          expectedCount: 1,
          expectedColumns: 1,
        },
        {
          services: [{ serviceId: 's1' }, { serviceId: 's2' }, { serviceId: 's3' }],
          expectedCount: 3,
          expectedColumns: 3,
        },
        {
          services: [
            { serviceId: 's1' },
            { serviceId: 's2' },
            { serviceId: 's3' },
            { serviceId: 's4' },
            { serviceId: 's5' },
          ],
          expectedCount: 5,
          expectedColumns: 3,
        },
      ]

      for (const tc of testCases) {
        const data: Data = {
          root: { props: {} },
          content: [
            {
              type: 'ServiceCards',
              props: {
                id: 'sc-test',
                version: 1,
                services: tc.services,
              },
            },
          ],
        }

        const res = migrateServiceCardsV1ToV2(data)
        const block = res.content[0] as any
        expect(block.props.cards).toHaveLength(tc.expectedCount)
        expect(block.props.columns).toBe(tc.expectedColumns)
      }
    })

    it('di chuyển vào trong slot Columns', () => {
      const dataInColumns: Data = {
        root: { props: {} },
        content: [
          {
            type: 'Columns',
            props: {
              col1: [
                {
                  type: 'ServiceCards',
                  props: {
                    id: 'col-services',
                    version: 1,
                    services: [{ serviceId: 'srv-inner' }],
                  },
                },
              ],
            },
          },
        ],
      }

      const res = migrateServiceCardsV1ToV2(dataInColumns)
      const colBlock = res.content[0] as any
      const innerServiceCards = colBlock.props.col1[0]
      expect(innerServiceCards.props.version).toBe(2)
      expect(innerServiceCards.props.cards[0].props.serviceId).toBe('srv-inner')
    })

    it('idempotent: chạy 2 lần cho kết quả giống nhau', () => {
      const data: Data = {
        root: { props: {} },
        content: [
          {
            type: 'ServiceCards',
            props: {
              id: 'idem-srv',
              version: 1,
              services: [{ serviceId: 'srv-1' }],
            },
          },
        ],
      }

      const once = migrateServiceCardsV1ToV2(data)
      const twice = migrateServiceCardsV1ToV2(once)
      expect(twice).toEqual(once)
    })
  })

  describe('PackageCards migration v1 -> v2', () => {
    it('chuyển packages array sang slot cards với PackageCard blocks và highlight đúng thẻ', () => {
      const dataV1: Data = {
        root: { props: { title: 'Test' } },
        content: [
          {
            type: 'PackageCards',
            props: {
              id: 'test-packages-v1',
              version: 1,
              titleLine1: 'LỘ TRÌNH',
              titleLine2: 'GROWTH MIRROR',
              style: 'numbered',
              packages: [{ packageId: 'pkg-1' }, { packageId: 'pkg-2' }, { packageId: 'pkg-3' }],
              highlightPackageId: 'pkg-2',
              buttonText: 'Đặt ngay',
              buttonLink: '/booking',
              bgColor: 'warm-ivory',
              padding: 'lg',
            },
          },
        ],
      }

      const migrated = migratePackageCardsV1ToV2(dataV1)
      const block = migrated.content[0] as any

      expect(block.type).toBe('PackageCards')
      expect(block.props.version).toBe(2)
      expect(block.props.packages).toBeUndefined()
      expect(block.props.highlightPackageId).toBeUndefined()
      expect(block.props.buttonText).toBe('Đặt ngay')
      expect(block.props.buttonLink).toBe('/booking')
      expect(Array.isArray(block.props.cards)).toBe(true)
      expect(block.props.cards).toHaveLength(3)

      const [p0, p1, p2] = block.props.cards
      expect(p0.type).toBe('PackageCard')
      expect(p0.props.id).toBe('test-packages-v1-package-0')
      expect(p0.props.packageId).toBe('pkg-1')
      expect(p0.props.highlight).toBe(false)
      expect(p0.props.name).toBeUndefined()
      expect(p0.props.price).toBeUndefined()

      expect(p1.type).toBe('PackageCard')
      expect(p1.props.id).toBe('test-packages-v1-package-1')
      expect(p1.props.packageId).toBe('pkg-2')
      expect(p1.props.highlight).toBe(true)

      expect(p2.type).toBe('PackageCard')
      expect(p2.props.id).toBe('test-packages-v1-package-2')
      expect(p2.props.packageId).toBe('pkg-3')
      expect(p2.props.highlight).toBe(false)
    })

    it('đọc cả productId cũ và packageIds mảng số/chuỗi, bỏ ID rỗng', () => {
      const dataWithProductIds: Data = {
        root: { props: {} },
        content: [
          {
            type: 'PackageCards',
            props: {
              id: 'test-packages-legacy',
              version: 1,
              packages: [
                { productId: 'prod-legacy-1' },
                { packageId: '' },
                { productId: null },
                { productId: 'prod-legacy-2' },
              ],
            },
          },
        ],
      }

      const res = migratePackageCardsV1ToV2(dataWithProductIds)
      const block = res.content[0] as any
      expect(block.props.cards).toHaveLength(2)
      expect(block.props.cards[0].props.packageId).toBe('prod-legacy-1')
      expect(block.props.cards[1].props.packageId).toBe('prod-legacy-2')

      const dataWithPackageIds: Data = {
        root: { props: {} },
        content: [
          {
            type: 'PackageCards',
            props: {
              id: 'test-package-ids',
              version: 1,
              packageIds: [101, '', 102],
            },
          },
        ],
      }

      const resIds = migratePackageCardsV1ToV2(dataWithPackageIds)
      const blockIds = resIds.content[0] as any
      expect(blockIds.props.cards).toHaveLength(2)
      expect(blockIds.props.cards[0].props.packageId).toBe(101)
      expect(blockIds.props.cards[1].props.packageId).toBe(102)
    })

    it('idempotent: chạy 2 lần cho kết quả giống nhau', () => {
      const data: Data = {
        root: { props: {} },
        content: [
          {
            type: 'PackageCards',
            props: {
              id: 'idem-pkg',
              version: 1,
              packages: [{ packageId: 'pkg-1' }],
            },
          },
        ],
      }

      const once = migratePackageCardsV1ToV2(data)
      const twice = migratePackageCardsV1ToV2(once)
      expect(twice).toEqual(once)
    })

    it('normalizePuckData tự động migrate cả ServiceCards và PackageCards', () => {
      const rawData = {
        content: [
          {
            type: 'ServiceCards',
            props: {
              id: 'norm-srv',
              services: [{ serviceId: 's1' }],
            },
          },
          {
            type: 'PackageCards',
            props: {
              id: 'norm-pkg',
              packages: [{ packageId: 'p1' }],
            },
          },
        ],
      }

      const normalized = normalizePuckData(rawData)
      const srvBlock = normalized.content[0] as any
      const pkgBlock = normalized.content[1] as any

      expect(srvBlock.props.version).toBe(2)
      expect(srvBlock.props.cards[0].type).toBe('ServiceCard')

      expect(pkgBlock.props.version).toBe(2)
      expect(pkgBlock.props.cards[0].type).toBe('PackageCard')
    })
  })
})
