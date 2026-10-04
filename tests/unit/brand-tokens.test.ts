import { describe, expect, it } from 'vitest'
import tailwindConfig from '../../tailwind.config'
import { BRAND_COLORS_HEX, BrandColorToken } from '../../src/lib/brand/tokens'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

describe('Brand Design Tokens & Tailwind Palette Lock (T0-03)', () => {
  // 1. Hex khớp chính xác với AGENTS.md §5 và Brand Book 2026
  it('tất cả 8 mã hex phải khớp chính xác với AGENTS.md §5', () => {
    const AGENTS_MD_HEX: Record<BrandColorToken, string> = {
      'deep-navy': '#280A60',
      'bright-magenta': '#BC039E',
      'accent-pink': '#EF3B83',
      'soft-pink': '#FDE6F6',
      'lavender-mist': '#E9DDF9',
      'mint-haze': '#D9F1EA',
      'butter-cream': '#F6E9B8',
      'warm-ivory': '#FAF7F4',
    }

    expect(BRAND_COLORS_HEX).toEqual(AGENTS_MD_HEX)
  })

  // 2. Tailwind colors phải thay thế hoàn toàn theme.colors (không extend)
  it('Tailwind theme.colors phải khóa đúng bằng tập cho phép (white, transparent, current + 8 brand tokens)', () => {
    const expectedTokens = [
      'accent-pink',
      'bright-magenta',
      'butter-cream',
      'current',
      'deep-navy',
      'lavender-mist',
      'mint-haze',
      'soft-pink',
      'transparent',
      'warm-ivory',
      'white',
    ].sort()

    interface CustomTheme {
      colors?: Record<string, string>
      extend?: {
        colors?: Record<string, string>
        fontFamily?: Record<string, string[]>
        spacing?: Record<string, string>
        borderRadius?: Record<string, string>
        boxShadow?: Record<string, string>
        backgroundImage?: Record<string, string>
      }
    }

    const theme = tailwindConfig.theme as CustomTheme
    const actualColors = theme.colors
    expect(actualColors, 'theme.colors phải được định nghĩa ở cấp theme (thay thế), không được rỗng').toBeDefined()

    const actualTokens = Object.keys(actualColors!).sort()
    expect(actualTokens).toEqual(expectedTokens)

    // Đảm bảo không có theme.extend.colors nào làm rò rỉ màu mặc định
    const extendedColors = theme.extend?.colors
    expect(extendedColors, 'Không được dùng theme.extend.colors vì sẽ giữ lại bảng màu mặc định').toBeUndefined()
  })

  // 3. Chứng minh class bg-red-500 / text-gray-700 KHÔNG sinh CSS khi compile
  it('chứng minh class bg-red-500 và text-gray-700 không sinh CSS qua Tailwind', async () => {
    const sampleHtml = `
      <div class="bg-red-500 text-gray-700 text-blue-600 bg-deep-navy text-accent-pink">
        Brand token test
      </div>
    `

    const result = await postcss([
      tailwindcss({
        ...tailwindConfig,
        content: [{ raw: sampleHtml, extension: 'html' }],
      }),
    ]).process('@tailwind utilities;', { from: undefined })

    const css = result.css

    // Phải sinh các class brand token
    expect(css).toContain('bg-deep-navy')
    expect(css).toContain('text-accent-pink')

    // Tuyệt đối KHÔNG được sinh CSS cho các màu Tailwind mặc định
    expect(css).not.toContain('bg-red-500')
    expect(css).not.toContain('text-gray-700')
    expect(css).not.toContain('text-blue-600')
  })

  // 4. Kiểm tra cấu hình Typography (Font Family)
  it('cấu hình font families phải chứa đúng các font theo vai trò Brand Book', () => {
    const theme = tailwindConfig.theme as {
      extend?: {
        fontFamily?: Record<string, string[]>
      }
    }
    const fontFamily = theme.extend?.fontFamily
    expect(fontFamily).toBeDefined()

    expect(fontFamily?.display).toContain('Anton')
    expect(fontFamily?.ui).toContain('Montserrat')
    expect(fontFamily?.quote).toContain('Playfair Display')
  })

  // 5. Kiểm tra khoảng thở, bo góc, gradient
  it('cấu hình spacing, borderRadius, shadow, và gradient phải đầy đủ token thương hiệu', () => {
    const theme = tailwindConfig.theme as {
      extend?: {
        spacing?: Record<string, string>
        borderRadius?: Record<string, string>
        boxShadow?: Record<string, string>
        backgroundImage?: Record<string, string>
      }
    }
    const extend = theme.extend
    expect(extend?.spacing?.['breath-sm']).toBe('16px')
    expect(extend?.spacing?.['breath-md']).toBe('24px')
    expect(extend?.spacing?.['breath-lg']).toBe('32px')
    expect(extend?.borderRadius?.card).toBe('20px')
    expect(extend?.boxShadow?.soft).toBeDefined()
    expect(extend?.backgroundImage?.['brand-gradient']).toBeDefined()
  })
})
