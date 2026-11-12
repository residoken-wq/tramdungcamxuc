import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestionButtons } from '@/components/site/QuestionButtons'
import {
  QuestionButtonsBlock,
  QUESTION_BUTTONS_BG_OPTIONS,
} from '@/puck/blocks/QuestionButtons'
import { CTASection } from '@/components/site/CTASection'
import { CTASectionBlock } from '@/puck/blocks/CTASection'
import { isDarkBrandBg } from '@/lib/brand/format-classes'

// WCAG relative luminance & contrast ratio calculation
const BRAND_HEX: Record<string, string> = {
  'deep-navy': '#280A60',
  'bright-magenta': '#BC039E',
  'accent-pink': '#EF3B83',
  'soft-pink': '#FDE6F6',
  'lavender-mist': '#E9DDF9',
  'mint-haze': '#D9F1EA',
  'butter-cream': '#F6E9B8',
  'warm-ivory': '#FAF7F4',
  white: '#FFFFFF',
}

function getLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255

  const [rl, gl, bl] = [r, g, b].map((val) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4),
  )
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

function getContrast(color1: string, color2: string): number {
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('BX-01: Builder Friendly & QuestionButtons', () => {
  describe('1. QuestionButtons Component', () => {
    it('renders 1, 2, and 3 buttons correctly (and ignores beyond 3)', () => {
      // 1 button
      const { container: c1 } = render(
        <QuestionButtons
          question="Một nút?"
          buttons={[{ text: 'Nút 1', url: '/link-1' }]}
        />,
      )
      expect(c1.querySelectorAll('a')).toHaveLength(1)
      expect(screen.getByText('Nút 1')).toBeDefined()

      // 2 buttons
      const { container: c2 } = render(
        <QuestionButtons
          question="Hai nút?"
          buttons={[
            { text: 'Nút 1', url: '/link-1' },
            { text: 'Nút 2', url: '/link-2' },
          ]}
        />,
      )
      expect(c2.querySelectorAll('a')).toHaveLength(2)

      // 3 buttons + 1 overflow button (max 3 allowed)
      const { container: c3 } = render(
        <QuestionButtons
          question="Ba nút?"
          buttons={[
            { text: 'Nút 1', url: '/link-1' },
            { text: 'Nút 2', url: '/link-2' },
            { text: 'Nút 3', url: '/link-3' },
            { text: 'Nút 4 thừa', url: '/link-4' },
          ]}
        />,
      )
      expect(c3.querySelectorAll('a')).toHaveLength(3)
      expect(c3.textContent).not.toContain('Nút 4 thừa')
    })

    it('hides question element completely when question is empty or whitespace', () => {
      const { container: cEmpty } = render(
        <QuestionButtons question="" buttons={[{ text: 'Nút', url: '/di' }]} />,
      )
      expect(cEmpty.querySelector('p')).toBeNull()

      const { container: cSpaces } = render(
        <QuestionButtons question="   " buttons={[{ text: 'Nút', url: '/di' }]} />,
      )
      expect(cSpaces.querySelector('p')).toBeNull()

      const { container: cValid } = render(
        <QuestionButtons question="Có câu hỏi ở đây" buttons={[{ text: 'Nút', url: '/di' }]} />,
      )
      expect(cValid.querySelector('p')).not.toBeNull()
      expect(cValid.querySelector('p')?.textContent).toBe('Có câu hỏi ở đây')
    })

    it('renders correct link target and resolves booking button', () => {
      const { container } = render(
        <QuestionButtons
          question="Chọn lối đi"
          buttons={[
            { text: 'Chẩn đoán', action: 'link', linkType: 'url', url: '/habit/chan-doan' },
            {
              text: 'Trang trong',
              action: 'link',
              linkType: 'page',
              pageId: '123',
            },
            {
              text: 'Đặt lịch trải nghiệm',
              action: 'booking',
            },
          ]}
          _resolved={{
            pageUrls: { '123': '/ve-tram' },
            bookingProductId: 99,
          }}
        />,
      )

      const links = container.querySelectorAll('a')
      expect(links[0].getAttribute('href')).toBe('/habit/chan-doan')
      expect(links[1].getAttribute('href')).toBe('/ve-tram')
      expect(links[2].getAttribute('href')).toContain('/dat-phien-trai-nghiem')
    })

    it('adapts text and button colors according to dark vs light background', () => {
      // Dark background: bright-magenta
      const { container: cDark } = render(
        <QuestionButtons
          question="Câu hỏi trên nền sen"
          bgColor="bright-magenta"
          buttons={[
            { text: 'Nút đặc', variant: 'solid', url: '/a' },
            { text: 'Nút viền', variant: 'outline', url: '/b' },
          ]}
        />,
      )
      const qDark = cDark.querySelector('p')
      expect(qDark?.className).toContain('text-white')
      const linksDark = cDark.querySelectorAll('a')
      expect(linksDark[0].className).toContain('!bg-deep-navy')
      expect(linksDark[0].className).toContain('!text-white')
      expect(linksDark[1].className).toContain('border-white')
      expect(linksDark[1].className).toContain('text-white')

      // Dark background: deep-navy
      const { container: cNavy } = render(
        <QuestionButtons
          question="Câu hỏi trên nền navy"
          bgColor="deep-navy"
          buttons={[
            { text: 'Nút đặc', variant: 'solid', url: '/a' },
            { text: 'Nút viền', variant: 'outline', url: '/b' },
          ]}
        />,
      )
      const qNavy = cNavy.querySelector('p')
      expect(qNavy?.className).toContain('text-white')
      const linksNavy = cNavy.querySelectorAll('a')
      expect(linksNavy[0].className).toContain('!bg-bright-magenta')
      expect(linksNavy[1].className).toContain('border-white')

      // Light background: soft-pink
      const { container: cLight } = render(
        <QuestionButtons
          question="Câu hỏi trên nền sáng"
          bgColor="soft-pink"
          buttons={[
            { text: 'Nút đặc', variant: 'solid', url: '/a' },
            { text: 'Nút viền', variant: 'outline', url: '/b' },
          ]}
        />,
      )
      const qLight = cLight.querySelector('p')
      expect(qLight?.className).toContain('text-deep-navy')
      const linksLight = cLight.querySelectorAll('a')
      expect(linksLight[0].className).toContain('!bg-bright-magenta')
      expect(linksLight[0].className).toContain('!text-white')
      expect(linksLight[1].className).toContain('border-deep-navy')
      expect(linksLight[1].className).toContain('text-deep-navy')
    })

    it('meets WCAG AA contrast ratio (>= 4.5:1) for all allowed bgColor options', () => {
      for (const opt of QUESTION_BUTTONS_BG_OPTIONS) {
        const bgToken = opt.value
        const bgHex = BRAND_HEX[bgToken]
        expect(bgHex, `Missing hex for ${bgToken}`).toBeDefined()

        const isDark = isDarkBrandBg(bgToken)
        const textToken = isDark ? 'white' : 'deep-navy'
        const textHex = BRAND_HEX[textToken]

        // Question text contrast
        const qContrast = getContrast(textHex, bgHex)
        expect(
          qContrast,
          `Question text (${textToken}) on background (${bgToken}) contrast ratio: ${qContrast.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5)

        // Button label contrast
        if (isDark) {
          // Outline button: white on dark bg
          const outlineContrast = getContrast(BRAND_HEX.white, bgHex)
          expect(
            outlineContrast,
            `Outline button text (white) on (${bgToken})`,
          ).toBeGreaterThanOrEqual(4.5)

          // Solid button: white text on deep-navy or bright-magenta
          const solidFillHex =
            bgToken === 'deep-navy' ? BRAND_HEX['bright-magenta'] : BRAND_HEX['deep-navy']
          const solidBtnContrast = getContrast(BRAND_HEX.white, solidFillHex)
          expect(solidBtnContrast).toBeGreaterThanOrEqual(4.5)
        } else {
          // Outline button: deep-navy on light bg
          const outlineContrast = getContrast(BRAND_HEX['deep-navy'], bgHex)
          expect(outlineContrast).toBeGreaterThanOrEqual(4.5)

          // Solid button: white on bright-magenta
          const solidBtnContrast = getContrast(BRAND_HEX.white, BRAND_HEX['bright-magenta'])
          expect(solidBtnContrast).toBeGreaterThanOrEqual(4.5)
        }
      }
    })

    it('QuestionButtonsBlock has defaultProps with [MẪU] prefix', () => {
      const defProps = QuestionButtonsBlock.defaultProps
      expect(defProps).toBeDefined()
      expect(defProps?.version).toBe(1)
      expect(defProps?.question).toMatch(/^\[MẪU\]/)
      expect(defProps?.bgColor).toBe('bright-magenta')
      expect(defProps?.buttons).toHaveLength(2)
      expect(defProps?.buttons?.[0].text).toMatch(/^\[MẪU\]/)
      expect(defProps?.buttons?.[0].url).toBe('/habit/chan-doan')
      expect(defProps?.buttons?.[1].text).toMatch(/^\[MẪU\]/)
      expect(defProps?.buttons?.[1].url).toBe('/eq-buddy')
    })
  })

  describe('2. CTASection resolveFields & Dark Background', () => {
    const allFields = { ...CTASectionBlock.fields }
    const baseParams = {
      fields: allFields,
      lastFields: allFields,
      lastData: null,
      changed: {},
      metadata: {},
      appState: {} as any,
      parent: null,
    }

    it('resolveFields hides proofText and testimonials when variant is solid', () => {
      const resolved = (CTASectionBlock as any).resolveFields(
        { props: { variant: 'solid' } },
        baseParams,
      )
      expect(resolved.proofText).toBeUndefined()
      expect(resolved.testimonials).toBeUndefined()

      const resolvedCard = (CTASectionBlock as any).resolveFields(
        { props: { variant: 'card' } },
        baseParams,
      )
      expect(resolvedCard.proofText).toBeDefined()
      expect(resolvedCard.testimonials).toBeDefined()
    })

    it('resolveFields shows only link fields when buttonAction is link', () => {
      // link with URL
      const resolvedUrl = (CTASectionBlock as any).resolveFields(
        { props: { buttonAction: 'link', buttonLinkType: 'url' } },
        baseParams,
      )
      expect(resolvedUrl.buttonLinkType).toBeDefined()
      expect(resolvedUrl.buttonLink).toBeDefined()
      expect(resolvedUrl.buttonPageId).toBeUndefined()
      expect(resolvedUrl.formType).toBeUndefined()
      expect(resolvedUrl.formTitle).toBeUndefined()
      expect(resolvedUrl.formSuccessMessage).toBeUndefined()

      // link with Page
      const resolvedPage = (CTASectionBlock as any).resolveFields(
        { props: { buttonAction: 'link', buttonLinkType: 'page' } },
        baseParams,
      )
      expect(resolvedPage.buttonLinkType).toBeDefined()
      expect(resolvedPage.buttonPageId).toBeDefined()
      expect(resolvedPage.buttonLink).toBeUndefined()
      expect(resolvedPage.formType).toBeUndefined()
    })

    it('resolveFields shows form fields and hides link fields when buttonAction is form', () => {
      const resolvedForm = (CTASectionBlock as any).resolveFields(
        { props: { buttonAction: 'form' } },
        baseParams,
      )
      expect(resolvedForm.formType).toBeDefined()
      expect(resolvedForm.formTitle).toBeDefined()
      expect(resolvedForm.formSuccessMessage).toBeDefined()
      expect(resolvedForm.buttonLinkType).toBeUndefined()
      expect(resolvedForm.buttonPageId).toBeUndefined()
      expect(resolvedForm.buttonLink).toBeUndefined()
    })

    it('resolveFields hides both link and form fields when buttonAction is booking', () => {
      const resolvedBooking = (CTASectionBlock as any).resolveFields(
        { props: { buttonAction: 'booking' } },
        baseParams,
      )
      expect(resolvedBooking.buttonLinkType).toBeUndefined()
      expect(resolvedBooking.buttonPageId).toBeUndefined()
      expect(resolvedBooking.buttonLink).toBeUndefined()
      expect(resolvedBooking.formType).toBeUndefined()
      expect(resolvedBooking.formTitle).toBeUndefined()
      expect(resolvedBooking.formSuccessMessage).toBeUndefined()
    })

    it('resolveFields hides all secondary button fields when secondaryButtonText is empty', () => {
      const resolvedEmptySec = (CTASectionBlock as any).resolveFields(
        { props: { secondaryButtonText: '' } },
        baseParams,
      )
      expect(resolvedEmptySec.secondaryButtonAction).toBeUndefined()
      expect(resolvedEmptySec.secondaryButtonLink).toBeUndefined()
      expect(resolvedEmptySec.secondaryButtonVariant).toBeUndefined()
      expect(resolvedEmptySec.secondaryFormType).toBeUndefined()
      expect(resolvedEmptySec.secondaryFormTitle).toBeUndefined()
      expect(resolvedEmptySec.secondaryFormSuccessMessage).toBeUndefined()

      const resolvedSecLink = (CTASectionBlock as any).resolveFields(
        { props: { secondaryButtonText: 'Đồng hành', secondaryButtonAction: 'link' } },
        baseParams,
      )
      expect(resolvedSecLink.secondaryButtonAction).toBeDefined()
      expect(resolvedSecLink.secondaryButtonLink).toBeDefined()
      expect(resolvedSecLink.secondaryButtonVariant).toBeDefined()
      expect(resolvedSecLink.secondaryFormType).toBeUndefined()

      const resolvedSecForm = (CTASectionBlock as any).resolveFields(
        { props: { secondaryButtonText: 'Tham gia', secondaryButtonAction: 'form' } },
        baseParams,
      )
      expect(resolvedSecForm.secondaryButtonAction).toBeDefined()
      expect(resolvedSecForm.secondaryFormType).toBeDefined()
      expect(resolvedSecForm.secondaryFormTitle).toBeDefined()
      expect(resolvedSecForm.secondaryFormSuccessMessage).toBeDefined()
      expect(resolvedSecForm.secondaryButtonLink).toBeUndefined()
    })

    it('CTASection solid renders light text when bgColor is bright-magenta', () => {
      const { container } = render(
        <CTASection
          variant="solid"
          bgColor="bright-magenta"
          seriesLabel="HÀNH TRÌNH"
          emotionLine="Lắng nghe chính mình"
          titleLine1="DÒNG 1"
          titleLine2="DÒNG 2"
          description="Đoạn mô tả ngắn"
          buttonText="Bấm ngay"
        />,
      )

      const seriesSpan = container.querySelector('span.tracking-widest')
      expect(seriesSpan?.className).toContain('text-soft-pink')

      const emotionP = container.querySelector('p.font-quote')
      expect(emotionP?.className).toContain('text-soft-pink')

      const titleSpans = container.querySelectorAll('h2 span')
      expect(titleSpans[0].className).toContain('text-white')
      expect(titleSpans[1].className).toContain('text-white')

      const descP = container.querySelector('p.leading-relaxed')
      expect(descP?.className).toContain('text-white/80')
    })

    it('CTASection does NOT render <h2> when both title lines are empty or whitespace', () => {
      // Solid variant
      const { container: cSolid } = render(
        <CTASection
          variant="solid"
          titleLine1=""
          titleLine2="   "
          emotionLine="Chỉ có câu cảm xúc"
          buttonText="Bấm"
        />,
      )
      expect(cSolid.querySelector('h2')).toBeNull()

      // Card variant
      const { container: cCard } = render(
        <CTASection
          variant="card"
          titleLine1=""
          titleLine2=""
          description="Chỉ có mô tả"
          buttonText="Bấm"
        />,
      )
      expect(cCard.querySelector('h2')).toBeNull()

      // With title line 1 present
      const { container: cWithTitle } = render(
        <CTASection
          variant="solid"
          titleLine1="TIÊU ĐỀ CÓ THẬT"
          titleLine2=""
          buttonText="Bấm"
        />,
      )
      expect(cWithTitle.querySelector('h2')).not.toBeNull()
    })

    it('CTASection preserves exact light background snapshot integrity', () => {
      const { container } = render(
        <CTASection
          titleLine1="TIÊU ĐỀ 1"
          titleLine2="TIÊU ĐỀ 2"
          seriesLabel="SERIES"
          emotionLine="Cảm xúc"
          description="Mô tả"
          buttonText="Bấm"
          bgColor="soft-pink"
        />,
      )
      // Light background: titleLine1 text-deep-navy, titleLine2 text-bright-magenta
      const titleSpans = container.querySelectorAll('h2 span')
      expect(titleSpans[0].className).toContain('text-deep-navy')
      expect(titleSpans[1].className).toContain('text-bright-magenta')
    })
  })
})

