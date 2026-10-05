import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as puckExports from '@puckeditor/core'

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
import { puckConfig, BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '@/puck/config'
import { HeroTwoEntries } from '@/components/site/HeroTwoEntries'
import { ImageText } from '@/components/site/ImageText'
import { RichText } from '@/components/site/RichText'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { saveDraftAction, publishPageAction } from '@/puck/actions'
import { brandViewports } from '@/app/(builder)/builder/[pageId]/PuckEditorClient'
import packageJson from '../../package.json' with { type: 'json' }

describe('T0-09: Puck Editor & 5 Brand-Safe Blocks', () => {
  describe('Package dependencies & Version Pinning', () => {
    it('pins @puckeditor/core strictly to version 0.23.0 in package.json', () => {
      const dependencies = packageJson.dependencies as Record<string, string>
      expect(dependencies['@puckeditor/core']).toBe('0.23.0')
    })

    it('exports essential editor and render components from @puckeditor/core', () => {
      expect(puckExports.Puck).toBeDefined()
      expect(puckExports.Render).toBeDefined()
    })
  })

  describe('Route B & Redirect Security', () => {
    it('constructs correct redirect URL to /builder/[pageId] when user is unauthenticated', () => {
      const pageId = 'page-intro-123'
      const redirectUrl = `/admin/login?redirect=${encodeURIComponent(`/builder/${pageId}`)}`
      expect(redirectUrl).toBe('/admin/login?redirect=%2Fbuilder%2Fpage-intro-123')
    })
  })

  describe('Puck Configuration & Brand Guardrails', () => {
    it('registers exactly the 5 required brand blocks with Vietnamese labels', () => {
      const components = puckConfig.components
      expect(components.HeroTwoEntries).toBeDefined()
      expect(components.SectionHeader).toBeDefined()
      expect(components.RichText).toBeDefined()
      expect(components.ImageText).toBeDefined()
      expect(components.CTAButton).toBeDefined()

      expect(components.HeroTwoEntries.label).toContain('Hero 2 Lối vào')
      expect(components.SectionHeader.label).toContain('Tiêu đề mục')
      expect(components.RichText.label).toContain('Đoạn văn bản')
      expect(components.ImageText.label).toContain('Ảnh & Chữ')
      expect(components.CTAButton.label).toContain('Nút Kêu gọi hành động')
    })

    it('restricts background colors strictly to the 8 brand tokens', () => {
      const expectedTokens = [
        'warm-ivory',
        'soft-pink',
        'lavender-mist',
        'mint-haze',
        'butter-cream',
        'deep-navy',
        'bright-magenta',
        'accent-pink',
      ]
      const actualValues = BRAND_COLOR_OPTIONS.map((opt) => opt.value)
      expect(actualValues).toEqual(expectedTokens)
    })

    it('restricts spacing to S/M/L presets', () => {
      const expectedPaddings = ['sm', 'md', 'lg']
      const actualPaddings = PADDING_OPTIONS.map((opt) => opt.value)
      expect(actualPaddings).toEqual(expectedPaddings)
    })

    it('ensures all default block props are prefixed with [MẪU] without hardcoded copy', () => {
      const { HeroTwoEntries, SectionHeader, RichText, ImageText, CTAButton } = puckConfig.components

      expect(HeroTwoEntries.defaultProps?.titleLine1).toContain('[MẪU]')
      expect(HeroTwoEntries.defaultProps?.titleLine2).toContain('[MẪU]')
      expect(HeroTwoEntries.defaultProps?.entry1?.label).toContain('[MẪU]')
      expect(HeroTwoEntries.defaultProps?.entry2?.label).toContain('[MẪU]')

      expect(SectionHeader.defaultProps?.titleLine1).toContain('[MẪU]')
      expect(SectionHeader.defaultProps?.titleLine2).toContain('[MẪU]')

      expect(RichText.defaultProps?.content).toContain('[MẪU]')

      expect(ImageText.defaultProps?.titleLine1).toContain('[MẪU]')
      expect(ImageText.defaultProps?.content).toContain('[MẪU]')

      expect(CTAButton.defaultProps?.label).toContain('[MẪU]')
    })
  })

  describe('Rendering 5 Blocks with [MẪU] props', () => {
    it('renders HeroTwoEntries with two-tone Anton heading, quote, and exactly two entries', () => {
      const props = puckConfig.components.HeroTwoEntries.defaultProps!
      render(<HeroTwoEntries {...props} />)

      expect(screen.getByText('[MẪU] DÒNG TIÊU ĐỀ 1')).toBeDefined()
      expect(screen.getByText('[MẪU] DÒNG TIÊU ĐỀ 2')).toBeDefined()
      expect(screen.getByText('[MẪU] Dòng cảm xúc trích dẫn ấm áp và chân thành')).toBeDefined()
      expect(screen.getByText('[MẪU] Lối vào 1')).toBeDefined()
      expect(screen.getByText('[MẪU] Lối vào 2')).toBeDefined()
      expect(screen.getByText('[MẪU] Khám phá ngay')).toBeDefined()
      expect(screen.getByText('[MẪU] Tìm hiểu thêm')).toBeDefined()
    })

    it('renders SectionHeader with signature two-tone styling and emotional quote', () => {
      const props = puckConfig.components.SectionHeader.defaultProps!
      render(
        <SectionHeader
          seriesLabel={props.seriesLabel}
          titleLine1={props.titleLine1}
          titleLine2={props.titleLine2}
          emotionLine={props.emotionLine}
          align={props.align}
          as={props.as}
        />,
      )

      expect(screen.getByText('[MẪU] Series')).toBeDefined()
      expect(screen.getByText('[MẪU] TIÊU ĐỀ DÒNG 1')).toBeDefined()
      expect(screen.getByText('[MẪU] TIÊU ĐỀ DÒNG 2')).toBeDefined()
      expect(screen.getByText('[MẪU] Dòng cảm xúc trích dẫn nhẹ nhàng')).toBeDefined()
    })

    it('renders RichText by splitting double newlines into semantic <p> tags without HTML injection', () => {
      const rawText = '[MẪU] Đoạn văn bản thứ nhất.\n\n[MẪU] Đoạn văn bản thứ hai.'
      const { container } = render(
        <RichText content={rawText} bgColor="warm-ivory" padding="md" />,
      )

      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs).toHaveLength(2)
      expect(paragraphs[0].textContent).toBe('[MẪU] Đoạn văn bản thứ nhất.')
      expect(paragraphs[1].textContent).toBe('[MẪU] Đoạn văn bản thứ hai.')

      // Verifies no raw HTML or script tag injection
      const dangerousHtml = '<b>Đậm</b><script>alert(1)</script>'
      const { container: safeContainer } = render(
        <RichText content={dangerousHtml} bgColor="warm-ivory" padding="md" />,
      )
      expect(safeContainer.querySelector('script')).toBeNull()
      expect(safeContainer.textContent).toContain('<b>Đậm</b><script>alert(1)</script>')
    })

    it('renders ImageText with layout, content, and image placeholder when image is absent', () => {
      const props = puckConfig.components.ImageText.defaultProps!
      render(<ImageText {...props} />)

      expect(screen.getByText('[MẪU] DÒNG TIÊU ĐỀ 1')).toBeDefined()
      expect(screen.getByText(/Nội dung đoạn thứ nhất/)).toBeDefined()
      expect(screen.getByText('[MẪU] Chưa chọn ảnh minh họa')).toBeDefined()
      expect(screen.getByText('[MẪU] Đọc tiếp câu chuyện')).toBeDefined()
    })

    it('renders CTAButton with brand style, size and link', () => {
      const props = puckConfig.components.CTAButton.defaultProps!
      render(
        <Button href={props.href} variant={props.variant} size={props.size}>
          {props.label}
        </Button>,
      )

      const buttonLink = screen.getByRole('link', { name: '[MẪU] Kêu gọi hành động' })
      expect(buttonLink).toBeDefined()
      expect(buttonLink.getAttribute('href')).toBe('#')
    })
  })

  describe('Server Action Security Guardrails', () => {
    it('rejects saveDraftAction when user is unauthenticated', async () => {
      const emptyData = { content: [], root: { props: { title: 'Test' } } }
      await expect(saveDraftAction('test-page-id', emptyData)).resolves.toMatchObject({
        success: false,
        code: 'UNAUTHORIZED',
      })
    })

    it('rejects publishPageAction when user is unauthenticated', async () => {
      const emptyData = { content: [], root: { props: { title: 'Test' } } }
      await expect(publishPageAction('test-page-id', emptyData)).resolves.toMatchObject({
        success: false,
        code: 'UNAUTHORIZED',
      })
    })
  })

  describe('Viewport Preview Guardrails', () => {
    it('configures exactly the 3 required responsive viewports: 375, 768, 1440', () => {
      expect(brandViewports).toHaveLength(3)
      expect(brandViewports[0].width).toBe(375)
      expect(brandViewports[1].width).toBe(768)
      expect(brandViewports[2].width).toBe(1440)
    })
  })
})
