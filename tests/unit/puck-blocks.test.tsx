import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

import { puckConfig, type PageComponentsProps } from '@/puck/config'
import { parseVideoUrl, VideoEmbed } from '@/components/site/VideoEmbed'
import { Spacer } from '@/components/site/Spacer'
import { SPACER_HEIGHT_OPTIONS } from '@/puck/blocks/Spacer'

describe('T1-01: Puck Blocks – Mở đầu, Nội dung, Bố cục', () => {
  const allBlockKeys = Object.keys(puckConfig.components) as Array<keyof PageComponentsProps>

  describe('Snapshot rendering of all 14 blocks with defaultProps', () => {
    it.each(allBlockKeys)('renders %s matching static HTML snapshot', (blockKey) => {
      const blockConfig = puckConfig.components[blockKey]
      expect(blockConfig).toBeDefined()
      expect(blockConfig.defaultProps).toBeDefined()
      const v3Blocks = ['PackageComparison', 'HanaStory', 'FAQ', 'StatsBar', 'JourneySteps']
      const v2Blocks = [
        'SectionHeader',
        'CTAButton',
        'QuoteBlock',
        'HeroTwoEntries',
        'HeroImage',
        'TestimonialGrid',
        'ImageText',
        'LogoStrip',
        'IconCardGrid',
        'ServiceCards',
        'PackageCards',
      ]
      const expectedVersion = v3Blocks.includes(blockKey) ? 3 : v2Blocks.includes(blockKey) ? 2 : 1
      expect((blockConfig.defaultProps as { version?: number })?.version).toBe(expectedVersion)

      const markup = renderToStaticMarkup(
        blockConfig.render({
          ...blockConfig.defaultProps,
          puck: { isEditing: false, renderDropZone: () => null },
          editMode: false,
        } as never),
      )

      expect(markup).toMatchSnapshot()
    })
  })

  describe('Brand safety: No free-form text inputs for colors, fonts, or CSS', () => {
    it('verifies no field of type "text" has a name containing color, font, or css across all blocks', () => {
      const forbiddenPatterns = ['color', 'font', 'css']

      const inspectFields = (fields: Record<string, any>, blockName: string, parentPath = '') => {
        for (const [fieldName, fieldConfig] of Object.entries(fields)) {
          const currentPath = parentPath ? `${parentPath}.${fieldName}` : fieldName

          if (fieldConfig?.type === 'text') {
            const lowerName = fieldName.toLowerCase()
            for (const pattern of forbiddenPatterns) {
              expect(
                lowerName.includes(pattern),
                `Block "${blockName}" field "${currentPath}" is type "text" and contains "${pattern}". Colors, fonts, and CSS must use strictly preset options or be fixed in code.`,
              ).toBe(false)
            }
          }

          if (fieldConfig?.type === 'object' && fieldConfig.objectFields) {
            inspectFields(fieldConfig.objectFields, blockName, currentPath)
          }

          if (fieldConfig?.type === 'array' && fieldConfig.arrayFields) {
            inspectFields(fieldConfig.arrayFields, blockName, currentPath)
          }
        }
      }

      for (const [blockName, blockConfig] of Object.entries(puckConfig.components)) {
        if (blockConfig.fields) {
          inspectFields(blockConfig.fields, blockName)
        }
      }
    })
  })

  describe('Spacer: strictly restricted to 5 preset height levels', () => {
    it('only provides 16, 24, 32, 48, 64 in Spacer configuration options', () => {
      const allowedHeights = [16, 24, 32, 48, 64]
      const actualOptions = SPACER_HEIGHT_OPTIONS.map((opt) => opt.value)

      expect(actualOptions).toEqual(allowedHeights)
    })

    it('falls back to 32px height when passed an invalid height value', () => {
      const { container } = render(<Spacer height={999} />)
      const div = container.firstElementChild
      expect(div?.className).toContain('h-8')
    })

    it('renders correct height classes for valid heights', () => {
      const { container: c16 } = render(<Spacer height={16} />)
      expect(c16.firstElementChild?.className).toContain('h-4')

      const { container: c24 } = render(<Spacer height={24} />)
      expect(c24.firstElementChild?.className).toContain('h-6')

      const { container: c32 } = render(<Spacer height={32} />)
      expect(c32.firstElementChild?.className).toContain('h-8')

      const { container: c48 } = render(<Spacer height={48} />)
      expect(c48.firstElementChild?.className).toContain('h-12')

      const { container: c64 } = render(<Spacer height={64} />)
      expect(c64.firstElementChild?.className).toContain('h-16')
    })
  })

  describe('VideoEmbed: strictly rejects non-YouTube/Vimeo URLs and builds privacy embed URLs', () => {
    it('parses YouTube standard, short, and embed URLs correctly into youtube-nocookie', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      ]

      for (const url of urls) {
        const parsed = parseVideoUrl(url)
        expect(parsed.isValid).toBe(true)
        expect(parsed.provider).toBe('youtube')
        expect(parsed.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
      }
    })

    it('parses Vimeo standard and player URLs correctly into player.vimeo.com', () => {
      const urls = [
        'https://vimeo.com/76979871',
        'https://www.vimeo.com/76979871',
        'https://player.vimeo.com/video/76979871',
      ]

      for (const url of urls) {
        const parsed = parseVideoUrl(url)
        expect(parsed.isValid).toBe(true)
        expect(parsed.provider).toBe('vimeo')
        expect(parsed.embedUrl).toBe('https://player.vimeo.com/video/76979871')
      }
    })

    it('rejects untrusted or malicious URLs without rendering an iframe', () => {
      const invalidUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        '//evil.com/video',
        'https://facebook.com/video/123',
        'https://dailymotion.com/video/x123',
        'https://youtube.com.evil.com/watch?v=123',
        'https://not-youtube.com/watch?v=123',
        'not a url',
      ]

      for (const url of invalidUrls) {
        const parsed = parseVideoUrl(url)
        expect(parsed.isValid).toBe(false)
        expect(parsed.embedUrl).toBeNull()

        // Test component output when not in editor: nothing rendered
        const { container } = render(<VideoEmbed url={url} isEditing={false} />)
        expect(container.querySelector('iframe')).toBeNull()
      }
    })

    it('displays error message in editor when URL is invalid', () => {
      const { container } = render(<VideoEmbed url="https://invalid.com" isEditing={true} />)
      expect(container.querySelector('iframe')).toBeNull()
      expect(screen.getByText(/Liên kết video không hợp lệ/)).toBeDefined()
    })

    it('displays guide message in editor when URL is blank and renders nothing on public page', () => {
      const { container: editorContainer } = render(<VideoEmbed url="" isEditing={true} />)
      expect(editorContainer.querySelector('iframe')).toBeNull()
      expect(screen.getByText(/Chưa có liên kết video/)).toBeDefined()

      const { container: publicContainer } = render(<VideoEmbed url="" isEditing={false} />)
      expect(publicContainer.firstChild).toBeNull()
    })

    it('renders iframe with title, loading="lazy", and 16:9 aspect ratio when URL is valid', () => {
      const { container } = render(
        <VideoEmbed
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          title="Video thực hành cảm xúc"
        />,
      )
      const iframe = container.querySelector('iframe')
      expect(iframe).not.toBeNull()
      expect(iframe?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
      expect(iframe?.getAttribute('title')).toBe('Video thực hành cảm xúc')
      expect(iframe?.getAttribute('loading')).toBe('lazy')
      expect(container.querySelector('.aspect-video')).not.toBeNull()
    })
  })

  describe('Columns block: slot recursion prevention and responsive layout', () => {
    it('disallows Columns, HeroTwoEntries, and HeroImage from being dropped inside columns', () => {
      const columnsConfig = puckConfig.components.Columns
      const expectedDisallow = ['Columns', 'HeroTwoEntries', 'HeroImage']

      const col1Field = columnsConfig.fields?.col1 as { type: string; disallow?: string[] }
      const col2Field = columnsConfig.fields?.col2 as { type: string; disallow?: string[] }
      const col3Field = columnsConfig.fields?.col3 as { type: string; disallow?: string[] }

      expect(col1Field.type).toBe('slot')
      expect(col2Field.type).toBe('slot')
      expect(col3Field.type).toBe('slot')

      expect(col1Field.disallow).toEqual(expect.arrayContaining(expectedDisallow))
      expect(col2Field.disallow).toEqual(expect.arrayContaining(expectedDisallow))
      expect(col3Field.disallow).toEqual(expect.arrayContaining(expectedDisallow))
    })

    it('renders 2 columns or 3 columns with responsive vertical stacking on mobile', () => {
      const columnsConfig = puckConfig.components.Columns

      // 2 columns
      const { container: twoColsContainer } = render(
        columnsConfig.render({
          version: 1,
          numColumns: '2',
          col1: () => <div>Cột 1</div>,
          col2: () => <div>Cột 2</div>,
        } as never),
      )
      const twoColsGrid = twoColsContainer.querySelector('.grid')
      expect(twoColsGrid?.className).toContain('grid-cols-1')
      expect(twoColsGrid?.className).toContain('md:grid-cols-2')

      // 3 columns
      const { container: threeColsContainer } = render(
        columnsConfig.render({
          version: 1,
          numColumns: '3',
          col1: () => <div>Cột 1</div>,
          col2: () => <div>Cột 2</div>,
          col3: () => <div>Cột 3</div>,
        } as never),
      )
      const threeColsGrid = threeColsContainer.querySelector('.grid')
      expect(threeColsGrid?.className).toContain('grid-cols-1')
      expect(threeColsGrid?.className).toContain('md:grid-cols-3')
    })
  })

  describe('Sidebar categories per AGENTS.md 5B', () => {
    it('groups all blocks into Mở đầu, Nội dung, Bố cục, and Chuyển đổi with Vietnamese titles', () => {
      const { categories } = puckConfig
      expect(categories).toBeDefined()

      expect(categories?.intro?.title).toBe('Mở đầu')
      expect(categories?.intro?.components).toEqual([
        'HeroTwoEntries',
        'HeroImage',
        'SectionHeader',
      ])

      expect(categories?.content?.title).toBe('Nội dung')
      expect(categories?.content?.components).toEqual([
        'RichText',
        'ImageText',
        'QuoteBlock',
        'StatsBar',
        'IconCardGrid',
        'Callout',
        'JourneySteps',
        'VisionMission',
        'FAQ',
        'VideoEmbed',
        'ContactInfo',
      ])

      expect(categories?.layout?.title).toBe('Bố cục')
      expect(categories?.layout?.components).toEqual([
        'Columns',
        'Spacer',
        'Divider',
        'ResourcePostsSlot',
      ])

      expect(categories?.conversion?.title).toBe('Chuyển đổi')
      expect(categories?.conversion?.components).toEqual([
        'CTAButton',
        'CTASection',
        'TwoPathCards',
        'LeadForm',
        'BookingCTA',
        'B2BBriefForm',
        'QuizCTA',
        'ShopeeButton',
        'ZaloButton',
        'LibraryPreview',
        'LeadMagnetCarousel',
        'NewsletterForm',
        'ContactForms',
      ])
    })
  })
})
