import { describe, expect, it } from 'vitest'
import { CardBlock } from '@/puck/blocks/Card'
import { puckConfig } from '@/puck/config'
import { getCardRealBg, allowedTextColors } from '@/lib/brand/format-classes'
// Mã hex chuẩn từ Brand Book 2026 và tailwind.config.ts / styles.css
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

describe('PK-02: Card child block - Contrast, Presets & Permissions', () => {
  describe('WCAG AA contrast for Card real background', () => {
    it('getCardRealBg determines correct real background based on cardStyle and grid bgColor', () => {
      // White style -> white
      expect(
        getCardRealBg({
          type: 'IconCardGrid',
          props: { bgColor: 'warm-ivory', cardStyle: 'white' },
        }),
      ).toBe('white')

      // Soft style -> soft-pink
      expect(
        getCardRealBg({
          type: 'IconCardGrid',
          props: { bgColor: 'warm-ivory', cardStyle: 'soft' },
        }),
      ).toBe('soft-pink')

      // Outline on warm-ivory -> warm-ivory
      expect(
        getCardRealBg({
          type: 'IconCardGrid',
          props: { bgColor: 'warm-ivory', cardStyle: 'outline' },
        }),
      ).toBe('warm-ivory')

      // Outline on soft-pink -> soft-pink
      expect(
        getCardRealBg({
          type: 'IconCardGrid',
          props: { bgColor: 'soft-pink', cardStyle: 'outline' },
        }),
      ).toBe('soft-pink')

      // Any cardStyle on deep-navy parent -> deep-navy
      expect(
        getCardRealBg({
          type: 'IconCardGrid',
          props: { bgColor: 'deep-navy', cardStyle: 'white' },
        }),
      ).toBe('deep-navy')
      expect(
        getCardRealBg({
          type: 'IconCardGrid',
          props: { bgColor: 'deep-navy', cardStyle: 'soft' },
        }),
      ).toBe('deep-navy')
      expect(
        getCardRealBg({
          type: 'IconCardGrid',
          props: { bgColor: 'deep-navy', cardStyle: 'outline' },
        }),
      ).toBe('deep-navy')

      // Fallback without parent -> warm-ivory
      expect(getCardRealBg(null)).toBe('warm-ivory')
      expect(getCardRealBg(undefined)).toBe('warm-ivory')
    })

    it('khi thẻ ở nền warm-ivory / white: titleColor và textColor không được chứa warm-ivory hay white', () => {
      const whiteColors = allowedTextColors('white', false).map((opt) => opt.value)
      expect(whiteColors).not.toContain('white')
      expect(whiteColors).not.toContain('warm-ivory')
      expect(whiteColors).toContain('deep-navy')

      const ivoryColors = allowedTextColors('warm-ivory', false).map((opt) => opt.value)
      expect(ivoryColors).not.toContain('white')
      expect(ivoryColors).not.toContain('warm-ivory')
      expect(ivoryColors).toContain('deep-navy')
    })

    it('khi thẻ ở nền deep-navy: màu trả về đạt chuẩn tương phản trên nền tối và không chứa deep-navy', () => {
      const darkColors = allowedTextColors('deep-navy', false).map((opt) => opt.value)
      expect(darkColors).not.toContain('deep-navy')
      expect(darkColors).toContain('white')
      expect(darkColors).toContain('soft-pink')

      // WCAG AA check: every color option on deep-navy must have contrast >= 4.5
      const navyHex = BRAND_HEX_MAP['deep-navy']
      for (const colorName of darkColors) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, navyHex)
        expect(ratio).toBeGreaterThanOrEqual(4.5)
      }
    })

    it('resolveFields lọc đúng danh sách màu qua parent context', async () => {
      if (typeof CardBlock.resolveFields !== 'function') {
        throw new Error('CardBlock.resolveFields must be defined')
      }

      // Case 1: parent IconCardGrid with deep-navy
      const parentNavy = {
        type: 'IconCardGrid',
        props: { bgColor: 'deep-navy', cardStyle: 'outline' },
      }
      const fieldsNavy = await CardBlock.resolveFields(
        { props: { id: 'test-card', titleSize: 'md' } },
        { fields: CardBlock.fields, parent: parentNavy } as any,
      )

      const titleColorsNavy = (fieldsNavy.titleColor as any).options.map((o: any) => o.value)
      expect(titleColorsNavy).toContain('white')
      expect(titleColorsNavy).not.toContain('deep-navy')

      // Case 2: parent IconCardGrid with warm-ivory & cardStyle white
      const parentWhite = {
        type: 'IconCardGrid',
        props: { bgColor: 'warm-ivory', cardStyle: 'white' },
      }
      const fieldsWhite = await CardBlock.resolveFields(
        { props: { id: 'test-card', titleSize: 'md' } },
        { fields: CardBlock.fields, parent: parentWhite } as any,
      )

      const titleColorsWhite = (fieldsWhite.titleColor as any).options.map((o: any) => o.value)
      expect(titleColorsWhite).toContain('deep-navy')
      expect(titleColorsWhite).not.toContain('white')
      expect(titleColorsWhite).not.toContain('warm-ivory')
    })
  })

  describe('No free inputs: presets only', () => {
    it('CardBlock chỉ dùng dropdown select cho màu, cỡ chữ và căn lề', () => {
      const fields = CardBlock.fields as Record<string, any>

      expect(fields.titleColor.type).toBe('select')
      expect(fields.textColor.type).toBe('select')
      expect(fields.titleSize.type).toBe('select')
      expect(fields.textSize.type).toBe('select')
      expect(fields.align.type).toBe('select')
      expect(fields.icon.type).toBe('select')

      // Text and textarea fields are only for content
      expect(fields.title.type).toBe('text')
      expect(fields.text.type).toBe('textarea')
    })
  })

  describe('Sidebar visibility & Canvas restrictions', () => {
    it('Card không nằm trong bất kỳ category nào hiển thị trên sidebar', () => {
      const categories = puckConfig.categories || {}

      for (const [key, category] of Object.entries(categories)) {
        if (key === 'other') continue
        const componentList = category.components || []
        expect(componentList).not.toContain('Card')
      }

      // Category other is hidden
      expect(categories.other?.visible).toBe(false)
    })

    it('CardBlock có permissions.insert = false để ngăn kéo trực tiếp lên root canvas', () => {
      expect(CardBlock.permissions?.insert).toBe(false)
    })

    it('Columns.col1, col2, col3 đều cấm Card (disallow chứa Card)', () => {
      const columnsBlock = puckConfig.components.Columns as any
      expect(columnsBlock).toBeDefined()

      expect(columnsBlock.fields.col1.disallow).toContain('Card')
      expect(columnsBlock.fields.col2.disallow).toContain('Card')
      expect(columnsBlock.fields.col3.disallow).toContain('Card')
    })
  })
})
