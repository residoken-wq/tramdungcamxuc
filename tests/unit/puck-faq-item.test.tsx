/* eslint-disable @typescript-eslint/no-explicit-any -- loose types for resolveFields test params */
import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { render, screen, fireEvent } from '@testing-library/react'
import { Render } from '@puckeditor/core'
import { FaqItemBlock } from '@/puck/blocks/FaqItem'
import { FAQBlock } from '@/puck/blocks/FAQ'
import { FAQ } from '@/components/site/FAQ'
import { FaqItemView } from '@/components/site/FaqItemView'
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

describe('PK-05: FaqItem Child Block & FAQ v4 - Unit Tests', () => {
  describe('WCAG AA Contrast on real background (getChildRealBg & resolveFields)', () => {
    it('getChildRealBg determines correct real background for FaqItem', () => {
      // Parent FAQ on deep-navy -> deep-navy
      expect(getChildRealBg({ type: 'FAQ', props: { bgColor: 'deep-navy' } })).toBe('deep-navy')

      // Parent FAQ on warm-ivory / pastel -> white
      expect(getChildRealBg({ type: 'FAQ', props: { bgColor: 'warm-ivory' } })).toBe('white')
      expect(getChildRealBg({ type: 'FAQ', props: { bgColor: 'soft-pink' } })).toBe('white')
      expect(getChildRealBg({ type: 'FAQ', props: { bgColor: 'mint-haze' } })).toBe('white')

      // Fallback
      expect(getChildRealBg(null)).toBe('warm-ivory')
    })

    it('FaqItem resolveFields returns WCAG AA compliant colors for light and navy parent backgrounds', async () => {
      if (typeof FaqItemBlock.resolveFields !== 'function') {
        throw new Error('FaqItemBlock.resolveFields must be defined')
      }

      // Case 1: parent FAQ on deep-navy
      const parentNavy = {
        type: 'FAQ',
        props: { bgColor: 'deep-navy' },
      }
      const fieldsNavy = await FaqItemBlock.resolveFields(
        { props: { id: 'test-faq', questionSize: 'md', answerSize: 'md' } },
        { fields: FaqItemBlock.fields, parent: parentNavy } as any,
      )

      const questionColorsNavy = (fieldsNavy.questionColor as any).options.map((o: any) => o.value)
      const answerColorsNavy = (fieldsNavy.answerColor as any).options.map((o: any) => o.value)

      expect(questionColorsNavy).toContain('white')
      expect(questionColorsNavy).toContain('soft-pink')
      expect(questionColorsNavy).not.toContain('deep-navy')
      expect(answerColorsNavy).toContain('white')
      expect(answerColorsNavy).toContain('soft-pink')

      const navyHex = BRAND_HEX_MAP['deep-navy']
      for (const colorName of questionColorsNavy) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, navyHex)
        expect(ratio).toBeGreaterThanOrEqual(4.5)
      }

      // Case 2: parent FAQ on warm-ivory (card realBg is white)
      const parentLight = {
        type: 'FAQ',
        props: { bgColor: 'warm-ivory' },
      }
      const fieldsLight = await FaqItemBlock.resolveFields(
        { props: { id: 'test-faq', questionSize: 'md', answerSize: 'md' } },
        { fields: FaqItemBlock.fields, parent: parentLight } as any,
      )

      const questionColorsLight = (fieldsLight.questionColor as any).options.map((o: any) => o.value)
      const answerColorsLight = (fieldsLight.answerColor as any).options.map((o: any) => o.value)

      expect(questionColorsLight).toContain('deep-navy')
      expect(questionColorsLight).not.toContain('white')
      expect(answerColorsLight).toContain('deep-navy')
      expect(answerColorsLight).not.toContain('white')

      const whiteHex = BRAND_HEX_MAP.white
      for (const colorName of questionColorsLight) {
        const textHex = BRAND_HEX_MAP[colorName as keyof typeof BRAND_HEX_MAP]
        expect(textHex).toBeDefined()
        const ratio = getContrastRatio(textHex, whiteHex)
        expect(ratio).toBeGreaterThanOrEqual(4.5)
      }
    })
  })

  describe('Field constraints & permissions', () => {
    it('FaqItem has no free-form color, spacing, or custom CSS fields', () => {
      const fields = FaqItemBlock.fields as Record<string, any>
      expect(fields.questionColor.type).toBe('select')
      expect(fields.questionSize.type).toBe('select')
      expect(fields.answerColor.type).toBe('select')
      expect(fields.answerSize.type).toBe('select')

      expect(fields.colorPicker).toBeUndefined()
      expect(fields.customCss).toBeUndefined()
      expect(fields.padding).toBeUndefined()
      expect(fields.margin).toBeUndefined()
    })

    it('FaqItem is excluded from drawer categories and has permissions.insert = false', () => {
      expect(FaqItemBlock.permissions?.insert).toBe(false)

      const categories = puckConfig.categories as Record<string, { components?: string[] }>
      for (const [catName, cat] of Object.entries(categories)) {
        if (Array.isArray(cat.components)) {
          expect(cat.components, `Category ${catName} must not contain FaqItem`).not.toContain(
            'FaqItem',
          )
        }
      }
    })

    it('Columns.col1, col2, col3 disallow FaqItem and Step', () => {
      const columnsBlock = puckConfig.components.Columns as any
      expect(columnsBlock).toBeDefined()

      expect(columnsBlock.fields.col1.disallow).toContain('FaqItem')
      expect(columnsBlock.fields.col1.disallow).toContain('Step')
      expect(columnsBlock.fields.col2.disallow).toContain('FaqItem')
      expect(columnsBlock.fields.col2.disallow).toContain('Step')
      expect(columnsBlock.fields.col3.disallow).toContain('FaqItem')
      expect(columnsBlock.fields.col3.disallow).toContain('Step')
    })
  })

  describe('Server-side rendering and interactive behavior', () => {
    it('renders FAQ v4 with FaqItem blocks to static markup without error', () => {
      const html = renderToStaticMarkup(
        <FAQ
          titleLine1="CÂU HỎI"
          titleLine2="THƯỜNG GẶP"
          items={[
            {
              type: 'FaqItem',
              props: {
                id: 'ssr-faq-0',
                question: 'Trạm Dừng Cảm Xúc là gì?',
                answer: 'Trạm là không gian đồng hành nuôi dưỡng cảm xúc bền vững.',
              },
            },
          ]}
        />,
      )

      expect(html).toContain('CÂU HỎI')
      expect(html).toContain('THƯỜNG GẶP')
      expect(html).toContain('Trạm Dừng Cảm Xúc là gì?')
      expect(html).toContain('Trạm là không gian đồng hành nuôi dưỡng cảm xúc bền vững.')
    })

    it('renders with Puck <Render> on public page data containing FAQ v4', () => {
      const pageData = {
        root: { props: { title: 'Test FAQ Page' } },
        content: [
          {
            type: 'FAQ',
            props: {
              id: 'public-faq-v4',
              version: 4,
              titleLine1: 'GIẢI ĐÁP',
              titleLine2: 'BĂN KHOĂN',
              source: 'manual',
              items: [
                {
                  type: 'FaqItem',
                  props: {
                    id: 'public-faq-v4-faq-0',
                    question: 'Làm thế nào để đăng ký coaching 1:1?',
                    answer: 'Bạn có thể chọn gói Growth Mirror hoặc đặt phiên trải nghiệm 149k.',
                    questionColor: 'deep-navy',
                    questionSize: 'md',
                    answerColor: 'deep-navy',
                    answerSize: 'md',
                  },
                },
              ],
            },
          },
        ],
      }

      const html = renderToStaticMarkup(<Render config={puckConfig} data={pageData as any} />)
      expect(html).toContain('GIẢI ĐÁP')
      expect(html).toContain('BĂN KHOĂN')
      expect(html).toContain('Làm thế nào để đăng ký coaching 1:1?')
      expect(html).toContain('Bạn có thể chọn gói Growth Mirror hoặc đặt phiên trải nghiệm 149k.')
    })

    it('FaqItemView toggles answer display when clicked with proper accessibility attributes', () => {
      render(
        <FaqItemView
          question="Khóa học diễn ra bao lâu?"
          answer="Hành trình Habit Hack kéo dài 28 ngày rèn luyện."
        />,
      )

      const button = screen.getByRole('button', { name: /Khóa học diễn ra bao lâu/i })
      expect(button).toBeDefined()
      expect(button.getAttribute('aria-expanded')).toBe('false')

      // Answer region is hidden initially
      const answerElement = screen.getByText('Hành trình Habit Hack kéo dài 28 ngày rèn luyện.')
      expect(answerElement.hasAttribute('hidden')).toBe(true)

      // Click to toggle open
      fireEvent.click(button)
      expect(button.getAttribute('aria-expanded')).toBe('true')
      expect(answerElement.hasAttribute('hidden')).toBe(false)

      // Click again to close
      fireEvent.click(button)
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(answerElement.hasAttribute('hidden')).toBe(true)
    })
  })
})
