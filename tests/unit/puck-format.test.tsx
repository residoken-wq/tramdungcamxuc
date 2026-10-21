import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Data } from '@puckeditor/core'
import {
  allowedTextColors,
  textColorClass,
  emotionColorClass,
  fontSizeClass,
  type FontSizeOption,
} from '@/lib/brand/format-classes'
import { SECTION_BG_COLOR_OPTIONS } from '@/puck/constants'
import { puckConfig } from '@/puck/config'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { migrateSectionHeaderV1ToV2 } from '@/puck/migrations/v2-section-header'
import { applyPuckMigrations } from '@/puck/migrations'

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

// Công thức chuẩn WCAG tính độ chói tương đối (relative luminance)
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

// Công thức chuẩn WCAG tính tỷ lệ tương phản
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('PK-01: Shared Format Presets & allowedTextColors WCAG AA', () => {
  const backgrounds = SECTION_BG_COLOR_OPTIONS.map((opt) => opt.value)
  const sizes: FontSizeOption[] = ['sm', 'md', 'lg']

  it('mọi cặp (nền × cỡ × màu) mà allowedTextColors trả về đều đạt ngưỡng WCAG AA', () => {
    for (const bg of backgrounds) {
      const bgHex = BRAND_HEX_MAP[bg]
      expect(bgHex).toBeDefined()

      for (const size of sizes) {
        const allowed = allowedTextColors(bg, size)
        expect(allowed.length).toBeGreaterThan(0)

        const isLarge = size === 'lg'
        const minContrast = isLarge ? 3.0 : 4.5

        for (const opt of allowed) {
          const fgHex = BRAND_HEX_MAP[opt.value]
          expect(fgHex, `Màu chữ ${opt.value} không nằm trong bảng hex chuẩn`).toBeDefined()

          const ratio = getContrastRatio(bgHex, fgHex)
          expect(
            ratio,
            `Cặp nền [${bg}] và chữ [${opt.value}] cỡ [${size}] có tỷ lệ tương phản ${ratio.toFixed(2)}, không đạt ngưỡng AA tối thiểu ${minContrast}:1`,
          ).toBeGreaterThanOrEqual(minContrast)
        }
      }
    }
  })

  it('loại bright-magenta trên lavender-mist ở cỡ nhỏ (sm) và vừa (md), nhưng cho phép ở cỡ lớn (lg)', () => {
    const smColors = allowedTextColors('lavender-mist', 'sm').map((o) => o.value)
    const mdColors = allowedTextColors('lavender-mist', 'md').map((o) => o.value)
    const lgColors = allowedTextColors('lavender-mist', 'lg').map((o) => o.value)

    expect(smColors).not.toContain('bright-magenta')
    expect(mdColors).not.toContain('bright-magenta')
    expect(lgColors).toContain('bright-magenta')

    // Tỷ lệ thực tế ~ 4.44 (đạt ngưỡng 3.0 của chữ lớn, nhưng trượt 4.5 của chữ thường)
    const ratio = getContrastRatio(BRAND_HEX_MAP['lavender-mist'], BRAND_HEX_MAP['bright-magenta'])
    expect(ratio).toBeGreaterThanOrEqual(3.0)
    expect(ratio).toBeLessThan(4.5)
  })

  it('loại accent-pink trên lavender-mist ở mọi cỡ vì tương phản < 3.0', () => {
    for (const size of sizes) {
      const colors = allowedTextColors('lavender-mist', size).map((o) => o.value)
      expect(colors).not.toContain('accent-pink')
    }

    const ratio = getContrastRatio(BRAND_HEX_MAP['lavender-mist'], BRAND_HEX_MAP['accent-pink'])
    expect(ratio).toBeLessThan(3.0)
  })

  it('trên nền deep-navy chỉ cho phép white và soft-pink ở mọi cỡ', () => {
    for (const size of sizes) {
      const colors = allowedTextColors('deep-navy', size).map((o) => o.value)
      expect(colors).toEqual(['white', 'soft-pink'])

      const whiteRatio = getContrastRatio(BRAND_HEX_MAP['deep-navy'], BRAND_HEX_MAP['white'])
      const pinkRatio = getContrastRatio(BRAND_HEX_MAP['deep-navy'], BRAND_HEX_MAP['soft-pink'])
      expect(whiteRatio).toBeGreaterThanOrEqual(4.5)
      expect(pinkRatio).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('trên nền pastel/warm-ivory: deep-navy luôn được, accent-pink chỉ cho phép ở cỡ lớn', () => {
    const pastelBgs = ['warm-ivory', 'soft-pink', 'mint-haze', 'butter-cream'] as const
    for (const bg of pastelBgs) {
      const smColors = allowedTextColors(bg, 'sm').map((o) => o.value)
      const lgColors = allowedTextColors(bg, 'lg').map((o) => o.value)

      expect(smColors).toContain('deep-navy')
      expect(smColors).not.toContain('accent-pink')
      expect(lgColors).toContain('accent-pink')
    }
  })

  it('mặc định bg là warm-ivory khi không truyền hoặc truyền giá trị rỗng', () => {
    const defaultAllowed = allowedTextColors()
    const warmIvoryAllowed = allowedTextColors('warm-ivory', 'md')
    expect(defaultAllowed).toEqual(warmIvoryAllowed)
  })
})

describe('PK-01: Static Class Mappers', () => {
  it('textColorClass trả về các chuỗi class Tailwind tĩnh đúng quy chuẩn', () => {
    expect(textColorClass('deep-navy')).toBe('text-deep-navy')
    expect(textColorClass('bright-magenta')).toBe('text-bright-magenta')
    expect(textColorClass('accent-pink')).toBe('text-accent-pink')
    expect(textColorClass('white')).toBe('text-white')
    expect(textColorClass('soft-pink')).toBe('text-soft-pink')
    expect(textColorClass(undefined)).toBe('text-deep-navy')
  })

  it('emotionColorClass trả về class hợp lệ, giữ độ mờ 85% cho deep-navy', () => {
    expect(emotionColorClass('deep-navy')).toBe('text-deep-navy/85')
    expect(emotionColorClass('white')).toBe('text-white/90')
    expect(emotionColorClass('bright-magenta')).toBe('text-bright-magenta')
    expect(emotionColorClass('accent-pink')).toBe('text-accent-pink')
  })

  it('fontSizeClass tịnh tiến đúng thang bậc theo Heading level và kích cỡ', () => {
    // H1: md = 4xl..6xl; sm lùi 1 bậc (3xl..5xl); lg tiến 1 bậc (5xl..7xl)
    expect(fontSizeClass('title', 'md', 'h1')).toBe('text-4xl sm:text-5xl lg:text-6xl')
    expect(fontSizeClass('title', 'sm', 'h1')).toBe('text-3xl sm:text-4xl lg:text-5xl')
    expect(fontSizeClass('title', 'lg', 'h1')).toBe('text-5xl sm:text-6xl lg:text-7xl')

    // H2: md = 3xl..5xl; sm lùi 1 bậc (2xl..4xl); lg tiến 1 bậc (4xl..6xl)
    expect(fontSizeClass('title', 'md', 'h2')).toBe('text-3xl sm:text-4xl lg:text-5xl')
    expect(fontSizeClass('title', 'sm', 'h2')).toBe('text-2xl sm:text-3xl lg:text-4xl')
    expect(fontSizeClass('title', 'lg', 'h2')).toBe('text-4xl sm:text-5xl lg:text-6xl')

    // H3: md = 2xl..4xl; sm lùi 1 bậc (xl..3xl); lg tiến 1 bậc (3xl..5xl)
    expect(fontSizeClass('title', 'md', 'h3')).toBe('text-2xl sm:text-3xl lg:text-4xl')
    expect(fontSizeClass('title', 'sm', 'h3')).toBe('text-xl sm:text-2xl lg:text-3xl')
    expect(fontSizeClass('title', 'lg', 'h3')).toBe('text-3xl sm:text-4xl lg:text-5xl')

    // quote: md = text-lg sm:text-xl (đúng cỡ mặc định emotionLine)
    expect(fontSizeClass('quote', 'md')).toBe('text-lg sm:text-xl')
    expect(fontSizeClass('quote', 'sm')).toBe('text-base sm:text-lg')
    expect(fontSizeClass('quote', 'lg')).toBe('text-xl sm:text-2xl')

    // body: md = text-base sm:text-lg
    expect(fontSizeClass('body', 'md')).toBe('text-base sm:text-lg')
    expect(fontSizeClass('body', 'sm')).toBe('text-sm sm:text-base')
    expect(fontSizeClass('body', 'lg')).toBe('text-lg sm:text-xl')
  })
})

describe('PK-01: SectionHeader v2 Migration & Snapshot Parity', () => {
  const sampleV1Data: Data = {
    content: [
      {
        type: 'SectionHeader',
        props: {
          id: 'sh-1',
          version: 1,
          seriesLabel: '[MẪU] Series',
          titleLine1: '[MẪU] TIÊU ĐỀ DÒNG 1',
          titleLine2: '[MẪU] TIÊU ĐỀ DÒNG 2',
          emotionLine: '[MẪU] Dòng cảm xúc trích dẫn nhẹ nhàng',
          align: 'center',
          as: 'h2',
        },
      },
      {
        type: 'Columns',
        props: {
          id: 'col-container',
          distribution: 'equal',
          col1: [
            {
              type: 'SectionHeader',
              props: {
                id: 'sh-nested',
                version: 1,
                titleLine1: 'Tiêu đề cột 1',
              },
            },
          ],
        },
      },
    ],
    root: { props: { title: 'Trang mẫu' } },
  }

  it('nâng version lên 2 và điền đủ 6 prop định dạng mặc định cho cả khối gốc và khối lồng trong Columns', () => {
    const migrated = migrateSectionHeaderV1ToV2(sampleV1Data)

    const rootHeader = migrated.content[0].props as Record<string, unknown>
    expect(rootHeader.version).toBe(2)
    expect(rootHeader.line1Color).toBe('deep-navy')
    expect(rootHeader.line2Color).toBe('bright-magenta')
    expect(rootHeader.eyebrowColor).toBe('bright-magenta')
    expect(rootHeader.emotionColor).toBe('deep-navy')
    expect(rootHeader.titleSize).toBe('md')
    expect(rootHeader.emotionSize).toBe('md')

    const nestedCol1 = (migrated.content[1].props as Record<string, unknown>).col1 as Array<{
      props: Record<string, unknown>
    }>
    const nestedHeader = nestedCol1[0].props
    expect(nestedHeader.version).toBe(2)
    expect(nestedHeader.line1Color).toBe('deep-navy')
    expect(nestedHeader.line2Color).toBe('bright-magenta')
    expect(nestedHeader.titleSize).toBe('md')
  })

  it('chạy migration 2 lần cho kết quả không đổi (idempotent)', () => {
    const once = migrateSectionHeaderV1ToV2(sampleV1Data)
    const twice = migrateSectionHeaderV1ToV2(once)
    expect(twice).toEqual(once)
  })

  it('applyPuckMigrations tổng thể bao gồm migrateSectionHeaderV1ToV2', () => {
    const migrated = applyPuckMigrations(sampleV1Data)
    expect((migrated.content[0].props as Record<string, unknown>).version).toBe(2)
  })

  it('trang cũ (v1) sau migration render HTML giống hệt trước khi nâng cấp', () => {
    const v1Props = sampleV1Data.content[0].props as unknown as React.ComponentProps<
      typeof SectionHeader
    >
    const v2Props = migrateSectionHeaderV1ToV2(sampleV1Data).content[0]
      .props as unknown as React.ComponentProps<typeof SectionHeader>

    const v1Html = renderToStaticMarkup(<SectionHeader {...v1Props} />)
    const v2Html = renderToStaticMarkup(<SectionHeader {...v2Props} />)

    expect(v2Html).toBe(v1Html)
  })
})

interface ResolvedColorField {
  type?: string
  contentEditable?: boolean
  options?: Array<{ label: string; value: string }>
}

describe('PK-01: SectionHeader Puck Config & resolveFields', () => {
  it('cấu hình fields không chứa ô nhập tự do nào cho màu chữ hay cỡ chữ', () => {
    const block = puckConfig.components.SectionHeader
    expect(block).toBeDefined()
    expect(block.defaultProps?.version).toBe(2)

    const fields = block.fields as Record<string, ResolvedColorField>
    expect(fields.line1Color?.type).toBe('select')
    expect(fields.line2Color?.type).toBe('select')
    expect(fields.eyebrowColor?.type).toBe('select')
    expect(fields.emotionColor?.type).toBe('select')
    expect(fields.titleSize?.type).toBe('select')
    expect(fields.emotionSize?.type).toBe('select')

    // Bật contentEditable trên các trường văn bản
    expect(fields.titleLine1?.contentEditable).toBe(true)
    expect(fields.titleLine2?.contentEditable).toBe(true)
    expect(fields.seriesLabel?.contentEditable).toBe(true)
    expect(fields.emotionLine?.contentEditable).toBe(true)
  })

  it('resolveFields động lọc màu an toàn dựa trên nền của cha và cỡ chữ', () => {
    const block = puckConfig.components.SectionHeader
    expect(block.resolveFields).toBeDefined()

    type ResolveFn = (
      data: unknown,
      appState: unknown,
    ) => Record<string, { options: Array<{ label: string; value: string }> }>
    const resolve = block.resolveFields as unknown as ResolveFn

    // 1. Trên nền deep-navy: chỉ hiện white và soft-pink
    const resolvedNavy = resolve(
      { props: { titleSize: 'md' } },
      { parent: { props: { bgColor: 'deep-navy' } } },
    )
    const navyLine1Options = resolvedNavy.line1Color.options.map((o) => o.value)
    expect(navyLine1Options).toEqual(['white', 'soft-pink'])

    // 2. Trên nền lavender-mist với cỡ nhỏ (sm): bright-magenta bị loại
    const resolvedLavenderSm = resolve(
      { props: { titleSize: 'sm' } },
      { parent: { props: { bgColor: 'lavender-mist' } } },
    )
    const lavenderSmOptions = resolvedLavenderSm.line1Color.options.map((o) => o.value)
    expect(lavenderSmOptions).not.toContain('bright-magenta')

    // 3. Trên nền lavender-mist với cỡ lớn (lg): bright-magenta được phép
    const resolvedLavenderLg = resolve(
      { props: { titleSize: 'lg' } },
      { parent: { props: { bgColor: 'lavender-mist' } } },
    )
    const lavenderLgOptions = resolvedLavenderLg.line1Color.options.map((o) => o.value)
    expect(lavenderLgOptions).toContain('bright-magenta')
  })

  it('dòng cảm xúc (Playfair 20px thường) không bao giờ được accent-pink, kể cả cỡ Lớn', () => {
    type ResolveFn = (
      data: unknown,
      appState: unknown,
    ) => Record<string, { options: Array<{ label: string; value: string }> }>
    const resolve = puckConfig.components.SectionHeader.resolveFields as unknown as ResolveFn
    const resolved = resolve({ props: { emotionSize: 'lg' } }, { parent: null })
    const values = resolved.emotionColor.options.map((o) => o.value)
    expect(values).not.toContain('accent-pink')
    expect(values).toContain('deep-navy')
  })
})
