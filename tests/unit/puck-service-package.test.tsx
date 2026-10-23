/* eslint-disable @typescript-eslint/no-explicit-any -- loose types for resolveFields test params */
import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Render } from '@puckeditor/core'
import { ServiceCardBlock } from '@/puck/blocks/ServiceCard'
import { PackageCardBlock } from '@/puck/blocks/PackageCard'
import { ServiceCards } from '@/components/site/ServiceCards'
import { PackageCards } from '@/components/site/PackageCards'
import { ServiceCardItem } from '@/components/site/ServiceCardItem'
import { PackageCardItem } from '@/components/site/PackageCardItem'
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

describe('PK-04: ServiceCard & PackageCard Child Blocks - Unit Tests', () => {
  describe('WCAG AA Contrast on real background (getChildRealBg & resolveFields)', () => {
    it('getChildRealBg determines correct real background for ServiceCard', () => {
      // Highlighted ServiceCard has real background deep-navy
      expect(getChildRealBg(null, { highlight: true })).toBe('deep-navy')
      expect(
        getChildRealBg(
          { type: 'ServiceCards', props: { bgColor: 'warm-ivory' } },
          { highlight: true },
        ),
      ).toBe('deep-navy')

      // Normal ServiceCard on warm-ivory ServiceCards -> white
      expect(
        getChildRealBg(
          { type: 'ServiceCards', props: { bgColor: 'warm-ivory' } },
          { highlight: false },
        ),
      ).toBe('white')

      // Parent deep-navy -> deep-navy
      expect(
        getChildRealBg(
          { type: 'ServiceCards', props: { bgColor: 'deep-navy' } },
          { highlight: false },
        ),
      ).toBe('deep-navy')
    })

    it('ServiceCard resolveFields returns WCAG AA compliant colors for highlighted and normal states', async () => {
      if (typeof ServiceCardBlock.resolveFields !== 'function') {
        throw new Error('ServiceCardBlock.resolveFields must be defined')
      }

      // Case 1: Highlighted service card (deep-navy background)
      const parentIvory = {
        type: 'ServiceCards',
        props: { bgColor: 'warm-ivory' },
      }
      const fieldsNavy = await ServiceCardBlock.resolveFields(
        { props: { id: 'test-service', highlight: true } },
        { fields: ServiceCardBlock.fields, parent: parentIvory } as any,
      )

      const nameColorsNavy = (fieldsNavy.nameColor as any).options.map((o: any) => o.value)
      const textColorsNavy = (fieldsNavy.textColor as any).options.map((o: any) => o.value)

      expect(nameColorsNavy).toContain('white')
      expect(nameColorsNavy).toContain('soft-pink')
      expect(nameColorsNavy).not.toContain('deep-navy')

      const navyHex = BRAND_HEX_MAP['deep-navy']
      for (const colorName of nameColorsNavy) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, navyHex)
        expect(ratio, `Color ${colorName} on deep-navy card should meet AA`).toBeGreaterThanOrEqual(
          4.5,
        )
      }
      for (const colorName of textColorsNavy) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, navyHex)
        expect(ratio, `Color ${colorName} on deep-navy card should meet AA`).toBeGreaterThanOrEqual(
          4.5,
        )
      }

      // Case 2: Normal service card on warm-ivory (white card background)
      const fieldsWhite = await ServiceCardBlock.resolveFields(
        { props: { id: 'test-service', highlight: false } },
        { fields: ServiceCardBlock.fields, parent: parentIvory } as any,
      )

      const nameColorsWhite = (fieldsWhite.nameColor as any).options.map((o: any) => o.value)
      const textColorsWhite = (fieldsWhite.textColor as any).options.map((o: any) => o.value)

      expect(nameColorsWhite).toContain('deep-navy')
      expect(nameColorsWhite).not.toContain('white')

      const whiteHex = BRAND_HEX_MAP['white']
      for (const colorName of nameColorsWhite) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, whiteHex)
        expect(ratio, `Color ${colorName} on white card should meet AA 3.0`).toBeGreaterThanOrEqual(
          3.0,
        )
      }
      for (const colorName of textColorsWhite) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, whiteHex)
        expect(ratio, `Color ${colorName} on white card should meet AA 4.5`).toBeGreaterThanOrEqual(
          4.5,
        )
      }
    })

    it('PackageCard resolveFields returns WCAG AA compliant colors for normal and navy parent', async () => {
      if (typeof PackageCardBlock.resolveFields !== 'function') {
        throw new Error('PackageCardBlock.resolveFields must be defined')
      }

      // Case 1: PackageCard in PackageCards with warm-ivory parent (white card)
      const parentIvory = {
        type: 'PackageCards',
        props: { bgColor: 'warm-ivory' },
      }
      const fieldsWhite = await PackageCardBlock.resolveFields(
        { props: { id: 'test-pkg', highlight: false } },
        { fields: PackageCardBlock.fields, parent: parentIvory } as any,
      )

      const nameColorsWhite = (fieldsWhite.nameColor as any).options.map((o: any) => o.value)
      const textColorsWhite = (fieldsWhite.textColor as any).options.map((o: any) => o.value)

      expect(nameColorsWhite).toContain('deep-navy')
      expect(nameColorsWhite).not.toContain('white')

      const whiteHex = BRAND_HEX_MAP['white']
      for (const colorName of nameColorsWhite) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        const ratio = getContrastRatio(textHex, whiteHex)
        expect(ratio, `Color ${colorName} on white card should meet AA 3.0`).toBeGreaterThanOrEqual(
          3.0,
        )
      }
      for (const colorName of textColorsWhite) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        const ratio = getContrastRatio(textHex, whiteHex)
        expect(ratio, `Color ${colorName} on white card should meet AA 4.5`).toBeGreaterThanOrEqual(
          4.5,
        )
      }

      // Case 2: PackageCard in PackageCards with deep-navy parent
      const parentNavy = {
        type: 'PackageCards',
        props: { bgColor: 'deep-navy' },
      }
      const fieldsNavy = await PackageCardBlock.resolveFields(
        { props: { id: 'test-pkg', highlight: true } },
        { fields: PackageCardBlock.fields, parent: parentNavy } as any,
      )

      const nameColorsNavy = (fieldsNavy.nameColor as any).options.map((o: any) => o.value)
      expect(nameColorsNavy).toContain('white')
      expect(nameColorsNavy).toContain('soft-pink')
      expect(nameColorsNavy).not.toContain('deep-navy')
    })
  })

  describe('No free text inputs: presets only', () => {
    it('ServiceCardBlock only uses external picker and select dropdowns, no name/price fields', () => {
      const fields = ServiceCardBlock.fields as Record<string, any>

      expect(fields.serviceId.type).toBe('external')
      expect(fields.highlight.type).toBe('select')
      expect(fields.nameColor.type).toBe('select')
      expect(fields.textColor.type).toBe('select')
      expect(fields.nameSize.type).toBe('select')
      expect(fields.textSize.type).toBe('select')
      expect(fields.align.type).toBe('select')

      // Must NOT contain free text or price inputs
      expect(fields.name).toBeUndefined()
      expect(fields.price).toBeUndefined()
      expect(fields.cost).toBeUndefined()
      expect(fields.image).toBeUndefined()
    })

    it('PackageCardBlock only uses external picker and select dropdowns, no name/price fields', () => {
      const fields = PackageCardBlock.fields as Record<string, any>

      expect(fields.packageId.type).toBe('external')
      expect(fields.highlight.type).toBe('select')
      expect(fields.nameColor.type).toBe('select')
      expect(fields.textColor.type).toBe('select')
      expect(fields.nameSize.type).toBe('select')
      expect(fields.textSize.type).toBe('select')
      expect(fields.align.type).toBe('select')

      // Must NOT contain free text or price inputs
      expect(fields.name).toBeUndefined()
      expect(fields.price).toBeUndefined()
      expect(fields.discount).toBeUndefined()
      expect(fields.totalValue).toBeUndefined()
    })
  })

  describe('Sidebar visibility & Canvas restrictions', () => {
    it('ServiceCard and PackageCard are not in any visible category on the sidebar', () => {
      const categories = puckConfig.categories || {}

      for (const [key, category] of Object.entries(categories)) {
        if (key === 'other') continue
        const componentList = category.components || []
        expect(componentList).not.toContain('ServiceCard')
        expect(componentList).not.toContain('PackageCard')
      }

      expect(categories.other?.visible).toBe(false)
    })

    it('ServiceCardBlock and PackageCardBlock have permissions.insert = false', () => {
      expect(ServiceCardBlock.permissions?.insert).toBe(false)
      expect(PackageCardBlock.permissions?.insert).toBe(false)
    })

    it('Columns.col1, col2, col3 disallow ServiceCard and PackageCard', () => {
      const columnsBlock = puckConfig.components.Columns as any
      expect(columnsBlock).toBeDefined()

      expect(columnsBlock.fields.col1.disallow).toContain('ServiceCard')
      expect(columnsBlock.fields.col1.disallow).toContain('PackageCard')
      expect(columnsBlock.fields.col2.disallow).toContain('ServiceCard')
      expect(columnsBlock.fields.col2.disallow).toContain('PackageCard')
      expect(columnsBlock.fields.col3.disallow).toContain('ServiceCard')
      expect(columnsBlock.fields.col3.disallow).toContain('PackageCard')
    })
  })

  describe('Server-side rendering of ServiceCards and PackageCards with v2 slots', () => {
    it('renders ServiceCards and PackageCards without throwing when cards slot is provided', () => {
      const sampleServiceCard = React.createElement('div', { key: 's1' }, 'Khám phá nội tâm')
      const samplePackageCard = React.createElement('div', { key: 'p1' }, 'Gói Clear')

      const serviceCardsHtml = renderToStaticMarkup(
        <ServiceCards
          titleLine1="CÁC DỊCH VỤ"
          titleLine2="COACHING"
          columns={2}
          cards={[sampleServiceCard]}
        />,
      )
      expect(serviceCardsHtml).toContain('CÁC DỊCH VỤ')
      expect(serviceCardsHtml).toContain('Khám phá nội tâm')

      const packageCardsHtml = renderToStaticMarkup(
        <PackageCards
          titleLine1="BA GIAI ĐOẠN"
          titleLine2="ĐỒNG HÀNH"
          cards={[samplePackageCard]}
        />,
      )
      expect(packageCardsHtml).toContain('BA GIAI ĐOẠN')
      expect(packageCardsHtml).toContain('Gói Clear')
    })

    it('renders with Puck <Render> on public page data containing v2 ServiceCards and PackageCards', () => {
      const pageData = {
        root: { props: { title: 'Test Public Page' } },
        content: [
          {
            type: 'ServiceCards',
            props: {
              id: 'services-test',
              version: 2,
              titleLine1: 'DỊCH VỤ',
              titleLine2: 'ĐỒNG HÀNH',
              columns: 1,
              cards: [
                {
                  type: 'ServiceCard',
                  props: {
                    id: 'services-test-card-0',
                    serviceId: 'srv-1',
                    highlight: false,
                    _resolved: {
                      service: {
                        id: 'srv-1',
                        name: 'Khai vấn Cảm xúc Cá nhân',
                        slug: 'khai-van-cam-xuc-ca-nhan',
                      },
                    },
                  },
                },
              ],
            },
          },
          {
            type: 'PackageCards',
            props: {
              id: 'packages-test',
              version: 2,
              titleLine1: 'LỘ TRÌNH',
              titleLine2: 'GROWTH MIRROR',
              style: 'numbered',
              cards: [
                {
                  type: 'PackageCard',
                  props: {
                    id: 'packages-test-card-0',
                    packageId: 'pkg-1',
                    highlight: true,
                    _resolved: {
                      package: {
                        id: 1,
                        name: 'Gói CLEAR',
                        slug: 'clear',
                        type: 'package',
                        price: 1750000,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      }

      const html = renderToStaticMarkup(<Render config={puckConfig} data={pageData as any} />)
      expect(html).toContain('DỊCH VỤ')
      expect(html).toContain('Khai vấn Cảm xúc Cá nhân')
      expect(html).toContain('GROWTH MIRROR')
      expect(html).toContain('Gói CLEAR')
    })
  })
  describe('PK-04c: giữ giao diện v1', () => {
    const service = { id: 1, name: '[MẪU] Dịch vụ', slug: 'dv' }
    const pkg = { id: 2, name: '[MẪU] Gói', slug: 'goi', type: 'package' }

    it('thẻ dịch vụ nổi bật với màu mặc định đã lưu (deep-navy) vẫn có tên chữ trắng', () => {
      const html = renderToStaticMarkup(
        <ServiceCardItem
          serviceId={1}
          highlight
          nameColor="deep-navy"
          textColor="deep-navy"
          _resolved={{ service } as never}
        />,
      )
      expect(html).toContain('bg-deep-navy')
      expect(html).toMatch(/<h3 class="[^"]*\btext-white\b[^"]*">\[MẪU\] Dịch vụ/)
    })

    it('thẻ dịch vụ không nổi bật luôn nền trắng như v1, kể cả section navy', () => {
      const html = renderToStaticMarkup(
        <ServiceCardItem serviceId={1} isDeepNavy _resolved={{ service } as never} />,
      )
      expect(html).toContain('bg-white border-deep-navy/10')
      expect(html).not.toContain('bg-white/10')
    })

    it('thẻ gói trong slot đổi sang nền mờ / chữ sáng theo data-bg của section navy', () => {
      const html = renderToStaticMarkup(
        <PackageCardItem packageId={2} _resolved={{ package: pkg } as never} />,
      )
      expect(html).toContain('group-data-[bg=deep-navy]/grid:bg-white/10')
      expect(html).toContain('group-data-[bg=deep-navy]/grid:text-white')
    })

    it('khối rỗng (visibleCardCount = 0) ẩn trên trang công khai, vẫn hiện trong builder', () => {
      const Slot = () => null
      const pub = renderToStaticMarkup(
        <ServiceCards titleLine1="[MẪU] DV" cards={Slot} _resolved={{ visibleCardCount: 0 }} />,
      )
      expect(pub).toBe('')
      const pubPkg = renderToStaticMarkup(
        <PackageCards titleLine1="[MẪU] GÓI" cards={Slot} _resolved={{ visibleCardCount: 0 }} />,
      )
      expect(pubPkg).toBe('')
      const editing = renderToStaticMarkup(
        <ServiceCards
          titleLine1="[MẪU] DV"
          cards={Slot}
          _resolved={{ visibleCardCount: 0 }}
          puck={{ isEditing: true }}
        />,
      )
      expect(editing).toContain('[MẪU] DV')
    })
  })
})
