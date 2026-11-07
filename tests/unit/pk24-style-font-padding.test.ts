import { describe, expect, it } from 'vitest'
import { blockStyleCss, collectPageStyles } from '../../src/puck/style/style-css'
import { cleanDesignSystem } from '../../src/lib/design/design-system'

describe('PK-24: Tab Kiểu – font khối và khoảng cách trên / dưới', () => {
  const ds = cleanDesignSystem(null)

  describe('1. Font của khối áp cho mọi chữ trong khối (1.1)', () => {
    it('áp font-family cho mọi phần tử con [data-eb-id="x"][data-eb-id="x"] * khi có style.fontFamily', () => {
      const css = blockStyleCss('block-test', {
        fontFamily: 'Playfair Display',
      })

      // Luật cho lớp bọc
      expect(css).toContain("[data-eb-id=\"block-test\"]{font-family:'Playfair Display',serif}")
      // Luật cho mọi phần tử con với độ đặc hiệu (0,2,0) để thắng class font-* của Tailwind
      expect(css).toContain(
        "[data-eb-id=\"block-test\"][data-eb-id=\"block-test\"] *{font-family:'Playfair Display',serif}",
      )
    })

    it('không có fontFamily thì KHÔNG sinh luật font cho phần tử con', () => {
      const css = blockStyleCss('block-no-font', {
        background: 'soft-pink',
      })
      expect(css).not.toContain('font-family')
      expect(css).not.toContain('*')
    })

    it('áp đúng font display / sans-serif theo danh mục font', () => {
      const css = blockStyleCss('block-anton', {
        fontFamily: 'Anton',
      })
      expect(css).toContain(
        "[data-eb-id=\"block-anton\"][data-eb-id=\"block-anton\"] *{font-family:'Anton',sans-serif}",
      )
    })

    it('chữ chỉnh riêng (style.texts) có selector trực tiếp và được sinh sau font khối', () => {
      const css = blockStyleCss('block-texts', {
        fontFamily: 'Playfair Display',
        textColor: 'deep-navy',
        texts: {
          title: { color: 'bright-magenta', weight: 700 },
        },
      })

      // Font khối sinh trước
      const fontIndex = css.indexOf('[data-eb-id="block-texts"][data-eb-id="block-texts"] *')
      // Text target sinh sau
      const textIndex = css.indexOf('[data-eb-text="block-texts:title"][data-eb-text]')

      expect(fontIndex).toBeGreaterThan(-1)
      expect(textIndex).toBeGreaterThan(-1)
      expect(textIndex).toBeGreaterThan(fontIndex)

      // Chữ chỉnh riêng áp đúng thuộc tính mà font không ghi đè
      expect(css).toContain(
        '[data-eb-text="block-texts:title"][data-eb-text]{color:rgb(var(--color-bright-magenta-rgb));font-weight:700}',
      )
    })
  })

  describe('2. Cách lề trong trên / dưới thay khoảng đệm của khối (1.2)', () => {
    it('đặt padding top/bottom lên [data-eb-id="x"][data-eb-id="x"] > *, không đặt trên lớp bọc', () => {
      const css = blockStyleCss('block-pad', {
        padding: {
          desktop: { top: 'lg', bottom: 'md', left: 'sm', right: 'sm' },
        },
      })

      // Lớp bọc chỉ nhận left/right
      expect(css).toContain(
        '[data-eb-id="block-pad"]{padding-right:var(--space-breath-sm, 16px);padding-left:var(--space-breath-sm, 16px)}',
      )
      expect(css).not.toContain('[data-eb-id="block-pad"]{padding-top')
      expect(css).not.toContain('[data-eb-id="block-pad"]{padding-bottom')

      // Phần tử gốc bên trong (> *) nhận top/bottom
      expect(css).toContain(
        '[data-eb-id="block-pad"][data-eb-id="block-pad"] > *{padding-top:var(--space-breath-lg, 32px);padding-bottom:var(--space-breath-md, 24px)}',
      )
    })

    it('giá trị top = none/0 sinh ra padding-top:0 để khối sát rạt nhau', () => {
      const css = blockStyleCss('block-zero', {
        padding: {
          desktop: { top: 'none', bottom: 'none' },
        },
      })
      expect(css).toBe(
        '[data-eb-id="block-zero"][data-eb-id="block-zero"] > *{padding-top:0;padding-bottom:0}',
      )
    })

    it('áp dụng theo thiết bị trong @media cho tablet và mobile', () => {
      const css = blockStyleCss('block-resp', {
        padding: {
          tablet: { top: 'md' },
          mobile: { top: 'none', left: 'sm' },
        },
      })

      // Tablet: top padding nhắm > * trong media query
      expect(css).toContain(
        '@media (max-width: 1023px){[data-eb-id="block-resp"][data-eb-id="block-resp"] > *{padding-top:var(--space-breath-md, 24px)}}',
      )

      // Mobile: left padding trên wrapper, top padding trên > *
      expect(css).toContain(
        '@media (max-width: 767px){[data-eb-id="block-resp"]{padding-left:var(--space-breath-sm, 16px)}[data-eb-id="block-resp"][data-eb-id="block-resp"] > *{padding-top:0}}',
      )
    })

    it('khối Khung (Container) tự nhận padding tại chỗ trên lớp bọc, không sinh luật > *', () => {
      const containerCss = blockStyleCss(
        'Container-1',
        {
          background: 'soft-pink',
          padding: {
            desktop: { top: 'lg', bottom: 'md', left: 'sm', right: 'sm' },
            mobile: { top: 'sm' },
          },
        },
        true, // isContainer = true
      )

      // Padding nằm trực tiếp trên [data-eb-id="Container-1"]
      expect(containerCss).toContain(
        '[data-eb-id="Container-1"]{background-color:rgb(var(--color-soft-pink-rgb));padding-top:var(--space-breath-lg, 32px);padding-right:var(--space-breath-sm, 16px);padding-bottom:var(--space-breath-md, 24px);padding-left:var(--space-breath-sm, 16px)}',
      )
      expect(containerCss).toContain(
        '@media (max-width: 767px){[data-eb-id="Container-1"]{padding-top:var(--space-breath-sm, 16px)}}',
      )
      // Không hề có luật > *
      expect(containerCss).not.toContain('> *')
    })

    it('hỗ trợ options object { isContainer: true } cho Container', () => {
      const containerCss = blockStyleCss(
        'Container-2',
        {
          padding: { desktop: { top: 'lg' } },
        },
        { isContainer: true },
      )
      expect(containerCss).toBe(
        '[data-eb-id="Container-2"]{padding-top:var(--space-breath-lg, 32px)}',
      )
    })

    it('khối không có style hoặc không có style.padding sinh CSS GIỐNG HỆT trước', () => {
      const plainCss = blockStyleCss('block-plain', {
        background: 'mint-haze',
        textColor: 'deep-navy',
      })
      expect(plainCss).toBe(
        '[data-eb-id="block-plain"]{background-color:rgb(var(--color-mint-haze-rgb));color:rgb(var(--color-deep-navy-rgb))}',
      )
    })
  })

  describe('3. Tích hợp collectPageStyles cho trang hoàn chỉnh', () => {
    it('phân biệt Container và khối thường khi duyệt nội dung trang', () => {
      const openDs = {
        ...ds,
        lock: { ...ds.lock, fonts: 'open' as const },
      }
      const pageData = {
        content: [
          {
            type: 'Container',
            props: {
              id: 'c-1',
              _style: {
                padding: { desktop: { top: 'lg' } },
              },
            },
          },
          {
            type: 'SectionHeader',
            props: {
              id: 'hdr-1',
              _style: {
                fontFamily: 'Playfair Display',
                padding: { desktop: { top: 'none' } },
              },
            },
          },
        ],
      }

      const { css, fonts } = collectPageStyles(pageData, openDs)

      // Container giữ padding trên lớp bọc
      expect(css).toContain('[data-eb-id="c-1"]{padding-top:var(--space-breath-lg, 32px)}')
      expect(css).not.toContain('[data-eb-id="c-1"][data-eb-id="c-1"] > *')

      // SectionHeader nhận luật font con và padding top trên > *
      expect(css).toContain(
        "[data-eb-id=\"hdr-1\"][data-eb-id=\"hdr-1\"] *{font-family:'Playfair Display',serif}",
      )
      expect(css).toContain('[data-eb-id="hdr-1"][data-eb-id="hdr-1"] > *{padding-top:0}')

      expect(fonts).toEqual(['Playfair Display'])
    })
  })
})

