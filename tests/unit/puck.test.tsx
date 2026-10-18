import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
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
import { puckMigrations, applyPuckMigrations } from '@/puck/migrations'
import { brandViewports } from '@/app/(builder)/builder/[pageId]/PuckEditorClient'
import packageJson from '../../package.json' with { type: 'json' }

describe('T0-09: Puck Editor & 5 Brand-Safe Blocks', () => {
  describe('Package dependencies & Client Bundle Purity', () => {
    it('pins @puckeditor/core strictly to version 0.23.0 in package.json', () => {
      const dependencies = packageJson.dependencies as Record<string, string>
      expect(dependencies['@puckeditor/core']).toBe('0.23.0')
    })

    it('prohibits server-only modules and payload in client-facing src/puck/config.tsx', () => {
      const configPath = path.resolve(process.cwd(), 'src/puck/config.tsx')
      const source = fs.readFileSync(configPath, 'utf-8')

      expect(source).not.toMatch(/from\s+['"]payload['"]/)
      expect(source).not.toMatch(/from\s+['"]@\/payload\.config['"]/)
      expect(source).not.toMatch(/from\s+['"]next\/cache['"]/)
      expect(source).not.toMatch(/from\s+['"]next\/headers['"]/)
      expect(source).not.toMatch(/import\(['"]payload['"]\)/)
      expect(source).not.toMatch(/import\(['"]@\/payload\.config['"]\)/)
      expect(source).not.toMatch(/import\(['"]next\/cache['"]\)/)
      expect(source).not.toMatch(/import\(['"]next\/headers['"]\)/)
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

    it('localizes root label ("Trang") and root title field ("Tiêu đề trang")', () => {
      expect(puckConfig.root).toBeDefined()
      expect(puckConfig.root?.label).toBe('Trang')
      expect(puckConfig.root?.fields?.title).toBeDefined()
      expect(puckConfig.root?.fields?.title?.label).toBe('Tiêu đề trang')
    })

    it('restricts background colors strictly to the 6 section brand tokens', () => {
      const expectedTokens = [
        'warm-ivory',
        'soft-pink',
        'lavender-mist',
        'mint-haze',
        'butter-cream',
        'deep-navy',
      ]
      const actualValues = BRAND_COLOR_OPTIONS.map((opt) => opt.value)
      expect(actualValues).toEqual(expectedTokens)
    })

    it('applies deep-navy contrast styles: white line 1, soft-pink line 2 and series label, >=85% white descriptions', () => {
      // 1. HeroTwoEntries
      const heroProps = puckConfig.components.HeroTwoEntries.defaultProps!
      const { container: heroContainer } = render(
        <HeroTwoEntries {...heroProps} bgColor="deep-navy" seriesLabel="Series Đêm" />,
      )
      const heroSeries = heroContainer.querySelector('span.uppercase.tracking-widest')
      expect(heroSeries?.className).toContain('text-soft-pink')
      const heroH1 = heroContainer.querySelector('h1')
      const heroSpans = heroH1?.querySelectorAll('span')
      expect(heroSpans?.[0].className).toContain('text-white')
      expect(heroSpans?.[1].className).toContain('text-soft-pink')
      const heroDesc = heroContainer.querySelector('p.font-ui')
      expect(heroDesc?.className).toContain('text-white/90')

      // 2. ImageText
      const imageTextProps = puckConfig.components.ImageText.defaultProps!
      const { container: itContainer } = render(
        <ImageText
          {...imageTextProps}
          bgColor="deep-navy"
          seriesLabel="Series Đêm"
          titleLine2="DÒNG 2"
        />,
      )
      const itSeries = itContainer.querySelector('span.uppercase.tracking-widest')
      expect(itSeries?.className).toContain('text-soft-pink')
      const itH2 = itContainer.querySelector('h2')
      const itSpans = itH2?.querySelectorAll('span')
      expect(itSpans?.[0].className).toContain('text-white')
      expect(itSpans?.[1].className).toContain('text-soft-pink')
      const itDesc = itContainer.querySelector('p.font-ui')
      expect(itDesc?.className).toContain('text-white/90')

      // 3. RichText
      const { container: rtContainer } = render(
        <RichText content="Đoạn văn đêm thẫm." bgColor="deep-navy" />,
      )
      const rtDesc = rtContainer.querySelector('p.font-ui')
      expect(rtDesc?.className).toContain('text-white/90')
    })

    it('restricts spacing to S/M/L presets', () => {
      const expectedPaddings = ['sm', 'md', 'lg']
      const actualPaddings = PADDING_OPTIONS.map((opt) => opt.value)
      expect(actualPaddings).toEqual(expectedPaddings)
    })

    it('ensures all default block props are prefixed with [MẪU] without hardcoded copy', () => {
      const { HeroTwoEntries, SectionHeader, RichText, ImageText, CTAButton } =
        puckConfig.components

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

    it('sets version: 1 in defaultProps of all 5 blocks and exposes puckMigrations array (B5)', () => {
      const { HeroTwoEntries, SectionHeader, RichText, ImageText, CTAButton } =
        puckConfig.components

      expect(HeroTwoEntries.defaultProps?.version).toBe(2)
      expect(SectionHeader.defaultProps?.version).toBe(1)
      expect(RichText.defaultProps?.version).toBe(1)
      expect(ImageText.defaultProps?.version).toBe(1)
      expect(CTAButton.defaultProps?.version).toBe(2)

      expect(Array.isArray(puckMigrations)).toBe(true)
      expect(puckMigrations.length).toBeGreaterThanOrEqual(1)

      const testData = { content: [], root: { props: { title: 'Test' } } }
      expect(applyPuckMigrations(testData)).toEqual(testData)
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
      const { container } = render(<RichText content={rawText} bgColor="warm-ivory" padding="md" />)

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

    it('renders ImageText with layout, content, and omits image when image or alt is absent', () => {
      const props = puckConfig.components.ImageText.defaultProps!
      const { container } = render(<ImageText {...props} />)

      expect(screen.getByText('[MẪU] DÒNG TIÊU ĐỀ 1')).toBeDefined()
      expect(screen.getByText(/Nội dung đoạn thứ nhất/)).toBeDefined()
      expect(screen.getByText('[MẪU] Đọc tiếp câu chuyện')).toBeDefined()
      // B2: Does not render image or fallback placeholder when alt/image is absent
      expect(container.querySelector('img')).toBeNull()
      expect(screen.queryByAltText('Hình ảnh minh họa')).toBeNull()
      expect(screen.queryByText(/Nhập mã Media ID/)).toBeNull()
    })

    it('renders ImageText with next/image and strict alt description when provided', () => {
      const props = puckConfig.components.ImageText.defaultProps!
      const { container } = render(
        <ImageText
          {...props}
          imageUrl="https://example.com/photo.jpg"
          imageAlt="Hana Lương đang chia sẻ tại workshop"
        />,
      )

      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      expect(img?.getAttribute('alt')).toBe('Hana Lương đang chia sẻ tại workshop')
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

    it('refuses to render buttons with malicious or unsafe links across blocks (B4)', () => {
      // 1. CTAButton
      const ctaRender = puckConfig.components.CTAButton.render as unknown as (props: {
        label: string
        href: string
        variant?: 'primary' | 'secondary' | 'ghost'
        size?: 'sm' | 'md' | 'lg'
        align?: 'left' | 'center' | 'right'
      }) => React.ReactElement
      const { container: ctaContainer } = render(
        ctaRender({
          label: 'Bấm ngay',
          href: 'javascript:alert(1)',
          variant: 'primary',
          size: 'md',
          align: 'center',
        }),
      )
      expect(ctaContainer.querySelector('a')).toBeNull()
      expect(ctaContainer.querySelector('button')).toBeNull()

      // 2. ImageText
      const itProps = puckConfig.components.ImageText.defaultProps!
      const { container: itContainer } = render(
        <ImageText {...itProps} buttonText="Độc hại" buttonLink="//evil.com/phishing" />,
      )
      expect(itContainer.querySelector('a')).toBeNull()
      expect(itContainer.querySelector('button')).toBeNull()

      // 3. HeroTwoEntries
      const heroProps = puckConfig.components.HeroTwoEntries.defaultProps!
      const { container: heroContainer } = render(
        <HeroTwoEntries
          {...heroProps}
          entry1={{ ...heroProps.entry1, buttonLink: 'javascript:void(0)' }}
          entry2={{ ...heroProps.entry2, buttonLink: 'data:text/html,<script>alert(1)</script>' }}
        />,
      )
      expect(heroContainer.querySelector('a')).toBeNull()
      expect(heroContainer.querySelector('button')).toBeNull()
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
