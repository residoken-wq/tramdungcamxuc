import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Render } from '@puckeditor/core'
import { puckConfig } from '@/puck/config'
import {
  homeV2Template,
  coachTemplate,
  aboutTemplate,
  resourcesTemplate,
  communityTemplate,
  contactTemplate,
  journeyTemplate,
} from '@/puck/templates'

describe('PK-22 Website v2 Templates', () => {
  const v2Templates = [
    {
      key: 'home-v2',
      name: 'Trang chủ',
      data: homeV2Template,
      expectedFirstTitle: 'Hiểu mình rõ. Hành động bền bỉ.',
    },
    {
      key: 'coach',
      name: 'Trang Coach 1:1',
      data: coachTemplate,
      expectedFirstTitle: 'Khai vấn chuyên sâu (1:1 Coaching)',
    },
    {
      key: 'about',
      name: 'Trang Về Trạm',
      data: aboutTemplate,
      expectedFirstTitle: 'Nơi mọi sự chuyển hóa bắt đầu từ bên trong',
    },
    {
      key: 'resources',
      name: 'Trang Tài nguyên',
      data: resourcesTemplate,
      expectedFirstTitle: 'Thư viện tri thức & công cụ',
    },
    {
      key: 'community',
      name: 'Trang Cộng đồng',
      data: communityTemplate,
      expectedFirstTitle: 'Cộng đồng của Trạm',
    },
    {
      key: 'contact',
      name: 'Trang Liên hệ',
      data: contactTemplate,
      expectedFirstTitle: 'Lắng nghe để kiến tạo sự chuyển hóa',
    },
  ]

  const prohibitedStrings = ['Techcombank', 'Vinamilk', 'hoàn tiền', 'ATM/Visa', '0930']

  it('every component type in all 6 v2 templates exists in puckConfig.components', () => {
    const validComponentTypes = new Set(Object.keys(puckConfig.components))

    for (const { key, data } of v2Templates) {
      expect(Array.isArray(data.content), `Template ${key} content should be an array`).toBe(true)
      expect(data.content.length, `Template ${key} content should not be empty`).toBeGreaterThan(0)

      for (const item of data.content) {
        expect(
          validComponentTypes.has(item.type),
          `Template ${key} contains invalid component type: ${item.type}`,
        ).toBe(true)
        expect(item.props).toBeDefined()
        expect(typeof item.props.id).toBe('string')
      }

      if (data.zones) {
        for (const [zoneKey, zoneItems] of Object.entries(data.zones)) {
          if (Array.isArray(zoneItems)) {
            for (const item of zoneItems) {
              expect(
                validComponentTypes.has(item.type),
                `Template ${key} zone ${zoneKey} contains invalid component type: ${item.type}`,
              ).toBe(true)
            }
          }
        }
      }
    }
  })

  it('renders all 6 templates through Puck Render without crashing', () => {
    for (const { key, data } of v2Templates) {
      const { container } = render(React.createElement(Render, { config: puckConfig, data }))
      expect(container).toBeDefined()
      expect(container.innerHTML.length, `Template ${key} rendered empty HTML`).toBeGreaterThan(0)
    }
  })

  it('each template has its expected first title matching the website v2 design spec', () => {
    for (const { key, data, expectedFirstTitle } of v2Templates) {
      const jsonString = JSON.stringify(data)
      expect(
        jsonString.includes(expectedFirstTitle),
        `Template ${key} does not contain first title: "${expectedFirstTitle}"`,
      ).toBe(true)
    }
  })

  it('none of the 6 templates contain prohibited strings', () => {
    for (const { key, data } of v2Templates) {
      const jsonString = JSON.stringify(data)
      for (const prohibited of prohibitedStrings) {
        expect(
          jsonString.toLowerCase().includes(prohibited.toLowerCase()),
          `Template ${key} contains prohibited string: "${prohibited}"`,
        ).toBe(false)
      }
    }
  })

  it('all 6 v2 templates have empty zones', () => {
    for (const { key, data } of v2Templates) {
      expect(
        Object.keys(data.zones || {}).length,
        `Template ${key} should have empty zones object`,
      ).toBe(0)
    }
  })

  it('every Columns block defines children in props.col1 and props.col2 slot arrays', () => {
    for (const { key, data } of v2Templates) {
      const columnBlocks = data.content.filter((item) => item.type === 'Columns')
      for (const colBlock of columnBlocks) {
        expect(
          Array.isArray(colBlock.props?.col1) && colBlock.props.col1.length > 0,
          `Columns block ${colBlock.props?.id} in ${key} should have children in props.col1`,
        ).toBe(true)
        expect(
          Array.isArray(colBlock.props?.col2) && colBlock.props.col2.length > 0,
          `Columns block ${colBlock.props?.id} in ${key} should have children in props.col2`,
        ).toBe(true)
      }
    }
  })

  it('renders HTML of each template containing expected child titles in Columns slots', () => {
    const slotChildTitles: Record<string, string[]> = {
      'home-v2': ['Bắt đầu hành trình'],
      coach: ['Bạn đang đối mặt với những lựa chọn khó khăn?', 'Bước vào không gian của riêng bạn'],
      about: ['Chuẩn mực Khai vấn ICF'],
      community: ['Hành trình 30 Phút', 'Vài điều giữ cho nhau'],
      contact: ['Lắng nghe để kiến tạo sự chuyển hóa'],
    }

    // Also assert that home-v2 col1 slot contains the LeadMagnetCarousel with "Quà tặng miễn phí"
    const homeCols = homeV2Template.content.find((i) => i.props?.id === 'home-v2-footer-cols')
    expect(
      (homeCols?.props?.col1 as Array<{ props?: { titleLine1?: string } }>)?.[0]?.props?.titleLine1,
    ).toBe('Quà tặng miễn phí')

    for (const { key, data } of v2Templates) {
      const titles = slotChildTitles[key]
      if (!titles) continue
      const { container } = render(React.createElement(Render, { config: puckConfig, data }))
      for (const expectedTitle of titles) {
        expect(
          container.innerHTML.includes(expectedTitle),
          `Template ${key} rendered HTML should contain child title "${expectedTitle}" from Columns slot`,
        ).toBe(true)
      }
    }
  })

  // PK-26 rebuilt journey.ts from Hana's 20-page design; only the anchors below stay fixed.
  it('journey.ts template keeps its title and hero', () => {
    expect(journeyTemplate.root.props?.title).toBe('Trang lộ trình')
    expect(journeyTemplate.content.length).toBeGreaterThan(0)
    expect(journeyTemplate.content[0].type).toBe('HeroImage')
    const jsonString = JSON.stringify(journeyTemplate)
    expect(jsonString).toContain('Chuyển mình')
    expect(jsonString).toContain('không chênh vênh')
  })
})
